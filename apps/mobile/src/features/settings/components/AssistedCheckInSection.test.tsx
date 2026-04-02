jest.mock('../../../app/providers/AssistedCheckInContext', () => ({
  useAssistedCheckIn: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { useAssistedCheckIn } from '../../../app/providers/AssistedCheckInContext';
import { AssistedCheckInSection } from './AssistedCheckInSection';

describe('AssistedCheckInSection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders manual-only fallback guidance when tracking is unavailable', async () => {
    (useAssistedCheckIn as jest.Mock).mockReturnValue({
      refresh: jest.fn(),
      snapshot: {
        activeVisitId: null,
        backgroundLocationPermission: 'denied',
        lastError: null,
        lastPromptId: null,
        locationPermission: 'denied',
        notificationPermission: 'granted',
        primaryGymId: 'gym_1',
        status: 'manual_only',
        trackingEnabled: false,
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<AssistedCheckInSection />);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain('Manual-only mode is active');
    expect(JSON.stringify(renderer!.toJSON())).toContain(
      'You can keep using manual gym setup, cost tracking, and visit CRUD',
    );
    expect(JSON.stringify(renderer!.toJSON())).toContain(
      'Refresh Assisted Tracking',
    );
  });

  it('renders the tracking state details when assisted suggestions are enabled', async () => {
    (useAssistedCheckIn as jest.Mock).mockReturnValue({
      refresh: jest.fn(),
      snapshot: {
        activeVisitId: 'visit_1',
        backgroundLocationPermission: 'granted',
        lastError: null,
        lastPromptId: 'prompt_1',
        locationPermission: 'granted',
        notificationPermission: 'granted',
        primaryGymId: 'gym_1',
        status: 'tracking',
        trackingEnabled: true,
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<AssistedCheckInSection />);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain(
      'Assisted suggestions are tracking',
    );
    expect(JSON.stringify(renderer!.toJSON())).toContain('Restored active visit:');
    expect(JSON.stringify(renderer!.toJSON())).toContain('visit_1');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Last prompt:');
    expect(JSON.stringify(renderer!.toJSON())).toContain('prompt_1');
  });
});
