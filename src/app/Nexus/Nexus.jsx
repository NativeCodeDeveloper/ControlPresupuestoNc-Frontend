'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    LifeBuoy, Plus, RefreshCw, X, ChevronRight,
    Clock, User, AlertTriangle, CheckCircle2, MessageSquare,
    Mail, Send, ChevronDown, Circle
} from 'lucide-react';
import * as soporteService from '../../services/soporteService';
import { getPartners } from '../../services/partnersService';
import { getProjects } from '../../services/projectsService';

// ─── Utilidades ───────────────────────────────────────────────────────────────

const PRIORIDAD = {
    baja:    { label: 'Baja',    color: 'text-slate-400',   bg: 'bg-slate-500/15',  border: 'border-slate-500/30' },
    media:   { label: 'Media',   color: 'text-amber-400',   bg: 'bg-amber-500/15',  border: 'border-amber-500/30' },
    alta:    { label: 'Alta',    color: 'text-orange-400',  bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
    critica: { label: 'Crítica', color: 'text-red-400',     bg: 'bg-red-500/15',    border: 'border-red-500/30' },
};

const SLA_OPTS = [4, 8, 24, 48];
const SLA_LABEL = { 4: '4 horas hábiles', 8: '8 horas hábiles', 24: '24 horas hábiles', 48: '48 horas hábiles' };

const TIPO_ACTIVIDAD_ICON = {
    creacion:      <Circle size={10} className="text-sky-400 mt-0.5 shrink-0" />,
    comentario:    <MessageSquare size={10} className="text-slate-400 mt-0.5 shrink-0" />,
    cambio_estado: <ChevronRight size={10} className="text-amber-400 mt-0.5 shrink-0" />,
    resolucion:    <CheckCircle2 size={10} className="text-emerald-400 mt-0.5 shrink-0" />,
    notificacion:  <Mail size={10} className="text-violet-400 mt-0.5 shrink-0" />,
    cierre:        <CheckCircle2 size={10} className="text-slate-500 mt-0.5 shrink-0" />,
};

function fmt(date) {
    if (!date) return '—';
    return new Date(date).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function PrioridadBadge({ prioridad }) {
    const p = PRIORIDAD[prioridad] ?? PRIORIDAD.media;
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${p.color} ${p.bg} ${p.border}`}>
            {p.label}
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

// ─── Modal de email ───────────────────────────────────────────────────────────

function EmailModal({ ticket, tipo, onClose, socios }) {
    const [subject, setSubject] = useState('');
    const [body, setBody]       = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [sent, setSent]       = useState(false);

    useEffect(() => {
        soporteService.previewEmail(ticket.id_ticket, tipo)
            .then(data => { setSubject(data.subject); setBody(data.body); })
            .catch(() => setBody('Error al cargar template.'))
            .finally(() => setLoading(false));
    }, [ticket.id_ticket, tipo]);

    const handleEnviar = async () => {
        setSending(true);
        try {
            await soporteService.enviarEmail(ticket.id_ticket, { tipo, body_text: body });
            setSent(true);
            setTimeout(onClose, 1200);
        } finally {
            setSending(false);
        }
    };

    const tipoLabel = { apertura: 'Apertura', actualizacion: 'Actualización', cierre: 'Cierre' }[tipo];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Mail size={15} className="text-sky-400" />
                        Email de {tipoLabel}
                    </h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
                </div>
                <div className="p-5 space-y-3">
                    <div>
                        <p className="text-[11px] text-muted-foreground mb-1">Para: <span className="text-foreground">{ticket.email_cliente}</span></p>
                        <p className="text-[11px] text-muted-foreground">Asunto: <span className="text-foreground">{subject}</span></p>
                    </div>
                    {loading ? (
                        <div className="h-40 bg-secondary/30 rounded-lg animate-pulse" />
                    ) : (
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            rows={10}
                            className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-[12px] text-foreground font-mono resize-none focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                    )}
                    <p className="text-[10px] text-muted-foreground">Puedes editar el mensaje antes de enviarlo.</p>
                </div>
                <div className="px-5 pb-4 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleEnviar}
                        disabled={sending || sent || loading}
                        className="px-4 py-2 text-sm rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                    >
                        <Send size={13} />
                        {sent ? '¡Enviado!' : sending ? 'Enviando...' : 'Enviar correo'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Modal crear ticket ───────────────────────────────────────────────────────

function TicketModal({ estados, socios, onClose, onCreated }) {
    const [form, setForm] = useState({
        id_proyecto: '', nombre_cliente: '', email_cliente: '', asunto: '', descripcion: '',
        prioridad: 'media', sla_horas: 24, id_estado: estados[0]?.id_estado ?? '',
        id_responsable: '', enviar_apertura: true
    });
    const [proyectos, setProyectos] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');

    useEffect(() => {
        getProjects().then(p => setProyectos(Array.isArray(p) ? p : [])).catch(() => {});
    }, []);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    // Al seleccionar proyecto, pre-rellenar nombre_cliente si aún está vacío
    const handleProyecto = (val) => {
        set('id_proyecto', val);
        if (val) {
            const p = proyectos.find(x => String(x.id_proyecto) === val);
            if (p && !form.nombre_cliente) set('nombre_cliente', p.nombre_cliente || p.nombre);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const data = await soporteService.createTicket({
                ...form,
                id_proyecto:    form.id_proyecto ? Number(form.id_proyecto) : null,
                id_estado:      Number(form.id_estado),
                id_responsable: form.id_responsable ? Number(form.id_responsable) : null,
                sla_horas:      Number(form.sla_horas),
            });
            onCreated(data.ticket);
        } catch (err) {
            setError(err.message || 'Error al crear ticket');
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <LifeBuoy size={15} className="text-sky-400" />
                        Nuevo Ticket de Soporte
                    </h3>
                    <button onClick={onClose}><X size={16} className="text-muted-foreground hover:text-foreground" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Proyecto */}
                    <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Proyecto asociado</label>
                        <select value={form.id_proyecto} onChange={e => handleProyecto(e.target.value)} className={inputCls}>
                            <option value="">— Ticket interno (sin proyecto) —</option>
                            {proyectos.map(p => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Cliente *</label>
                            <input required value={form.nombre_cliente} onChange={e => set('nombre_cliente', e.target.value)}
                                   placeholder="Nombre del cliente" className={inputCls} />
                        </div>
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Email cliente *</label>
                            <input required type="email" value={form.email_cliente} onChange={e => set('email_cliente', e.target.value)}
                                   placeholder="cliente@email.com" className={inputCls} />
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Asunto *</label>
                        <input required value={form.asunto} onChange={e => set('asunto', e.target.value)}
                               placeholder="Describe brevemente el problema" className={inputCls} />
                    </div>

                    <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Descripción *</label>
                        <textarea required value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                                  rows={4} placeholder="Detalle completo del problema o solicitud..." className={`${inputCls} resize-none`} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Prioridad</label>
                            <select value={form.prioridad} onChange={e => set('prioridad', e.target.value)} className={inputCls}>
                                {Object.entries(PRIORIDAD).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">SLA</label>
                            <select value={form.sla_horas} onChange={e => set('sla_horas', e.target.value)} className={inputCls}>
                                {SLA_OPTS.map(h => <option key={h} value={h}>{SLA_LABEL[h]}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
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

                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={form.enviar_apertura} onChange={e => set('enviar_apertura', e.target.checked)}
                               className="rounded" />
                        Enviar email de apertura al cliente automáticamente
                    </label>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                                className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                                className="px-4 py-2 text-sm rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium disabled:opacity-50 transition-colors">
                            {saving ? 'Creando...' : 'Crear Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Panel de detalle ─────────────────────────────────────────────────────────

function TicketDetalle({ ticket, estados, socios, onClose, onUpdated }) {
    const [actividad, setActividad]   = useState([]);
    const [comentario, setComentario] = useState('');
    const [emailModal, setEmailModal] = useState(null); // 'apertura'|'actualizacion'|'cierre'
    const [saving, setSaving]         = useState(false);
    const [resolucion, setResolucion] = useState({
        causa: ticket.resolucion_causa ?? '',
        accion: ticket.resolucion_accion ?? '',
        resultado: ticket.resolucion_resultado ?? '',
        observaciones: ticket.resolucion_observaciones ?? '',
    });

    // Sincronizar resolucion cuando el ticket se actualiza desde el padre
    useEffect(() => {
        setResolucion({
            causa:         ticket.resolucion_causa         ?? '',
            accion:        ticket.resolucion_accion        ?? '',
            resultado:     ticket.resolucion_resultado     ?? '',
            observaciones: ticket.resolucion_observaciones ?? '',
        });
    }, [ticket.resolucion_causa, ticket.resolucion_accion, ticket.resolucion_resultado, ticket.resolucion_observaciones]);

    const loadActividad = useCallback(async () => {
        try {
            const data = await soporteService.getActividad(ticket.id_ticket);
            setActividad(Array.isArray(data) ? data : []);
        } catch (_) {}
    }, [ticket.id_ticket]);

    useEffect(() => { loadActividad(); }, [loadActividad]);

    const handleEstado = async (id_estado) => {
        if (id_estado === ticket.id_estado) return;
        setSaving(true);
        try {
            const { ticket: updated } = await soporteService.updateTicket(ticket.id_ticket, { id_estado: Number(id_estado) });
            onUpdated(updated);
            await loadActividad();
        } finally { setSaving(false); }
    };

    const handleResponsable = async (id_responsable) => {
        setSaving(true);
        try {
            const { ticket: updated } = await soporteService.updateTicket(ticket.id_ticket, {
                id_responsable: id_responsable ? Number(id_responsable) : null
            });
            onUpdated(updated);
        } finally { setSaving(false); }
    };

    const handleComentario = async () => {
        if (!comentario.trim()) return;
        setSaving(true);
        try {
            await soporteService.addComentario(ticket.id_ticket, { contenido: comentario });
            setComentario('');
            await loadActividad();
        } finally { setSaving(false); }
    };

    const handleResolucion = async () => {
        setSaving(true);
        try {
            const { ticket: updated } = await soporteService.updateTicket(ticket.id_ticket, {
                resolucion_causa: resolucion.causa,
                resolucion_accion: resolucion.accion,
                resolucion_resultado: resolucion.resultado,
                resolucion_observaciones: resolucion.observaciones,
            });
            onUpdated(updated);
            await loadActividad();
        } finally { setSaving(false); }
    };

    const inputCls = "w-full bg-secondary/30 border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none";

    return (
        <>
            <div className="flex flex-col h-full bg-card border-l border-border w-full max-w-md">
                {/* Header */}
                <div className="flex items-start justify-between px-4 py-3 border-b border-border">
                    <div className="min-w-0">
                        <p className="text-[11px] text-sky-400 font-mono font-semibold">{ticket.numero_ticket}</p>
                        <p className="text-sm font-semibold text-foreground truncate">{ticket.asunto}</p>
                        <p className="text-[11px] text-muted-foreground">{ticket.nombre_cliente} · {ticket.email_cliente}</p>
                    </div>
                    <button onClick={onClose} className="shrink-0 ml-2 text-muted-foreground hover:text-foreground"><X size={15} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                        <PrioridadBadge prioridad={ticket.prioridad} />
                        {ticket.estado_nombre && <EstadoBadge nombre={ticket.estado_nombre} color={ticket.estado_color} />}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 border border-border text-muted-foreground">
                            SLA: {SLA_LABEL[ticket.sla_horas] ?? `${ticket.sla_horas}h`}
                        </span>
                    </div>

                    {/* Descripción */}
                    <div className="bg-secondary/20 rounded-lg p-3">
                        <p className="text-[11px] text-muted-foreground mb-1">Descripción</p>
                        <p className="text-[12px] text-foreground whitespace-pre-wrap">{ticket.descripcion}</p>
                    </div>

                    {/* Controles */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-muted-foreground mb-1 block">Estado</label>
                            <select value={ticket.id_estado} onChange={e => handleEstado(e.target.value)}
                                    disabled={saving}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground focus:outline-none">
                                {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-muted-foreground mb-1 block">Responsable</label>
                            <select value={ticket.id_responsable ?? ''} onChange={e => handleResponsable(e.target.value)}
                                    disabled={saving}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground focus:outline-none">
                                <option value="">Sin asignar</option>
                                {socios.map(s => <option key={s.id_socio} value={s.id_socio}>{s.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Resolución */}
                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Resolución</p>
                        {[
                            { key: 'causa',         label: 'Causa del problema' },
                            { key: 'accion',        label: 'Acción realizada' },
                            { key: 'resultado',     label: 'Resultado obtenido' },
                            { key: 'observaciones', label: 'Observaciones finales' },
                        ].map(({ key, label }) => (
                            <div key={key}>
                                <label className="text-[10px] text-muted-foreground mb-0.5 block">{label}</label>
                                <textarea rows={2} value={resolucion[key]} onChange={e => setResolucion(r => ({ ...r, [key]: e.target.value }))}
                                          placeholder={label} className={inputCls} />
                            </div>
                        ))}
                        <button onClick={handleResolucion} disabled={saving}
                                className="w-full py-1.5 text-[12px] rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                            Guardar resolución
                        </button>
                    </div>

                    {/* Emails */}
                    <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Notificar cliente</p>
                        {[
                            { tipo: 'apertura',       label: 'Email de apertura' },
                            { tipo: 'actualizacion',  label: 'Email de actualización' },
                            { tipo: 'cierre',         label: 'Email de cierre' },
                        ].map(({ tipo, label }) => (
                            <button key={tipo} onClick={() => setEmailModal(tipo)}
                                    className="w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/30 border border-border text-[12px] text-muted-foreground hover:text-foreground hover:border-sky-500/40 transition-colors">
                                <Mail size={12} className="text-sky-400" />
                                {label}
                                <ChevronDown size={11} className="ml-auto" />
                            </button>
                        ))}
                    </div>

                    {/* Actividad interna */}
                    <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Actividad interna</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {actividad.length === 0 && (
                                <p className="text-[11px] text-muted-foreground text-center py-2">Sin actividad registrada.</p>
                            )}
                            {actividad.map(a => (
                                <div key={a.id_actividad} className="flex gap-2 text-[11px]">
                                    {TIPO_ACTIVIDAD_ICON[a.tipo] ?? <Circle size={10} className="mt-0.5 shrink-0 text-slate-500" />}
                                    <div className="min-w-0">
                                        <p className="text-foreground">{a.contenido}</p>
                                        <p className="text-muted-foreground">{fmt(a.creado_en)}{a.socio_nombre ? ` · ${a.socio_nombre}` : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Agregar comentario */}
                        <div className="mt-3 flex gap-2">
                            <textarea
                                value={comentario}
                                onChange={e => setComentario(e.target.value)}
                                placeholder="Comentario interno..."
                                rows={2}
                                className={`flex-1 ${inputCls}`}
                            />
                            <button onClick={handleComentario} disabled={!comentario.trim() || saving}
                                    className="px-3 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25 disabled:opacity-40 transition-colors">
                                <Send size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {emailModal && (
                <EmailModal
                    ticket={ticket}
                    tipo={emailModal}
                    socios={socios}
                    onClose={() => { setEmailModal(null); loadActividad(); }}
                />
            )}
        </>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const NEXUS_CACHE_KEY = 'ncf:nexus:v1';

function cacheLoad() {
    try { return JSON.parse(localStorage.getItem(NEXUS_CACHE_KEY) || 'null'); } catch { return null; }
}
function cacheSave(data) {
    try { localStorage.setItem(NEXUS_CACHE_KEY, JSON.stringify(data)); } catch {}
}

export default function Nexus() {
    const [tickets,  setTickets]  = useState([]);
    const [estados,  setEstados]  = useState([]);
    const [socios,   setSocios]   = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [filtroEstado,    setFiltroEstado]    = useState('');
    const [filtroPrioridad, setFiltroPrioridad] = useState('');
    const [busqueda,        setBusqueda]        = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) {
            // Carga stale desde localStorage para mostrar datos instantáneamente
            const cached = cacheLoad();
            if (cached) {
                setTickets(cached.tickets ?? []);
                setEstados(cached.estados ?? []);
                setSocios(cached.socios   ?? []);
                setLoading(false); // ya hay datos visibles
            } else {
                setLoading(true);
            }
        }
        try {
            const [t, e, s] = await Promise.all([
                soporteService.getTickets(),
                soporteService.getEstados(),
                getPartners().catch(() => []),
            ]);
            const tickets = Array.isArray(t) ? t : [];
            const estados = Array.isArray(e) ? e : [];
            const socios  = Array.isArray(s) ? s : [];
            setTickets(tickets);
            setEstados(estados);
            setSocios(socios);
            cacheSave({ tickets, estados, socios });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const ticketsFiltrados = tickets.filter(t => {
        if (filtroEstado    && t.id_estado !== Number(filtroEstado)) return false;
        if (filtroPrioridad && t.prioridad !== filtroPrioridad)      return false;
        if (busqueda) {
            const q = busqueda.toLowerCase();
            if (!t.numero_ticket?.toLowerCase().includes(q) &&
                !t.asunto?.toLowerCase().includes(q) &&
                !t.nombre_cliente?.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const handleCreated = (ticket) => {
        setShowModal(false);
        if (ticket) setTickets(prev => [ticket, ...prev]); // optimistic
        load(true); // refresca sin spinner
        setSelected(ticket);
    };

    const handleUpdated = (ticket) => {
        setTickets(prev => prev.map(t => t.id_ticket === ticket.id_ticket ? ticket : t));
        setSelected(ticket);
    };

    const selectCls = "h-8 px-2 text-[12px] bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500";

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Lista */}
            <div className={`flex flex-col ${selected ? 'hidden md:flex md:flex-1' : 'flex-1'}`}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <LifeBuoy size={20} className="text-sky-400" />
                            Nexus — Soporte
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Gestión de tickets de soporte técnico</p>
                    </div>
                    <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
                        <input
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            placeholder="Buscar ticket, cliente..."
                            className="h-8 px-3 text-[12px] bg-card border border-border rounded-lg text-foreground w-44 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className={selectCls}>
                            <option value="">Todos los estados</option>
                            {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                        </select>
                        <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)} className={selectCls}>
                            <option value="">Toda prioridad</option>
                            {Object.entries(PRIORIDAD).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button onClick={load} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-foreground/5">
                            <RefreshCw size={13} className={loading ? 'animate-spin text-muted-foreground' : 'text-foreground'} />
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="h-8 px-3 text-[12px] rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium flex items-center gap-1.5 transition-colors">
                            <Plus size={13} />
                            Nuevo ticket
                        </button>
                    </div>
                </div>

                {/* Tickets */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading && (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
                        ))
                    )}
                    {!loading && ticketsFiltrados.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                            <LifeBuoy size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No hay tickets {busqueda || filtroEstado || filtroPrioridad ? 'con ese filtro' : 'registrados'}.</p>
                        </div>
                    )}
                    {ticketsFiltrados.map(ticket => (
                        <button
                            key={ticket.id_ticket}
                            onClick={() => setSelected(ticket)}
                            className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                                selected?.id_ticket === ticket.id_ticket
                                    ? 'border-sky-500/50 bg-sky-500/8'
                                    : 'border-border bg-card hover:border-sky-500/30'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-mono text-sky-400">{ticket.numero_ticket}</span>
                                        <PrioridadBadge prioridad={ticket.prioridad} />
                                        {ticket.estado_nombre && (
                                            <EstadoBadge nombre={ticket.estado_nombre} color={ticket.estado_color} />
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-foreground truncate">{ticket.asunto}</p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        {ticket.nombre_cliente}
                                        {ticket.proyecto_nombre && <span className="text-sky-400/70"> · {ticket.proyecto_nombre}</span>}
                                        {ticket.responsable_nombre && ` · ${ticket.responsable_nombre}`}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] text-muted-foreground">{fmt(ticket.creado_en)}</p>
                                    {ticket.sla_vence_en && (
                                        <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5 justify-end">
                                            <Clock size={9} /> SLA {fmt(ticket.sla_vence_en)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Panel detalle */}
            {selected && (
                <div className={`${selected ? 'flex-1 md:flex-none md:w-[420px]' : 'hidden'} border-l border-border overflow-y-auto`}>
                    <TicketDetalle
                        key={selected.id_ticket}
                        ticket={selected}
                        estados={estados}
                        socios={socios}
                        onClose={() => setSelected(null)}
                        onUpdated={handleUpdated}
                    />
                </div>
            )}

            {/* Modal crear */}
            {showModal && (
                <TicketModal
                    estados={estados}
                    socios={socios}
                    onClose={() => setShowModal(false)}
                    onCreated={handleCreated}
                />
            )}
        </div>
    );
}
