import ProductionCockpit from '../../../Synapse/ProductionCockpit';
import ServidoresBackend from '../../../Synapse/ServidoresBackend';

export const metadata = { title: 'Production Cockpit | NativeCode Finance' };

export default function CockpitPage() {
    return (
        <>
            <ProductionCockpit />
            <ServidoresBackend />
        </>
    );
}
