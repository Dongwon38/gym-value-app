import React from 'react';

import { GymSetupSection } from '../../features/gym/components/GymSetupSection';
import { AssistedCheckInSection } from '../../features/settings/components/AssistedCheckInSection';
import { AppSettingsSection } from '../../features/settings/components/AppSettingsSection';
import { ScreenContainer } from '../../ui/components';

export function SettingsScreen() {
  return (
    <ScreenContainer
      description="App tax defaults, primary gym setup, and assisted tracking fallback now share this tab."
      eyebrow="Settings"
      scroll
      title="Tax defaults, gym setup, and assisted fallback live here.">
      <AppSettingsSection />
      <GymSetupSection />
      <AssistedCheckInSection />
    </ScreenContainer>
  );
}
