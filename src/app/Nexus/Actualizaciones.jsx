'use client';

import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Send, CheckSquare, Square, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { getProjects } from '../../services/projectsService';
import { getActualizaciones, enviarActualizacion } from '../../services/actualizacionesService';

const TEMPLATE_DEFAULT = `Les comunicamos que hemos realizado una actualización en el sistema NativeCode Finance.

Cambios principales:
• [Describe el cambio 1]
• [Describe el cambio 2]

Si experimentas algún problema o tienes preguntas, no dudes en contactarnos.`;

const CACHE_KEY = 'ncf:nexus:actualizaciones:v1';
function cacheLoad() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; } }
function cacheSave(d) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch {} }

function fmt(date) {
    if (!date) return '—';
    return new Date(date).toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Actualizaciones() {
    const [clientes,  setClientes]  = useState([]); // { email, nombre, id_proyecto, proyecto }
    const [seleccion, setSeleccion] = useState(new Set()); // Set de emails
    const [titulo,    setTitulo]    = useState('Actualización del sistema');
    const [mensaje,   setMensaje]   = useState(TEMPLATE_DEFAULT);
    const [sending,   setSending]   = useState(false);
    const [result,    setResult]    = useState(null); // { enviados, errores }
    const [historial, setHistorial] = useState([]);
    const [loading,   setLoading]   = useState(true);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) {
            const cached = cacheLoad();
            if (cached) { setHistorial(cached); setLoading(false); }
            else setLoading(true);
        }
        try {
            const [proyectos, hist] = await Promise.all([
                getProjects().catch(() => null),
                getActualizaciones().catch(() => []),
            ]);

            // Extraer clientes únicos con email desde proyectos
            const mapa = new Map();
            if (Array.isArray(proyectos)) {
                for (const p of proyectos) {
                    if (p.email_cliente && !mapa.has(p.email_cliente)) {
                        mapa.set(p.email_cliente, {
                            email:      p.email_cliente,
                            nombre:     p.nombre_cliente || p.nombre,
                            id_proyecto: p.id_proyecto,
                            proyecto:   p.nombre,
                        });
                    }
                }
            }
            setClientes([...mapa.values()]);

            if (Array.isArray(hist)) {
                setHistorial(hist);
                cacheSave(hist);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const toggleCliente = (email) =>
        setSeleccion(prev => {
            const next = new Set(prev);
            next.has(email) ? next.delete(email) : next.add(email);
            return next;
        });

    const toggleTodos = () =>
        setSeleccion(seleccion.size === clientes.length
            ? new Set()
            : new Set(clientes.map(c => c.email))
        );

    const handleEnviar = async () => {
        if (!titulo.trim() || !mensaje.trim() || !seleccion.size) return;
        setSending(true);
        setResult(null);
        try {
            const destinatarios = clientes.filter(c => seleccion.has(c.email));
            const res = await enviarActualizacion({ titulo, mensaje, destinatarios });
            setResult(res);
            setSeleccion(new Set());
            setTitulo('Actualización del sistema');
            setMensaje(TEMPLATE_DEFAULT);
            await loadData(true);
        } catch (e) {
            setResult({ error: e.message || 'Error al enviar' });
        } finally {
            setSending(false);
        }
    };

    const todosSeleccionados = clientes.length > 0 && seleccion.size === clientes.length;

    const inputCls = "w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500";

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-500/12 text-sky-400">
                        <Megaphone size={18} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-foreground text-sm">Actualizaciones del Sistema</h2>
                        <p className="text-[11px] text-muted-foreground">Notifica a tus clientes sobre cambios en la plataforma</p>
                    </div>
                </div>
                <button onClick={() => loadData(true)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-foreground/5">
                    <RefreshCw size={13} className={loading ? 'animate-spin text-muted-foreground' : 'text-foreground'} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto p-6 space-y-6">

                    {/* Formulario */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-border bg-secondary/20">
                            <h3 className="text-sm font-semibold text-foreground">Redactar aviso</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[11px] text-muted-foreground mb-1 block">Asunto del correo *</label>
                                <input
                                    value={titulo}
                                    onChange={e => setTitulo(e.target.value)}
                                    placeholder="Ej: Actualización de sistema — Julio 2026"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-muted-foreground mb-1 block">Mensaje *</label>
                                <textarea
                                    value={mensaje}
                                    onChange={e => setMensaje(e.target.value)}
                                    rows={8}
                                    className={`${inputCls} resize-none font-mono text-[12px]`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Selector de destinatarios */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-border bg-secondary/20 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">
                                Destinatarios
                                {seleccion.size > 0 && (
                                    <span className="ml-2 text-[11px] font-normal text-sky-400">
                                        {seleccion.size} seleccionado{seleccion.size > 1 ? 's' : ''}
                                    </span>
                                )}
                            </h3>
                            {clientes.length > 0 && (
                                <button
                                    onClick={toggleTodos}
                                    className="flex items-center gap-1.5 text-[12px] text-sky-400 hover:text-sky-300 transition-colors"
                                >
                                    {todosSeleccionados
                                        ? <><CheckSquare size={13} /> Deseleccionar todos</>
                                        : <><Square size={13} /> Seleccionar todos</>
                                    }
                                </button>
                            )}
                        </div>
                        <div className="p-4">
                            {loading && (
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-12 bg-secondary/30 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            )}
                            {!loading && !clientes.length && (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No hay proyectos con email de cliente registrado.
                                </p>
                            )}
                            <div className="space-y-1.5">
                                {clientes.map(c => {
                                    const checked = seleccion.has(c.email);
                                    return (
                                        <label
                                            key={c.email}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                                                checked
                                                    ? 'border-sky-500/50 bg-sky-500/8'
                                                    : 'border-border/50 hover:border-sky-500/30 hover:bg-secondary/20'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleCliente(c.email)}
                                                className="rounded text-sky-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{c.nombre}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground/60 shrink-0">{c.proyecto}</span>
                                        </label>
                                    );
                                })}
                            </div>
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
                    <button
                        onClick={handleEnviar}
                        disabled={sending || !seleccion.size || !titulo.trim() || !mensaje.trim()}
                        className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        {sending
                            ? <><RefreshCw size={14} className="animate-spin" /> Enviando...</>
                            : <><Send size={14} /> Enviar a {seleccion.size || 0} cliente{seleccion.size !== 1 ? 's' : ''}</>
                        }
                    </button>

                    {/* Historial */}
                    {historial.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-border bg-secondary/20">
                                <h3 className="text-sm font-semibold text-foreground">Historial de envíos</h3>
                            </div>
                            <div className="divide-y divide-border/40">
                                {historial.map(h => {
                                    const dests = Array.isArray(h.destinatarios) ? h.destinatarios : JSON.parse(h.destinatarios || '[]');
                                    return (
                                        <div key={h.id_actualizacion} className="px-5 py-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">{h.titulo}</p>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{h.mensaje}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-[10px] text-emerald-400 font-semibold">{h.total_enviados} env.</span>
                                                    {h.total_errores > 0 && (
                                                        <span className="ml-1 text-[10px] text-red-400">{h.total_errores} err.</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                                                <span className="flex items-center gap-1"><Clock size={9} />{fmt(h.enviado_en)}</span>
                                                {h.socio_nombre && <span>· {h.socio_nombre}</span>}
                                                <span>· {dests.length} destinatario{dests.length !== 1 ? 's' : ''}</span>
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
