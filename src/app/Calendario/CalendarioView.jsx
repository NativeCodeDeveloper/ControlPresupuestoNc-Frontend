'use client';
import { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft, ChevronRight, Plus, Search,
    LayoutGrid, CalendarDays, Clock, List, Filter, ChevronDown, Video
} from 'lucide-react';
import { cn } from '../../lib/utils';
import MiniCalendar from './MiniCalendar';
import EventModal from './EventModal';
import { getEventos, createEvento, updateEvento, deleteEvento } from '../../services/calendarioService';
import {
    MESES, DIAS_CORTO, COLOR_MAP, CATEGORIAS, COLORES, TAGS_PRESET,
    getMonthGrid, getWeekDays, isSameDay, isToday, addDays, addMonths,
    startOfMonth, endOfMonth, eventOverlapsDay, formatHour
} from './calUtils';

// ─── Helpers de rango ─────────────────────────────────────────────────────────

function getRangeForView(view, anchor) {
    if (view === 'month') {
        const s = startOfMonth(anchor); s.setDate(s.getDate() - 7);
        const e = endOfMonth(anchor);   e.setDate(e.getDate() + 7);
        return { desde: s.toISOString(), hasta: e.toISOString() };
    }
    if (view === 'week') {
        const days = getWeekDays(anchor);
        const s = new Date(days[0]); s.setHours(0,0,0,0);
        const e = new Date(days[6]); e.setHours(23,59,59,999);
        return { desde: s.toISOString(), hasta: e.toISOString() };
    }
    if (view === 'day') {
        const s = new Date(anchor); s.setHours(0,0,0,0);
        const e = new Date(anchor); e.setHours(23,59,59,999);
        return { desde: s.toISOString(), hasta: e.toISOString() };
    }
    // list — next 3 months
    const s = new Date(); s.setHours(0,0,0,0);
    const e = addMonths(s, 3);
    return { desde: s.toISOString(), hasta: e.toISOString() };
}

// ─── Subcomponente: chip de evento ───────────────────────────────────────────

function EventChip({ ev, onClick }) {
    const C = COLOR_MAP[ev.color] || COLOR_MAP.blue;
    return (
        <button
            onClick={e => { e.stopPropagation(); onClick(ev); }}
            className={cn(
                "w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-opacity hover:opacity-80",
                C.bg, C.text
            )}
        >
            {ev.titulo}
        </button>
    );
}

// ─── Vista Mes ────────────────────────────────────────────────────────────────

function MonthView({ anchor, eventos, onDayClick, onEventClick }) {
    const grid = getMonthGrid(anchor);
    const evMap = {};
    eventos.forEach(ev => {
        let d = new Date(ev.fecha_inicio); d.setHours(0,0,0,0);
        const end = new Date(ev.fecha_fin); end.setHours(0,0,0,0);
        while (d <= end) {
            const k = d.toDateString();
            if (!evMap[k]) evMap[k] = [];
            evMap[k].push(ev);
            d = addDays(d, 1);
        }
    });

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Cabecera días */}
            <div className="grid grid-cols-7 border-b border-border/30">
                {DIAS_CORTO.map(d => (
                    <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-2">
                        {d}
                    </div>
                ))}
            </div>
            {/* Grid */}
            <div className="grid grid-cols-7 flex-1 min-h-0" style={{ gridAutoRows: '1fr' }}>
                {grid.map((day, i) => {
                    const isCurrentMonth = day.getMonth() === anchor.getMonth();
                    const isTod = isToday(day);
                    const dayEvs = evMap[day.toDateString()] || [];
                    return (
                        <div
                            key={i}
                            onClick={() => onDayClick(day)}
                            className={cn(
                                "border-b border-r border-border/20 p-1 cursor-pointer hover:bg-foreground/3 transition-colors flex flex-col min-h-0 overflow-hidden",
                                !isCurrentMonth && "opacity-40"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-semibold mb-0.5 self-start shrink-0",
                                isTod ? "bg-indigo-500 text-white" : "text-foreground/80"
                            )}>
                                {day.getDate()}
                            </div>
                            <div className="space-y-0.5 overflow-hidden">
                                {dayEvs.slice(0, 3).map(ev => (
                                    <EventChip key={ev.id} ev={ev} onClick={onEventClick} />
                                ))}
                                {dayEvs.length > 3 && (
                                    <p className="text-[9px] text-muted-foreground pl-1">+{dayEvs.length - 3} más</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Vista Semana / Día ───────────────────────────────────────────────────────

function TimeGrid({ days, eventos, onSlotClick, onEventClick }) {
    const HOURS = Array.from({ length: 24 }, (_, i) => i);
    return (
        <div className="flex flex-1 min-h-0 overflow-auto">
            {/* Columna de horas */}
            <div className="w-14 shrink-0 border-r border-border/30">
                <div className="h-10 border-b border-border/20" /> {/* header placeholder */}
                {HOURS.map(h => (
                    <div key={h} className="h-14 border-b border-border/10 px-2 flex items-start pt-1">
                        <span className="text-[9px] text-muted-foreground/60">{formatHour(h)}</span>
                    </div>
                ))}
            </div>

            {/* Columnas de días */}
            <div className="flex flex-1 min-w-0">
                {days.map((day, di) => {
                    const dayEvs = eventos.filter(ev => eventOverlapsDay(ev, day));
                    return (
                        <div key={di} className="flex flex-col flex-1 border-r border-border/20 min-w-0">
                            {/* Header */}
                            <div className={cn(
                                "h-10 border-b border-border/30 flex flex-col items-center justify-center shrink-0",
                                isToday(day) && "bg-indigo-500/10"
                            )}>
                                <span className="text-[9px] text-muted-foreground uppercase">{DIAS_CORTO[(day.getDay()+6)%7]}</span>
                                <span className={cn(
                                    "text-sm font-semibold",
                                    isToday(day) ? "text-indigo-400" : "text-foreground/80"
                                )}>{day.getDate()}</span>
                            </div>

                            {/* Slots de hora */}
                            <div className="relative flex-1">
                                {HOURS.map(h => (
                                    <div
                                        key={h}
                                        onClick={() => {
                                            const d = new Date(day);
                                            d.setHours(h, 0, 0, 0);
                                            onSlotClick(d);
                                        }}
                                        className="h-14 border-b border-border/10 hover:bg-foreground/3 cursor-pointer transition-colors"
                                    />
                                ))}
                                {/* Eventos posicionados */}
                                {dayEvs.map(ev => {
                                    const start = new Date(ev.fecha_inicio);
                                    const end   = new Date(ev.fecha_fin);
                                    const dayStart = new Date(day); dayStart.setHours(0,0,0,0);
                                    const s = Math.max((start - dayStart) / 3600000, 0);
                                    const e = Math.min((end - dayStart)   / 3600000, 24);
                                    const C = COLOR_MAP[ev.color] || COLOR_MAP.blue;
                                    return (
                                        <button
                                            key={ev.id}
                                            onClick={e2 => { e2.stopPropagation(); onEventClick(ev); }}
                                            style={{ top: `${s * 56}px`, height: `${Math.max((e - s) * 56, 20)}px` }}
                                            className={cn(
                                                "absolute left-1 right-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-left border-l-2 overflow-hidden hover:opacity-80 transition-opacity",
                                                C.bg, C.text, C.border
                                            )}
                                        >
                                            {ev.titulo}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Vista Lista ──────────────────────────────────────────────────────────────

function ListView({ eventos, onEventClick }) {
    const grouped = {};
    [...eventos].sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
        .forEach(ev => {
            const d = new Date(ev.fecha_inicio);
            const key = d.toDateString();
            if (!grouped[key]) grouped[key] = { date: d, items: [] };
            grouped[key].items.push(ev);
        });

    if (!Object.keys(grouped).length) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No hay eventos en este período</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {Object.values(grouped).map(({ date, items }) => (
                <div key={date.toDateString()}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                        {date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <div className="space-y-2">
                        {items.map(ev => {
                            const C = COLOR_MAP[ev.color] || COLOR_MAP.blue;
                            const start = new Date(ev.fecha_inicio);
                            const end   = new Date(ev.fecha_fin);
                            const catLabel = CATEGORIAS.find(c => c.value === ev.categoria)?.label || ev.categoria;
                            return (
                                <button
                                    key={ev.id}
                                    onClick={() => onEventClick(ev)}
                                    className="w-full text-left bg-foreground/3 hover:bg-foreground/6 border border-border/30 rounded-xl px-4 py-3 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", C.dot)} />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{ev.titulo}</p>
                                                {ev.descripcion && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.descripcion}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {ev.todo_el_dia ? 'Todo el día' :
                                                            `${start.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`}
                                                    </span>
                                                    {ev.tags?.map(t => (
                                                        <span key={t} className="px-1.5 py-0.5 bg-foreground/8 rounded-full text-[10px] text-muted-foreground">{t}</span>
                                                    ))}
                                                    {ev.meet_link && <Video size={11} className="text-indigo-400" />}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] border border-border/50 rounded px-1.5 py-0.5 text-muted-foreground shrink-0">{catLabel}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Dropdown filtro ─────────────────────────────────────────────────────────

function FilterDropdown({ label, options, value, onChange }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors",
                    value
                        ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-400"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
            >
                <Filter size={11} /> {label} <ChevronDown size={10} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute top-full mt-1 left-0 z-20 bg-background border border-border/60 rounded-xl shadow-xl py-1 min-w-[140px]">
                        <button
                            onClick={() => { onChange(null); setOpen(false); }}
                            className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-foreground/6 transition-colors"
                        >
                            Todos
                        </button>
                        {options.map(o => (
                            <button
                                key={o.value}
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                className={cn(
                                    "w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2",
                                    value === o.value
                                        ? "text-indigo-400 bg-indigo-500/10"
                                        : "text-foreground hover:bg-foreground/6"
                                )}
                            >
                                {o.dot && <span className={cn("w-2 h-2 rounded-full", o.dot)} />}
                                {o.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Vista principal ──────────────────────────────────────────────────────────

const VIEWS = [
    { id: 'month', label: 'Mes',    Icon: LayoutGrid },
    { id: 'week',  label: 'Semana', Icon: CalendarDays },
    { id: 'day',   label: 'Día',    Icon: Clock },
    { id: 'list',  label: 'Lista',  Icon: List },
];

function getTitle(view, anchor) {
    if (view === 'month') return `${MESES[anchor.getMonth()]} ${anchor.getFullYear()}`;
    if (view === 'week') {
        const days = getWeekDays(anchor);
        return `Semana del ${days[0].getDate()} ${MESES[days[0].getMonth()]}`;
    }
    if (view === 'day') {
        return anchor.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    return 'Todos los eventos';
}

function navigate(view, anchor, dir) {
    if (view === 'month') return addMonths(anchor, dir);
    if (view === 'week')  return addDays(anchor, dir * 7);
    if (view === 'day')   return addDays(anchor, dir);
    return anchor;
}

export default function CalendarioView() {
    const [view,   setView]   = useState('month');
    const [anchor, setAnchor] = useState(new Date());
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search,  setSearch]  = useState('');
    const [filterCat,   setFilterCat]   = useState(null);
    const [filterColor, setFilterColor] = useState(null);
    const [filterTag,   setFilterTag]   = useState(null);
    const [modal, setModal] = useState(null); // null | { event, defaultDate }

    const fetchEventos = useCallback(async () => {
        setLoading(true);
        try {
            const range = getRangeForView(view, anchor);
            const params = { ...range };
            if (filterCat)   params.categoria = filterCat;
            if (filterColor) params.color     = filterColor;
            if (filterTag)   params.tag       = filterTag;
            const data = await getEventos(params);
            setEventos(Array.isArray(data) ? data : []);
        } catch { /* silencioso */ }
        finally { setLoading(false); }
    }, [view, anchor, filterCat, filterColor, filterTag]);

    useEffect(() => { fetchEventos(); }, [fetchEventos]);

    const filteredEventos = search.trim()
        ? eventos.filter(ev => ev.titulo.toLowerCase().includes(search.toLowerCase()))
        : eventos;

    function openNewEvent(defaultDate) {
        setModal({ event: null, defaultDate });
    }

    function openEvent(ev) {
        setModal({ event: ev });
    }

    async function handleSave(form) {
        try {
            if (modal.event?.id) {
                await updateEvento(modal.event.id, form);
            } else {
                await createEvento(form);
            }
            setModal(null);
            fetchEventos();
        } catch (e) {
            console.error('[CALENDARIO]', e);
        }
    }

    async function handleDelete(id) {
        if (!confirm('¿Eliminar este evento?')) return;
        try {
            await deleteEvento(id);
            setModal(null);
            fetchEventos();
        } catch {}
    }

    const catOpts  = CATEGORIAS.map(c => ({ value: c.value, label: c.label }));
    const colorOpts = COLORES.map(c => ({
        value: c.value, label: c.label, dot: COLOR_MAP[c.value]?.dot
    }));
    const tagOpts = TAGS_PRESET.map(t => ({ value: t, label: t }));

    return (
        <div className="flex h-full min-h-0 overflow-hidden bg-background">

            {/* ── Sidebar izquierdo ── */}
            <aside className="w-52 shrink-0 border-r border-border/30 flex flex-col py-4 px-3 gap-4 overflow-y-auto">
                <button
                    onClick={() => openNewEvent(new Date())}
                    className="flex items-center gap-2 w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
                >
                    <Plus size={15} /> Nuevo evento
                </button>

                {/* Mini calendario */}
                <MiniCalendar
                    selected={anchor}
                    onSelect={date => { setAnchor(date); if (view === 'list') setView('month'); }}
                />

                {/* Categorías toggle */}
                <div>
                    <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">Categorías</p>
                    <div className="space-y-0.5">
                        {[
                            { value: null,         label: 'Todas', dot: 'bg-indigo-500' },
                            { value: 'reunion',    label: 'Reuniones',    dot: 'bg-blue-500'    },
                            { value: 'tarea',      label: 'Tareas',       dot: 'bg-violet-500'  },
                            { value: 'recordatorio',label: 'Recordatorios',dot: 'bg-orange-500' },
                            { value: 'personal',   label: 'Personal',     dot: 'bg-emerald-500' },
                            { value: 'vencimiento',label: 'Vencimientos', dot: 'bg-red-500'     },
                        ].map(cat => (
                            <button
                                key={cat.value ?? 'all'}
                                onClick={() => setFilterCat(cat.value)}
                                className={cn(
                                    "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-colors",
                                    filterCat === cat.value
                                        ? "bg-foreground/8 text-foreground font-medium"
                                        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                                )}
                            >
                                <span className={cn("w-2 h-2 rounded-full shrink-0", cat.dot)} />
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* ── Área principal ── */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">

                {/* Barra superior */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 shrink-0 flex-wrap">
                    {/* Navegación */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setAnchor(navigate(view, anchor, -1))}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <button
                            onClick={() => setAnchor(new Date())}
                            className="px-3 py-1.5 rounded-lg border border-border/50 text-xs text-foreground hover:bg-foreground/8 transition-colors"
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => setAnchor(navigate(view, anchor, 1))}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>

                    <h2 className="text-sm font-semibold text-foreground capitalize flex-1">
                        {getTitle(view, anchor)}
                        {loading && <span className="ml-2 text-[11px] text-muted-foreground font-normal">Cargando…</span>}
                    </h2>

                    {/* Buscador */}
                    <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar eventos…"
                            className="pl-7 pr-3 py-1.5 text-xs bg-foreground/5 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/60 w-44 transition-colors"
                        />
                    </div>

                    {/* Filtros */}
                    <FilterDropdown label="Colores"    options={colorOpts} value={filterColor} onChange={setFilterColor} />
                    <FilterDropdown label="Tags"       options={tagOpts}   value={filterTag}   onChange={setFilterTag} />

                    {/* Selector de vista */}
                    <div className="flex items-center gap-0.5 bg-foreground/5 rounded-lg p-0.5 border border-border/30">
                        {VIEWS.map(v => (
                            <button
                                key={v.id}
                                onClick={() => setView(v.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all",
                                    view === v.id
                                        ? "bg-background text-foreground shadow-sm font-medium"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <v.Icon size={12} /> {v.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Contenido del calendario */}
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                    {view === 'month' && (
                        <MonthView
                            anchor={anchor}
                            eventos={filteredEventos}
                            onDayClick={day => { setAnchor(day); setView('day'); }}
                            onEventClick={openEvent}
                        />
                    )}
                    {view === 'week' && (
                        <TimeGrid
                            days={getWeekDays(anchor)}
                            eventos={filteredEventos}
                            onSlotClick={date => openNewEvent(date)}
                            onEventClick={openEvent}
                        />
                    )}
                    {view === 'day' && (
                        <TimeGrid
                            days={[anchor]}
                            eventos={filteredEventos}
                            onSlotClick={date => openNewEvent(date)}
                            onEventClick={openEvent}
                        />
                    )}
                    {view === 'list' && (
                        <ListView
                            eventos={filteredEventos}
                            onEventClick={openEvent}
                        />
                    )}
                </div>
            </div>

            {/* Modal */}
            {modal !== null && (
                <EventModal
                    event={modal.event}
                    defaultDate={modal.defaultDate}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}
