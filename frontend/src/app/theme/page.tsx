import React from 'react';
import { Metadata } from 'next';
import ThemeShell from '@/components/shells/theme-shell';

const metadata: Metadata = {
  title: 'Theme',
  description: 'Manage your Theme'
};

const Theme = () => <ThemeShell></ThemeShell>;

export default Theme;
export { metadata };
