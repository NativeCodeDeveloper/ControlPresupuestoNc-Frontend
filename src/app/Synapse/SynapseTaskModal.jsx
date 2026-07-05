'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    X, Save, Trash2, MessageSquare, Send, Calendar, Link2,
    User, Tag, AlertCircle, ChevronDown, Check, Loader2, ArrowLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';
import * as synapseService from '../../services/synapseService';
import AdjuntosPanel from '../../components/AdjuntosPanel';

const PRIORIDADES = [
    { val: 'baja',    label: 'Baja',    color: '#6B7280' },
    { val: 'media',   label: 'Media',   color: '#3B82F6' },
    { val: 'alta',    label: 'Alta',    color: '#F59E0B' },
    { val: 'urgente', label: 'Urgente', color: '#EF4444' },
];

const TIPOS = [
    { val: 'tarea',   label: 'Tarea' },
    { val: 'ticket',  label: 'Ticket' },
    { val: 'bug',     label: 'Bug' },
    { val: 'feature', label: 'Feature' },
    { val: 'soporte', label: 'Soporte' },
];

const TODAY = new Date().toISOString().split('T')[0];

function SelectField({ label, value, onChange, options, placeholder, icon: Icon }) {
    return (
        <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">{label}</label>
            <div className="relative">
                {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />}
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(
                        "w-full text-sm bg-background border border-border/60 rounded-lg py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-colors text-foreground",
                        Icon ? "pl-9" : "pl-3"
                    )}
                >
                    <option value="">{placeholder || 'Seleccionar...'}</option>
                    {options.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
        </div>
    );
}

export default function SynapseTaskModal({ tarea, estados, initialEstadoId, initialTeamId = null, onClose, onSaved, onDeleted }) {
    const isNew = !tarea?.id_tarea;

    const [form, setForm] = useState({
        titulo: tarea?.titulo || '',
        descripcion: tarea?.descripcion || '',
        id_estado: tarea?.id_estado || initialEstadoId || estados[0]?.id_estado || '',
        id_proyecto: tarea?.id_proyecto || '',
        id_asignado: tarea?.id_asignado || '',
        id_team: tarea?.id_team || initialTeamId || '',
        prioridad: tarea?.prioridad || 'media',
        tipo: tarea?.tipo || 'tarea',
        fecha_ingreso: tarea?.fecha_ingreso?.split('T')[0] || TODAY,
        fecha_vencimiento: tarea?.fecha_vencimiento?.split('T')[0] || '',
        etiqueta_ids: tarea?.etiquetas?.map(e => e.id_etiqueta) || [],
    });

    const [proyectos, setProyectos] = useState([]);
    const [socios, setSocios] = useState([]);
    const [etiquetas, setEtiquetas] = useState([]);
    const [teams, setTeams] = useState([]);
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [sendingComment, setSendingComment] = useState(false);
    const [error, setError] = useState('');
    const comentariosEndRef = useRef(null);

    useEffect(() => {
        Promise.all([
            synapseService.getMetaProyectos(),
            synapseService.getMetaSocios(),
            synapseService.getEtiquetas(),
            synapseService.getTeams(),
        ]).then(([p, s, e, tms]) => {
            setProyectos(Array.isArray(p) ? p : []);
            setSocios(Array.isArray(s) ? s : []);
            setEtiquetas(Array.isArray(e) ? e : []);
            setTeams(Array.isArray(tms) ? tms : []);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (!isNew) {
            synapseService.getComentarios(tarea.id_tarea)
                .then(c => setComentarios(Array.isArray(c) ? c : []))
                .catch(() => {});
        }
    }, [tarea?.id_tarea, isNew]);

    useEffect(() => {
        comentariosEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comentarios]);

    const set = useCallback((key, val) => setForm(f => ({ ...f, [key]: val })), []);

    const toggleEtiqueta = (id) => {
        setForm(f => ({
            ...f,
            etiqueta_ids: f.etiqueta_ids.includes(id)
                ? f.etiqueta_ids.filter(e => e !== id)
                : [...f.etiqueta_ids, id],
        }));
    };

    const handleSave = async () => {
        if (!form.titulo.trim()) { setError('El título es requerido.'); return; }
        setError('');

        const payload = {
            ...form,
            titulo: form.titulo.trim(),
            descripcion: form.descripcion.trim() || null,
            id_proyecto: form.id_proyecto || null,
            id_asignado: form.id_asignado || null,
            fecha_vencimiento: form.fecha_vencimiento || null,
        };

        if (isNew) {
            const tempId = `temp_${Date.now()}`;
            onSaved({ ...payload, id_tarea: tempId, _temp: true });
            try {
                const result = await synapseService.createTarea(payload);
                onSaved({ ...result, _replaceTempId: tempId });
            } catch (e) {
                onDeleted(tempId);
            }
        } else {
            onSaved({ ...tarea, ...payload, id_tarea: tarea.id_tarea });
            try {
                const result = await synapseService.updateTarea(tarea.id_tarea, payload);
                onSaved(result);
            } catch (e) {
                onSaved(tarea);
            }
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Eliminar esta tarea? La acción no se puede deshacer.')) return;
        setDeleting(true);
        try {
            await synapseService.deleteTarea(tarea.id_tarea);
            onDeleted(tarea.id_tarea);
        } catch (e) {
            setError(e.message || 'Error al eliminar');
            setDeleting(false);
        }
    };

    const handleSendComentario = async () => {
        if (!nuevoComentario.trim() || sendingComment) return;
        setSendingComment(true);
        try {
            await synapseService.createComentario(tarea.id_tarea, nuevoComentario.trim());
            const updated = await synapseService.getComentarios(tarea.id_tarea);
            setComentarios(Array.isArray(updated) ? updated : []);
            setNuevoComentario('');
        } catch (e) {
            setError(e.message || 'Error al enviar comentario');
        } finally {
            setSendingComment(false);
        }
    };

    const handleDeleteComentario = async (id_comentario) => {
        try {
            await synapseService.deleteComentario(tarea.id_tarea, id_comentario);
            setComentarios(c => c.filter(x => x.id_comentario !== id_comentario));
        } catch (e) {
            setError(e.message || 'Error al eliminar comentario');
        }
    };

    const estadoActual = estados.find(e => String(e.id_estado) === String(form.id_estado));

    return (
        <>
        {/* ── MÓVIL: pantalla completa estilo Linear ── */}
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-background">

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
                <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors shrink-0">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {estadoActual && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: estadoActual.color_hex }} />}
                    <span className="text-xs text-muted-foreground font-mono truncate">
                        {isNew ? 'Nueva tarea' : `#${tarea.id_tarea}`}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {!isNew && (
                        <button onClick={handleDelete} disabled={deleting} className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg transition-colors">
                            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                    )}
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition-colors">
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        {isNew ? 'Crear' : 'Guardar'}
                    </button>
                </div>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-y-auto">

                {/* Título */}
                <div className="px-4 pt-5 pb-2">
                    <input
                        type="text"
                        value={form.titulo}
                        onChange={(e) => set('titulo', e.target.value)}
                        placeholder="Título de la tarea..."
                        className="w-full text-[20px] font-bold bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground/40 leading-snug"
                    />
                </div>

                {/* Propiedades como chips */}
                <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-border/20">

                    {/* Estado */}
                    <div className="relative">
                        {estadoActual && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none" style={{ background: estadoActual.color_hex }} />}
                        <select value={String(form.id_estado)} onChange={(e) => set('id_estado', e.target.value)}
                            className="text-xs bg-secondary border border-border/50 rounded-full pl-6 pr-6 py-1.5 appearance-none focus:outline-none text-foreground">
                            {estados.map(e => <option key={e.id_estado} value={String(e.id_estado)}>{e.nombre}</option>)}
                        </select>
                        <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* Prioridad */}
                    <div className="relative">
                        <select value={form.prioridad} onChange={(e) => set('prioridad', e.target.value)}
                            className="text-xs bg-secondary border border-border/50 rounded-full px-3 pr-6 py-1.5 appearance-none focus:outline-none text-foreground">
                            {PRIORIDADES.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
                        </select>
                        <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* Tipo */}
                    <div className="relative">
                        <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}
                            className="text-xs bg-secondary border border-border/50 rounded-full px-3 pr-6 py-1.5 appearance-none focus:outline-none text-foreground">
                            {TIPOS.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
                        </select>
                        <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* Asignado */}
                    {socios.length > 0 && (
                        <div className="relative">
                            <User size={9} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <select value={String(form.id_asignado || '')} onChange={(e) => set('id_asignado', e.target.value ? parseInt(e.target.value) : '')}
                                className="text-xs bg-secondary border border-border/50 rounded-full pl-6 pr-6 py-1.5 appearance-none focus:outline-none text-foreground">
                                <option value="">Sin asignar</option>
                                {socios.map(s => <option key={s.id_socio} value={String(s.id_socio)}>{s.nombre}</option>)}
                            </select>
                            <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    )}

                    {/* Proyecto */}
                    {proyectos.length > 0 && (
                        <div className="relative">
                            <Link2 size={9} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <select value={String(form.id_proyecto || '')} onChange={(e) => set('id_proyecto', e.target.value ? parseInt(e.target.value) : '')}
                                className="text-xs bg-secondary border border-border/50 rounded-full pl-6 pr-6 py-1.5 appearance-none focus:outline-none text-foreground">
                                <option value="">Sin proyecto</option>
                                {proyectos.map(p => <option key={p.id_proyecto} value={String(p.id_proyecto)}>{p.nombre}</option>)}
                            </select>
                            <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    )}

                    {/* Fecha vencimiento */}
                    <div className="relative">
                        <Calendar size={9} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input type="date" value={form.fecha_vencimiento} onChange={(e) => set('fecha_vencimiento', e.target.value)}
                            className="text-xs bg-secondary border border-border/50 rounded-full pl-6 pr-3 py-1.5 focus:outline-none text-foreground" />
                    </div>

                    {/* Etiquetas */}
                    {etiquetas.length > 0 && etiquetas.map(et => {
                        const active = form.etiqueta_ids.includes(et.id_etiqueta);
                        return (
                            <button key={et.id_etiqueta} onClick={() => toggleEtiqueta(et.id_etiqueta)}
                                className={cn("flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-full border transition-all",
                                    active ? "border-transparent text-white" : "border-border/50 text-muted-foreground")}
                                style={active ? { background: et.color_hex } : {}}>
                                {active && <Check size={9} />}{et.nombre}
                            </button>
                        );
                    })}
                </div>

                {/* Descripción */}
                <div className="px-4 py-4">
                    <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Descripción</p>
                    <textarea value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)}
                        placeholder="Describe la tarea, contexto, pasos a seguir..."
                        rows={8}
                        className="w-full text-sm bg-secondary/30 border border-border/40 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-foreground placeholder:text-muted-foreground/40 resize-none transition-colors min-h-[200px]" />
                </div>

                {/* Comentarios */}
                {!isNew && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare size={13} className="text-muted-foreground" />
                            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                Notas ({comentarios.length})
                            </span>
                        </div>
                        {comentarios.length > 0 && (
                            <div className="space-y-2">
                                {comentarios.map(c => (
                                    <div key={c.id_comentario} className="group bg-secondary/30 border border-border/30 rounded-xl px-3 py-2.5 relative">
                                        <p className="text-sm text-foreground whitespace-pre-wrap pr-6">{c.contenido}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {new Date(c.creado_en).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <button onClick={() => handleDeleteComentario(c.id_comentario)}
                                            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-red-400 rounded transition-colors">
                                            <X size={11} />
                                        </button>
                                    </div>
                                ))}
                                <div ref={comentariosEndRef} />
                            </div>
                        )}
                        <div className="flex gap-2">
                            <textarea value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendComentario(); }}
                                placeholder="Agregar nota... (Ctrl+Enter para enviar)" rows={2}
                                className="flex-1 text-sm bg-background border border-border/60 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-foreground placeholder:text-muted-foreground/40 resize-none transition-colors" />
                            <button onClick={handleSendComentario} disabled={!nuevoComentario.trim() || sendingComment}
                                className="self-end p-4 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white rounded-xl transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center">
                                {sendingComment ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Adjuntos */}
                {!isNew && tarea?.id_tarea && (
                    <div className="px-4 pb-6 border-t border-border/30 pt-4">
                        <AdjuntosPanel entidad="tarea" idEntidad={tarea.id_tarea} compact />
                    </div>
                )}

                {error && (
                    <div className="px-4 pb-4 flex items-center gap-2 text-red-400 text-xs">
                        <AlertCircle size={13} /><span>{error}</span>
                    </div>
                )}
            </div>
        </div>

        {/* ── DESKTOP: modal overlay (sin cambios) ── */}
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-secondary/20 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {estadoActual && (
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: estadoActual.color_hex }}
                            />
                        )}
                        <span className="text-sm font-semibold text-foreground truncate">
                            {isNew ? 'Nueva tarea' : `#${tarea.id_tarea} · ${tarea.titulo}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {!isNew && (
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                        )}
                        <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-foreground/8 rounded-lg transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 min-h-0 overflow-hidden">

                    {/* Left: Title + Description + Comments */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-6 space-y-5">

                        {/* Título */}
                        <div>
                            <input
                                type="text"
                                value={form.titulo}
                                onChange={(e) => set('titulo', e.target.value)}
                                placeholder="Título de la tarea..."
                                className="w-full text-lg font-semibold bg-transparent border-0 border-b border-border/40 focus:border-violet-500/60 pb-2 focus:outline-none text-foreground placeholder:text-muted-foreground/50 transition-colors"
                            />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Descripción</label>
                            <textarea
                                value={form.descripcion}
                                onChange={(e) => set('descripcion', e.target.value)}
                                placeholder="Describe la tarea, contexto, pasos a seguir..."
                                rows={8}
                                className="w-full text-sm bg-background border border-border/60 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 text-foreground placeholder:text-muted-foreground/40 resize-none transition-colors min-h-[220px]"
                            />
                        </div>

                        {/* Comentarios (solo en edición) */}
                        {!isNew && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={14} className="text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Notas y actividad ({comentarios.length})
                                    </span>
                                </div>

                                {comentarios.length > 0 && (
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {comentarios.map(c => (
                                            <div key={c.id_comentario} className="group bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 relative">
                                                <p className="text-sm text-foreground whitespace-pre-wrap">{c.contenido}</p>
                                                <p className="text-[11px] text-muted-foreground mt-1.5">
                                                    {new Date(c.creado_en).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <button
                                                    onClick={() => handleDeleteComentario(c.id_comentario)}
                                                    className="absolute top-2 right-2 p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 rounded transition-all"
                                                >
                                                    <X size={11} />
                                                </button>
                                            </div>
                                        ))}
                                        <div ref={comentariosEndRef} />
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <textarea
                                        value={nuevoComentario}
                                        onChange={(e) => setNuevoComentario(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendComentario(); }}
                                        placeholder="Agregar nota... (Ctrl+Enter para enviar)"
                                        rows={2}
                                        className="flex-1 text-sm bg-background border border-border/60 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 text-foreground placeholder:text-muted-foreground/40 resize-none transition-colors"
                                    />
                                    <button
                                        onClick={handleSendComentario}
                                        disabled={!nuevoComentario.trim() || sendingComment}
                                        className="self-end p-3 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white rounded-xl transition-colors"
                                    >
                                        {sendingComment ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Metadata panel */}
                    <div className="w-72 shrink-0 border-l border-border/40 bg-secondary/10 overflow-y-auto p-5 space-y-5">

                        {/* Estado */}
                        <SelectField
                            label="Estado"
                            value={String(form.id_estado)}
                            onChange={(v) => set('id_estado', v)}
                            options={estados.map(e => ({ value: String(e.id_estado), label: e.nombre }))}
                        />

                        {/* Prioridad */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Prioridad</label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {PRIORIDADES.map(p => (
                                    <button
                                        key={p.val}
                                        onClick={() => set('prioridad', p.val)}
                                        className={cn(
                                            "text-xs py-1.5 px-2 rounded-lg border transition-all font-medium",
                                            form.prioridad === p.val
                                                ? "border-transparent text-white"
                                                : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                                        )}
                                        style={form.prioridad === p.val ? { background: p.color } : {}}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tipo */}
                        <SelectField
                            label="Tipo"
                            value={form.tipo}
                            onChange={(v) => set('tipo', v)}
                            options={TIPOS.map(t => ({ value: t.val, label: t.label }))}
                        />

                        {/* Proyecto */}
                        <SelectField
                            label="Proyecto vinculado"
                            value={String(form.id_proyecto || '')}
                            onChange={(v) => set('id_proyecto', v ? parseInt(v) : '')}
                            placeholder="Sin proyecto"
                            icon={Link2}
                            options={proyectos.map(p => ({ value: String(p.id_proyecto), label: p.nombre }))}
                        />

                        {/* Asignado */}
                        <SelectField
                            label="Asignado a"
                            value={String(form.id_asignado || '')}
                            onChange={(v) => set('id_asignado', v ? parseInt(v) : '')}
                            placeholder="Sin asignar"
                            icon={User}
                            options={socios.map(s => ({ value: String(s.id_socio), label: s.nombre }))}
                        />

                        {/* Equipo */}
                        {teams.length > 0 && (
                            <SelectField
                                label="Equipo"
                                value={String(form.id_team || '')}
                                onChange={(v) => set('id_team', v ? parseInt(v) : '')}
                                placeholder="Sin equipo"
                                options={teams.map(tm => ({ value: String(tm.id_team), label: `${tm.emoji} ${tm.nombre}` }))}
                            />
                        )}

                        {/* Fechas */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                                    <Calendar size={11} /> Fecha ingreso
                                </label>
                                <input
                                    type="date"
                                    value={form.fecha_ingreso}
                                    onChange={(e) => set('fecha_ingreso', e.target.value)}
                                    className="w-full text-sm bg-background border border-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 text-foreground transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                                    <Calendar size={11} /> Fecha vencimiento
                                </label>
                                <input
                                    type="date"
                                    value={form.fecha_vencimiento}
                                    onChange={(e) => set('fecha_vencimiento', e.target.value)}
                                    className="w-full text-sm bg-background border border-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 text-foreground transition-colors"
                                />
                            </div>
                        </div>

                        {/* Etiquetas */}
                        {etiquetas.length > 0 && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block flex items-center gap-1">
                                    <Tag size={11} /> Etiquetas
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {etiquetas.map(et => {
                                        const active = form.etiqueta_ids.includes(et.id_etiqueta);
                                        return (
                                            <button
                                                key={et.id_etiqueta}
                                                onClick={() => toggleEtiqueta(et.id_etiqueta)}
                                                className={cn(
                                                    "text-[11px] font-medium px-2 py-1 rounded-full border transition-all flex items-center gap-1",
                                                    active ? "border-transparent text-white" : "border-border/50 text-muted-foreground hover:border-border"
                                                )}
                                                style={active ? { background: et.color_hex } : {}}
                                            >
                                                {active && <Check size={9} />}
                                                {et.nombre}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Adjuntos — solo en tareas existentes */}
                {!isNew && tarea?.id_tarea && (
                    <div className="px-6 pb-4 border-t border-border/30 pt-4">
                        <AdjuntosPanel entidad="tarea" idEntidad={tarea.id_tarea} compact />
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/50 bg-secondary/10 shrink-0 flex items-center justify-between gap-3">
                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-xs">
                            <AlertCircle size={13} />
                            <span>{error}</span>
                        </div>
                    )}
                    {!error && <span />}
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border/50 rounded-xl hover:bg-foreground/5 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-xl transition-colors"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {isNew ? 'Crear tarea' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
