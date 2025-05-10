/* eslint-disable no-return-assign */
/* eslint-disable no-unused-vars */
import {
  Dispatch, RefObject, SetStateAction, useEffect, useRef
} from 'react';
import { useThemeColors } from '@/components/providers/theme-provider';
import Icons from '@/components/icons';
import ColorPicker from '../colorPicker';
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from '../tabs';

// TypeScript interface for theme structure
interface ThemeColors {
  [key: string]: {
    light: { colors: string[] };
    dark: { colors: string[] };
  };
}

interface GenericThemesProps {
  activeColorPickerIndex: number | null;
  handleColorChange: (
    newColor: string,
    index: number,
    visualization: string,
    theme: 'light' | 'dark'
  ) => void;
  colorPickerRef: RefObject<HTMLDivElement>;
  setActiveColorPickerIndex: Dispatch<SetStateAction<number | null>>;
  visualization: string;
  handleColorDelete: (visualization: string, theme: 'light' | 'dark') => void;
  handleColorAdd: (visualization: string, theme: 'light' | 'dark') => void;
}

const GenericThemesAccordion = ({
  activeColorPickerIndex,
  handleColorChange,
  setActiveColorPickerIndex,
  colorPickerRef,
  visualization,
  handleColorDelete,
  handleColorAdd
}: GenericThemesProps) => {
  const activeTheme = useThemeColors() as ThemeColors;
  const activeVisualization = activeTheme[visualization];
  const lightColorsLength = activeVisualization?.light.colors.length;
  const darkColorsLength = activeVisualization?.dark.colors.length;
  const swatchRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Validate hex color
  const isValidHex = (color: string) => /^#([0-9A-F]{3}){1,2}$/i.test(color);

  // Handle click outside to close color picker
  const handleClickOutside = (event: MouseEvent) => {
    if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
      setActiveColorPickerIndex(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Common color row rendering function
  const renderColorRow = (theme: 'light' | 'dark', colors: string[], colorsLength: number) => (
    <div className="flex items-start mt-4 gap-4">
      <div className="text-sm font-medium pr-4 min-w-[80px]">
        Colors
      </div>
      <div className="flex flex-col gap-2 w-[75%] relative">
        {colors.map((color, index) => (
          <div className="flex items-center gap-2" key={index}>
            <input
              type="text"
              className={`w-full rounded p-1 border ${isValidHex(color) ? 'border-gray-300' : 'border-red-500'} 
              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
              value={color}
              onChange={(e) => {
                const newColor = e.target.value;
                if (isValidHex(newColor) || newColor === '') {
                  handleColorChange(newColor, index, visualization, theme);
                }
              }}
              placeholder="#FFFFFF"
            />
            <div
              ref={(el) => (swatchRefs.current[index] = el)}
              onClick={() => setActiveColorPickerIndex(index)}
              style={{ backgroundColor: color }}
              className="w-6 h-6 border border-gray-300 rounded cursor-pointer hover:ring-2 hover:ring-blue-500"
            />
            {activeColorPickerIndex === index && (
              <div
                ref={colorPickerRef}
                className="absolute z-10 bg-white dark:bg-gray-800 p-2
                 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700"
                style={{
                  top: swatchRefs.current[index]?.getBoundingClientRect().bottom
                    ? `${swatchRefs.current[index]!.getBoundingClientRect().bottom
                    - swatchRefs.current[index]!.getBoundingClientRect().top + 8}px`
                    : '0',
                  right: '0'
                }}
              >
                <ColorPicker
                  initialColor={colors[activeColorPickerIndex] as string}
                  changeColor={(newColor: string) => handleColorChange(newColor, activeColorPickerIndex!, visualization, theme)}
                />
                <button
                  onClick={() => setActiveColorPickerIndex(null)}
                  className="absolute top-1 right-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Icons.close className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <button
            className={`w-6 h-6 border border-gray-300 rounded flex items-center justify-center cursor-pointer
             hover:bg-gray-100 dark:hover:bg-gray-700 ${colorsLength >= 10 ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => colorsLength < 10 && handleColorAdd(visualization, theme)}
          >
            <Icons.add className={`text-gray-500 w-4 h-4 ${colorsLength >= 10 ? 'opacity-50' : ''}`} />
          </button>
          <button
            className={`w-6 h-6 border border-gray-300 rounded flex items-center justify-center cursor-pointer
             hover:bg-gray-100 dark:hover:bg-gray-700 ${colorsLength <= 3 ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => colorsLength > 3 && handleColorDelete(visualization, theme)}
          >
            <Icons.remove className={`text-gray-500 w-4 h-4 ${colorsLength <= 3 ? 'opacity-50' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Tabs defaultValue="Light" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="Light">Light</TabsTrigger>
        <TabsTrigger value="Dark">Dark</TabsTrigger>
      </TabsList>
      <TabsContent value="Light">
        {renderColorRow('light', activeVisualization?.light.colors as string[], lightColorsLength as number)}
      </TabsContent>
      <TabsContent value="Dark">
        {renderColorRow('dark', activeVisualization?.dark.colors as string[], darkColorsLength as number)}
      </TabsContent>
    </Tabs>
  );
};

export default GenericThemesAccordion;
