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
    <div className="flex flex-col items-center justify-center h-screen">
      <Shell as="div" className="gap-12">
        <section
          aria-labelledby="hero-heading"
          className="mx-auto flex w-full max-w-[64rem] flex-col items-center
           justify-center gap-4 pb-8 pt-6 text-center md:pb-12 md:pt-10 lg:py-28"
        >
          <h1 className="text-3xl font-bold leading-tight tracking-tighter
           md:text-5xl lg:text-6xl lg:leading-[1.1] text-emerald-500 dark:text-cyan-200">
            <Typewriter
              words={animatedText}
              loop={true}
              cursor
              cursorStyle="_"
              typeSpeed={70}
              deleteSpeed={50}
              delaySpeed={1000}
            />
          </h1>
          <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]  ">
            &nbsp;&nbsp;{t('home.wordYourData')}
          </h1>
          <Balance className="max-w-[46rem] text-lg text-muted-foreground mt-[5%] sm:text-xl">
            {t('home.subtitle')}
          </Balance>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="https://impulsivelabs.github.io/Illustry-monorepo/"
              className={cn(
                buttonVariants({
                  size: 'lg'
                })
              )}
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
