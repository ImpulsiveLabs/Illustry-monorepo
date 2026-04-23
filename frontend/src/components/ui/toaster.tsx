import { Toaster as RadToaster } from 'sonner';

const Toaster = () => (
  <RadToaster
    position="bottom-right"
    richColors
    closeButton
    toastOptions={{
      className: 'shadow-lg'
    }}
  />
);
export default Toaster;
