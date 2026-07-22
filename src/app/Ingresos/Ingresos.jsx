'use client';

import { useState, useEffect } from 'react';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useRealtime } from '../../hooks/useRealtime';
import * as projectsService from '../../services/projectsService';
import * as configService from '../../services/configService';
import {
    Plus,
    Briefcase,
    DollarSign,
    MoreHorizontal,
    Search,
    Filter,
    Trash2,
    Calendar,
    User,
    ChevronDown,
    ChevronUp,
    Receipt,
    Pencil,
    X,
    Repeat,
    Mail,
    ExternalLink,
    CheckCircle2,
    FileText,
    LayoutGrid,
    List,
    Loader2,
    Sparkles,
    UserPlus
} from 'lucide-react';
import { cn, normalizeRut } from '../../lib/utils';
import { Input, Select } from '../../components/ui/FormElements';
import { generateDtePreview, computeDteTotals as computeDteTotalsShared } from '../../lib/dtePdfGenerator';
import * as dteService from '../../services/dteService';
import EmailModal from '../../components/EmailModal';

// ─── Templates de correo — Bienvenida / Solicitud de usuarios / Finalización ──

const LOGO_WHITE_URL = 'https://nativecode-finance.agendaclinicas.cl/logo_template.png'; // sobre fondos oscuros
const LOGO_BLACK_URL = 'https://nativecode-finance.agendaclinicas.cl/logo_template_negro.png'; // sobre fondos claros
const ACADEMIA_AGENDA_CLINICA_URL = 'https://academia.agendaclinicas.cl/dashboard';

// Genera el HTML de una fila de credencial (usuario + contraseña con toggle de visibilidad
// vía checkbox/CSS — funciona en Apple Mail/Outlook.com/Yahoo; en Gmail el toggle no es
// interactivo por sus restricciones de seguridad y la contraseña queda oculta por defecto).
function credencialRowHtml({ usuario, password }, idx) {
    if (!usuario && !password) return '';
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
        <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-top:15px;">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Usuario</div>
            <div style="font-weight:600;color:#0f172a;margin-bottom:14px;">${esc(usuario)}</div>
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Contraseña</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <input type="checkbox" id="pw-toggle-${idx}" class="pw-check">
                <span class="pw-mask" style="font-family:monospace;letter-spacing:3px;font-weight:600;color:#0f172a;">••••••••</span>
                <span class="pw-real" style="font-family:monospace;font-weight:600;color:#0f172a;">${esc(password)}</span>
                <label for="pw-toggle-${idx}" class="pw-eye" style="cursor:pointer;">👁</label>
            </div>
        </div>`;
}

// Template HTML diseñado (hero oscuro + tarjeta de beneficios + CTA) para el correo de Bienvenida.
// Tokens {{NOMBRE}}, {{LINK_ACCESO}} se reemplazan antes de enviar.
const TEMPLATE_BIENVENIDA_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bienvenido a NativeCode</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
.wrapper{width:100%;padding:40px 20px;}
.container{max-width:700px;margin:0 auto;}
.hero{background:linear-gradient(180deg,rgba(3,7,18,.96) 0%,rgba(15,23,42,.98) 100%);border-radius:28px 28px 0 0;padding:80px 50px;text-align:center;}
.logo{width:180px;display:block;margin:0 auto 50px;}
.badge{display:inline-block;padding:10px 20px;border:1px solid rgba(255,255,255,.12);border-radius:50px;color:#94A3B8;font-size:12px;letter-spacing:2px;text-transform:uppercase;}
.title{color:#FFFFFF;font-size:52px;font-weight:700;line-height:1.1;margin-top:35px;}
.subtitle{max-width:540px;margin:30px auto 0;color:#CBD5E1;font-size:20px;line-height:34px;font-weight:300;}
.content{background:#FFFFFF;padding:60px;}
.greeting{color:#0F172A;font-size:22px;font-weight:600;margin-bottom:30px;}
.text{color:#475569;font-size:17px;line-height:34px;margin-bottom:25px;}
.card{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:20px;padding:35px;margin:50px 0;}
.card-title{color:#0F172A;font-size:22px;font-weight:700;margin-bottom:25px;}
.item{color:#334155;font-size:16px;line-height:32px;margin-bottom:12px;}
.button-container{text-align:center;margin-top:50px;}
.button{display:inline-block;background:#334155;color:#60A5FA;text-decoration:none;padding:18px 38px;border-radius:14px;font-size:15px;font-weight:600;}
.closing{margin-top:50px;text-align:center;}
.closing-title{color:#0F172A;font-size:28px;font-weight:700;margin-bottom:15px;}
.closing-text{color:#64748B;font-size:18px;line-height:32px;}
.footer{background:#0F172A;border-radius:0 0 28px 28px;padding:50px;text-align:center;}
.footer-logo{width:150px;margin:0 auto;}
.footer-text{color:#94A3B8;margin-top:24px;line-height:28px;font-size:15px;}
.footer-text a{color:#94A3B8;text-decoration:none;}
@media(max-width:640px){.hero{padding:60px 30px;}.content{padding:40px 30px;}.title{font-size:38px;}.subtitle{font-size:18px;line-height:30px;}}
</style>
</head>
<body>
<div class="wrapper">
<div class="container">
    <div class="hero">
        <img src="${LOGO_WHITE_URL}" alt="NativeCode" class="logo">
        <div class="badge">Bienvenido a NativeCode</div>
        <h1 class="title">Nos alegra tenerte con nosotros.</h1>
        <p class="subtitle">Gracias por confiar en NativeCode para acompañarte en la evolución tecnológica de tu organización.</p>
    </div>
    <div class="content">
        <div class="greeting">Hola {{NOMBRE}},</div>
        <p class="text">Queremos darte una cálida bienvenida y agradecer la confianza que has depositado en nuestro equipo.</p>
        <p class="text">Sabemos que confiaste en nosotros para implementar tu plataforma de Agenda Clínica, y estamos aquí para acompañarte con cercanía, profesionalismo y soluciones que generen valor real para tu organización.</p>
        <p class="text">Desde hoy cuentas con un equipo enfocado en ayudarte a avanzar con confianza, simplificar procesos y aprovechar al máximo las oportunidades que la tecnología puede ofrecer.</p>
        <div class="card">
            <div class="card-title">Lo que encontrarás en NativeCode</div>
            <div class="item">✓ Atención cercana y personalizada.</div>
            <div class="item">✓ Soluciones diseñadas pensando en tus necesidades.</div>
            <div class="item">✓ Mejora continua y evolución constante.</div>
            <div class="item">✓ Compromiso con la calidad en cada detalle.</div>
            <div class="item">✓ Acompañamiento durante todo el proceso.</div>
        </div>
        <p class="text">Estamos convencidos de que las mejores soluciones nacen de grandes colaboraciones, y esperamos construir una relación sólida y duradera contigo.</p>
        <div class="button-container">
            <a href="{{LINK_ACCESO}}" class="button">Comenzar</a>
        </div>
        <div class="closing">
            <div class="closing-title">Este es solo el comienzo.</div>
            <div class="closing-text">Bienvenido a la experiencia NativeCode.</div>
        </div>
    </div>
    <div class="footer">
        <img src="${LOGO_WHITE_URL}" alt="NativeCode" class="footer-logo">
        <div class="footer-text">
            Ingeniería de Software<br>
            Soluciones de alto valor empresarial<br><br>
            Correo soporte NativeCode:<br>
            <a href="mailto:ingenieria.software@nativecode.cl">ingenieria.software@nativecode.cl</a><br>
            +56 9 6609 1038
        </div>
    </div>
</div>
</div>
</body>
</html>`;

const templateBienvenida = (project) => ({
    subject: 'Bienvenido a NativeCode',
    htmlTemplate: TEMPLATE_BIENVENIDA_HTML,
    fields: [
        { key: 'NOMBRE',       label: 'Nombre del cliente', defaultValue: project?.nombre_cliente || '' },
        { key: 'LINK_ACCESO',  label: 'Link de acceso',     defaultValue: project?.url_front || '', placeholder: 'https://...' },
    ],
});

const templateSolicitudUsuarios = (project) => ({
    subject: `Configuración de accesos — ${project?.nombre || 'tu proyecto'}`,
    body: `Estimado/a ${project?.nombre_cliente || ''},

Para dejar tu plataforma lista y configurar los accesos de tu equipo, necesitamos que nos envíes la siguiente información por cada usuario que necesite ingresar al sistema:

• Nombre completo
• Especialidad (si corresponde)
• Perfil profesional
• Tipo de usuario: Administrador / Secretaria / Recepcionista (elige uno — si no aplica, déjalo en blanco)
• Accesos o módulos que necesita ver dentro de la plataforma

Si son varios profesionales, por favor envía la misma información de forma individual por cada uno de ellos.

Envía esta información respondiendo a ingenieria.software@nativecode.cl y comenzaremos a configurar los accesos.

Saludos cordiales,
Equipo NativeCode`
});

// Template HTML diseñado (hero oscuro + accesos + credenciales) para el correo de Finalización.
// Tokens {{NOMBRE}}, {{URL_WEB}}, {{URL_PANEL}}, {{CREDENCIALES}} se reemplazan antes de enviar.
// {{CREDENCIALES}} se arma en el frontend a partir de una lista de usuario/contraseña (credencialRowHtml).
const TEMPLATE_FINALIZACION_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tu plataforma está lista</title>
<style>
body{margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
.wrapper{width:100%;padding:40px 20px;}
.container{max-width:720px;margin:0 auto;}
.hero{background:linear-gradient(135deg,#050816 0%,#0b1023 50%,#140a2f 100%);padding:70px 50px;border-radius:28px 28px 0 0;text-align:center;}
.logo{width:160px;display:block;margin:0 auto 40px;}
.badge{display:inline-block;padding:10px 18px;border:1px solid rgba(255,255,255,.15);border-radius:999px;color:#cbd5e1;font-size:12px;letter-spacing:2px;text-transform:uppercase;}
.hero h1{color:white;font-size:48px;line-height:1.1;margin:30px 0 20px;}
.hero p{color:#cbd5e1;font-size:20px;line-height:34px;max-width:550px;margin:auto;}
.content{background:white;padding:60px;}
.greeting{font-size:22px;font-weight:600;color:#0f172a;margin-bottom:25px;}
.text{font-size:17px;line-height:32px;color:#475569;margin-bottom:25px;}
.status{background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:30px;margin:40px 0;}
.status-badge{display:inline-block;background:#ede9fe;color:#6d28d9;padding:8px 14px;border-radius:999px;font-size:13px;font-weight:600;margin-bottom:18px;}
.status h2{margin:0;color:#0f172a;}
.status p{color:#64748b;line-height:28px;}
.section-title{font-size:28px;font-weight:700;color:#0f172a;margin-top:50px;margin-bottom:25px;}
.access-card{border:1px solid #e2e8f0;border-radius:18px;padding:28px;margin-bottom:20px;}
.access-title{font-size:22px;font-weight:700;color:#0f172a;}
.access-desc{color:#64748b;margin-top:10px;margin-bottom:20px;line-height:28px;}
.button{display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:white;text-decoration:none;padding:14px 24px;border-radius:12px;font-weight:600;}
.credentials{background:#f8fafc;border-radius:18px;padding:30px;margin-top:40px;}
.credentials h3{margin-top:0;}
.credentials p{color:#475569;line-height:28px;}
.pw-check{position:absolute;opacity:0;width:1px;height:1px;}
.pw-real{display:none;}
.pw-check:checked ~ .pw-real{display:inline;}
.pw-check:checked ~ .pw-mask{display:none;}
.academy{margin-top:45px;padding:30px;border-radius:18px;background:#0f172a;text-align:center;}
.academy h3{color:white;margin-top:0;}
.academy p{color:#cbd5e1;line-height:30px;}
.footer{background:#0b1023;padding:50px;text-align:center;border-radius:0 0 28px 28px;}
.footer-logo{width:140px;margin:0 auto 24px;}
.footer h3{color:white;margin-top:0;}
.footer p{color:#94a3b8;line-height:30px;}
.contact{margin-top:25px;}
.contact a{color:white;text-decoration:none;}
@media(max-width:640px){.hero{padding:50px 30px;}.hero h1{font-size:38px;}.content{padding:35px;}}
</style>
</head>
<body>
<div class="wrapper">
<div class="container">
    <div class="hero">
        <img src="${LOGO_WHITE_URL}" class="logo" alt="NativeCode">
        <div class="badge">IMPLEMENTACIÓN COMPLETADA</div>
        <h1>Tu plataforma está lista.</h1>
        <p>Todo ha sido configurado correctamente y ya puedes comenzar a utilizar tu nueva solución digital.</p>
    </div>
    <div class="content">
        <div class="greeting">Hola {{NOMBRE}},</div>
        <p class="text">Nos complace informarte que la implementación de tu plataforma ha sido completada exitosamente.</p>
        <p class="text">A partir de este momento ya puedes acceder a tu entorno de trabajo y comenzar a utilizar todas las funcionalidades disponibles.</p>
        <div class="status">
            <div class="status-badge">Plataforma Operativa</div>
            <h2>Todo preparado para comenzar</h2>
            <p>Tu entorno se encuentra activo, configurado y listo para su utilización.</p>
        </div>
        <div class="section-title">Accesos</div>
        <div class="access-card">
            <div class="access-title">Tu Sitio Web Agenda Clínica</div>
            <div class="access-desc">Acceso público a tu plataforma de agenda clínica.</div>
            <a href="{{URL_WEB}}" class="button">Abrir Sitio Web</a>
        </div>
        <div class="access-card">
            <div class="access-title">Panel de Administración</div>
            <div class="access-desc">Gestión completa de usuarios, contenidos y configuración.</div>
            <a href="{{URL_PANEL}}" class="button">Ingresar al Panel</a>
        </div>
        <div class="credentials">
            <h3>Credenciales de acceso</h3>
            <p>Tus datos de acceso se detallan a continuación. Por motivos de seguridad, recomendamos cambiar la contraseña después del primer ingreso.</p>
            {{CREDENCIALES}}
        </div>
        <div class="academy">
            <h3>Academia Agenda Clínica</h3>
            <p>Encontrarás tutoriales, documentación y material de apoyo para sacar el máximo provecho de tu plataforma desde el primer día.</p>
            <a href="${ACADEMIA_AGENDA_CLINICA_URL}" class="button" style="margin-top:20px;">Ir a la Academia</a>
        </div>
        <div style="margin-top:50px; text-align:center;">
            <h2 style="color:#0f172a;">Gracias por confiar en NativeCode.</h2>
            <p class="text">Estamos comprometidos con acompañarte en cada etapa y ayudarte a obtener el máximo valor de tu solución tecnológica.</p>
            <p style="font-size:24px;font-weight:700;color:#7c3aed;margin-top:30px;">Este es solo el comienzo.</p>
        </div>
    </div>
    <div class="footer">
        <img src="${LOGO_WHITE_URL}" alt="NativeCode" class="footer-logo">
        <h3>Soporte NativeCode</h3>
        <p>Si necesitas ayuda o tienes cualquier consulta, nuestro equipo estará disponible para asistirte.</p>
        <div class="contact">
            <p><a href="mailto:ingenieria.software@nativecode.cl">ingenieria.software@nativecode.cl</a></p>
            <p>+56 9 6609 1038</p>
            <p>Tiempo de respuesta estimado: 24 horas hábiles.</p>
        </div>
    </div>
</div>
</div>
</body>
</html>`;

const templateFinalizacion = (project) => ({
    subject: 'Tu plataforma está lista',
    htmlTemplate: TEMPLATE_FINALIZACION_HTML,
    fields: [
        { key: 'NOMBRE',       label: 'Nombre del cliente', defaultValue: project?.nombre_cliente || '' },
        { key: 'URL_WEB',      label: 'URL del sitio web',  defaultValue: project?.url_front || '', placeholder: 'https://...' },
        { key: 'URL_PANEL',    label: 'URL del panel de administración', defaultValue: '', placeholder: 'https://...' },
        { key: 'CREDENCIALES', type: 'credentials-list', label: 'Credenciales de acceso (usuario + contraseña)', buildHtml: (rows) => rows.map(credencialRowHtml).join('') },
    ],
});

const EMAIL_TEMPLATES = {
    bienvenida:   { title: 'Bienvenida',            icon: Sparkles,     generator: templateBienvenida },
    usuarios:     { title: 'Solicitud de Usuarios', icon: UserPlus,     generator: templateSolicitudUsuarios },
    finalizacion: { title: 'Finalización',          icon: CheckCircle2, generator: templateFinalizacion },
};

export default function Ingresos() {
    const [activeTab, setActiveTab]       = usePersistedState('ingresos:activeTab', 'projects');
    const [projectsView, setProjectsView] = usePersistedState('ingresos:projectsView', 'cards');
    const [searchTerm, setSearchTerm]     = usePersistedState('ingresos:search', '');
    const [filterType, setFilterType]     = usePersistedState('ingresos:filterType', 'Todos');
    const [filterStatus, setFilterStatus] = usePersistedState('ingresos:filterStatus', 'Todos');
    const [filterMonth, setFilterMonth]   = usePersistedState('ingresos:filterMonth', 'Todos');
    const [filterPago, setFilterPago]     = usePersistedState('ingresos:filterPago', 'Todos');
    const [expandedProject, setExpandedProject] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [projectPayments, setProjectPayments] = useState({});

    const [projectForm, setProjectForm] = useState({
        name: '',
        type: 'Web',
        status: 'Lead',
        agreedAmount: '',
        clientName: '',
        clientRut: '',
        clientPhone: '',
        clientEmail: '',
        clientProfession: '',
        clientAddress: '',
        clientComuna: '',
        deliveryDate: '',
        observations: '',
        ciclo: 'Unico',
        fechaInicioServicio: '',
        fechaProximoPago: '',
        urlCobroMp: '',
        afectoIva: true
    });

    const [quickPayLoadingId, setQuickPayLoadingId] = useState(null);

    const [incomeForm, setIncomeForm] = useState({
        projectId: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [projectTypesData, setProjectTypesData] = useState([]);
    const [projectStatusesData, setProjectStatusesData] = useState([]);

    const [editProject, setEditProject] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isEditLoading, setIsEditLoading] = useState(false);

    const [editPayment, setEditPayment] = useState(null);
    const [editPaymentForm, setEditPaymentForm] = useState({});
    const [isPaymentEditLoading, setIsPaymentEditLoading] = useState(false);

    const [dteProject, setDteProject] = useState(null);
    const [dteForm, setDteForm] = useState(null);
    const [isSavingClientData, setIsSavingClientData] = useState(false);
    const [clientDataSaved, setClientDataSaved] = useState(false);
    const [estadoCaf, setEstadoCaf] = useState({ boleta39: false, factura33: false });
    const [ultimoDocumento, setUltimoDocumento] = useState(null);
    const [isEmitiendo, setIsEmitiendo] = useState(false);
    const [emisionResultado, setEmisionResultado] = useState(null);

    const [emailMenuOpenId, setEmailMenuOpenId] = useState(null);
    const [emailModalState, setEmailModalState] = useState(null); // { project, type }

    const fmtPreview = (val) => {
        const n = Math.round(parseFloat(val) || 0);
        if (!n) return null;
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
    };

    const projectTypes = projectTypesData.length > 0
        ? projectTypesData.map(t => t.nombre)
        : ['Web', 'E-commerce', 'SaaS', 'Landing Page', 'Inmobiliaria', 'Marketing'];
    const projectStatuses = projectStatusesData.length > 0
        ? projectStatusesData.map(s => s.nombre)
        : ['Lead', 'Cotizado', 'Aceptado', 'En desarrollo', 'Entregado', 'Cancelado'];

    // Load projects, catalogs, and payments from backend
    useEffect(() => {
        const loadData = async () => {
            try {
                const [projectsResult, typesResult, statusesResult] = await Promise.all([
                    projectsService.getProjects(),
                    configService.getProjectTypes(),
                    configService.getProjectStatuses()
                ]);

                if (projectsResult && Array.isArray(projectsResult)) {
                    setProjects(projectsResult);
                    const paymentsResults = await Promise.all(
                        projectsResult.map(p => projectsService.getProjectPayments(p.id))
                    );
                    const paymentsMap = {};
                    projectsResult.forEach((p, i) => {
                        if (paymentsResults[i] && Array.isArray(paymentsResults[i])) {
                            paymentsMap[p.id] = paymentsResults[i];
                        }
                    });
                    setProjectPayments(paymentsMap);
                }
                if (typesResult && Array.isArray(typesResult) && typesResult.length > 0) setProjectTypesData(typesResult);
                if (statusesResult && Array.isArray(statusesResult) && statusesResult.length > 0) setProjectStatusesData(statusesResult);
            } catch (error) {
                console.error('Error cargando datos:', error);
            }
        };
        loadData();
    }, []);

    const reloadProjects = async () => {
        const updatedProjects = await projectsService.getProjects();
        if (updatedProjects && Array.isArray(updatedProjects)) {
            setProjects(updatedProjects);
            const paymentsResults = await Promise.all(
                updatedProjects.map(p => projectsService.getProjectPayments(p.id))
            );
            const paymentsMap = {};
            updatedProjects.forEach((p, i) => {
                if (paymentsResults[i] && Array.isArray(paymentsResults[i])) {
                    paymentsMap[p.id] = paymentsResults[i];
                }
            });
            setProjectPayments(paymentsMap);
        }
    };

    useRealtime(reloadProjects);

    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        if (!projectForm.name) return;

        setIsLoading(true);
        try {
            const tipoFound = projectTypesData.find(t => t.nombre === projectForm.type);
            const estadoFound = projectStatusesData.find(s => s.nombre === projectForm.status);
            const tipo_proyecto_id = tipoFound ? tipoFound.id : 1;
            const estado_proyecto_id = estadoFound ? estadoFound.id : 1;

            const newProject = await projectsService.addProject({
                nombre: projectForm.name,
                tipo_proyecto_id,
                estado_proyecto_id,
                nombre_cliente: projectForm.clientName,
                rut_cliente: projectForm.clientRut,
                email_cliente: projectForm.clientEmail,
                telefono_cliente: projectForm.clientPhone,
                profesion_cliente: projectForm.clientProfession || null,
                direccion_cliente: projectForm.clientAddress || null,
                comuna_cliente: projectForm.clientComuna || null,
                monto_acordado: Math.round(parseFloat(projectForm.agreedAmount || 0)),
                fecha_creacion: new Date().toISOString().split('T')[0],
                fecha_entrega: projectForm.deliveryDate || null,
                observaciones: projectForm.observations || null,
                ciclo_facturacion: projectForm.ciclo || 'Unico',
                fecha_inicio_servicio: projectForm.fechaInicioServicio || null,
                fecha_proximo_pago: projectForm.fechaProximoPago || null,
                url_cobro_mercadopago: projectForm.urlCobroMp || null,
                afecto_iva: projectForm.afectoIva ? 1 : 0
            });

            if (newProject && newProject.ok) {
                await reloadProjects();
                alert('Proyecto creado exitosamente');
            } else {
                alert('Error al crear proyecto');
            }

            setProjectForm({
                name: '',
                type: projectTypes[0] || 'Web',
                status: 'Lead',
                agreedAmount: '',
                clientName: '',
                clientRut: '',
                clientPhone: '',
                clientEmail: '',
                clientProfession: '',
                clientAddress: '',
                clientComuna: '',
                deliveryDate: '',
                observations: '',
                ciclo: 'Unico',
                fechaInicioServicio: '',
                fechaProximoPago: '',
                urlCobroMp: '',
                afectoIva: true
            });
            setActiveTab('projects');
        } catch (error) {
            console.error('Error creando proyecto:', error);
            alert('Error al crear proyecto');
        } finally {
            setIsLoading(false);
        }
    };

    const handleIncomeSubmit = async (e) => {
        e.preventDefault();
        if (!incomeForm.projectId || !incomeForm.amount) return;

        setIsLoading(true);
        try {
            const project = (projects || []).find(p => p.id === parseInt(incomeForm.projectId));
            const description = incomeForm.description || (project ? project.nombre : 'Ingreso');

            const result = await projectsService.addProjectPayment(incomeForm.projectId, {
                concepto: description,
                monto: Math.round(parseFloat(incomeForm.amount)),
                fecha_pago: incomeForm.date
            });

            if (result && result.ok) {
                await reloadProjects();
                alert('Pago registrado exitosamente');
            } else {
                alert('Error al registrar pago');
            }

            setIncomeForm({
                projectId: '',
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            console.error('Error registrando pago:', error);
            alert('Error al registrar pago');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm('¿Desactivar este proyecto? Dejará de verse en los listados activos.')) return;
        setIsLoading(true);
        try {
            await projectsService.deleteProject(id);
            await reloadProjects();
        } catch (error) {
            console.error('Error eliminando proyecto:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (projectId, newStatusName) => {
        const estadoFound = projectStatusesData.find(s => s.nombre === newStatusName);
        if (!estadoFound) return;
        try {
            await projectsService.updateProjectStatus(projectId, estadoFound.id);
            await reloadProjects();
        } catch (error) {
            console.error('Error actualizando estado:', error);
        }
    };

    const handleEditOpen = (project) => {
        setEditProject(project);
        setEditForm({
            name: project.nombre || '',
            type: project.tipo_nombre || projectTypes[0] || 'Web',
            status: project.estado_nombre || 'Lead',
            estadoId: project.estado_proyecto_id || null,
            tipoId: project.tipo_proyecto_id || null,
            agreedAmount: project.monto_acordado || '',
            clientName: project.nombre_cliente || '',
            clientRut: project.rut_cliente || '',
            clientPhone: project.telefono_cliente || '',
            clientEmail: project.email_cliente || '',
            clientProfession: project.profesion_cliente || '',
            clientAddress: project.direccion_cliente || '',
            clientComuna: project.comuna_cliente || '',
            deliveryDate: project.fecha_entrega ? project.fecha_entrega.split('T')[0] : '',
            observations: project.observaciones || '',
            ciclo: project.ciclo_facturacion || 'Unico',
            fechaInicioServicio: project.fecha_inicio_servicio ? project.fecha_inicio_servicio.split('T')[0] : '',
            fechaProximoPago: project.fecha_proximo_pago ? project.fecha_proximo_pago.split('T')[0] : '',
            urlCobroMp: project.url_cobro_mercadopago || '',
            afectoIva: project.afecto_iva !== undefined ? Boolean(project.afecto_iva) : true
        });
    };

    const handleEditClose = () => {
        setEditProject(null);
        setEditForm({});
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editProject) return;
        setIsEditLoading(true);
        try {
            const tipoFound = projectTypesData.find(t => t.nombre === editForm.type);
            const estadoFound = projectStatusesData.find(s => s.nombre === editForm.status);
            const tipo_proyecto_id = tipoFound?.id ?? editForm.tipoId;
            const estado_proyecto_id = estadoFound?.id ?? editForm.estadoId;

            // El estado guardado en el proyecto puede haber quedado huérfano (renombrado o
            // eliminado desde Config). Sin esta guarda, se manda estado_proyecto_id: null y
            // el backend lo rechaza siempre igual — cada intento de guardar vuelve a fallar
            // con el mismo error hasta que alguien note que hay que reelegir el estado a mano.
            if (!estado_proyecto_id) {
                alert('El estado de este proyecto ya no es válido (puede haber sido renombrado o eliminado). Selecciona un estado desde la lista antes de guardar.');
                setIsEditLoading(false);
                return;
            }

            const updates = {
                nombre: editForm.name,
                nombre_cliente: editForm.clientName,
                rut_cliente: editForm.clientRut,
                email_cliente: editForm.clientEmail,
                telefono_cliente: editForm.clientPhone,
                profesion_cliente: editForm.clientProfession || null,
                direccion_cliente: editForm.clientAddress || null,
                comuna_cliente: editForm.clientComuna || null,
                monto_acordado: Math.round(parseFloat(editForm.agreedAmount || 0)),
                fecha_entrega: editForm.deliveryDate || null,
                observaciones: editForm.observations || null,
                ciclo_facturacion: editForm.ciclo || 'Unico',
                fecha_inicio_servicio: editForm.fechaInicioServicio || null,
                fecha_proximo_pago: editForm.fechaProximoPago || null,
                url_cobro_mercadopago: editForm.urlCobroMp || null,
                tipo_proyecto_id: tipo_proyecto_id ?? null,
                estado_proyecto_id: estado_proyecto_id ?? null,
                afecto_iva: editForm.afectoIva ? 1 : 0,
            };

            const result = await projectsService.updateProject(editProject.id, updates);
            if (result && (result.ok || result.id)) {
                await reloadProjects();
                handleEditClose();
            } else {
                alert('Error al actualizar el proyecto');
            }
        } catch (error) {
            console.error('Error actualizando proyecto:', error);
            alert('Error al actualizar el proyecto');
        } finally {
            setIsEditLoading(false);
        }
    };

    const handleQuickPago = async (project) => {
        if (!window.confirm(`¿Confirmas el pago de ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(project.monto_acordado)} para ${project.nombre_cliente}?`)) return;
        setQuickPayLoadingId(project.id);
        try {
            const result = await projectsService.addProjectPayment(project.id, {
                concepto: `Renovación ${project.ciclo_facturacion?.toLowerCase() || 'suscripción'}`,
                monto: Math.round(parseFloat(project.monto_acordado || 0)),
                fecha_pago: new Date().toISOString().split('T')[0]
            });
            if (result && result.ok) {
                await reloadProjects();
            } else {
                alert('Error al registrar el pago');
            }
        } catch (error) {
            console.error('Error en pago rápido:', error);
            alert('Error al registrar el pago');
        } finally {
            setQuickPayLoadingId(null);
        }
    };

    const handleEditPaymentOpen = (payment, project) => {
        setEditPayment({ ...payment, projectId: project.id });
        setEditPaymentForm({
            concepto: payment.concepto || '',
            monto: payment.monto || '',
            fecha_pago: payment.fecha_pago ? String(payment.fecha_pago).slice(0, 10) : '',
            numero_comprobante: payment.numero_comprobante || '',
            notas: payment.notas || '',
        });
    };

    const handleEditPaymentSubmit = async (e) => {
        e.preventDefault();
        if (!editPayment) return;
        setIsPaymentEditLoading(true);
        try {
            await projectsService.updateProjectPayment(editPayment.projectId, editPayment.id_proyecto_pago, {
                concepto: editPaymentForm.concepto,
                monto: Math.round(parseFloat(editPaymentForm.monto || 0)),
                fecha_pago: editPaymentForm.fecha_pago,
                numero_comprobante: editPaymentForm.numero_comprobante || null,
                notas: editPaymentForm.notas || null,
            });
            await reloadProjects();
            setEditPayment(null);
        } catch {
            alert('Error al actualizar el pago');
        } finally {
            setIsPaymentEditLoading(false);
        }
    };

    const handleDeletePayment = async (payment, project) => {
        if (!window.confirm(`¿Eliminar el pago "${payment.concepto}" de ${Math.round(parseFloat(payment.monto || 0)).toLocaleString('es-CL')}?`)) return;
        const ok = await projectsService.deleteProjectPayment(project.id, payment.id_proyecto_pago);
        if (ok) {
            await reloadProjects();
        } else {
            alert('Error al eliminar el pago');
        }
    };

    // Valores según Formato DTE del SII (<FmaPago>): 1 Contado, 2 Crédito, 3 Sin costo (entrega gratuita)
    const DTE_FORMAS_PAGO = ['Contado', 'Crédito', 'Sin costo (entrega gratuita)'];
    // <MedioPago>: modalidad concreta en que se paga (independiente de Forma de Pago)
    const DTE_MEDIOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Cheque', 'Otro'];

    const handleDteOpen = (project) => {
        setDteProject(project);
        setClientDataSaved(false);
        setEmisionResultado(null);
        setUltimoDocumento(null);
        dteService.getEstadoCaf().then(setEstadoCaf);
        dteService.getUltimoDocumento(project.id).then(setUltimoDocumento);
        setDteForm({
            tipoDte: project.rut_cliente ? 33 : 39,
            receptor: {
                nombre: project.nombre_cliente || '',
                rut: project.rut_cliente || '',
                giro: project.profesion_cliente || '',
                email: project.email_cliente || '',
                telefono: project.telefono_cliente || '',
                direccion: project.direccion_cliente || '',
                comuna: project.comuna_cliente || ''
            },
            formaPago: 'Crédito',
            medioPago: '',
            fechaVencimiento: '',
            referencias: '',
            detalle: [{
                nombre: project.nombre || '',
                descripcion: '',
                cantidad: 1,
                unidad: 'Un',
                precioUnitario: Math.round(parseFloat(project.monto_acordado || 0)),
                descuentoPct: 0
            }],
            descuentoGlobalPct: 0
        });
    };

    const handleDteClose = () => {
        setDteProject(null);
        setDteForm(null);
        setEmisionResultado(null);
    };

    // Rellena el detalle con las mismas líneas del último documento emitido para este proyecto
    // (equivalente a "Hacer documento similar al último emitido" del portal del SII).
    const handleUsarUltimoDocumento = () => {
        if (!ultimoDocumento?.detalle?.length) return;
        setDteForm((prev) => ({
            ...prev,
            tipoDte: ultimoDocumento.tipo_dte,
            detalle: ultimoDocumento.detalle,
        }));
    };

    const handleEmitirDteReal = async () => {
        if (!dteProject || !dteForm || isEmitiendo) return;
        setIsEmitiendo(true);
        setEmisionResultado(null);
        try {
            const resultado = await dteService.emitirDte(dteProject.id, {
                tipoDte: dteForm.tipoDte,
                detalle: dteForm.detalle,
                fechaVencimiento: dteForm.fechaVencimiento || null,
            });
            setEmisionResultado(resultado);
            if (resultado?.ok) {
                await reloadProjects();
            }
        } catch (error) {
            console.error('Error emitiendo DTE:', error);
            setEmisionResultado({ ok: false, errorMensaje: 'Error inesperado al emitir el documento' });
        } finally {
            setIsEmitiendo(false);
        }
    };

    const addDetalleLine = () => {
        setDteForm(prev => ({
            ...prev,
            detalle: [...prev.detalle, { nombre: '', descripcion: '', cantidad: 1, unidad: 'Un', precioUnitario: 0, descuentoPct: 0 }]
        }));
    };

    const removeDetalleLine = (index) => {
        setDteForm(prev => {
            if (prev.detalle.length <= 1) return prev;
            return { ...prev, detalle: prev.detalle.filter((_, i) => i !== index) };
        });
    };

    const updateDetalleLine = (index, field, value) => {
        setDteForm(prev => ({
            ...prev,
            detalle: prev.detalle.map((line, i) => i === index ? { ...line, [field]: value } : line)
        }));
    };

    const computeDteTotals = (form, afectoIva) => {
        if (!form) return { subtotal: 0, descuentoGlobalMonto: 0, montoNeto: 0, iva: 0, total: 0 };
        return computeDteTotalsShared(form.detalle, form.descuentoGlobalPct, afectoIva);
    };

    const handleSaveClientData = async () => {
        if (!dteProject || !dteForm) return;
        setIsSavingClientData(true);
        setClientDataSaved(false);
        try {
            const result = await projectsService.updateProject(dteProject.id, {
                nombre_cliente: dteForm.receptor.nombre,
                rut_cliente: normalizeRut(dteForm.receptor.rut),
                profesion_cliente: dteForm.receptor.giro || null,
                email_cliente: dteForm.receptor.email,
                telefono_cliente: dteForm.receptor.telefono,
                direccion_cliente: dteForm.receptor.direccion || null,
                comuna_cliente: dteForm.receptor.comuna || null
            });
            if (result && (result.ok || result.id)) {
                await reloadProjects();
                setClientDataSaved(true);
            } else {
                alert('Error al guardar los datos del cliente');
            }
        } catch (error) {
            console.error('Error guardando datos del cliente:', error);
            alert('Error al guardar los datos del cliente');
        } finally {
            setIsSavingClientData(false);
        }
    };

    const handleDtePreviewPdf = async () => {
        if (!dteProject || !dteForm) return;
        try {
            const emisorConfig = await configService.getFinancialConfig();
            const totales = computeDteTotals(dteForm, Boolean(dteProject.afecto_iva));
            await generateDtePreview({
                tipoDte: dteForm.tipoDte,
                emisor: emisorConfig || {},
                receptor: { ...dteForm.receptor, rut: normalizeRut(dteForm.receptor.rut) },
                detalle: dteForm.detalle,
                formaPago: dteForm.formaPago,
                medioPago: dteForm.medioPago,
                fechaVencimiento: dteForm.fechaVencimiento,
                referencias: dteForm.referencias,
                totales,
                codigoInterno: dteProject.codigo_interno
            });
        } catch (error) {
            console.error('Error generando vista previa PDF:', error);
            alert('Error al generar la vista previa del documento');
        }
    };

    const getStatusBadgeProps = (status, colorHex) => {
        const base = "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border cursor-pointer whitespace-nowrap";
        if (colorHex) {
            return {
                className: base,
                style: { backgroundColor: colorHex + '1A', color: colorHex, borderColor: colorHex + '33' }
            };
        }
        const colorCls = (() => {
            switch (status) {
                case 'Entregado':     return 'bg-[hsl(var(--emerald-premium))]/10 text-[hsl(var(--emerald-premium))] border-[hsl(var(--emerald-premium))]/20';
                case 'En desarrollo': return 'bg-[hsl(var(--turquoise-premium))]/10 text-[hsl(var(--turquoise-premium))] border-[hsl(var(--turquoise-premium))]/20';
                case 'Aceptado':      return 'bg-[hsl(var(--purple-premium))]/10 text-[hsl(var(--purple-premium))] border-[hsl(var(--purple-premium))]/20';
                case 'Cancelado':     return 'bg-[hsl(var(--copper))]/10 text-[hsl(var(--copper))] border-[hsl(var(--copper))]/20';
                default:              return 'bg-secondary text-muted-foreground border-border';
            }
        })();
        return { className: cn(base, colorCls), style: {} };
    };

    const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    // Evita el desfase de timezone al mostrar fechas almacenadas como DATE (sin hora).
    // new Date("2025-06-20") es medianoche UTC; en Chile (UTC-4) toLocaleDateString
    // lo convertiría al 19 de junio. Parsear los componentes directamente evita eso.
    const fmtDate = (dateStr) => {
        if (!dateStr) return '';
        const s = typeof dateStr === 'string' ? dateStr : dateStr.toISOString();
        const [y, m, d] = s.slice(0, 10).split('-');
        return `${d}/${m}/${y}`;
    };

    // Contadores de proyectos
    const allProjects = projects || [];
    // "Cerrado" real = Cancelado o Desactivado por no pago. "Entregado" NO es un cierre —
    // el cliente sigue usando el proyecto (ej. suscripción recurrente en curso).
    const closedStatuses = ['Cancelado', 'Desactivado por no pago'];
    const countEntregados = allProjects.filter(p => p.estado_nombre === 'Entregado').length;
    const countEntregadosAlDia = allProjects.filter(p =>
        p.estado_nombre === 'Entregado' && p.estado_alerta_pago !== 'naranja' && p.estado_alerta_pago !== 'rojo'
    ).length;
    const countCancelados = allProjects.filter(p => closedStatuses.includes(p.estado_nombre)).length;
    const countPorVencer = allProjects.filter(p => p.estado_alerta_pago === 'naranja' || p.estado_alerta_pago === 'rojo').length;
    const countAlDia    = allProjects.filter(p => p.estado_alerta_pago === 'verde').length;
    const countNaranja  = allProjects.filter(p => p.estado_alerta_pago === 'naranja').length;
    const countRojo     = allProjects.filter(p => p.estado_alerta_pago === 'rojo').length;
    const countByType = allProjects.reduce((acc, p) => {
        const tipo = p.tipo_nombre || 'Sin tipo';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
    }, {});

    const getPaymentAlertBadge = (alerta) => {
        switch (alerta) {
            case 'verde':   return { label: 'Al día', cls: 'bg-[hsl(var(--emerald-premium))]/15 text-[hsl(var(--emerald-premium))] border-[hsl(var(--emerald-premium))]/30' };
            case 'naranja': return { label: 'Por vencer', cls: 'bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))] border-[hsl(var(--gold))]/30' };
            case 'rojo':    return { label: 'Vencido', cls: 'bg-destructive/15 text-destructive border-destructive/30' };
            default:        return null;
        }
    };

    const filteredProjects = (projects || []).filter(p => {
        const nombre = p.nombre || '';
        const codigo = p.codigo_interno || '';
        const tipo = p.tipo_nombre || '';
        const estado = p.estado_nombre || '';
        const matchesSearch = nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            codigo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'Todos' || tipo === filterType;
        const matchesStatus = filterStatus === 'Todos' || estado === filterStatus;

        let matchesMonth = true;
        if (filterMonth !== 'Todos') {
            const targetMonth = Number(filterMonth);
            const dateRef = p.fecha_entrega || p.fecha_inicio_servicio || p.fecha_creacion;
            if (dateRef) {
                const d = new Date(dateRef);
                matchesMonth = d.getUTCMonth() === targetMonth;
            }
        }

        const matchesPago = filterPago === 'Todos' || p.estado_alerta_pago === filterPago;

        return matchesSearch && matchesType && matchesStatus && matchesMonth && matchesPago;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">Proyectos</h2>
                    <p className="text-sm text-muted-foreground mt-1">Gestión de trabajos y sus ingresos</p>
                </div>
                <div className="flex bg-secondary p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={cn(
                            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                            activeTab === 'projects' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Nuevo Proyecto
                    </button>
                    <button
                        onClick={() => setActiveTab('new-income')}
                        className={cn(
                            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                            activeTab === 'new-income' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        + Ingreso
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                            {activeTab === 'projects' ? <Briefcase size={18} /> : <DollarSign size={18} />}
                            {activeTab === 'projects' ? 'Nuevo Proyecto' : 'Registrar Pago'}
                        </h3>

                        {activeTab === 'projects' ? (
                            <form onSubmit={handleProjectSubmit} className="space-y-4">
                                <Input label="Nombre del Proyecto" placeholder="Ej: E-commerce Cliente X"
                                    value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <Select label="Tipo" value={projectForm.type}
                                        onChange={(e) => {
                                            const selected = projectTypesData.find(t => t.nombre === e.target.value);
                                            const precio = selected?.precio_base ? String(Math.round(selected.precio_base)) : projectForm.agreedAmount;
                                            setProjectForm({ ...projectForm, type: e.target.value, agreedAmount: precio });
                                        }} required>
                                        {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Select>
                                    <Select label="Estado" value={projectForm.status}
                                        onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })} required>
                                        {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <Input label="Monto Acordado" type="number" placeholder="0" min="0" step="1"
                                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                        value={projectForm.agreedAmount} onChange={(e) => setProjectForm({ ...projectForm, agreedAmount: e.target.value })} required />
                                    {fmtPreview(projectForm.agreedAmount) && (
                                        <p className="text-[11px] text-[hsl(var(--emerald-premium))] mt-1 font-medium">{fmtPreview(projectForm.agreedAmount)}</p>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                        <User size={14} /> Datos del Cliente
                                    </h4>
                                    <div className="space-y-3">
                                        <Input label="Nombre Completo" placeholder="Nombre del cliente"
                                            value={projectForm.clientName} onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })} required />
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input label="RUT / ID" placeholder="12.345.678-9"
                                                value={projectForm.clientRut} onChange={(e) => setProjectForm({ ...projectForm, clientRut: e.target.value })} required />
                                            <Input label="Teléfono" placeholder="+56 9..."
                                                value={projectForm.clientPhone} onChange={(e) => setProjectForm({ ...projectForm, clientPhone: e.target.value })} required />
                                        </div>
                                        <Input label="Email" type="email" placeholder="cliente@email.com"
                                            value={projectForm.clientEmail} onChange={(e) => setProjectForm({ ...projectForm, clientEmail: e.target.value })} required />
                                        <Input label="Profesión / Giro (Opcional)" placeholder="Ej: Abogado, Retail..."
                                            value={projectForm.clientProfession} onChange={(e) => setProjectForm({ ...projectForm, clientProfession: e.target.value })} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input label="Dirección (Opcional)" placeholder="Av. Siempre Viva 123"
                                                value={projectForm.clientAddress} onChange={(e) => setProjectForm({ ...projectForm, clientAddress: e.target.value })} />
                                            <Input label="Comuna (Opcional)" placeholder="Santiago"
                                                value={projectForm.clientComuna} onChange={(e) => setProjectForm({ ...projectForm, clientComuna: e.target.value })} />
                                        </div>
                                        <Input label="Fecha de Entrega (Opcional)" type="date"
                                            value={projectForm.deliveryDate}
                                            onChange={(e) => setProjectForm({ ...projectForm, deliveryDate: e.target.value })} />
                                        <Input label="Observaciones (Opcional)" placeholder="Notas del proyecto/cliente"
                                            value={projectForm.observations} onChange={(e) => setProjectForm({ ...projectForm, observations: e.target.value })} />
                                        <Input label="Link de cobro Mercado Pago (Opcional)" type="url" placeholder="https://mpago.la/..."
                                            value={projectForm.urlCobroMp} onChange={(e) => setProjectForm({ ...projectForm, urlCobroMp: e.target.value })} />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                        <Repeat size={14} /> Ciclo de Facturación
                                    </h4>
                                    <div className="space-y-3">
                                        <Select label="Tipo de Ciclo" value={projectForm.ciclo}
                                            onChange={(e) => setProjectForm({ ...projectForm, ciclo: e.target.value })}>
                                            <option value="Unico">Pago Único</option>
                                            <option value="Mensual">Mensual</option>
                                            <option value="Trimestral">Trimestral</option>
                                            <option value="Anual">Anual</option>
                                        </Select>
                                        {projectForm.ciclo !== 'Unico' && (<>
                                            <Input label="Inicio del Servicio" type="date"
                                                value={projectForm.fechaInicioServicio}
                                                onChange={(e) => setProjectForm({ ...projectForm, fechaInicioServicio: e.target.value })} />
                                            <Input label="Próximo Pago" type="date"
                                                value={projectForm.fechaProximoPago}
                                                onChange={(e) => setProjectForm({ ...projectForm, fechaProximoPago: e.target.value })} />
                                        </>)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/40">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Afecto a IVA</p>
                                        <p className="text-xs text-muted-foreground">Genera débito fiscal en F29 (19%)</p>
                                    </div>
                                    <button type="button"
                                        onClick={() => setProjectForm({ ...projectForm, afectoIva: !projectForm.afectoIva })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${projectForm.afectoIva ? 'bg-violet-500' : 'bg-border'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${projectForm.afectoIva ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <button type="submit" disabled={isLoading}
                                    className="w-full bg-[hsl(var(--emerald-premium))] text-white font-medium py-2.5 rounded-lg hover:bg-[hsl(var(--emerald-light))] transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isLoading ? 'Creando...' : 'Crear Proyecto'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleIncomeSubmit} className="space-y-4">
                                <Select label="Proyecto" value={incomeForm.projectId}
                                    onChange={(e) => setIncomeForm({ ...incomeForm, projectId: e.target.value })} required>
                                    <option value="">Seleccionar Proyecto...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </Select>
                                <div>
                                    <Input label="Monto del Pago" type="number" placeholder="0" min="0" step="1"
                                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                        value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} required />
                                    {fmtPreview(incomeForm.amount) && (
                                        <p className="text-[11px] text-[hsl(var(--emerald-premium))] mt-1 font-medium">{fmtPreview(incomeForm.amount)}</p>
                                    )}
                                </div>
                                <Input label="Concepto del pago" placeholder="Ej: Dashboard, Landing Page, Anticipo 50%"
                                    value={incomeForm.description} onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })} required />
                                <Input label="Fecha" type="date" value={incomeForm.date}
                                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} required />
                                <button type="submit" disabled={isLoading}
                                    className="w-full bg-[hsl(var(--emerald-premium))] text-white font-medium py-2.5 rounded-lg hover:bg-[hsl(var(--emerald-light))] transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isLoading ? 'Guardando...' : 'Guardar Pago'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Contadores resumen */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-card border border-[hsl(var(--emerald-premium))]/30 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-[hsl(var(--emerald-premium))]">{countEntregados}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Entregados</p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1">Al día: {countEntregadosAlDia}</p>
                        </div>
                        <div className="bg-card border border-destructive/30 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-destructive">{countCancelados}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Cancelados</p>
                        </div>
                        <div className="bg-card border border-[hsl(var(--gold))]/30 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-[hsl(var(--gold))]">{countPorVencer}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Por Vencer / Vencidos</p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1">Por vencer: {countNaranja} · Vencidos: {countRojo}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Por categoría</p>
                            <div className="space-y-0.5">
                                {Object.entries(countByType).slice(0, 4).map(([tipo, count]) => (
                                    <div key={tipo} className="flex justify-between text-[11px]">
                                        <span className="text-muted-foreground truncate">{tipo}</span>
                                        <span className="font-semibold text-foreground ml-2">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 mb-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input type="text" placeholder="Buscar por nombre o ID..."
                                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <select className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="Todos">Todos los Tipos</option>
                                {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="Todos">Todos los Estados</option>
                                {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                                <option value="Todos">Todos los Meses</option>
                                {MONTHS_ES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    {(searchTerm || filterType !== 'Todos' || filterStatus !== 'Todos' || filterMonth !== 'Todos' || filterPago !== 'Todos') && (
                        <div className="mb-2">
                            <button
                                onClick={() => { setSearchTerm(''); setFilterType('Todos'); setFilterStatus('Todos'); setFilterMonth('Todos'); setFilterPago('Todos'); }}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-foreground/5 transition-colors"
                            >
                                <X size={11} /> Limpiar filtros
                            </button>
                        </div>
                    )}

                    {(countAlDia > 0 || countNaranja > 0 || countRojo > 0) && (
                        <div className="flex items-center gap-2 flex-wrap mb-4">
                            {[
                                { value: 'Todos',   label: 'Todos',      count: allProjects.length, cls: filterPago === 'Todos'   ? 'bg-primary text-primary-foreground border-primary'                                                                                             : 'bg-card text-muted-foreground border-border hover:border-primary/40' },
                                { value: 'verde',   label: 'Al día',     count: countAlDia,   cls: filterPago === 'verde'   ? 'bg-[hsl(var(--emerald-premium))]/20 text-[hsl(var(--emerald-premium))] border-[hsl(var(--emerald-premium))]'  : 'bg-card text-muted-foreground border-border hover:border-[hsl(var(--emerald-premium))]/50' },
                                { value: 'naranja', label: 'Por vencer', count: countNaranja, cls: filterPago === 'naranja' ? 'bg-[hsl(var(--gold))]/20 text-[hsl(var(--gold))] border-[hsl(var(--gold))]'                                  : 'bg-card text-muted-foreground border-border hover:border-[hsl(var(--gold))]/50' },
                                { value: 'rojo',    label: 'Vencidos',   count: countRojo,    cls: filterPago === 'rojo'    ? 'bg-destructive/20 text-destructive border-destructive'                                                         : 'bg-card text-muted-foreground border-border hover:border-destructive/50' },
                            ].map(({ value, label, count, cls }) => (
                                <button key={value} onClick={() => setFilterPago(value)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${cls}`}>
                                    {label}
                                    <span className="text-[10px] opacity-70">({count})</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end mb-2">
                        <div className="flex bg-secondary p-1 rounded-lg">
                            <button onClick={() => setProjectsView('cards')}
                                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                    projectsView === 'cards' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                                <LayoutGrid size={13} /> Tarjetas
                            </button>
                            <button onClick={() => setProjectsView('list')}
                                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                    projectsView === 'list' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                                <List size={13} /> Listado
                            </button>
                        </div>
                    </div>

                    {filteredProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center border border-border border-dashed rounded-xl bg-muted/20">
                            <Briefcase size={32} className="mb-4 opacity-50" />
                            <p className="font-medium">No se encontraron proyectos</p>
                            <p className="text-sm">Intenta con otra búsqueda o crea uno nuevo.</p>
                        </div>
                    ) : projectsView === 'list' ? (
                        <div className="overflow-x-auto border border-border rounded-xl">
                            <table className="w-full min-w-[640px] text-[13px]">
                                <thead className="bg-secondary/40 border-b border-border">
                                    <tr>
                                        <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">Proyecto</th>
                                        <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">Monto</th>
                                        <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">Fecha de Pago</th>
                                        <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">Estado</th>
                                        <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredProjects.map(project => {
                                        const badge = getPaymentAlertBadge(project.estado_alerta_pago);
                                        const esRecurrente = project.ciclo_facturacion && project.ciclo_facturacion !== 'Unico';
                                        const puedeMarcarPagado = esRecurrente && (project.estado_alerta_pago === 'naranja' || project.estado_alerta_pago === 'rojo');
                                        return (
                                            <tr key={project.id} className="hover:bg-secondary/20 transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <p className="font-medium text-foreground">{project.nombre}</p>
                                                    <p className="text-[11px] text-muted-foreground">{project.nombre_cliente}</p>
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-medium text-foreground whitespace-nowrap">
                                                    ${Math.round(parseFloat(project.monto_acordado || 0)).toLocaleString('es-CL')}
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                                                    {esRecurrente ? fmtDate(project.fecha_proximo_pago) : '—'}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {badge ? (
                                                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${badge.cls}`}>{badge.label}</span>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    {puedeMarcarPagado ? (
                                                        <button
                                                            onClick={() => handleQuickPago(project)}
                                                            disabled={quickPayLoadingId === project.id}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[hsl(var(--emerald-premium))]/40 bg-[hsl(var(--emerald-premium))]/10 text-[hsl(var(--emerald-premium))] text-[11px] font-medium hover:bg-[hsl(var(--emerald-premium))]/20 transition-colors disabled:opacity-50">
                                                            {quickPayLoadingId === project.id
                                                                ? <Loader2 size={12} className="animate-spin" />
                                                                : <CheckCircle2 size={12} />}
                                                            {quickPayLoadingId === project.id ? 'Registrando...' : 'Marcar Pagado'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground/60">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredProjects.map(project => {
                                const pagos = projectPayments[project.id] || [];
                                const totalPaid = parseFloat(project.monto_pagado || 0);
                                const agreedAmount = parseFloat(project.monto_acordado || 0);
                                const progress = agreedAmount > 0 ? (totalPaid / agreedAmount) * 100 : 0;

                                return (
                                    <div key={project.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow group relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded border border-border font-mono">
                                                        {project.codigo_interno || 'N/A'}
                                                    </span>
                                                    {project.ciclo_facturacion && project.ciclo_facturacion !== 'Unico' && (
                                                        <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded border bg-[hsl(var(--purple-premium))]/10 text-[hsl(var(--purple-premium))] border-[hsl(var(--purple-premium))]/30">
                                                            <Repeat size={9} /> {project.ciclo_facturacion}
                                                        </span>
                                                    )}
                                                    {(() => {
                                                        const badge = getPaymentAlertBadge(project.estado_alerta_pago);
                                                        if (!badge) return null;
                                                        return (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${badge.cls}`}>
                                                                {badge.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <h4 className="font-semibold text-foreground text-base tracking-tight">{project.nombre}</h4>
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground text-xs">{project.tipo_nombre}</span>
                                                    {project.nombre_cliente && (
                                                        <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                            <User size={10} /> {project.nombre_cliente}
                                                        </span>
                                                    )}
                                                    {project.rut_cliente && <span className="text-xs text-muted-foreground">RUT: {project.rut_cliente}</span>}
                                                    {project.email_cliente && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                                                            <Mail size={10} className="shrink-0" />
                                                            {project.email_cliente}
                                                            {project.ciclo_facturacion && project.ciclo_facturacion !== 'Unico' && (
                                                                <span
                                                                    title="Recordatorios automáticos activados para este cliente"
                                                                    className="text-[9px] px-1 py-0.5 rounded border bg-[hsl(var(--emerald-premium))]/10 text-[hsl(var(--emerald-premium))] border-[hsl(var(--emerald-premium))]/30 font-medium shrink-0"
                                                                >
                                                                    recordatorios activos
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                    {project.telefono_cliente && <span className="text-xs text-muted-foreground">Tel: {project.telefono_cliente}</span>}
                                                    {project.url_cobro_mercadopago && (
                                                        <a
                                                            href={project.url_cobro_mercadopago.startsWith('http') ? project.url_cobro_mercadopago : `https://${project.url_cobro_mercadopago}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-[hsl(var(--emerald-premium))] flex items-center gap-1 hover:underline"
                                                            title="Link de cobro Mercado Pago"
                                                        >
                                                            <ExternalLink size={10} className="shrink-0" /> Link MP
                                                        </a>
                                                    )}
                                                    {project.profesion_cliente && <span className="text-xs text-muted-foreground">Giro: {project.profesion_cliente}</span>}
                                                    {project.fecha_entrega && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            <Calendar size={10} />
                                                            Entrega: {fmtDate(project.fecha_entrega)}
                                                        </span>
                                                    )}
                                                    {project.fecha_proximo_pago && project.ciclo_facturacion !== 'Unico' && (
                                                        <span className={`text-xs flex items-center gap-1 mt-0.5 font-medium ${
                                                            project.estado_alerta_pago === 'rojo' ? 'text-destructive' :
                                                            project.estado_alerta_pago === 'naranja' ? 'text-[hsl(var(--gold))]' :
                                                            'text-[hsl(var(--emerald-premium))]'
                                                        }`}>
                                                            <Calendar size={10} />
                                                            Próximo pago: {fmtDate(project.fecha_proximo_pago)}
                                                            {project.dias_para_vencer !== null && project.dias_para_vencer !== undefined && (
                                                                <span> · {project.dias_para_vencer >= 0 ? `${project.dias_para_vencer}d` : `${Math.abs(project.dias_para_vencer)}d vencido`}</span>
                                                            )}
                                                        </span>
                                                    )}
                                                    {project.observaciones && (
                                                        <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            Obs: {project.observaciones}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="relative group/status">
                                                    {(() => {
                                                        const bp = getStatusBadgeProps(project.estado_nombre, project.estado_color);
                                                        return <span className={bp.className} style={bp.style}>{project.estado_nombre || '—'}</span>;
                                                    })()}
                                                    <select className="absolute inset-0 opacity-0 cursor-pointer"
                                                        value={project.estado_nombre}
                                                        onChange={(e) => handleStatusChange(project.id, e.target.value)}>
                                                        {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="relative">
                                                        <button onClick={() => setEmailMenuOpenId(emailMenuOpenId === project.id ? null : project.id)}
                                                            className="text-muted-foreground hover:text-violet-400 transition-colors p-1" title="Enviar correo (Bienvenida / Solicitud de Usuarios / Finalización)">
                                                            <Mail size={14} />
                                                        </button>
                                                        {emailMenuOpenId === project.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setEmailMenuOpenId(null)} />
                                                                <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-card border border-border rounded-lg shadow-xl py-1">
                                                                    {Object.entries(EMAIL_TEMPLATES).map(([key, tpl]) => {
                                                                        const TplIcon = tpl.icon;
                                                                        return (
                                                                            <button key={key}
                                                                                onClick={() => { setEmailModalState({ project, type: key }); setEmailMenuOpenId(null); }}
                                                                                className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-left hover:bg-foreground/5 transition-colors">
                                                                                <TplIcon size={13} className="text-violet-400" />
                                                                                {tpl.title}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    <button onClick={() => handleDteOpen(project)}
                                                        className="text-muted-foreground hover:text-[hsl(var(--purple-premium))] transition-colors p-1" title="Emitir Documento Tributario (borrador)">
                                                        <FileText size={14} />
                                                    </button>
                                                    <button onClick={() => handleEditOpen(project)}
                                                        className="text-muted-foreground hover:text-primary transition-colors p-1" title="Editar Proyecto">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteProject(project.id)}
                                                        className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Eliminar Proyecto">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-5">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Acordado</span>
                                                <span className="text-foreground font-medium">{agreedAmount.toLocaleString('es-CL')}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Pagado</span>
                                                <span className="text-[hsl(var(--emerald-premium))] font-medium">{totalPaid.toLocaleString('es-CL')}</span>
                                            </div>
                                        </div>

                                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-4">
                                            <div className="h-full bg-[hsl(var(--emerald-premium))] transition-all duration-500"
                                                style={{ width: `${Math.min(progress, 100)}%` }} />
                                        </div>

                                        {project.ciclo_facturacion && project.ciclo_facturacion !== 'Unico' && (project.estado_alerta_pago === 'naranja' || project.estado_alerta_pago === 'rojo') && (
                                            <button
                                                onClick={() => handleQuickPago(project)}
                                                disabled={quickPayLoadingId === project.id}
                                                className="w-full mb-3 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[hsl(var(--emerald-premium))]/40 bg-[hsl(var(--emerald-premium))]/10 text-[hsl(var(--emerald-premium))] text-xs font-medium hover:bg-[hsl(var(--emerald-premium))]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <CheckCircle2 size={13} />
                                                {quickPayLoadingId === project.id ? 'Registrando...' : 'Marcar suscripción pagada'}
                                            </button>
                                        )}

                                        {pagos.length > 0 && (
                                            <div className="mb-3">
                                                <button onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                                                    className="w-full flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground transition-colors">
                                                    <span className="flex items-center gap-2">
                                                        <Receipt size={12} />
                                                        {pagos.length} pago{pagos.length !== 1 ? 's' : ''} registrado{pagos.length !== 1 ? 's' : ''}
                                                    </span>
                                                    {expandedProject === project.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>

                                                {expandedProject === project.id && (
                                                    <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                        {[...pagos].reverse().map((payment, idx) => (
                                                            <div key={payment.id_proyecto_pago || idx} className="flex items-center justify-between p-2.5 bg-[hsl(var(--emerald-premium))]/5 border border-[hsl(var(--emerald-premium))]/10 rounded-lg gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-medium text-foreground truncate">{payment.concepto || 'Pago'}</p>
                                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                        {payment.fecha_pago ? fmtDate(payment.fecha_pago) : 'Sin fecha'}
                                                                    </p>
                                                                </div>
                                                                <span className="text-sm font-bold text-[hsl(var(--emerald-premium))] shrink-0">
                                                                    +{Math.round(parseFloat(payment.monto || 0)).toLocaleString('es-CL')}
                                                                </span>
                                                                <div className="flex gap-1 shrink-0">
                                                                    <button
                                                                        onClick={() => handleEditPaymentOpen(payment, project)}
                                                                        className="p-1 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                                        title="Editar pago"
                                                                    >
                                                                        <Pencil size={11} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletePayment(payment, project)}
                                                                        className="p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                                        title="Eliminar pago"
                                                                    >
                                                                        <Trash2 size={11} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <button onClick={() => {
                                            setIncomeForm({ ...incomeForm, projectId: project.id });
                                            setActiveTab('new-income');
                                        }}
                                            className="w-full py-2 rounded-lg bg-[hsl(var(--emerald-premium))] text-white text-xs font-medium hover:bg-[hsl(var(--emerald-light))] transition-colors">
                                            Agregar Pago
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

        {/* Edit Project Modal */}
        {editProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={(e) => e.target === e.currentTarget && handleEditClose()}>
                <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Pencil size={18} className="text-primary" />
                            Editar Proyecto
                        </h3>
                        <button onClick={handleEditClose}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary">
                            <X size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                        <Input label="Nombre del Proyecto" placeholder="Ej: E-commerce Cliente X"
                            value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Tipo" value={editForm.type}
                                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} required>
                                {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </Select>
                            <Select label="Estado" value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} required>
                                {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                        <Input label="Monto Acordado" type="number" placeholder="0" min="0" step="1"
                            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                            value={editForm.agreedAmount} onChange={(e) => setEditForm({ ...editForm, agreedAmount: e.target.value })} required />

                        <div className="pt-3 border-t border-border">
                            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                <User size={14} /> Datos del Cliente
                            </h4>
                            <div className="space-y-3">
                                <Input label="Nombre Completo" placeholder="Nombre del cliente"
                                    value={editForm.clientName} onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })} required />
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="RUT / ID" placeholder="12.345.678-9"
                                        value={editForm.clientRut} onChange={(e) => setEditForm({ ...editForm, clientRut: e.target.value })} required />
                                    <Input label="Teléfono" placeholder="+56 9..."
                                        value={editForm.clientPhone} onChange={(e) => setEditForm({ ...editForm, clientPhone: e.target.value })} required />
                                </div>
                                <Input label="Email" type="email" placeholder="cliente@email.com"
                                    value={editForm.clientEmail} onChange={(e) => setEditForm({ ...editForm, clientEmail: e.target.value })} required />
                                <Input label="Profesión / Giro (Opcional)" placeholder="Ej: Abogado, Retail..."
                                    value={editForm.clientProfession} onChange={(e) => setEditForm({ ...editForm, clientProfession: e.target.value })} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Dirección (Opcional)" placeholder="Av. Siempre Viva 123"
                                        value={editForm.clientAddress || ''} onChange={(e) => setEditForm({ ...editForm, clientAddress: e.target.value })} />
                                    <Input label="Comuna (Opcional)" placeholder="Santiago"
                                        value={editForm.clientComuna || ''} onChange={(e) => setEditForm({ ...editForm, clientComuna: e.target.value })} />
                                </div>
                                <Input label="Fecha de Entrega (Opcional)" type="date"
                                    value={editForm.deliveryDate} onChange={(e) => setEditForm({ ...editForm, deliveryDate: e.target.value })} />
                                <Input label="Observaciones (Opcional)" placeholder="Notas del proyecto/cliente"
                                    value={editForm.observations} onChange={(e) => setEditForm({ ...editForm, observations: e.target.value })} />
                                <Input label="Link de cobro Mercado Pago (Opcional)" type="url" placeholder="https://mpago.la/..."
                                    value={editForm.urlCobroMp || ''} onChange={(e) => setEditForm({ ...editForm, urlCobroMp: e.target.value })} />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-border">
                            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                <Repeat size={14} /> Ciclo de Facturación
                            </h4>
                            <div className="space-y-3">
                                <Select label="Tipo de Ciclo" value={editForm.ciclo || 'Unico'}
                                    onChange={(e) => setEditForm({ ...editForm, ciclo: e.target.value })}>
                                    <option value="Unico">Pago Único</option>
                                    <option value="Mensual">Mensual</option>
                                    <option value="Trimestral">Trimestral</option>
                                    <option value="Anual">Anual</option>
                                </Select>
                                {(editForm.ciclo && editForm.ciclo !== 'Unico') && (<>
                                    <Input label="Inicio del Servicio" type="date"
                                        value={editForm.fechaInicioServicio || ''}
                                        onChange={(e) => setEditForm({ ...editForm, fechaInicioServicio: e.target.value })} />
                                    <Input label="Próximo Pago" type="date"
                                        value={editForm.fechaProximoPago || ''}
                                        onChange={(e) => setEditForm({ ...editForm, fechaProximoPago: e.target.value })} />
                                </>)}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/40">
                            <div>
                                <p className="text-sm font-medium text-foreground">Afecto a IVA</p>
                                <p className="text-xs text-muted-foreground">Genera débito fiscal en F29 (19%)</p>
                            </div>
                            <button type="button"
                                onClick={() => setEditForm({ ...editForm, afectoIva: !editForm.afectoIva })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.afectoIva ? 'bg-violet-500' : 'bg-border'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${editForm.afectoIva ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={handleEditClose}
                                className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors text-sm font-medium">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isEditLoading}
                                className="flex-1 bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                {isEditLoading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Modal editar pago */}
        {editPayment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={(e) => e.target === e.currentTarget && setEditPayment(null)}>
                <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <h3 className="font-semibold text-foreground text-sm">Editar Pago</h3>
                        <button onClick={() => setEditPayment(null)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-foreground/6 rounded-lg transition-colors">
                            <X size={15} />
                        </button>
                    </div>
                    <form onSubmit={handleEditPaymentSubmit} className="p-5 space-y-3">
                        <Input label="Concepto" placeholder="Ej: Anticipo 50%, Cuota 1..."
                            value={editPaymentForm.concepto}
                            onChange={(e) => setEditPaymentForm({ ...editPaymentForm, concepto: e.target.value })}
                            required />
                        <Input label="Monto" type="number" placeholder="0" min="0" step="1"
                            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                            value={editPaymentForm.monto}
                            onChange={(e) => setEditPaymentForm({ ...editPaymentForm, monto: e.target.value })}
                            required />
                        <Input label="Fecha de Pago" type="date"
                            value={editPaymentForm.fecha_pago}
                            onChange={(e) => setEditPaymentForm({ ...editPaymentForm, fecha_pago: e.target.value })}
                            required />
                        <Input label="N° Comprobante (opcional)" placeholder="Ej: 00123"
                            value={editPaymentForm.numero_comprobante}
                            onChange={(e) => setEditPaymentForm({ ...editPaymentForm, numero_comprobante: e.target.value })} />
                        <Input label="Notas (opcional)" placeholder="Notas adicionales"
                            value={editPaymentForm.notas}
                            onChange={(e) => setEditPaymentForm({ ...editPaymentForm, notas: e.target.value })} />
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setEditPayment(null)}
                                className="flex-1 border border-border text-muted-foreground font-medium py-2.5 rounded-lg hover:bg-foreground/5 transition-colors text-sm">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isPaymentEditLoading}
                                className="flex-1 bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                {isPaymentEditLoading ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Modal Emitir Documento Tributario (borrador) */}
        {dteProject && dteForm && (() => {
            const totales = computeDteTotals(dteForm, Boolean(dteProject.afecto_iva));
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={(e) => e.target === e.currentTarget && handleDteClose()}>
                    <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <FileText size={18} className="text-[hsl(var(--purple-premium))]" />
                                Emitir Documento Tributario
                            </h3>
                            <button onClick={handleDteClose}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            <div className="flex items-center gap-2 p-3 rounded-lg border border-[hsl(var(--gold))]/40 bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))] text-xs font-medium">
                                <span>BORRADOR — Sin validez tributaria (falta CAF del SII)</span>
                            </div>

                            <Select label="Tipo de Documento" value={String(dteForm.tipoDte)}
                                onChange={(e) => setDteForm({ ...dteForm, tipoDte: Number(e.target.value) })}>
                                <option value="39">Boleta Electrónica (39)</option>
                                <option value="33">Factura Electrónica (33)</option>
                            </Select>

                            <div>
                                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                    <User size={14} /> Receptor
                                </h4>
                                <div className="space-y-3">
                                    <Input label="Nombre" value={dteForm.receptor.nombre}
                                        onChange={(e) => setDteForm({ ...dteForm, receptor: { ...dteForm.receptor, nombre: e.target.value } })} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input label="RUT" value={dteForm.receptor.rut}
                                            onChange={(e) => setDteForm({ ...dteForm, receptor: { ...dteForm.receptor, rut: e.target.value } })} />
                                        <Input label="Giro" value={dteForm.receptor.giro}
                                            onChange={(e) => setDteForm({ ...dteForm, receptor: { ...dteForm.receptor, giro: e.target.value } })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input label="Email" type="email" value={dteForm.receptor.email}
                                            onChange={(e) => setDteForm({ ...dteForm, receptor: { ...dteForm.receptor, email: e.target.value } })} />
                                        <Input label="Teléfono" value={dteForm.receptor.telefono}
                                            onChange={(e) => setDteForm({ ...dteForm, receptor: { ...dteForm.receptor, telefono: e.target.value } })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input label="Dirección" value={dteForm.receptor.direccion}
                                            onChange={(e) => setDteForm({ ...dteForm, receptor: { ...dteForm.receptor, direccion: e.target.value } })} />
                                        <Input label="Comuna" value={dteForm.receptor.comuna}
                                            onChange={(e) => setDteForm({ ...dteForm, receptor: { ...dteForm.receptor, comuna: e.target.value } })} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={handleSaveClientData} disabled={isSavingClientData}
                                            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            {isSavingClientData ? 'Guardando...' : 'Guardar estos datos en el proyecto'}
                                        </button>
                                        {clientDataSaved && <span className="text-xs text-emerald-500">Guardado</span>}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                    <Receipt size={14} /> Detalle
                                </h4>
                                <div className="space-y-2">
                                    {dteForm.detalle.map((line, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-1.5 items-end bg-secondary/30 border border-border/40 rounded-lg p-2">
                                            <input placeholder="Producto/Servicio" value={line.nombre}
                                                onChange={(e) => updateDetalleLine(index, 'nombre', e.target.value)}
                                                className="col-span-4 bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                                            <input placeholder="Descripción" value={line.descripcion}
                                                onChange={(e) => updateDetalleLine(index, 'descripcion', e.target.value)}
                                                className="col-span-3 bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                                            <input type="number" placeholder="Cant." value={line.cantidad}
                                                onChange={(e) => updateDetalleLine(index, 'cantidad', e.target.value)}
                                                className="col-span-1 bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                                            <input type="number" placeholder="P. Unit." value={line.precioUnitario}
                                                onChange={(e) => updateDetalleLine(index, 'precioUnitario', e.target.value)}
                                                className="col-span-2 bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                                            <input type="number" placeholder="%Desc." value={line.descuentoPct}
                                                onChange={(e) => updateDetalleLine(index, 'descuentoPct', e.target.value)}
                                                className="col-span-1 bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                                            <button type="button" onClick={() => removeDetalleLine(index)}
                                                disabled={dteForm.detalle.length <= 1}
                                                className="col-span-1 text-muted-foreground hover:text-destructive transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed flex justify-center">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addDetalleLine}
                                    className="mt-2 text-xs font-medium text-primary hover:underline">
                                    + Agregar línea
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Select label="Forma de Pago (SII)" value={dteForm.formaPago}
                                    onChange={(e) => setDteForm({ ...dteForm, formaPago: e.target.value })}>
                                    {DTE_FORMAS_PAGO.map(f => <option key={f} value={f}>{f}</option>)}
                                </Select>
                                <Select label="Medio de Pago (Opcional)" value={dteForm.medioPago}
                                    onChange={(e) => setDteForm({ ...dteForm, medioPago: e.target.value })}>
                                    <option value="">—</option>
                                    {DTE_MEDIOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {dteForm.formaPago === 'Crédito' && (
                                    <Input label="Fecha de Vencimiento" type="date"
                                        value={dteForm.fechaVencimiento}
                                        onChange={(e) => setDteForm({ ...dteForm, fechaVencimiento: e.target.value })} />
                                )}
                                <Input label="Descuento Global (%)" type="number" min="0" max="100"
                                    value={dteForm.descuentoGlobalPct}
                                    onChange={(e) => setDteForm({ ...dteForm, descuentoGlobalPct: e.target.value })} />
                            </div>

                            <Input label="Referencias (Opcional)" placeholder="Ej: Corresponde a mensualidad Julio 2026"
                                value={dteForm.referencias}
                                onChange={(e) => setDteForm({ ...dteForm, referencias: e.target.value })} />

                            <div className="border-t border-border pt-4">
                                <div className="max-w-xs ml-auto space-y-1.5 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{totales.subtotal.toLocaleString('es-CL')}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Descuento Global</span>
                                        <span>{totales.descuentoGlobalMonto.toLocaleString('es-CL')}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Monto Neto</span>
                                        <span>{totales.montoNeto.toLocaleString('es-CL')}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>{dteProject.afecto_iva ? 'IVA (19%)' : 'IVA (exento)'}</span>
                                        <span>{totales.iva.toLocaleString('es-CL')}</span>
                                    </div>
                                    <div className="flex justify-between text-foreground font-bold text-base pt-1.5 border-t border-border">
                                        <span>Total</span>
                                        <span>{totales.total.toLocaleString('es-CL')}</span>
                                    </div>
                                </div>
                            </div>

                            {emisionResultado && (
                                <div className={`p-3 rounded-lg border text-xs ${emisionResultado.ok
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
                                    : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>
                                    {emisionResultado.ok
                                        ? `Documento emitido — Folio ${emisionResultado.folio}${emisionResultado.trackId ? ` · Track ID ${emisionResultado.trackId}` : ''}`
                                        : `Error al emitir: ${emisionResultado.errorMensaje || emisionResultado.message || 'revisar el estado del CAF'}`}
                                </div>
                            )}

                            {ultimoDocumento?.detalle?.length > 0 && (
                                <button type="button" onClick={handleUsarUltimoDocumento}
                                    className="text-xs font-medium text-primary hover:underline text-left">
                                    Usar los mismos datos que el último documento (Folio {ultimoDocumento.folio})
                                </button>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={handleDteClose}
                                    className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors text-sm font-medium">
                                    Cerrar
                                </button>
                                <button type="button" onClick={handleDtePreviewPdf}
                                    className="flex-1 bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm">
                                    Vista Previa PDF
                                </button>
                                {(() => {
                                    const cafListo = dteForm.tipoDte === 33 ? estadoCaf.factura33 : estadoCaf.boleta39;
                                    return (
                                        <button type="button" onClick={handleEmitirDteReal}
                                            disabled={!cafListo || isEmitiendo}
                                            title={cafListo ? '' : 'Requiere CAF del SII (pendiente)'}
                                            className="flex-1 bg-emerald-600 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground">
                                            {isEmitiendo ? 'Emitiendo...' : 'Emitir DTE'}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            );
        })()}

        {emailModalState && (() => {
            const tpl = EMAIL_TEMPLATES[emailModalState.type];
            return (
                <EmailModal
                    proyecto={emailModalState.project}
                    draft={tpl.generator(emailModalState.project)}
                    title={tpl.title}
                    icon={tpl.icon}
                    onSend={(payload) => projectsService.sendProjectEmail(emailModalState.project.id, payload)}
                    onClose={() => setEmailModalState(null)}
                />
            );
        })()}
        </div>
    );
}
