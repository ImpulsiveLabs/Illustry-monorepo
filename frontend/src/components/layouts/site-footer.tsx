'use client';

import { Shell } from '@/components/shells/shell';
import { useLocale } from '@/components/providers/locale-provider';

const SiteFooter = () => {
  const { t } = useLocale();

  return (
    <footer className="w-full border-t bg-background">
      <Shell as="div">
        <section
          aria-labelledby="footer-content-heading"
          className="flex flex-col gap-10 lg:flex-row lg:gap-20 items-center justify-center lg:justify-between"
        >
          <div>
            © {new Date().getFullYear()} {t('footer.rightsReserved')}
          </div>
        </section>
      </Shell>
    </footer>
  );
};

export default SiteFooter;
