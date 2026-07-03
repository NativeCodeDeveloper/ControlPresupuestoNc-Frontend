'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Brain, Plus, Search, RefreshCw, Loader2, LayoutGrid, List,
    Flag, Folder, User, Clock, ChevronDown, Filter, X, Check
} from 'lucide-react';
import { cn } from '../../lib/utils';
import * as synapseService from '../../services/synapseService';
import SynapseTaskModal from './SynapseTaskModal';

// ── Constantes ────────────────────────────────────────────────────────────────

const PRIORIDAD_CONFIG = {
    baja:    { label: 'Baja',    color: '#6B7280' },
    media:   { label: 'Media',   color: '#3B82F6' },
    alta:    { label: 'Alta',    color: '#F59E0B' },
    urgente: { label: 'Urgente', color: '#EF4444' },
};

const TIPO_CONFIG = {
    tarea:   { label: 'Tarea',   emoji: '✓' },
    ticket:  { label: 'Ticket',  emoji: '🎫' },
    bug:     { label: 'Bug',     emoji: '🐛' },
    feature: { label: 'Feature', emoji: '✦' },
    soporte: { label: 'Soporte', emoji: '⚙' },
};

// ── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({ tarea, onClick, dragging, onDragStart, onDragEnd }) {
    const prio = PRIORIDAD_CONFIG[tarea.prioridad] || PRIORIDAD_CONFIG.media;
    const tipo = TIPO_CONFIG[tarea.tipo] || TIPO_CONFIG.tarea;

    const isOverdue = tarea.fecha_vencimiento && !tarea.fecha_completado &&
        new Date(tarea.fecha_vencimiento) < new Date(new Date().toDateString());

    const formatDate = (d) => {
        if (!d) return null;
        return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
            className={cn(
                "bg-card border border-border/50 rounded-xl p-3.5 cursor-grab active:cursor-grabbing",
                "hover:border-violet-500/40 hover:shadow-md transition-all duration-150 select-none group",
                dragging && "opacity-40 scale-[0.98]"
            )}
        >
            {/* Top row */}
            <div className="flex items-start gap-2 mb-2.5">
                <span
                    className="text-[10px] font-semibold shrink-0 mt-0.5"
                    title={prio.label}
                    style={{ color: prio.color }}
                >
                    ● {prio.label}
                </span>
                <div className="flex flex-wrap gap-1 ml-auto">
                    <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-foreground/6 text-muted-foreground"
                        title={tipo.label}
                    >
                        {tipo.emoji} {tipo.label}
                    </span>
                </div>
            </div>

            {/* Título */}
            <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 mb-2">
                {tarea.titulo}
            </p>

            {/* Etiquetas */}
            {tarea.etiquetas?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {tarea.etiquetas.map(et => (
                        <span
                            key={et.id_etiqueta}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ background: et.color_hex + '22', color: et.color_hex }}
                        >
                            {et.nombre}
                        </span>
                    ))}
                </div>
            )}

            {/* Proyecto vinculado */}
            {tarea.proyecto_nombre && (
                <div className="flex items-center gap-1 mb-2">
                    <Folder size={10} className="text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">{tarea.proyecto_nombre}</span>
                </div>
            )}

            {/* Footer: fecha + asignado */}
            {(tarea.fecha_vencimiento || tarea.asignado_nombre) && (
                <div className="flex items-center gap-2 pt-2 border-t border-border/25 mt-2">
                    {tarea.fecha_vencimiento && (
                        <div className={cn("flex items-center gap-1", isOverdue ? "text-red-400" : "text-muted-foreground")}>
                            <Clock size={10} />
                            <span className="text-[11px]">{formatDate(tarea.fecha_vencimiento)}</span>
                        </div>
                    )}
                    {tarea.asignado_nombre && (
                        <div className="flex items-center gap-1 ml-auto">
                            <User size={10} className="text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">{tarea.asignado_nombre}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Kanban Column ─────────────────────────────────────────────────────────────

function KanbanColumn({ estado, tareas, draggingId, onDrop, onCardClick, onCardDragStart, onCardDragEnd, onAddTask }) {
    const [isDragOver, setIsDragOver] = useState(false);

    return (
        <div className="flex-shrink-0 w-72 flex flex-col">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: estado.color_hex }} />
                <span className="text-sm font-semibold text-foreground">{estado.nombre}</span>
                <span className="ml-auto text-xs text-muted-foreground bg-foreground/6 rounded-full px-2 py-0.5 font-medium">
                    {tareas.length}
                </span>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onDrop(estado.id_estado); }}
                className={cn(
                    "flex-1 min-h-24 rounded-2xl p-2 space-y-2 transition-all duration-150",
                    isDragOver ? "bg-violet-500/8 border-2 border-dashed border-violet-500/40" : "bg-secondary/20"
                )}
            >
                {tareas.map(t => (
                    <TaskCard
                        key={t.id_tarea}
                        tarea={t}
                        onClick={() => onCardClick(t)}
                        dragging={draggingId === t.id_tarea}
                        onDragStart={(e) => { e.dataTransfer.setData('taskId', String(t.id_tarea)); onCardDragStart(t.id_tarea); }}
                        onDragEnd={onCardDragEnd}
                    />
                ))}
            </div>

            {/* Add button */}
            <button
                onClick={() => onAddTask(estado.id_estado)}
                className="mt-2 flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-xl transition-colors w-full"
            >
                <Plus size={13} />
                <span>Agregar tarea</span>
            </button>
        </div>
    );
}

// ── Vista Lista ───────────────────────────────────────────────────────────────

function ListEstadoPicker({ tarea, estados, onSelect }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const estadoActual = estados.find(e => e.id_estado === tarea.id_estado);
    const isDone = !!estadoActual?.es_final;

    useEffect(() => {
        if (!open) return;
        const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, [open]);

    return (
        <div ref={ref} className="relative shrink-0" onClick={e => e.stopPropagation()}>
            <button
                onClick={() => setOpen(v => !v)}
                title="Cambiar estado"
                className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    isDone
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-border hover:border-violet-400 hover:bg-violet-500/10"
                )}
            >
                {isDone && <Check size={10} strokeWidth={2.5} />}
            </button>

            {open && (
                <div className="absolute left-0 top-7 z-50 bg-popover border border-border rounded-xl shadow-xl py-1.5 min-w-[160px]">
                    {estados.map(e => (
                        <button
                            key={e.id_estado}
                            onClick={() => { onSelect(tarea, e.id_estado); setOpen(false); }}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-foreground/5 transition-colors text-left",
                                e.id_estado === tarea.id_estado ? "opacity-40 cursor-default" : ""
                            )}
                        >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color_hex }} />
                            {e.nombre}
                            {e.id_estado === tarea.id_estado && (
                                <Check size={10} className="ml-auto text-muted-foreground" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function ListView({ tareas, estados, onCardClick, onChangeEstado }) {
    const estadoMap = Object.fromEntries(estados.map(e => [e.id_estado, e]));

    if (!tareas.length) {
        return (
            <div className="text-center py-16 text-muted-foreground text-sm">
                No hay tareas que coincidan con los filtros.
            </div>
        );
    }

    const grupos = estados
        .map(e => ({ estado: e, items: tareas.filter(t => t.id_estado === e.id_estado) }))
        .filter(g => g.items.length > 0);

    return (
        <div className="space-y-5">
            {grupos.map(({ estado, items }) => (
                <div key={estado.id_estado}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: estado.color_hex }} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {estado.nombre}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 ml-1">{items.length}</span>
                    </div>

                    <div className="space-y-1.5">
                        {items.map(t => {
                            const prio = PRIORIDAD_CONFIG[t.prioridad];
                            const tipo = TIPO_CONFIG[t.tipo];
                            const isDone = !!estado.es_final;
                            const isOverdue = t.fecha_vencimiento && !t.fecha_completado &&
                                new Date(t.fecha_vencimiento) < new Date(new Date().toDateString());

                            return (
                                <div
                                    key={t.id_tarea}
                                    onClick={() => onCardClick(t)}
                                    className={cn(
                                        "flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all",
                                        isDone
                                            ? "bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/40"
                                            : "bg-card border-border/40 hover:border-violet-500/40 hover:bg-secondary/20"
                                    )}
                                >
                                    <ListEstadoPicker
                                        tarea={t}
                                        estados={estados}
                                        onSelect={onChangeEstado}
                                    />

                                    <span className="text-[11px] text-muted-foreground shrink-0 w-8 text-center">{tipo?.emoji}</span>
                                    <span className={cn(
                                        "flex-1 text-sm font-medium truncate",
                                        isDone ? "line-through text-muted-foreground" : "text-foreground"
                                    )}>
                                        {t.titulo}
                                    </span>
                                    {t.proyecto_nombre && (
                                        <span className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                                            <Folder size={10} />
                                            {t.proyecto_nombre}
                                        </span>
                                    )}
                                    {t.asignado_nombre && (
                                        <span className="hidden lg:flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                                            <User size={10} />
                                            {t.asignado_nombre}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-semibold shrink-0" style={{ color: prio?.color }}>
                                        {prio?.label}
                                    </span>
                                    {t.fecha_vencimiento && (
                                        <span className={cn("text-[11px] shrink-0 hidden md:block", isOverdue ? "text-red-400" : "text-muted-foreground")}>
                                            {new Date(t.fecha_vencimiento).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function Synapse({ teamId = null }) {
    const numTeamId = teamId ? parseInt(teamId) : null;

    const [estados, setEstados] = useState([]);
    const [tareas, setTareas] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState('kanban'); // 'kanban' | 'list'

    // Filters
    const [searchQ, setSearchQ] = useState('');
    const [filterPrioridad, setFilterPrioridad] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [filterProyecto, setFilterProyecto] = useState('');
    const [filterTeam, setFilterTeam] = useState('');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTarea, setModalTarea] = useState(null);
    const [modalEstadoId, setModalEstadoId] = useState(null);
    const [modalTeamId, setModalTeamId] = useState(null);

    // DnD
    const [draggingId, setDraggingId] = useState(null);

    const [proyectosRef, setProyectosRef] = useState([]);

    const teamInfo = numTeamId ? teams.find(t => t.id_team === numTeamId) : null;

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = numTeamId ? { id_team: numTeamId } : {};
            const [est, tar, proys, tms] = await Promise.all([
                synapseService.getEstados(),
                synapseService.getTareas(params),
                synapseService.getMetaProyectos(),
                synapseService.getTeams(),
            ]);
            setEstados(Array.isArray(est) ? est : []);
            setTareas(Array.isArray(tar) ? tar : []);
            setProyectosRef(Array.isArray(proys) ? proys : []);
            setTeams(Array.isArray(tms) ? tms : []);
        } catch (e) {
            setError('No se pudo cargar Synapse. Verifica la conexión.');
        } finally {
            setLoading(false);
        }
    }, [numTeamId]);

    useEffect(() => { loadAll(); }, [loadAll]);

    // ── Filters ────────────────────────────────────────────────────────────────

    const filteredTareas = tareas.filter(t => {
        if (searchQ && !t.titulo.toLowerCase().includes(searchQ.toLowerCase())) return false;
        if (filterPrioridad && t.prioridad !== filterPrioridad) return false;
        if (filterTipo && t.tipo !== filterTipo) return false;
        if (filterProyecto && String(t.id_proyecto) !== filterProyecto) return false;
        if (filterTeam && String(t.id_team) !== filterTeam) return false;
        return true;
    });

    const tareasPorEstado = estados.reduce((acc, e) => {
        acc[e.id_estado] = filteredTareas.filter(t => t.id_estado === e.id_estado);
        return acc;
    }, {});

    const hasFilters = searchQ || filterPrioridad || filterTipo || filterProyecto || filterTeam;
    const clearFilters = () => { setSearchQ(''); setFilterPrioridad(''); setFilterTipo(''); setFilterProyecto(''); setFilterTeam(''); };

    // ── Modal handlers ─────────────────────────────────────────────────────────

    const openCreate = (estadoId = null) => {
        setModalTarea(null);
        setModalEstadoId(estadoId || estados[0]?.id_estado || null);
        setModalTeamId(numTeamId);
        setModalOpen(true);
    };

    const openEdit = (tarea) => {
        setModalTarea(tarea);
        setModalEstadoId(null);
        setModalOpen(true);
    };

    const handleSaved = (result) => {
        if (result._temp) {
            // Nuevo ticket: agregar optimisticamente y cerrar modal al tiro
            setTareas(prev => [result, ...prev]);
            setModalOpen(false);
        } else if (result._replaceTempId) {
            // Reemplazar item temporal con dato real del servidor
            const { _replaceTempId, ...clean } = result;
            setTareas(prev => prev.map(t => t.id_tarea === _replaceTempId ? clean : t));
        } else {
            // Update (optimistic ya aplicado, sync con servidor)
            setTareas(prev => prev.map(t => t.id_tarea === result.id_tarea ? result : t));
            setModalOpen(false);
        }
    };

    const handleDeleted = (id) => {
        setTareas(prev => prev.filter(t => t.id_tarea !== id));
        setModalOpen(false);
    };

    // ── Drag & Drop ────────────────────────────────────────────────────────────

    // Cambia la tarea a cualquier estado desde la vista lista
    const handleListChangeEstado = async (tarea, nuevoEstadoId) => {
        if (tarea.id_estado === nuevoEstadoId) return;
        const estadoDestino = estados.find(e => e.id_estado === nuevoEstadoId);
        const fechaCompletado = estadoDestino?.es_final ? new Date().toISOString().split('T')[0] : null;
        setTareas(prev => prev.map(t =>
            t.id_tarea === tarea.id_tarea
                ? { ...t, id_estado: nuevoEstadoId, fecha_completado: fechaCompletado }
                : t
        ));
        try {
            await synapseService.updateTareaEstado(tarea.id_tarea, nuevoEstadoId);
        } catch {
            await loadAll();
        }
    };

    const handleDrop = async (nuevoEstadoId) => {
        if (!draggingId) return;
        const tarea = tareas.find(t => t.id_tarea === draggingId);
        if (!tarea || tarea.id_estado === nuevoEstadoId) return;

        const estadoDestino = estados.find(e => e.id_estado === nuevoEstadoId);
        const fechaCompletado = estadoDestino?.es_final
            ? new Date().toISOString().split('T')[0]
            : null;

        setTareas(prev => prev.map(t =>
            t.id_tarea === draggingId
                ? { ...t, id_estado: nuevoEstadoId, fecha_completado: fechaCompletado }
                : t
        ));

        try {
            await synapseService.updateTareaEstado(draggingId, nuevoEstadoId);
        } catch {
            await loadAll();
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 size={28} className="animate-spin text-violet-400" />
                    <span className="text-sm">Cargando Synapse...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <p className="text-muted-foreground text-sm">{error}</p>
                    <button onClick={loadAll} className="text-xs text-violet-400 hover:text-violet-300 underline">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/15 rounded-xl flex items-center justify-center">
                        {teamInfo
                            ? <span className="text-xl leading-none">{teamInfo.emoji || '👥'}</span>
                            : <Brain size={20} className="text-violet-400" />
                        }
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">
                            {teamInfo ? teamInfo.nombre : 'Synapse'}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {filteredTareas.length} {filteredTareas.length === 1 ? 'tarea' : 'tareas'}
                            {hasFilters ? ' (filtrado)' : ''} · {estados.length} columnas
                            {!teamInfo && teams.length > 0 ? ` · ${teams.length} equipos` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Vista toggle */}
                    <div className="flex bg-secondary/50 border border-border/40 rounded-xl p-0.5">
                        <button
                            onClick={() => setView('kanban')}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                view === 'kanban' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutGrid size={15} />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                view === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <List size={15} />
                        </button>
                    </div>

                    <button
                        onClick={loadAll}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-xl transition-colors"
                        title="Actualizar"
                    >
                        <RefreshCw size={15} />
                    </button>

                    <button
                        onClick={() => openCreate()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-xl transition-colors shadow-sm"
                    >
                        <Plus size={15} />
                        <span>Nueva tarea</span>
                    </button>
                </div>
            </div>

            {/* Filters bar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        value={searchQ}
                        onChange={(e) => setSearchQ(e.target.value)}
                        placeholder="Buscar tareas..."
                        className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 text-foreground placeholder:text-muted-foreground/50 transition-colors"
                    />
                </div>

                <select
                    value={filterPrioridad}
                    onChange={(e) => setFilterPrioridad(e.target.value)}
                    className="text-sm bg-background border border-border/50 rounded-xl px-3 py-2 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 appearance-none cursor-pointer"
                >
                    <option value="">Prioridad</option>
                    {Object.entries(PRIORIDAD_CONFIG).map(([v, c]) => (
                        <option key={v} value={v}>{c.label}</option>
                    ))}
                </select>

                <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className="text-sm bg-background border border-border/50 rounded-xl px-3 py-2 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 appearance-none cursor-pointer"
                >
                    <option value="">Tipo</option>
                    {Object.entries(TIPO_CONFIG).map(([v, c]) => (
                        <option key={v} value={v}>{c.label}</option>
                    ))}
                </select>

                {proyectosRef.length > 0 && (
                    <select
                        value={filterProyecto}
                        onChange={(e) => setFilterProyecto(e.target.value)}
                        className="text-sm bg-background border border-border/50 rounded-xl px-3 py-2 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 appearance-none cursor-pointer"
                    >
                        <option value="">Proyecto</option>
                        {proyectosRef.map(p => (
                            <option key={p.id_proyecto} value={String(p.id_proyecto)}>{p.nombre}</option>
                        ))}
                    </select>
                )}

                {!numTeamId && teams.length > 0 && (
                    <select
                        value={filterTeam}
                        onChange={(e) => setFilterTeam(e.target.value)}
                        className="text-sm bg-background border border-border/50 rounded-xl px-3 py-2 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 appearance-none cursor-pointer"
                    >
                        <option value="">Equipo</option>
                        {teams.map(tm => (
                            <option key={tm.id_team} value={String(tm.id_team)}>{tm.emoji} {tm.nombre}</option>
                        ))}
                    </select>
                )}

                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-2 border border-border/50 rounded-xl hover:bg-foreground/5 transition-colors"
                    >
                        <X size={12} />
                        Limpiar
                    </button>
                )}
            </div>

            {/* Kanban Board */}
            {view === 'kanban' ? (
                estados.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground text-sm">
                        No hay estados configurados. Ve a Configuración → Synapse para crear columnas.
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 lg:-mx-8 lg:px-8">
                        {estados.map(estado => (
                            <KanbanColumn
                                key={estado.id_estado}
                                estado={estado}
                                tareas={tareasPorEstado[estado.id_estado] || []}
                                draggingId={draggingId}
                                onDrop={handleDrop}
                                onCardClick={openEdit}
                                onCardDragStart={setDraggingId}
                                onCardDragEnd={() => setDraggingId(null)}
                                onAddTask={openCreate}
                            />
                        ))}
                    </div>
                )
            ) : (
                <ListView
                    tareas={filteredTareas}
                    estados={estados}
                    onCardClick={openEdit}
                    onChangeEstado={handleListChangeEstado}
                />
            )}

            {/* Modal */}
            {modalOpen && (
                <SynapseTaskModal
                    tarea={modalTarea}
                    estados={estados}
                    initialEstadoId={modalEstadoId}
                    initialTeamId={modalTeamId}
                    onClose={() => setModalOpen(false)}
                    onSaved={handleSaved}
                    onDeleted={handleDeleted}
                />
            )}
        </div>
    );
}
