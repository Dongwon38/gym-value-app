import React from 'react';

import { GymSetupSection } from '../../features/gym/components/GymSetupSection';
import { AssistedCheckInSection } from '../../features/settings/components/AssistedCheckInSection';
import { AppSettingsSection } from '../../features/settings/components/AppSettingsSection';
import { Screen } from '../../ui';

export function SettingsScreen() {
  return (
    <Screen scroll title="Settings">
      <GymSetupSection />
      <AssistedCheckInSection />
      <AppSettingsSection />
    </Screen>
  );
}
