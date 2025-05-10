/* eslint-disable no-return-assign */
/* eslint-disable no-unused-vars */
import { useRef, KeyboardEvent } from 'react';

type DefaultThemesProps = {
  colorPalette: { [key: string]: string[] };
  handleApplyTheme: (schemeName: string) => void;
};

const DefaultThemesAccordion = ({
  colorPalette,
  handleApplyTheme
}: DefaultThemesProps) => {
  const themeRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleClick = (schemeName: string, index: number) => {
    handleApplyTheme(schemeName);
    themeRefs.current[index]?.focus(); // Programmatically focus to trigger focus styles
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, schemeName: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent page scroll on Space
      handleApplyTheme(schemeName);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {Object.keys(colorPalette).map((schemeName, index) => (
        <div
          key={index}
          ref={(el) => (themeRefs.current[index] = el)}
          role="button"
          tabIndex={0}
          className="flex flex-wrap border border-gray-300 m-1 rounded cursor-pointer p-2
           focus:outline-none focus:ring-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-300"
          onClick={() => handleClick(schemeName, index)}
          onKeyDown={(e) => handleKeyDown(e, schemeName)}
        >
          {colorPalette[schemeName]?.map((color, i) => (
            <div
              key={i}
              style={{ backgroundColor: color }}
              className="w-5 h-5 m-0.5 border border-gray-300 rounded"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default DefaultThemesAccordion;
