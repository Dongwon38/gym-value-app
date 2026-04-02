import { createStubPlatformServices } from '../../../platform/services';

import {
  createAssistedCheckInController,
  type AssistedCheckInControllerDependencies,
} from './assistedCheckInController';

function createDependencies(
  overrides: Partial<AssistedCheckInControllerDependencies> = {},
) {
  const services = createStubPlatformServices();
  const dependencies: AssistedCheckInControllerDependencies = {
    ...services,
    completeActiveVisit: jest.fn(),
    dismissLocationPrompt: jest.fn(),
    getActiveVisit: jest.fn().mockResolvedValue(null),
    getPrimaryGym: jest.fn().mockResolvedValue({
      id: 'gym_1',
      latitude: 49.2827,
      longitude: -123.1207,
      name: 'Forge Gym',
      radiusMeters: 120,
    }),
    getSettings: jest.fn().mockResolvedValue({
      checkinSuggestionsEnabled: true,
      checkoutSuggestionsEnabled: true,
    }),
    recordLocationPromptFromGeofenceEvent: jest.fn().mockResolvedValue({
      id: 'prompt_enter_raw',
      type: 'enter',
    }),
    recordSuggestedLocationPrompt: jest.fn().mockResolvedValue({
      id: 'prompt_enter_suggested',
      type: 'checkin_suggested',
    }),
    startVisitFromPrompt: jest.fn().mockResolvedValue({
      prompt: {
        id: 'prompt_enter_suggested',
      },
      visit: {
        id: 'visit_1',
      },
    }),
    ...overrides,
  };

  return {
    dependencies,
    services,
  };
}

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('assistedCheckInController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers the primary gym geofence when permissions and settings allow tracking', async () => {
    const { dependencies, services } = createDependencies();
    const controller = createAssistedCheckInController(dependencies);

    const snapshot = await controller.start();

    expect(services.getRegisteredGeofences()).toEqual([
      {
        gymId: 'gym_1',
        gymName: 'Forge Gym',
        latitude: 49.2827,
        longitude: -123.1207,
        radiusMeters: 120,
      },
    ]);
    expect(snapshot.status).toBe('tracking');
    expect(snapshot.trackingEnabled).toBe(true);
  });

  it('records enter prompts and shows a check-in suggestion notification', async () => {
    const { dependencies, services } = createDependencies();
    const controller = createAssistedCheckInController(dependencies);

    await controller.start();
    services.emitGeofenceEvent({
      gymId: 'gym_1',
      latitude: 49.2827,
      longitude: -123.1207,
      occurredAt: '2026-04-02T10:00:00.000Z',
      radiusMeters: 120,
      source: 'test',
      type: 'enter',
    });
    await flushAsyncWork();

    expect(dependencies.recordLocationPromptFromGeofenceEvent).toHaveBeenCalled();
    expect(dependencies.recordSuggestedLocationPrompt).toHaveBeenCalledWith({
      gymId: 'gym_1',
      occurredAt: '2026-04-02T10:00:00.000Z',
      type: 'checkin_suggested',
    });
    expect(services.getShownCheckInSuggestions()).toEqual([
      {
        gymId: 'gym_1',
        gymName: 'Forge Gym',
        occurredAt: '2026-04-02T10:00:00.000Z',
        promptId: 'prompt_enter_suggested',
      },
    ]);
  });

  it('handles notification actions for prompted check-in and check-out', async () => {
    const { dependencies, services } = createDependencies({
      completeActiveVisit: jest.fn().mockResolvedValue({
        prompt: {
          id: 'prompt_exit_suggested',
        },
        visit: {
          id: 'visit_1',
        },
      }),
    });
    const controller = createAssistedCheckInController(dependencies);

    await controller.start();
    services.emitNotificationAction({
      actionId: 'check_in',
      gymId: 'gym_1',
      occurredAt: '2026-04-02T10:00:00.000Z',
      promptId: 'prompt_enter_suggested',
    });
    await flushAsyncWork();

    expect(dependencies.startVisitFromPrompt).toHaveBeenCalledWith(
      'prompt_enter_suggested',
    );
    expect(controller.getSnapshot().activeVisitId).toBe('visit_1');

    services.emitNotificationAction({
      actionId: 'check_out',
      gymId: 'gym_1',
      occurredAt: '2026-04-02T11:10:00.000Z',
      promptId: 'prompt_exit_suggested',
    });
    await flushAsyncWork();

    expect(dependencies.completeActiveVisit).toHaveBeenCalledWith(
      'prompt_exit_suggested',
    );
    expect(controller.getSnapshot().activeVisitId).toBeNull();
    expect(services.getCancelledNotificationTags()).toEqual([
      'prompt_enter_suggested',
      'prompt_exit_suggested',
    ]);
  });
});
