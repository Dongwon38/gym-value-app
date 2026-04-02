import React, { createContext, PropsWithChildren, useContext } from 'react';

import { appTheme, AppTheme } from './theme';

const ThemeContext = createContext<AppTheme>(appTheme);

export function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeContext.Provider value={appTheme}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
