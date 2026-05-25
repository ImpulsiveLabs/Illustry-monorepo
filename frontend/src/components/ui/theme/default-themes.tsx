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
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Object.keys(colorPalette).map((schemeName, index) => (
        <div
          key={schemeName}
          ref={(el) => {
            themeRefs.current[index] = el;
          }}
          role="button"
          tabIndex={0}
          className={`relative cursor-pointer rounded-lg border bg-card p-3 text-card-foreground transition
           focus:outline-none focus:ring-2 hover:ring-2 ${
            selectedSchemeName === schemeName
              ? 'border-primary ring-2 ring-ring'
              : 'border-border focus:ring-ring hover:ring-ring'
          }`}
          onClick={() => handleClick(schemeName, index)}
          onKeyDown={(e) => handleKeyDown(e, schemeName)}
        >
          {selectedSchemeName === schemeName && (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
          )}
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="truncate text-sm font-medium">{schemeName}</span>
            <span className="text-xs text-muted-foreground">{colorPalette[schemeName]?.length || 0}</span>
          </div>
          <div className="flex h-10 overflow-hidden rounded-md border border-border">
            {colorPalette[schemeName]?.map((color, i) => (
              <div
                key={`${schemeName}-${color}-${i}`}
                style={{ backgroundColor: color }}
                className="min-w-5 flex-1"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DefaultThemesAccordion;
