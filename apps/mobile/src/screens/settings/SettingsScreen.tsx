import React from 'react';

import { GymSetupSection } from '../../features/gym/components/GymSetupSection';
import { ScreenContainer } from '../../ui/components';

export function SettingsScreen() {
  return (
    <ScreenContainer
      description="Gym setup lands first on this tab. Locale, tax defaults, and tracking toggles will layer onto the same settings surface later."
      eyebrow="Settings"
      scroll
      title="Set up your primary gym first.">
      <GymSetupSection />
    </ScreenContainer>
  );
}
