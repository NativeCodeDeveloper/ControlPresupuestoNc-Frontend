import { Suspense } from 'react';
import HealthScore from '../../../Clientes/HealthScore';

export const metadata = { title: 'Health Score | NativeCode Finance' };

export default function HealthScorePage() {
    return (
        <Suspense>
            <HealthScore />
        </Suspense>
    );
}
