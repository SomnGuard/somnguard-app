import { createContext, createElement, PropsWithChildren, useContext, useMemo, useState } from 'react';

export type AppThemeName = 'dark' | 'light';

export const Colors = {
  light: {
    background:    '#f7f4ec',
    surface:       '#ffffff',
    input:         '#ebe8df',
    inputFocused:  '#f2efe7',
    border:        'rgba(73, 86, 99, 0.22)',
    borderFocused: '#5d758b',
    accent:        '#40566a',
    accentLight:   'rgba(64, 86, 106, 0.12)',
    text:          '#17212b',
    textMuted:     '#6d7883',
    textLink:      '#00C8C8',
    error:         '#ff5555',
    errorBg:       'rgba(255, 80, 80, 0.08)',
    errorBorder:   'rgba(255, 80, 80, 0.25)',
    placeholder:   '#8a949d',
    tint:          '#40566a',
    icon:          '#6d7883',
    tabIconDefault:'#8a949d',
    tabIconSelected: '#40566a',
    header:        '#e8e3d8',
    viewer:        '#ece8de',
    
  },
  dark: {
    background:    '#09111f',
    surface:       '#0c1b2e',
    input:         '#0e2236',
    inputFocused:  '#112840',
    border:        'rgba(0, 200, 200, 0.22)',
    borderFocused: '#00C8C8',
    accent:        '#00C8C8',
    accentLight:   'rgba(0, 200, 200, 0.12)',
    text:          '#d8eef6',
    textMuted:     '#5a8095',
    textLink:      '#00C8C8',
    error:         '#ff5555',
    errorBg:       'rgba(255, 80, 80, 0.08)',
    errorBorder:   'rgba(255, 80, 80, 0.25)',
    placeholder:   '#3a6070',
    tint:          '#00C8C8',
    icon:          '#5a8095',
    tabIconDefault:'#5a8095',
    tabIconSelected: '#00C8C8',
    header:        '#104863',
    viewer:        '#060d18',
  },
};

export const theme = {
  colors: Colors.dark,
  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    xxl: 44,
  },
  radius: {
    input:  11,
    button: 13,
    card:   16,
    small:  8,
  },
  fontSize: {
    xs:  11,
    sm:  13,
    base: 15,
    md:  16,
    lg:  20,
    xl:  24,
    xxl: 28,
  },
};

export const Fonts = {
  rounded: 'System',
  mono: 'Courier New',
};

export const baseTheme = {
  spacing: theme.spacing,
  radius: theme.radius,
  fontSize: theme.fontSize,
};

export type AppTheme = typeof theme;

type ThemeContextValue = {
  colorScheme: AppThemeName;
  setColorScheme: (value: AppThemeName) => void;
  theme: AppTheme;
};

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: 'dark',
  setColorScheme: () => undefined,
  theme,
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const [colorScheme, setColorScheme] = useState<AppThemeName>('dark');
  const currentTheme = useMemo(() => ({ ...baseTheme, colors: Colors[colorScheme] }), [colorScheme]);

  return createElement(ThemeContext.Provider, { value: { colorScheme, setColorScheme, theme: currentTheme } }, children);
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

