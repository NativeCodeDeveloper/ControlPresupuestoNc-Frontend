'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Rss, Send, RefreshCw, CheckCircle2, AlertCircle, Clock, Users, User } from 'lucide-react';
import { getProjects } from '../../services/projectsService';
import * as actualizacionesService from '../../services/actualizacionesService';
import ClientSelector from './ClientSelector';

const PRIORIDAD = {
    baja:    { label: 'Baja',    cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    media:   { label: 'Media',   cls: 'text-amber-400   bg-amber-500/10   border-amber-500/30'   },
    alta:    { label: 'Alta',    cls: 'text-orange-400  bg-orange-500/10  border-orange-500/30'  },
    critica: { label: 'Crítica', cls: 'text-red-400     bg-red-500/10     border-red-500/30'     },
};

const TEMPLATE_DEFAULT = `Les comunicamos que hemos realizado una actualización en el sistema NativeCode Finance.

Cambios principales:
• [Describe el cambio 1]
• [Describe el cambio 2]

Si experimentas algún problema o tienes preguntas, no dudes en contactarnos.`;

const CACHE_KEY = 'ncf:nexus:actualizaciones:v2';
function cacheLoad() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; } }
function cacheSave(d) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch {} }

function fmt(date) {
    if (!date) return '—';
    const d = typeof date === 'string' && !date.includes('T')
        ? new Date(date.replace(' ', 'T') + 'Z')
        : new Date(date);
    if (isNaN(d)) return '—';
    return d.toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' });
}

const inputCls = "w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500";
const selectCls = `${inputCls} cursor-pointer`;

export default function Actualizaciones() {
    const [estados,   setEstados]   = useState([]);
    const [proyectos, setProyectos] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [loading,   setLoading]   = useState(true);

    // Formulario
    const [titulo,    setTitulo]    = useState('Actualización del sistema');
    const [mensaje,   setMensaje]   = useState(TEMPLATE_DEFAULT);
    const [idEstado,  setIdEstado]  = useState('');
    const [prioridad, setPrioridad] = useState('media');
    const [modo,      setModo]      = useState('masivo'); // 'masivo' | 'individual'
    const [seleccion, setSeleccion] = useState([]);       // [{id_proyecto, nombre, email}]

    // UI
    const [estadoFiltro, setEstadoFiltro] = useState('all');
    const [sending,      setSending]      = useState(false);
    const [result,       setResult]       = useState(null);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) {
            const cached = cacheLoad();
            if (cached) { setHistorial(cached.historial ?? []); setLoading(false); }
            else setLoading(true);
        }
        try {
            const [proys, hist, ests] = await Promise.all([
                getProjects().catch(() => []),
                actualizacionesService.getActualizaciones().catch(() => []),
                actualizacionesService.getEstados().catch(() => []),
            ]);

            if (Array.isArray(proys)) setProyectos(proys.filter(p => p.activo !== 0));
            if (Array.isArray(hist))  { setHistorial(hist); cacheSave({ historial: hist }); }
            if (Array.isArray(ests))  {
                setEstados(ests);
                setIdEstado(prev => prev || String(ests[0]?.id_estado ?? ''));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleModo = (m) => { setModo(m); setSeleccion([]); };

    const handleSeleccion = (val) => {
        if (modo === 'individual') {
            setSeleccion(val ? [val] : []);
        } else {
            setSeleccion(Array.isArray(val) ? val : []);
        }
    };

    const handleEnviar = async () => {
        if (!titulo.trim() || !mensaje.trim() || !seleccion.length) return;
        setSending(true);
        setResult(null);
        try {
            const res = await actualizacionesService.enviarActualizacion({
                titulo, mensaje,
                destinatarios: seleccion,
                id_estado: idEstado ? Number(idEstado) : null,
                prioridad,
                modo,
            });
            setResult(res);
            // Reset form
            setSeleccion([]);
            setTitulo('Actualización del sistema');
            setMensaje(TEMPLATE_DEFAULT);
            setPrioridad('media');
            setIdEstado(String(estados[0]?.id_estado ?? ''));
            await loadData(true);
        } catch (e) {
            setResult({ error: e.message || 'Error al enviar' });
        } finally {
            setSending(false);
        }
    };

    const historialFiltrado = useMemo(() => {
        if (estadoFiltro === 'all') return historial;
        return historial.filter(h => String(h.id_estado) === estadoFiltro);
    }, [historial, estadoFiltro]);

    const contPorEstado = useMemo(() => {
        const m = {};
        for (const h of historial) {
            const k = String(h.id_estado ?? 'sin');
            m[k] = (m[k] ?? 0) + 1;
        }
        return m;
    }, [historial]);

    const canSend = seleccion.length > 0 && titulo.trim() && mensaje.trim() && !sending;

    const modoBtnCls = (active) =>
        `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
            active
                ? 'bg-sky-500 text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
        }`;

    const tabCls = (active) =>
        `px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
            active
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
        }`;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-500/12 text-sky-400"><Rss size={18} /></div>
                    <div>
                        <h2 className="font-semibold text-foreground text-sm">Actualizaciones del Sistema</h2>
                        <p className="text-[11px] text-muted-foreground">Notifica a tus clientes sobre cambios en la plataforma</p>
                    </div>
                </div>
                <button onClick={() => loadData(true)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-foreground/5">
                    <RefreshCw size={13} className={loading ? 'animate-spin text-muted-foreground' : 'text-foreground'} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto p-6 space-y-6">

                    {/* ── Formulario ── */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-border bg-secondary/20">
                            <h3 className="text-sm font-semibold text-foreground">Redactar aviso</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[11px] text-muted-foreground mb-1 block">Asunto del correo *</label>
                                <input value={titulo} onChange={e => setTitulo(e.target.value)}
                                       placeholder="Ej: Actualización de sistema — Julio 2026"
                                       className={inputCls} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-muted-foreground mb-1 block">Estado</label>
                                    <select value={idEstado} onChange={e => setIdEstado(e.target.value)} className={selectCls}>
                                        {!estados.length && <option value="">Sin estados configurados</option>}
                                        {estados.map(e => (
                                            <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-muted-foreground mb-1 block">Prioridad</label>
                                    <select value={prioridad} onChange={e => setPrioridad(e.target.value)} className={selectCls}>
                                        {Object.entries(PRIORIDAD).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-muted-foreground mb-1 block">Mensaje *</label>
                                <textarea value={mensaje} onChange={e => setMensaje(e.target.value)}
                                          rows={8} className={`${inputCls} resize-none font-mono text-[12px]`} />
                            </div>
                        </div>
                    </div>

                    {/* ── Destinatarios ── */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-border bg-secondary/20 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-foreground shrink-0">
                                Destinatarios
                                {seleccion.length > 0 && (
                                    <span className="ml-2 text-[11px] font-normal text-sky-400">
                                        {seleccion.length} seleccionado{seleccion.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </h3>
                            {/* Toggle masivo / individual */}
                            <div className="flex gap-1 rounded-xl bg-secondary/40 border border-border p-0.5">
                                <button type="button" onClick={() => handleModo('masivo')} className={modoBtnCls(modo === 'masivo')}>
                                    <Users size={12} /> Masivo
                                </button>
                                <button type="button" onClick={() => handleModo('individual')} className={modoBtnCls(modo === 'individual')}>
                                    <User size={12} /> Individual
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            {loading ? (
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-12 bg-secondary/30 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <ClientSelector
                                    proyectos={proyectos}
                                    mode={modo === 'masivo' ? 'multi' : 'single'}
                                    selected={modo === 'masivo' ? seleccion : (seleccion[0] ?? null)}
                                    onChange={handleSeleccion}
                                />
                            )}
                        </div>
                    </div>

                    {/* Resultado */}
                    {result && (
                        <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
                            result.error
                                ? 'bg-red-500/8 border-red-500/30 text-red-400'
                                : 'bg-emerald-500/8 border-emerald-500/30 text-emerald-400'
                        }`}>
                            {result.error
                                ? <><AlertCircle size={15} className="shrink-0 mt-0.5" />{result.error}</>
                                : <><CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                                    {result.enviados} correo{result.enviados !== 1 ? 's' : ''} enviado{result.enviados !== 1 ? 's' : ''}
                                    {result.errores > 0 && ` · ${result.errores} con error`}
                                  </>
                            }
                        </div>
                    )}

                    {/* Botón enviar */}
                    <button onClick={handleEnviar} disabled={!canSend}
                            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                        {sending
                            ? <><RefreshCw size={14} className="animate-spin" /> Enviando...</>
                            : <><Send size={14} /> Enviar a {seleccion.length || 0} cliente{seleccion.length !== 1 ? 's' : ''}</>
                        }
                    </button>

                    {/* ── Historial ── */}
                    {historial.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-border bg-secondary/20">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Historial de envíos</h3>
                                {/* Tabs por estado */}
                                <div className="flex gap-1.5 flex-wrap">
                                    <button onClick={() => setEstadoFiltro('all')} className={tabCls(estadoFiltro === 'all')}>
                                        Todos ({historial.length})
                                    </button>
                                    {estados.map(e => {
                                        const count = contPorEstado[String(e.id_estado)] ?? 0;
                                        if (!count) return null;
                                        return (
                                            <button key={e.id_estado}
                                                    onClick={() => setEstadoFiltro(String(e.id_estado))}
                                                    className={tabCls(estadoFiltro === String(e.id_estado))}>
                                                <span style={{ color: e.color_hex }}>●</span>
                                                {' '}{e.nombre} ({count})
                                            </button>
                                        );
                                    })}
                                    {/* Actualizaciones sin estado (historial antiguo) */}
                                    {(contPorEstado['sin'] || contPorEstado['null']) ? (
                                        <button onClick={() => setEstadoFiltro('sin')} className={tabCls(estadoFiltro === 'sin')}>
                                            Sin estado ({contPorEstado['sin'] ?? contPorEstado['null'] ?? 0})
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                            <div className="divide-y divide-border/40">
                                {historialFiltrado.map(h => {
                                    const dests = Array.isArray(h.destinatarios)
                                        ? h.destinatarios
                                        : JSON.parse(h.destinatarios || '[]');
                                    const prio = PRIORIDAD[h.prioridad];
                                    return (
                                        <div key={h.id_actualizacion} className="px-5 py-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                        <p className="text-sm font-medium text-foreground truncate">{h.titulo}</p>
                                                        {h.estado_nombre && (
                                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                                                  style={{ color: h.estado_color, background: `${h.estado_color}18` }}>
                                                                {h.estado_nombre}
                                                            </span>
                                                        )}
                                                        {prio && (
                                                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${prio.cls}`}>
                                                                {prio.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-1">{h.mensaje}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-[10px] text-emerald-400 font-semibold">{h.total_enviados} env.</span>
                                                    {h.total_errores > 0 && (
                                                        <span className="ml-1 text-[10px] text-red-400">{h.total_errores} err.</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
                                                <span className="flex items-center gap-1"><Clock size={9} />{fmt(h.enviado_en)}</span>
                                                {h.socio_nombre && <span>· {h.socio_nombre}</span>}
                                                <span>· {dests.length} destinatario{dests.length !== 1 ? 's' : ''}</span>
                                                {h.modo && h.modo !== 'masivo' && (
                                                    <span className="flex items-center gap-1">
                                                        · <User size={9} /> Individual
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
