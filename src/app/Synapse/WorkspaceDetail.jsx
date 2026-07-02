'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Check, ChevronDown, Calendar, User, Target,
    Bold, Italic, List, ListOrdered, Code, Heading2, Quote,
    Save, Loader2, Eye, EyeOff, Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import * as workspaceService from '../../services/workspaceService';

const ESTADO_CONFIG = {
    activa:     { label: 'Activa',     dot: 'bg-emerald-400' },
    pausada:    { label: 'Pausada',    dot: 'bg-amber-400'   },
    completada: { label: 'Completada', dot: 'bg-blue-400'    },
};

const PRIORIDAD_CONFIG = {
    sin_prioridad: { label: 'Sin prioridad' },
    urgente:       { label: 'Urgente'       },
    alta:          { label: 'Alta'          },
    media:         { label: 'Media'         },
    baja:          { label: 'Baja'          },
};

function renderMarkdown(text) {
    if (!text) return '';
    let html = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/^#{1}\s+(.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-2 text-foreground">$1</h1>')
        .replace(/^#{2}\s+(.+)$/gm, '<h2 class="text-xl font-semibold mt-5 mb-2 text-foreground">$1</h2>')
        .replace(/^#{3}\s+(.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1 text-foreground">$1</h3>')
        .replace(/^&gt;\s+(.+)$/gm, '<blockquote class="border-l-3 border-violet-500 pl-4 my-3 text-muted-foreground italic">$1</blockquote>')
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-foreground/5 border border-border rounded-lg p-4 my-3 overflow-x-auto text-[13px] font-mono"><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code class="bg-foreground/8 px-1.5 py-0.5 rounded text-[13px] font-mono text-violet-300">$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^[-*]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
        .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
        .replace(/(<li[\s\S]*?<\/li>)/gm, (match) => `<ul class="my-2 space-y-0.5">${match}</ul>`)
        .replace(/\n{2,}/g, '</p><p class="mb-3">')
        .replace(/\n/g, '<br>');
    return `<p class="mb-3">${html}</p>`;
}

function ToolbarBtn({ onClick, title, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-foreground/8 text-muted-foreground hover:text-foreground transition-colors"
        >
            {children}
        </button>
    );
}

function Dropdown({ label, options, value, onSelect, dotColor }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        if (!open) return;
        const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, [open]);
    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground border border-border/50 hover:border-border rounded-lg px-2.5 py-1.5 transition-colors"
            >
                {dotColor && <span className={cn("w-2 h-2 rounded-full", dotColor)} />}
                {label}
                <ChevronDown size={11} />
            </button>
            {open && (
                <div className="absolute top-8 left-0 z-30 bg-popover border border-border rounded-xl shadow-xl py-1 min-w-[140px]">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { onSelect(opt.value); setOpen(false); }}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-foreground/5 text-left transition-colors",
                                opt.value === value ? "text-foreground font-medium" : "text-muted-foreground"
                            )}
                        >
                            {opt.dot && <span className={cn("w-2 h-2 rounded-full", opt.dot)} />}
                            {opt.label}
                            {opt.value === value && <Check size={10} className="ml-auto" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function WorkspaceDetail({ id }) {
    const [data, setData]         = useState(null);
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [saved, setSaved]       = useState(false);
    const [preview, setPreview]   = useState(false);
    const [dirty, setDirty]       = useState(false);
    const textareaRef = useRef(null);
    const saveTimer   = useRef(null);
    const router      = useRouter();

    useEffect(() => {
        workspaceService.getIniciativa(id)
            .then(setData)
            .catch(() => router.push('/synapse/workspace'))
            .finally(() => setLoading(false));
    }, [id]);

    const patch = useCallback((fields) => {
        setData(prev => ({ ...prev, ...fields }));
        setDirty(true);
        setSaved(false);
    }, []);

    const save = useCallback(async (fields) => {
        if (!data) return;
        setSaving(true);
        try {
            await workspaceService.updateIniciativa(id, fields);
            setSaved(true);
            setDirty(false);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    }, [data, id]);

    // Auto-save contenido 1.5s después de dejar de escribir
    const handleContenido = (val) => {
        patch({ contenido: val });
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => save({ contenido: val }), 1500);
    };

    const handleBlurField = (field) => {
        if (data) save({ [field]: data[field] });
    };

    // Insert markdown helper
    const insertMd = (before, after = '') => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end   = el.selectionEnd;
        const selected = data?.contenido?.slice(start, end) || '';
        const newVal = (data?.contenido || '').slice(0, start) + before + selected + after + (data?.contenido || '').slice(end);
        handleContenido(newVal);
        setTimeout(() => {
            el.focus();
            el.setSelectionRange(start + before.length, start + before.length + selected.length);
        }, 0);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Cargando...</div>;
    }
    if (!data) return null;

    const estadoOpts    = Object.entries(ESTADO_CONFIG).map(([v, c])    => ({ value: v, label: c.label, dot: c.dot    }));
    const prioridadOpts = Object.entries(PRIORIDAD_CONFIG).map(([v, c]) => ({ value: v, label: c.label }));

    return (
        <div className="flex flex-col h-full min-h-0 bg-background">
            {/* Topbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
                <button
                    onClick={() => router.push('/synapse/workspace')}
                    className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={14} /> Workspace
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPreview(v => !v)}
                        className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground border border-border/50 hover:border-border rounded-lg px-2.5 py-1.5 transition-colors"
                        title={preview ? 'Editar' : 'Vista previa'}
                    >
                        {preview ? <EyeOff size={13} /> : <Eye size={13} />}
                        {preview ? 'Editar' : 'Vista previa'}
                    </button>
                    <button
                        onClick={() => save({ titulo: data.titulo, resumen: data.resumen, contenido: data.contenido, estado: data.estado, prioridad: data.prioridad, propietario: data.propietario, fecha_objetivo: data.fecha_objetivo })}
                        disabled={saving || !dirty}
                        className={cn(
                            "flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg transition-all",
                            saved
                                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                                : dirty
                                    ? "bg-violet-600 hover:bg-violet-500 text-white"
                                    : "bg-foreground/5 text-muted-foreground border border-border/50 cursor-default"
                        )}
                    >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
                        {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar'}
                    </button>
                </div>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-6 py-8">

                    {/* Avatar + Título */}
                    <div className="flex items-start gap-4 mb-6">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
                            style={{ background: data.color_hex || '#8B5CF6' }}
                        >
                            {data.titulo?.slice(0, 2).toUpperCase() || 'W'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <input
                                value={data.titulo || ''}
                                onChange={e => patch({ titulo: e.target.value })}
                                onBlur={() => handleBlurField('titulo')}
                                placeholder="Nombre de la iniciativa"
                                className="w-full text-2xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/40 text-foreground"
                            />
                            <input
                                value={data.resumen || ''}
                                onChange={e => patch({ resumen: e.target.value })}
                                onBlur={() => handleBlurField('resumen')}
                                placeholder="Agrega un resumen breve..."
                                className="w-full text-[14px] bg-transparent outline-none placeholder:text-muted-foreground/30 text-muted-foreground mt-1"
                            />
                        </div>
                    </div>

                    {/* Propiedades */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mb-8 pb-6 border-b border-border/30">
                        <span className="text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium w-full">Propiedades</span>

                        <Dropdown
                            label={ESTADO_CONFIG[data.estado]?.label || 'Activa'}
                            options={estadoOpts}
                            value={data.estado}
                            dotColor={ESTADO_CONFIG[data.estado]?.dot}
                            onSelect={v => { patch({ estado: v }); save({ estado: v }); }}
                        />

                        <Dropdown
                            label={PRIORIDAD_CONFIG[data.prioridad]?.label || 'Sin prioridad'}
                            options={prioridadOpts}
                            value={data.prioridad}
                            onSelect={v => { patch({ prioridad: v }); save({ prioridad: v }); }}
                        />

                        <div className="flex items-center gap-1.5 border border-border/50 hover:border-border rounded-lg px-2.5 py-1.5 transition-colors">
                            <User size={11} className="text-muted-foreground" />
                            <input
                                value={data.propietario || ''}
                                onChange={e => patch({ propietario: e.target.value })}
                                onBlur={() => handleBlurField('propietario')}
                                placeholder="Propietario"
                                className="text-[12px] bg-transparent outline-none text-muted-foreground placeholder:text-muted-foreground/40 w-24"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 border border-border/50 hover:border-border rounded-lg px-2.5 py-1.5 transition-colors">
                            <Calendar size={11} className="text-muted-foreground" />
                            <input
                                type="date"
                                value={data.fecha_objetivo || ''}
                                onChange={e => { patch({ fecha_objetivo: e.target.value }); save({ fecha_objetivo: e.target.value }); }}
                                className="text-[12px] bg-transparent outline-none text-muted-foreground w-28"
                            />
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="mb-2">
                        <p className="text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-3">Descripción</p>

                        {!preview && (
                            <div className="flex items-center gap-0.5 mb-2 p-1 bg-foreground/3 rounded-lg border border-border/30 w-fit">
                                <ToolbarBtn onClick={() => insertMd('## ')}          title="Encabezado"><Heading2 size={13} /></ToolbarBtn>
                                <ToolbarBtn onClick={() => insertMd('**', '**')}     title="Negrita"><Bold size={13} /></ToolbarBtn>
                                <ToolbarBtn onClick={() => insertMd('*', '*')}       title="Cursiva"><Italic size={13} /></ToolbarBtn>
                                <ToolbarBtn onClick={() => insertMd('`', '`')}       title="Código inline"><Code size={13} /></ToolbarBtn>
                                <div className="w-px h-4 bg-border/50 mx-0.5" />
                                <ToolbarBtn onClick={() => insertMd('- ')}           title="Lista"><List size={13} /></ToolbarBtn>
                                <ToolbarBtn onClick={() => insertMd('1. ')}          title="Lista numerada"><ListOrdered size={13} /></ToolbarBtn>
                                <ToolbarBtn onClick={() => insertMd('> ')}           title="Cita"><Quote size={13} /></ToolbarBtn>
                                <div className="w-px h-4 bg-border/50 mx-0.5" />
                                <ToolbarBtn onClick={() => insertMd('```\n', '\n```')} title="Bloque de código"><Code size={13} className="opacity-60" /></ToolbarBtn>
                            </div>
                        )}

                        {preview ? (
                            <div
                                className="prose prose-sm max-w-none text-[14px] leading-relaxed text-foreground"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(data.contenido) }}
                            />
                        ) : (
                            <textarea
                                ref={textareaRef}
                                value={data.contenido || ''}
                                onChange={e => handleContenido(e.target.value)}
                                placeholder={'Escribe la documentación aquí...\n\nSoporte markdown:\n## Título\n**negrita** *cursiva*\n- lista\n`código`\n```bloque de código```'}
                                className="w-full min-h-[400px] bg-transparent outline-none resize-none text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/30 font-mono"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
