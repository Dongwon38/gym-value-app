import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {
  PlatformServicesProvider,
  createStubPlatformServices,
  usePlatformServices,
} from '.';

describe('PlatformServicesProvider', () => {
  test('exposes the provided service bundle through the hook', async () => {
    const services = createStubPlatformServices();
    let capturedServices = null as ReturnType<typeof usePlatformServices> | null;

    function Consumer() {
      capturedServices = usePlatformServices();
      return null;
    }

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <PlatformServicesProvider services={services}>
          <Consumer />
        </PlatformServicesProvider>,
      );
    });

    expect(capturedServices).toBe(services);
  });

  test('stub services dispatch typed geofence, notification, and lifecycle events', async () => {
    const services = createStubPlatformServices();
    const geofenceHandler = jest.fn();
    const notificationHandler = jest.fn();
    const lifecycleHandler = jest.fn();

    const unsubscribeGeofence =
      services.locationService.onGeofenceEvent(geofenceHandler);
    const unsubscribeNotification =
      services.notificationService.onActionPress(notificationHandler);
    const unsubscribeLifecycle =
      services.appLifecycleService.onAppStateChange(lifecycleHandler);

    services.emitGeofenceEvent({
      gymId: 'gym_1',
      latitude: 49.2827,
      longitude: -123.1207,
      occurredAt: '2026-04-02T10:00:00.000Z',
      radiusMeters: 120,
      source: 'test',
      type: 'enter',
    });
    services.emitNotificationAction({
      actionId: 'check_in',
      gymId: 'gym_1',
      occurredAt: '2026-04-02T10:00:05.000Z',
      promptId: 'prompt_1',
    });
    services.emitAppStateChange('background');

    expect(geofenceHandler).toHaveBeenCalledWith({
      gymId: 'gym_1',
      latitude: 49.2827,
      longitude: -123.1207,
      occurredAt: '2026-04-02T10:00:00.000Z',
      radiusMeters: 120,
      source: 'test',
      type: 'enter',
    });
    expect(notificationHandler).toHaveBeenCalledWith({
      actionId: 'check_in',
      gymId: 'gym_1',
      occurredAt: '2026-04-02T10:00:05.000Z',
      promptId: 'prompt_1',
    });
    expect(lifecycleHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        nextState: 'background',
        previousState: 'active',
      }),
    );

    unsubscribeGeofence();
    unsubscribeNotification();
    unsubscribeLifecycle();

    services.emitGeofenceEvent({
      gymId: 'gym_1',
      latitude: 49.2827,
      longitude: -123.1207,
      occurredAt: '2026-04-02T10:05:00.000Z',
      radiusMeters: 120,
      source: 'test',
      type: 'exit',
    });

    expect(geofenceHandler).toHaveBeenCalledTimes(1);
  });
});
