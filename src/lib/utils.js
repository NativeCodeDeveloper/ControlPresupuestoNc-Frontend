import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

// Formateador global de pesos chilenos (CLP)
// Uso: formatCLP(300000) → "$300.000"
const _clpFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
});

export function formatCLP(value) {
    return _clpFormatter.format(Number(value) || 0);
}

// Normaliza un RUT chileno al formato que exige el SII: cuerpo numérico + guion + DV,
// sin puntos (ej: "76.123.456-7" → "76123456-7").
export function normalizeRut(value) {
    if (!value) return value;
    const clean = String(value).replace(/[.\s]/g, '').toUpperCase();
    const match = clean.match(/^(\d{1,8})-?([\dK])$/);
    if (!match) return clean;
    return `${match[1]}-${match[2]}`;
}
