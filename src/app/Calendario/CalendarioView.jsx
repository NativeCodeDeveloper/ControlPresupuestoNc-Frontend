'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    ChevronLeft, ChevronRight, Plus, Search,
    LayoutGrid, CalendarDays, Clock, List, Filter, ChevronDown, Video, Users, X, SlidersHorizontal
} from 'lucide-react';
import { cn } from '../../lib/utils';
import MiniCalendar from './MiniCalendar';
import EventModal from './EventModal';
import { getEventos, createEvento, updateEvento, deleteEvento } from '../../services/calendarioService';
import { getTeams } from '../../services/synapseService';
import {
    MESES, DIAS_CORTO, COLOR_MAP, CATEGORIAS, COLORES, TAGS_PRESET,
    getMonthGrid, getWeekDays, isSameDay, isToday, addDays, addMonths,
    startOfMonth, endOfMonth, eventOverlapsDay, formatHour
} from './calUtils';

// ─── Persistencia localStorage ────────────────────────────────────────────────

const STORAGE_KEY = 'cal_prefs_v1';
function loadPrefs() {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}
function savePrefs(p) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}
const ALL_CATS = ['reunion', 'tarea', 'recordatorio', 'personal', 'vencimiento'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    const s = new Date(); s.setHours(0,0,0,0);
    return { desde: s.toISOString(), hasta: addMonths(s, 3).toISOString() };
}

// MySQL DATE (UTC midnight) → fecha local sin desfase de zona horaria
function parseDateLocal(str) {
    if (!str) return null;
    const s = typeof str === 'string' ? str : new Date(str).toISOString();
    const [y, m, d] = s.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
}

function eventFallsOnDay(ev, day) {
    const start = ev.todo_el_dia ? parseDateLocal(ev.fecha_inicio) : new Date(ev.fecha_inicio);
    const end   = ev.todo_el_dia ? parseDateLocal(ev.fecha_fin)    : new Date(ev.fecha_fin);
    if (!start || !end) return false;
    const d = new Date(day); d.setHours(0,0,0,0);
    const s = new Date(start); s.setHours(0,0,0,0);
    const e = new Date(end);   e.setHours(0,0,0,0);
    return s <= d && d <= e;
}

// ─── Helpers equipos ──────────────────────────────────────────────────────────

function getTeamColor(ev, teamColorMap) {
    if (!ev.participantes?.length || !teamColorMap) return null;
    const p = ev.participantes.find(p => p.tipo === 'team' && teamColorMap[p.id_referencia]);
    return p ? teamColorMap[p.id_referencia] : null;
}

// ─── Chip de evento ───────────────────────────────────────────────────────────

function EventChip({ ev, onClick, teamColor }) {
    const C = COLOR_MAP[ev.color] || COLOR_MAP.blue;
    return (
        <button
            onClick={e => { e.stopPropagation(); onClick(ev); }}
            style={teamColor ? { borderLeft: `3px solid ${teamColor}`, paddingLeft: '6px' } : undefined}
            className={cn(
                "w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-opacity hover:opacity-80",
                C.bg, C.text
            )}
        >
            {ev.titulo}
        </button>
    );
}

// ─── Popover de día (clic en "+N más") ───────────────────────────────────────

function DayPopover({ day, eventos, onClose, onEventClick }) {
    const venc   = eventos.filter(e => e.categoria === 'vencimiento');
    const otros  = eventos.filter(e => e.categoria !== 'vencimiento');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={onClose}>
            <div className="bg-background border border-border/60 rounded-2xl shadow-2xl w-80 max-h-[70vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                    <p className="text-sm font-semibold text-foreground capitalize">
                        {day.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                        <X size={14} />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-1">
                    {otros.map(ev => {
                        const C = COLOR_MAP[ev.color] || COLOR_MAP.blue;
                        const catLabel = CATEGORIAS.find(c => c.value === ev.categoria)?.label || ev.categoria;
                        const start = new Date(ev.fecha_inicio);
                        return (
                            <button key={ev.id} onClick={() => { onEventClick(ev); onClose(); }}
                                className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-foreground/5 transition-colors group">
                                <div className={cn("w-2 h-2 rounded-full shrink-0", C.dot)} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">{ev.titulo}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {ev.todo_el_dia ? catLabel : `${start.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})} · ${catLabel}`}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                    {venc.length > 0 && (
                        <>
                            {otros.length > 0 && <div className="border-t border-border/20 my-1" />}
                            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 py-1">
                                Vencimientos ({venc.length})
                            </p>
                            {venc.map(ev => (
                                <button key={ev.id} onClick={() => { onEventClick(ev); onClose(); }}
                                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-500/8 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                    <p className="text-xs text-foreground truncate">{ev.titulo}</p>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Vista Mes ────────────────────────────────────────────────────────────────

function MonthView({ anchor, eventos, onDayClick, onEventClick, teamColorMap = {} }) {
    const [popover, setPopover] = useState(null); // { day, eventos }
    const grid = getMonthGrid(anchor);

    const evMap = {};
    eventos.forEach(ev => {
        const start = ev.todo_el_dia ? parseDateLocal(ev.fecha_inicio) : new Date(ev.fecha_inicio);
        const end   = ev.todo_el_dia ? parseDateLocal(ev.fecha_fin)    : new Date(ev.fecha_fin);
        if (!start || !end) return;
        let d = new Date(start); d.setHours(0,0,0,0);
        const endD = new Date(end); endD.setHours(0,0,0,0);
        while (d <= endD) {
            const k = d.toDateString();
            if (!evMap[k]) evMap[k] = [];
            evMap[k].push(ev);
            d = addDays(d, 1);
        }
    });

    return (
        <>
            <div className="flex flex-col flex-1 min-h-0">
                <div className="grid grid-cols-7 border-b border-border/30">
                    {DIAS_CORTO.map(d => (
                        <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-2">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-1 min-h-0" style={{ gridAutoRows: '1fr' }}>
                    {grid.map((day, i) => {
                        const isCurrentMonth = day.getMonth() === anchor.getMonth();
                        const isTod = isToday(day);
                        const allEvs   = evMap[day.toDateString()] || [];
                        const vencEvs  = allEvs.filter(e => e.categoria === 'vencimiento');
                        const normalEvs = allEvs.filter(e => e.categoria !== 'vencimiento');
                        const MAX_NORMAL = vencEvs.length > 0 ? 2 : 3;
                        const overflow = normalEvs.length > MAX_NORMAL
                            ? normalEvs.length - MAX_NORMAL
                            : 0;
                        const totalExtra = overflow + (vencEvs.length > 1 ? 0 : 0); // vencimientos ya van a 1 chip

                        return (
                            <div key={i}
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
                                    {normalEvs.slice(0, MAX_NORMAL).map(ev => (
                                        <EventChip key={ev.id} ev={ev} onClick={onEventClick} teamColor={getTeamColor(ev, teamColorMap)} />
                                    ))}
                                    {vencEvs.length === 1 && (
                                        <EventChip key={vencEvs[0].id} ev={vencEvs[0]} onClick={onEventClick} />
                                    )}
                                    {vencEvs.length > 1 && (
                                        <button
                                            onClick={e => { e.stopPropagation(); setPopover({ day, eventos: allEvs }); }}
                                            className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/15 text-red-400 hover:opacity-80 transition-opacity truncate"
                                        >
                                            {vencEvs.length} vencimientos
                                        </button>
                                    )}
                                    {overflow > 0 && (
                                        <button
                                            onClick={e => { e.stopPropagation(); setPopover({ day, eventos: allEvs }); }}
                                            className="text-[9px] text-muted-foreground pl-1 hover:text-foreground transition-colors"
                                        >
                                            +{overflow} más
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {popover && (
                <DayPopover
                    day={popover.day}
                    eventos={popover.eventos}
                    onClose={() => setPopover(null)}
                    onEventClick={onEventClick}
                />
            )}
        </>
    );
}

// ─── Panel izquierdo vista Día ────────────────────────────────────────────────

function DaySidebar({ day, eventos, onEventClick, onNewEvent, className = '' }) {
    const venc  = eventos.filter(e => e.categoria === 'vencimiento');
    const otros = eventos.filter(e => e.categoria !== 'vencimiento')
        .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

    return (
        <div className={cn("w-64 shrink-0 border-r border-border/30 flex flex-col overflow-hidden bg-background", className)}>
            <div className="px-3 py-3 border-b border-border/20 flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground capitalize">
                    {day.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <button onClick={() => onNewEvent(day)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors">
                    <Plus size={13} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {otros.length === 0 && venc.length === 0 && (
                    <p className="text-[11px] text-muted-foreground text-center py-6">Sin eventos este día</p>
                )}
                {otros.map(ev => {
                    const C = COLOR_MAP[ev.color] || COLOR_MAP.blue;
                    const catLabel = CATEGORIAS.find(c => c.value === ev.categoria)?.label || ev.categoria;
                    const start = new Date(ev.fecha_inicio);
                    const end   = new Date(ev.fecha_fin);
                    return (
                        <button key={ev.id} onClick={() => onEventClick(ev)}
                            className="w-full text-left flex gap-2 px-2.5 py-2 rounded-xl hover:bg-foreground/5 transition-colors group">
                            <div className={cn("w-1 rounded-full shrink-0 mt-0.5 self-stretch min-h-[1rem]", C.dot.replace('bg-', 'bg-').replace('500', '400'))} />
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium text-foreground truncate">{ev.titulo}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {ev.todo_el_dia
                                        ? `Todo el día · ${catLabel}`
                                        : `${start.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}–${end.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}`}
                                </p>
                            </div>
                        </button>
                    );
                })}

                {venc.length > 0 && (
                    <>
                        {otros.length > 0 && <div className="border-t border-border/20 my-2" />}
                        <div className="px-2 py-1">
                            <p className="text-[10px] font-semibold text-red-400/80 uppercase tracking-wider mb-1.5">
                                Vencimientos · {venc.length}
                            </p>
                            <div className="space-y-1">
                                {venc.map(ev => (
                                    <button key={ev.id} onClick={() => onEventClick(ev)}
                                        className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-500/8 transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                        <p className="text-[11px] text-foreground truncate">{
                                            ev.titulo.replace('Vencimiento: ', '')
                                        }</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── All-day strip en TimeGrid ────────────────────────────────────────────────

function AllDayStrip({ days, allDayEvs, onEventClick, teamColorMap = {} }) {
    const hasEvs = days.some(day => allDayEvs.some(ev => eventFallsOnDay(ev, day)));
    if (!hasEvs) return null;
    return (
        <div className="flex border-b border-border/30 shrink-0">
            <div className="w-14 shrink-0 border-r border-border/30 px-1 py-1 flex items-center">
                <span className="text-[9px] text-muted-foreground/50 uppercase">Día</span>
            </div>
            {days.map((day, di) => {
                const dayEvs = allDayEvs.filter(ev => eventFallsOnDay(ev, day));
                return (
                    <div key={di} className="flex-1 border-r border-border/20 px-1 py-1 space-y-0.5 min-w-0">
                        {dayEvs.filter(e => e.categoria !== 'vencimiento').map(ev => (
                            <EventChip key={ev.id} ev={ev} onClick={onEventClick} teamColor={getTeamColor(ev, teamColorMap)} />
                        ))}
                        {dayEvs.filter(e => e.categoria === 'vencimiento').length > 0 && (
                            <span className="block text-[9px] text-red-400/70 px-1">
                                {dayEvs.filter(e => e.categoria === 'vencimiento').length} venc.
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Vista Semana (solo grid horario) ────────────────────────────────────────

function WeekGrid({ days, eventos, onSlotClick, onEventClick, teamColorMap = {} }) {
    const HOURS = Array.from({ length: 24 }, (_, i) => i);
    const allDayEvs = eventos.filter(ev => ev.todo_el_dia);
    const timedEvs  = eventos.filter(ev => !ev.todo_el_dia);

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <AllDayStrip days={days} allDayEvs={allDayEvs} onEventClick={onEventClick} teamColorMap={teamColorMap} />
            <div className="flex flex-1 min-h-0 overflow-auto">
                <div className="w-14 shrink-0 border-r border-border/30">
                    <div className="h-10 border-b border-border/20" />
                    {HOURS.map(h => (
                        <div key={h} className="h-14 border-b border-border/10 px-2 flex items-start pt-1">
                            <span className="text-[9px] text-muted-foreground/60">{formatHour(h)}</span>
                        </div>
                    ))}
                </div>
                <div className="flex flex-1 min-w-0">
                    {days.map((day, di) => {
                        const dayTimedEvs = timedEvs.filter(ev => eventOverlapsDay(ev, day));
                        return (
                            <div key={di} className="flex flex-col flex-1 border-r border-border/20 min-w-0">
                                <div className={cn(
                                    "h-10 border-b border-border/30 flex flex-col items-center justify-center shrink-0",
                                    isToday(day) && "bg-indigo-500/10"
                                )}>
                                    <span className="text-[9px] text-muted-foreground uppercase">{DIAS_CORTO[(day.getDay()+6)%7]}</span>
                                    <span className={cn("text-sm font-semibold", isToday(day) ? "text-indigo-400" : "text-foreground/80")}>
                                        {day.getDate()}
                                    </span>
                                </div>
                                <div className="relative flex-1">
                                    {HOURS.map(h => (
                                        <div key={h}
                                            onClick={() => { const d = new Date(day); d.setHours(h,0,0,0); onSlotClick(d); }}
                                            className="h-14 border-b border-border/10 hover:bg-foreground/3 cursor-pointer transition-colors"
                                        />
                                    ))}
                                    {dayTimedEvs.map(ev => {
                                        const start = new Date(ev.fecha_inicio);
                                        const end   = new Date(ev.fecha_fin);
                                        const dayStart = new Date(day); dayStart.setHours(0,0,0,0);
                                        const s = Math.max((start - dayStart) / 3600000, 0);
                                        const e = Math.min((end   - dayStart) / 3600000, 24);
                                        const C = COLOR_MAP[ev.color] || COLOR_MAP.blue;
                                        const tc = getTeamColor(ev, teamColorMap);
                                        return (
                                            <button key={ev.id}
                                                onClick={e2 => { e2.stopPropagation(); onEventClick(ev); }}
                                                style={{
                                                    top: `${s*56}px`,
                                                    height: `${Math.max((e-s)*56,20)}px`,
                                                    borderLeftColor: tc || undefined,
                                                }}
                                                className={cn(
                                                    "absolute left-1 right-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-left border-l-2 overflow-hidden hover:opacity-80 transition-opacity",
                                                    C.bg, C.text, !tc && C.border
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
        </div>
    );
}

// ─── Vista Día (split: sidebar + grid) ───────────────────────────────────────

function DayView({ day, eventos, onSlotClick, onEventClick, onNewEvent, teamColorMap = {} }) {
    const HOURS = Array.from({ length: 24 }, (_, i) => i);
    // Filtrar sólo los eventos que pertenecen a este día (igual que WeekGrid)
    const dayEventos = eventos.filter(ev => eventFallsOnDay(ev, day));
    const timedEvs   = eventos.filter(ev => !ev.todo_el_dia && eventOverlapsDay(ev, day));
    const gridRef  = useRef(null);

    // Scroll al inicio del horario laboral (07:00) al montar
    useEffect(() => {
        if (gridRef.current) {
            gridRef.current.scrollTop = 7 * 56;
        }
    }, [day.toDateString()]);

    return (
        <div className="flex flex-1 min-h-0">
            {/* Panel izquierdo: lista del día — oculto en móvil */}
            <DaySidebar
                day={day}
                eventos={dayEventos}
                onEventClick={onEventClick}
                onNewEvent={onNewEvent}
                className="hidden md:flex"
            />

            {/* Grid horario */}
            <div className="flex flex-1 min-h-0 overflow-auto" ref={gridRef}>
                <div className="w-14 shrink-0 border-r border-border/30 sticky left-0 bg-background z-10">
                    {HOURS.map(h => (
                        <div key={h} className="h-14 border-b border-border/10 px-2 flex items-start pt-1">
                            <span className="text-[9px] text-muted-foreground/60">{formatHour(h)}</span>
                        </div>
                    ))}
                </div>
                <div className="flex-1 relative min-w-0">
                    {HOURS.map(h => (
                        <div key={h}
                            onClick={() => { const d = new Date(day); d.setHours(h,0,0,0); onSlotClick(d); }}
                            className="h-14 border-b border-border/10 hover:bg-foreground/3 cursor-pointer transition-colors"
                        />
                    ))}
                    {timedEvs.map(ev => {
                        const start = new Date(ev.fecha_inicio);
                        const end   = new Date(ev.fecha_fin);
                        const dayStart = new Date(day); dayStart.setHours(0,0,0,0);
                        const s = Math.max((start - dayStart) / 3600000, 0);
                        const e = Math.min((end   - dayStart) / 3600000, 24);
                        const C = COLOR_MAP[ev.color] || COLOR_MAP.blue;
                        const tc = getTeamColor(ev, teamColorMap);
                        return (
                            <button key={ev.id}
                                onClick={e2 => { e2.stopPropagation(); onEventClick(ev); }}
                                style={{
                                    top: `${s*56}px`,
                                    height: `${Math.max((e-s)*56,24)}px`,
                                    borderLeftColor: tc || undefined,
                                }}
                                className={cn(
                                    "absolute left-2 right-2 rounded-lg px-2 py-1 text-[11px] font-medium text-left border-l-2 overflow-hidden hover:opacity-80 transition-opacity",
                                    C.bg, C.text, !tc && C.border
                                )}
                            >
                                {ev.titulo}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Vista Lista ──────────────────────────────────────────────────────────────

function ListView({ eventos, onEventClick }) {
    const grouped = {};
    [...eventos].sort((a, b) => {
        const da = a.todo_el_dia ? parseDateLocal(a.fecha_inicio) : new Date(a.fecha_inicio);
        const db2 = b.todo_el_dia ? parseDateLocal(b.fecha_inicio) : new Date(b.fecha_inicio);
        return da - db2;
    }).forEach(ev => {
        const d = ev.todo_el_dia ? parseDateLocal(ev.fecha_inicio) : new Date(ev.fecha_inicio);
        const key = d.toDateString();
        if (!grouped[key]) grouped[key] = { date: d, items: [] };
        grouped[key].items.push(ev);
    });

    if (!Object.keys(grouped).length) {
        return <div className="flex-1 flex items-center justify-center"><p className="text-sm text-muted-foreground">Sin eventos</p></div>;
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
                            const start = ev.todo_el_dia ? parseDateLocal(ev.fecha_inicio) : new Date(ev.fecha_inicio);
                            const end   = ev.todo_el_dia ? parseDateLocal(ev.fecha_fin)    : new Date(ev.fecha_fin);
                            const catLabel = CATEGORIAS.find(c => c.value === ev.categoria)?.label || ev.categoria;
                            return (
                                <button key={ev.id} onClick={() => onEventClick(ev)}
                                    className="w-full text-left bg-foreground/3 hover:bg-foreground/6 border border-border/30 rounded-xl px-4 py-3 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", C.dot)} />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{ev.titulo}</p>
                                                {ev.descripcion && <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.descripcion}</p>}
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {ev.todo_el_dia ? 'Todo el día' :
                                                            `${start.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})} – ${end.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}`}
                                                    </span>
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
            <button onClick={() => setOpen(o => !o)}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors",
                    value ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-400"
                          : "border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}>
                <Filter size={11} /> {label} <ChevronDown size={10} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute top-full mt-1 left-0 z-20 bg-background border border-border/60 rounded-xl shadow-xl py-1 min-w-[140px]">
                        <button onClick={() => { onChange(null); setOpen(false); }}
                            className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-foreground/6 transition-colors">
                            Todos
                        </button>
                        {options.map(o => (
                            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                                className={cn("w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2",
                                    value === o.value ? "text-indigo-400 bg-indigo-500/10" : "text-foreground hover:bg-foreground/6")}>
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

// ─── Sidebar categorías ───────────────────────────────────────────────────────

const CAT_SIDEBAR = [
    { value: 'reunion',      label: 'Reuniones',     dot: 'bg-blue-500'    },
    { value: 'tarea',        label: 'Tareas',         dot: 'bg-violet-500'  },
    { value: 'recordatorio', label: 'Recordatorios',  dot: 'bg-orange-500'  },
    { value: 'personal',     label: 'Personal',       dot: 'bg-emerald-500' },
    { value: 'vencimiento',  label: 'Vencimientos',   dot: 'bg-red-500'     },
];

// ─── Vistas config ────────────────────────────────────────────────────────────

const VIEWS = [
    { id: 'month', label: 'Mes',    Icon: LayoutGrid   },
    { id: 'week',  label: 'Semana', Icon: CalendarDays },
    { id: 'day',   label: 'Día',    Icon: Clock        },
    { id: 'list',  label: 'Lista',  Icon: List         },
];

function getTitle(view, anchor) {
    if (view === 'month') return `${MESES[anchor.getMonth()]} ${anchor.getFullYear()}`;
    if (view === 'week')  { const days = getWeekDays(anchor); return `Semana del ${days[0].getDate()} ${MESES[days[0].getMonth()]}`; }
    if (view === 'day')   return anchor.toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    return 'Todos los eventos';
}

function navigate(view, anchor, dir) {
    if (view === 'month') return addMonths(anchor, dir);
    if (view === 'week')  return addDays(anchor, dir * 7);
    if (view === 'day')   return addDays(anchor, dir);
    return anchor;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CalendarioView() {
    const prefs = loadPrefs();

    const [view,        setView]       = useState(prefs?.view || 'month');
    const [anchor,      setAnchor]     = useState(new Date());
    const [eventos,     setEventos]    = useState([]);
    const [loading,     setLoading]    = useState(false);
    const [search,      setSearch]     = useState('');
    const [teams,       setTeams]      = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [activeCats, setActiveCats] = useState(
        () => new Set(prefs?.activeCats || ALL_CATS)
    );
    const [filterTeam,  setFilterTeam]  = useState(prefs?.filterTeam  || null);
    const [filterColor, setFilterColor] = useState(prefs?.filterColor || null);
    const [filterTag,   setFilterTag]   = useState(prefs?.filterTag   || null);
    const [modal, setModal] = useState(null);

    const prefsRef = useRef({});
    useEffect(() => {
        const p = { view, activeCats: [...activeCats], filterTeam, filterColor, filterTag };
        if (JSON.stringify(p) !== JSON.stringify(prefsRef.current)) {
            prefsRef.current = p;
            savePrefs(p);
        }
    }, [view, activeCats, filterTeam, filterColor, filterTag]);

    useEffect(() => {
        getTeams().then(d => setTeams(Array.isArray(d) ? d : [])).catch(() => {});
    }, []);

    // Mapa id_team → color_hex para bordes de equipo en chips
    const teamColorMap = useMemo(() =>
        Object.fromEntries(teams.filter(t => t.color_hex).map(t => [t.id_team, t.color_hex]))
    , [teams]);

    const fetchEventos = useCallback(async () => {
        setLoading(true);
        try {
            const range  = getRangeForView(view, anchor);
            const params = { ...range };
            if (filterColor) params.color = filterColor;
            if (filterTag)   params.tag   = filterTag;
            const data = await getEventos(params);
            setEventos(Array.isArray(data) ? data : []);
        } catch {}
        finally { setLoading(false); }
    }, [view, anchor, filterColor, filterTag]);

    useEffect(() => { fetchEventos(); }, [fetchEventos]);

    function toggleCat(cat) {
        setActiveCats(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat); else next.add(cat);
            return next;
        });
    }

    const filteredEventos = eventos.filter(ev => {
        if (!activeCats.has(ev.categoria)) return false;
        if (search.trim() && !ev.titulo.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterTeam && ev.participantes) {
            if (!ev.participantes.some(p => p.tipo === 'team' && p.id_referencia === filterTeam)) return false;
        }
        return true;
    });

    function openNewEvent(defaultDate) { setModal({ event: null, defaultDate, teams }); }
    function openEvent(ev)             { setModal({ event: ev, teams }); }

    async function handleSave(form) {
        if (modal.event?.id) await updateEvento(modal.event.id, form);
        else                  await createEvento(form);
        setModal(null);
        fetchEventos();
    }

    async function handleDelete(id) {
        if (!confirm('¿Eliminar este evento?')) return;
        try { await deleteEvento(id); setModal(null); fetchEventos(); } catch {}
    }

    const colorOpts = COLORES.map(c => ({ value: c.value, label: c.label, dot: COLOR_MAP[c.value]?.dot }));
    const tagOpts   = TAGS_PRESET.map(t => ({ value: t, label: t }));

    const sidebarContent = (
        <>
            <div className="flex items-center justify-between md:hidden">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filtros</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <X size={14} />
                </button>
            </div>

            <button onClick={() => { openNewEvent(new Date()); setSidebarOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus size={15} /> Nuevo evento
            </button>

            <MiniCalendar
                selected={anchor}
                onSelect={date => { setAnchor(date); setView('day'); setSidebarOpen(false); }}
            />

            <div>
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">Categorías</p>
                <div className="space-y-0.5">
                    {CAT_SIDEBAR.map(cat => {
                        const active = activeCats.has(cat.value);
                        return (
                            <button key={cat.value} onClick={() => toggleCat(cat.value)}
                                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-foreground/5">
                                <div className={cn(
                                    "w-3.5 h-3.5 rounded shrink-0 border flex items-center justify-center transition-all",
                                    active ? `${cat.dot} border-transparent` : "border-border/60 bg-transparent"
                                )}>
                                    {active && (
                                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </div>
                                <span className={cn("transition-colors", active ? "text-foreground" : "text-muted-foreground/50")}>
                                    {cat.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {teams.length > 0 && (
                <div>
                    <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">Equipos</p>
                    <div className="space-y-0.5">
                        <button onClick={() => setFilterTeam(null)}
                            className={cn("flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-colors",
                                filterTeam === null ? "bg-foreground/8 text-foreground font-medium" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground")}>
                            <Users size={11} className="shrink-0" /> Todos
                        </button>
                        {teams.map(team => (
                            <button key={team.id_team}
                                onClick={() => setFilterTeam(filterTeam === team.id_team ? null : team.id_team)}
                                className={cn("flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-colors",
                                    filterTeam === team.id_team ? "bg-violet-500/15 text-violet-400 font-medium" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground")}>
                                <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                                {team.nombre}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="flex h-full min-h-0 overflow-hidden bg-background">

            {/* ── Backdrop móvil ── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar izquierdo ── */}
            <aside className={cn(
                "w-52 shrink-0 border-r border-border/30 flex flex-col py-4 px-3 gap-4 overflow-y-auto",
                "transition-transform duration-300 ease-in-out",
                "fixed inset-y-0 left-0 z-50 bg-background md:static md:bg-transparent md:shadow-none md:translate-x-0",
                sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
            )}>
                {sidebarContent}
            </aside>

            {/* ── Área principal ── */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">

                {/* Barra superior */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 shrink-0 flex-wrap gap-y-2">

                    {/* Botón filtros — solo móvil */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="flex md:hidden items-center gap-1.5 p-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
                        title="Filtros y categorías"
                    >
                        <SlidersHorizontal size={14} />
                    </button>

                    <div className="flex items-center gap-1">
                        <button onClick={() => setAnchor(navigate(view, anchor, -1))}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors">
                            <ChevronLeft size={15} />
                        </button>
                        <button onClick={() => setAnchor(new Date())}
                            className="px-3 py-1.5 rounded-lg border border-border/50 text-xs text-foreground hover:bg-foreground/8 transition-colors">
                            Hoy
                        </button>
                        <button onClick={() => setAnchor(navigate(view, anchor, 1))}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors">
                            <ChevronRight size={15} />
                        </button>
                    </div>

                    <h2 className="text-sm font-semibold text-foreground capitalize flex-1 truncate min-w-0">
                        {getTitle(view, anchor)}
                        {loading && <span className="ml-2 text-[11px] text-muted-foreground font-normal">Cargando…</span>}
                    </h2>

                    <div className="relative hidden sm:block">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar eventos…"
                            className="pl-7 pr-3 py-1.5 text-xs bg-foreground/5 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/60 w-36 transition-colors"
                        />
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5">
                        <FilterDropdown label="Colores" options={colorOpts} value={filterColor} onChange={setFilterColor} />
                        <FilterDropdown label="Tags"    options={tagOpts}   value={filterTag}   onChange={setFilterTag} />
                    </div>

                    <div className="flex items-center gap-0.5 bg-foreground/5 rounded-lg p-0.5 border border-border/30">
                        {VIEWS.map(v => (
                            <button key={v.id} onClick={() => setView(v.id)}
                                className={cn("flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs transition-all",
                                    view === v.id ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground")}>
                                <v.Icon size={12} />
                                <span className="hidden sm:inline">{v.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                    {view === 'month' && (
                        <MonthView anchor={anchor} eventos={filteredEventos}
                            onDayClick={day => { setAnchor(day); setView('day'); }}
                            onEventClick={openEvent} teamColorMap={teamColorMap} />
                    )}
                    {view === 'week' && (
                        <WeekGrid days={getWeekDays(anchor)} eventos={filteredEventos}
                            onSlotClick={openNewEvent} onEventClick={openEvent} teamColorMap={teamColorMap} />
                    )}
                    {view === 'day' && (
                        <DayView day={anchor} eventos={filteredEventos}
                            onSlotClick={openNewEvent} onEventClick={openEvent}
                            onNewEvent={openNewEvent} teamColorMap={teamColorMap} />
                    )}
                    {view === 'list' && (
                        <ListView eventos={filteredEventos} onEventClick={openEvent} />
                    )}
                </div>
            </div>

            {modal !== null && (
                <EventModal
                    event={modal.event}
                    defaultDate={modal.defaultDate}
                    teams={modal.teams || []}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}
