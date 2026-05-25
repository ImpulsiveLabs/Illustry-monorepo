'use client';

import React from 'react';
import Balance from 'react-wrap-balancer';
import Link from 'next/link';
import Typewriter from '@/components/animatedText/Typewriter';
import { useLocale } from '@/components/providers/locale-provider';
import { Shell } from '@/components/shells/shell';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Home = () => {
  const { t } = useLocale();
  const animatedText = [t('home.wordUnderstand'), t('home.wordLearn'), t('home.wordVisualize')];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/40 px-4">
      <Shell as="div" className="gap-10">
        <section
          aria-labelledby="hero-heading"
          className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6 pb-8 pt-6 text-center md:pb-12 md:pt-10 lg:py-20"
        >
          <h1
            id="hero-heading"
            className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl lg:leading-[1.08]"
          >
            <span className="text-primary">
              <Typewriter
                words={animatedText}
                loop
                cursor
                cursorStyle="_"
                typeSpeed={70}
                deleteSpeed={50}
                delaySpeed={1000}
              />
            </span>
            {' '}
            {t('home.wordYourData')}
          </h1>
          <Balance className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            {t('home.subtitle')}
          </Balance>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/projects"
              className={cn(buttonVariants({ size: 'lg' }), 'shadow-sm')}
            >
              {t('nav.projects')}
            </Link>
            <Link
              href="https://impulsivelabs.github.io/Illustry-monorepo/"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            >
              {t('home.documentation')}
            </Link>
          </div>
        </section>
      </Shell>
    </div>
  );
};

export default Home;
