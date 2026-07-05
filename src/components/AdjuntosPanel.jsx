'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Paperclip, Upload, Trash2, Download, FileText, FileImage, File, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import * as adjuntosService from '../services/adjuntosService';

// ── Helpers ───────────────────────────────────────────────────────────────────

function FileIcon({ mimetype }) {
    if (mimetype?.startsWith('image/'))    return <FileImage size={13} className="shrink-0 text-sky-400" />;
    if (mimetype === 'application/pdf')    return <FileText  size={13} className="shrink-0 text-red-400" />;
    if (mimetype?.includes('sheet') || mimetype?.includes('excel'))
                                           return <FileText  size={13} className="shrink-0 text-emerald-400" />;
    if (mimetype?.includes('word'))        return <FileText  size={13} className="shrink-0 text-blue-400" />;
    return                                        <File      size={13} className="shrink-0 text-muted-foreground" />;
}

function fmtSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024)           return `${bytes} B`;
    if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: '2-digit' }) : '';
}

const ACCEPT = [
    'image/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.ppt', '.pptx', '.txt', '.csv', '.json', '.zip',
].join(',');

// ── Contenido del panel ───────────────────────────────────────────────────────

function PanelBody({ adjuntos, loading, uploading, dragging, inputRef, onFiles, onDrop, onDragOver, onDragLeave, onDelete, onDownload, error }) {
    return (
        <div className="space-y-2">
            {/* Drop zone */}
            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    'border border-dashed rounded-lg p-2.5 flex items-center gap-2 cursor-pointer transition-colors text-[11px]',
                    dragging
                        ? 'border-amber-500/60 bg-amber-500/8 text-amber-400'
                        : 'border-border/60 text-muted-foreground hover:border-amber-500/30 hover:text-amber-400'
                )}
            >
                {uploading
                    ? <><Loader2 size={12} className="animate-spin shrink-0" /><span>Subiendo…</span></>
                    : <><Upload size={12} className="shrink-0" /><span>Arrastra o clic — PDF, Word, Excel, imágenes (máx. 20 MB)</span></>
                }
                <input ref={inputRef} type="file" multiple accept={ACCEPT} className="hidden"
                    onChange={e => onFiles([...e.target.files])} />
            </div>

            {error && <p className="text-[11px] text-red-400">{error}</p>}

            {/* Lista */}
            {loading ? (
                <div className="flex items-center gap-1.5 py-1 text-[11px] text-muted-foreground">
                    <Loader2 size={11} className="animate-spin" /> Cargando…
                </div>
            ) : adjuntos.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/50 py-1">Sin archivos adjuntos</p>
            ) : (
                <ul className="divide-y divide-border/30">
                    {adjuntos.map(adj => (
                        <li key={adj.id_adjunto} className="flex items-center gap-2 py-1.5 group">
                            <FileIcon mimetype={adj.mimetype} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-foreground truncate">{adj.nombre_original}</p>
                                <p className="text-[10px] text-muted-foreground/60">
                                    {fmtSize(adj.tamanio)}{adj.creado_en ? ` · ${fmtDate(adj.creado_en)}` : ''}
                                </p>
                            </div>
                            <button onClick={() => onDownload(adj)}
                                className="shrink-0 p-0.5 text-muted-foreground hover:text-sky-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Descargar">
                                <Download size={12} />
                            </button>
                            <button onClick={() => onDelete(adj)}
                                className="shrink-0 p-0.5 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Eliminar">
                                <Trash2 size={12} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

/**
 * AdjuntosPanel — adjuntos reutilizable por entidad
 *
 * Props:
 *   entidad   — 'proyecto' | 'costo_fijo' | 'costo_variable'
 *   idEntidad — ID numérico del registro
 *   compact   — modo compacto con botón toggle (para tarjetas de gastos)
 *   label     — texto del botón en modo compact
 */
export default function AdjuntosPanel({ entidad, idEntidad, compact = false, label = 'Adjuntos' }) {
    const [adjuntos, setAdjuntos]   = useState([]);
    const [loading, setLoading]     = useState(false);
    const [uploading, setUploading] = useState(false);
    const [open, setOpen]           = useState(!compact);
    const [dragging, setDragging]   = useState(false);
    const [error, setError]         = useState(null);
    const inputRef                  = useRef(null);

    const load = useCallback(async () => {
        if (!idEntidad) return;
        setLoading(true);
        try {
            const data = await adjuntosService.getAdjuntos(entidad, idEntidad);
            setAdjuntos(Array.isArray(data) ? data : []);
        } catch { setAdjuntos([]); }
        finally { setLoading(false); }
    }, [entidad, idEntidad]);

    useEffect(() => { if (open) load(); }, [open, load]);

    const handleFiles = async (files) => {
        setError(null);
        setUploading(true);
        try {
            for (const file of files) {
                if (file.size > 20 * 1024 * 1024) {
                    setError(`"${file.name}" supera el límite de 20 MB`);
                    continue;
                }
                const adj = await adjuntosService.uploadAdjunto(entidad, idEntidad, file);
                setAdjuntos(prev => [adj, ...prev]);
            }
        } catch (e) { setError('Error al subir archivo'); }
        finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFiles([...e.dataTransfer.files]); };
    const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
    const handleDragLeave = () => setDragging(false);

    const handleDelete = async (adj) => {
        try {
            await adjuntosService.deleteAdjunto(adj.id_adjunto);
            setAdjuntos(prev => prev.filter(a => a.id_adjunto !== adj.id_adjunto));
        } catch { setError('Error al eliminar'); }
    };

    const handleDownload = async (adj) => {
        try { await adjuntosService.downloadAdjunto(adj); }
        catch { setError('Error al descargar'); }
    };

    const bodyProps = { adjuntos, loading, uploading, dragging, inputRef, error,
        onFiles: handleFiles, onDrop: handleDrop, onDragOver: handleDragOver,
        onDragLeave: handleDragLeave, onDelete: handleDelete, onDownload: handleDownload };

    // ── Modo compacto ─────────────────────────────────────────────────────────
    if (compact) {
        return (
            <div>
                <button
                    onClick={() => setOpen(o => !o)}
                    className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors',
                        open
                            ? 'border-amber-500/30 bg-amber-500/8 text-amber-400'
                            : 'border-border text-muted-foreground hover:border-amber-500/20 hover:text-amber-400'
                    )}
                >
                    <Paperclip size={11} />
                    {label}
                    {adjuntos.length > 0 && (
                        <span className="bg-amber-500/20 text-amber-400 rounded-full px-1.5 text-[10px] font-bold">
                            {adjuntos.length}
                        </span>
                    )}
                </button>

                {open && (
                    <div className="mt-2 border border-border/60 rounded-xl p-3 bg-card">
                        <PanelBody {...bodyProps} />
                    </div>
                )}
            </div>
        );
    }

    // ── Modo full ─────────────────────────────────────────────────────────────
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <Paperclip size={11} />
                Documentos
                {adjuntos.length > 0 && (
                    <span className="ml-1 text-amber-400 font-bold">{adjuntos.length}</span>
                )}
            </div>
            <PanelBody {...bodyProps} />
        </div>
    );
}
