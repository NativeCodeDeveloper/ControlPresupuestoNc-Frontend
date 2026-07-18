'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Receipt, Loader2, RefreshCw, Search, X,
    CheckCircle2, XCircle, Clock, AlertTriangle, HelpCircle,
} from 'lucide-react';
import { cn, formatCLP } from '../../lib/utils';
import * as dteService from '../../services/dteService';

const TIPO_LABEL = { 33: 'Factura', 39: 'Boleta', 41: 'Boleta exenta', 61: 'Nota de crédito' };

const ESTADO_CFG = {
    pendiente: { label: 'Pendiente', icon: Clock, cls: 'text-muted-foreground border-border bg-foreground/5' },
    enviado: { label: 'Enviado', icon: Clock, cls: 'text-sky-400 border-sky-500/30 bg-sky-500/8' },
    aceptado: { label: 'Aceptado', icon: CheckCircle2, cls: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/8' },
    rechazado: { label: 'Rechazado', icon: XCircle, cls: 'text-red-400 border-red-500/30 bg-red-500/8' },
    observado: { label: 'Observado', icon: AlertTriangle, cls: 'text-amber-400 border-amber-500/30 bg-amber-500/8' },
};

function EstadoBadge({ estado }) {
    const cfg = ESTADO_CFG[estado] || { label: estado || '—', icon: HelpCircle, cls: 'text-muted-foreground border-border bg-foreground/5' };
    const Icon = cfg.icon;
    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap', cfg.cls)}>
            <Icon size={10} /> {cfg.label}
        </span>
    );
}

const AMBIENTE_CLS = {
    certificacion: 'text-amber-400 border-amber-500/30 bg-amber-500/8',
    produccion: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/8',
};

export default function DocumentosTributarios() {
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [resultadoRefresco, setResultadoRefresco] = useState(null);
    const [search, setSearch] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await dteService.getDocumentos({ tipoDte: filtroTipo || undefined, estado: filtroEstado || undefined });
            setDocumentos(data);
        } finally {
            setLoading(false);
        }
    }, [filtroTipo, filtroEstado]);

    useEffect(() => { load(); }, [load]);

    const handleActualizarEstados = async () => {
        setRefrescando(true);
        setResultadoRefresco(null);
        try {
            const res = await dteService.actualizarEstados();
            setResultadoRefresco(res);
            await load();
        } finally {
            setRefrescando(false);
        }
    };

    const documentosFiltrados = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return documentos;
        return documentos.filter(d =>
            d.receptor_nombre?.toLowerCase().includes(q) ||
            d.receptor_rut?.toLowerCase().includes(q) ||
            String(d.folio).includes(q) ||
            d.track_id?.toLowerCase().includes(q)
        );
    }, [documentos, search]);

    const contadores = useMemo(() => {
        const c = { aceptado: 0, enviado: 0, rechazado: 0, observado: 0, pendiente: 0 };
        for (const d of documentos) if (c[d.estado_sii] !== undefined) c[d.estado_sii]++;
        return c;
    }, [documentos]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <Receipt size={16} className="text-amber-400" strokeWidth={1.8} />
                    <h2 className="font-semibold text-[15px]">Documentos Tributarios</h2>
                    <span className="text-[11px] text-muted-foreground bg-foreground/5 border border-border rounded-full px-2 py-0.5">
                        {documentosFiltrados.length}{documentosFiltrados.length !== documentos.length && `/${documentos.length}`}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={handleActualizarEstados}
                        disabled={refrescando}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[12px] font-medium transition-colors disabled:opacity-50"
                    >
                        {refrescando ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        Consultar estado en el SII
                    </button>
                    <button onClick={load} disabled={loading} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-foreground/5 transition-colors">
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    </button>
                </div>
            </div>

            {resultadoRefresco && (
                <p className="text-[11px] text-muted-foreground">
                    {resultadoRefresco.error
                        ? `Error al consultar el SII: ${resultadoRefresco.error}`
                        : `Revisados ${resultadoRefresco.revisados} documento(s) pendiente(s), ${resultadoRefresco.actualizados} actualizado(s).`}
                </p>
            )}

            {/* Contadores rápidos */}
            <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(contadores).filter(([, n]) => n > 0).map(([estado, n]) => (
                    <button
                        key={estado}
                        onClick={() => setFiltroEstado(f => f === estado ? '' : estado)}
                        className={cn('flex items-center gap-1 transition-opacity', filtroEstado && filtroEstado !== estado && 'opacity-40')}
                    >
                        <EstadoBadge estado={estado} />
                        <span className="text-[10px] text-muted-foreground">{n}</span>
                    </button>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por receptor, RUT, folio o Track ID…"
                        className="w-full pl-7 pr-7 py-1.5 text-[12px] bg-card border border-border rounded-lg outline-none focus:border-amber-500/50 transition-colors"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X size={11} />
                        </button>
                    )}
                </div>
                <select
                    value={filtroTipo}
                    onChange={e => setFiltroTipo(e.target.value)}
                    className="text-[12px] bg-card border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500/50"
                >
                    <option value="">Todos los tipos</option>
                    <option value="39">Boleta (39)</option>
                    <option value="33">Factura (33)</option>
                </select>
                {filtroEstado && (
                    <button onClick={() => setFiltroEstado('')} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                        <X size={11} /> Quitar filtro de estado
                    </button>
                )}
            </div>

            {/* Tabla */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading && documentos.length === 0 ? (
                    <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                        <Loader2 size={14} className="animate-spin" /> <span className="text-[12px]">Cargando documentos…</span>
                    </div>
                ) : documentosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                        <Receipt size={32} strokeWidth={1.3} className="opacity-20" />
                        <p className="text-[13px]">{documentos.length === 0 ? 'Aún no se ha emitido ningún documento.' : 'Sin resultados para ese filtro.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                                    <th className="px-3 py-2 font-medium">Folio</th>
                                    <th className="px-3 py-2 font-medium">Tipo</th>
                                    <th className="px-3 py-2 font-medium">Receptor</th>
                                    <th className="px-3 py-2 font-medium text-right">Monto</th>
                                    <th className="px-3 py-2 font-medium">Estado</th>
                                    <th className="px-3 py-2 font-medium">Track ID</th>
                                    <th className="px-3 py-2 font-medium">Ambiente</th>
                                    <th className="px-3 py-2 font-medium">Emitido</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {documentosFiltrados.map(d => (
                                    <tr key={d.id} className="hover:bg-foreground/[0.015] transition-colors">
                                        <td className="px-3 py-2 font-mono text-amber-300">{d.folio}</td>
                                        <td className="px-3 py-2 text-muted-foreground">{TIPO_LABEL[d.tipo_dte] || d.tipo_dte}</td>
                                        <td className="px-3 py-2">
                                            <p className="text-foreground truncate max-w-[180px]">{d.receptor_nombre || '—'}</p>
                                            {d.receptor_rut && <p className="text-[10px] font-mono text-muted-foreground/70">{d.receptor_rut}</p>}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono">{formatCLP(d.monto_total)}</td>
                                        <td className="px-3 py-2">
                                            <EstadoBadge estado={d.estado_sii} />
                                            {d.error_mensaje && (
                                                <p className="text-[10px] text-red-400/80 mt-0.5 max-w-[220px] truncate" title={d.error_mensaje}>{d.error_mensaje}</p>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{d.track_id || '—'}</td>
                                        <td className="px-3 py-2">
                                            <span className={cn('px-1.5 py-0.5 rounded border text-[10px]', AMBIENTE_CLS[d.ambiente])}>
                                                {d.ambiente === 'produccion' ? 'Producción' : 'Certificación'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                            {new Date(d.emitido_en).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
