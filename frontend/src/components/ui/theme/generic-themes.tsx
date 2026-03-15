import {
  useEffect, useMemo, useState
} from 'react';
import { useThemeColors } from '@/components/providers/theme-provider';
import Icons from '@/components/icons';
import ColorPicker from '../colorPicker';
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from '../tabs';
import {
  Popover, PopoverContent, PopoverTrigger
} from '../popover';

interface ThemeColors {
  [key: string]: {
    light: { colors: string[] };
    dark: { colors: string[] };
  };
}

interface GenericThemesProps {
  handleColorChange: (
    newColor: string,
    index: number,
    visualization: string,
    theme: 'light' | 'dark'
  ) => void;
  visualization: string;
  handleColorDelete: (visualization: string, theme: 'light' | 'dark') => void;
  handleColorAdd: (visualization: string, theme: 'light' | 'dark') => void;
}

const GenericThemesAccordion = ({
  handleColorChange,
  visualization,
  handleColorDelete,
  handleColorAdd
}: GenericThemesProps) => {
  const activeTheme = useThemeColors() as ThemeColors;
  const rawVisualization = activeTheme[visualization];
  const activeVisualization = {
    light: {
      colors: Array.isArray(rawVisualization?.light?.colors)
        ? rawVisualization.light.colors
        : []
    },
    dark: {
      colors: Array.isArray(rawVisualization?.dark?.colors)
        ? rawVisualization.dark.colors
        : []
    }
  };
  const lightColorsLength = activeVisualization?.light.colors.length;
  const darkColorsLength = activeVisualization?.dark.colors.length;
  const [activePickerKey, setActivePickerKey] = useState<string | null>(null);
  const [draftColors, setDraftColors] = useState<Record<string, string>>({});

  // Validate hex color
  const isValidHex = (color: string) => /^#([0-9A-F]{3}){1,2}$/i.test(color);
  const inputKey = (theme: 'light' | 'dark', index: number) => `${theme}-${index}`;
  const normalizedColors = useMemo(
    () => ({
      light: activeVisualization.light.colors,
      dark: activeVisualization.dark.colors
    }),
    [activeVisualization]
  );

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    normalizedColors.light.forEach((color, index) => {
      nextDrafts[inputKey('light', index)] = color;
    });
    normalizedColors.dark.forEach((color, index) => {
      nextDrafts[inputKey('dark', index)] = color;
    });
    setDraftColors((previous) => {
      const previousSerialized = JSON.stringify(previous);
      const nextSerialized = JSON.stringify(nextDrafts);
      return previousSerialized === nextSerialized ? previous : nextDrafts;
    });
  }, [normalizedColors]);

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
              className={`w-full rounded p-1 border ${isValidHex(draftColors[inputKey(theme, index)] ?? color) ? 'border-gray-300' : 'border-red-500'} 
              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
              value={draftColors[inputKey(theme, index)] ?? color}
              onChange={(e) => {
                setDraftColors((prev) => ({
                  ...prev,
                  [inputKey(theme, index)]: e.target.value
                }));
              }}
              onBlur={() => {
                const rawValue = (draftColors[inputKey(theme, index)] ?? '').trim();
                const normalized = rawValue && rawValue.startsWith('#') ? rawValue : `#${rawValue}`;
                if (isValidHex(normalized)) {
                  handleColorChange(normalized, index, visualization, theme);
                  setDraftColors((prev) => ({
                    ...prev,
                    [inputKey(theme, index)]: normalized
                  }));
                  return;
                }
                setDraftColors((prev) => ({
                  ...prev,
                  [inputKey(theme, index)]: color
                }));
              }}
              placeholder="#FFFFFF"
            />
            <Popover
              open={activePickerKey === inputKey(theme, index)}
              onOpenChange={(isOpen) => setActivePickerKey(isOpen ? inputKey(theme, index) : null)}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  style={{ backgroundColor: color }}
                  className="h-8 w-8 rounded border border-gray-300 hover:ring-2 hover:ring-blue-500"
                  aria-label={`Open color picker ${theme} ${index + 1}`}
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="relative">
                  <ColorPicker
                    initialColor={color}
                    changeColor={(newColor: string) => {
                      handleColorChange(newColor, index, visualization, theme);
                      setDraftColors((prev) => ({
                        ...prev,
                        [inputKey(theme, index)]: newColor
                      }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setActivePickerKey(null)}
                    className="absolute right-1 top-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    aria-label="Close color picker"
                  >
                    <Icons.close className="h-4 w-4" />
                  </button>
                </div>
              </PopoverContent>
            </Popover>
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
