'use client';

import React from 'react';
import { reducer } from './reducer';

type TypewriterProps = {
  onLoopDone?: () => void;
  // eslint-disable-next-line no-unused-vars
  onType?: (count: number) => void;
  onDelete?: () => void;
  onDelay?: () => void;
  words: string[];
  loop?: number | boolean;
  typeSpeed?: number;
  deleteSpeed?: number;
  delaySpeed?: number;
};

type TypewriterHelper = {
  isType: boolean;
  isDelay: boolean;
  isDelete: boolean;
  isDone: boolean;
};

const useTypewriter = ({
  words = ['Hello World!', 'This is', 'a simple Typewriter'],
  loop = 1,
  typeSpeed = 80,
  deleteSpeed = 50,
  delaySpeed = 1500,
  onLoopDone,
  onType,
  onDelete,
  onDelay
}: TypewriterProps): [string, TypewriterHelper] => {
  const [{ speed, text, count }, dispatch] = React.useReducer(reducer, {
    speed: typeSpeed,
    text: '',
    count: 0
  });

  // Refs
  const loops = React.useRef(0);
  const isDone = React.useRef(false);
  const isDelete = React.useRef(false);
  const isType = React.useRef(false);
  const isDelay = React.useRef(false);

  const handleTyping = React.useCallback(() => {
    const index = count % words.length;
    const fullWord = words[index];

    if (!isDelete.current && fullWord) {
      dispatch({ type: 'TYPE', payload: fullWord, speed: typeSpeed });
      isType.current = true;

      if (text === fullWord) {
        dispatch({ type: 'DELAY', payload: delaySpeed });
        isType.current = false;
        isDelay.current = true;

        setTimeout(() => {
          isDelay.current = false;
          isDelete.current = true;
        }, delaySpeed);

        if ((loop as number) > 0) {
          loops.current += 1;
          if (loops.current / words.length === loop) {
            isDelay.current = false;
            isDone.current = true;
          }
        }
      }
    } else if (fullWord) {
      dispatch({ type: 'DELETE', payload: fullWord, speed: deleteSpeed });
      if (text === '') {
        isDelete.current = false;
        dispatch({ type: 'COUNT' });
      }
    }

    if (isType.current) {
      if (onType) onType(loops.current);
    }

    if (isDelete.current) {
      if (onDelete) onDelete();
    }

    if (isDelay.current) {
      if (onDelay) onDelay();
    }
  }, [
    count,
    delaySpeed,
    deleteSpeed,
    loop,
    typeSpeed,
    words,
    text,
    onType,
    onDelete,
    onDelay
  ]);

  React.useEffect(() => {
    const typing = setTimeout(handleTyping, speed);

    if (isDone.current) clearTimeout(typing);

    return () => clearTimeout(typing);
  }, [handleTyping, speed]);

  React.useEffect(() => {
    if (!onLoopDone) return;

    if (isDone.current) {
      onLoopDone();
    }
  }, [onLoopDone]);

  return [
    text,
    {
      isType: isType.current,
      isDelay: isDelay.current,
      isDelete: isDelete.current,
      isDone: isDone.current
    }
  ];
};

export {
  useTypewriter
};

export type {
  TypewriterProps,
  TypewriterHelper
};
