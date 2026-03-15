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
