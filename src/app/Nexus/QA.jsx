'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePersistedState } from '../../hooks/usePersistedState';
import {
    FlaskConical, Plus, RefreshCw, X, ChevronLeft,
    ChevronRight, Clock, User, LayoutGrid, List,
    Circle, MessageSquare, CheckCircle2, AlertTriangle,
    Send, Tag, Calendar, Target, Trash2
} from 'lucide-react';
import * as qaService from '../../services/qaService';
import { getPartners } from '../../services/partnersService';
import { getProjects } from '../../services/projectsService';

// ─── Constantes ───────────────────────────────────────────────────────────────

const ACTIVIDAD_ICON = {
    creacion:      <Circle size={10} className="text-sky-400 mt-0.5 shrink-0" />,
    comentario:    <MessageSquare size={10} className="text-slate-400 mt-0.5 shrink-0" />,
    cambio_estado: <ChevronRight size={10} className="text-amber-400 mt-0.5 shrink-0" />,
    actualizacion: <CheckCircle2 size={10} className="text-slate-400 mt-0.5 shrink-0" />,
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function fmt(date) {
    if (!date) return '—';
    const d = typeof date === 'string' && !date.includes('T')
        ? new Date(date.replace(' ', 'T') + 'Z')
        : new Date(date);
    if (isNaN(d)) return '—';
    return d.toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' });
}

function fmtDate(val) {
    if (!val) return '—';
    // mysql2 puede devolver Date object o string 'YYYY-MM-DD'
    const d = val instanceof Date ? val : new Date(typeof val === 'string' && !val.includes('T') ? val + 'T12:00:00' : val);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Santiago' });
}

function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderMarkdownSimple(text) {
    if (!text) return '';
    return text
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/^### (.+)$/gm, '<h3 class="text-[13px] font-semibold text-foreground mt-3 mb-1">$1</h3>')
        .replace(/^## (.+)$/gm,  '<h2 class="text-sm font-bold text-foreground mt-4 mb-1">$1</h2>')
        .replace(/^# (.+)$/gm,   '<h1 class="text-base font-bold text-foreground mt-4 mb-1">$1</h1>')
        .replace(/`([^`\n]+)`/g, '<code class="px-1 py-0.5 rounded bg-secondary/60 text-[11px] font-mono text-sky-300">$1</code>')
        .replace(/\*\*(.+?)\*\*/g,'<strong class="font-semibold text-foreground">$1</strong>')
        .replace(/\*(.+?)\*/g,    '<em class="italic text-muted-foreground">$1</em>')
        .replace(/^[-*] (.+)$/gm, '<li class="ml-3 list-disc text-[12px] text-foreground">$1</li>')
        .replace(/^\d+\. (.+)$/gm,'<li class="ml-3 list-decimal text-[12px] text-foreground">$1</li>')
        .split('\n')
        .map(line => {
            if (line.match(/^<(h[123]|li)/)) return line;
            if (line.trim() === '') return '<div class="h-1"></div>';
            return `<p class="text-[12px] text-foreground leading-relaxed">${line}</p>`;
        })
        .join('\n');
}

function MarkdownPreview({ content }) {
    return (
        <div
            className="prose-qa"
            dangerouslySetInnerHTML={{ __html: renderMarkdownSimple(content) }}
        />
    );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function PrioridadBadge({ nombre, color }) {
    if (!nombre) return null;
    const c = color || '#94a3b8';
    return (
        <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide"
              style={{ color: c, backgroundColor: `${c}20`, borderColor: `${c}4d` }}>
            {nombre}
        </span>
    );
}

function EstadoBadge({ nombre, color }) {
    return (
        <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold"
              style={{ color, backgroundColor: `${color}20`, borderColor: `${color}40` }}>
            {nombre}
        </span>
    );
}

function TipoBadge({ nombre, color }) {
    if (!nombre) return null;
    const c = color || '#94a3b8';
    return (
        <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
              style={{ color: c, backgroundColor: `${c}1a`, borderColor: `${c}33` }}>
            {nombre}
        </span>
    );
}

// ─── Modal nueva versión ──────────────────────────────────────────────────────

const CONTEXTO_OPTS = [
    {
        value: 'Actualizacion',
        label: 'Actualización',
        desc:  'Nueva versión de un producto existente',
        icon:  '↑',
        color: 'text-blue-400 border-blue-500/40 bg-blue-500/8',
        active:'border-blue-500 bg-blue-500/15 text-blue-300',
    },
    {
        value: 'Integracion',
        label: 'Integración',
        desc:  'Conexión entre módulos o servicios',
        icon:  '⇄',
        color: 'text-amber-400 border-amber-500/40 bg-amber-500/8',
        active:'border-amber-500 bg-amber-500/15 text-amber-300',
    },
    {
        value: 'Nuevo Producto',
        label: 'Nuevo producto',
        desc:  'Desarrollo de plataforma o producto desde cero',
        icon:  '✦',
        color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/8',
        active:'border-emerald-500 bg-emerald-500/15 text-emerald-300',
    },
];

const CONTEXTO_BADGE = {
    'Actualizacion':  'text-blue-400   bg-blue-500/10   border-blue-500/30',
    'Integracion':    'text-amber-400  bg-amber-500/10  border-amber-500/30',
    'Nuevo Producto': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

function VersionModal({ versionEstados, onClose, onCreated }) {
    const [form, setForm] = useState({
        nombre: '', tipo_contexto: 'Actualizacion', nombre_producto: '',
        descripcion: '', id_proyecto: '', version_tag: '',
        id_estado_version: versionEstados[0]?.id_estado_version ?? '',
        fecha_inicio: '', fecha_objetivo: ''
    });
    const [proyectos,  setProyectos]  = useState([]);
    const [saving,     setSaving]     = useState(false);
    const [error,      setError]      = useState('');
    const [creada,     setCreada]     = useState(null); // versión recién creada — muestra transición

    useEffect(() => {
        getProjects().then(p => setProyectos(Array.isArray(p) ? p : [])).catch(() => {});
    }, []);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.tipo_contexto !== 'Actualizacion' && !form.nombre_producto.trim()) {
            setError('Ingresa el nombre del producto o plataforma.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const payload = {
                ...form,
                id_proyecto:     form.tipo_contexto === 'Actualizacion' && form.id_proyecto ? Number(form.id_proyecto) : null,
                nombre_producto: form.tipo_contexto !== 'Actualizacion' ? form.nombre_producto.trim() : null,
                id_estado_version: Number(form.id_estado_version),
                fecha_inicio:    form.fecha_inicio   || null,
                fecha_objetivo:  form.fecha_objetivo || null,
            };
            const data = await qaService.createVersion(payload);
            // Muestra estado de éxito 1s antes de navegar
            setCreada(data.version);
            setTimeout(() => onCreated(data.version), 1000);
        } catch (err) {
            setError(err.message || 'Error al crear versión');
            setSaving(false);
        }
    };

    const inputCls = "w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500";

    // ── Estado de transición: versión creada exitosamente ─────────────────────
    if (creada) {
        const ctx = CONTEXTO_OPTS.find(o => o.value === (creada.tipo_contexto ?? 'Actualizacion')) ?? CONTEXTO_OPTS[0];
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center animate-pulse">
                        <FlaskConical size={24} className="text-violet-400" />
                    </div>
                    <div>
                        <p className="text-[11px] text-muted-foreground mb-1">Versión creada</p>
                        <p className="text-base font-bold text-foreground">{creada.nombre}</p>
                        {creada.version_tag && (
                            <code className="text-[11px] text-violet-400/80 font-mono">{creada.version_tag}</code>
                        )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full border font-medium ${CONTEXTO_BADGE[creada.tipo_contexto] ?? CONTEXTO_BADGE['Actualizacion']}`}>
                        {ctx.icon} {ctx.label}
                    </span>
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <RefreshCw size={12} className="animate-spin" />
                        Cargando casos…
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <FlaskConical size={15} className="text-violet-400" />
                        Nueva versión / release
                    </h3>
                    <button onClick={onClose}><X size={16} className="text-muted-foreground hover:text-foreground" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">

                    {/* Tipo de contexto */}
                    <div>
                        <label className="text-[11px] text-muted-foreground mb-2 block">Tipo de prueba *</label>
                        <div className="grid grid-cols-3 gap-2">
                            {CONTEXTO_OPTS.map(opt => (
                                <button key={opt.value} type="button"
                                        onClick={() => set('tipo_contexto', opt.value)}
                                        className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border text-center transition-all ${
                                            form.tipo_contexto === opt.value ? opt.active : 'border-border bg-card hover:border-violet-500/30'
                                        }`}>
                                    <span className={`text-base leading-none ${form.tipo_contexto === opt.value ? '' : opt.color.split(' ')[0]}`}>
                                        {opt.icon}
                                    </span>
                                    <span className="text-[11px] font-semibold text-foreground leading-tight">{opt.label}</span>
                                    <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Nombre del producto/plataforma — solo para Integración y Nuevo Producto */}
                    {form.tipo_contexto !== 'Actualizacion' && (
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">
                                {form.tipo_contexto === 'Nuevo Producto' ? 'Nombre del producto / plataforma *' : 'Sistemas involucrados *'}
                            </label>
                            <input required value={form.nombre_producto}
                                   onChange={e => set('nombre_producto', e.target.value)}
                                   placeholder={form.tipo_contexto === 'Nuevo Producto' ? 'ej: Portal Clínico v1' : 'ej: Finance ↔ Agenda Clínica'}
                                   className={inputCls} />
                        </div>
                    )}

                    <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Nombre *</label>
                        <input required value={form.nombre} onChange={e => set('nombre', e.target.value)}
                               placeholder="ej: NativeCode Finance v2.3" className={inputCls} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Tag de versión</label>
                            <input value={form.version_tag} onChange={e => set('version_tag', e.target.value)}
                                   placeholder="v2.3.0" className={inputCls} />
                        </div>
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Estado</label>
                            <select value={form.id_estado_version} onChange={e => set('id_estado_version', e.target.value)} className={inputCls}>
                                {versionEstados.map(ve =>
                                    <option key={ve.id_estado_version} value={ve.id_estado_version}>{ve.nombre}</option>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Proyecto asociado — solo para Actualización */}
                    {form.tipo_contexto === 'Actualizacion' && (
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Proyecto asociado</label>
                            <select value={form.id_proyecto} onChange={e => set('id_proyecto', e.target.value)} className={inputCls}>
                                <option value="">— Sin proyecto —</option>
                                {proyectos.map(p =>
                                    <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>
                                )}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Descripción</label>
                        <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                                  rows={3} placeholder="Qué incluye esta versión..." className={`${inputCls} resize-none`} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Fecha inicio</label>
                            <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Fecha objetivo</label>
                            <input type="date" value={form.fecha_objetivo} onChange={e => set('fecha_objetivo', e.target.value)} className={inputCls} />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                                className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                                className="px-4 py-2 text-sm rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-medium disabled:opacity-50 transition-colors">
                            {saving ? 'Creando...' : 'Crear versión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Modal nuevo caso ─────────────────────────────────────────────────────────

function CasoModal({ version, estados, socios, tipos, prioridades, onClose, onCreated }) {
    const [form, setForm] = useState({
        titulo: '',
        id_tipo: tipos[0]?.id_tipo ?? '',
        id_prioridad: prioridades[0]?.id_prioridad ?? '',
        id_estado: estados[0]?.id_estado ?? '',
        id_responsable: '',
        descripcion: '', pasos: '', resultado_esperado: '',
        resultado_actual: '', observaciones: ''
    });
    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState('');
    const [tabObs, setTabObs] = useState('editar'); // 'editar' | 'preview'

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const data = await qaService.createCaso({
                ...form,
                id_version:    version.id_version,
                id_estado:     Number(form.id_estado),
                id_tipo:       Number(form.id_tipo),
                id_prioridad:  Number(form.id_prioridad),
                id_responsable: form.id_responsable ? Number(form.id_responsable) : null,
            });
            onCreated(data.caso);
        } catch (err) {
            setError(err.message || 'Error al crear caso');
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500";
    const textareaCls = `${inputCls} resize-none font-mono text-[12px]`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
                    <div>
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Target size={15} className="text-violet-400" />
                            Nuevo caso de prueba
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{version.nombre}</p>
                    </div>
                    <button onClick={onClose}><X size={16} className="text-muted-foreground hover:text-foreground" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Título *</label>
                        <input required value={form.titulo} onChange={e => set('titulo', e.target.value)}
                               placeholder="Describe qué se está probando..." className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Tipo</label>
                            <select value={form.id_tipo} onChange={e => set('id_tipo', e.target.value)} className={inputCls}>
                                {tipos.map(t => <option key={t.id_tipo} value={t.id_tipo}>{t.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Prioridad</label>
                            <select value={form.id_prioridad} onChange={e => set('id_prioridad', e.target.value)} className={inputCls}>
                                {prioridades.map(p => <option key={p.id_prioridad} value={p.id_prioridad}>{p.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Estado inicial</label>
                            <select value={form.id_estado} onChange={e => set('id_estado', e.target.value)} className={inputCls}>
                                {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Responsable</label>
                            <select value={form.id_responsable} onChange={e => set('id_responsable', e.target.value)} className={inputCls}>
                                <option value="">Sin asignar</option>
                                {socios.map(s => <option key={s.id_socio} value={s.id_socio}>{s.nombre}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Descripción del caso</label>
                        <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                                  rows={2} placeholder="¿Qué funcionalidad o escenario se prueba?" className={textareaCls} />
                    </div>
                    <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Pasos para reproducir</label>
                        <textarea value={form.pasos} onChange={e => set('pasos', e.target.value)}
                                  rows={3} placeholder={"1. Ir a...\n2. Hacer click en...\n3. Verificar que..."} className={textareaCls} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Resultado esperado</label>
                            <textarea value={form.resultado_esperado} onChange={e => set('resultado_esperado', e.target.value)}
                                      rows={2} placeholder="Lo que debería ocurrir..." className={textareaCls} />
                        </div>
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Resultado actual</label>
                            <textarea value={form.resultado_actual} onChange={e => set('resultado_actual', e.target.value)}
                                      rows={2} placeholder="Lo que ocurrió realmente..." className={textareaCls} />
                        </div>
                    </div>
                    {/* Observaciones con markdown */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] text-muted-foreground">Observaciones <span className="text-violet-400">Markdown</span></label>
                            <div className="flex rounded-md border border-border overflow-hidden">
                                <button type="button" onClick={() => setTabObs('editar')}
                                        className={`px-2 py-0.5 text-[10px] transition-colors ${tabObs==='editar' ? 'bg-violet-500/15 text-violet-400' : 'text-muted-foreground hover:text-foreground'}`}>
                                    Editar
                                </button>
                                <button type="button" onClick={() => setTabObs('preview')}
                                        className={`px-2 py-0.5 text-[10px] transition-colors ${tabObs==='preview' ? 'bg-violet-500/15 text-violet-400' : 'text-muted-foreground hover:text-foreground'}`}>
                                    Preview
                                </button>
                            </div>
                        </div>
                        {tabObs === 'editar' ? (
                            <textarea value={form.observaciones} onChange={e => set('observaciones', e.target.value)}
                                      rows={4} placeholder={"# Nota\n**importante**: detalles adicionales, links, contexto..."}
                                      className={textareaCls} />
                        ) : (
                            <div className="min-h-[96px] bg-secondary/20 border border-border rounded-lg px-3 py-2">
                                {form.observaciones
                                    ? <MarkdownPreview content={form.observaciones} />
                                    : <p className="text-[11px] text-muted-foreground italic">Sin observaciones.</p>
                                }
                            </div>
                        )}
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                                className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                                className="px-4 py-2 text-sm rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-medium disabled:opacity-50 transition-colors">
                            {saving ? 'Creando...' : 'Crear caso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Panel de detalle del caso ────────────────────────────────────────────────

function CasoDetalle({ caso, estados, socios, onClose, onUpdated, onDeleted }) {
    const [actividad,   setActividad]   = useState([]);
    const [comentario,  setComentario]  = useState('');
    const [saving,      setSaving]      = useState(false);
    const [deleting,    setDeleting]    = useState(false);
    const [tabObs,      setTabObs]      = useState('preview'); // 'preview' | 'editar'
    const [obsEdit,     setObsEdit]     = useState(caso.observaciones ?? '');
    const [obsSaved,    setObsSaved]    = useState(false);

    useEffect(() => { setObsEdit(caso.observaciones ?? ''); }, [caso.observaciones]);

    const loadActividad = useCallback(async () => {
        try {
            const data = await qaService.getActividad(caso.id_caso);
            setActividad(Array.isArray(data) ? data : []);
        } catch {}
    }, [caso.id_caso]);

    useEffect(() => { loadActividad(); }, [loadActividad]);

    const handleEstado = async (id_estado) => {
        if (Number(id_estado) === Number(caso.id_estado)) return;
        setSaving(true);
        try {
            const { caso: updated } = await qaService.updateCaso(caso.id_caso, { id_estado: Number(id_estado) });
            onUpdated(updated);
            await loadActividad();
        } finally { setSaving(false); }
    };

    const handleResponsable = async (id_responsable) => {
        setSaving(true);
        try {
            const { caso: updated } = await qaService.updateCaso(caso.id_caso, {
                id_responsable: id_responsable ? Number(id_responsable) : null
            });
            onUpdated(updated);
        } finally { setSaving(false); }
    };

    const handleComentario = async () => {
        if (!comentario.trim()) return;
        setSaving(true);
        try {
            await qaService.addComentario(caso.id_caso, { contenido: comentario });
            setComentario('');
            await loadActividad();
        } finally { setSaving(false); }
    };

    const handleGuardarObs = async () => {
        setSaving(true);
        setObsSaved(false);
        try {
            const { caso: updated } = await qaService.updateCaso(caso.id_caso, { observaciones: obsEdit });
            onUpdated(updated);
            setObsSaved(true);
            setTabObs('preview');
            setTimeout(() => setObsSaved(false), 2500);
        } finally { setSaving(false); }
    };

    const handleEliminar = async () => {
        if (!window.confirm(`¿Eliminar el caso "${caso.numero_caso} — ${caso.titulo}"? Esta acción no se puede deshacer.`)) return;
        setDeleting(true);
        try {
            await qaService.deleteCaso(caso.id_caso);
            onDeleted(caso.id_caso);
        } catch (e) {
            console.error('[QA] Error eliminando caso', e);
            alert('No se pudo eliminar el caso. Intenta nuevamente.');
            setDeleting(false);
        }
    };

    const inputCls = "w-full bg-secondary/30 border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none";

    return (
        <div className="flex flex-col h-full bg-card border-l border-border w-full max-w-md">
            {/* Header */}
            <div className="flex items-start justify-between px-4 py-3 border-b border-border shrink-0">
                <div className="min-w-0">
                    <p className="text-[11px] text-violet-400 font-mono font-semibold">{caso.numero_caso}</p>
                    <p className="text-sm font-semibold text-foreground line-clamp-2">{caso.titulo}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{caso.version_nombre}</p>
                </div>
                <div className="shrink-0 ml-2 flex items-center gap-1">
                    <button onClick={handleEliminar} disabled={deleting}
                            title="Eliminar caso"
                            className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                        <Trash2 size={13} />
                    </button>
                    <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                        <X size={15} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                    <PrioridadBadge nombre={caso.prioridad_nombre} color={caso.prioridad_color} />
                    <TipoBadge nombre={caso.tipo_nombre} color={caso.tipo_color} />
                    {caso.estado_nombre && <EstadoBadge nombre={caso.estado_nombre} color={caso.estado_color} />}
                </div>

                {/* Controles estado/responsable */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-muted-foreground mb-1 block">Estado</label>
                        <select value={caso.id_estado} onChange={e => handleEstado(e.target.value)}
                                disabled={saving}
                                className="w-full bg-secondary/30 border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground focus:outline-none">
                            {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-muted-foreground mb-1 block">Responsable</label>
                        <select value={caso.id_responsable ?? ''} onChange={e => handleResponsable(e.target.value)}
                                disabled={saving}
                                className="w-full bg-secondary/30 border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground focus:outline-none">
                            <option value="">Sin asignar</option>
                            {socios.map(s => <option key={s.id_socio} value={s.id_socio}>{s.nombre}</option>)}
                        </select>
                    </div>
                </div>

                {/* Descripción + pasos */}
                {caso.descripcion && (
                    <div className="bg-secondary/20 rounded-2xl p-3">
                        <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Descripción</p>
                        <p className="text-[12px] text-foreground whitespace-pre-wrap">{caso.descripcion}</p>
                    </div>
                )}

                {caso.pasos && (
                    <div className="bg-secondary/20 rounded-2xl p-3">
                        <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Pasos</p>
                        <p className="text-[12px] text-foreground whitespace-pre-wrap">{caso.pasos}</p>
                    </div>
                )}

                {(caso.resultado_esperado || caso.resultado_actual) && (
                    <div className="grid grid-cols-1 gap-2">
                        {caso.resultado_esperado && (
                            <div className="bg-emerald-500/6 border border-emerald-500/20 rounded-2xl p-3">
                                <p className="text-[10px] text-emerald-400 mb-1 font-semibold uppercase tracking-wider">Resultado esperado</p>
                                <p className="text-[12px] text-foreground whitespace-pre-wrap">{caso.resultado_esperado}</p>
                            </div>
                        )}
                        {caso.resultado_actual && (
                            <div className="bg-amber-500/6 border border-amber-500/20 rounded-2xl p-3">
                                <p className="text-[10px] text-amber-400 mb-1 font-semibold uppercase tracking-wider">Resultado actual</p>
                                <p className="text-[12px] text-foreground whitespace-pre-wrap">{caso.resultado_actual}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Observaciones markdown */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Observaciones</p>
                        <div className="flex rounded-xl border border-border overflow-hidden">
                            <button onClick={() => setTabObs('preview')}
                                    className={`px-2 py-0.5 text-[10px] transition-colors ${tabObs==='preview' ? 'bg-violet-500/15 text-violet-400' : 'text-muted-foreground hover:text-foreground'}`}>
                                Preview
                            </button>
                            <button onClick={() => setTabObs('editar')}
                                    className={`px-2 py-0.5 text-[10px] transition-colors ${tabObs==='editar' ? 'bg-violet-500/15 text-violet-400' : 'text-muted-foreground hover:text-foreground'}`}>
                                Editar
                            </button>
                        </div>
                    </div>

                    {tabObs === 'preview' ? (
                        <div className="min-h-[60px] bg-secondary/20 border border-border rounded-2xl px-3 py-2">
                            {caso.observaciones
                                ? <MarkdownPreview content={caso.observaciones} />
                                : <p className="text-[11px] text-muted-foreground italic">Sin observaciones. Cambia a "Editar" para agregar.</p>
                            }
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <textarea
                                value={obsEdit}
                                onChange={e => setObsEdit(e.target.value)}
                                rows={5}
                                placeholder={"# Notas\n**importante**: contexto, links, evidencias..."}
                                className={`${inputCls} font-mono`}
                            />
                            <p className="text-[10px] text-muted-foreground">Soporta Markdown: **negrita**, *itálica*, # títulos, listas</p>
                            <button onClick={handleGuardarObs} disabled={saving}
                                    className={`w-full py-1.5 text-[12px] rounded-lg border transition-colors ${
                                        obsSaved
                                            ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                                            : 'bg-violet-500/15 border-violet-500/30 text-violet-400 hover:bg-violet-500/25'
                                    } disabled:opacity-50`}>
                                {obsSaved ? '✓ Guardado' : 'Guardar observaciones'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Actividad */}
                <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Actividad</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {actividad.length === 0 && (
                            <p className="text-[11px] text-muted-foreground text-center py-2">Sin actividad registrada.</p>
                        )}
                        {actividad.map(a => (
                            <div key={a.id_actividad} className="flex gap-2 text-[11px]">
                                {ACTIVIDAD_ICON[a.tipo] ?? <Circle size={10} className="mt-0.5 shrink-0 text-slate-500" />}
                                <div className="min-w-0 flex-1">
                                    <p className="text-foreground">{a.contenido}</p>
                                    <p className="text-muted-foreground mt-0.5">
                                        {fmt(a.creado_en)}{a.socio_nombre ? ` · ${a.socio_nombre}` : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                        <textarea
                            value={comentario}
                            onChange={e => setComentario(e.target.value)}
                            placeholder="Comentario interno..."
                            rows={2}
                            className={`flex-1 ${inputCls}`}
                        />
                        <button onClick={handleComentario} disabled={!comentario.trim() || saving}
                                className="px-3 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400 hover:bg-violet-500/25 disabled:opacity-40 transition-colors">
                            <Send size={13} />
                        </button>
                    </div>
                </div>

                <p className="text-[10px] text-muted-foreground/50 text-center">
                    Creado {fmt(caso.creado_en)}
                </p>
            </div>
        </div>
    );
}

// ─── Kanban de casos ──────────────────────────────────────────────────────────

function CasoKanbanCard({ caso, onSelect, isSelected }) {
    return (
        <div
            draggable
            onDragStart={e => {
                e.dataTransfer.setData('id_caso', String(caso.id_caso));
                e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={() => onSelect(caso)}
            className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all group ${
                isSelected
                    ? 'border-violet-500/60 bg-violet-500/8 shadow-md'
                    : 'bg-card border-border/60 hover:border-violet-500/40 hover:shadow-md hover:bg-secondary/20'
            }`}
        >
            <div className="flex items-center justify-between gap-2 mb-2">
                <TipoBadge nombre={caso.tipo_nombre} color={caso.tipo_color} />
                <span className="text-[10px] font-mono text-violet-400/70">{caso.numero_caso}</span>
            </div>
            <p className="text-[13px] font-medium text-foreground leading-snug mb-2 line-clamp-2">{caso.titulo}</p>
            <div className="flex items-center justify-between gap-2 mt-1">
                <PrioridadBadge nombre={caso.prioridad_nombre} color={caso.prioridad_color} />
                {caso.responsable_nombre && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <User size={9} /> {caso.responsable_nombre}
                    </span>
                )}
            </div>
        </div>
    );
}

function CasoKanbanView({ casos, estados, onSelect, selected, onMoveCaso }) {
    const [dragOver, setDragOver] = useState(null);
    return (
        <div className="flex gap-4 px-4 pt-4 pb-2 h-full overflow-x-auto">
            {estados.map(estado => {
                const cols  = casos.filter(c => c.id_estado === estado.id_estado);
                const isOver = dragOver === estado.id_estado;
                return (
                    <div
                        key={estado.id_estado}
                        onDragOver={e => { e.preventDefault(); setDragOver(estado.id_estado); }}
                        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null); }}
                        onDrop={e => {
                            e.preventDefault();
                            const id = parseInt(e.dataTransfer.getData('id_caso'), 10);
                            if (id) onMoveCaso(id, estado.id_estado);
                            setDragOver(null);
                        }}
                        className={`flex-none w-[260px] flex flex-col rounded-xl transition-colors ${isOver ? 'bg-violet-500/6 ring-1 ring-inset ring-violet-500/30' : ''}`}
                    >
                        <div className="flex items-center gap-2 mb-3 px-1 shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: estado.color_hex }} />
                            <span className="text-[12px] font-semibold text-foreground flex-1 truncate">{estado.nombre}</span>
                            <span className="text-[11px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-md">{cols.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[64px] pr-0.5">
                            {cols.map(caso => (
                                <CasoKanbanCard key={caso.id_caso} caso={caso} onSelect={onSelect}
                                               isSelected={selected?.id_caso === caso.id_caso} />
                            ))}
                            {cols.length === 0 && (
                                <div className={`border-2 border-dashed rounded-xl h-16 flex items-center justify-center transition-colors ${isOver ? 'border-violet-500/40' : 'border-border/25'}`}>
                                    <span className="text-[11px] text-muted-foreground/50">Sin casos</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function CasoListView({ casos, estados, onSelect, selected }) {
    const grupos = estados
        .map(e => ({ estado: e, items: casos.filter(c => c.id_estado === e.id_estado) }))
        .filter(g => g.items.length > 0);

    if (!casos.length) {
        return (
            <div className="text-center py-16 text-muted-foreground text-sm">
                No hay casos de prueba registrados.
            </div>
        );
    }

    return (
        <div className="space-y-5 p-4">
            {grupos.map(({ estado, items }) => (
                <div key={estado.id_estado}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: estado.color_hex }} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{estado.nombre}</span>
                        <span className="text-[10px] text-muted-foreground/50 ml-1">{items.length}</span>
                    </div>
                    <div className="space-y-1">
                        {items.map(c => {
                            const isSelected = selected?.id_caso === c.id_caso;
                            return (
                                <div key={c.id_caso} onClick={() => onSelect(c)}
                                     className={`flex items-center gap-3 border rounded-xl px-4 py-2.5 cursor-pointer transition-all ${
                                         isSelected ? 'border-violet-500/50 bg-violet-500/8' : 'bg-card border-border/40 hover:border-violet-500/30 hover:bg-secondary/20'
                                     }`}>
                                    <span className="text-[10px] font-mono text-violet-400 shrink-0 w-24">{c.numero_caso}</span>
                                    <TipoBadge nombre={c.tipo_nombre} color={c.tipo_color} />
                                    <span className="flex-1 text-sm font-medium text-foreground truncate">{c.titulo}</span>
                                    <PrioridadBadge nombre={c.prioridad_nombre} color={c.prioridad_color} />
                                    {c.responsable_nombre && (
                                        <span className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                                            <User size={10} /> {c.responsable_nombre}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Vista de versiones ───────────────────────────────────────────────────────

function VersionCard({ version, estados, onClick, onDelete }) {
    const total    = version.total_casos ?? 0;
    const aprobados = version.casos_aprobados ?? 0;
    const rechazados = version.casos_rechazados ?? 0;
    const progreso  = total > 0 ? Math.round((aprobados / total) * 100) : 0;
    const estadoColor = version.estado_color || '#6b7280';

    const distribucion = (version.casos_por_estado ?? [])
        .map(d => ({ ...d, estado: (estados ?? []).find(e => e.id_estado === d.id_estado) }))
        .filter(d => d.estado && d.cantidad > 0)
        .sort((a, b) => (a.estado.orden ?? 0) - (b.estado.orden ?? 0));

    return (
        <div onClick={onClick}
             draggable
             onDragStart={e => {
                 e.dataTransfer.setData('id_version', String(version.id_version));
                 e.dataTransfer.effectAllowed = 'move';
             }}
             className="relative overflow-hidden bg-card border border-border/60 rounded-2xl pl-6 pr-5 py-5 cursor-grab active:cursor-grabbing hover:border-violet-500/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
            {/* Acento de color según la columna del tablero */}
            <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: estadoColor }} />

            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                        <div className="h-6 w-6 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
                            <FlaskConical size={12} className="text-violet-400" />
                        </div>
                        <h3 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 pt-0.5 group-hover:text-violet-400 transition-colors" title={version.nombre}>
                            {version.nombre}
                        </h3>
                    </div>
                    {version.version_tag && (
                        <code className="text-[11px] text-muted-foreground font-mono ml-8">{version.version_tag}</code>
                    )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap"
                          style={{ color: estadoColor, backgroundColor: `${estadoColor}1a`, borderColor: `${estadoColor}40` }}>
                        {version.estado_nombre}
                    </span>
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(version); }}
                        title="Eliminar versión"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {version.descripcion && (
                <p className="text-[12px] text-muted-foreground mb-3 line-clamp-2 ml-8">{version.descripcion}</p>
            )}

            {/* Distribución por columna del tablero */}
            <div className="mb-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>{aprobados} / {total} terminados</span>
                    <span>{progreso}%</span>
                </div>
                <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-secondary/60">
                    {distribucion.map(d => (
                        <div key={d.id_estado}
                             title={`${d.estado.nombre}: ${d.cantidad}`}
                             style={{ width: `${(d.cantidad / total) * 100}%`, background: d.estado.color_hex }} />
                    ))}
                </div>
                {distribucion.length > 0 && (
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-1.5">
                        {distribucion.map(d => (
                            <span key={d.id_estado} className="flex items-center gap-1 text-[9.5px] text-muted-foreground">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.estado.color_hex }} />
                                {d.estado.nombre} {d.cantidad}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Contexto — producto/proyecto */}
            {(version.nombre_producto || version.proyecto_nombre) && (
                <div className="mb-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${CONTEXTO_BADGE[version.tipo_contexto] ?? CONTEXTO_BADGE['Actualizacion']}`}>
                        <Tag size={8} />
                        {version.nombre_producto || version.proyecto_nombre}
                    </span>
                </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Target size={9} /> {total} casos</span>
                    {rechazados > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                            <AlertTriangle size={9} /> {rechazados} rechazados
                        </span>
                    )}
                    {version.tipo_contexto && version.tipo_contexto !== 'Actualizacion' && (
                        <span className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-semibold ${CONTEXTO_BADGE[version.tipo_contexto]}`}>
                            {version.tipo_contexto}
                        </span>
                    )}
                </div>
                {version.fecha_objetivo && (
                    <span className="flex items-center gap-1">
                        <Calendar size={9} /> {fmtDate(version.fecha_objetivo)}
                    </span>
                )}
            </div>
        </div>
    );
}

function VersionKanbanBoard({ versiones, versionEstados, estados, onSelect, onDelete, onMoveVersion }) {
    const [dragOver, setDragOver] = useState(null);
    return (
        <div className="flex gap-4 h-full overflow-x-auto">
            {versionEstados.map(ve => {
                const cols   = versiones.filter(v => v.id_estado_version === ve.id_estado_version);
                const isOver = dragOver === ve.id_estado_version;
                return (
                    <div
                        key={ve.id_estado_version}
                        onDragOver={e => { e.preventDefault(); setDragOver(ve.id_estado_version); }}
                        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null); }}
                        onDrop={e => {
                            e.preventDefault();
                            const id = parseInt(e.dataTransfer.getData('id_version'), 10);
                            if (id) onMoveVersion(id, ve.id_estado_version);
                            setDragOver(null);
                        }}
                        className={`flex-none w-[300px] flex flex-col rounded-xl transition-colors ${isOver ? 'bg-violet-500/6 ring-1 ring-inset ring-violet-500/30' : ''}`}
                    >
                        <div className="flex items-center gap-2 mb-3 px-1 shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ve.color_hex }} />
                            <span className="text-[12px] font-semibold text-foreground flex-1 truncate">{ve.nombre}</span>
                            <span className="text-[11px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-md">{cols.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 min-h-[80px] pr-0.5">
                            {cols.map(v => (
                                <VersionCard key={v.id_version} version={v} estados={estados}
                                            onClick={() => onSelect(v)} onDelete={onDelete} />
                            ))}
                            {cols.length === 0 && (
                                <div className={`border-2 border-dashed rounded-xl h-16 flex items-center justify-center transition-colors ${isOver ? 'border-violet-500/40' : 'border-border/25'}`}>
                                    <span className="text-[11px] text-muted-foreground/50">Sin versiones</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const QA_CACHE_KEY = 'ncf:qa:v1';
function cacheLoad() {
    try { return JSON.parse(localStorage.getItem(QA_CACHE_KEY) || 'null'); } catch { return null; }
}
function cacheSave(data) {
    try { localStorage.setItem(QA_CACHE_KEY, JSON.stringify(data)); } catch {}
}
function casosCacheLoad(id_version) {
    try { return JSON.parse(localStorage.getItem(`ncf:qa:casos:${id_version}`) || 'null'); } catch { return null; }
}
function casosCacheSave(id_version, data) {
    try { localStorage.setItem(`ncf:qa:casos:${id_version}`, JSON.stringify(data)); } catch {}
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function QA() {
    const [versiones,   setVersiones]   = useState([]);
    const [estados,     setEstados]     = useState([]);
    const [versionEstados, setVersionEstados] = useState([]);
    const [tipos,       setTipos]       = useState([]);
    const [prioridades, setPrioridades] = useState([]);
    const [socios,      setSocios]      = useState([]);
    const [loading,     setLoading]     = useState(true);

    // Persiste la versión activa entre recargas
    const [savedVersionId, setSavedVersionId] = usePersistedState('nexus:qa:versionActiva', null);
    const savedVersionIdRef = useRef(savedVersionId);
    useEffect(() => { savedVersionIdRef.current = savedVersionId; }, [savedVersionId]);

    // Vista versiones
    const [showVersionModal, setShowVersionModal] = useState(false);

    // Filtros lista de versiones
    const [busquedaVersion,       setBusquedaVersion]       = usePersistedState('nexus:qa:busquedaVersion', '');
    const [filtroVersionEstado,   setFiltroVersionEstado]   = usePersistedState('nexus:qa:filtroVersionEstado', '');
    const [filtroVersionContexto, setFiltroVersionContexto] = usePersistedState('nexus:qa:filtroVersionContexto', '');

    // Vista detalle de version (kanban de casos)
    const [versionActiva,  setVersionActiva]  = useState(null);
    const [casos,          setCasos]          = useState([]);
    const [loadingCasos,   setLoadingCasos]   = useState(false);
    const [selected,       setSelected]       = useState(null);
    const [showCasoModal,  setShowCasoModal]  = useState(false);
    const [view,           setView]           = usePersistedState('nexus:qa:view', 'cards');

    // Filtros casos
    const [filtroEstado,    setFiltroEstado]    = usePersistedState('nexus:qa:filtroEstado', '');
    const [filtroPrioridad, setFiltroPrioridad] = usePersistedState('nexus:qa:filtroPrioridad', '');
    const [filtroTipo,      setFiltroTipo]      = usePersistedState('nexus:qa:filtroTipo', '');
    const [busqueda,        setBusqueda]        = usePersistedState('nexus:qa:busqueda', '');

    const versionActivaRef = useRef(null);
    useEffect(() => { versionActivaRef.current = versionActiva; }, [versionActiva]);

    // ── Casos — stale-while-revalidate ────────────────────────────────────────

    const loadCasos = useCallback(async (id_version, silent = false) => {
        if (!silent) {
            const cached = casosCacheLoad(id_version);
            if (cached) {
                setCasos(cached);
                setLoadingCasos(false); // datos visibles instantáneamente
            } else {
                setLoadingCasos(true);
            }
        }
        try {
            const data  = await qaService.getCasos(id_version);
            const casos = Array.isArray(data) ? data : [];
            setCasos(casos);
            casosCacheSave(id_version, casos);
            setSelected(prev => {
                if (!prev) return null;
                return casos.find(c => c.id_caso === prev.id_caso) ?? prev;
            });
        } finally {
            setLoadingCasos(false);
        }
    }, []);

    // ── Carga principal — stale-while-revalidate ──────────────────────────────

    const load = useCallback(async (silent = false) => {
        if (!silent) {
            const cached = cacheLoad();
            if (cached) {
                setVersiones(cached.versiones ?? []);
                setEstados(cached.estados ?? []);
                setVersionEstados(cached.versionEstados ?? []);
                setTipos(cached.tipos ?? []);
                setPrioridades(cached.prioridades ?? []);
                setSocios(cached.socios ?? []);
                setLoading(false);
            } else {
                setLoading(true);
            }
        }
        try {
            const [v, e, ve, t, p, s] = await Promise.all([
                qaService.getVersiones(),
                qaService.getEstados(),
                qaService.getVersionEstados(),
                qaService.getTipos(),
                qaService.getPrioridades(),
                getPartners().catch(() => []),
            ]);
            const versiones      = Array.isArray(v)  ? v  : [];
            const estados        = Array.isArray(e)  ? e  : [];
            const versionEstados = Array.isArray(ve) ? ve : [];
            const tipos          = Array.isArray(t)  ? t  : [];
            const prioridades    = Array.isArray(p)  ? p  : [];
            const socios         = Array.isArray(s)  ? s  : [];
            setVersiones(versiones);
            setEstados(estados);
            setVersionEstados(versionEstados);
            setTipos(tipos);
            setPrioridades(prioridades);
            setSocios(socios);
            cacheSave({ versiones, estados, versionEstados, tipos, prioridades, socios });

            const va      = versionActivaRef.current;
            const savedId = savedVersionIdRef.current;

            if (va) {
                // Actualiza stats de la versión activa (progress bar)
                const updated = versiones.find(ver => ver.id_version === va.id_version);
                if (updated) setVersionActiva(updated);
            } else if (!silent && savedId) {
                // Restaura versión persistida al cargar la página
                const toRestore = versiones.find(ver => ver.id_version === Number(savedId));
                if (toRestore) {
                    setVersionActiva(toRestore);
                    const cached = casosCacheLoad(toRestore.id_version);
                    if (cached) setCasos(cached);
                    loadCasos(toRestore.id_version, !!cached);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [loadCasos]);

    useEffect(() => { load(); }, [load]);

    // ── Navegación ────────────────────────────────────────────────────────────

    const handleSeleccionarVersion = useCallback((version) => {
        setVersionActiva(version);
        setSavedVersionId(version.id_version); // persiste para recarga
        setSelected(null);
        // Carga desde caché inmediatamente, luego revalida
        const cached = casosCacheLoad(version.id_version);
        if (cached) setCasos(cached);
        else setCasos([]);
        loadCasos(version.id_version, !!cached);
    }, [loadCasos, setSavedVersionId]);

    const handleVolverVersiones = () => {
        setVersionActiva(null);
        setSavedVersionId(null); // limpia persistencia
        setSelected(null);
        setCasos([]);
        load(true);
    };

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleVersionCreada = (version) => {
        setShowVersionModal(false);
        if (version) {
            handleSeleccionarVersion(version);
        } else {
            load(true);
        }
    };

    const handleCasoCreado = (caso) => {
        setShowCasoModal(false);
        if (caso) setCasos(prev => [caso, ...prev]);
        loadCasos(versionActiva.id_version, true);
        load(true);
        setSelected(caso);
    };

    const handleCasoUpdated = (caso) => {
        setCasos(prev => prev.map(c => c.id_caso === caso.id_caso ? caso : c));
        setSelected(caso);
        load(true); // refresca el desglose por columna de la tarjeta de versión
    };

    const handleDeleteCaso = (id_caso) => {
        setCasos(prev => {
            const next = prev.filter(c => c.id_caso !== id_caso);
            if (versionActivaRef.current) casosCacheSave(versionActivaRef.current.id_version, next);
            return next;
        });
        setSelected(null);
        load(true);
    };

    const handleDeleteVersion = async (version) => {
        if (!window.confirm(`¿Eliminar la versión "${version.nombre}"? Se eliminarán también todos sus casos. Esta acción no se puede deshacer.`)) return;
        try {
            await qaService.deleteVersion(version.id_version);
            setVersiones(prev => {
                const next = prev.filter(v => v.id_version !== version.id_version);
                cacheSave({ versiones: next, estados: [], socios: [] }); // invalida cache
                return next;
            });
            setSavedVersionId(null);
        } catch (e) {
            console.error('[QA] Error eliminando versión', e);
            alert('No se pudo eliminar la versión. Intenta nuevamente.');
        }
    };

    const handleMoveVersion = async (id_version, id_estado_version) => {
        const estadoTarget = versionEstados.find(ve => ve.id_estado_version === id_estado_version);
        const patch = { id_estado_version, estado_nombre: estadoTarget?.nombre, estado_color: estadoTarget?.color_hex };
        const previous = versiones;
        setVersiones(prev => prev.map(v => v.id_version === id_version ? { ...v, ...patch } : v));
        try {
            await qaService.updateVersion(id_version, { id_estado_version });
        } catch (e) {
            console.error('[QA] Error moviendo versión', e);
            setVersiones(previous);
            alert('No se pudo cambiar el estado de la versión.');
        }
    };

    const handleMoveCaso = async (id_caso, id_estado) => {
        const estadoTarget = estados.find(e => e.id_estado === id_estado);
        const patch = { id_estado, estado_nombre: estadoTarget?.nombre, estado_color: estadoTarget?.color_hex };
        setCasos(prev => prev.map(c => c.id_caso === id_caso ? { ...c, ...patch } : c));
        if (selected?.id_caso === id_caso) setSelected(s => ({ ...s, ...patch }));
        try {
            await qaService.updateCaso(id_caso, { id_estado });
            loadCasos(versionActiva.id_version, true);
            load(true);
        } catch {
            loadCasos(versionActiva.id_version, true);
        }
    };

    // ── Filtrado versiones ────────────────────────────────────────────────────

    const versionesFiltradas = versiones.filter(v => {
        if (filtroVersionEstado   && v.id_estado_version !== Number(filtroVersionEstado)) return false;
        if (filtroVersionContexto && v.tipo_contexto  !== filtroVersionContexto) return false;
        if (busquedaVersion) {
            const q = busquedaVersion.toLowerCase();
            if (!v.nombre?.toLowerCase().includes(q) &&
                !(v.version_tag     ?? '').toLowerCase().includes(q) &&
                !(v.nombre_producto ?? '').toLowerCase().includes(q) &&
                !(v.proyecto_nombre ?? '').toLowerCase().includes(q)) return false;
        }
        return true;
    });

    // ── Filtrado casos ────────────────────────────────────────────────────────

    const casosFiltrados = casos.filter(c => {
        if (filtroEstado    && c.id_estado    !== Number(filtroEstado))    return false;
        if (filtroPrioridad && c.id_prioridad !== Number(filtroPrioridad)) return false;
        if (filtroTipo      && c.id_tipo      !== Number(filtroTipo))      return false;
        if (busqueda) {
            const q = busqueda.toLowerCase();
            if (!c.numero_caso?.toLowerCase().includes(q) &&
                !c.titulo?.toLowerCase().includes(q))      return false;
        }
        return true;
    });

    const selectCls = "h-8 px-2 text-[12px] bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500";
    const hayFiltrosCasos = filtroEstado || filtroPrioridad || filtroTipo || busqueda;

    // ── Vista: lista de versiones ─────────────────────────────────────────────

    if (!versionActiva) {
        return (
            <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 border-b border-border flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <FlaskConical size={18} className="text-violet-400 shrink-0" />
                        <div>
                            <h1 className="text-base font-bold text-foreground">D.Q.T. — Desarrollo, QA y Testing</h1>
                            <p className="text-[11px] text-muted-foreground">Control de pruebas y versiones</p>
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <button onClick={() => load(false)}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-foreground/5">
                            <RefreshCw size={13} className={loading ? 'animate-spin text-muted-foreground' : 'text-foreground'} />
                        </button>
                        <button onClick={() => setShowVersionModal(true)}
                                className="h-8 px-3 text-[12px] rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-medium flex items-center gap-1.5 transition-colors">
                            <Plus size={13} /> Nueva versión
                        </button>
                    </div>
                </div>

                {/* Filtros versiones */}
                <div className="px-4 py-2 border-b border-border flex items-center gap-2 flex-wrap shrink-0">
                    <input
                        value={busquedaVersion}
                        onChange={e => setBusquedaVersion(e.target.value)}
                        placeholder="Buscar versión..."
                        className="h-8 px-3 text-[12px] bg-card border border-border rounded-lg text-foreground min-w-0 w-36 sm:w-48 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                    <select value={filtroVersionEstado} onChange={e => setFiltroVersionEstado(e.target.value)}
                            className={`${selectCls} min-w-0`}>
                        <option value="">Estado</option>
                        {versionEstados.map(ve =>
                            <option key={ve.id_estado_version} value={ve.id_estado_version}>{ve.nombre}</option>
                        )}
                    </select>
                    <select value={filtroVersionContexto} onChange={e => setFiltroVersionContexto(e.target.value)}
                            className={`${selectCls} min-w-0`}>
                        <option value="">Tipo</option>
                        {CONTEXTO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {(busquedaVersion || filtroVersionEstado || filtroVersionContexto) && (
                        <button onClick={() => { setBusquedaVersion(''); setFiltroVersionEstado(''); setFiltroVersionContexto(''); }}
                                className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
                            Limpiar
                        </button>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                        {versionesFiltradas.length} {versionesFiltradas.length === 1 ? 'versión' : 'versiones'}
                    </span>
                </div>

                {/* Tablero de versiones — columnas por estado, arrastrables */}
                <div className="flex-1 min-h-0 overflow-hidden p-5">
                    {loading && versiones.length === 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-44 bg-card border border-border rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    )}
                    {!loading && versiones.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground">
                            <FlaskConical size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">Sin versiones registradas</p>
                            <p className="text-xs mt-1">Crea la primera versión para empezar a gestionar pruebas.</p>
                        </div>
                    )}
                    {versiones.length > 0 && versionesFiltradas.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground">
                            <FlaskConical size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No hay versiones que coincidan con el filtro.</p>
                        </div>
                    )}
                    {versionesFiltradas.length > 0 && (
                        <VersionKanbanBoard versiones={versionesFiltradas} versionEstados={versionEstados} estados={estados}
                                            onSelect={handleSeleccionarVersion} onDelete={handleDeleteVersion}
                                            onMoveVersion={handleMoveVersion} />
                    )}
                </div>

                {showVersionModal && (
                    <VersionModal versionEstados={versionEstados} onClose={() => setShowVersionModal(false)} onCreated={handleVersionCreada} />
                )}
            </div>
        );
    }

    // ── Vista: kanban/lista de casos de la versión ────────────────────────────

    const total     = Number(versionActiva.total_casos ?? 0);
    const aprobados = Number(versionActiva.casos_aprobados ?? 0);
    const progreso  = total > 0 ? Math.round((aprobados / total) * 100) : 0;

    return (
        <div className="flex h-full overflow-hidden">
            {/* Panel izquierdo */}
            <div className={`flex flex-col ${selected ? 'hidden md:flex md:flex-1' : 'flex-1'} min-w-0`}>

                {/* Header con breadcrumb */}
                <div className="px-5 py-3 border-b border-border flex items-center gap-3 shrink-0">
                    <button onClick={handleVolverVersiones}
                            className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-violet-400 transition-colors shrink-0">
                        <ChevronLeft size={14} /> Versiones
                    </button>
                    <span className="text-muted-foreground/40">/</span>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FlaskConical size={14} className="text-violet-400 shrink-0" />
                        <span className="text-sm font-semibold text-foreground truncate">{versionActiva.nombre}</span>
                        {versionActiva.version_tag && (
                            <code className="text-[11px] text-muted-foreground font-mono hidden sm:block">{versionActiva.version_tag}</code>
                        )}
                    </div>
                    {/* Progress pill */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <div className="w-20 h-1.5 bg-secondary/60 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progreso}%` }} />
                        </div>
                        <span className="text-[11px] text-muted-foreground">{progreso}%</span>
                    </div>
                    <button onClick={() => setShowCasoModal(true)}
                            className="shrink-0 h-8 px-3 text-[12px] rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-medium flex items-center gap-1.5 transition-colors">
                        <Plus size={13} /> Nuevo caso
                    </button>
                </div>

                {/* Filtros casos */}
                <div className="px-4 py-2 border-b border-border flex items-center gap-2 flex-wrap shrink-0">
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                           placeholder="Buscar caso..."
                           className="h-8 px-3 text-[12px] bg-card border border-border rounded-lg text-foreground min-w-0 w-32 sm:w-40 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                    <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className={`${selectCls} min-w-0`}>
                        <option value="">Estado</option>
                        {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                    </select>
                    <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)} className={`${selectCls} min-w-0`}>
                        <option value="">Prioridad</option>
                        {prioridades.map(p => <option key={p.id_prioridad} value={p.id_prioridad}>{p.nombre}</option>)}
                    </select>
                    <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={`${selectCls} min-w-0`}>
                        <option value="">Tipo</option>
                        {tipos.map(t => <option key={t.id_tipo} value={t.id_tipo}>{t.nombre}</option>)}
                    </select>
                    {hayFiltrosCasos && (
                        <button onClick={() => { setBusqueda(''); setFiltroEstado(''); setFiltroPrioridad(''); setFiltroTipo(''); }}
                                className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors shrink-0">
                            Limpiar
                        </button>
                    )}
                    <div className="flex items-center rounded-lg border border-border overflow-hidden ml-auto shrink-0">
                        <button onClick={() => setView('cards')}
                                className={`h-8 w-8 flex items-center justify-center transition-colors ${view==='cards' ? 'bg-violet-500/15 text-violet-400' : 'bg-card text-muted-foreground hover:text-foreground'}`}>
                            <LayoutGrid size={13} />
                        </button>
                        <button onClick={() => setView('list')}
                                className={`h-8 w-8 flex items-center justify-center transition-colors ${view==='list' ? 'bg-violet-500/15 text-violet-400' : 'bg-card text-muted-foreground hover:text-foreground'}`}>
                            <List size={13} />
                        </button>
                    </div>
                    <button onClick={() => loadCasos(versionActiva.id_version)}
                            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-foreground/5">
                        <RefreshCw size={13} className={loadingCasos ? 'animate-spin text-muted-foreground' : 'text-foreground'} />
                    </button>
                </div>

                {/* Casos */}
                <div className={`flex-1 min-h-0 ${view==='cards' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                    {loadingCasos && casos.length === 0 && (
                        <div className="p-4 space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
                            ))}
                        </div>
                    )}
                    {!loadingCasos && casosFiltrados.length === 0 && casos.length > 0 && (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                            No hay casos que coincidan con los filtros.
                        </div>
                    )}
                    {view === 'cards' && (casos.length > 0 || !loadingCasos) && (
                        <CasoKanbanView casos={casosFiltrados} estados={estados}
                                        selected={selected} onSelect={setSelected}
                                        onMoveCaso={handleMoveCaso} />
                    )}
                    {view === 'list' && !loadingCasos && (
                        <CasoListView casos={casosFiltrados} estados={estados}
                                      selected={selected} onSelect={setSelected} />
                    )}
                </div>
            </div>

            {/* Panel detalle */}
            {selected && (
                <div className="flex-1 md:flex-none md:w-[420px] min-w-0 border-l border-border overflow-y-auto">
                    <CasoDetalle
                        key={selected.id_caso}
                        caso={selected}
                        estados={estados}
                        socios={socios}
                        onClose={() => setSelected(null)}
                        onUpdated={handleCasoUpdated}
                        onDeleted={handleDeleteCaso}
                    />
                </div>
            )}

            {showCasoModal && (
                <CasoModal version={versionActiva} estados={estados} socios={socios}
                           tipos={tipos} prioridades={prioridades}
                           onClose={() => setShowCasoModal(false)}
                           onCreated={handleCasoCreado} />
            )}
        </div>
    );
}
