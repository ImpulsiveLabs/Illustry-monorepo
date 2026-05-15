import React from 'react';
import { Metadata } from 'next';
import ThemeShell from '@/components/shells/theme-shell';

const metadata: Metadata = {
  title: 'Visualization palettes',
  description: 'Customize chart colors and visualization palettes'
};

const Theme = () => <ThemeShell></ThemeShell>;

export default Theme;
export { metadata };
