import Link from 'next/link';
import React from 'react';

const NotFound = () => (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">
        Oops! Not Found
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        Sorry, we couldn&apos;t find the requested resource.
      </p>
      <Link href="/">
        <a
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4
            rounded focus:outline-none focus:shadow-outline-blue active:bg-blue-800"
        >
          Go to Main Page
        </a>
      </Link>
    </div>
);

export default NotFound;
