// ─── Date helpers (no external dependency) ────────────────────────────────────

export const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export const DIAS_CORTO = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

export function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=sun
    const diff = day === 0 ? -6 : 1 - day; // make Mon first
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

export function addMonths(date, n) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + n);
    return d;
}

export function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

export function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth()    === b.getMonth()    &&
           a.getDate()     === b.getDate();
}

export function isToday(date) { return isSameDay(date, new Date()); }

export function getMonthGrid(month) {
    const first = startOfMonth(month);
    const last  = endOfMonth(month);
    const startDay = first.getDay() === 0 ? 6 : first.getDay() - 1; // Mon=0
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(addDays(first, i - startDay));
    let d = new Date(first);
    while (d <= last) { cells.push(new Date(d)); d = addDays(d, 1); }
    while (cells.length % 7 !== 0) cells.push(addDays(cells[cells.length - 1], 1));
    return cells;
}

export function getWeekDays(anchor) {
    const mon = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

export function toDatetimeLocal(date) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatHour(h) {
    return `${String(h).padStart(2, '0')}:00`;
}

export function eventOverlapsDay(ev, day) {
    const start = new Date(ev.fecha_inicio);
    const end   = new Date(ev.fecha_fin);
    const dayStart = new Date(day); dayStart.setHours(0,0,0,0);
    const dayEnd   = new Date(day); dayEnd.setHours(23,59,59,999);
    return start <= dayEnd && end >= dayStart;
}

// ─── Color map ────────────────────────────────────────────────────────────────

export const COLOR_MAP = {
    blue:   { bg: 'bg-blue-500/20',   text: 'text-blue-400',   dot: 'bg-blue-500',   border: 'border-blue-500' },
    green:  { bg: 'bg-emerald-500/20',text: 'text-emerald-400',dot: 'bg-emerald-500',border: 'border-emerald-500' },
    purple: { bg: 'bg-violet-500/20', text: 'text-violet-400', dot: 'bg-violet-500', border: 'border-violet-500' },
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-500', border: 'border-orange-500' },
    pink:   { bg: 'bg-pink-500/20',   text: 'text-pink-400',   dot: 'bg-pink-500',   border: 'border-pink-500' },
    red:    { bg: 'bg-red-500/20',    text: 'text-red-400',    dot: 'bg-red-500',    border: 'border-red-500' },
};

export const CATEGORIAS = [
    { value: 'reunion',     label: 'Reunión' },
    { value: 'tarea',       label: 'Tarea' },
    { value: 'recordatorio',label: 'Recordatorio' },
    { value: 'personal',    label: 'Personal' },
    { value: 'vencimiento', label: 'Vencimiento' },
];

export const COLORES = [
    { value: 'blue',   label: 'Azul' },
    { value: 'green',  label: 'Verde' },
    { value: 'purple', label: 'Morado' },
    { value: 'orange', label: 'Naranja' },
    { value: 'pink',   label: 'Rosa' },
    { value: 'red',    label: 'Rojo' },
];

export const TAGS_PRESET = ['Importante','Urgente','Trabajo','Personal','Equipo','Cliente'];

export const RECORDATORIO_OPTS = [
    { value: 30,   label: '30 minutos antes' },
    { value: 60,   label: '1 hora antes' },
    { value: 360,  label: '6 horas antes' },
    { value: 1440, label: '1 día antes' },
];
