/* eslint-disable @typescript-eslint/no-explicit-any */
import { UseFormReturn } from 'react-hook-form';
import { Inputs } from '@/components/form/types';
import { useLocale } from '@/components/providers/locale-provider';
import VisualizationDetails from './visualizationDetails';
import VisualizationType from './visualizationType';

type XMLMappingTabProps = {
  form: UseFormReturn<Inputs>;
  router: any;
  fileDetails: boolean;
}
const XMLMappingTab = ({
  fileDetails,
  form,
  router
}: XMLMappingTabProps) => {
  const { t } = useLocale();

  return (
      <>
        {fileDetails ? (
          <p className="text-green-500">
            {t('mapping.xmlNoSpecialMapping')}
          </p>
        ) : (
          <>
            <VisualizationType form={form} router={router} exclude={false} />
            <VisualizationDetails form={form} />
          </>
        )}
      </>
  );
};

export default XMLMappingTab;
