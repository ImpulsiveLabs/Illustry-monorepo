/* eslint-disable no-unused-vars */
import { ExtFile } from '@files-ui/react';
import { UseFormReturn } from 'react-hook-form';
import { useLocale } from '@/components/providers/locale-provider';
import {
  FormLabel,
  FormControl,
  FormItem,
  UncontrolledFormMessage
} from '@/components/ui/form';
import { Inputs } from '@/components/form/types';
import FileUpload from '../../file-upload';

type VisualizationFileUploadProps = {
  form: UseFormReturn<Inputs>;
  acceptedFiles: ExtFile[];
  updateFiles: (files: ExtFile[]) => void;
  removeFile: (id: string | number | undefined) => void;
}

const ExcelFileFormatter = ({
  form,
  acceptedFiles,
  updateFiles,
  removeFile
}: VisualizationFileUploadProps) => {
  const { t } = useLocale();
  return (
    <>
      <FormItem className="flex w-full flex-col gap-1.5">
        <FormLabel>{t('common.files')}</FormLabel>
        <FormControl>
          <FileUpload
            acceptedFiles={acceptedFiles}
            updateFiles={updateFiles}
            removeFile={removeFile}
            fileFormat="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          />
        </FormControl>
        <UncontrolledFormMessage
          message={form.formState.errors.fileType?.message}
        />
      </FormItem>
    </>
  );
};
export default ExcelFileFormatter;
