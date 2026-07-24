'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Pencil } from 'lucide-react';

/**
 * ClientSelector — buscador de proyectos/clientes reutilizable
 *
 * mode="single"  → selected: {id_proyecto, nombre, email} | null
 * mode="multi"   → selected: [{id_proyecto, nombre, email}]
 * onChange: emite el mismo formato según mode
 */
export default function ClientSelector({ proyectos = [], mode = 'multi', selected, onChange }) {
    const [search, setSearch] = useState('');
    const checkAllRef = useRef(null);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return proyectos;
        return proyectos.filter(p =>
            p.nombre?.toLowerCase().includes(q) ||
            (p.nombre_cliente || '').toLowerCase().includes(q) ||
            (p.email_cliente  || '').toLowerCase().includes(q)
        );
    }, [proyectos, search]);

    const isSelected = (id) =>
        mode === 'single'
            ? selected?.id_proyecto === id
            : Array.isArray(selected) && selected.some(s => s.id_proyecto === id);

    const getItem = (id) =>
        mode === 'single'
            ? (selected?.id_proyecto === id ? selected : null)
            : (Array.isArray(selected) ? selected.find(s => s.id_proyecto === id) : null);

    const makeItem = (p) => ({
        id_proyecto: p.id_proyecto,
        nombre:      p.nombre_cliente || p.nombre,
        email:       p.email_cliente  || '',
    });

    const handleToggle = (p) => {
        if (mode === 'single') {
            onChange(isSelected(p.id_proyecto) ? null : makeItem(p));
        } else {
            const arr = Array.isArray(selected) ? selected : [];
            onChange(isSelected(p.id_proyecto)
                ? arr.filter(s => s.id_proyecto !== p.id_proyecto)
                : [...arr, makeItem(p)]
            );
        }
    };

    // "Seleccionar todos" — solo aplica en modo multi y sobre los filtrados visibles
    const selectedIds   = mode === 'multi' && Array.isArray(selected) ? new Set(selected.map(s => s.id_proyecto)) : new Set();
    const filteredIds   = new Set(filtered.map(p => p.id_proyecto));
    const allChecked    = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id_proyecto));
    const someChecked   = filtered.some(p => selectedIds.has(p.id_proyecto));

    useEffect(() => {
        if (checkAllRef.current && mode === 'multi') {
            checkAllRef.current.indeterminate = someChecked && !allChecked;
        }
    }, [someChecked, allChecked, mode]);

    const handleSelectAll = () => {
        if (mode !== 'multi') return;
        const arr = Array.isArray(selected) ? selected : [];
        if (allChecked) {
            // Deseleccionar los filtrados visibles, mantener el resto
            onChange(arr.filter(s => !filteredIds.has(s.id_proyecto)));
        } else {
            // Agregar los filtrados que aún no están seleccionados
            const nuevos = filtered
                .filter(p => !selectedIds.has(p.id_proyecto))
                .map(makeItem);
            onChange([...arr, ...nuevos]);
        }
    };

    const handleField = (id_proyecto, field, value) => {
        if (mode === 'single') {
            if (selected?.id_proyecto === id_proyecto) onChange({ ...selected, [field]: value });
        } else {
            onChange((Array.isArray(selected) ? selected : []).map(s =>
                s.id_proyecto === id_proyecto ? { ...s, [field]: value } : s
            ));
        }
    };

    const fieldCls = "flex-1 bg-secondary/50 border border-border/60 rounded-md px-2 py-1 text-[11px] text-foreground focus:outline-none focus:border-sky-500/50 min-w-0";

    // Modo single con selección hecha: colapsar a una tarjeta compacta en vez de
    // seguir mostrando la lista completa (evita que las filas se reordenen/oculten
    // detrás del scroll y deja claro cómo elegir otro proyecto).
    if (mode === 'single' && selected) {
        return (
            <div className="rounded-xl border border-sky-500/50 bg-sky-500/8 px-3 py-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{selected.nombre || 'Sin nombre'}</p>
                    <button type="button" onClick={() => onChange(null)}
                            className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium shrink-0">
                        <Pencil size={11} /> Cambiar
                    </button>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">Nombre</span>
                        <input type="text" value={selected.nombre ?? ''}
                               onChange={e => onChange({ ...selected, nombre: e.target.value })}
                               className={fieldCls} placeholder="Nombre del cliente" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">Email</span>
                        <input type="email" value={selected.email ?? ''}
                               onChange={e => onChange({ ...selected, email: e.target.value })}
                               className={fieldCls} placeholder="email@cliente.com" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Buscador */}
            <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por proyecto o cliente..."
                    className="w-full pl-8 pr-8 py-2 bg-secondary/40 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                {search && (
                    <button type="button" onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Seleccionar todos — solo modo multi */}
            {mode === 'multi' && filtered.length > 0 && (
                <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
                    <input
                        ref={checkAllRef}
                        type="checkbox"
                        checked={allChecked}
                        onChange={handleSelectAll}
                        className="shrink-0 accent-sky-500"
                    />
                    <span className="text-[12px] text-muted-foreground">
                        {allChecked ? 'Deseleccionar todos' : 'Seleccionar todos'}
                        {search && filtered.length < proyectos.length && (
                            <span className="ml-1 opacity-60">({filtered.length} visibles)</span>
                        )}
                    </span>
                    {someChecked && (
                        <span className="ml-auto text-[10px] text-sky-400 font-medium">
                            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
                        </span>
                    )}
                </label>
            )}

            {/* Lista */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Sin resultados</p>
                )}
                {filtered.map(p => {
                    const sel  = isSelected(p.id_proyecto);
                    const item = getItem(p.id_proyecto);
                    return (
                        <div key={p.id_proyecto}
                             className={`rounded-xl border transition-all ${
                                 sel
                                     ? 'border-sky-500/50 bg-sky-500/8'
                                     : 'border-border/50 hover:border-sky-500/30 hover:bg-secondary/10'
                             }`}>
                            <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                                <input
                                    type={mode === 'single' ? 'radio' : 'checkbox'}
                                    checked={sel}
                                    onChange={() => handleToggle(p)}
                                    className="shrink-0 accent-sky-500"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{p.nombre}</p>
                                    {p.nombre_cliente && p.nombre_cliente !== p.nombre && (
                                        <p className="text-[11px] text-muted-foreground truncate">{p.nombre_cliente}</p>
                                    )}
                                </div>
                                {!sel && p.email_cliente && (
                                    <span className="text-[10px] text-muted-foreground/60 truncate max-w-[120px] shrink-0">
                                        {p.email_cliente}
                                    </span>
                                )}
                            </label>

                            {/* Campos editables al seleccionar */}
                            {sel && (
                                <div className="px-3 pb-2.5 space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">Nombre</span>
                                        <input
                                            type="text"
                                            value={item?.nombre ?? ''}
                                            onChange={e => handleField(p.id_proyecto, 'nombre', e.target.value)}
                                            className={fieldCls}
                                            placeholder="Nombre del cliente"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">Email</span>
                                        <input
                                            type="email"
                                            value={item?.email ?? ''}
                                            onChange={e => handleField(p.id_proyecto, 'email', e.target.value)}
                                            className={fieldCls}
                                            placeholder="email@cliente.com"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
