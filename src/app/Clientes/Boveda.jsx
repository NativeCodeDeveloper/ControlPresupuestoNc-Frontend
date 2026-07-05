'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePersistedState } from '../../hooks/usePersistedState';
import {
    Shield, Plus, Loader2, RefreshCw, Server, Globe, GitBranch,
    Key, FileCode2, AlertTriangle, Eye, EyeOff, Copy, Check,
    ChevronDown, Trash2, Save, X, Database, Wifi, Lock,
    ChevronRight, FolderCode, Terminal, Layers
} from 'lucide-react';
import { cn } from '../../lib/utils';
import * as svc from '../../services/clientesService';
import { getProjects } from '../../services/projectsService';

// ── Helpers ───────────────────────────────────────────────────────────────────

function useCopyToClipboard() {
    const [copied, setCopied] = useState(null);
    const copy = (text, id) => {
        navigator.clipboard.writeText(text ?? '').then(() => {
            setCopied(id);
            setTimeout(() => setCopied(null), 2000);
        });
    };
    return { copy, copied };
}

function SecretField({ value, label, onCopy, copyId, copiedId, placeholder = '—' }) {
    const [visible, setVisible] = useState(false);
    const isEmpty = !value;
    return (
        <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn('flex-1 font-mono text-[12px] truncate', isEmpty ? 'text-muted-foreground/40 italic' : 'text-foreground')}>
                {isEmpty ? placeholder : visible ? value : '••••••••••••'}
            </span>
            {!isEmpty && (
                <>
                    <button onClick={() => setVisible(v => !v)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5">
                        {visible ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button onClick={() => onCopy(value, copyId)} className="shrink-0 text-muted-foreground hover:text-amber-400 transition-colors p-0.5">
                        {copiedId === copyId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                </>
            )}
        </div>
    );
}

function TextField({ value, placeholder = '—', onCopy, copyId, copiedId }) {
    const isEmpty = !value;
    return (
        <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn('flex-1 font-mono text-[12px] truncate', isEmpty ? 'text-muted-foreground/40 italic' : 'text-foreground')}>
                {isEmpty ? placeholder : value}
            </span>
            {!isEmpty && (
                <button onClick={() => onCopy(value, copyId)} className="shrink-0 text-muted-foreground hover:text-amber-400 transition-colors p-0.5">
                    {copiedId === copyId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
            )}
        </div>
    );
}

// ── Fila editable de tabla ────────────────────────────────────────────────────

function EditableRow({ label, fieldKey, value, type = 'text', secret = false, onSave }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft]     = useState('');
    const [visible, setVisible] = useState(false);
    const [copied, setCopied]   = useState(false);
    const ref = useRef(null);

    const startEdit = () => { setDraft(value || ''); setEditing(true); setTimeout(() => ref.current?.focus(), 50); };
    const save = () => { setEditing(false); if (draft !== (value || '')) onSave(fieldKey, draft || null); };
    const copy = () => { navigator.clipboard.writeText(value || '').then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

    return (
        <tr className="group border-b border-border/40 last:border-0">
            <td className="py-2.5 pr-3 w-[140px] shrink-0">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{label}</span>
            </td>
            <td className="py-2.5 w-full">
                {editing ? (
                    <div className="flex items-center gap-1.5">
                        <input
                            ref={ref}
                            type={type === 'password' ? 'text' : type}
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onBlur={save}
                            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                            className="flex-1 text-[12px] font-mono bg-input border border-amber-500/40 rounded-md px-2 py-1 outline-none"
                            placeholder={`Ingresar ${label.toLowerCase()}…`}
                        />
                        <button onClick={save} className="text-amber-400 hover:text-amber-300 p-0.5"><Save size={12} /></button>
                        <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground p-0.5"><X size={12} /></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 min-w-0" onClick={startEdit}>
                        {secret ? (
                            <span className={cn('flex-1 font-mono text-[12px] truncate cursor-pointer', !value ? 'text-muted-foreground/40 italic' : 'text-foreground')}>
                                {!value ? 'Clic para agregar…' : visible ? value : '••••••••••••'}
                            </span>
                        ) : (
                            <span className={cn('flex-1 font-mono text-[12px] truncate cursor-pointer', !value ? 'text-muted-foreground/40 italic' : 'text-foreground')}>
                                {value || 'Clic para agregar…'}
                            </span>
                        )}
                        {value && secret && (
                            <button onClick={e => { e.stopPropagation(); setVisible(v => !v); }} className="shrink-0 text-muted-foreground hover:text-foreground p-0.5">
                                {visible ? <EyeOff size={11} /> : <Eye size={11} />}
                            </button>
                        )}
                        {value && (
                            <button onClick={e => { e.stopPropagation(); copy(); }} className="shrink-0 text-muted-foreground hover:text-amber-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            </button>
                        )}
                    </div>
                )}
            </td>
        </tr>
    );
}

// ── Sección colapsable ────────────────────────────────────────────────────────

function Section({ icon: Icon, title, color = 'text-amber-400', children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-foreground/[0.015] transition-colors"
            >
                <Icon size={14} className={color} strokeWidth={1.8} />
                <span className="font-semibold text-[13px] flex-1 text-left">{title}</span>
                {open ? <ChevronDown size={13} className="text-muted-foreground" /> : <ChevronRight size={13} className="text-muted-foreground" />}
            </button>
            {open && <div className="px-4 pb-4 border-t border-border/50">{children}</div>}
        </div>
    );
}

// ── Editor de .env ────────────────────────────────────────────────────────────

const ENTORNOS = ['produccion', 'desarrollo', 'staging'];
const ENTORNO_LABEL = { produccion: 'Producción', desarrollo: 'Desarrollo', staging: 'Staging' };
const ENTORNO_CLS   = { produccion: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/8', desarrollo: 'text-sky-400 border-sky-500/30 bg-sky-500/8', staging: 'text-amber-400 border-amber-500/30 bg-amber-500/8' };

function EnvEditor({ entradaId }) {
    const [vars, setVars]         = useState([]);
    const [loading, setLoading]   = useState(true);
    const [entorno, setEntorno]   = useState('produccion');
    const [newKey, setNewKey]     = useState('');
    const [newVal, setNewVal]     = useState('');
    const [newDesc, setNewDesc]   = useState('');
    const [adding, setAdding]     = useState(false);
    const [saving, setSaving]     = useState(false);
    const { copy, copied }        = useCopyToClipboard();

    const load = useCallback(async () => {
        setLoading(true);
        try { setVars(await svc.getEnvVars(entradaId) ?? []); }
        finally { setLoading(false); }
    }, [entradaId]);

    useEffect(() => { load(); }, [load]);

    const del = async (id_env) => {
        await svc.deleteEnvVar(entradaId, id_env);
        setVars(v => v.filter(e => e.id_env !== id_env));
    };

    const add = async () => {
        if (!newKey.trim()) return;
        setSaving(true);
        try {
            const res = await svc.createEnvVar(entradaId, { entorno, clave: newKey.trim(), valor: newVal, descripcion: newDesc || null });
            setVars(v => [...v, { id_env: res.id_env ?? res, entorno, clave: newKey.trim(), valor: newVal, descripcion: newDesc || null }]);
            setNewKey(''); setNewVal(''); setNewDesc(''); setAdding(false);
            await load();
        } finally { setSaving(false); }
    };

    const byEntorno = ENTORNOS.map(e => ({ e, items: vars.filter(v => v.entorno === e) })).filter(g => g.items.length > 0 || g.e === entorno);

    const exportEnv = (e) => {
        const items = vars.filter(v => v.entorno === e);
        const text  = items.map(v => `${v.clave}=${v.valor ?? ''}`).join('\n');
        navigator.clipboard.writeText(text);
    };

    if (loading) return <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground"><Loader2 size={13} className="animate-spin" /><span className="text-[12px]">Cargando variables…</span></div>;

    return (
        <div className="pt-3 space-y-4">
            {/* Tabs entorno */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {ENTORNOS.map(e => (
                    <button
                        key={e}
                        onClick={() => setEntorno(e)}
                        className={cn('px-3 py-1 rounded-lg border text-[11px] font-semibold transition-colors',
                            entorno === e ? ENTORNO_CLS[e] : 'border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                        )}
                    >
                        {ENTORNO_LABEL[e]}
                        <span className="ml-1.5 opacity-60">{vars.filter(v => v.entorno === e).length}</span>
                    </button>
                ))}
            </div>

            {/* Lista vars del entorno activo */}
            {vars.filter(v => v.entorno === entorno).length === 0 ? (
                <p className="text-[12px] text-muted-foreground/60 py-2">Sin variables para {ENTORNO_LABEL[entorno]}</p>
            ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-foreground/[0.02] border-b border-border">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">.env · {ENTORNO_LABEL[entorno]}</span>
                        <button onClick={() => exportEnv(entorno)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-amber-400 transition-colors">
                            <Copy size={10} /> Copiar todo
                        </button>
                    </div>
                    <div className="divide-y divide-border/40">
                        {vars.filter(v => v.entorno === entorno).map(v => (
                            <div key={v.id_env} className="flex items-center gap-2 px-3 py-2 group hover:bg-foreground/[0.015]">
                                <code className="font-mono text-[11px] text-amber-300 shrink-0 min-w-[140px]">{v.clave}</code>
                                <span className="text-muted-foreground/40 shrink-0">=</span>
                                <SecretField
                                    value={v.valor}
                                    onCopy={copy}
                                    copyId={`env-${v.id_env}`}
                                    copiedId={copied}
                                    placeholder="(vacío)"
                                />
                                {v.descripcion && (
                                    <span className="text-[10px] text-muted-foreground/50 italic truncate hidden sm:block">{v.descripcion}</span>
                                )}
                                <button onClick={() => del(v.id_env)} className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-colors p-0.5">
                                    <Trash2 size={11} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Agregar variable */}
            {adding ? (
                <div className="border border-amber-500/20 rounded-xl p-3 bg-amber-500/5 space-y-2">
                    <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">Nueva variable · {ENTORNO_LABEL[entorno]}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="NOMBRE_VARIABLE" className="font-mono text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500/60 uppercase" />
                        <input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="valor" className="font-mono text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500/60" />
                    </div>
                    <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descripción (opcional)…" className="w-full text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500/60" />
                    <div className="flex gap-2">
                        <button onClick={add} disabled={saving || !newKey.trim()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[12px] disabled:opacity-40 transition-colors">
                            {saving ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Agregar
                        </button>
                        <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg border border-border text-[12px] text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setAdding(true)} className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-amber-400 transition-colors">
                    <Plus size={13} /> Agregar variable
                </button>
            )}
        </div>
    );
}

// ── Editor de accesos adicionales ─────────────────────────────────────────────

const TIPOS_ACCESO = [
    { value: 'api_key', label: 'API Key' },
    { value: 'oauth',   label: 'OAuth' },
    { value: 'smtp',    label: 'SMTP' },
    { value: 'ftp',     label: 'FTP' },
    { value: 'db',      label: 'Base de datos' },
    { value: 'otro',    label: 'Otro' },
];

function AccesosEditor({ entradaId }) {
    const [accesos, setAccesos]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [adding, setAdding]     = useState(false);
    const [saving, setSaving]     = useState(false);
    const [form, setForm]         = useState({ tipo: 'api_key', nombre: '', usuario: '', clave: '', url: '', notas: '' });
    const { copy, copied }        = useCopyToClipboard();

    const load = useCallback(async () => {
        setLoading(true);
        try { setAccesos(await svc.getAccesos(entradaId) ?? []); }
        finally { setLoading(false); }
    }, [entradaId]);

    useEffect(() => { load(); }, [load]);

    const add = async () => {
        if (!form.nombre.trim()) return;
        setSaving(true);
        try {
            await svc.createAcceso(entradaId, form);
            setAdding(false);
            setForm({ tipo: 'api_key', nombre: '', usuario: '', clave: '', url: '', notas: '' });
            await load();
        } finally { setSaving(false); }
    };

    const del = async (id) => {
        await svc.deleteAcceso(entradaId, id);
        setAccesos(a => a.filter(x => x.id_acceso !== id));
    };

    if (loading) return <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground"><Loader2 size={13} className="animate-spin" /></div>;

    return (
        <div className="pt-3 space-y-3">
            {accesos.length === 0 ? (
                <p className="text-[12px] text-muted-foreground/60 py-2">Sin accesos registrados</p>
            ) : (
                <div className="space-y-2">
                    {accesos.map(a => (
                        <div key={a.id_acceso} className="border border-border rounded-xl p-3 group hover:border-amber-500/20 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                    <span className="font-semibold text-[13px] text-foreground">{a.nombre}</span>
                                    <span className="ml-2 text-[10px] text-muted-foreground uppercase tracking-wide border border-border rounded px-1.5 py-0.5">{a.tipo}</span>
                                </div>
                                <button onClick={() => del(a.id_acceso)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-colors p-0.5">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            <table className="w-full text-[11px]">
                                <tbody>
                                    {a.usuario && <tr><td className="text-muted-foreground pr-3 w-20">Usuario</td><td><TextField value={a.usuario} onCopy={copy} copyId={`acc-u-${a.id_acceso}`} copiedId={copied} /></td></tr>}
                                    {(a.clave !== null && a.clave !== undefined) && <tr><td className="text-muted-foreground pr-3 w-20">Clave</td><td><SecretField value={a.clave} onCopy={copy} copyId={`acc-c-${a.id_acceso}`} copiedId={copied} /></td></tr>}
                                    {a.url && <tr><td className="text-muted-foreground pr-3 w-20">URL</td><td><TextField value={a.url} onCopy={copy} copyId={`acc-url-${a.id_acceso}`} copiedId={copied} /></td></tr>}
                                    {a.notas && <tr><td className="text-muted-foreground pr-3 w-20">Notas</td><td><span className="text-foreground text-[11px]">{a.notas}</span></td></tr>}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}

            {adding ? (
                <div className="border border-amber-500/20 rounded-xl p-3 bg-amber-500/5 space-y-2">
                    <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">Nuevo acceso</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500/60">
                            {TIPOS_ACCESO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre *" className="text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500/60" />
                        <input value={form.usuario} onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))} placeholder="Usuario / Client ID" className="text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500/60" />
                        <input value={form.clave} onChange={e => setForm(f => ({ ...f, clave: e.target.value }))} placeholder="Clave / API Key / Secret" className="text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500/60" type="text" />
                        <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="URL (opcional)" className="text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500/60" />
                        <input value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Notas (opcional)" className="text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500/60" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={add} disabled={saving || !form.nombre.trim()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[12px] disabled:opacity-40">
                            {saving ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Guardar
                        </button>
                        <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg border border-border text-[12px] text-muted-foreground">Cancelar</button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setAdding(true)} className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-amber-400 transition-colors">
                    <Plus size={13} /> Agregar acceso
                </button>
            )}
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

const INFRA_FIELDS = [
    { key: 'hostname',       label: 'Host / IP',     secret: false },
    { key: 'ssh_usuario',    label: 'SSH Usuario',   secret: false },
    { key: 'ssh_clave',      label: 'SSH Contraseña',secret: true  },
    { key: 'ssh_puerto',     label: 'SSH Puerto',    secret: false },
    { key: 'cpanel_url',     label: 'cPanel URL',    secret: false },
    { key: 'cpanel_usuario', label: 'cPanel Usuario',secret: false },
    { key: 'cpanel_clave',   label: 'cPanel Clave',  secret: true  },
];
const REPO_FIELDS = [
    { key: 'repo_url',         label: 'Repositorio',        secret: false },
    { key: 'repo_rama_main',   label: 'Rama principal',     secret: false },
    { key: 'repo_rama_deploy', label: 'Rama deploy',        secret: false },
];
const DOMINIOS_FIELDS = [
    { key: 'dominio_prod',    label: 'Dominio producción',  secret: false },
    { key: 'dominio_staging', label: 'Dominio staging',     secret: false },
    { key: 'proveedor_dns',   label: 'Proveedor DNS',       secret: false },
];
const DEPLOY_FIELDS = [
    { key: 'version_actual',  label: 'Versión actual',      secret: false },
    { key: 'fecha_deploy',    label: 'Último deploy',       secret: false },
    { key: 'proceso_pm2',     label: 'Proceso PM2',         secret: false },
    { key: 'ruta_backend',    label: 'Ruta backend',        secret: false },
    { key: 'ruta_frontend',   label: 'Ruta frontend',       secret: false },
];
const DB_FIELDS = [
    { key: 'db_host',    label: 'DB Host',     secret: false },
    { key: 'db_nombre',  label: 'DB Nombre',   secret: false },
    { key: 'db_usuario', label: 'DB Usuario',  secret: false },
    { key: 'db_clave',   label: 'DB Contraseña',secret: true },
];

function FieldTable({ fields, entrada, onSave }) {
    return (
        <table className="w-full mt-3">
            <tbody>
                {fields.map(f => (
                    <EditableRow
                        key={f.key}
                        label={f.label}
                        fieldKey={f.key}
                        value={entrada[f.key]}
                        secret={f.secret}
                        type={f.secret ? 'password' : 'text'}
                        onSave={onSave}
                    />
                ))}
            </tbody>
        </table>
    );
}

export default function Boveda() {
    const searchParams = useSearchParams();
    const [proyectos, setProyectos]   = useState([]);
    const [bovedas, setBovedas]       = useState([]);
    const [entrada, setEntrada]       = useState(null);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [selectedId, setSelectedId] = usePersistedState('boveda:selectedId', null);
    const [creating, setCreating]     = useState(false);
    const [newProy, setNewProy]       = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [bs, ps] = await Promise.all([svc.getBovedas(), getProjects()]);
            setBovedas(Array.isArray(bs) ? bs : []);
            setProyectos(Array.isArray(ps) ? ps : []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Auto-abrir desde querystring ?entrada=X o ?nuevo=X
    useEffect(() => {
        const entId = searchParams.get('entrada');
        const newId = searchParams.get('nuevo');
        if (entId) setSelectedId(Number(entId));
        if (newId) { setNewProy(newId); setCreating(true); }
    }, [searchParams]);

    // Cargar detalle cuando cambia selección
    useEffect(() => {
        if (!selectedId) { setEntrada(null); return; }
        svc.getBoveda(selectedId).then(d => setEntrada(d)).catch(() => setEntrada(null));
    }, [selectedId]);

    const handleSaveField = async (key, value) => {
        if (!selectedId) return;
        setSaving(true);
        try {
            await svc.updateBoveda(selectedId, { [key]: value });
            setEntrada(e => ({ ...e, [key]: value }));
        } finally { setSaving(false); }
    };

    const handleCreate = async () => {
        if (!newProy) return;
        setSaving(true);
        try {
            // Auto-popular desde backserver si existe
            const proyData = proyectos.find(p => String(p.id_proyecto) === String(newProy));
            const res = await svc.createBoveda({
                id_proyecto:   Number(newProy),
                ruta_backend:  proyData?.servidor || null,
            });
            await load();
            setSelectedId(res.entrada?.id_entrada ?? null);
            setCreating(false);
            setNewProy('');
        } finally { setSaving(false); }
    };

    // Proyectos sin bóveda
    const proyectosConBoveda = new Set(bovedas.map(b => b.id_proyecto));
    const proyectosSinBoveda = proyectos.filter(p => !proyectosConBoveda.has(p.id_proyecto) && p.activo);

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-0">

            {/* ── Sidebar de entradas ── */}
            <div className="w-full lg:w-72 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield size={16} className="text-amber-400" strokeWidth={1.8} />
                        <h2 className="font-semibold text-[15px]">Bóveda</h2>
                        <span className="text-[11px] text-muted-foreground bg-foreground/5 border border-border rounded-full px-2 py-0.5">{bovedas.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button onClick={load} disabled={loading} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-foreground/5 transition-colors">
                            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        </button>
                        <button onClick={() => setCreating(c => !c)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[12px] font-medium transition-colors">
                            <Plus size={13} /> Nueva
                        </button>
                    </div>
                </div>

                {/* Form nueva entrada */}
                {creating && (
                    <div className="border border-amber-500/20 rounded-xl p-3 bg-amber-500/5 space-y-2">
                        <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">Nuevo registro</p>
                        <select
                            value={newProy}
                            onChange={e => setNewProy(e.target.value)}
                            className="w-full text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500/60"
                        >
                            <option value="">— Selecciona proyecto —</option>
                            {proyectosSinBoveda.map(p => (
                                <option key={p.id_proyecto} value={p.id_proyecto}>
                                    {p.codigo_interno} · {p.nombre}
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <button onClick={handleCreate} disabled={saving || !newProy} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[12px] disabled:opacity-40">
                                {saving ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Crear
                            </button>
                            <button onClick={() => { setCreating(false); setNewProy(''); }} className="px-3 py-1.5 rounded-lg border border-border text-[12px] text-muted-foreground">
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista de entradas */}
                <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-0.5">
                    {loading && bovedas.length === 0 ? (
                        <div className="flex items-center gap-2 py-4 text-muted-foreground text-[12px]">
                            <Loader2 size={13} className="animate-spin" /> Cargando…
                        </div>
                    ) : bovedas.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground/60 py-4">Sin entradas. Crea la primera.</p>
                    ) : (
                        bovedas.map(b => (
                            <button
                                key={b.id_entrada}
                                onClick={() => setSelectedId(selectedId === b.id_entrada ? null : b.id_entrada)}
                                className={cn(
                                    'w-full text-left rounded-xl border px-3 py-2.5 transition-all duration-150',
                                    selectedId === b.id_entrada
                                        ? 'border-amber-500/40 bg-amber-500/8'
                                        : 'border-border hover:border-amber-500/20 hover:bg-foreground/[0.015] bg-card'
                                )}
                            >
                                <p className="font-medium text-[12px] text-foreground truncate">{b.nombre_cliente}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{b.proyecto_nombre}</p>
                                <p className="text-[10px] font-mono text-amber-400/70 mt-0.5">{b.codigo_interno}</p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* ── Panel de detalle ── */}
            <div className="flex-1 min-w-0 space-y-4">
                {!selectedId || !entrada ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                        <Shield size={36} strokeWidth={1.3} className="opacity-20" />
                        <p className="text-[13px]">Selecciona un proyecto para ver su bóveda</p>
                        <p className="text-[11px] opacity-60">o crea un nuevo registro</p>
                    </div>
                ) : (
                    <>
                        {/* Header del proyecto */}
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="font-semibold text-[16px]">{entrada.nombre_cliente}</h2>
                                    <span className="text-[11px] font-mono text-amber-400/80">{entrada.codigo_interno}</span>
                                    {saving && <Loader2 size={12} className="animate-spin text-amber-400" />}
                                </div>
                                <p className="text-[12px] text-muted-foreground mt-0.5">{entrada.proyecto_nombre}</p>
                            </div>
                        </div>

                        {/* Infraestructura */}
                        <Section icon={Server} title="Infraestructura / SSH / cPanel" color="text-violet-400">
                            <FieldTable fields={INFRA_FIELDS} entrada={entrada} onSave={handleSaveField} />
                        </Section>

                        {/* Repositorio + Dominios + Despliegue */}
                        <Section icon={GitBranch} title="Repositorio y Dominios" color="text-sky-400">
                            <FieldTable fields={REPO_FIELDS} entrada={entrada} onSave={handleSaveField} />
                            <div className="mt-3 pt-3 border-t border-border/40">
                                <FieldTable fields={DOMINIOS_FIELDS} entrada={entrada} onSave={handleSaveField} />
                            </div>
                        </Section>

                        {/* Despliegue */}
                        <Section icon={Layers} title="Despliegue y Versión" color="text-emerald-400">
                            <FieldTable fields={DEPLOY_FIELDS} entrada={entrada} onSave={handleSaveField} />
                        </Section>

                        {/* Base de datos */}
                        <Section icon={Database} title="Base de Datos" color="text-blue-400" defaultOpen={false}>
                            <FieldTable fields={DB_FIELDS} entrada={entrada} onSave={handleSaveField} />
                        </Section>

                        {/* Variables de entorno */}
                        <Section icon={FileCode2} title="Variables de entorno (.env)" color="text-amber-400">
                            <EnvEditor entradaId={entrada.id_entrada} />
                        </Section>

                        {/* Accesos adicionales */}
                        <Section icon={Key} title="Accesos adicionales (APIs, FTP, OAuth)" color="text-rose-400" defaultOpen={false}>
                            <AccesosEditor entradaId={entrada.id_entrada} />
                        </Section>

                        {/* Notas de emergencia */}
                        <Section icon={AlertTriangle} title="Notas de emergencia" color="text-red-400" defaultOpen={false}>
                            <div className="pt-3">
                                <EmergencyNotes
                                    value={entrada.notas_emergencia}
                                    onSave={v => handleSaveField('notas_emergencia', v)}
                                />
                            </div>
                        </Section>
                    </>
                )}
            </div>
        </div>
    );
}

function EmergencyNotes({ value, onSave }) {
    const [draft, setDraft] = useState(value || '');
    const [dirty, setDirty] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => { setDraft(value || ''); setDirty(false); }, [value]);

    const save = async () => {
        await onSave(draft);
        setDirty(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-2">
            <textarea
                value={draft}
                onChange={e => { setDraft(e.target.value); setDirty(true); }}
                rows={6}
                placeholder="Documenta aquí procedimientos de emergencia, contactos críticos, pasos de recuperación…"
                className="w-full text-[12px] bg-input border border-border rounded-xl px-3 py-2.5 outline-none focus:border-red-500/40 resize-none transition-colors"
            />
            {dirty && (
                <button onClick={save} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-[12px] transition-colors">
                    <Save size={11} /> Guardar notas
                </button>
            )}
            {saved && <p className="text-[11px] text-emerald-400">✓ Guardado</p>}
        </div>
    );
}
