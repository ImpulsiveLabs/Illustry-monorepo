import { redirect } from 'next/navigation';

type UpdateProjectPageProps = {
  params: Promise<{ projectName: string }>;
};

const UpdateProjectPage = async ({ params }: UpdateProjectPageProps) => {
  const { projectName } = await params;
  redirect(`/projects?edit=${encodeURIComponent(projectName)}`);
};

export default UpdateProjectPage;
