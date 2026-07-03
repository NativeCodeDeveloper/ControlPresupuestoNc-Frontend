'use client';
import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Video, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    CATEGORIAS, COLORES, TAGS_PRESET, RECORDATORIO_OPTS, COLOR_MAP, toDatetimeLocal
} from './calUtils';

const EMPTY = {
    titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '',
    todo_el_dia: false, categoria: 'reunion', color: 'blue',
    meet_link: '', tags: [], recordatorios: [], participantes: [],
};

export default function EventModal({ event, teams = [], onClose, onSave, onDelete }) {
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState('');

    useEffect(() => {
        if (event) {
            setForm({
                titulo:       event.titulo || '',
                descripcion:  event.descripcion || '',
                fecha_inicio: event.fecha_inicio ? toDatetimeLocal(new Date(event.fecha_inicio)) : '',
                fecha_fin:    event.fecha_fin    ? toDatetimeLocal(new Date(event.fecha_fin))    : '',
                todo_el_dia:  !!event.todo_el_dia,
                categoria:    event.categoria || 'reunion',
                color:        event.color     || 'blue',
                meet_link:    event.meet_link  || '',
                tags:         event.tags        || [],
                participantes: event.participantes || [],
                recordatorios: (event.recordatorios || []).map(r => ({
                    minutos_antes: r.minutos_antes,
                    tipo: r.tipo || 'email',
                })),
            });
        } else {
            const start = defaultDate ? new Date(defaultDate) : new Date();
            start.setSeconds(0, 0);
            if (!defaultDate) start.setMinutes(0); // redondear al inicio de la hora actual
            const end = new Date(start); end.setHours(end.getHours() + 1);
            setForm({ ...EMPTY, fecha_inicio: toDatetimeLocal(start), fecha_fin: toDatetimeLocal(end) });
        }
    }, [event]);

    function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

    function toggleTag(tag) {
        setForm(f => ({
            ...f,
            tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
        }));
    }

    function toggleTeam(team) {
        setForm(f => {
            const exists = f.participantes.some(p => p.tipo === 'team' && p.id_referencia === team.id_team);
            return {
                ...f,
                participantes: exists
                    ? f.participantes.filter(p => !(p.tipo === 'team' && p.id_referencia === team.id_team))
                    : [...f.participantes, { tipo: 'team', id_referencia: team.id_team, nombre: team.nombre }],
            };
        });
    }

    function addRecordatorio() {
        const used = new Set(form.recordatorios.map(r => r.minutos_antes));
        const next = RECORDATORIO_OPTS.find(o => !used.has(o.value));
        if (!next) return;
        setForm(f => ({ ...f, recordatorios: [...f.recordatorios, { minutos_antes: next.value, tipo: 'email' }] }));
    }

    function removeRecordatorio(idx) {
        setForm(f => ({ ...f, recordatorios: f.recordatorios.filter((_, i) => i !== idx) }));
    }

    function updateRecordatorio(idx, key, val) {
        setForm(f => ({
            ...f,
            recordatorios: f.recordatorios.map((r, i) =>
                i === idx ? { ...r, [key]: key === 'minutos_antes' ? Number(val) : val } : r
            ),
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.titulo.trim()) return;
        setSaving(true);
        setError('');
        try {
            // Convertir datetime-local (sin zona) a ISO UTC para que backend guarde en UTC
            await onSave({
                ...form,
                fecha_inicio: form.fecha_inicio ? new Date(form.fecha_inicio).toISOString() : form.fecha_inicio,
                fecha_fin:    form.fecha_fin    ? new Date(form.fecha_fin).toISOString()    : form.fecha_fin,
            });
        } catch (err) {
            setError(err?.message || 'Error al guardar el evento');
        } finally {
            setSaving(false);
        }
    }

    const isReadonly = event?.readonly;
    const C = COLOR_MAP[form.color] || COLOR_MAP.blue;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-background border border-border/60 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-0">
                    <h2 className="text-base font-semibold text-foreground">
                        {isReadonly ? 'Detalle del evento' : event?.id ? 'Editar evento' : 'Nuevo evento'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">

                    {/* Título */}
                    <div>
                        <input
                            type="text"
                            placeholder="Título del evento"
                            value={form.titulo}
                            onChange={e => set('titulo', e.target.value)}
                            disabled={isReadonly}
                            required
                            className="w-full bg-foreground/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors disabled:opacity-60"
                        />
                    </div>

                    {/* Descripción */}
                    <textarea
                        placeholder="Descripción (opcional)"
                        value={form.descripcion}
                        onChange={e => set('descripcion', e.target.value)}
                        disabled={isReadonly}
                        rows={2}
                        className="w-full bg-foreground/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors resize-none disabled:opacity-60"
                    />

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Inicio</label>
                            <input type="datetime-local" value={form.fecha_inicio}
                                onChange={e => set('fecha_inicio', e.target.value)}
                                disabled={isReadonly}
                                className="w-full bg-foreground/5 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors disabled:opacity-60"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Fin</label>
                            <input type="datetime-local" value={form.fecha_fin}
                                onChange={e => set('fecha_fin', e.target.value)}
                                disabled={isReadonly}
                                className="w-full bg-foreground/5 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* Todo el día */}
                    {!isReadonly && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.todo_el_dia}
                                onChange={e => set('todo_el_dia', e.target.checked)}
                                className="rounded accent-indigo-500"
                            />
                            <span className="text-xs text-muted-foreground">Todo el día</span>
                        </label>
                    )}

                    {/* Categoría + Color */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Categoría</label>
                            <select value={form.categoria} onChange={e => set('categoria', e.target.value)}
                                disabled={isReadonly}
                                className="w-full bg-foreground/5 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-indigo-500/60 transition-colors disabled:opacity-60">
                                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">Color</label>
                            <select value={form.color} onChange={e => set('color', e.target.value)}
                                disabled={isReadonly}
                                className="w-full bg-foreground/5 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-indigo-500/60 transition-colors disabled:opacity-60">
                                {COLORES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Meet link */}
                    {!isReadonly && (
                        <div className="flex items-center gap-2">
                            <Video size={14} className="text-muted-foreground shrink-0" />
                            <input type="url" placeholder="Link de Meet (opcional)"
                                value={form.meet_link}
                                onChange={e => set('meet_link', e.target.value)}
                                className="flex-1 bg-foreground/5 border border-border/50 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/60 transition-colors"
                            />
                        </div>
                    )}
                    {isReadonly && form.meet_link && (
                        <a href={form.meet_link} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-indigo-400 hover:underline">
                            <Video size={13} /> Unirse a la reunión
                        </a>
                    )}

                    {/* Tags */}
                    <div>
                        <label className="text-[11px] text-muted-foreground mb-1.5 block">Tags</label>
                        <div className="flex flex-wrap gap-1.5">
                            {TAGS_PRESET.map(tag => (
                                <button key={tag} type="button"
                                    disabled={isReadonly}
                                    onClick={() => toggleTag(tag)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border",
                                        form.tags.includes(tag)
                                            ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40"
                                            : "bg-foreground/5 text-muted-foreground border-border/40 hover:border-foreground/30"
                                    )}>
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Participantes / Equipos */}
                    {teams.length > 0 && (
                        <div>
                            <label className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1 block">
                                <Users size={11} /> Participantes
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {teams.map(team => {
                                    const selected = form.participantes.some(
                                        p => p.tipo === 'team' && p.id_referencia === team.id_team
                                    );
                                    return (
                                        <button key={team.id_team} type="button"
                                            disabled={isReadonly}
                                            onClick={() => toggleTeam(team)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border",
                                                selected
                                                    ? "bg-violet-500/20 text-violet-400 border-violet-500/40"
                                                    : "bg-foreground/5 text-muted-foreground border-border/40 hover:border-foreground/30"
                                            )}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                            {team.nombre}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Recordatorios */}
                    {!isReadonly && (
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] text-muted-foreground">Recordatorios</label>
                                {form.recordatorios.length < RECORDATORIO_OPTS.length && (
                                    <button type="button" onClick={addRecordatorio}
                                        className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
                                        <Plus size={11} /> Agregar
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {form.recordatorios.map((r, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <select value={r.minutos_antes}
                                            onChange={e => updateRecordatorio(idx, 'minutos_antes', e.target.value)}
                                            className="flex-1 bg-foreground/5 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-indigo-500/60 transition-colors">
                                            {RECORDATORIO_OPTS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                        <select value={r.tipo}
                                            onChange={e => updateRecordatorio(idx, 'tipo', e.target.value)}
                                            className="bg-foreground/5 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-indigo-500/60 transition-colors">
                                            <option value="email">Email</option>
                                            <option value="inapp">In-app</option>
                                        </select>
                                        <button type="button" onClick={() => removeRecordatorio(idx)}
                                            className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                    )}

                    {/* Acciones */}
                    {!isReadonly && (
                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                            {event?.id && !event?.readonly ? (
                                <button type="button" onClick={() => onDelete(event.id)}
                                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
                                    <Trash2 size={13} /> Eliminar
                                </button>
                            ) : <div />}
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={onClose}
                                    className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground border border-border/50 rounded-lg transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-60 font-medium">
                                    {saving ? 'Guardando…' : event?.id ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </div>
                    )}
                    {isReadonly && (
                        <div className="flex justify-end pt-2 border-t border-border/30">
                            <button type="button" onClick={onClose}
                                className="px-4 py-2 text-xs border border-border/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                                Cerrar
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
