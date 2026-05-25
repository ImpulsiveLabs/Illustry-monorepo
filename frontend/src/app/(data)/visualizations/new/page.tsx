import { redirect } from 'next/navigation';

const NewVisualizationPage = () => {
  redirect('/visualizations?modal=new');
};

export default NewVisualizationPage;
