import { useState } from 'react';

import { Theme } from '_/global.d';

export default function useTheme(): [Theme, (theme: Theme) => any] {
  const [theme, setTheme] = useState<Theme>('light');

  const modifyTheme = (theme: Theme) => {
    setTheme(() => {
      document.body.className = `app--${theme}`;

      return theme;
    });
  };

  return [theme, modifyTheme];
}
