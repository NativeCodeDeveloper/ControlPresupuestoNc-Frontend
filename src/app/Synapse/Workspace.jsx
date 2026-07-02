'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, BookOpen, Target, ChevronRight, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import * as workspaceService from '../../services/workspaceService';

const ESTADO_CONFIG = {
    activa:      { label: 'Activa',      color: 'text-emerald-400', dot: 'bg-emerald-400' },
    pausada:     { label: 'Pausada',     color: 'text-amber-400',   dot: 'bg-amber-400'   },
    completada:  { label: 'Completada',  color: 'text-blue-400',    dot: 'bg-blue-400'    },
};

const PRIORIDAD_CONFIG = {
    sin_prioridad: { label: 'Sin prioridad', color: 'text-muted-foreground' },
    urgente:       { label: 'Urgente',       color: 'text-red-400'          },
    alta:          { label: 'Alta',          color: 'text-orange-400'       },
    media:         { label: 'Media',         color: 'text-yellow-400'       },
    baja:          { label: 'Baja',          color: 'text-blue-400'         },
};

const COLORS = [
    '#8B5CF6','#6366F1','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#14B8A6','#F97316','#84CC16',
];

function ColorPicker({ value, onChange }) {
    return (
        <div className="flex gap-1.5 flex-wrap">
            {COLORS.map(c => (
                <button
                    key={c}
                    type="button"
                    onClick={() => onChange(c)}
                    className={cn(
                        "w-5 h-5 rounded-full transition-transform",
                        value === c ? "ring-2 ring-white ring-offset-1 ring-offset-background scale-110" : "hover:scale-110"
                    )}
                    style={{ background: c }}
                />
            ))}
        </div>
    );
}

function InitialsAvatar({ titulo, color }) {
    const initials = titulo?.slice(0, 2).toUpperCase() || 'W';
    return (
        <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
            style={{ background: color || '#8B5CF6' }}
        >
            {initials}
        </div>
    );
}

function CreateModal({ onClose, onCreate }) {
    const [titulo, setTitulo]       = useState('');
    const [resumen, setResumen]     = useState('');
    const [color, setColor]         = useState('#8B5CF6');
    const [loading, setLoading]     = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!titulo.trim()) return;
        setLoading(true);
        try {
            const item = await workspaceService.createIniciativa({ titulo: titulo.trim(), resumen: resumen.trim(), color_hex: color });
            onCreate(item);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <form
                onClick={e => e.stopPropagation()}
                onSubmit={handleSubmit}
                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold">Nueva iniciativa</h2>
                    <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <InitialsAvatar titulo={titulo || 'W'} color={color} />
                    <ColorPicker value={color} onChange={setColor} />
                </div>

                <input
                    autoFocus
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    placeholder="Nombre de la iniciativa"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
                />

                <textarea
                    value={resumen}
                    onChange={e => setResumen(e.target.value)}
                    placeholder="Resumen breve (opcional)"
                    rows={2}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                />

                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-foreground/5 transition-colors">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!titulo.trim() || loading}
                        className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creando...' : 'Crear'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function Workspace() {
    const [iniciativas, setIniciativas] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [showCreate, setShowCreate]   = useState(false);
    const [deletingId, setDeletingId]   = useState(null);
    const router = useRouter();

    useEffect(() => {
        workspaceService.getIniciativas()
            .then(data => setIniciativas(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = iniciativas.filter(i => {
        const matchSearch = !search || i.titulo.toLowerCase().includes(search.toLowerCase()) || i.resumen?.toLowerCase().includes(search.toLowerCase());
        const matchEstado = filterEstado === 'todos' || i.estado === filterEstado;
        return matchSearch && matchEstado;
    });

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        setDeletingId(id);
        try {
            await workspaceService.deleteIniciativa(id);
            setIniciativas(prev => prev.filter(i => i.id_iniciativa !== id));
        } catch {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-0 bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5">
                    <BookOpen size={16} className="text-violet-400" />
                    <h1 className="text-[15px] font-semibold">Workspace</h1>
                    <span className="text-[11px] text-muted-foreground bg-foreground/5 rounded-full px-2 py-0.5">
                        {iniciativas.length}
                    </span>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Plus size={13} /> Nueva iniciativa
                </button>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-border/40 shrink-0">
                <div className="relative flex-1 max-w-xs">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar iniciativa..."
                        className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-violet-500"
                    />
                </div>
                <select
                    value={filterEstado}
                    onChange={e => setFilterEstado(e.target.value)}
                    className="text-[12px] bg-background border border-border rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-violet-500 text-muted-foreground"
                >
                    <option value="todos">Todos los estados</option>
                    {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
            </div>

            {/* Tabla */}
            <div className="flex-1 min-h-0 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Cargando...</div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                        <BookOpen size={28} strokeWidth={1.2} className="opacity-30" />
                        <p className="text-sm">{search || filterEstado !== 'todos' ? 'Sin resultados' : 'No hay iniciativas aún'}</p>
                        {!search && filterEstado === 'todos' && (
                            <button onClick={() => setShowCreate(true)} className="text-[12px] text-violet-400 hover:underline">
                                Crear primera iniciativa
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="border-b border-border/30 text-[11px] text-muted-foreground font-medium">
                                <th className="text-left px-6 py-2.5 font-medium">Nombre</th>
                                <th className="text-left px-4 py-2.5 font-medium w-28">Estado</th>
                                <th className="text-left px-4 py-2.5 font-medium w-28">Prioridad</th>
                                <th className="text-left px-4 py-2.5 font-medium w-36 hidden md:table-cell">Propietario</th>
                                <th className="text-left px-4 py-2.5 font-medium w-32 hidden lg:table-cell">Fecha objetivo</th>
                                <th className="w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(ini => {
                                const estado   = ESTADO_CONFIG[ini.estado]    || ESTADO_CONFIG.activa;
                                const prioridad = PRIORIDAD_CONFIG[ini.prioridad] || PRIORIDAD_CONFIG.sin_prioridad;
                                return (
                                    <tr
                                        key={ini.id_iniciativa}
                                        onClick={() => router.push(`/synapse/workspace/${ini.id_iniciativa}`)}
                                        className="border-b border-border/20 hover:bg-foreground/3 cursor-pointer group transition-colors"
                                    >
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <InitialsAvatar titulo={ini.titulo} color={ini.color_hex} />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-medium text-foreground truncate">{ini.titulo}</span>
                                                    {ini.resumen && (
                                                        <span className="text-[11px] text-muted-foreground truncate">{ini.resumen}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", estado.dot)} />
                                                <span className={estado.color}>{estado.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={prioridad.color}>{prioridad.label}</span>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                                            {ini.propietario || <span className="opacity-30">—</span>}
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                                            {ini.fecha_objetivo
                                                ? new Date(ini.fecha_objetivo).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : <span className="opacity-30">Sin fecha</span>}
                                        </td>
                                        <td className="px-2 py-3">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={e => handleDelete(e, ini.id_iniciativa)}
                                                    disabled={deletingId === ini.id_iniciativa}
                                                    className="p-1 text-muted-foreground hover:text-red-400 rounded transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                                <ChevronRight size={13} className="text-muted-foreground/40" />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {showCreate && (
                <CreateModal
                    onClose={() => setShowCreate(false)}
                    onCreate={item => setIniciativas(prev => [item, ...prev])}
                />
            )}
        </div>
    );
}
