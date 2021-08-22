import React, { useEffect } from 'react';

import { Theme } from '_/global.d';
import useTheme from '_/hooks/useTheme';

type ThemeContextProps = {
  theme: Theme;
  setTheme: (theme: Theme) => any;
};

export const ThemeContext = React.createContext<ThemeContextProps>({
  theme: 'light',
  setTheme: () => {},
});

export const ThemeProvider: React.FC = ({ children }) => {
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (query) => {
      const newMode: Theme = query.matches ? 'dark' : 'light';
      setTheme(newMode);
    });
  }, [setTheme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};
