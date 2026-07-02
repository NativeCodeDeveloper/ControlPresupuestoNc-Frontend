'use client';

import { use } from 'react';
import WorkspaceDetail from '../../../../Synapse/WorkspaceDetail';

export default function WorkspaceDetailPage({ params }) {
    const { id } = use(params);
    return <WorkspaceDetail id={id} />;
}
