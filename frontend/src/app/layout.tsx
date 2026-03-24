import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import siteConfig from '@/config/site';
import { fontMono, fontSans } from '@/lib/fonts';
import { SUPPORTED_LOCALES } from '@/lib/i18n/messages';
import { cn } from '@/lib/utils';
import Toaster from '@/components/ui/toaster';
import {
  ThemeColorsProvider,
  ThemeProvider
} from '@/components/providers/theme-provider';
import { ActiveProjectProvider } from '@/components/providers/active-project-provider';
import { LocaleProvider } from '@/components/providers/locale-provider';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://illustry.app';
const metadataBase = new URL(siteUrl);
const supportedSeoLocales = SUPPORTED_LOCALES.filter((locale) => locale !== 'en');

const metadata: Metadata = {
  metadataBase,
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`
  },
  description: `${siteConfig.description}. Create, configure, and ship production-ready dashboards with advanced ECharts visualizations.`,
  keywords: [
    'Illustry',
    'data visualization platform',
    'ECharts 6',
    'dashboard builder',
    'visual analytics',
    'chart playground',
    'Next.js',
    'React',
    'Tailwind CSS',
    'open source analytics'
  ],
  authors: [
    {
      name: 'Vladimir',
      url: 'https://github.com/mrVladimirN'
    }
  ],
  creator: 'mrVladimirN',
  publisher: 'Illustry',
  category: 'Data Visualization',
  applicationName: 'Illustry',
  alternates: {
    canonical: '/'
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'Illustry | Visualization Hub',
    description: 'Build rich, multilingual, SEO-ready dashboards and visual analytics with Illustry and ECharts 6.',
    siteName: 'Illustry',
    locale: 'en_US',
    alternateLocale: supportedSeoLocales
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Illustry | Visualization Hub',
    description: 'Build visual analytics dashboards with ECharts 6, multilingual UX, and production-ready workflows.',
    creator: '@mrVladimirN'
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  },
  other: {
    'theme-color': '#0f172a',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default'
  }
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

        <LocaleProvider>
          <ThemeColorsProvider>
            <ActiveProjectProvider>
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                {children}
              </ThemeProvider>
            </ActiveProjectProvider>
          </ThemeColorsProvider>
        </LocaleProvider>
        <Toaster />
      </body>
    </html>
  </>
);

export default RootLayout;
export { metadata };
