import { Suspense } from 'react';
import MetricasNegocio from '../../../Clientes/MetricasNegocio';

export const metadata = { title: 'Métricas de Negocio | NativeCode Finance' };

export default function MetricasNegocioPage() {
    return (
        <Suspense>
            <MetricasNegocio />
        </Suspense>
    );
}
