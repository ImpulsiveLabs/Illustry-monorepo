/* eslint-disable no-return-assign */
/* eslint-disable no-unused-vars */
import { useRef, KeyboardEvent } from 'react';

type DefaultThemesProps = {
  colorPalette: { [key: string]: string[] };
  handleApplyTheme: (schemeName: string) => void;
  selectedSchemeName?: string | null;
};

const DefaultThemesAccordion = ({
  colorPalette,
  handleApplyTheme,
  selectedSchemeName
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
          ref={(el) => {
            themeRefs.current[index] = el;
          }}
          role="button"
          tabIndex={0}
          className={`relative flex flex-nowrap items-center gap-1 overflow-x-auto border m-1 rounded cursor-pointer p-2
           focus:outline-none focus:ring-2 hover:ring-2 ${
            selectedSchemeName === schemeName
              ? 'border-blue-500 ring-2 ring-blue-400'
              : 'border-gray-300 focus:ring-blue-500 hover:ring-blue-300'
          }`}
          onClick={() => handleClick(schemeName, index)}
          onKeyDown={(e) => handleKeyDown(e, schemeName)}
        >
          {selectedSchemeName === schemeName && (
            <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-blue-600 ring-2 ring-white dark:ring-gray-900" />
          )}
          {colorPalette[schemeName]?.map((color, i) => (
            <div
              key={i}
              style={{ backgroundColor: color }}
              className="h-5 w-5 shrink-0 border border-gray-300 rounded"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default DefaultThemesAccordion;
