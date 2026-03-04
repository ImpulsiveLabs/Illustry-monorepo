import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import siteConfig from '@/config/site';
import { fontMono, fontSans } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import Toaster from '@/components/ui/toaster';
import {
  ThemeColorsProvider,
  ThemeProvider
} from '@/components/providers/theme-provider';
import { ActiveProjectProvider } from '@/components/providers/active-project-provider';

const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: [
    'Next.js',
    'React',
    'Tailwind CSS',
    'Server Components',
    'Server Actions',
    'VisualizationHub'
  ],
  authors: [
    {
      name: 'Vladimir',
      url: 'https://github.com/mrVladimirN'
    }
  ],
  creator: 'mrVladimirN'
};

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <>
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          fontMono.variable
        )}
      >

        <ThemeColorsProvider>
          <ActiveProjectProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
            </ThemeProvider>
          </ActiveProjectProvider>
        </ThemeColorsProvider>
        <Toaster />
      </body>
    </html>
  </>
);

export default RootLayout;
export { metadata };
