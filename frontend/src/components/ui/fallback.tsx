import React from 'react';
import Icons from '../icons';

const Fallback = () => (
    <div className="flex h-screen justify-center items-center">
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <Icons.spinner role='img' className="h-16 w-16 animate-spin" />
      </div>
    </div>
);

export default Fallback;
