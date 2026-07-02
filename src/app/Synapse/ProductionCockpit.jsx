'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePersistedState } from '../../hooks/usePersistedState';
import {
    Gauge, RefreshCw, Loader2, Search, ChevronDown, ChevronUp,
    Mail, MessageSquare, Eye, EyeOff, Settings2, X, Check,
    ExternalLink, Server, Calendar, Target, TrendingUp,
    AlertCircle, Clock, CheckCircle2, Minus, Filter, Paperclip, Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import * as synapseService from '../../services/synapseService';
import * as projectsService from '../../services/projectsService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const fmt = (n) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ALERTA_CONFIG = {
    verde:   { label: 'Al día',     bg: 'bg-emerald-500/10', text: 'text-emerald-400',  border: 'border-emerald-500/20', Icon: CheckCircle2 },
    naranja: { label: 'Por vencer', bg: 'bg-amber-500/10',   text: 'text-amber-400',    border: 'border-amber-500/20',   Icon: Clock },
    rojo:    { label: 'Vencida',    bg: 'bg-red-500/10',     text: 'text-red-400',      border: 'border-red-500/20',     Icon: AlertCircle },
    null:    { label: 'Único',      bg: 'bg-secondary',      text: 'text-muted-foreground', border: 'border-border',     Icon: Minus },
};

const DEFAULT_COLUMNAS = {
    contacto:      { label: 'Contacto',      visible: true },
    correo:        { label: 'Correo',        visible: true },
    servidor:      { label: 'Servidor',      visible: true },
    url_front:     { label: 'Link Front',    visible: true },
    estado_pago:   { label: 'Estado Pago',   visible: true },
    acciones:      { label: 'Acciones',      visible: true },
    observaciones: { label: 'Observaciones', visible: true },
};

const DEFAULT_EMAIL_TEMPLATE = (proyecto) =>
    `Estimado/a ${proyecto?.nombre_cliente || ''},\n\nMe comunico para hacer seguimiento a su proyecto "${proyecto?.nombre || ''}".\n\nQuedo atento/a a cualquier consulta.\n\nSaludos,\nNativeCode`;

const DEFAULT_EMAIL_SUBJECT = (proyecto) =>
    `Seguimiento — ${proyecto?.nombre || 'Proyecto'} (${proyecto?.codigo_interno || ''})`;

// ── Sub-componentes ───────────────────────────────────────────────────────────

function AlertaBadge({ alerta }) {
    const cfg = ALERTA_CONFIG[alerta] || ALERTA_CONFIG.null;
    const { Icon } = cfg;
    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border whitespace-nowrap',
            cfg.bg, cfg.text, cfg.border
        )}>
            <Icon size={10} strokeWidth={2.5} />
            {cfg.label}
        </span>
    );
}

function InlineEdit({ value, onSave, placeholder = '—', multiline = false }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft]     = useState(value || '');
    const ref = useRef(null);

    useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

    const save = () => {
        setEditing(false);
        if (draft !== (value || '')) onSave(draft);
    };

    if (!editing) {
        return (
            <span
                onClick={() => { setDraft(value || ''); setEditing(true); }}
                className="cursor-pointer text-[12px] text-muted-foreground hover:text-foreground transition-colors truncate max-w-[140px] block"
                title={value || placeholder}
            >
                {value || <span className="opacity-40 italic">{placeholder}</span>}
            </span>
        );
    }

    return multiline ? (
        <textarea
            ref={ref}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={e => { if (e.key === 'Escape') setEditing(false); }}
            rows={2}
            className="w-full text-[12px] bg-input border border-border rounded-md px-2 py-1 resize-none outline-none focus:border-violet-500"
        />
    ) : (
        <input
            ref={ref}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            className="w-full text-[12px] bg-input border border-border rounded-md px-2 py-1 outline-none focus:border-violet-500"
        />
    );
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(',')[1]); // quita el prefijo data:...;base64,
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function EmailModal({ proyecto, onClose }) {
    const [to, setTo]           = useState(proyecto?.email_cliente || '');
    const [subject, setSubject] = useState(DEFAULT_EMAIL_SUBJECT(proyecto));
    const [body, setBody]       = useState(DEFAULT_EMAIL_TEMPLATE(proyecto));
    const [sending, setSending] = useState(false);
    const [sent, setSent]       = useState(false);
    const [error, setError]     = useState('');
    const [adjuntos, setAdjuntos] = useState([]); // [{ file, name }]
    const fileInputRef = useRef(null);

    const handleAddFiles = (files) => {
        const nuevos = [...files].filter(f => f.size <= 8 * 1024 * 1024); // máx 8MB por archivo
        if (nuevos.length < [...files].length) setError('Algunos archivos superan 8 MB y fueron omitidos.');
        setAdjuntos(prev => [...prev, ...nuevos].slice(0, 5)); // máx 5 adjuntos
    };

    const send = async () => {
        if (!to.trim()) return;
        setSending(true);
        setError('');
        try {
            const attachments = await Promise.all(
                adjuntos.map(async (f) => ({
                    content: await fileToBase64(f),
                    name:    f.name,
                }))
            );
            await synapseService.sendCockpitEmail({ to, subject, body, attachments });
            setSent(true);
            setTimeout(onClose, 1500);
        } catch (e) {
            setError('Error al enviar el correo. Intenta nuevamente.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Mail size={16} className="text-violet-400" />
                        <span className="font-semibold text-[14px]">Enviar correo</span>
                        <span className="text-[12px] text-muted-foreground">— {proyecto?.codigo_interno} {proyecto?.nombre_cliente}</span>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    {sent ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <CheckCircle2 size={32} className="text-emerald-400" />
                            <p className="text-[14px] font-medium text-emerald-400">¡Correo enviado!</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Para</label>
                                <input
                                    value={to}
                                    onChange={e => setTo(e.target.value)}
                                    placeholder="correo@ejemplo.com, otro@ejemplo.com"
                                    className="w-full text-[13px] bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">Separa múltiples correos con coma</p>
                            </div>
                            <div>
                                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Asunto</label>
                                <input
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="w-full text-[13px] bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Mensaje</label>
                                <textarea
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    rows={7}
                                    className="w-full text-[13px] bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors resize-none"
                                />
                            </div>

                            {/* Adjuntos */}
                            <div>
                                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
                                    Adjuntos <span className="normal-case font-normal">(PDF, imagen, Word, Excel — máx. 8 MB c/u, hasta 5)</span>
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={e => { e.preventDefault(); handleAddFiles(e.dataTransfer.files); }}
                                    onDragOver={e => e.preventDefault()}
                                    className="border border-dashed border-border rounded-lg px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:border-violet-500/60 hover:bg-violet-500/5 transition-colors text-[12px] text-muted-foreground"
                                >
                                    <Paperclip size={13} />
                                    Arrastra archivos o haz clic para adjuntar
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*,.txt"
                                        className="hidden"
                                        onChange={e => handleAddFiles(e.target.files)}
                                    />
                                </div>
                                {adjuntos.length > 0 && (
                                    <ul className="mt-1.5 space-y-1">
                                        {adjuntos.map((f, i) => (
                                            <li key={i} className="flex items-center gap-2 text-[12px] text-zinc-300">
                                                <Paperclip size={11} className="text-zinc-500 shrink-0" />
                                                <span className="flex-1 truncate">{f.name}</span>
                                                <span className="text-zinc-600 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                                                <button onClick={() => setAdjuntos(prev => prev.filter((_, j) => j !== i))} className="text-zinc-500 hover:text-red-400 transition-colors">
                                                    <Trash2 size={11} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {error && <p className="text-[12px] text-red-400">{error}</p>}
                        </>
                    )}
                </div>

                {!sent && (
                    <div className="flex justify-end gap-2 p-5 pt-0">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-[13px] rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={send}
                            disabled={!to.trim() || sending}
                            className="flex items-center gap-2 px-4 py-2 text-[13px] rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors disabled:opacity-40"
                        >
                            {sending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                            {sending ? 'Enviando…' : 'Enviar correo'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ColumnToggle({ columnas, onChange, onClose }) {
    return (
        <div className="absolute right-0 top-9 z-30 bg-card border border-border rounded-xl shadow-xl p-3 min-w-[200px]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">Columnas visibles</p>
            {Object.entries(columnas).map(([key, cfg]) => (
                <button
                    key={key}
                    onClick={() => onChange(key)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-foreground/5 transition-colors text-[13px] text-left"
                >
                    <span className={cn(
                        'flex items-center justify-center w-4 h-4 rounded border transition-colors',
                        cfg.visible ? 'bg-violet-600 border-violet-600' : 'border-border'
                    )}>
                        {cfg.visible && <Check size={10} className="text-white" strokeWidth={3} />}
                    </span>
                    {cfg.label}
                </button>
            ))}
            <div className="border-t border-border mt-2 pt-2">
                <button onClick={onClose} className="text-[11px] text-muted-foreground hover:text-foreground w-full text-center transition-colors">
                    Cerrar
                </button>
            </div>
        </div>
    );
}

function MetaConfigModal({ meta, onSave, onClose }) {
    const [value, setValue] = useState(String(meta || ''));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Target size={16} className="text-violet-400" />
                        <span className="font-semibold text-[14px]">Meta mensual</span>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
                </div>
                <div className="p-5 space-y-3">
                    <div>
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Monto objetivo ($CLP)</label>
                        <input
                            type="number"
                            value={value}
                            onChange={e => setValue(e.target.value)}
                            placeholder="5000000"
                            className="w-full text-[13px] bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-5 pt-0">
                    <button onClick={onClose} className="px-4 py-2 text-[13px] rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={() => { onSave(Number(value) || 0); onClose(); }}
                        className="px-4 py-2 text-[13px] rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ProductionCockpit() {
    const now = new Date();

    const [proyectos, setProyectos]         = useState([]);
    const [totalAcumulado, setTotalAcumul]  = useState(0);
    const [totalGeneral, setTotalGeneral]   = useState(0);
    const [meta, setMeta]                   = useState(0);
    const [columnas, setColumnas]           = useState(DEFAULT_COLUMNAS);
    const [loading, setLoading]             = useState(true);
    const [savingId, setSavingId]           = useState(null);
    const [quickPayId, setQuickPayId]       = useState(null);

    const [mes, setMes]   = usePersistedState('cockpit:mes', now.getMonth() + 1);
    const [anio, setAnio] = usePersistedState('cockpit:anio', now.getFullYear());
    const [vistaGeneral, setVistaGeneral]   = usePersistedState('cockpit:vistaGeneral', false);

    const [search, setSearch]               = usePersistedState('cockpit:search', '');
    const [filterAlerta, setFilterAlerta]   = usePersistedState('cockpit:filterAlerta', '');
    const [filterServidor, setFilterServidor] = usePersistedState('cockpit:filterServidor', '');
    const [sortField, setSortField]         = usePersistedState('cockpit:sortField', 'nombre_cliente');
    const [sortDir, setSortDir]             = usePersistedState('cockpit:sortDir', 'asc');

    const [emailModal, setEmailModal]       = useState(null);
    const [metaModal, setMetaModal]         = useState(false);
    const [colToggle, setColToggle]         = useState(false);
    const colToggleRef                      = useRef(null);

    // ── Carga de datos ────────────────────────────────────────────────────────

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = vistaGeneral ? {} : { mes, anio };
            const [data, cfg] = await Promise.all([
                synapseService.getCockpit(params),
                synapseService.getCockpitConfig(),
            ]);

            setProyectos(data?.proyectos || []);
            setTotalAcumul(data?.total_acumulado_mes || 0);
            setTotalGeneral(data?.total_general || 0);
            setMeta(cfg?.meta_mensual || 0);

            if (cfg?.cockpit_columnas) {
                setColumnas(prev => {
                    const merged = { ...prev };
                    Object.keys(cfg.cockpit_columnas).forEach(k => {
                        if (merged[k]) merged[k].visible = cfg.cockpit_columnas[k];
                    });
                    return merged;
                });
            }
        } catch (e) {
            console.error('[Cockpit] Error cargando datos', e);
        } finally {
            setLoading(false);
        }
    }, [mes, anio, vistaGeneral]);

    useEffect(() => { loadData(); }, [loadData]);

    // Cerrar column toggle al hacer click fuera
    useEffect(() => {
        const handler = (e) => {
            if (colToggleRef.current && !colToggleRef.current.contains(e.target)) {
                setColToggle(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleUpdateField = async (id, field, value) => {
        setSavingId(id);
        try {
            await synapseService.updateCockpit(id, { [field]: value });
            setProyectos(prev =>
                prev.map(p => p.id_proyecto === id ? { ...p, [field]: value } : p)
            );
        } catch (e) {
            console.error('[Cockpit] Error actualizando campo', e);
        } finally {
            setSavingId(null);
        }
    };

    const handleMarkPaid = async (proyecto) => {
        if (!window.confirm(
            `¿Confirmas el pago de ${fmt(proyecto.monto_acordado)} para ${proyecto.nombre_cliente}?`
        )) return;

        setQuickPayId(proyecto.id_proyecto);
        try {
            const result = await projectsService.addProjectPayment(proyecto.id_proyecto, {
                concepto: `Renovación ${proyecto.ciclo_facturacion?.toLowerCase() || 'suscripción'}`,
                monto:    Math.round(parseFloat(proyecto.monto_acordado || 0)),
                fecha_pago: new Date().toISOString().split('T')[0],
            });
            if (result && result.ok) {
                await loadData();
            } else {
                alert('Error al registrar el pago');
            }
        } catch (e) {
            console.error('[Cockpit] Error en pago rápido', e);
            alert('Error al registrar el pago');
        } finally {
            setQuickPayId(null);
        }
    };

    const handleWhatsapp = (proyecto) => {
        if (!proyecto.telefono_cliente) return;
        const tel  = proyecto.telefono_cliente.replace(/\D/g, '');
        const text = `Hola ${proyecto.nombre_cliente}, me comunico de NativeCode respecto a su proyecto "${proyecto.nombre}".`;
        window.open(`https://wa.me/${tel}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const toggleColumna = async (key) => {
        const next = {
            ...columnas,
            [key]: { ...columnas[key], visible: !columnas[key].visible },
        };
        setColumnas(next);
        try {
            const visMap = Object.fromEntries(Object.entries(next).map(([k, v]) => [k, v.visible]));
            await synapseService.updateCockpitConfig({ cockpit_columnas: visMap });
        } catch (e) {
            console.error('[Cockpit] Error guardando columnas', e);
        }
    };

    const handleSaveMeta = async (value) => {
        setMeta(value);
        try {
            await synapseService.updateCockpitConfig({ meta_mensual: value });
        } catch (e) {
            console.error('[Cockpit] Error guardando meta', e);
        }
    };

    const handleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    // ── Filtrado y ordenamiento ───────────────────────────────────────────────

    const servidoresUnicos = [...new Set(proyectos.map(p => p.servidor).filter(Boolean))].sort();

    const proyectosFiltrados = proyectos
        .filter(p => {
            const q = search.toLowerCase();
            if (q && !p.nombre?.toLowerCase().includes(q) &&
                !p.nombre_cliente?.toLowerCase().includes(q) &&
                !p.codigo_interno?.toLowerCase().includes(q)) return false;
            if (filterAlerta && p.estado_alerta_pago !== filterAlerta) return false;
            if (filterServidor && p.servidor !== filterServidor) return false;
            // En vista "Este mes": solo proyectos con al menos un pago en ese mes
            if (!vistaGeneral && Number(p.total_pagado_mes) === 0) return false;
            return true;
        })
        .sort((a, b) => {
            const va = (a[sortField] || '').toString().toLowerCase();
            const vb = (b[sortField] || '').toString().toLowerCase();
            return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        });

    const pct = meta > 0 ? Math.min(100, Math.round((totalAcumulado / meta) * 100)) : 0;

    // ── Render ────────────────────────────────────────────────────────────────

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ChevronDown size={11} className="opacity-30" />;
        return sortDir === 'asc'
            ? <ChevronUp size={11} className="text-violet-400" />
            : <ChevronDown size={11} className="text-violet-400" />;
    };

    const th = (label, field, extraClass = '') => (
        <th
            className={cn(
                'px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer select-none',
                extraClass
            )}
            onClick={() => field && handleSort(field)}
        >
            <span className="flex items-center gap-1">
                {label}
                {field && <SortIcon field={field} />}
            </span>
        </th>
    );

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6">

            {/* ── Header ── */}
            <div className="mb-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Gauge size={18} className="text-violet-400" strokeWidth={1.8} />
                            <h1 className="text-[18px] font-semibold tracking-tight">Production Cockpit</h1>
                        </div>
                        <p className="text-[12px] text-muted-foreground">
                            Vista operativa de proyectos activos — Synapse
                        </p>
                    </div>

                    {/* Total general acumulado */}
                    <div className="flex flex-col gap-1 bg-card border border-border rounded-xl px-4 py-3 min-w-[180px]">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp size={12} className="text-emerald-400" />
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Total general
                            </span>
                        </div>
                        <div className="text-[15px] font-semibold tabular-nums text-emerald-500">
                            {fmt(totalGeneral)}
                        </div>
                        <p className="text-[9px] text-muted-foreground/50 mt-0.5">Acumulado histórico</p>
                    </div>

                    {/* Meta mensual chip */}
                    <div
                        className="flex flex-col gap-1 bg-card border border-border rounded-xl px-4 py-3 min-w-[220px] cursor-pointer hover:border-violet-500/40 transition-colors"
                        onClick={() => setMetaModal(true)}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5">
                                <TrendingUp size={12} className="text-violet-400" />
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Total {vistaGeneral ? 'acumulado' : MONTHS_ES[mes - 1]}
                                </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="text-[15px] font-semibold tabular-nums">
                            {fmt(totalAcumulado)}
                            {meta > 0 && (
                                <span className="text-[11px] font-normal text-muted-foreground ml-1.5">/ {fmt(meta)}</span>
                            )}
                        </div>
                        {meta > 0 && (
                            <div className="h-1.5 bg-foreground/8 rounded-full overflow-hidden mt-0.5">
                                <div
                                    className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-emerald-500' : 'bg-violet-500')}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        )}
                        <p className="text-[9px] text-muted-foreground/50 mt-0.5">Clic para editar meta</p>
                    </div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">

                {/* Búsqueda */}
                <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar proyecto o cliente…"
                        className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-card border border-border rounded-lg outline-none focus:border-violet-500 transition-colors"
                    />
                </div>

                {/* Filtro estado pago */}
                <select
                    value={filterAlerta}
                    onChange={e => setFilterAlerta(e.target.value)}
                    className="text-[12px] bg-card border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors text-foreground"
                >
                    <option value="">Todos los estados</option>
                    <option value="verde">Al día</option>
                    <option value="naranja">Por vencer</option>
                    <option value="rojo">Vencida</option>
                </select>

                {/* Filtro servidor */}
                {servidoresUnicos.length > 0 && (
                    <select
                        value={filterServidor}
                        onChange={e => setFilterServidor(e.target.value)}
                        className="text-[12px] bg-card border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors text-foreground"
                    >
                        <option value="">Todos los servidores</option>
                        {servidoresUnicos.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                )}

                {/* Vista mes / todo */}
                <div className="flex items-center gap-0 bg-card border border-border rounded-lg overflow-hidden">
                    <button
                        onClick={() => setVistaGeneral(false)}
                        className={cn('px-3 py-1.5 text-[12px] transition-colors', !vistaGeneral ? 'bg-violet-600 text-white' : 'text-muted-foreground hover:text-foreground')}
                    >
                        Este mes
                    </button>
                    <button
                        onClick={() => setVistaGeneral(true)}
                        className={cn('px-3 py-1.5 text-[12px] transition-colors', vistaGeneral ? 'bg-violet-600 text-white' : 'text-muted-foreground hover:text-foreground')}
                    >
                        Todo
                    </button>
                </div>

                {/* Selector mes/año */}
                {!vistaGeneral && (
                    <div className="flex items-center gap-1.5">
                        <select
                            value={mes}
                            onChange={e => setMes(Number(e.target.value))}
                            className="text-[12px] bg-card border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors"
                        >
                            {MONTHS_ES.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={anio}
                            onChange={e => setAnio(Number(e.target.value))}
                            className="text-[12px] bg-card border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-colors"
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="ml-auto flex items-center gap-2">
                    {/* Columnas toggle */}
                    <div className="relative" ref={colToggleRef}>
                        <button
                            onClick={() => setColToggle(v => !v)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border transition-colors',
                                colToggle ? 'bg-violet-600/10 border-violet-500/30 text-violet-400' : 'border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                            )}
                        >
                            <Settings2 size={13} />
                            Columnas
                        </button>
                        {colToggle && (
                            <ColumnToggle
                                columnas={columnas}
                                onChange={toggleColumna}
                                onClose={() => setColToggle(false)}
                            />
                        )}
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors disabled:opacity-40"
                    >
                        {loading
                            ? <Loader2 size={13} className="animate-spin" />
                            : <RefreshCw size={13} />
                        }
                    </button>
                </div>
            </div>

            {/* ── Tabla ── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-[13px]">Cargando proyectos…</span>
                    </div>
                ) : proyectosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                        <Gauge size={28} strokeWidth={1.4} className="opacity-30" />
                        <p className="text-[13px]">No hay proyectos para mostrar</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed text-[13px]">
                            <colgroup>
                                <col className="w-[16%]" />
                                <col className="w-[14%]" />
                                {columnas.contacto.visible    && <col className="w-[10%]" />}
                                {columnas.correo.visible      && <col className="w-[13%]" />}
                                {columnas.servidor.visible    && <col className="w-[13%]" />}
                                {columnas.url_front.visible   && <col className="w-[8%]" />}
                                {columnas.estado_pago.visible && <col className="w-[16%]" />}
                                {columnas.acciones.visible    && <col className="w-[7%]" />}
                                {columnas.observaciones.visible && <col className="w-[13%]" />}
                            </colgroup>
                            <thead className="border-b border-border bg-foreground/[0.02]">
                                <tr>
                                    {th('Proyecto', 'nombre')}
                                    {th('Cliente', 'nombre_cliente')}
                                    {columnas.contacto.visible    && th('Contacto', 'telefono_cliente')}
                                    {columnas.correo.visible      && th('Correo', 'email_cliente')}
                                    {columnas.servidor.visible    && th('Servidor', 'servidor')}
                                    {columnas.url_front.visible   && th('Link Front', 'url_front')}
                                    {columnas.estado_pago.visible && th('Estado Pago', 'estado_alerta_pago')}
                                    {columnas.acciones.visible    && <th className="px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Acciones</th>}
                                    {columnas.observaciones.visible && th('Observaciones', null)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {proyectosFiltrados.map(p => {
                                    const isSaving = savingId === p.id_proyecto;
                                    const isPaying = quickPayId === p.id_proyecto;
                                    const esRecurrente = p.ciclo_facturacion && p.ciclo_facturacion !== 'Unico';

                                    return (
                                        <tr key={p.id_proyecto} className={cn('transition-colors hover:bg-foreground/[0.015]', isSaving && 'opacity-60')}>

                                            {/* Proyecto */}
                                            <td className="px-2 py-2.5 overflow-hidden">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-medium text-[12px] text-foreground leading-none truncate block">
                                                        {p.nombre}
                                                    </span>
                                                    {p.codigo_interno && (
                                                        <span className="text-[10px] text-violet-400/80 font-mono">{p.codigo_interno}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Cliente */}
                                            <td className="px-2 py-2.5 overflow-hidden">
                                                <span className="text-[12px] text-foreground truncate block">{p.nombre_cliente}</span>
                                            </td>

                                            {/* Contacto */}
                                            {columnas.contacto.visible && (
                                                <td className="px-2 py-2.5 overflow-hidden">
                                                    <span className="text-[12px] text-muted-foreground font-mono truncate block">
                                                        {p.telefono_cliente || <span className="opacity-30">—</span>}
                                                    </span>
                                                </td>
                                            )}

                                            {/* Correo */}
                                            {columnas.correo.visible && (
                                                <td className="px-2 py-2.5 overflow-hidden">
                                                    <span className="text-[12px] text-muted-foreground truncate block">
                                                        {p.email_cliente || <span className="opacity-30">—</span>}
                                                    </span>
                                                </td>
                                            )}

                                            {/* Servidor */}
                                            {columnas.servidor.visible && (
                                                <td className="px-2 py-2.5 overflow-hidden">
                                                    <div className="flex items-center gap-1">
                                                        {isSaving ? <Loader2 size={10} className="animate-spin text-muted-foreground" /> : null}
                                                        <InlineEdit
                                                            value={p.servidor}
                                                            placeholder="Sin servidor"
                                                            onSave={v => handleUpdateField(p.id_proyecto, 'servidor', v)}
                                                        />
                                                    </div>
                                                </td>
                                            )}

                                            {/* Link Front */}
                                            {columnas.url_front.visible && (
                                                <td className="px-2 py-2.5 overflow-hidden">
                                                    <div className="flex items-center gap-1">
                                                        <InlineEdit
                                                            value={p.url_front}
                                                            placeholder="Sin URL"
                                                            onSave={v => handleUpdateField(p.id_proyecto, 'url_front', v)}
                                                        />
                                                        {p.url_front && (
                                                            <a
                                                                href={p.url_front}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-muted-foreground hover:text-violet-400 transition-colors shrink-0"
                                                                onClick={e => e.stopPropagation()}
                                                            >
                                                                <ExternalLink size={11} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            )}

                                            {/* Estado Pago */}
                                            {columnas.estado_pago.visible && (
                                                <td className="px-2 py-2.5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <AlertaBadge alerta={p.estado_alerta_pago} />
                                                        {esRecurrente && p.fecha_proximo_pago && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {p.dias_para_vencer !== null
                                                                    ? p.dias_para_vencer >= 0
                                                                        ? `Vence en ${p.dias_para_vencer}d`
                                                                        : `Vencido ${Math.abs(p.dias_para_vencer)}d`
                                                                    : fmtDate(p.fecha_proximo_pago)
                                                                }
                                                            </span>
                                                        )}
                                                        {esRecurrente && (p.estado_alerta_pago === 'naranja' || p.estado_alerta_pago === 'rojo') && (
                                                            <button
                                                                onClick={() => handleMarkPaid(p)}
                                                                disabled={isPaying}
                                                                className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-40"
                                                            >
                                                                {isPaying
                                                                    ? <Loader2 size={9} className="animate-spin" />
                                                                    : <CheckCircle2 size={9} />
                                                                }
                                                                Marcar pagada
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}

                                            {/* Acciones */}
                                            {columnas.acciones.visible && (
                                                <td className="px-2 py-2.5">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => setEmailModal(p)}
                                                            title="Enviar correo"
                                                            className="flex items-center justify-center w-7 h-7 rounded-lg border border-border text-muted-foreground hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors"
                                                        >
                                                            <Mail size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleWhatsapp(p)}
                                                            title={p.telefono_cliente ? 'Enviar WhatsApp' : 'Sin teléfono registrado'}
                                                            disabled={!p.telefono_cliente}
                                                            className="flex items-center justify-center w-7 h-7 rounded-lg border border-border text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            <MessageSquare size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}

                                            {/* Observaciones */}
                                            {columnas.observaciones.visible && (
                                                <td className="px-2 py-2.5 overflow-hidden">
                                                    <InlineEdit
                                                        value={p.cockpit_observaciones}
                                                        placeholder="Agregar nota…"
                                                        multiline
                                                        onSave={v => handleUpdateField(p.id_proyecto, 'cockpit_observaciones', v)}
                                                    />
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer con conteo */}
                {!loading && proyectosFiltrados.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-border bg-foreground/[0.015] flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                            {proyectosFiltrados.length} proyecto{proyectosFiltrados.length !== 1 ? 's' : ''}
                            {(search || filterAlerta) ? ' (filtrado)' : ''}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            {!vistaGeneral ? `${MONTHS_ES[mes - 1]} ${anio}` : 'Vista general'}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Modales ── */}
            {emailModal && (
                <EmailModal
                    proyecto={emailModal}
                    onClose={() => setEmailModal(null)}
                />
            )}
            {metaModal && (
                <MetaConfigModal
                    meta={meta}
                    onSave={handleSaveMeta}
                    onClose={() => setMetaModal(false)}
                />
            )}
        </div>
    );
}
