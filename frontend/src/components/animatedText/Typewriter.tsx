'use client';

import React from 'react';
import Cursor, { CursorProps } from './Cursor';
import { TypewriterProps, useTypewriter } from './hooks/useTypewriting';

type ComponentProps = {
  cursor?: boolean;
} & TypewriterProps &
  CursorProps;

const Typewriter = ({
  words = [],
  loop = 1,
  typeSpeed = 80,
  deleteSpeed = 50,
  delaySpeed = 1500,
  cursor = false,
  cursorStyle = '|',
  cursorColor = 'inherit',
  cursorBlinking = true,
  onLoopDone,
  onType,
  onDelay,
  onDelete
}: ComponentProps): React.JSX.Element => {
  const [text] = useTypewriter({
    words,
    loop,
    typeSpeed,
    deleteSpeed,
    delaySpeed,
    onLoopDone,
    onType,
    onDelay,
    onDelete
  });

  return (
    <>
      <span>{text}</span>
      {cursor && (
        <Cursor
          cursorStyle={cursorStyle}
          cursorColor={cursorColor}
          cursorBlinking={cursorBlinking}
        />
      )}
    </>
  );
};

export default Typewriter;
