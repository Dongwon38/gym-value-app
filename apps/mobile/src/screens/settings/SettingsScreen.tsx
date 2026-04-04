import React from 'react';

import { GymSetupSection } from '../../features/gym/components/GymSetupSection';
import { AssistedCheckInSection } from '../../features/settings/components/AssistedCheckInSection';
import { AppSettingsSection } from '../../features/settings/components/AppSettingsSection';
import { ScreenContainer } from '../../ui/components';

export function SettingsScreen() {
  return (
    <ScreenContainer
      description="Defaults, gym setup, and fallback."
      eyebrow="Settings"
      scroll
      title="Settings">
      <AppSettingsSection />
      <GymSetupSection />
      <AssistedCheckInSection />
    </ScreenContainer>
  );
}
