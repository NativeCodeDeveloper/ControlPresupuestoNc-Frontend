'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Server, Plus, RefreshCw, Loader2, ExternalLink,
    Pencil, Trash2, Check, X, ChevronDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import * as synapseService from '../../services/synapseService';

// ── Config ────────────────────────────────────────────────────────────────────

const ESTADO_CONFIG = {
    en_uso:          { label: 'En uso por cliente',      bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20' },
    sin_cliente:     { label: 'Desplegado – Sin cliente', bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
    url_disponible:  { label: 'URL disponible',           bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    fuera_servicio:  { label: 'Fuera de servicio',        bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20' },
};

const EMPTY_FORM = { ruta_backend: '', estado: 'url_disponible', id_proyecto: '', version: '', notas: '' };

// ── Sub-componentes ───────────────────────────────────────────────────────────

function EstadoBadge({ estado }) {
    const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.url_disponible;
    return (
        <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border whitespace-nowrap',
            cfg.bg, cfg.text, cfg.border
        )}>
            {cfg.label}
        </span>
    );
}

function ServidorRow({ servidor, proyectos, onSave, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm]       = useState({
        ruta_backend: servidor.ruta_backend || '',
        estado:       servidor.estado       || 'url_disponible',
        id_proyecto:  servidor.id_proyecto  || '',
        version:      servidor.version      || '',
        notas:        servidor.notas        || '',
    });
    const [saving, setSaving]   = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            await onSave(servidor.id_servidor, {
                ...form,
                id_proyecto: form.id_proyecto || null,
            });
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const cancel = () => {
        setForm({
            ruta_backend: servidor.ruta_backend || '',
            estado:       servidor.estado       || 'url_disponible',
            id_proyecto:  servidor.id_proyecto  || '',
            version:      servidor.version      || '',
            notas:        servidor.notas        || '',
        });
        setEditing(false);
    };

    if (editing) {
        return (
            <tr className="bg-violet-500/5">
                <td className="px-3 py-2" colSpan={6}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                        <div>
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Ruta Backend</label>
                            <input
                                value={form.ruta_backend}
                                onChange={e => setForm(f => ({ ...f, ruta_backend: e.target.value }))}
                                placeholder="https://3065.nativecode.cl"
                                className="w-full text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Estado</label>
                            <select
                                value={form.estado}
                                onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                                className="w-full text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors"
                            >
                                {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Cliente / Proyecto</label>
                            <select
                                value={form.id_proyecto}
                                onChange={e => setForm(f => ({ ...f, id_proyecto: e.target.value }))}
                                className="w-full text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors"
                            >
                                <option value="">— Sin asignar —</option>
                                {proyectos.map(p => (
                                    <option key={p.id_proyecto} value={p.id_proyecto}>
                                        {p.codigo_interno} · {p.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Versión</label>
                            <input
                                value={form.version}
                                onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                                placeholder="v1.0.4"
                                className="w-full text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Notas</label>
                            <input
                                value={form.notas}
                                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                                placeholder="Notas opcionales…"
                                className="w-full text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={save}
                            disabled={saving || !form.ruta_backend.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors disabled:opacity-40"
                        >
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            Guardar
                        </button>
                        <button
                            onClick={cancel}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={12} /> Cancelar
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-foreground/[0.015] transition-colors group">
            <td className="px-3 py-3 text-[12px] text-muted-foreground tabular-nums">{servidor.id_servidor}</td>
            <td className="px-3 py-3">
                <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-mono text-foreground">{servidor.ruta_backend}</span>
                    <a
                        href={servidor.ruta_backend}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <ExternalLink size={11} />
                    </a>
                </div>
            </td>
            <td className="px-3 py-3"><EstadoBadge estado={servidor.estado} /></td>
            <td className="px-3 py-3">
                {servidor.proyecto_nombre ? (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] text-foreground">{servidor.proyecto_cliente}</span>
                        <span className="text-[10px] text-violet-400/80 font-mono">{servidor.proyecto_codigo}</span>
                    </div>
                ) : (
                    <span className="text-[12px] text-muted-foreground opacity-40">—</span>
                )}
            </td>
            <td className="px-3 py-3">
                <span className="text-[12px] text-muted-foreground font-mono">{servidor.version || '—'}</span>
            </td>
            <td className="px-3 py-3">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setEditing(true)}
                        className="flex items-center justify-center w-7 h-7 rounded-lg border border-border text-muted-foreground hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors"
                        title="Editar"
                    >
                        <Pencil size={11} />
                    </button>
                    <button
                        onClick={() => onDelete(servidor.id_servidor)}
                        className="flex items-center justify-center w-7 h-7 rounded-lg border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 size={11} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ServidoresBackend() {
    const [servidores, setServidores] = useState([]);
    const [proyectos, setProyectos]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [showForm, setShowForm]     = useState(false);
    const [form, setForm]             = useState(EMPTY_FORM);
    const [saving, setSaving]         = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [srvs, meta] = await Promise.all([
                synapseService.getServidores(),
                synapseService.getMetaProyectos(),
            ]);
            setServidores(Array.isArray(srvs) ? srvs : []);
            setProyectos(Array.isArray(meta) ? meta : []);
        } catch (e) {
            console.error('[Servidores] Error cargando', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleCreate = async () => {
        if (!form.ruta_backend.trim()) return;
        setSaving(true);
        try {
            await synapseService.createServidor({ ...form, id_proyecto: form.id_proyecto || null });
            setForm(EMPTY_FORM);
            setShowForm(false);
            await loadData();
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id, data) => {
        await synapseService.updateServidor(id, data);
        await loadData();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este servidor del registro?')) return;
        await synapseService.deleteServidor(id);
        await loadData();
    };

    // Leyenda de estados
    const counts = Object.fromEntries(
        Object.keys(ESTADO_CONFIG).map(k => [k, servidores.filter(s => s.estado === k).length])
    );

    return (
        <div className="mt-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Server size={16} className="text-violet-400" strokeWidth={1.8} />
                    <h2 className="text-[15px] font-semibold tracking-tight">Servidores Backend</h2>
                    <span className="text-[11px] text-muted-foreground bg-foreground/5 border border-border rounded-full px-2 py-0.5">
                        {servidores.length} registros
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    </button>
                    <button
                        onClick={() => setShowForm(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
                    >
                        <Plus size={13} />
                        Agregar servidor
                    </button>
                </div>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                    <div key={k} className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px]', v.bg, v.border)}>
                        <span className={cn('font-semibold', v.text)}>{v.label}</span>
                        <span className="text-muted-foreground">({counts[k] || 0})</span>
                    </div>
                ))}
            </div>

            {/* Form nuevo servidor */}
            {showForm && (
                <div className="bg-card border border-violet-500/20 rounded-xl p-4 mb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Nuevo servidor</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                        <div>
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Ruta Backend *</label>
                            <input
                                value={form.ruta_backend}
                                onChange={e => setForm(f => ({ ...f, ruta_backend: e.target.value }))}
                                placeholder="https://3065.nativecode.cl"
                                className="w-full text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Estado</label>
                            <select
                                value={form.estado}
                                onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                                className="w-full text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors"
                            >
                                {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Cliente / Proyecto</label>
                            <select
                                value={form.id_proyecto}
                                onChange={e => setForm(f => ({ ...f, id_proyecto: e.target.value }))}
                                className="w-full text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors"
                            >
                                <option value="">— Sin asignar —</option>
                                {proyectos.map(p => (
                                    <option key={p.id_proyecto} value={p.id_proyecto}>
                                        {p.codigo_interno} · {p.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Versión</label>
                            <input
                                value={form.version}
                                onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                                placeholder="v1.0.4"
                                className="w-full text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Notas</label>
                            <input
                                value={form.notas}
                                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                                placeholder="Notas opcionales…"
                                className="w-full text-[12px] bg-input border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreate}
                            disabled={saving || !form.ruta_backend.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors disabled:opacity-40"
                        >
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            Crear
                        </button>
                        <button
                            onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                            className="px-3 py-1.5 text-[12px] rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Tabla */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="text-[12px]">Cargando servidores…</span>
                    </div>
                ) : servidores.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                        <Server size={24} strokeWidth={1.4} className="opacity-30" />
                        <p className="text-[12px]">No hay servidores registrados</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="border-b border-border bg-foreground/[0.02]">
                                <tr>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground w-10">#</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ruta Backend</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Estado</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Cliente / Titular</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Versión</th>
                                    <th className="px-3 py-2.5 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {servidores.map(s => (
                                    <ServidorRow
                                        key={s.id_servidor}
                                        servidor={s}
                                        proyectos={proyectos}
                                        onSave={handleUpdate}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
