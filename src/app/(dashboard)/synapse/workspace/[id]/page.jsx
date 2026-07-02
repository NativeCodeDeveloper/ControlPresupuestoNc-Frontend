import WorkspaceDetail from '../../../../Synapse/WorkspaceDetail';

export const metadata = { title: 'Workspace | NativeCode Finance' };

export default async function WorkspaceDetailPage({ params }) {
    const { id } = await params;
    return <WorkspaceDetail id={id} />;
}
