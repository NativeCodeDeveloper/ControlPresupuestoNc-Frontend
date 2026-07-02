'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Loader2, Terminal, Server, Cpu, HardDrive, MemoryStick, Circle, ChevronDown, Pause, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import * as adminService from '../../services/adminService';

// ── Barra de uso ─────────────────────────────────────────────────────────────

function UsageBar({ label, value, total, unit = 'MB', color = 'violet' }) {
    const pct = value != null && total ? Math.min(100, Math.round(value / total * 100)) : value;
    const colors = {
        violet:  { bar: 'bg-violet-500',  track: 'bg-violet-500/15', text: 'text-violet-400'  },
        emerald: { bar: 'bg-emerald-500', track: 'bg-emerald-500/15', text: 'text-emerald-400' },
        amber:   { bar: 'bg-amber-500',   track: 'bg-amber-500/15',   text: 'text-amber-400'   },
        red:     { bar: 'bg-red-500',     track: 'bg-red-500/15',     text: 'text-red-400'     },
    };
    const c     = (pct >= 85 ? colors.red : pct >= 65 ? colors.amber : colors[color]) || colors.violet;
    const label2 = total ? `${value?.toLocaleString()} / ${total?.toLocaleString()} ${unit}` : (pct != null ? `${pct}%` : '—');

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-medium">{label}</span>
                <span className={cn('font-semibold tabular-nums', c.text)}>{label2}</span>
            </div>
            <div className={cn('h-1.5 rounded-full', c.track)}>
                <div
                    className={cn('h-full rounded-full transition-all duration-700', c.bar)}
                    style={{ width: `${pct ?? 0}%` }}
                />
            </div>
        </div>
    );
}

// ── Chip de proceso PM2 ───────────────────────────────────────────────────────

function Pm2Chip({ proc }) {
    const statusColor = {
        online:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
        stopped: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
        errored: 'bg-red-500/15 text-red-400 border-red-500/20',
    }[proc.status] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20';

    return (
        <div className={cn('flex items-center gap-2 border rounded-lg px-2.5 py-1.5 text-[11px]', statusColor)}>
            <Circle size={6} fill="currentColor" />
            <span className="font-semibold">{proc.name}</span>
            {proc.cpu != null && <span className="opacity-60">CPU {proc.cpu}%</span>}
            {proc.memory != null && <span className="opacity-60">RAM {proc.memory} MB</span>}
            {proc.restarts > 0 && <span className="opacity-60">↺{proc.restarts}</span>}
        </div>
    );
}

// ── Colorear línea de log ─────────────────────────────────────────────────────

function LogLine({ line, idx }) {
    const isError = /error|exception|fatal|err\b/i.test(line);
    const isWarn  = /warn|warning/i.test(line);
    const isInfo  = /info|✓|ok|success|started|running/i.test(line);

    return (
        <div className={cn(
            'font-mono text-[11px] leading-5 px-3 py-[1px] select-text whitespace-pre-wrap break-all',
            idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.012]',
            isError ? 'text-red-400'    :
            isWarn  ? 'text-amber-400'  :
            isInfo  ? 'text-emerald-400' :
                      'text-zinc-400'
        )}>
            <span className="text-zinc-700 select-none mr-2">{String(idx + 1).padStart(3, ' ')}</span>
            {line}
        </div>
    );
}

// ── Selector dropdown ─────────────────────────────────────────────────────────

function Select({ value, onChange, options, className }) {
    return (
        <div className={cn('relative', className)}>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="appearance-none bg-zinc-900 border border-zinc-700 text-zinc-300 text-[12px] rounded-lg pl-3 pr-7 py-1.5 outline-none focus:border-violet-500 cursor-pointer w-full"
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

const REFRESH_INTERVAL = 5000;

export default function MonitorTerminal() {
    const [servers, setServers]       = useState([]);
    const [activeId, setActiveId]     = useState(null);
    const [stats, setStats]           = useState(null);
    const [logLines, setLogLines]     = useState([]);
    const [logProcess, setLogProcess] = useState('finance-back');
    const [logType, setLogType]       = useState('out');
    const [logCount, setLogCount]     = useState(150);
    const [loading, setLoading]       = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError]           = useState(null);
    const [paused, setPaused]         = useState(false);
    const logsEndRef                  = useRef(null);
    const timerRef                    = useRef(null);

    // Cargar lista de servidores
    useEffect(() => {
        adminService.listServers()
            .then(data => {
                setServers(data);
                if (data.length) setActiveId(data[0].id);
            })
            .catch(() => setError('No se pudo conectar con el servidor'));
    }, []);

    const fetchAll = useCallback(async (id) => {
        if (!id) return;
        try {
            const [statsData, logsData] = await Promise.all([
                adminService.getStats(id),
                adminService.getLogs(id, { lines: logCount, type: logType, process: logProcess }),
            ]);
            setStats(statsData);
            setLogLines(logsData.lines || []);
            setLastUpdate(new Date());
            setError(null);
        } catch {
            setError('Error al obtener datos del servidor');
        } finally {
            setLoading(false);
            setLoadingLogs(false);
        }
    }, [logCount, logType, logProcess]);

    // Auto-refresh cada 5s (respeta pausa)
    useEffect(() => {
        if (!activeId) return;
        setLoading(true);
        fetchAll(activeId);
        if (!paused) {
            timerRef.current = setInterval(() => fetchAll(activeId), REFRESH_INTERVAL);
        }
        return () => clearInterval(timerRef.current);
    }, [activeId, fetchAll, paused]);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logLines]);

    const pm2Processes = stats?.pm2?.map(p => p.name) || [];
    const pm2Options   = pm2Processes.map(n => ({ value: n, label: n }));
    const lineOptions  = [50, 100, 150, 250, 500].map(n => ({ value: n, label: `${n} líneas` }));
    const typeOptions  = [{ value: 'out', label: 'Output (stdout)' }, { value: 'error', label: 'Errores (stderr)' }];

    return (
        <div className="h-full flex flex-col bg-zinc-950 text-zinc-100">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-violet-400" />
                    <span className="font-semibold text-[14px]">&gt;_  Monitor</span>
                    {lastUpdate && (
                        <span className="text-[10px] text-zinc-600 ml-2">
                            actualizado {lastUpdate.toLocaleTimeString('es-CL')}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setLoadingLogs(true); fetchAll(activeId); }}
                        disabled={paused}
                        className="flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-violet-400 transition-colors disabled:opacity-40"
                    >
                        {loadingLogs ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        Actualizar
                    </button>
                    <button
                        onClick={() => setPaused(p => !p)}
                        className={cn(
                            'flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg border transition-colors',
                            paused
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        )}
                    >
                        {paused ? <><Play size={11} /> Reanudar</> : <><Pause size={11} /> Pausar</>}
                    </button>
                </div>
            </div>

            {/* ── Tabs de servidores ── */}
            {servers.length > 1 && (
                <div className="flex items-center gap-1 px-4 pt-3 shrink-0">
                    {servers.map(s => (
                        <button
                            key={s.id}
                            onClick={() => { setActiveId(s.id); setLoading(true); }}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors',
                                activeId === s.id
                                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                            )}
                        >
                            <Server size={11} />
                            {s.nombre}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto">
                {error && (
                    <div className="m-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[13px]">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-40 gap-2 text-zinc-500">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-[13px]">Conectando con el servidor…</span>
                    </div>
                ) : (
                    <>
                        {/* ── Stats ── */}
                        {stats && (
                            <div className="px-5 py-4 border-b border-zinc-800 space-y-4 shrink-0">
                                <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">
                                    Recursos — {stats.server?.nombre}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5">
                                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
                                            <Cpu size={11} /> CPU
                                        </div>
                                        <UsageBar
                                            label="Uso"
                                            value={stats.cpu}
                                            color="violet"
                                        />
                                    </div>

                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5">
                                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
                                            <MemoryStick size={11} /> RAM
                                        </div>
                                        {stats.ram ? (
                                            <UsageBar
                                                label="Memoria"
                                                value={stats.ram.used}
                                                total={stats.ram.total}
                                                unit="MB"
                                                color="emerald"
                                            />
                                        ) : <span className="text-zinc-600 text-[11px]">—</span>}
                                    </div>

                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5">
                                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
                                            <HardDrive size={11} /> Disco
                                        </div>
                                        {stats.disk ? (
                                            <UsageBar
                                                label="Almacenamiento"
                                                value={stats.disk.used}
                                                total={stats.disk.total}
                                                unit="MB"
                                                color="amber"
                                            />
                                        ) : <span className="text-zinc-600 text-[11px]">—</span>}
                                    </div>
                                </div>

                                {/* Procesos PM2 */}
                                {stats.pm2?.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {stats.pm2.map(p => <Pm2Chip key={p.name} proc={p} />)}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Log viewer ── */}
                        <div className="flex flex-col">
                            {/* toolbar */}
                            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/50 shrink-0 flex-wrap">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mr-1">Logs</span>
                                {pm2Options.length > 0 && (
                                    <Select value={logProcess} onChange={setLogProcess} options={pm2Options} className="w-36" />
                                )}
                                <Select value={logType}    onChange={setLogType}    options={typeOptions}  className="w-40" />
                                <Select value={logCount}   onChange={v => setLogCount(Number(v))} options={lineOptions} className="w-32" />
                                <div className="ml-auto flex items-center gap-1.5 text-[10px] text-zinc-600">
                                    <div className={cn('w-1.5 h-1.5 rounded-full', paused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse')} />
                                    {paused ? 'pausado' : 'live · cada 5s'}
                                </div>
                            </div>

                            {/* líneas */}
                            <div className="bg-zinc-950 min-h-[300px] py-1">
                                {logLines.length === 0 ? (
                                    <p className="text-zinc-700 text-[12px] text-center py-10">Sin registros en este archivo</p>
                                ) : (
                                    logLines.map((line, i) => <LogLine key={i} line={line} idx={i} />)
                                )}
                                <div ref={logsEndRef} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
