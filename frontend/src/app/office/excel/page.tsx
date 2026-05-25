import type { Metadata } from 'next';
import ExcelAddinClient from '@/components/office/excel-addin-client';

const metadata: Metadata = {
  title: 'Illustry Excel Add-in'
};

const ExcelOfficeAddinPage = () => <ExcelAddinClient />;

export default ExcelOfficeAddinPage;
export { metadata };
