// ─── Templates de correo por proyecto (Ingresos) ─────────────────────────────
// Bienvenida / Solicitud de usuarios / Finalización / Seguimiento de pago.
//
// Cada generator(project) devuelve un `draft` para EmailModal con:
//   - subject: asunto inicial (editable en el modal)
//   - fields: campos editables con texto predefinido (y `presets` de tono cuando aplica)
//   - render(values): arma el HTML final a partir de los valores actuales del modal
// Todo texto que escribe el usuario pasa por esc()/textToHtml() antes de insertarse.

import { Sparkles, UserPlus, CheckCircle2, Receipt } from 'lucide-react';

// Logos recortados al borde y a ~3.5x del tamaño en que se muestran (720px de ancho), para que
// se vean nítidos en pantallas retina. Los logo_template*.png antiguos traen mucho margen vacío
// (600x400) y el logo real quedaba chico y con trazos finos.
const LOGO_WHITE_URL = 'https://nativecode-finance.agendaclinicas.cl/email-logo-blanco.png'; // sobre fondos oscuros
const LOGO_BLACK_URL = 'https://nativecode-finance.agendaclinicas.cl/email-logo-negro.png'; // sobre fondos claros
const ACADEMIA_AGENDA_CLINICA_URL = 'https://academia.agendaclinicas.cl/dashboard';
const LOGO_MERCADOPAGO_URL = 'https://nativecode-finance.agendaclinicas.cl/logomp1.png'; // sello Mercado Pago/Visa/Mastercard/RedCompra, fondo oscuro propio
const SOPORTE_EMAIL = 'ingenieria.software@nativecode.cl';
const SOPORTE_FONO = '+56 9 6609 1038';

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const textToHtml = (s) => esc(s).replace(/\n/g, '<br>');

// Párrafos separados por línea en blanco → un <p> por bloque.
function paragraphsHtml(text, style) {
    return String(text || '')
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p style="${style}">${textToHtml(p)}</p>`)
        .join('');
}

// Una línea = un ítem (se ignoran viñetas que el usuario haya escrito a mano).
function linesOf(text) {
    return String(text || '')
        .split('\n')
        .map((l) => l.replace(/^\s*(?:[-•*✓]|\d+[.)])\s*/, '').trim())
        .filter(Boolean);
}

// Acepta "midominio.cl" y le agrega https://; descarta cualquier otro esquema (javascript:, etc).
function normalizeUrl(u) {
    const s = String(u || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) return esc(s);
    if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(s)) return esc(`https://${s}`);
    return '';
}

// "Hola Juan," — o solo "Hola," si el nombre quedó vacío.
function saludo(nombre, fallback = '') {
    const n = esc(String(nombre || '').trim());
    return n ? `Hola ${n},` : (fallback || 'Hola,');
}

const isAgendaClinica = (project) => /agenda|cl[ií]nica/i.test(`${project?.nombre || ''} ${project?.url_front || ''}`);

function mailtoHref(to, subject, body) {
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ─── Shell "Apple card" (fondo gris claro, tarjeta blanca, logo negro) ─────────
// Mismo look que control-back/services/emailHtmlBuilder.js, armado con tablas
// porque Gmail ignora display:flex.

const divider = (pad = '0 48px') => `<tr><td style="padding:${pad};">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="border-top:1px solid #e5e5ea;"></td></tr></table>
        </td></tr>`;

function appleCardHtml({ title, bodyHtml, afterBodyHtml = '', footnoteHtml }) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#f2f2f7;font-family:${FONT};">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f2f2f7;padding:44px 16px 56px;">
    <tr><td align="center">

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;
                    box-shadow:0 1px 4px rgba(0,0,0,.06),0 6px 24px rgba(0,0,0,.07);overflow:hidden;">

        <tr>
          <td style="padding:36px 48px 24px;">
            <img src="${LOGO_BLACK_URL}" alt="NativeCode" width="170" style="display:block;max-width:170px;height:auto;margin:0 0 28px;">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#1d1d1f;letter-spacing:-.4px;line-height:1.3;">${title}</h1>
          </td>
        </tr>

        ${divider()}

        <tr>
          <td style="padding:28px 48px 8px;">
            ${bodyHtml}
          </td>
        </tr>

        ${afterBodyHtml}

        ${divider('16px 48px 0')}

        <tr>
          <td style="padding:22px 48px 30px;">
            ${footnoteHtml}
          </td>
        </tr>

        <tr>
          <td style="background:#f9f9fb;border-top:1px solid #e5e5ea;padding:18px 48px;">
            <p style="margin:0;font-size:11.5px;color:#aeaeb2;text-align:center;letter-spacing:.01em;">
              NativeCode SPA · Santiago de Chile &nbsp;·&nbsp; © ${new Date().getFullYear()}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

const P_CARD = 'margin:0 0 18px;font-size:14.5px;line-height:1.85;color:#3a3a3c;';

const contactoFootnote = (prefix) => `<p style="margin:0;font-size:13px;color:#6e6e73;line-height:1.7;">
              ${prefix} <a href="mailto:${SOPORTE_EMAIL}" style="color:#1d1d1f;font-weight:500;text-decoration:none;">${SOPORTE_EMAIL}</a> o al ${SOPORTE_FONO}.
            </p>`;

// ─── 1. Bienvenida ────────────────────────────────────────────────────────────
// Tono: cálido y cercano, sin perder la formalidad de una primera comunicación.

const BIENVENIDA_INTRO_GENERAL = `Queremos darte una cálida bienvenida y agradecerte la confianza que depositas en nuestro equipo para acompañarte en este proyecto.

Desde hoy cuentas con un equipo dedicado a trabajar contigo con cercanía y profesionalismo, para convertir tus objetivos en una solución digital que genere valor real para tu organización.

Esperamos construir contigo una relación sólida y duradera, y que este sea el primero de muchos logros que alcancemos juntos.`;

const BIENVENIDA_INTRO_AGENDA = `Queremos darte una cálida bienvenida y agradecerte la confianza que depositas en nuestro equipo para implementar tu plataforma de Agenda Clínica.

Desde hoy cuentas con un equipo dedicado a acompañarte con cercanía y profesionalismo, para que tu centro simplifique su gestión, ordene su agenda y entregue una mejor experiencia a sus pacientes.

Esperamos construir contigo una relación sólida y duradera, y que este sea el primero de muchos logros que alcancemos juntos.`;

const BIENVENIDA_INTRO_MEDIDA = `Queremos darte una cálida bienvenida y agradecerte la confianza que depositas en nuestro equipo para desarrollar tu proyecto.

Desde hoy cuentas con un equipo dedicado a acompañarte con cercanía y profesionalismo, transformando tus ideas en una solución digital que genere valor real para tu organización.

Esperamos construir contigo una relación sólida y duradera, y que este sea el primero de muchos logros que alcancemos juntos.`;

const BIENVENIDA_PASOS = `Te contactaremos para coordinar una reunión de inicio.
Revisaremos juntos los requerimientos y la información necesaria para comenzar.
Configuraremos tu plataforma y te mantendremos al tanto de cada avance.`;

const BENEFICIOS = [
    'Atención cercana y personalizada.',
    'Soluciones diseñadas según tus necesidades.',
    'Mejora continua y evolución constante.',
    'Compromiso con la calidad en cada detalle.',
    'Acompañamiento durante todo el proceso.',
];

function renderBienvenida(v) {
    const pText = `margin:0 0 22px;color:#475569;font-size:16.5px;line-height:30px;font-family:${FONT};`;
    const beneficios = BENEFICIOS.map((b) => `
                <tr>
                    <td style="width:34px;vertical-align:top;padding:0 0 14px;">
                        <div style="width:22px;height:22px;border-radius:50%;background:#ede9fe;color:#6d28d9;font-size:12px;font-weight:700;line-height:22px;text-align:center;">✓</div>
                    </td>
                    <td style="vertical-align:top;padding:1px 0 14px;color:#334155;font-size:15.5px;line-height:22px;">${esc(b)}</td>
                </tr>`).join('');

    const pasos = linesOf(v.PROXIMOS_PASOS);
    const pasosHtml = pasos.length ? `
            <p style="margin:44px 0 20px;color:#0F172A;font-size:20px;font-weight:700;">Próximos pasos</p>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                ${pasos.map((p, i) => `
                <tr>
                    <td style="width:42px;vertical-align:top;padding:0 0 18px;">
                        <div style="width:28px;height:28px;border-radius:50%;background:#0f172a;color:#ffffff;font-size:13px;font-weight:700;line-height:28px;text-align:center;">${i + 1}</div>
                    </td>
                    <td style="vertical-align:top;padding:3px 0 18px;color:#334155;font-size:15.5px;line-height:24px;">${esc(p)}</td>
                </tr>`).join('')}
            </table>` : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>Bienvenido a NativeCode</title>
<style>
@media(max-width:640px){.hero{padding:56px 28px !important;}.content{padding:40px 28px !important;}.title{font-size:34px !important;}.subtitle{font-size:17px !important;line-height:28px !important;}}
</style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:${FONT};">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;width:100%;">
    <tr><td class="hero" style="background:#0b1120;background:linear-gradient(180deg,#030712 0%,#0f172a 100%);border-radius:24px 24px 0 0;padding:72px 50px;text-align:center;">
        <img src="${LOGO_WHITE_URL}" alt="NativeCode" width="200" style="display:block;width:200px;max-width:200px;height:auto;margin:0 auto 44px;">
        <span style="display:inline-block;padding:9px 18px;border:1px solid rgba(255,255,255,.14);border-radius:50px;color:#94A3B8;font-size:11.5px;letter-spacing:2px;text-transform:uppercase;">Bienvenido a NativeCode</span>
        <h1 class="title" style="margin:32px 0 0;color:#FFFFFF;font-size:44px;font-weight:700;line-height:1.12;letter-spacing:-.5px;">Nos alegra tenerte con nosotros.</h1>
        <p class="subtitle" style="max-width:520px;margin:24px auto 0;color:#CBD5E1;font-size:19px;line-height:31px;font-weight:300;">Gracias por confiar en NativeCode para acompañarte en la evolución tecnológica de tu organización.</p>
    </td></tr>
    <tr><td class="content" style="background:#FFFFFF;padding:56px 56px 52px;">
        <p style="margin:0 0 26px;color:#0F172A;font-size:21px;font-weight:600;">${saludo(v.NOMBRE, 'Hola y bienvenido,')}</p>
        ${paragraphsHtml(v.INTRO, pText)}
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:18px;margin:36px 0 0;">
            <tr><td style="padding:30px 30px 18px;">
                <p style="margin:0 0 22px;color:#0F172A;font-size:18px;font-weight:700;">Lo que encontrarás en NativeCode</p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${beneficios}
                </table>
            </td></tr>
        </table>
        ${pasosHtml}
        <div style="margin-top:44px;padding-top:36px;border-top:1px solid #E2E8F0;text-align:center;">
            <p style="margin:0 0 10px;color:#0F172A;font-size:24px;font-weight:700;letter-spacing:-.3px;">Este es solo el comienzo.</p>
            <p style="margin:0;color:#64748B;font-size:16.5px;line-height:28px;">Bienvenido a la experiencia NativeCode.</p>
        </div>
    </td></tr>
    <tr><td style="background:#0F172A;border-radius:0 0 24px 24px;padding:44px 40px;text-align:center;">
        <img src="${LOGO_WHITE_URL}" alt="NativeCode" width="150" style="display:block;width:150px;max-width:150px;height:auto;margin:0 auto;">
        <p style="margin:22px 0 0;color:#94A3B8;font-size:14px;line-height:24px;">
            Ingeniería de Software · Soluciones de alto valor empresarial<br><br>
            Soporte: <a href="mailto:${SOPORTE_EMAIL}" style="color:#E2E8F0;text-decoration:none;">${SOPORTE_EMAIL}</a><br>
            ${SOPORTE_FONO}
        </p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

const templateBienvenida = (project) => {
    const agenda = isAgendaClinica(project);
    return {
        subject: 'Bienvenido a NativeCode',
        render: renderBienvenida,
        fields: [
            { key: 'NOMBRE', label: 'Nombre del cliente', defaultValue: project?.nombre_cliente || '' },
            {
                key: 'INTRO',
                type: 'textarea',
                rows: 8,
                label: 'Mensaje de bienvenida',
                hint: 'Deja una línea en blanco para separar párrafos.',
                defaultValue: agenda ? BIENVENIDA_INTRO_AGENDA : BIENVENIDA_INTRO_GENERAL,
                presets: [
                    { label: 'General', value: BIENVENIDA_INTRO_GENERAL },
                    { label: 'Software a medida', value: BIENVENIDA_INTRO_MEDIDA },
                    { label: 'Agenda Clínica', value: BIENVENIDA_INTRO_AGENDA },
                ],
            },
            {
                key: 'PROXIMOS_PASOS',
                type: 'textarea',
                rows: 4,
                label: 'Próximos pasos',
                hint: 'Un paso por línea. Déjalo vacío para ocultar la sección.',
                defaultValue: BIENVENIDA_PASOS,
            },
        ],
    };
};

// ─── 2. Solicitud de usuarios ─────────────────────────────────────────────────
// Tono: cordial y claro — es una solicitud operativa, se busca que sea fácil de responder.
// Texto genérico (sirve para cualquier proyecto). El preset "Agenda Clínica" pide lo mismo
// que el formulario "Nuevo Profesional", así lo que envía el cliente se carga directo.

const USUARIOS_MENSAJE = `Estamos preparando tu plataforma y queremos dejar las cuentas de tu equipo creadas y listas para usar.

Para avanzar, te pedimos que nos compartas los siguientes datos por cada persona que necesite ingresar al sistema:`;

// Formato: "Campo | ejemplo" — el ejemplo es opcional.
const USUARIOS_DATOS_GENERAL = `Nombre completo | María González
Email | maria.gonzalez@empresa.cl
Teléfono | +56 9 1234 5678
RUT | 12.345.678-9
Cargo / Rol | Administradora`;

const USUARIOS_DATOS_AGENDA = `Nombre completo | Dr. María González
Email | dra.gonzalez@clinica.cl
Teléfono | +56 9 1234 5678
RUT | 12.345.678-9
Profesión / Especialidad | Cirujano dentista`;

const USUARIOS_CIERRE = `Todos los datos son necesarios para crear cada cuenta. Si son varias personas, repite la ficha por cada una; así evitamos confusiones al configurar sus accesos.

Apenas recibamos la información, comenzaremos con la configuración y te avisaremos cuando las cuentas estén listas. ¡Muchas gracias por tu colaboración!`;

function parseDatos(text) {
    return linesOf(text).map((l) => {
        const [campo, ...resto] = l.split('|');
        return { campo: campo.trim(), ejemplo: resto.join('|').trim() };
    }).filter((d) => d.campo);
}

function renderSolicitudUsuarios(project) {
    return (v) => {
        const datos = parseDatos(v.DATOS);

        // Ficha tipo formulario: etiqueta + ejemplo, una fila por dato.
        const fichaHtml = datos.length ? `
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fafafa;border:1px solid #e5e5ea;border-radius:14px;margin:4px 0 26px;">
              <tr><td style="padding:22px 24px 8px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8e8e93;">Ficha por usuario</p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  ${datos.map((d, i) => `<tr>
                    <td style="padding:13px 0;${i ? 'border-top:1px solid #ececf0;' : ''}vertical-align:top;">
                      <p style="margin:0;font-size:14px;line-height:20px;color:#1d1d1f;font-weight:600;">${esc(d.campo)}<span style="color:#8b5cf6;"> *</span></p>
                      ${d.ejemplo ? `<p style="margin:3px 0 0;font-size:13px;line-height:19px;color:#8e8e93;">Ej: ${esc(d.ejemplo)}</p>` : ''}
                    </td>
                  </tr>`).join('')}
                </table>
              </td></tr>
            </table>` : '';

        const fichaTexto = datos.map((d) => `- ${d.campo}:`).join('\n');
        const plantillaRespuesta = `Hola equipo NativeCode,

Les envío los datos de los usuarios para ${project?.nombre || 'la plataforma'}:

Usuario 1
${fichaTexto}

Usuario 2
${fichaTexto}

Saludos,`;

        const boton = `<tr><td style="padding:10px 48px 0;text-align:center;">
                <a href="${esc(mailtoHref(SOPORTE_EMAIL, `Usuarios — ${project?.nombre || 'Plataforma'}`, plantillaRespuesta))}" style="display:inline-block;background:#000000;color:#ffffff !important;text-decoration:none;padding:15px 30px;border-radius:10px;font-weight:600;font-size:14.5px;letter-spacing:.01em;">Enviar datos de usuarios</a>
                <p style="margin:12px 0 0;font-size:11.5px;color:#8e8e93;">Se abrirá un correo con la ficha lista para completar.</p>
              </td></tr>`;

        return appleCardHtml({
            title: saludo(v.NOMBRE),
            bodyHtml: paragraphsHtml(v.MENSAJE, P_CARD) + fichaHtml + paragraphsHtml(v.CIERRE, P_CARD),
            afterBodyHtml: boton,
            footnoteHtml: contactoFootnote('También puedes enviarnos la información o hacernos cualquier consulta en'),
        });
    };
}

const templateSolicitudUsuarios = (project) => ({
    subject: `Configuración de accesos — ${project?.nombre || 'tu proyecto'}`,
    render: renderSolicitudUsuarios(project),
    fields: [
        { key: 'NOMBRE', label: 'Nombre del cliente', defaultValue: project?.nombre_cliente || '' },
        { key: 'MENSAJE', type: 'textarea', rows: 5, label: 'Mensaje inicial', hint: 'Deja una línea en blanco para separar párrafos.', defaultValue: USUARIOS_MENSAJE },
        {
            key: 'DATOS',
            type: 'textarea',
            rows: 5,
            label: 'Datos requeridos por usuario',
            hint: 'Un dato por línea con el formato "Campo | ejemplo". Se usan también en el botón de respuesta.',
            defaultValue: isAgendaClinica(project) ? USUARIOS_DATOS_AGENDA : USUARIOS_DATOS_GENERAL,
            presets: [
                { label: 'General', value: USUARIOS_DATOS_GENERAL },
                { label: 'Agenda Clínica (profesionales)', value: USUARIOS_DATOS_AGENDA },
            ],
        },
        { key: 'CIERRE', type: 'textarea', rows: 4, label: 'Mensaje de cierre', defaultValue: USUARIOS_CIERRE },
    ],
});

// ─── 3. Finalización ──────────────────────────────────────────────────────────
// Tono: celebratorio y profesional — se entrega el producto y se deja la puerta abierta al soporte.

const FINALIZACION_MENSAJE = `Nos complace informarte que la implementación de tu plataforma ha sido completada exitosamente.

A partir de este momento ya puedes acceder a tu entorno de trabajo y comenzar a utilizar todas las funcionalidades disponibles. Te dejamos a continuación tus accesos y credenciales.`;

const FINALIZACION_CIERRE = 'Estamos comprometidos con acompañarte en cada etapa y ayudarte a obtener el máximo valor de tu solución tecnológica. Si necesitas cualquier ajuste o tienes dudas en tus primeros días de uso, cuenta con nosotros.';

const BTN_GRAD = 'display:inline-block;background:#6d28d9;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#ffffff !important;text-decoration:none;padding:14px 26px;border-radius:12px;font-weight:700;font-size:15px;';

function accessCardHtml({ title, desc, url, cta }) {
    return `
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:18px;margin-bottom:18px;">
            <tr><td style="padding:26px 28px;">
                <p style="margin:0;font-size:19px;font-weight:700;color:#0f172a;">${esc(title)}</p>
                <p style="margin:8px 0 20px;color:#64748b;font-size:15px;line-height:25px;">${esc(desc)}</p>
                <a href="${url}" style="${BTN_GRAD}">${esc(cta)}</a>
            </td></tr>
        </table>`;
}

function credencialRowHtml({ nombre, usuario, password }) {
    return `
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;margin-top:14px;">
            <tr><td style="padding:18px 22px;">
                <p style="margin:0 0 14px;font-size:15px;font-weight:700;color:#0f172a;">${esc(nombre) || '—'}</p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                        <td style="width:50%;vertical-align:top;padding-right:10px;">
                            <p style="margin:0 0 4px;font-size:11.5px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Usuario</p>
                            <p style="margin:0;font-weight:600;color:#0f172a;word-break:break-all;font-size:14.5px;">${esc(usuario)}</p>
                        </td>
                        <td style="width:50%;vertical-align:top;">
                            <p style="margin:0 0 4px;font-size:11.5px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Contraseña</p>
                            <p style="margin:0;font-family:Menlo,Consolas,monospace;font-weight:600;color:#0f172a;word-break:break-all;font-size:14.5px;">${esc(password)}</p>
                        </td>
                    </tr>
                </table>
            </td></tr>
        </table>`;
}

function renderFinalizacion(v) {
    const pText = 'margin:0 0 22px;font-size:16.5px;line-height:30px;color:#475569;';
    const urlWeb = normalizeUrl(v.URL_WEB);
    const urlPanel = normalizeUrl(v.URL_PANEL);
    const urlRecursos = normalizeUrl(v.RECURSOS_URL);
    const creds = (Array.isArray(v.CREDENCIALES) ? v.CREDENCIALES : []).filter((c) => c.nombre || c.usuario || c.password);

    const accesos = (urlWeb || urlPanel) ? `
        <p style="margin:44px 0 22px;font-size:24px;font-weight:700;color:#0f172a;">Accesos</p>
        ${urlWeb ? accessCardHtml({ title: v.NOMBRE_SITIO || 'Tu sitio web', desc: 'Acceso público a tu plataforma.', url: urlWeb, cta: 'Abrir sitio web' }) : ''}
        ${urlPanel ? accessCardHtml({ title: 'Panel de administración', desc: 'Gestión completa de usuarios, contenidos y configuración.', url: urlPanel, cta: 'Ingresar al panel' }) : ''}` : '';

    const credenciales = creds.length ? `
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border-radius:18px;margin-top:30px;">
            <tr><td style="padding:28px;">
                <p style="margin:0;font-size:19px;font-weight:700;color:#0f172a;">Credenciales de acceso</p>
                <p style="margin:10px 0 4px;color:#475569;font-size:15px;line-height:25px;">Por seguridad, te recomendamos cambiar la contraseña después del primer ingreso y no compartir estos datos.</p>
                ${creds.map(credencialRowHtml).join('')}
            </td></tr>
        </table>` : '';

    const recursos = urlRecursos ? `
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0f172a;border-radius:18px;margin-top:36px;">
            <tr><td style="padding:32px 30px;text-align:center;">
                <p style="margin:0;color:#ffffff;font-size:19px;font-weight:700;">${esc(v.RECURSOS_TITULO) || 'Material de apoyo'}</p>
                ${paragraphsHtml(v.RECURSOS_TEXTO, 'margin:12px 0 0;color:#cbd5e1;font-size:15px;line-height:26px;')}
                <p style="margin:22px 0 0;"><a href="${urlRecursos}" style="${BTN_GRAD}">${esc(v.RECURSOS_BOTON) || 'Ver material de apoyo'}</a></p>
            </td></tr>
        </table>` : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>Tu plataforma está lista</title>
<style>
@media(max-width:640px){.hero{padding:52px 28px !important;}.hero-title{font-size:34px !important;}.content{padding:36px 26px !important;}}
</style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:${FONT};">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;width:100%;">
    <tr><td class="hero" style="background:#0b1023;background:linear-gradient(135deg,#050816 0%,#0b1023 50%,#140a2f 100%);padding:68px 50px;border-radius:24px 24px 0 0;text-align:center;">
        <img src="${LOGO_WHITE_URL}" alt="NativeCode" width="190" style="display:block;width:190px;max-width:190px;height:auto;margin:0 auto 40px;">
        <h1 class="hero-title" style="margin:0 0 18px;color:#ffffff;font-size:44px;line-height:1.12;letter-spacing:-.5px;">Tu plataforma está lista.</h1>
        <p style="max-width:520px;margin:0 auto;color:#cbd5e1;font-size:18.5px;line-height:30px;font-weight:300;">Todo ha sido configurado correctamente y ya puedes comenzar a utilizar tu nueva solución digital.</p>
    </td></tr>
    <tr><td class="content" style="background:#ffffff;padding:56px;">
        <p style="margin:0 0 24px;font-size:21px;font-weight:600;color:#0f172a;">${saludo(v.NOMBRE)}</p>
        ${paragraphsHtml(v.MENSAJE, pText)}
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;margin-top:14px;">
            <tr><td style="padding:26px 28px;">
                <span style="display:inline-block;background:#dcfce7;color:#15803d;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;">● Plataforma operativa</span>
                <p style="margin:14px 0 6px;font-size:18px;font-weight:700;color:#0f172a;">Todo preparado para comenzar</p>
                <p style="margin:0;color:#64748b;font-size:15px;line-height:25px;">Tu entorno se encuentra activo, configurado y listo para su utilización.</p>
            </td></tr>
        </table>
        ${accesos}
        ${credenciales}
        ${recursos}
        <div style="margin-top:48px;padding-top:36px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0 0 14px;color:#0f172a;font-size:22px;font-weight:700;">Gracias por confiar en NativeCode.</p>
            ${paragraphsHtml(v.CIERRE, 'margin:0 auto 14px;max-width:520px;font-size:15.5px;line-height:27px;color:#475569;')}
            <p style="margin:24px 0 0;font-size:20px;font-weight:700;color:#7c3aed;">Este es solo el comienzo.</p>
        </div>
    </td></tr>
    <tr><td style="background:#0b1023;padding:44px 40px;text-align:center;border-radius:0 0 24px 24px;">
        <img src="${LOGO_WHITE_URL}" alt="NativeCode" width="150" style="display:block;width:150px;max-width:150px;height:auto;margin:0 auto 22px;">
        <p style="margin:0 0 6px;color:#ffffff;font-size:16px;font-weight:700;">Soporte NativeCode</p>
        <p style="margin:0;color:#94a3b8;font-size:14px;line-height:25px;">
            Si necesitas ayuda o tienes cualquier consulta, nuestro equipo estará disponible para asistirte.<br><br>
            <a href="mailto:${SOPORTE_EMAIL}" style="color:#ffffff;text-decoration:none;">${SOPORTE_EMAIL}</a><br>
            ${SOPORTE_FONO} · Respuesta dentro de 24 horas hábiles
        </p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

const templateFinalizacion = (project) => {
    const agenda = isAgendaClinica(project);
    return {
        subject: 'Tu plataforma está lista',
        render: renderFinalizacion,
        fields: [
            { key: 'NOMBRE',       label: 'Nombre del cliente', defaultValue: project?.nombre_cliente || '' },
            { key: 'MENSAJE',      type: 'textarea', rows: 5, label: 'Mensaje principal', hint: 'Deja una línea en blanco para separar párrafos.', defaultValue: FINALIZACION_MENSAJE },
            { key: 'NOMBRE_SITIO', label: 'Título de la tarjeta del sitio web', defaultValue: agenda ? 'Tu sitio web Agenda Clínica' : 'Tu sitio web' },
            { key: 'URL_WEB',      label: 'URL del sitio web (vacío = se oculta)', defaultValue: project?.url_front || '', placeholder: 'https://...' },
            { key: 'URL_PANEL',    label: 'URL del panel de administración (vacío = se oculta)', defaultValue: '', placeholder: 'https://...' },
            { key: 'CREDENCIALES', type: 'credentials-list', label: 'Credenciales de acceso (usuario + contraseña)' },
            { key: 'RECURSOS_URL',    label: 'Material de apoyo — URL (vacío = se oculta el bloque)', defaultValue: agenda ? ACADEMIA_AGENDA_CLINICA_URL : '', placeholder: 'https://...' },
            { key: 'RECURSOS_TITULO', label: 'Material de apoyo — título', defaultValue: agenda ? 'Academia Agenda Clínica' : 'Centro de ayuda' },
            { key: 'RECURSOS_TEXTO',  type: 'textarea', rows: 2, label: 'Material de apoyo — descripción', defaultValue: 'Tutoriales, documentación y material de apoyo para sacar el máximo provecho de tu plataforma desde el primer día.' },
            { key: 'RECURSOS_BOTON',  label: 'Material de apoyo — texto del botón', defaultValue: agenda ? 'Ir a la Academia' : 'Ver material de apoyo' },
            { key: 'CIERRE',       type: 'textarea', rows: 3, label: 'Mensaje de cierre', defaultValue: FINALIZACION_CIERRE },
        ],
    };
};

// ─── 4. Seguimiento de pago ──────────────────────────────────────────────────
// Copiado tal cual desde Ingresos.jsx (funciona en producción — no modificar el diseño).

// ─── Seguimiento de pago — adjunta .ics del vencimiento y, si el proyecto tiene ─
// ─── link de cobro Mercado Pago, permite incluir un botón "Pagar ahora" ────────

// Igual que fmtDate: se extraen los componentes de fecha directo del string para
// no correr un día por conversión UTC/local (Chile es UTC-3/-4).
function icsDateParts(fecha) {
    const s = typeof fecha === 'string' ? fecha : new Date(fecha).toISOString();
    const [y, m, d] = s.slice(0, 10).split('-').map(Number);
    return { y, m, d };
}

function icsAddDay({ y, m, d }) {
    const dt = new Date(y, m - 1, d + 1);
    return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
}

function icsFold(line) {
    if (line.length <= 75) return line;
    const partes = [];
    let resto = line;
    while (resto.length > 75) {
        partes.push(resto.slice(0, 75));
        resto = ' ' + resto.slice(75);
    }
    partes.push(resto);
    return partes.join('\r\n');
}

// Genera el .ics a partir de los valores ACTUALES del modal (no de la fecha original
// del proyecto), así si el usuario corrige la fecha con el selector de calendario,
// el recordatorio adjunto queda consistente con lo que ve en el correo.
function buildPaymentIcsAttachment(project) {
    return (fieldValues) => {
        const fecha = fieldValues?.FECHA_PAGO;
        if (!fecha) return null;

        const fmt = ({ y, m, d }) => `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`;
        const inicio = icsDateParts(fecha);
        const fin = icsAddDay(inicio);

        const now = new Date();
        const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}T${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}Z`;
        const esc = (t) => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');

        const lineas = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//NativeCode//ES',
            'NAME:NativeCode',
            'X-WR-CALNAME:NativeCode',
            'BEGIN:VEVENT',
            `UID:pago-${project?.id}-${fmt(inicio)}@nativecode.cl`,
            `DTSTAMP:${stamp}`,
            `DTSTART;VALUE=DATE:${fmt(inicio)}`,
            `DTEND;VALUE=DATE:${fmt(fin)}`,
            `SUMMARY:${esc(`Vencimiento de pago - ${project?.nombre || 'Proyecto'}`)}`,
            `DESCRIPTION:${esc(`Pago de ${fieldValues.MONTO || ''} para ${fieldValues.NOMBRE || 'Cliente'}.`)}`,
            'END:VEVENT',
            'END:VCALENDAR',
        ];

        return new File([lineas.map(icsFold).join('\r\n')], 'recordatorio-pago.ics', { type: 'text/calendar' });
    };
}

// Misma "tarjeta Apple" (tablas, logo negro, líneas divisorias) que
// usa el correo de Solicitud de Usuarios (ver control-back/services/emailHtmlBuilder.js).
// Se reconstruye acá con tablas en vez de flexbox/CSS-classes porque Gmail ignora
// display:flex y dejaba "Monto" y el valor pegados sin espacio.
const TEMPLATE_SEGUIMIENTO_PAGO_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#f2f2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f2f2f7;padding:44px 16px 56px;">
    <tr><td align="center">

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;
                    box-shadow:0 1px 4px rgba(0,0,0,.06),0 6px 24px rgba(0,0,0,.07);overflow:hidden;">

        <!-- Header / marca -->
        <tr>
          <td style="padding:36px 48px 24px;">
            <img src="${LOGO_BLACK_URL}" alt="NativeCode" width="170" style="display:block;max-width:170px;height:auto;margin:0 0 28px;">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#1d1d1f;letter-spacing:-.4px;line-height:1.3;">Hola {{NOMBRE}},</h1>
          </td>
        </tr>

        <tr><td style="padding:0 48px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="border-top:1px solid #e5e5ea;"></td></tr></table>
        </td></tr>

        <!-- Cuerpo -->
        <tr>
          <td style="padding:28px 48px 8px;">
            <p style="margin:0 0 24px;font-size:14.5px;line-height:1.85;color:#3a3a3c;">{{MENSAJE}}</p>

            <!-- Tarjeta de monto — estilo "precio destacado" -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fafafa;border:1px solid #e5e5ea;border-radius:14px;">
              <tr>
                <td style="padding:30px 28px 26px;text-align:center;">
                  <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8e8e93;">MONTO A PAGAR</p>
                  <p style="margin:0;font-size:36px;font-weight:800;color:#1d1d1f;letter-spacing:-.02em;">{{MONTO}}</p>
                  <p style="margin:12px 0 0;font-size:13px;color:#6e6e73;">Vence el {{FECHA_PAGO}}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        {{BOTON_PAGO}}

        <tr><td style="padding:16px 48px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="border-top:1px solid #e5e5ea;"></td></tr></table>
        </td></tr>

        <!-- Contacto -->
        <tr>
          <td style="padding:22px 48px 30px;">
            <p style="margin:0;font-size:13px;color:#6e6e73;line-height:1.7;">
              Si ya realizaste el pago, puedes ignorar este mensaje. Ante cualquier duda, contáctanos en
              <a href="mailto:ingenieria.software@nativecode.cl" style="color:#1d1d1f;font-weight:500;text-decoration:none;">ingenieria.software@nativecode.cl</a>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9fb;border-top:1px solid #e5e5ea;padding:18px 48px;">
            <p style="margin:0;font-size:11.5px;color:#aeaeb2;text-align:center;letter-spacing:.01em;">
              NativeCode SPA · Santiago de Chile &nbsp;·&nbsp; © ${new Date().getFullYear()}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;

const templateSeguimientoPago = (project) => ({
    subject: `Recordatorio de pago — ${project?.nombre || 'tu proyecto'}`,
    htmlTemplate: TEMPLATE_SEGUIMIENTO_PAGO_HTML,
    buildAttachment: buildPaymentIcsAttachment(project),
    warning: (fieldValues) => !fieldValues?.FECHA_PAGO
        ? 'Este proyecto no tiene fecha de próximo pago configurada — elige una fecha abajo para poder adjuntar el recordatorio de calendario (.ics).'
        : null,
    fields: [
        { key: 'NOMBRE', label: 'Nombre del cliente', defaultValue: project?.nombre_cliente || '' },
        {
            key: 'MENSAJE',
            type: 'textarea',
            label: 'Mensaje',
            defaultValue: 'Te escribimos para hacer seguimiento de tu próximo pago. Revisa el detalle a continuación y no dudes en escribirnos si tienes alguna consulta.',
            buildHtml: (val) => String(val || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'),
        },
        { key: 'MONTO', label: 'Monto', defaultValue: project?.monto_acordado ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(project.monto_acordado) : '' },
        {
            key: 'FECHA_PAGO',
            type: 'date',
            label: 'Fecha de pago',
            defaultValue: project?.fecha_proximo_pago ? project.fecha_proximo_pago.slice(0, 10) : '',
            buildHtml: (val) => val ? val.split('-').reverse().join('/') : '',
        },
        {
            key: 'BOTON_PAGO',
            label: 'Link de pago (Mercado Pago) — opcional, no todos los proyectos lo tienen',
            defaultValue: project?.url_cobro_mercadopago || '',
            placeholder: 'https://...',
            // El sello logomp1.png es la placa completa (Mercado Pago + Visa + Mastercard +
            // RedCompra, con fondo oscuro propio) — no cabe integrado al botón, así que va
            // aparte, debajo, como sello de confianza independiente.
            buildHtml: (url) => url
                ? `<tr><td style="padding:26px 48px 0;text-align:center;">
                <a href="${url}" style="display:inline-block;background:#000000;color:#ffffff !important;text-decoration:none;padding:15px 34px;border-radius:10px;font-weight:600;font-size:14.5px;letter-spacing:.01em;">Pagar con Mercado Pago</a>
                <p style="margin:14px 0 0;font-size:11.5px;color:#8e8e93;">Pago seguro procesado por Mercado Pago</p>
                <img src="${LOGO_MERCADOPAGO_URL}" alt="Mercado Pago · Visa · Mastercard · RedCompra" width="220" style="display:block;max-width:220px;height:auto;margin:18px auto 0;border-radius:8px;">
              </td></tr>`
                : '',
        },
    ],
});

export const EMAIL_TEMPLATES = {
    bienvenida:      { title: 'Bienvenida',            icon: Sparkles,     generator: templateBienvenida },
    usuarios:        { title: 'Solicitud de Usuarios', icon: UserPlus,     generator: templateSolicitudUsuarios },
    finalizacion:    { title: 'Finalización',          icon: CheckCircle2, generator: templateFinalizacion },
    seguimientoPago: { title: 'Seguimiento de Pago',   icon: Receipt,      generator: templateSeguimientoPago },
};
