'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePersistedState } from '../../hooks/usePersistedState';
import {
    Users2, Search, RefreshCw, Loader2, ChevronDown, ChevronUp,
    Mail, Phone, CreditCard, Briefcase, Server, Shield, ExternalLink,
    TrendingUp, AlertCircle, Clock, CheckCircle2, Minus, X
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../lib/utils';
import * as svc from '../../services/clientesService';
import AdjuntosPanel from '../../components/AdjuntosPanel';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const ALERTA = {
    verde:   { cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', Icon: CheckCircle2, label: 'Al día' },
    naranja: { cls: 'text-amber-400  bg-amber-500/10  border-amber-500/20',  Icon: Clock,         label: 'Por vencer' },
    rojo:    { cls: 'text-red-400    bg-red-500/10    border-red-500/20',    Icon: AlertCircle,   label: 'Vencido' },
    null:    { cls: 'text-muted-foreground bg-secondary border-border',      Icon: Minus,         label: 'Único' },
};

function AlertaBadge({ alerta }) {
    const cfg = ALERTA[alerta] || ALERTA.null;
    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border', cfg.cls)}>
            <cfg.Icon size={9} strokeWidth={2.5} />{cfg.label}
        </span>
    );
}

// ── Card de cliente ───────────────────────────────────────────────────────────

function ClienteCard({ cliente, onSelect, isSelected }) {
    return (
        <button
            onClick={() => onSelect(isSelected ? null : cliente.nombre_cliente)}
            className={cn(
                'w-full text-left rounded-2xl border p-4 transition-all duration-150',
                isSelected
                    ? 'border-amber-500/40 bg-amber-500/5 shadow-sm'
                    : 'border-border hover:border-amber-500/20 hover:bg-foreground/[0.015] bg-card'
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <p className="font-semibold text-[14px] text-foreground truncate">{cliente.nombre_cliente}</p>
                    {cliente.profesion_cliente && (
                        <p className="text-[11px] text-muted-foreground truncate">{cliente.profesion_cliente}</p>
                    )}
                </div>
                <span className={cn(
                    'shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                    'border-amber-500/30 bg-amber-500/10 text-amber-400'
                )}>
                    {cliente.total_proyectos} proy.
                </span>
            </div>

            {/* Contacto */}
            <div className="space-y-1 mb-3">
                {cliente.email_cliente && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                        <Mail size={11} className="shrink-0 text-muted-foreground/60" />
                        {cliente.email_cliente}
                    </div>
                )}
                {cliente.telefono_cliente && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Phone size={11} className="shrink-0 text-muted-foreground/60" />
                        {cliente.telefono_cliente}
                    </div>
                )}
                {cliente.rut_cliente && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <CreditCard size={11} className="shrink-0 text-muted-foreground/60" />
                        {cliente.rut_cliente}
                    </div>
                )}
            </div>

            {/* Métricas */}
            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total facturado</p>
                    <p className="text-[13px] font-semibold text-amber-400 tabular-nums">{fmt(cliente.monto_total)}</p>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Último proyecto</p>
                    <p className="text-[11px] text-muted-foreground">{fmtDate(cliente.ultimo_proyecto)}</p>
                </div>
                {isSelected
                    ? <ChevronUp size={14} className="text-amber-400 shrink-0" />
                    : <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                }
            </div>
        </button>
    );
}

// ── Panel detalle proyectos ───────────────────────────────────────────────────

function ClienteDetalle({ nombre, onClose }) {
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        setLoading(true);
        svc.getClienteProyectos(nombre)
            .then(d => setProyectos(Array.isArray(d) ? d : []))
            .catch(() => setProyectos([]))
            .finally(() => setLoading(false));
    }, [nombre]);

    return (
        <div className="bg-card border border-amber-500/20 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-amber-500/5">
                <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-amber-400" />
                    <span className="font-semibold text-[13px]">{nombre}</span>
                    <span className="text-[11px] text-muted-foreground">— {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''}</span>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X size={14} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-[12px]">Cargando proyectos…</span>
                </div>
            ) : proyectos.length === 0 ? (
                <p className="text-center py-8 text-[12px] text-muted-foreground">Sin proyectos</p>
            ) : (
                <div className="divide-y divide-border/40">
                    {proyectos.map(p => (
                        <div key={p.id_proyecto} className="px-4 py-3 flex flex-col gap-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            {/* Proyecto */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-[13px] text-foreground truncate">{p.nombre}</span>
                                    {p.codigo_interno && (
                                        <span className="text-[10px] font-mono text-amber-400/80">{p.codigo_interno}</span>
                                    )}
                                    {p.estado_nombre && (
                                        <span
                                            className="text-[10px] px-1.5 py-0.5 rounded border"
                                            style={{ color: p.estado_color, borderColor: `${p.estado_color}40`, background: `${p.estado_color}15` }}
                                        >
                                            {p.estado_nombre}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                    {p.servidor_backserver && (
                                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Server size={9} />
                                            {p.servidor_backserver.replace(/^https?:\/\//, '')}
                                        </span>
                                    )}
                                    <span className="text-[11px] font-semibold tabular-nums text-foreground">{fmt(p.monto_acordado)}</span>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center gap-2 shrink-0">
                                {p.boveda_id ? (
                                    <Link
                                        href={`/clientes/boveda?entrada=${p.boveda_id}`}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-500/30 text-[11px] text-amber-400 hover:bg-amber-500/10 transition-colors"
                                    >
                                        <Shield size={11} /> Bóveda
                                    </Link>
                                ) : (
                                    <Link
                                        href={`/clientes/boveda?nuevo=${p.id_proyecto}`}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-border text-[11px] text-muted-foreground hover:border-amber-500/30 hover:text-amber-400 transition-colors"
                                    >
                                        <Shield size={11} /> + Bóveda
                                    </Link>
                                )}
                                {p.servidor_backserver && (
                                    <a
                                        href={p.servidor_backserver.startsWith('http') ? p.servidor_backserver : `https://${p.servidor_backserver}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-7 h-7 rounded-lg border border-border text-muted-foreground hover:text-amber-400 hover:border-amber-500/30 transition-colors"
                                        title="Abrir backend"
                                    >
                                        <ExternalLink size={11} />
                                    </a>
                                )}
                            </div>
                            </div>
                            {/* Carpeta de documentos por proyecto */}
                            <div className="pl-1">
                                <AdjuntosPanel
                                    entidad="proyecto"
                                    idEntidad={p.id_proyecto}
                                    compact
                                    label="Documentos"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CRM() {
    const [clientes, setClientes]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [selected, setSelected]   = useState(null);
    const [search, setSearch]       = usePersistedState('crm:search', '');
    const searchParams               = useSearchParams();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await svc.getClientes();
            setClientes(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('[CRM]', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Cuando viene de Bóveda con ?cliente=NombreCliente, abre el detalle directo
    useEffect(() => {
        const clienteParam = searchParams.get('cliente');
        if (clienteParam) setSelected(decodeURIComponent(clienteParam));
    }, [searchParams]);

    const filtrados = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return clientes;
        return clientes.filter(c =>
            c.nombre_cliente?.toLowerCase().includes(q) ||
            c.email_cliente?.toLowerCase().includes(q) ||
            c.rut_cliente?.toLowerCase().includes(q)
        );
    }, [clientes, search]);

    const totalClientes  = clientes.length;
    const totalFacturado = clientes.reduce((s, c) => s + Number(c.monto_total || 0), 0);
    const totalProyectos = clientes.reduce((s, c) => s + Number(c.total_proyectos || 0), 0);

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Users2 size={18} className="text-amber-400" strokeWidth={1.8} />
                        <h1 className="text-[18px] font-semibold tracking-tight">CRM — Clientes</h1>
                    </div>
                    <p className="text-[12px] text-muted-foreground">Directorio de clientes y sus proyectos</p>
                </div>

                {/* Métricas rápidas */}
                <div className="flex gap-3 flex-wrap">
                    {[
                        { label: 'Clientes', value: totalClientes,           cls: 'text-amber-400' },
                        { label: 'Proyectos', value: totalProyectos,          cls: 'text-foreground' },
                        { label: 'Facturado total', value: fmt(totalFacturado), cls: 'text-emerald-400' },
                    ].map(m => (
                        <div key={m.label} className="bg-card border border-border rounded-xl px-4 py-2.5 min-w-[110px]">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
                            <p className={cn('text-[14px] font-semibold tabular-nums', m.cls)}>{m.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Búsqueda */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, email o RUT…"
                        className="w-full pl-8 pr-3 py-2 text-[13px] bg-card border border-border rounded-lg outline-none focus:border-amber-500/60 transition-colors"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X size={12} />
                        </button>
                    )}
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors disabled:opacity-40"
                >
                    {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                </button>
                <span className="text-[12px] text-muted-foreground">
                    {filtrados.length}{filtrados.length !== clientes.length && ` / ${clientes.length}`} clientes
                </span>
            </div>

            {loading && clientes.length === 0 ? (
                <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-[13px]">Cargando clientes…</span>
                </div>
            ) : filtrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
                    <Users2 size={32} strokeWidth={1.4} className="opacity-30" />
                    <p className="text-[13px]">{search ? 'Sin resultados' : 'No hay clientes registrados'}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtrados.map(cliente => (
                        <div key={cliente.nombre_cliente}>
                            <ClienteCard
                                cliente={cliente}
                                onSelect={setSelected}
                                isSelected={selected === cliente.nombre_cliente}
                            />
                            {selected === cliente.nombre_cliente && (
                                <div className="mt-2">
                                    <ClienteDetalle
                                        nombre={cliente.nombre_cliente}
                                        onClose={() => setSelected(null)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
