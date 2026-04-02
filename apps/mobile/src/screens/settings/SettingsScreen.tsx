import React from 'react';

import { GymSetupSection } from '../../features/gym/components/GymSetupSection';
import { AppSettingsSection } from '../../features/settings/components/AppSettingsSection';
import { ScreenContainer } from '../../ui/components';

export function SettingsScreen() {
  return (
    <ScreenContainer
      description="App tax defaults and primary gym setup now share this tab. Tracking toggles can layer onto the same surface later."
      eyebrow="Settings"
      scroll
      title="Tax defaults and primary gym setup live here.">
      <AppSettingsSection />
      <GymSetupSection />
    </ScreenContainer>
  );
}
