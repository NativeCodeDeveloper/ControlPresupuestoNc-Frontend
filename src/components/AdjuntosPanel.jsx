'use client';
import { useEffect, useRef, useState } from 'react';
import { Paperclip, Upload, Trash2, Download, FileText, FileImage, File } from 'lucide-react';
import * as adjuntosService from '../services/adjuntosService';

const ICON_MAP = {
    'image/': FileImage,
    'application/pdf': FileText,
};

function FileIcon({ mimetype }) {
    const Icon = Object.entries(ICON_MAP).find(([k]) => mimetype?.startsWith(k))?.[1] ?? File;
    return <Icon size={14} className="shrink-0 text-zinc-400" />;
}

function fmtSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPT = [
    'image/*',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.csv', '.json', '.zip',
].join(',');

export default function AdjuntosPanel({ entidad, idEntidad, compact = false }) {
    const [adjuntos, setAdjuntos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!idEntidad) return;
        adjuntosService.getAdjuntos(entidad, idEntidad)
            .then(setAdjuntos)
            .catch(() => {});
    }, [entidad, idEntidad]);

    const handleFiles = async (files) => {
        setError(null);
        for (const file of files) {
            if (file.size > 20 * 1024 * 1024) {
                setError(`"${file.name}" supera el límite de 20 MB`);
                continue;
            }
            setUploading(true);
            try {
                const adj = await adjuntosService.uploadAdjunto(entidad, idEntidad, file);
                setAdjuntos(prev => [adj, ...prev]);
            } catch {
                setError(`Error al subir "${file.name}"`);
            } finally {
                setUploading(false);
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFiles([...e.dataTransfer.files]);
    };

    const handleDelete = async (adj) => {
        try {
            await adjuntosService.deleteAdjunto(adj.id_adjunto);
            setAdjuntos(prev => prev.filter(a => a.id_adjunto !== adj.id_adjunto));
        } catch {
            setError('Error al eliminar archivo');
        }
    };

    const handleDownload = async (adj) => {
        try { await adjuntosService.downloadAdjunto(adj); }
        catch { setError('Error al descargar archivo'); }
    };

    return (
        <div className="space-y-2">
            {!compact && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    <Paperclip size={12} />
                    Adjuntos
                </div>
            )}

            {/* Drop zone */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
                className="border border-dashed border-border rounded-lg p-3 flex items-center gap-2 cursor-pointer hover:border-violet-500/60 hover:bg-violet-500/5 transition-colors text-muted-foreground text-xs"
            >
                <Upload size={13} />
                <span>
                    {uploading ? 'Subiendo...' : 'Arrastra archivos o haz clic — PDF, Word, Excel, imágenes… (máx. 20 MB)'}
                </span>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => handleFiles([...e.target.files])}
                />
            </div>

            {error && (
                <p className="text-xs text-red-400">{error}</p>
            )}

            {/* Lista */}
            {adjuntos.length > 0 && (
                <ul className="space-y-1">
                    {adjuntos.map((adj) => (
                        <li key={adj.id_adjunto} className="flex items-center gap-2 group rounded-md px-2 py-1.5 hover:bg-zinc-800/60">
                            <FileIcon mimetype={adj.mimetype} />
                            <span className="flex-1 text-xs text-zinc-300 truncate">{adj.nombre_original}</span>
                            <span className="text-xs text-zinc-600 shrink-0">{fmtSize(adj.tamanio)}</span>
                            <button
                                onClick={() => handleDownload(adj)}
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-violet-400 transition-opacity"
                                title="Descargar"
                            >
                                <Download size={13} />
                            </button>
                            <button
                                onClick={() => handleDelete(adj)}
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition-opacity"
                                title="Eliminar"
                            >
                                <Trash2 size={13} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
