'use client';

import { useState, useRef } from 'react';
import { Mail, X, CheckCircle2, Paperclip, Trash2, Loader2 } from 'lucide-react';

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
 * @param {{ subject: string, body?: string, file?: File, htmlTemplate?: string, fields?: Array }} draft - contenido inicial editable.
 *   Si trae `htmlTemplate` (HTML con tokens {{TOKEN}}), el modal muestra `fields` en vez del textarea de
 *   mensaje y arma el HTML final reemplazando los tokens antes de enviar.
 * @param {string} title - título del modal (ej. "Bienvenida", "Enviar Factura")
 * @param {React.ComponentType} icon - ícono del header (default Mail)
 * @param {(payload: object) => Promise} onSend - función que efectivamente envía el correo
 * @param {() => void} onClose
 */
export default function EmailModal({ proyecto, draft, title = 'Enviar correo', icon: TitleIcon = Mail, onSend, onClose }) {
    const isHtmlMode = !!draft?.htmlTemplate;
    const [to, setTo]           = useState(proyecto?.email_cliente || '');
    const [subject, setSubject] = useState(draft?.subject || '');
    const [body, setBody]       = useState(draft?.body || '');
    const [fieldValues, setFieldValues] = useState(() => {
        const init = {};
        (draft?.fields || []).forEach(f => { init[f.key] = f.defaultValue || ''; });
        return init;
    });
    const [sending, setSending] = useState(false);
    const [sent, setSent]       = useState(false);
    const [error, setError]     = useState('');
    const [adjuntos, setAdjuntos] = useState(draft?.file ? [draft.file] : []); // [{ file, name }]
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
            const payload = isHtmlMode
                ? {
                    to, subject, attachments,
                    html: Object.entries(fieldValues).reduce(
                        (html, [key, val]) => html.replaceAll(`{{${key}}}`, val || ''),
                        draft.htmlTemplate
                    ),
                }
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex items-center gap-2">
                        <TitleIcon size={16} className="text-violet-400" />
                        <span className="font-semibold text-[14px]">{title}</span>
                        {proyecto && (
                            <span className="text-[12px] text-muted-foreground">— {proyecto?.codigo_interno} {proyecto?.nombre_cliente}</span>
                        )}
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
                            {isHtmlMode ? (
                                <div className="space-y-3">
                                    <p className="text-[11px] text-muted-foreground">Este correo usa una plantilla HTML con diseño. Completa los datos que se insertarán en ella:</p>
                                    {(draft?.fields || []).map(f => (
                                        <div key={f.key}>
                                            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">{f.label}</label>
                                            <input
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
