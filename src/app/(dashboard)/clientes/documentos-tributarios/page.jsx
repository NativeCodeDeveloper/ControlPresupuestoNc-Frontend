import { Suspense } from 'react';
import DocumentosTributarios from '../../../Clientes/DocumentosTributarios';

export const metadata = { title: 'Documentos Tributarios | NativeCode Finance' };

export default function DocumentosTributariosPage() {
    return (
        <Suspense>
            <DocumentosTributarios />
        </Suspense>
    );
}
