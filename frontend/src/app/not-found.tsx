'use client';

import Link from 'next/link';
import React from 'react';
import { useLocale } from '@/components/providers/locale-provider';

const NotFound = () => {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">
        {t('notFound.title')}
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        {t('notFound.description')}
      </p>
      <Link
        href="/"
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4
          rounded focus:outline-none focus:shadow-outline-blue active:bg-blue-800"
      >
        {t('notFound.goHome')}
      </Link>
    </div>
  );
};

export default NotFound;
