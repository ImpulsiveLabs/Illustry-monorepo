/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import {
  Dispatch, createContext, ReactNode, useReducer, useEffect, useContext
} from 'react';
import { UtilTypes } from '@illustry/types';
import { cloneDeep } from '@/lib/utils';

type ThemeColors = {
  calendar: {
    dark: {
      colors: string[];
    };
    light: {
      colors: string[];
    };
  };
  heb: {
    dark: {
      colors: string[];
    };
    light: {
      colors: string[];
    };
  };
  flg: {
    dark: {
      colors: string[];
    };
    light: {
      colors: string[];
    };
  };
  sankey: {
    dark: {
      colors: string[];
    };
    light: {
      colors: string[];
    };
  };
  wordcloud: {
    dark: {
      colors: string[];
    };
    light: {
      colors: string[];
    };
  };
  lineChart: {
    dark: {
      colors: string[];
    };
    light: {
      colors: string[];
    };
  };
  barChart: {
    dark: {
      colors: string[];
    };
    light: {
      colors: string[];
    };
  };
  scatter: {
    dark: {
      colors: string[];
    };
    light: {
      colors: string[];
    };
  };
  pieChart: {
    dark: {
      colors: string[];
    };
    light: {
      colors: string[];
    };
  };
  treeMap: {
    dark: {
      colors: string[];
    };
    light: {
      colors: string[];
    };
  };
  sunburst: {
    dark: {
      colors: string[];
    };
    light: {
      colors: string[];
    };
  };
  funnel: {
    dark: {
      colors: string[];
    };
    light: {
      colors: string[];
    };
  };
}
type OptionAction = {
  type: 'apply';
  modifiedData?: UtilTypes.DeepPartial<ThemeColors>;
}
type AuxProps = {
  children: ReactNode;
  storageScope?: string;
  initialTheme?: ThemeColors | null;
  persist?: boolean;
}

type StoredThemeColors = {
  expiresAt: number;
  theme: ThemeColors;
};

const THEME_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const getThemeStorageKey = (scope = 'default') => `colorTheme:${scope}`;
const readCachedThemeColors = (scope = 'default'): ThemeColors | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  const storageKey = getThemeStorageKey(scope);
  const storedTheme = localStorage.getItem(storageKey);
  if (!storedTheme) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedTheme) as StoredThemeColors | ThemeColors;
    if ('expiresAt' in parsed && parsed.expiresAt > Date.now()) {
      return parsed.theme;
    }
    if (!('expiresAt' in parsed)) {
      return parsed as ThemeColors;
    }
    localStorage.removeItem(storageKey);
  } catch {
    localStorage.removeItem(storageKey);
  }

  return null;
};

const initialThemeColors: ThemeColors = {
  calendar: {
    dark: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    },
    light: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    }
  },
  flg: {
    dark: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    },
    light: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    }
  },
  sankey: {
    dark: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    },
    light: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    }
  },
  wordcloud: {
    dark: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    },
    light: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    }
  },
  heb: {
    dark: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    },
    light: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    }
  },
  lineChart: {
    dark: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    },
    light: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    }
  },
  barChart: {
    dark: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    },
    light: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    }
  },
  scatter: {
    dark: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    },
    light: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    }
  },
  pieChart: {
    dark: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    },
    light: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    }
  },
  treeMap: {
    dark: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    },
    light: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    }
  },
  sunburst: {
    dark: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    },
    light: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    }
  },
  funnel: {
    dark: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    },
    light: {
      colors: [
        '#5DBE6E',
        '#4C8BF5',
        '#F0AC40',
        '#D73D6C',
        '#1D7A8A',
        '#B65911',
        '#84BA5B'
      ]
    }
  }
};

const ThemeColorsContext = createContext<ThemeColors>(initialThemeColors);
const ThemeDispatchContext = createContext<
  Dispatch<OptionAction> | undefined
>(undefined);
const themeColorsReducer = (
  data: ThemeColors,
  action: OptionAction
): ThemeColors => {
  if (action.type === 'apply' && action.modifiedData) {
    const newData: ThemeColors = cloneDeep(data);
    Object.entries(action.modifiedData).forEach(([key]) => {
      if (key in newData) {
        newData[key as keyof ThemeColors] = {
          ...newData[key as keyof ThemeColors],
          ...(action.modifiedData as any)[key]
        };
      }
    });

    return newData;
  }
  const newData: ThemeColors = cloneDeep(data);
  return newData;
};
const ThemeColorsProvider = ({
  children,
  storageScope = 'default',
  initialTheme,
  persist = true
}: AuxProps) => {
  let initialProviderTheme = initialTheme || initialThemeColors;
  if (!initialTheme && typeof window !== 'undefined' && window.localStorage) {
    initialProviderTheme = readCachedThemeColors(storageScope) || initialProviderTheme;
    localStorage.removeItem('colorTheme');
  }
  const [themeProv, dispatchDataProv] = useReducer(
    themeColorsReducer,
    initialProviderTheme
  );
  useEffect(() => {
    if (persist && typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(getThemeStorageKey(storageScope), JSON.stringify({
        expiresAt: Date.now() + THEME_CACHE_TTL_MS,
        theme: themeProv
      }));
    }
  }, [persist, storageScope, themeProv]);
  return (
    <ThemeColorsContext.Provider value={themeProv}>
      <ThemeDispatchContext.Provider value={dispatchDataProv}>
        {children}
      </ThemeDispatchContext.Provider>
    </ThemeColorsContext.Provider>
  );
};
const useThemeColors = () => useContext(ThemeColorsContext);
const useThemeColorsDispach = () => useContext(ThemeDispatchContext);

// eslint-disable-next-line max-len
const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => <NextThemesProvider {...props}>{children}</NextThemesProvider>;

export type { ThemeColors };
export {
  ThemeColorsProvider,
  readCachedThemeColors,
  useThemeColors,
  useThemeColorsDispach,
  ThemeProvider
};
