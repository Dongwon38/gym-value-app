import React from 'react';

import { AppShell } from './src/app/AppShell';
import { AppProviders } from './src/app/providers/AppProviders';

function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}

export default App;
