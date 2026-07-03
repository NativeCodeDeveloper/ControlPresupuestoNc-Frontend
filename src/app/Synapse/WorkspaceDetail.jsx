'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Check, ChevronDown, Calendar, User,
    Save, Loader2, Eye, EyeOff, Paperclip
} from 'lucide-react';
import { cn } from '../../lib/utils';
import * as workspaceService from '../../services/workspaceService';
import dynamic from 'next/dynamic';
import AdjuntosPanel from '../../components/AdjuntosPanel';

const WorkspaceEditor = dynamic(() => import('./WorkspaceEditor'), { ssr: false, loading: () => (
    <div className="w-full min-h-[400px] rounded-lg border border-border/30 bg-foreground/2 animate-pulse" />
) });

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

// Highlight un bloque de código con highlight.js (carga dinámica para no aumentar bundle SSR)
let hljs = null;
async function getHljs() {
    if (hljs) return hljs;
    const mod = await import('highlight.js/lib/core');
    const h = mod.default;
    // Lenguajes más comunes
    const [js, ts, bash, sql, python, json, css, html, yaml, php, java, go, rust] = await Promise.all([
        import('highlight.js/lib/languages/javascript'),
        import('highlight.js/lib/languages/typescript'),
        import('highlight.js/lib/languages/bash'),
        import('highlight.js/lib/languages/sql'),
        import('highlight.js/lib/languages/python'),
        import('highlight.js/lib/languages/json'),
        import('highlight.js/lib/languages/css'),
        import('highlight.js/lib/languages/xml'),
        import('highlight.js/lib/languages/yaml'),
        import('highlight.js/lib/languages/php'),
        import('highlight.js/lib/languages/java'),
        import('highlight.js/lib/languages/go'),
        import('highlight.js/lib/languages/rust'),
    ]);
    h.registerLanguage('javascript', js.default);
    h.registerLanguage('js', js.default);
    h.registerLanguage('typescript', ts.default);
    h.registerLanguage('ts', ts.default);
    h.registerLanguage('bash', bash.default);
    h.registerLanguage('sh', bash.default);
    h.registerLanguage('shell', bash.default);
    h.registerLanguage('sql', sql.default);
    h.registerLanguage('python', python.default);
    h.registerLanguage('py', python.default);
    h.registerLanguage('json', json.default);
    h.registerLanguage('css', css.default);
    h.registerLanguage('html', html.default);
    h.registerLanguage('xml', html.default);
    h.registerLanguage('yaml', yaml.default);
    h.registerLanguage('yml', yaml.default);
    h.registerLanguage('php', php.default);
    h.registerLanguage('java', java.default);
    h.registerLanguage('go', go.default);
    h.registerLanguage('rust', rust.default);
    hljs = h;
    return h;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function renderMarkdown(text) {
    if (!text) return '';
    const h = await getHljs();

    // Extraer bloques de código primero para no procesarlos con el resto
    const codeBlocks = [];
    const withPlaceholders = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
        let highlighted;
        try {
            highlighted = lang && h.getLanguage(lang)
                ? h.highlight(code.trim(), { language: lang }).value
                : h.highlightAuto(code.trim()).value;
        } catch {
            highlighted = escapeHtml(code.trim());
        }
        const langLabel = lang ? `<span class="hljs-lang-label">${lang}</span>` : '';
        codeBlocks.push(
            `<div class="code-block-wrap">` +
            `${langLabel}` +
            `<pre class="hljs"><code>${highlighted}</code></pre>` +
            `</div>`
        );
        return `%%CODE_BLOCK_${codeBlocks.length - 1}%%`;
    });

    // Procesar el markdown restante
    let html = withPlaceholders
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/^# (.+)$/gm,  '<h1 class="md-h1">$1</h1>')
        .replace(/^## (.+)$/gm, '<h2 class="md-h2">$2</h2>'.replace('$2', '$1'))
        .replace(/^### (.+)$/gm,'<h3 class="md-h3">$1</h3>')
        .replace(/^&gt; (.+)$/gm,'<blockquote class="md-bq">$1</blockquote>')
        .replace(/`([^`\n]+)`/g, '<code class="md-inline-code">$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,     '<em>$1</em>')
        .replace(/^[-*] (.+)$/gm, '<li class="md-li-disc">$1</li>')
        .replace(/^\d+\. (.+)$/gm,'<li class="md-li-num">$1</li>')
        .split('\n')
        .map(line => {
            if (line.match(/^<(h[123]|blockquote|li)/)) return line;
            if (line.match(/^%%CODE_BLOCK/)) return line;
            if (line.trim() === '') return '<div class="md-spacer"></div>';
            return `<p class="md-p">${line}</p>`;
        })
        .join('\n');

    // Restaurar bloques de código
    html = html.replace(/%%CODE_BLOCK_(\d+)%%/g, (_, i) => codeBlocks[parseInt(i)]);

    return html;
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
    const [data, setData]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [saved, setSaved]         = useState(false);
    const [preview, setPreview]     = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [dirty, setDirty]         = useState(false);
    const saveTimer    = useRef(null);
    const adjuntosRef  = useRef(null);
    const router       = useRouter();

    const scrollToAdjuntos = () => {
        adjuntosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

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

    // Generar HTML del preview cuando se activa
    useEffect(() => {
        if (!preview) return;
        renderMarkdown(data?.contenido || '').then(setPreviewHtml);
    }, [preview, data?.contenido]);

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
                        onClick={scrollToAdjuntos}
                        className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground border border-border/50 hover:border-border rounded-lg px-2.5 py-1.5 transition-colors"
                        title="Ir a adjuntos"
                    >
                        <Paperclip size={13} />
                        Adjuntos
                    </button>
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
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium">Descripción</p>
                            {!preview && (
                                <p className="text-[10px] text-muted-foreground/30">
                                    Markdown · <code className="font-mono">## título</code> · <code className="font-mono">**negrita**</code> · <code className="font-mono">```js</code> código <code className="font-mono">```</code>
                                </p>
                            )}
                        </div>

                        {preview ? (
                            <div
                                className="md-preview"
                                dangerouslySetInnerHTML={{ __html: previewHtml }}
                            />
                        ) : (
                            <WorkspaceEditor
                                value={data.contenido || ''}
                                onChange={handleContenido}
                            />
                        )}
                    </div>

                    {/* Adjuntos */}
                    <div ref={adjuntosRef} className="mt-8 pt-6 border-t border-border/30">
                        <AdjuntosPanel entidad="iniciativa" idEntidad={data?.id_iniciativa} />
                    </div>
                </div>
            </div>
        </div>
    );
}
