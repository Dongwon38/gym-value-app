import React from 'react';

import { GymSetupSection } from '../../features/gym/components/GymSetupSection';
import { AssistedCheckInSection } from '../../features/settings/components/AssistedCheckInSection';
import { AppSettingsSection } from '../../features/settings/components/AppSettingsSection';
import { ScreenContainer } from '../../ui/components';

export function SettingsScreen() {
  return (
    <ScreenContainer
      eyebrow="Settings"
      scroll
      showEyebrow={false}
      title="Settings">
      <GymSetupSection />
      <AssistedCheckInSection />
      <AppSettingsSection />
    </ScreenContainer>
  );
}
