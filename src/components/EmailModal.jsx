'use client';

import { useState, useRef, useMemo } from 'react';
import { Mail, X, CheckCircle2, Paperclip, Trash2, Loader2, Plus, Eye, EyeOff } from 'lucide-react';

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(',')[1]); // quita el prefijo data:...;base64,
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * EmailModal - Modal genérico para editar y enviar un correo ligado a un proyecto.
 * El texto (to/subject/body) llega precargado vía `draft` pero es editable antes
 * de enviar. `onSend` recibe { to, subject, body, attachments } y debe devolver
 * una promesa — así el modal no sabe (ni le importa) qué endpoint se usa.
 *
 * @param {object} proyecto - proyecto asociado (solo para el header y el email por defecto)
 * @param {{ subject: string, body?: string, file?: File, htmlTemplate?: string, fields?: Array, buildAttachment?: (fieldValues: object) => File|null, warning?: string|((fieldValues: object) => string) }} draft - contenido inicial editable.
 *   Si trae `htmlTemplate` (HTML con tokens {{TOKEN}}), el modal muestra `fields` en vez del textarea de
 *   mensaje y arma el HTML final reemplazando los tokens antes de enviar. Cada field puede traer
 *   `buildHtml(val)` para transformar su valor antes de insertarlo (ej. armar un botón o esconderlo si
 *   está vacío). `buildAttachment(fieldValues)` genera un adjunto extra a partir de los valores actuales
 *   del modal al momento de enviar (ej. un .ics con la fecha que el usuario haya dejado). `warning` muestra
 *   un aviso arriba del formulario (ej. si falta un dato necesario para generar ese adjunto); puede ser un
 *   string fijo o una función `(fieldValues) => string|null` para que se actualice mientras el usuario edita.
 *   Alternativa a `htmlTemplate`: `render(fieldValues) => html` arma el HTML completo (permite ocultar
 *   secciones enteras según lo que se complete). Los fields `textarea` pueden traer `presets: [{ label, value }]`
 *   (textos predefinidos por tono/contexto) y `hint`. En modo HTML el modal ofrece vista previa en vivo.
 * @param {string} title - título del modal (ej. "Bienvenida", "Enviar Factura")
 * @param {React.ComponentType} icon - ícono del header (default Mail)
 * @param {(payload: object) => Promise} onSend - función que efectivamente envía el correo
 * @param {() => void} onClose
 */
export default function EmailModal({ proyecto, draft, title = 'Enviar correo', icon: TitleIcon = Mail, onSend, onClose }) {
    const isHtmlMode = !!(draft?.htmlTemplate || typeof draft?.render === 'function');
    const [to, setTo]           = useState(proyecto?.email_cliente || '');
    const [subject, setSubject] = useState(draft?.subject || '');
    const [body, setBody]       = useState(draft?.body || '');
    const [fieldValues, setFieldValues] = useState(() => {
        const init = {};
        (draft?.fields || []).forEach(f => {
            init[f.key] = f.type === 'credentials-list' ? [{ nombre: '', usuario: '', password: '' }] : (f.defaultValue || '');
        });
        return init;
    });
    const [showPreview, setShowPreview] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent]       = useState(false);
    const [error, setError]     = useState('');
    const [adjuntos, setAdjuntos] = useState(draft?.file ? [draft.file] : []); // [{ file, name }]
    const fileInputRef = useRef(null);

    // El backend acepta máx. 5 adjuntos en total (ver proyectoEmailService.js). Si este
    // draft agrega uno extra al enviar (ej. el .ics), se reserva ese cupo acá — si no,
    // con 5 adjuntos manuales el .ics quedaba último y se lo comía el slice(0,5) del backend.
    const maxAdjuntosManuales = typeof draft?.buildAttachment === 'function' ? 4 : 5;

    const handleAddFiles = (files) => {
        const nuevos = [...files].filter(f => f.size <= 8 * 1024 * 1024); // máx 8MB por archivo
        if (nuevos.length < [...files].length) setError('Algunos archivos superan 8 MB y fueron omitidos.');
        setAdjuntos(prev => [...prev, ...nuevos].slice(0, maxAdjuntosManuales));
    };

    // HTML final a partir de los valores actuales — mismo resultado para la vista previa y el envío.
    const buildFinalHtml = (values) => {
        if (typeof draft?.render === 'function') return draft.render(values);
        const fieldsByKey = Object.fromEntries((draft?.fields || []).map(f => [f.key, f]));
        return Object.entries(values).reduce((html, [key, val]) => {
            const f = fieldsByKey[key];
            const replacement = typeof f?.buildHtml === 'function' ? f.buildHtml(val) : (val || '');
            return html.replaceAll(`{{${key}}}`, replacement);
        }, draft.htmlTemplate);
    };

    const previewHtml = useMemo(
        () => (isHtmlMode && showPreview ? buildFinalHtml(fieldValues) : ''),
        [isHtmlMode, showPreview, fieldValues, draft]
    );

    const send = async () => {
        if (!to.trim()) return;
        setSending(true);
        setError('');
        try {
            const extra = typeof draft?.buildAttachment === 'function' ? draft.buildAttachment(fieldValues) : null;
            const archivos = extra ? [...adjuntos, extra] : adjuntos;
            const attachments = await Promise.all(
                archivos.map(async (f) => ({
                    content: await fileToBase64(f),
                    name:    f.name,
                }))
            );
            const payload = isHtmlMode
                ? { to, subject, attachments, html: buildFinalHtml(fieldValues) }
                : { to, subject, body, attachments };
            await onSend(payload);
            setSent(true);
            setTimeout(onClose, 1500);
        } catch (e) {
            setError('Error al enviar el correo. Intenta nuevamente.');
        } finally {
            setSending(false);
        }
    };

    const warningText = typeof draft?.warning === 'function' ? draft.warning(fieldValues) : draft?.warning;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`bg-card border border-border rounded-2xl shadow-2xl w-full ${showPreview && !sent ? 'max-w-6xl' : 'max-w-lg'} max-h-[90vh] flex flex-col transition-[max-width]`}>
                <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <TitleIcon size={16} className="text-violet-400" />
                        <span className="font-semibold text-[14px]">{title}</span>
                        {proyecto && (
                            <span className="text-[12px] text-muted-foreground">— {proyecto?.codigo_interno} {proyecto?.nombre_cliente}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {isHtmlMode && !sent && (
                            <button
                                onClick={() => setShowPreview(v => !v)}
                                className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-violet-400 transition-colors"
                            >
                                {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                                {showPreview ? 'Ocultar vista previa' : 'Vista previa'}
                            </button>
                        )}
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
                <div className={`p-5 space-y-3 overflow-y-auto flex-1 ${showPreview && !sent ? 'lg:flex-none lg:w-[440px] lg:border-r border-border' : ''}`}>
                    {sent ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <CheckCircle2 size={32} className="text-emerald-400" />
                            <p className="text-[14px] font-medium text-emerald-400">¡Correo enviado!</p>
                        </div>
                    ) : (
                        <>
                            {warningText && (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                                    <p className="text-[12px] text-amber-500">{warningText}</p>
                                </div>
                            )}
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
                            {isHtmlMode ? (
                                <div className="space-y-3">
                                    <p className="text-[11px] text-muted-foreground">Este correo usa una plantilla HTML con diseño. Completa los datos que se insertarán en ella:</p>
                                    {(draft?.fields || []).map(f => f.type === 'credentials-list' ? (
                                        <div key={f.key}>
                                            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">{f.label}</label>
                                            <div className="space-y-2">
                                                {(fieldValues[f.key] || []).map((row, i) => (
                                                    <div key={i} className="border border-border rounded-lg p-2.5 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                value={row.nombre}
                                                                onChange={e => setFieldValues(prev => ({
                                                                    ...prev,
                                                                    [f.key]: prev[f.key].map((r, j) => j === i ? { ...r, nombre: e.target.value } : r),
                                                                }))}
                                                                placeholder="Nombre"
                                                                className="flex-1 text-[13px] bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors"
                                                            />
                                                            <button
                                                                onClick={() => setFieldValues(prev => ({ ...prev, [f.key]: prev[f.key].filter((_, j) => j !== i) }))}
                                                                disabled={fieldValues[f.key].length <= 1}
                                                                className="text-muted-foreground hover:text-destructive transition-colors p-1 disabled:opacity-30 shrink-0"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                value={row.usuario}
                                                                onChange={e => setFieldValues(prev => ({
                                                                    ...prev,
                                                                    [f.key]: prev[f.key].map((r, j) => j === i ? { ...r, usuario: e.target.value } : r),
                                                                }))}
                                                                placeholder="Usuario"
                                                                className="flex-1 min-w-0 text-[13px] bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors"
                                                            />
                                                            <input
                                                                value={row.password}
                                                                onChange={e => setFieldValues(prev => ({
                                                                    ...prev,
                                                                    [f.key]: prev[f.key].map((r, j) => j === i ? { ...r, password: e.target.value } : r),
                                                                }))}
                                                                placeholder="Contraseña"
                                                                className="flex-1 min-w-0 text-[13px] bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setFieldValues(prev => ({ ...prev, [f.key]: [...prev[f.key], { nombre: '', usuario: '', password: '' }] }))}
                                                className="mt-2 flex items-center gap-1 text-[12px] text-violet-400 hover:text-violet-300 transition-colors"
                                            >
                                                <Plus size={12} /> Agregar usuario
                                            </button>
                                        </div>
                                    ) : f.type === 'textarea' ? (
                                        <div key={f.key}>
                                            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">{f.label}</label>
                                            {Array.isArray(f.presets) && f.presets.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-1.5">
                                                    {f.presets.map(p => (
                                                        <button
                                                            key={p.label}
                                                            type="button"
                                                            onClick={() => setFieldValues(prev => ({ ...prev, [f.key]: p.value }))}
                                                            className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${fieldValues[f.key] === p.value
                                                                ? 'border-violet-500 bg-violet-500/15 text-violet-300'
                                                                : 'border-border text-muted-foreground hover:border-violet-500/60 hover:text-foreground'}`}
                                                        >
                                                            {p.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <textarea
                                                value={fieldValues[f.key] || ''}
                                                onChange={e => setFieldValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                placeholder={f.placeholder || ''}
                                                rows={f.rows || 5}
                                                className="w-full text-[13px] bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors resize-y"
                                            />
                                            {f.hint && <p className="text-[10px] text-muted-foreground mt-1">{f.hint}</p>}
                                        </div>
                                    ) : (
                                        <div key={f.key}>
                                            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">{f.label}</label>
                                            <input
                                                type={f.type === 'date' ? 'date' : 'text'}
                                                value={fieldValues[f.key] || ''}
                                                onChange={e => setFieldValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                placeholder={f.placeholder || ''}
                                                className="w-full text-[13px] bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Mensaje</label>
                                    <textarea
                                        value={body}
                                        onChange={e => setBody(e.target.value)}
                                        rows={10}
                                        className="w-full text-[13px] bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors resize-none"
                                    />
                                </div>
                            )}

                            {/* Adjuntos */}
                            <div>
                                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
                                    Adjuntos <span className="normal-case font-normal">(PDF, imagen, Word, Excel — máx. 8 MB c/u, hasta {maxAdjuntosManuales}{typeof draft?.buildAttachment === 'function' ? ' — el .ics ocupa el cupo restante' : ''})</span>
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

                {showPreview && !sent && isHtmlMode && (
                    <div className="flex-1 min-h-[360px] bg-[#f2f2f7] lg:rounded-none overflow-hidden">
                        {/* sandbox sin permisos: el HTML del correo no ejecuta scripts ni navega */}
                        <iframe title="Vista previa del correo" srcDoc={previewHtml} sandbox="" className="w-full h-full min-h-[360px] border-0" />
                    </div>
                )}
                </div>

                {!sent && (
                    <div className="flex justify-end gap-2 p-5 border-t border-border shrink-0">
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
