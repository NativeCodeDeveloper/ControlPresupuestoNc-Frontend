'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    RefreshCw, Loader2, Terminal, Server, Cpu, HardDrive, MemoryStick,
    Circle, ChevronDown, Pause, Play, Square, Plus, X, Trash2, Send, ChevronUp,
    Users, Check, ExternalLink, AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import * as adminService from '../../services/adminService';

// ── Barra de uso ──────────────────────────────────────────────────────────────

function UsageBar({ label, value, total, unit = 'MB', color = 'violet' }) {
    const pct = value != null && total ? Math.min(100, Math.round(value / total * 100)) : value;
    const c = pct >= 85 ? 'red' : pct >= 65 ? 'amber' : color;
    const COLORS = {
        violet:  { bar: 'bg-violet-500',  track: 'bg-violet-500/15',  text: 'text-violet-400'  },
        emerald: { bar: 'bg-emerald-500', track: 'bg-emerald-500/15', text: 'text-emerald-400' },
        amber:   { bar: 'bg-amber-500',   track: 'bg-amber-500/15',   text: 'text-amber-400'   },
        red:     { bar: 'bg-red-500',     track: 'bg-red-500/15',     text: 'text-red-400'     },
    };
    const cls   = COLORS[c] || COLORS.violet;
    const label2 = total ? `${value?.toLocaleString()} / ${total?.toLocaleString()} ${unit}` : (pct != null ? `${pct}%` : '—');
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-medium">{label}</span>
                <span className={cn('font-bold tabular-nums', cls.text)}>{label2}</span>
            </div>
            <div className={cn('h-1.5 rounded-full', cls.track)}>
                <div className={cn('h-full rounded-full transition-all duration-700', cls.bar)} style={{ width: `${pct ?? 0}%` }} />
            </div>
            <div className="text-[10px] text-zinc-600">{pct ?? 0}% usado</div>
        </div>
    );
}

// ── Chip PM2 ─────────────────────────────────────────────────────────────────

function Pm2Chip({ proc }) {
    const cls = { online: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', stopped: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20', errored: 'bg-red-500/15 text-red-400 border-red-500/20' }[proc.status] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20';
    return (
        <div className={cn('flex items-center gap-2 border rounded-lg px-2.5 py-1.5 text-[11px]', cls)}>
            <Circle size={6} fill="currentColor" />
            <span className="font-semibold">{proc.name}</span>
            {proc.cpu  != null && <span className="opacity-60">CPU {proc.cpu}%</span>}
            {proc.memory != null && <span className="opacity-60">RAM {proc.memory} MB</span>}
            {proc.restarts > 0 && <span className="opacity-60">↺{proc.restarts}</span>}
        </div>
    );
}

// ── Línea de log coloreada ────────────────────────────────────────────────────

function LogLine({ line, idx }) {
    const isError = /error|exception|fatal|err\b/i.test(line);
    const isWarn  = /warn|warning/i.test(line);
    const isInfo  = /info|✓|ok|success|started|running|online/i.test(line);
    return (
        <div className={cn(
            'font-mono text-[11px] leading-5 px-3 py-[1px] select-text whitespace-pre-wrap break-all',
            idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.012]',
            isError ? 'text-red-400' : isWarn ? 'text-amber-400' : isInfo ? 'text-emerald-400' : 'text-zinc-400'
        )}>
            <span className="text-zinc-700 select-none mr-2">{String(idx + 1).padStart(3, ' ')}</span>
            {line}
        </div>
    );
}

// ── Select ────────────────────────────────────────────────────────────────────

function Select({ value, onChange, options, className }) {
    return (
        <div className={cn('relative', className)}>
            <select value={value} onChange={e => onChange(e.target.value)}
                className="appearance-none bg-zinc-900 border border-zinc-700 text-zinc-300 text-[12px] rounded-lg pl-3 pr-7 py-1.5 outline-none focus:border-violet-500 cursor-pointer w-full">
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
    );
}

// ── Modal Agregar Servidor ────────────────────────────────────────────────────

function AddServerModal({ onClose, onCreated }) {
    const [form, setForm] = useState({ nombre: '', host: '', ssh_user: 'root', pm2_processes: 'finance-back', log_dir: '/root/.pm2/logs', is_local: false });
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');
    const set = k => v => setForm(p => ({ ...p, [k]: v }));

    const save = async () => {
        if (!form.nombre.trim()) return setError('El nombre es requerido');
        setSaving(true);
        try {
            const data = {
                ...form,
                pm2_processes: form.pm2_processes.split(',').map(s => s.trim()).filter(Boolean),
            };
            const srv = await adminService.createServer(data);
            onCreated(srv);
            onClose();
        } catch { setError('Error al guardar el servidor'); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Server size={14} className="text-emerald-400" />
                        <span className="font-semibold text-[14px] text-zinc-100">Agregar servidor</span>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
                </div>
                <div className="p-5 space-y-3">
                    {[
                        { label: 'Nombre', key: 'nombre', placeholder: 'VPS Producción 2' },
                        { label: 'Host / IP', key: 'host', placeholder: '192.168.1.10' },
                        { label: 'Usuario SSH', key: 'ssh_user', placeholder: 'root' },
                        { label: 'Procesos PM2 (separados por coma)', key: 'pm2_processes', placeholder: 'finance-back, api-otro' },
                        { label: 'Directorio de logs', key: 'log_dir', placeholder: '/root/.pm2/logs' },
                    ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                            <label className="text-[11px] text-zinc-500 uppercase tracking-wide font-medium block mb-1">{label}</label>
                            <input
                                value={form[key]}
                                onChange={e => set(key)(e.target.value)}
                                placeholder={placeholder}
                                className="w-full text-[13px] bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-zinc-200 placeholder:text-zinc-600"
                            />
                        </div>
                    ))}
                    <label className="flex items-center gap-2 cursor-pointer text-[13px] text-zinc-300">
                        <input type="checkbox" checked={form.is_local} onChange={e => set('is_local')(e.target.checked)} className="accent-emerald-500" />
                        Es el servidor local (sin SSH)
                    </label>
                    {error && <p className="text-red-400 text-[12px]">{error}</p>}
                </div>
                <div className="flex justify-end gap-2 p-5 pt-0">
                    <button onClick={onClose} className="px-4 py-2 text-[13px] text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg">Cancelar</button>
                    <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-[13px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50">
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                        Agregar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Consola de comandos ───────────────────────────────────────────────────────

const SUGGESTIONS = [
    'pm2 list', 'pm2 status', 'df -h /', 'free -m', 'uptime',
    'top -bn1 | head -5', 'ps aux | head -10',
    'ls -la /root/.pm2/logs/', 'node --version', 'npm --version',
];

function CommandConsole({ serverId }) {
    const [cmd, setCmd]         = useState('');
    const [history, setHistory] = useState([]);
    const [running, setRunning] = useState(false);
    const [open, setOpen]       = useState(true);
    const outputRef             = useRef(null);

    const run = async (command) => {
        const c = (command || cmd).trim();
        if (!c) return;
        setCmd('');
        setRunning(true);
        setHistory(h => [...h, { type: 'cmd', text: `$ ${c}` }]);
        try {
            const { output } = await adminService.execCommand(serverId, c);
            setHistory(h => [...h, { type: 'out', text: output }]);
        } catch (e) {
            setHistory(h => [...h, { type: 'err', text: e.message }]);
        } finally {
            setRunning(false);
            setTimeout(() => outputRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 50);
        }
    };

    return (
        <div className="border-t border-zinc-800 shrink-0">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-2 px-4 py-2 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-900/60"
            >
                <Terminal size={11} />
                <span className="font-mono font-semibold uppercase tracking-widest">Consola</span>
                {open ? <ChevronDown size={11} className="ml-auto" /> : <ChevronUp size={11} className="ml-auto" />}
            </button>

            {open && (
                <div className="bg-black/60">
                    {/* Historial */}
                    <div ref={outputRef} className="max-h-48 overflow-y-auto px-3 py-2 space-y-0.5 font-mono text-[11px]">
                        {history.length === 0 && (
                            <p className="text-zinc-700 py-2">
                                Comandos disponibles: {SUGGESTIONS.join(' · ')}
                            </p>
                        )}
                        {history.map((h, i) => (
                            <div key={i} className={cn(
                                'whitespace-pre-wrap break-all leading-5',
                                h.type === 'cmd' ? 'text-emerald-400 font-semibold' :
                                h.type === 'err' ? 'text-red-400' : 'text-zinc-400'
                            )}>{h.text}</div>
                        ))}
                        {running && <div className="text-zinc-600 animate-pulse">ejecutando…</div>}
                    </div>

                    {/* Sugerencias rápidas */}
                    <div className="flex flex-wrap gap-1 px-3 pb-2">
                        {SUGGESTIONS.map(s => (
                            <button key={s} onClick={() => run(s)} className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 rounded transition-colors">
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-2 px-3 pb-3">
                        <span className="font-mono text-[12px] text-emerald-500 shrink-0">$</span>
                        <input
                            value={cmd}
                            onChange={e => setCmd(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !running && run()}
                            placeholder="pm2 list"
                            disabled={running}
                            className="flex-1 bg-transparent font-mono text-[12px] text-zinc-300 outline-none placeholder:text-zinc-700 disabled:opacity-50"
                        />
                        <button onClick={() => run()} disabled={running || !cmd.trim()} className="text-emerald-500 hover:text-emerald-400 disabled:opacity-30 transition-colors">
                            <Send size={13} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Vista por cliente ─────────────────────────────────────────────────────────

const STATUS_CLS = {
    online:  { dot: 'bg-emerald-500', badge: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20' },
    errored: { dot: 'bg-red-500',     badge: 'bg-red-500/12     text-red-400     border-red-500/20'     },
    stopped: { dot: 'bg-zinc-500',    badge: 'bg-zinc-500/12    text-zinc-400    border-zinc-500/20'    },
    unknown: { dot: 'bg-amber-500',   badge: 'bg-amber-500/12   text-amber-400   border-amber-500/20'   },
};
function statusCls(s) { return STATUS_CLS[s] || STATUS_CLS.unknown; }

function ClientCard({ client, servers, onSaved }) {
    const [editing, setEditing]       = useState(false);
    const [selServer, setSelServer]   = useState(client.id_monitor_server || servers[0]?.id || 1);
    const [selProcess, setSelProcess] = useState(client.pm2_process || '');
    const [processes, setProcesses]   = useState([]);
    const [loadingP, setLoadingP]     = useState(false);
    const [saving, setSaving]         = useState(false);
    const [err, setErr]               = useState('');

    const openEdit = async () => {
        setEditing(true);
        setErr('');
        setLoadingP(true);
        try {
            const procs = await adminService.listServerProcesses(selServer);
            setProcesses(Array.isArray(procs) ? procs : []);
        } catch { setProcesses([]); }
        finally { setLoadingP(false); }
    };

    const handleServerChange = async (sid) => {
        setSelServer(Number(sid));
        setSelProcess('');
        setLoadingP(true);
        try {
            const procs = await adminService.listServerProcesses(sid);
            setProcesses(Array.isArray(procs) ? procs : []);
        } catch { setProcesses([]); }
        finally { setLoadingP(false); }
    };

    const save = async () => {
        setSaving(true);
        setErr('');
        try {
            await adminService.updateClientProcess(client.id_servidor, {
                pm2_process:       selProcess || null,
                id_monitor_server: selServer,
            });
            onSaved(client.id_servidor, selProcess || null, selServer);
            setEditing(false);
        } catch { setErr('Error al guardar'); }
        finally { setSaving(false); }
    };

    const proc   = client.proc_stats;
    const status = proc?.status || 'unknown';
    const cls    = statusCls(status);
    const hasProc = !!client.pm2_process;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 flex flex-col">

            {/* Header */}
            <div className="flex items-start gap-2.5">
                <div className={cn('mt-1 w-2 h-2 rounded-full shrink-0', hasProc ? cls.dot : 'bg-zinc-700')} />
                <div className="min-w-0">
                    <p className="font-semibold text-[13px] text-zinc-100 leading-tight truncate">
                        {client.nombre_cliente}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                        {client.nombre_proyecto}
                        {client.codigo_interno && <span className="ml-1 text-zinc-600">· {client.codigo_interno}</span>}
                    </p>
                </div>
            </div>

            {/* Backend URL */}
            <a href={client.ruta_backend} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-violet-400 transition-colors truncate">
                <ExternalLink size={10} className="shrink-0" />
                <span className="truncate">{client.ruta_backend}</span>
            </a>

            {/* Process badge o vacío */}
            <div className="mt-auto">
                {!editing && hasProc && proc && (
                    <button onClick={openEdit}
                            className={cn('w-full flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors', cls.badge)}>
                        <Circle size={6} fill="currentColor" className="shrink-0" />
                        <span className="font-mono font-semibold truncate">{proc.name}</span>
                        <span className="opacity-60">{proc.status}</span>
                        {proc.cpu  != null && <span className="opacity-60 ml-auto">CPU {proc.cpu}%</span>}
                        {proc.memory != null && <span className="opacity-60">{proc.memory}MB</span>}
                    </button>
                )}
                {!editing && !hasProc && (
                    <button onClick={openEdit}
                            className="w-full text-[11px] text-zinc-600 hover:text-emerald-400 border border-dashed border-zinc-800 hover:border-emerald-600/40 rounded-lg py-1.5 transition-colors">
                        + Asignar proceso PM2
                    </button>
                )}

                {/* Formulario inline */}
                {editing && (
                    <div className="space-y-2">
                        {servers.length > 1 && (
                            <select value={selServer} onChange={e => handleServerChange(e.target.value)}
                                    className="w-full text-[11px] bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-2 py-1.5 outline-none focus:border-violet-500">
                                {servers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        )}
                        {loadingP ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 py-1">
                                <Loader2 size={11} className="animate-spin" /> Cargando procesos…
                            </div>
                        ) : (
                            <select value={selProcess} onChange={e => setSelProcess(e.target.value)}
                                    className="w-full text-[11px] bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-2 py-1.5 outline-none focus:border-violet-500">
                                <option value="">— Sin proceso —</option>
                                {processes.map(p => (
                                    <option key={p.name} value={p.name}>
                                        {p.name} ({p.status})
                                    </option>
                                ))}
                            </select>
                        )}
                        {err && <p className="text-red-400 text-[10px]">{err}</p>}
                        <div className="flex gap-1.5">
                            <button onClick={save} disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg py-1.5 transition-colors">
                                {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                                Guardar
                            </button>
                            <button onClick={() => setEditing(false)}
                                    className="px-2.5 text-[11px] text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded-lg transition-colors">
                                <X size={11} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* VPS label (si está asignado y no editando) */}
            {!editing && client.nombre_vps && (
                <p className="text-[10px] text-zinc-700">
                    <Server size={9} className="inline mr-1" />{client.nombre_vps}
                </p>
            )}
        </div>
    );
}

function ClientsView({ servers }) {
    const [clients, setClients]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminService.listClients();
            setClients(Array.isArray(data) ? data : []);
        } catch { setError('No se pudieron cargar los clientes'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSaved = (idServidor, pm2Process, idMonitorServer) => {
        setClients(prev => prev.map(c =>
            c.id_servidor === idServidor
                ? { ...c, pm2_process: pm2Process, id_monitor_server: idMonitorServer, proc_stats: null }
                : c
        ));
        // Refrescar para obtener stats actualizados
        setTimeout(load, 500);
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center gap-2 text-zinc-500">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[13px]">Cargando clientes…</span>
        </div>
    );

    if (error) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-red-400 text-[13px]">
                <AlertCircle size={15} /> {error}
            </div>
        </div>
    );

    const sinAsignar = clients.filter(c => !c.pm2_process).length;
    const online     = clients.filter(c => c.proc_stats?.status === 'online').length;
    const errored    = clients.filter(c => c.proc_stats?.status === 'errored').length;

    return (
        <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Resumen */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-zinc-800 text-[11px] text-zinc-500 shrink-0">
                <span><span className="text-zinc-300 font-semibold">{clients.length}</span> clientes</span>
                {online  > 0 && <span><span className="text-emerald-400 font-semibold">{online}</span> online</span>}
                {errored > 0 && <span><span className="text-red-400 font-semibold">{errored}</span> con error</span>}
                {sinAsignar > 0 && <span><span className="text-amber-400 font-semibold">{sinAsignar}</span> sin proceso</span>}
                <button onClick={load} className="ml-auto text-zinc-600 hover:text-zinc-300 transition-colors">
                    <RefreshCw size={12} />
                </button>
            </div>

            {clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
                    <Users size={32} className="text-zinc-700" />
                    <p className="text-[14px] text-zinc-500">No hay clientes con servidor asignado</p>
                    <p className="text-[12px] text-zinc-700">Asigna un servidor en Backserver → proyecto → servidor</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-5">
                    {clients.map(c => (
                        <ClientCard
                            key={c.id_servidor}
                            client={c}
                            servers={servers}
                            onSaved={handleSaved}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

const REFRESH_INTERVAL = 5000;
const STORAGE_KEY = 'soma_monitor_state';

function lsGet(key, fallback) {
    if (typeof window === 'undefined') return fallback;
    const v = localStorage.getItem(key);
    return v !== null ? v : fallback;
}
function lsSet(key, val) { localStorage.setItem(key, String(val)); }

export default function MonitorTerminal() {
    const [servers, setServers]         = useState([]);
    const [activeId, setActiveId]       = useState(null);
    const [stats, setStats]             = useState(null);
    const [logLines, setLogLines]       = useState([]);
    const [logProcess, setLogProcess]   = useState(() => lsGet('soma_log_process', 'finance-back'));
    const [logType, setLogType]         = useState(() => lsGet('soma_log_type', 'out'));
    const [logCount, setLogCount]       = useState(() => Number(lsGet('soma_log_count', 150)));
    const [loading, setLoading]         = useState(false);
    const [lastUpdate, setLastUpdate]   = useState(null);
    const [error, setError]             = useState(null);
    // Estado persistido: 'playing' | 'paused' | 'stopped'
    const [monitorState, setMonitorState] = useState(() => {
        if (typeof window === 'undefined') return 'stopped';
        return localStorage.getItem(STORAGE_KEY) || 'stopped';
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [view, setView]               = useState('servers'); // 'servers' | 'clients'
    const logsRef  = useRef(null);
    const timerRef = useRef(null);

    const saveState = useCallback((state) => {
        setMonitorState(state);
        localStorage.setItem(STORAGE_KEY, state);
    }, []);

    const handlePlay  = () => saveState('playing');
    const handlePause = () => saveState('paused');
    const handleStop  = () => {
        saveState('stopped');
        setStats(null);
        setLogLines([]);
        setLastUpdate(null);
        setError(null);
    };

    const isPlaying = monitorState === 'playing';
    const isPaused  = monitorState === 'paused';
    const isStopped = monitorState === 'stopped';

    useEffect(() => {
        adminService.listServers()
            .then(data => { setServers(data); if (data.length) setActiveId(data[0].id); })
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
        } catch { setError('Error al obtener datos del servidor'); }
        finally { setLoading(false); }
    }, [logCount, logType, logProcess]);

    // Solo hace polling cuando está en 'playing'
    useEffect(() => {
        clearInterval(timerRef.current);
        if (!activeId || !isPlaying) return;
        setLoading(true);
        fetchAll(activeId);
        timerRef.current = setInterval(() => fetchAll(activeId), REFRESH_INTERVAL);
        return () => clearInterval(timerRef.current);
    }, [activeId, fetchAll, isPlaying]);

    const pm2Options  = (stats?.pm2 || []).map(p => ({ value: p.name, label: p.name }));
    const lineOptions = [50, 100, 150, 250, 500].map(n => ({ value: n, label: `${n} líneas` }));
    const typeOptions = [{ value: 'out', label: 'stdout' }, { value: 'error', label: 'stderr' }];

    const stateIndicator = isPlaying
        ? { dot: 'bg-emerald-500 animate-pulse', label: 'live · 5s' }
        : isPaused
            ? { dot: 'bg-amber-500', label: 'pausado' }
            : { dot: 'bg-zinc-600', label: 'detenido' };

    return (
        <div className="h-full flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">

            {/* ── Topbar ── */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal size={15} className="text-emerald-400" />
                    <span className="font-bold text-[14px] tracking-tight">
                        <span className="text-emerald-400 font-mono">&gt;_</span>
                        <span className="ml-1.5">Soma</span>
                    </span>
                    {lastUpdate && (
                        <span className="text-[10px] text-zinc-600 ml-2">
                            {lastUpdate.toLocaleTimeString('es-CL')}
                        </span>
                    )}
                </div>

                {/* Toggle Servidores / Clientes */}
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px]">
                    <button
                        onClick={() => setView('servers')}
                        className={cn('flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors',
                            view === 'servers' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}
                    >
                        <Server size={11} /> Servidores
                    </button>
                    <button
                        onClick={() => setView('clients')}
                        className={cn('flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors',
                            view === 'clients' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}
                    >
                        <Users size={11} /> Clientes
                    </button>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Play */}
                    <button
                        onClick={handlePlay}
                        disabled={isPlaying}
                        title="Iniciar monitorización"
                        className={cn(
                            'flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg border transition-colors',
                            isPlaying
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 cursor-default opacity-60'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/40'
                        )}
                    >
                        <Play size={11} />
                        <span className="hidden sm:inline">{isPaused ? 'Reanudar' : 'Iniciar'}</span>
                    </button>
                    {/* Pause */}
                    <button
                        onClick={handlePause}
                        disabled={!isPlaying}
                        title="Pausar monitorización"
                        className={cn(
                            'flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg border transition-colors',
                            isPaused
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 cursor-default opacity-60'
                                : isPlaying
                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40'
                                    : 'bg-zinc-800/30 border-zinc-800 text-zinc-700 cursor-not-allowed'
                        )}
                    >
                        <Pause size={11} />
                        <span className="hidden sm:inline">Pausar</span>
                    </button>
                    {/* Stop */}
                    <button
                        onClick={handleStop}
                        disabled={isStopped}
                        title="Detener monitorización"
                        className={cn(
                            'flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg border transition-colors',
                            isStopped
                                ? 'bg-zinc-800/30 border-zinc-800 text-zinc-700 cursor-not-allowed'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/40'
                        )}
                    >
                        <Square size={11} />
                        <span className="hidden sm:inline">Detener</span>
                    </button>
                    {/* Refresh manual */}
                    <button
                        onClick={() => { setLoading(true); fetchAll(activeId); }}
                        disabled={!isPlaying}
                        title="Actualizar ahora"
                        className="ml-1 flex items-center text-[12px] text-zinc-500 hover:text-emerald-400 transition-colors disabled:opacity-30"
                    >
                        <RefreshCw size={13} />
                    </button>
                </div>
            </div>

            {/* ── Tabs de servidores (solo en vista servidor) ── */}
            {view === 'servers' && <div className="flex items-center gap-1 px-4 pt-2 pb-1 shrink-0 border-b border-zinc-800/50">
                {servers.map(s => (
                    <button
                        key={s.id}
                        onClick={() => { setActiveId(s.id); setLoading(true); }}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] transition-colors',
                            activeId === s.id
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                        )}
                    >
                        <Server size={10} />
                        {s.nombre}
                    </button>
                ))}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-zinc-600 hover:text-emerald-400 hover:bg-zinc-800 transition-colors ml-1"
                    title="Agregar servidor"
                >
                    <Plus size={12} />
                </button>
            </div>}

            {/* ── Vista Clientes (oculta tabs de servidor y logs) ── */}
            {view === 'clients' && (
                <ClientsView servers={servers} />
            )}

            {view === 'servers' && error && (
                <div className="mx-4 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[13px] shrink-0">
                    {error}
                </div>
            )}

            {/* ── Contenido vista servidores ── */}
            {view === 'servers' && <>

            {/* ── Pantalla detenida / pausada (sin datos) ── */}
            {!isPlaying && !stats && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="text-center">
                        <Terminal size={36} className="mx-auto mb-3 text-zinc-700" />
                        <p className="text-[15px] font-semibold text-zinc-400">
                            {isPaused ? 'Monitorización pausada' : 'Monitorización detenida'}
                        </p>
                        <p className="text-[12px] mt-1 text-zinc-600">
                            Presiona Iniciar para comenzar a monitorear el servidor
                        </p>
                    </div>
                    <button
                        onClick={handlePlay}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-medium rounded-lg transition-colors"
                    >
                        <Play size={14} /> Iniciar monitorización
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center flex-1 gap-2 text-zinc-500">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-[13px]">Conectando…</span>
                </div>
            )}

            {/* ── Contenido (solo visible cuando hay datos) ── */}
            {stats && !loading && (
                <>
                    {/* ── Stats (fijo, no hace scroll) ── */}
                    <div className="px-5 py-4 border-b border-zinc-800 shrink-0 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2.5">
                                    <Cpu size={10} /> CPU
                                </div>
                                <UsageBar label="Uso" value={stats.cpu} color="violet" />
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2.5">
                                    <MemoryStick size={10} /> RAM
                                </div>
                                {stats.ram
                                    ? <UsageBar label="Memoria" value={stats.ram.used} total={stats.ram.total} unit="MB" color="emerald" />
                                    : <span className="text-zinc-600 text-[11px]">—</span>}
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2.5">
                                    <HardDrive size={10} /> Disco
                                </div>
                                {stats.disk
                                    ? <UsageBar label="Almacenamiento" value={stats.disk.used} total={stats.disk.total} unit="MB" color="amber" />
                                    : <span className="text-zinc-600 text-[11px]">—</span>}
                            </div>
                        </div>
                        {stats.pm2?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {stats.pm2.map(p => <Pm2Chip key={p.name} proc={p} />)}
                            </div>
                        )}
                    </div>

                    {/* ── Log viewer (scroll propio) ── */}
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        {/* toolbar */}
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 shrink-0 flex-wrap">
                            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mr-1">Logs</span>
                            {pm2Options.length > 0 && (
                                <Select value={logProcess} onChange={v => { setLogProcess(v); lsSet('soma_log_process', v); }} options={pm2Options} className="w-36" />
                            )}
                            <Select value={logType}  onChange={v => { setLogType(v);  lsSet('soma_log_type', v); }}  options={typeOptions} className="w-28" />
                            <Select value={logCount} onChange={v => { setLogCount(Number(v)); lsSet('soma_log_count', v); }} options={lineOptions} className="w-28" />
                            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-zinc-600">
                                <div className={cn('w-1.5 h-1.5 rounded-full', stateIndicator.dot)} />
                                {stateIndicator.label}
                            </div>
                        </div>

                        {/* líneas — scroll independiente */}
                        <div ref={logsRef} className="flex-1 overflow-y-auto bg-zinc-950 py-1">
                            {logLines.length === 0
                                ? <p className="text-zinc-700 text-[12px] text-center py-10">Sin registros</p>
                                : logLines.map((line, i) => <LogLine key={i} line={line} idx={i} />)
                            }
                        </div>
                    </div>

                    {/* ── Consola ── */}
                    {activeId && <CommandConsole serverId={activeId} />}
                </>
            )}

            </>}
            {/* /vista servidores */}

            {showAddModal && (
                <AddServerModal
                    onClose={() => setShowAddModal(false)}
                    onCreated={srv => setServers(p => [...p, srv])}
                />
            )}
        </div>
    );
}
