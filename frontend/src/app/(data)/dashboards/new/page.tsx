import { redirect } from 'next/navigation';

const NewDashboardPage = () => {
  redirect('/dashboards?modal=new');
};

export default NewDashboardPage;
