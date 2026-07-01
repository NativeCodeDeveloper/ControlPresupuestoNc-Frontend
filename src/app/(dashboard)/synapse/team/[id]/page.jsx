import Synapse from '../../../../Synapse/Synapse';

export default async function TeamPage({ params }) {
    const { id } = await params;
    return <Synapse teamId={id} />;
}
