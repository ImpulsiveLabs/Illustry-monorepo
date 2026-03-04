import React from 'react';
import { Metadata } from 'next';
import PlaygroundShell from '@/components/shells/playground-shell';

const metadata: Metadata = {
  title: 'Playground',
  description: 'Play with data'
};

const Playground = () => (
    <>
      <PlaygroundShell></PlaygroundShell>
    </>
);

export default Playground;
export { metadata };
