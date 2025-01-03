import { UseFormReturn } from 'react-hook-form';
import Input from '@/components/ui/input';
import { Inputs } from '@/components/form/types';

type ExcelOrCsvNodeLinkMappingProps = {
  form: UseFormReturn<Inputs>;
}
const ExcelOrCsvNodeLinkMapping = ({ form }: ExcelOrCsvNodeLinkMappingProps) => (
    <>
      <div className="flex items-center space-x-4">
        <div className="w-20">Categories:</div>
        <div className="flex-grow">
          <Input
            placeholder="Column number for Categories"
            defaultValue={form.getValues('mapping.categories') || ''}
            onChange={(e) => {
              setTimeout(() => {
                const { value } = e.target;
                form.setValue('mapping.categories', value);
              }, 100);
            }}
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-20">Nodes:</div>
        <div className="flex-grow">
          <Input
            placeholder="Column number for Nodes"
            defaultValue={form.getValues('mapping.nodes') || ''}
            onChange={(e) => {
              setTimeout(() => {
                const { value } = e.target;
                form.setValue('mapping.nodes', value);
              }, 100);
            }}
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-20">Properties:</div>
        <div className="flex-grow">
          <Input
            placeholder="Column number for Properties"
            defaultValue={form.getValues('mapping.properties') || ''}
            onChange={(e) => {
              const { value } = e.target;
              form.setValue('mapping.properties', value);
            }}
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-20">Sources:</div>
        <div className="flex-grow">
          <Input
            placeholder="Column number for Sources"
            defaultValue={form.getValues('mapping.sources') || ''}
            onChange={(e) => {
              setTimeout(() => {
                const { value } = e.target;
                form.setValue('mapping.sources', value);
              }, 100);
            }}
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-20">Targets:</div>
        <div className="flex-grow">
          <Input
            placeholder="Column number for Targets"
            defaultValue={form.getValues('mapping.targets') || ''}
            onChange={(e) => {
              setTimeout(() => {
                const { value } = e.target;
                form.setValue('mapping.targets', value);
              }, 100);
            }}
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-20">Values:</div>
        <div className="flex-grow">
          <Input
            placeholder="Column number for Values"
            defaultValue={form.getValues('mapping.values') || ''}
            onChange={(e) => {
              setTimeout(() => {
                const { value } = e.target;
                form.setValue('mapping.values', value);
              }, 100);
            }}
          />
        </div>
      </div>
    </>
);

export default ExcelOrCsvNodeLinkMapping;
