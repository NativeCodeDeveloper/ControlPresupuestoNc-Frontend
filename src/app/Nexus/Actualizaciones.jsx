'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Rss, Send, RefreshCw, CheckCircle2, AlertCircle, Clock,
    Users, User, Plus, X, LayoutGrid, List, Trash2, Bell, ChevronDown
} from 'lucide-react';
import { getProjects } from '../../services/projectsService';
import * as svc from '../../services/actualizacionesService';
import ClientSelector from './ClientSelector';

// ─── Constantes ───────────────────────────────────────────────────────────────

const PRIORIDAD = {
    baja:    { label: 'Baja',    cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
    media:   { label: 'Media',   cls: 'text-amber-400   bg-amber-500/10   border-amber-500/25'   },
    alta:    { label: 'Alta',    cls: 'text-orange-400  bg-orange-500/10  border-orange-500/25'  },
    critica: { label: 'Crítica', cls: 'text-red-400     bg-red-500/10     border-red-500/25'     },
};

const TEMPLATE = `Les comunicamos que hemos realizado una actualización en el sistema Agenda Clínica.

Cambios principales:
• [Describe el cambio 1]
• [Describe el cambio 2]

Si experimentas algún problema o tienes preguntas, no dudes en contactarnos.`;

const inputCls  = "w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500";
const selectCls = `${inputCls} cursor-pointer`;

function fmt(date) {
    if (!date) return '—';
    const d = typeof date === 'string' && !date.includes('T')
        ? new Date(date.replace(' ', 'T') + 'Z') : new Date(date);
    if (isNaN(d)) return '—';
    return d.toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' });
}

function parseDests(raw) {
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw || '[]'); } catch { return []; }
}

// ─── Kanban card ──────────────────────────────────────────────────────────────

function ActCard({ act, onSelect, isSelected }) {
    const p = PRIORIDAD[act.prioridad] ?? PRIORIDAD.media;
    const dests = parseDests(act.destinatarios);
    return (
        <div
            draggable
            onDragStart={e => { e.dataTransfer.setData('id_act', String(act.id_actualizacion)); e.dataTransfer.effectAllowed = 'move'; }}
            onClick={() => onSelect(act)}
            className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all ${
                isSelected
                    ? 'border-sky-500/60 bg-sky-500/8 shadow-md'
                    : 'bg-card border-border/60 hover:border-sky-500/40 hover:shadow-md hover:bg-secondary/20'
            }`}
        >
            <p className="text-[12px] font-semibold text-foreground line-clamp-2 mb-2">{act.titulo}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${p.cls}`}>{p.label}</span>
                {dests.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Users size={9} />{dests.length}
                    </span>
                )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <Clock size={9} />{fmt(act.enviado_en)}
            </p>
        </div>
    );
}

// ─── Kanban view ──────────────────────────────────────────────────────────────

function ActKanbanView({ actualizaciones, estados, onSelect, selected, onMove }) {
    const [dragOver, setDragOver] = useState(null);
    return (
        <div className="flex gap-4 px-4 pt-4 pb-2 h-full overflow-x-auto">
            {estados.map(est => {
                const cols = actualizaciones.filter(a => a.id_estado === est.id_estado);
                const isOver = dragOver === est.id_estado;
                return (
                    <div key={est.id_estado}
                         onDragOver={e => { e.preventDefault(); setDragOver(est.id_estado); }}
                         onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null); }}
                         onDrop={e => {
                             e.preventDefault();
                             const id = parseInt(e.dataTransfer.getData('id_act'), 10);
                             if (id) onMove(id, est.id_estado);
                             setDragOver(null);
                         }}
                         className={`flex-none w-[260px] flex flex-col rounded-xl transition-colors ${isOver ? 'bg-sky-500/6 ring-1 ring-inset ring-sky-500/30' : ''}`}>
                        <div className="flex items-center gap-2 mb-3 px-1 shrink-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: est.color_hex }} />
                            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">{est.nombre}</span>
                            <span className="ml-auto text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-full">{cols.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[64px] pr-0.5">
                            {cols.map(a => (
                                <ActCard key={a.id_actualizacion} act={a} onSelect={onSelect} isSelected={selected?.id_actualizacion === a.id_actualizacion} />
                            ))}
                            {cols.length === 0 && (
                                <div className={`rounded-xl border-2 border-dashed border-border/30 min-h-[64px] flex items-center justify-center ${isOver ? 'border-sky-500/40' : ''}`}>
                                    <span className="text-[11px] text-muted-foreground/40">Vacío</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ActListView({ actualizaciones, estados, onSelect, selected }) {
    return (
        <div className="px-4 py-3 space-y-1.5 overflow-y-auto h-full">
            {actualizaciones.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12">No hay actualizaciones registradas.</p>
            )}
            {actualizaciones.map(a => {
                const p = PRIORIDAD[a.prioridad] ?? PRIORIDAD.media;
                const dests = parseDests(a.destinatarios);
                const isSelected = selected?.id_actualizacion === a.id_actualizacion;
                return (
                    <div key={a.id_actualizacion}
                         onClick={() => onSelect(a)}
                         className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                             isSelected ? 'border-sky-500/50 bg-sky-500/8' : 'border-border/50 hover:border-sky-500/30 hover:bg-secondary/10'
                         }`}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: a.estado_color ?? '#6b7280' }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{a.titulo}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{a.estado_nombre ?? 'Sin estado'} · {fmt(a.enviado_en)}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${p.cls}`}>{p.label}</span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                            <Users size={9} />{dests.length}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function ActDetalle({ act, estados, proyectos, onClose, onUpdated, onDeleted }) {
    const [idEstado,    setIdEstado]    = useState(String(act.id_estado ?? ''));
    const [notifResult, setNotifResult] = useState(null);
    const [sending,     setSending]     = useState(false);
    const [deleting,    setDeleting]    = useState(false);
    const [savingState, setSavingState] = useState(false);

    const dests = parseDests(act.destinatarios);
    const p = PRIORIDAD[act.prioridad] ?? PRIORIDAD.media;

    const handleEstado = async (val) => {
        if (val === String(act.id_estado)) return;
        setSavingState(true);
        try {
            const { actualizacion } = await svc.updateActualizacion(act.id_actualizacion, { id_estado: Number(val) });
            setIdEstado(val);
            onUpdated(actualizacion);
        } finally { setSavingState(false); }
    };

    const handleNotificar = async () => {
        setSending(true);
        setNotifResult(null);
        try {
            const res = await svc.notificar(act.id_actualizacion);
            setNotifResult(res);
            onUpdated({ ...act, total_enviados: res.enviados, total_errores: res.errores });
        } catch (e) {
            setNotifResult({ error: e.message || 'Error al notificar' });
        } finally { setSending(false); }
    };

    const handleFinalizar = async () => {
        const estadoFinal = estados[estados.length - 1];
        if (!estadoFinal) return;
        setSavingState(true);
        try {
            const { actualizacion } = await svc.updateActualizacion(act.id_actualizacion, { id_estado: estadoFinal.id_estado });
            setIdEstado(String(estadoFinal.id_estado));
            onUpdated(actualizacion);
        } finally { setSavingState(false); }
    };

    const handleDelete = async () => {
        if (!confirm('¿Eliminar esta actualización?')) return;
        setDeleting(true);
        try { await svc.deleteActualizacion(act.id_actualizacion); onDeleted(act.id_actualizacion); }
        finally { setDeleting(false); }
    };

    return (
        <div className="w-[300px] shrink-0 border-l border-border flex flex-col overflow-hidden bg-card">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <span className="text-sm font-semibold text-foreground truncate pr-2">{act.titulo}</span>
                <button onClick={onClose}><X size={14} className="text-muted-foreground hover:text-foreground" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Estado */}
                <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Estado</p>
                    <select value={idEstado} onChange={e => handleEstado(e.target.value)}
                            disabled={savingState}
                            className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60">
                        {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                    </select>
                </div>

                {/* Prioridad */}
                <div className="flex items-center gap-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Prioridad</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${p.cls}`}>{p.label}</span>
                </div>

                {/* Fecha */}
                <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Creado</p>
                    <p className="text-[12px] text-foreground">{fmt(act.enviado_en)}</p>
                </div>

                {/* Mensaje */}
                <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mensaje</p>
                    <div className="bg-secondary/30 border border-border/50 rounded-xl px-3 py-2.5 text-[12px] text-foreground whitespace-pre-wrap max-h-36 overflow-y-auto">
                        {act.mensaje}
                    </div>
                </div>

                {/* Destinatarios */}
                <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                        Destinatarios ({dests.length})
                    </p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {dests.map((d, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px]">
                                <div className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                                    <User size={10} className="text-sky-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-foreground truncate">{d.nombre || d.email}</p>
                                    {d.nombre && <p className="text-muted-foreground truncate">{d.email}</p>}
                                </div>
                            </div>
                        ))}
                        {dests.length === 0 && <p className="text-[11px] text-muted-foreground">Sin destinatarios</p>}
                    </div>
                </div>

                {/* Resultado de envío */}
                {(act.total_enviados > 0 || act.total_errores > 0) && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 size={11} className="text-emerald-400" />
                        {act.total_enviados} enviados · {act.total_errores} errores
                    </div>
                )}

                {/* Resultado notificación */}
                {notifResult && (
                    <div className={`p-3 rounded-xl border text-[12px] ${notifResult.error ? 'bg-red-500/8 border-red-500/30 text-red-400' : 'bg-emerald-500/8 border-emerald-500/30 text-emerald-400'}`}>
                        {notifResult.error
                            ? <><AlertCircle size={12} className="inline mr-1" />{notifResult.error}</>
                            : <><CheckCircle2 size={12} className="inline mr-1" />{notifResult.enviados} correos enviados</>
                        }
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className="px-4 py-3 border-t border-border space-y-2 shrink-0">
                <button onClick={handleNotificar} disabled={sending || dests.length === 0}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[12px] font-semibold hover:bg-sky-500/25 disabled:opacity-40 transition-colors">
                    {sending ? <RefreshCw size={12} className="animate-spin" /> : <Bell size={12} />}
                    {sending ? 'Enviando...' : 'Notificar cliente'}
                </button>
                <button onClick={handleFinalizar} disabled={savingState}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[12px] font-semibold hover:bg-emerald-500/25 disabled:opacity-40 transition-colors">
                    <CheckCircle2 size={12} /> Finalizar actualización
                </button>
                <button onClick={handleDelete} disabled={deleting}
                        className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-muted-foreground text-[11px] hover:text-red-400 hover:bg-red-500/8 disabled:opacity-40 transition-colors">
                    <Trash2 size={11} /> Eliminar
                </button>
            </div>
        </div>
    );
}

// ─── Modal nueva actualización ────────────────────────────────────────────────

function ActModal({ estados, proyectos, onClose, onCreated }) {
    const [form, setForm] = useState({
        titulo: '', mensaje: TEMPLATE,
        id_estado: String(estados[0]?.id_estado ?? ''),
        prioridad: 'media', modo: 'masivo',
    });
    const [seleccion, setSeleccion] = useState([]);
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSeleccion = (val) => {
        if (form.modo === 'individual') {
            setSeleccion(val ? [val] : []);
        } else {
            setSeleccion(Array.isArray(val) ? val : []);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.titulo.trim()) return setError('El título es requerido');
        setSaving(true); setError('');
        try {
            const { actualizacion } = await svc.createActualizacion({
                ...form,
                id_estado:    form.id_estado ? Number(form.id_estado) : null,
                destinatarios: seleccion,
            });
            onCreated(actualizacion);
        } catch (e) {
            setError(e.message || 'Error al crear');
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Rss size={15} className="text-sky-400" /> Nueva actualización
                    </h3>
                    <button onClick={onClose}><X size={16} className="text-muted-foreground hover:text-foreground" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Título *</label>
                        <input required value={form.titulo} onChange={e => set('titulo', e.target.value)}
                               placeholder="Ej: Actualización módulo de agenda v2.1" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Estado inicial</label>
                            <select value={form.id_estado} onChange={e => set('id_estado', e.target.value)} className={selectCls}>
                                {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Prioridad</label>
                            <select value={form.prioridad} onChange={e => set('prioridad', e.target.value)} className={selectCls}>
                                {Object.entries(PRIORIDAD).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Descripción / Mensaje</label>
                        <textarea value={form.mensaje} onChange={e => set('mensaje', e.target.value)}
                                  rows={6} className={`${inputCls} resize-none font-mono text-[12px]`} />
                    </div>

                    {/* Destinatarios */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] text-muted-foreground">Destinatarios</label>
                            <div className="flex gap-1 rounded-lg bg-secondary/40 border border-border p-0.5">
                                {[['masivo','Masivo',Users],['individual','Individual',User]].map(([m, l, Icon]) => (
                                    <button key={m} type="button"
                                            onClick={() => { set('modo', m); setSeleccion([]); }}
                                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${form.modo === m ? 'bg-sky-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                                        <Icon size={11} />{l}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <ClientSelector
                            proyectos={proyectos}
                            mode={form.modo === 'masivo' ? 'multi' : 'single'}
                            selected={form.modo === 'masivo' ? seleccion : (seleccion[0] ?? null)}
                            onChange={handleSeleccion}
                        />
                        {seleccion.length > 0 && (
                            <p className="text-[11px] text-sky-400 mt-1">{seleccion.length} destinatario{seleccion.length !== 1 ? 's' : ''} seleccionado{seleccion.length !== 1 ? 's' : ''}</p>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={onClose}
                                className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                                className="px-4 py-2 text-sm rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold disabled:opacity-50">
                            {saving ? 'Creando...' : 'Crear actualización'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const CACHE_KEY = 'ncf:nexus:actualizaciones:v3';
function cacheLoad() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; } }
function cacheSave(d) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch {} }

export default function Actualizaciones() {
    const [actualizaciones, setActualizaciones] = useState([]);
    const [estados,         setEstados]         = useState([]);
    const [proyectos,       setProyectos]       = useState([]);
    const [selected,        setSelected]        = useState(null);
    const [view,            setView]            = useState('kanban'); // 'kanban' | 'list'
    const [showModal,       setShowModal]       = useState(false);
    const [loading,         setLoading]         = useState(true);
    const [filtroEstado,    setFiltroEstado]    = useState('all');
    const [busqueda,        setBusqueda]        = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) {
            const cached = cacheLoad();
            if (cached) { setActualizaciones(cached.acts ?? []); setEstados(cached.estados ?? []); setLoading(false); }
            else setLoading(true);
        }
        try {
            const [acts, ests, proys] = await Promise.all([
                svc.getActualizaciones().catch(() => []),
                svc.getEstados().catch(() => []),
                getProjects().catch(() => []),
            ]);
            if (Array.isArray(acts))  { setActualizaciones(acts); }
            if (Array.isArray(ests))  { setEstados(ests); }
            if (Array.isArray(proys)) { setProyectos(proys.filter(p => p.activo !== 0)); }
            cacheSave({ acts, estados: ests });
            // Sincroniza selected con datos frescos
            setSelected(prev => prev ? (acts.find(a => a.id_actualizacion === prev.id_actualizacion) ?? prev) : null);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleMove = async (id, id_estado) => {
        const estadoTarget = estados.find(e => e.id_estado === id_estado);
        setActualizaciones(prev => prev.map(a =>
            a.id_actualizacion === id
                ? { ...a, id_estado, estado_nombre: estadoTarget?.nombre, estado_color: estadoTarget?.color_hex }
                : a
        ));
        if (selected?.id_actualizacion === id) {
            setSelected(s => ({ ...s, id_estado, estado_nombre: estadoTarget?.nombre, estado_color: estadoTarget?.color_hex }));
        }
        try { await svc.updateActualizacion(id, { id_estado }); await load(true); }
        catch { await load(true); }
    };

    const handleUpdated = (updated) => {
        setActualizaciones(prev => prev.map(a => a.id_actualizacion === updated.id_actualizacion ? updated : a));
        setSelected(updated);
    };

    const handleDeleted = (id) => {
        setActualizaciones(prev => prev.filter(a => a.id_actualizacion !== id));
        setSelected(null);
    };

    const handleCreated = (act) => {
        setActualizaciones(prev => [act, ...prev]);
        setSelected(act);
        setShowModal(false);
    };

    const actualizacionesFiltradas = useMemo(() => {
        let list = actualizaciones;
        if (filtroEstado !== 'all') list = list.filter(a => String(a.id_estado) === filtroEstado);
        if (busqueda.trim()) {
            const q = busqueda.toLowerCase();
            list = list.filter(a => a.titulo?.toLowerCase().includes(q) || a.mensaje?.toLowerCase().includes(q));
        }
        return list;
    }, [actualizaciones, filtroEstado, busqueda]);

    const togBtnCls = (active) =>
        `p-1.5 rounded-lg transition-colors ${active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* ── Header fila 1 ── */}
            <div className="px-5 py-3 border-b border-border flex items-center gap-3 shrink-0">
                <Rss size={16} className="text-sky-400 shrink-0" />
                <h1 className="font-semibold text-foreground text-sm">Actualizaciones del Sistema</h1>
                <button onClick={() => setShowModal(true)}
                        className="ml-auto flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0">
                    <Plus size={13} /> Nueva
                </button>
            </div>

            {/* ── Header fila 2: filtros + toggle ── */}
            <div className="px-4 py-2 border-b border-border flex items-center gap-2 flex-wrap shrink-0">
                <input
                    value={busqueda} onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar..." className="w-32 sm:w-40 bg-secondary/40 border border-border rounded-lg px-3 py-1.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500" />
                <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                        className="bg-secondary/40 border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground focus:outline-none cursor-pointer max-w-[130px]">
                    <option value="all">Todos</option>
                    {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                </select>
                <div className="flex items-center gap-1 ml-auto border border-border rounded-lg p-0.5 shrink-0">
                    <button title="Kanban" onClick={() => setView('kanban')} className={togBtnCls(view === 'kanban')}><LayoutGrid size={14} /></button>
                    <button title="Lista"  onClick={() => setView('list')}   className={togBtnCls(view === 'list')}><List size={14} /></button>
                </div>
                <button onClick={() => load(true)} className="shrink-0 p-1.5 rounded-lg border border-border hover:bg-foreground/5">
                    <RefreshCw size={13} className={loading ? 'animate-spin text-muted-foreground' : 'text-foreground'} />
                </button>
            </div>

            {/* ── Contenido ── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Vista principal */}
                <div className={`flex-1 min-w-0 ${view === 'kanban' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                    {loading && !actualizaciones.length ? (
                        <div className="flex items-center justify-center h-full">
                            <RefreshCw size={20} className="animate-spin text-muted-foreground" />
                        </div>
                    ) : view === 'kanban' ? (
                        <ActKanbanView
                            actualizaciones={actualizacionesFiltradas}
                            estados={estados}
                            onSelect={a => setSelected(s => s?.id_actualizacion === a.id_actualizacion ? null : a)}
                            selected={selected}
                            onMove={handleMove}
                        />
                    ) : (
                        <ActListView
                            actualizaciones={actualizacionesFiltradas}
                            estados={estados}
                            onSelect={a => setSelected(s => s?.id_actualizacion === a.id_actualizacion ? null : a)}
                            selected={selected}
                        />
                    )}
                </div>

                {/* Panel detalle */}
                {selected && (
                    <ActDetalle
                        key={selected.id_actualizacion}
                        act={selected}
                        estados={estados}
                        proyectos={proyectos}
                        onClose={() => setSelected(null)}
                        onUpdated={handleUpdated}
                        onDeleted={handleDeleted}
                    />
                )}
            </div>

            {/* Modal nueva */}
            {showModal && (
                <ActModal
                    estados={estados}
                    proyectos={proyectos}
                    onClose={() => setShowModal(false)}
                    onCreated={handleCreated}
                />
            )}
        </div>
    );
}
