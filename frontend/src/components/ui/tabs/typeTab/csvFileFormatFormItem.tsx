/* eslint-disable no-unused-vars */
import { ExtFile } from '@files-ui/react';
import { UseFormReturn } from 'react-hook-form';
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

const CSVFileFormatter = ({
  form,
  acceptedFiles,
  updateFiles,
  removeFile
}: VisualizationFileUploadProps) => (
    <>
      <FormItem className="flex w-full flex-col gap-1.5">
        <FormLabel>Files</FormLabel>
        <FormControl>
          <FileUpload
            acceptedFiles={acceptedFiles}
            updateFiles={updateFiles}
            removeFile={removeFile}
            fileFormat="text/csv"
          />
        </FormControl>
        <UncontrolledFormMessage
          message={form.formState.errors.fileType?.message}
        />
      </FormItem>
    </>
);

export default CSVFileFormatter;
