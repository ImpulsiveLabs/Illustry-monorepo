import { UseFormReturn } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { FileTypes } from '@illustry/types';
import { Inputs } from '@/components/form/types';
import { useLocale } from '@/components/providers/locale-provider';
import { TabsContent } from '../../tabs';
import JSONMappingTab from './jsonMappingTab';
import ExcelOrCsvMappingTab from './excelOrCsvMappingTab';
import {
  FormField, FormItem, FormControl, FormMessage
} from '../../form';
import Checkbox from '../../checkbox';
import XMLMappingTab from './xmlMappingTab';

type MappingTabProps = {
  selectedFileType: string;
  form: UseFormReturn<Inputs>;
  router: any;
}

const MappingTab = ({
  selectedFileType,
  form,
  router
}: MappingTabProps) => {
  const { t } = useLocale();
  const [fileDetails, setFileDetails] = useState<boolean>(false);
  const canUseAllDetails = selectedFileType === FileTypes.FileType.JSON;
  const handleFullDetails = (value: boolean) => {
    const nextValue = canUseAllDetails ? value : false;
    setFileDetails(nextValue);
    form.setValue('fullDetails', nextValue);
  };
  useEffect(() => {
    if (!canUseAllDetails && fileDetails) {
      setFileDetails(false);
      form.setValue('fullDetails', false);
    }
  }, [canUseAllDetails, fileDetails, form]);
  const renderMapping = (fType: string, fDetails: boolean) => {
    if (fType) {
      switch (fType) {
        case FileTypes.FileType.JSON:
          return (
            <>
              <JSONMappingTab
                form={form}
                fileDetails={fDetails}
                router={router}
              />
            </>
          );
        case FileTypes.FileType.XML:
          return (
            <>
              <XMLMappingTab
                form={form}
                fileDetails={fDetails}
                router={router}
              />
            </>
          );
        case FileTypes.FileType.EXCEL:
        case FileTypes.FileType.CSV:
          return (
            <>
              <ExcelOrCsvMappingTab
                form={form}
                router={router}
                fileDetails={fDetails}
                selectedFileType={fType}
              />
            </>
          );
        default:
          return null;
      }
    }
    return null;
  };
  return (
    <TabsContent className="w-50%" value="mapping">
      {canUseAllDetails && <div className="col-span-2">
        <FormField
          control={form.control}
          name="fullDetails"
          render={({ field }) => (
            <>
              <FormItem>
                <FormControl>
                  <div className=" flex flex-row items-center gap-2">
                    <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t('mapping.fileHasAllDetails')}
                    </p>
                    <Checkbox
                      className="ml-[3%] mt-[0.5%]"
                      checked={fileDetails}
                      onCheckedChange={(isChecked) => {
                        handleFullDetails(isChecked as boolean);
                        field.onChange(canUseAllDetails ? isChecked : false);
                      }}
                    />
                  </div>
                </FormControl>
              </FormItem>
              <FormMessage />
            </>
          )}
        />
      </div>}
      {renderMapping(selectedFileType, fileDetails)}
    </TabsContent>
  );
};

export default MappingTab;
