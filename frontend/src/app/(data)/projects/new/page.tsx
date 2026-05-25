import { redirect } from 'next/navigation';

const NewProjectPage = () => {
  redirect('/projects?modal=new');
};

export default NewProjectPage;
