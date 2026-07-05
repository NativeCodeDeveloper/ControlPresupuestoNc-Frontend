import { Suspense } from 'react';
import CRM from '../../Clientes/CRM';

export const metadata = { title: 'Clientes CRM | NativeCode Finance' };

export default function ClientesPage() {
    return <Suspense><CRM /></Suspense>;
}
