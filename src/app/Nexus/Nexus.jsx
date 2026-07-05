'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Hammer, Plus, RefreshCw, X, ChevronRight,
    Clock, User, AlertTriangle, CheckCircle2, MessageSquare,
    Mail, Send, ChevronDown, Circle, LayoutGrid, List, Folder
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

    // Al seleccionar proyecto, pre-rellenar datos del cliente
    const handleProyecto = (val) => {
        set('id_proyecto', val);
        if (val) {
            const p = proyectos.find(x => String(x.id_proyecto) === val);
            if (p) {
                if (!form.nombre_cliente) set('nombre_cliente', p.nombre_cliente || p.nombre);
                if (!form.email_cliente  && p.email_cliente) set('email_cliente', p.email_cliente);
            }
        } else {
            // Al limpiar el proyecto, no borramos lo que ya escribió el usuario
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
                        <Hammer size={15} className="text-sky-400" />
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
    const [savingRes, setSavingRes]   = useState(false);
    const [resSaved, setResSaved]     = useState(false);
    const [resPopup, setResPopup]     = useState(null); // actividad.contenido a mostrar en popup
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
        setSavingRes(true);
        setResSaved(false);
        try {
            const { ticket: updated } = await soporteService.updateTicket(ticket.id_ticket, {
                resolucion_causa:         resolucion.causa,
                resolucion_accion:        resolucion.accion,
                resolucion_resultado:     resolucion.resultado,
                resolucion_observaciones: resolucion.observaciones,
            });
            onUpdated(updated);
            await loadActividad();
            setResSaved(true);
            setTimeout(() => setResSaved(false), 3000);
        } finally { setSavingRes(false); }
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

                        {/* Resolución guardada (solo lectura) */}
                        {ticket.resolucion_causa || ticket.resolucion_accion || ticket.resolucion_resultado ? (
                            <div className="bg-emerald-500/8 border border-emerald-500/25 rounded-xl p-3 space-y-2">
                                {ticket.resolucion_causa && (
                                    <div>
                                        <p className="text-[10px] text-emerald-400 font-semibold mb-0.5">Causa</p>
                                        <p className="text-[12px] text-foreground whitespace-pre-wrap">{ticket.resolucion_causa}</p>
                                    </div>
                                )}
                                {ticket.resolucion_accion && (
                                    <div>
                                        <p className="text-[10px] text-emerald-400 font-semibold mb-0.5">Acción realizada</p>
                                        <p className="text-[12px] text-foreground whitespace-pre-wrap">{ticket.resolucion_accion}</p>
                                    </div>
                                )}
                                {ticket.resolucion_resultado && (
                                    <div>
                                        <p className="text-[10px] text-emerald-400 font-semibold mb-0.5">Resultado</p>
                                        <p className="text-[12px] text-foreground whitespace-pre-wrap">{ticket.resolucion_resultado}</p>
                                    </div>
                                )}
                                {ticket.resolucion_observaciones && (
                                    <div>
                                        <p className="text-[10px] text-emerald-400 font-semibold mb-0.5">Observaciones</p>
                                        <p className="text-[12px] text-foreground whitespace-pre-wrap">{ticket.resolucion_observaciones}</p>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {/* Formulario edición */}
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
                        <button onClick={handleResolucion} disabled={savingRes}
                                className={`w-full py-1.5 text-[12px] rounded-lg border transition-colors ${
                                    resSaved
                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                                } disabled:opacity-50`}>
                            {savingRes ? 'Guardando...' : resSaved ? '✓ Guardada' : 'Guardar resolución'}
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
                            {actividad.map(a => {
                                const esResolucion = a.tipo === 'resolucion';
                                const tieneDetalle = esResolucion && a.contenido && a.contenido !== 'Resolución registrada';
                                return (
                                    <div key={a.id_actividad} className="flex gap-2 text-[11px]">
                                        {TIPO_ACTIVIDAD_ICON[a.tipo] ?? <Circle size={10} className="mt-0.5 shrink-0 text-slate-500" />}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-foreground">{esResolucion ? 'Resolución registrada' : a.contenido}</p>
                                                {tieneDetalle && (
                                                    <button
                                                        onClick={() => setResPopup(a.contenido)}
                                                        className="shrink-0 text-[10px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
                                                    >
                                                        Ver detalle
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground mt-0.5">{fmt(a.creado_en)}{a.socio_nombre ? ` · ${a.socio_nombre}` : ''}</p>
                                        </div>
                                    </div>
                                );
                            })}
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

            {/* Popup detalle resolución */}
            {resPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setResPopup(null)}>
                    <div className="bg-card border border-emerald-500/30 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                                <span className="text-sm font-semibold text-foreground">Detalle de resolución</span>
                            </div>
                            <button onClick={() => setResPopup(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                                {resPopup.split('\n').filter(Boolean).map((linea, i) => {
                                    const [etiqueta, ...resto] = linea.split(':');
                                    const valor = resto.join(':').trim();
                                    return valor ? (
                                        <div key={i}>
                                            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide mb-0.5">{etiqueta.trim()}</p>
                                            <p className="text-[12px] text-foreground whitespace-pre-wrap">{valor}</p>
                                        </div>
                                    ) : (
                                        <p key={i} className="text-[12px] text-foreground">{linea}</p>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Vista kanban por columnas ────────────────────────────────────────────────

function TicketKanbanCard({ ticket, onSelect, isSelected }) {
    const p = PRIORIDAD[ticket.prioridad] ?? PRIORIDAD.media;
    return (
        <div
            draggable
            onDragStart={e => {
                e.dataTransfer.setData('id_ticket', String(ticket.id_ticket));
                e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={() => onSelect(ticket)}
            className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all group ${
                isSelected
                    ? 'border-sky-500/60 bg-sky-500/8 shadow-md'
                    : 'bg-card border-border/60 hover:border-sky-500/40 hover:shadow-md hover:bg-secondary/20'
            }`}
        >
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${p.bg} ${p.color} ${p.border}`}>
                    {p.label}
                </span>
                <span className="text-[10px] font-mono text-sky-400/70">{ticket.numero_ticket}</span>
            </div>
            <p className="text-[13px] font-medium text-foreground leading-snug mb-2 line-clamp-2">{ticket.asunto}</p>
            {(ticket.proyecto_nombre || ticket.nombre_cliente) && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {ticket.proyecto_nombre && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            {ticket.proyecto_nombre}
                        </span>
                    )}
                    {!ticket.proyecto_nombre && ticket.nombre_cliente && (
                        <span className="text-[10px] text-muted-foreground">{ticket.nombre_cliente}</span>
                    )}
                </div>
            )}
            <div className="flex items-center justify-between gap-2 mt-1">
                {ticket.sla_vence_en ? (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400">
                        <Clock size={9} /> {fmt(ticket.sla_vence_en)}
                    </span>
                ) : <span />}
                {ticket.responsable_nombre && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <User size={9} /> {ticket.responsable_nombre}
                    </span>
                )}
            </div>
        </div>
    );
}

function TicketKanbanView({ tickets, estados, onSelect, selected, onMoveTicket }) {
    const [dragOver, setDragOver] = useState(null);
    return (
        <div className="flex gap-4 p-4 h-full overflow-x-auto items-start">
            {estados.map(estado => {
                const cols = tickets.filter(t => t.id_estado === estado.id_estado);
                const isOver = dragOver === estado.id_estado;
                return (
                    <div
                        key={estado.id_estado}
                        onDragOver={e => { e.preventDefault(); setDragOver(estado.id_estado); }}
                        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null); }}
                        onDrop={e => {
                            e.preventDefault();
                            const id = parseInt(e.dataTransfer.getData('id_ticket'), 10);
                            if (id) onMoveTicket(id, estado.id_estado);
                            setDragOver(null);
                        }}
                        className={`flex-none w-[270px] flex flex-col rounded-xl p-2 -m-2 transition-colors ${isOver ? 'bg-sky-500/6 ring-1 ring-inset ring-sky-500/30' : ''}`}
                    >
                        {/* Cabecera columna */}
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: estado.color_hex }} />
                            <span className="text-[12px] font-semibold text-foreground flex-1 truncate">{estado.nombre}</span>
                            <span className="text-[11px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-md font-medium">
                                {cols.length}
                            </span>
                        </div>
                        {/* Cards */}
                        <div className="space-y-2.5 min-h-[64px]">
                            {cols.map(ticket => (
                                <TicketKanbanCard
                                    key={ticket.id_ticket}
                                    ticket={ticket}
                                    onSelect={onSelect}
                                    isSelected={selected?.id_ticket === ticket.id_ticket}
                                />
                            ))}
                            {cols.length === 0 && (
                                <div className={`border-2 border-dashed rounded-xl h-16 flex items-center justify-center transition-colors ${isOver ? 'border-sky-500/40' : 'border-border/25'}`}>
                                    <span className="text-[11px] text-muted-foreground/50">Sin tickets</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Vista lista (estilo Synapse) ─────────────────────────────────────────────

function TicketListView({ tickets, estados, onSelect, selected }) {
    const grupos = estados
        .map(e => ({ estado: e, items: tickets.filter(t => t.id_estado === e.id_estado) }))
        .filter(g => g.items.length > 0);

    if (!tickets.length) {
        return (
            <div className="text-center py-16 text-muted-foreground text-sm">
                No hay tickets que coincidan con los filtros.
            </div>
        );
    }

    return (
        <div className="space-y-5 p-4">
            {grupos.map(({ estado, items }) => (
                <div key={estado.id_estado}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: estado.color_hex }} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {estado.nombre}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 ml-1">{items.length}</span>
                    </div>

                    <div className="space-y-1">
                        {items.map(t => {
                            const p = PRIORIDAD[t.prioridad] ?? PRIORIDAD.media;
                            const isSelected = selected?.id_ticket === t.id_ticket;
                            return (
                                <div
                                    key={t.id_ticket}
                                    onClick={() => onSelect(t)}
                                    className={`flex items-center gap-3 border rounded-xl px-4 py-2.5 cursor-pointer transition-all ${
                                        isSelected
                                            ? 'border-sky-500/50 bg-sky-500/8'
                                            : 'bg-card border-border/40 hover:border-sky-500/30 hover:bg-secondary/20'
                                    }`}
                                >
                                    <span className="text-[10px] font-mono text-sky-400 shrink-0 w-24">{t.numero_ticket}</span>
                                    <span className={`text-[10px] font-semibold shrink-0 ${p.color}`}>{p.label}</span>
                                    <span className="flex-1 text-sm font-medium text-foreground truncate">{t.asunto}</span>
                                    {t.proyecto_nombre && (
                                        <span className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                                            <Folder size={10} /> {t.proyecto_nombre}
                                        </span>
                                    )}
                                    {t.nombre_cliente && (
                                        <span className="hidden lg:flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                                            <User size={10} /> {t.nombre_cliente}
                                        </span>
                                    )}
                                    {t.responsable_nombre && (
                                        <span className="hidden xl:flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                                            <User size={10} /> {t.responsable_nombre}
                                        </span>
                                    )}
                                    {t.sla_vence_en && (
                                        <span className="hidden md:flex items-center gap-1 text-[11px] text-amber-400 shrink-0">
                                            <Clock size={10} /> {fmt(t.sla_vence_en)}
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
    const [view,     setView]     = useState('cards'); // 'cards' | 'list'

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

    const handleMoveTicket = async (id_ticket, id_estado) => {
        // Optimistic: mover la card de columna inmediatamente
        setTickets(prev => prev.map(t => t.id_ticket === id_ticket ? { ...t, id_estado } : t));
        if (selected?.id_ticket === id_ticket) setSelected(s => ({ ...s, id_estado }));
        try {
            await soporteService.updateTicket(id_ticket, { id_estado });
            load(true); // refresca en background para obtener el estado_nombre actualizado
        } catch {
            load(true); // revierte si falla
        }
    };

    const selectCls = "h-8 px-2 text-[12px] bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500";

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Panel izquierdo */}
            <div className={`flex flex-col ${selected ? 'hidden md:flex md:flex-1' : 'flex-1'} min-w-0`}>

                {/* Fila 1: Título + botón nuevo */}
                <div className="px-5 py-3 border-b border-border flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <Hammer size={18} className="text-sky-400 shrink-0" />
                        <div className="min-w-0">
                            <h1 className="text-base font-bold text-foreground truncate">Nexus — Soporte</h1>
                            <p className="text-[11px] text-muted-foreground">Gestión de tickets de soporte técnico</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="ml-auto shrink-0 h-8 px-3 text-[12px] rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium flex items-center gap-1.5 transition-colors">
                        <Plus size={13} />
                        Nuevo ticket
                    </button>
                </div>

                {/* Fila 2: Filtros + toggles + refresh */}
                <div className="px-4 py-2 border-b border-border flex items-center gap-2 flex-wrap shrink-0">
                    <input
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar ticket, cliente..."
                        className="h-8 px-3 text-[12px] bg-card border border-border rounded-lg text-foreground w-40 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className={selectCls}>
                        <option value="">Todos los estados</option>
                        {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                    </select>
                    <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)} className={selectCls}>
                        <option value="">Toda prioridad</option>
                        {Object.entries(PRIORIDAD).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <div className="flex items-center rounded-lg border border-border overflow-hidden ml-auto">
                        <button onClick={() => setView('cards')} className={`h-8 w-8 flex items-center justify-center transition-colors ${view === 'cards' ? 'bg-sky-500/15 text-sky-400' : 'bg-card text-muted-foreground hover:text-foreground'}`}>
                            <LayoutGrid size={13} />
                        </button>
                        <button onClick={() => setView('list')} className={`h-8 w-8 flex items-center justify-center transition-colors ${view === 'list' ? 'bg-sky-500/15 text-sky-400' : 'bg-card text-muted-foreground hover:text-foreground'}`}>
                            <List size={13} />
                        </button>
                    </div>
                    <button onClick={load} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-foreground/5">
                        <RefreshCw size={13} className={loading ? 'animate-spin text-muted-foreground' : 'text-foreground'} />
                    </button>
                </div>

                {/* Tickets */}
                <div className={`flex-1 min-h-0 ${view === 'cards' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto'}`}>
                    {loading && (
                        <div className="p-4 space-y-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
                            ))}
                        </div>
                    )}
                    {!loading && ticketsFiltrados.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                            <Hammer size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No hay tickets {busqueda || filtroEstado || filtroPrioridad ? 'con ese filtro' : 'registrados'}.</p>
                        </div>
                    )}

                    {/* Vista kanban por columnas */}
                    {!loading && view === 'cards' && (
                        <TicketKanbanView
                            tickets={ticketsFiltrados}
                            estados={estados}
                            selected={selected}
                            onSelect={setSelected}
                            onMoveTicket={handleMoveTicket}
                        />
                    )}

                    {/* Vista lista agrupada por estado */}
                    {!loading && view === 'list' && ticketsFiltrados.length > 0 && (
                        <TicketListView
                            tickets={ticketsFiltrados}
                            estados={estados}
                            selected={selected}
                            onSelect={setSelected}
                        />
                    )}
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
