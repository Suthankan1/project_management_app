import GitHubProjectPage from './GitHubProjectPage';

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <GitHubProjectPage projectId={projectId} />;
}
