import { Suspense } from 'react';
import Boveda from '../../../Clientes/Boveda';

export const metadata = { title: 'Bóveda | NativeCode Finance' };

export default function BovedaPage() {
    return (
        <Suspense>
            <Boveda />
        </Suspense>
    );
}
