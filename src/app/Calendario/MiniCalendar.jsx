'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    MESES, getMonthGrid, isSameDay, isToday, addMonths, startOfMonth
} from './calUtils';

export default function MiniCalendar({ selected, onSelect }) {
    const month = selected ? new Date(selected) : new Date();
    month.setDate(1);

    function prevMonth() { onSelect(addMonths(month, -1)); }
    function nextMonth() { onSelect(addMonths(month,  1)); }

    const grid = getMonthGrid(month);

    return (
        <div className="w-full select-none px-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={prevMonth}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors"
                >
                    <ChevronLeft size={13} />
                </button>
                <span className="text-[11px] font-semibold text-foreground">
                    {MESES[month.getMonth()]} {month.getFullYear()}
                </span>
                <button
                    onClick={nextMonth}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors"
                >
                    <ChevronRight size={13} />
                </button>
            </div>

            {/* Días de semana */}
            <div className="grid grid-cols-7 mb-1">
                {['L','M','X','J','V','S','D'].map(d => (
                    <div key={d} className="text-center text-[9px] font-semibold text-muted-foreground/60 py-0.5">
                        {d}
                    </div>
                ))}
            </div>

            {/* Celdas */}
            <div className="grid grid-cols-7 gap-y-0.5">
                {grid.map((day, i) => {
                    const isCurrentMonth = day.getMonth() === month.getMonth();
                    const isTod  = isToday(day);
                    const isSel  = selected && isSameDay(day, new Date(selected));
                    return (
                        <button
                            key={i}
                            onClick={() => onSelect(new Date(day))}
                            className={cn(
                                "w-full aspect-square flex items-center justify-center rounded-full text-[10px] transition-colors",
                                !isCurrentMonth && "opacity-30",
                                isTod  && !isSel && "bg-indigo-500/20 text-indigo-400 font-bold",
                                isSel  && "bg-indigo-500 text-white font-bold",
                                !isTod && !isSel && "hover:bg-foreground/8 text-foreground/80"
                            )}
                        >
                            {day.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
