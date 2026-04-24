import type { CSSProperties } from 'react';
import { Toaster as RadToaster } from 'sonner';

const toastStyle = {
  '--background': 'hsl(var(--background))',
  '--foreground': 'hsl(var(--foreground))',
  '--border': 'hsl(var(--border))'
} as CSSProperties;

const Toaster = () => (
  <RadToaster
    position="bottom-right"
    richColors
    closeButton
    toastOptions={{
      className: 'shadow-lg',
      style: toastStyle
    }}
  />
);
export default Toaster;
