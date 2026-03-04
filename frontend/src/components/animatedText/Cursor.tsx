import React from 'react';

type CursorProps = {
  /** Enable cursor blinking animation */
  cursorBlinking?: boolean;
  /** Change cursor style */
  cursorStyle?: React.ReactNode;
  /** Change cursor color */
  cursorColor?: string;
};

const MemoizedCursor = ({
  cursorBlinking = true,
  cursorStyle = '|',
  cursorColor = 'inherit'
}: CursorProps): React.JSX.Element => (
  <span
    style={{ color: cursorColor }}
    className={`blinkingCursor ${cursorBlinking ? 'blinking' : ''}`}
  >
    {cursorStyle}
  </span>
);

const Cursor = React.memo(MemoizedCursor);

export default Cursor;
export type { CursorProps };
