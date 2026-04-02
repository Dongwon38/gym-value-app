jest.mock('../../../data/repositories', () => ({
  createLocationPrompt: jest.fn(),
}));

import { createLocationPrompt } from '../../../data/repositories';
import {
  isCheckInPromptType,
  isCheckOutPromptType,
  mapGeofenceEventToLocationPromptInput,
  recordLocationPromptFromGeofenceEvent,
} from './locationPrompts';

describe('assisted check-in location prompts', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('maps geofence events to location prompt rows', () => {
    expect(
      mapGeofenceEventToLocationPromptInput({
        gymId: 'gym_1',
        latitude: 49.2827,
        longitude: -123.1207,
        occurredAt: '2026-04-02T10:00:00.000Z',
        radiusMeters: 120,
        source: 'test',
        type: 'enter',
      }),
    ).toEqual({
      gymId: 'gym_1',
      occurredAt: '2026-04-02T10:00:00.000Z',
      type: 'enter',
    });
    expect(isCheckInPromptType('enter')).toBe(true);
    expect(isCheckInPromptType('checkout_suggested')).toBe(false);
    expect(isCheckOutPromptType('exit')).toBe(true);
    expect(isCheckOutPromptType('checkin_suggested')).toBe(false);
  });

  it('records prompt rows from stub geofence events', async () => {
    (createLocationPrompt as jest.Mock).mockResolvedValue({
      id: 'prompt_1',
      type: 'enter',
    });

    const prompt = await recordLocationPromptFromGeofenceEvent({
      gymId: 'gym_1',
      latitude: 49.2827,
      longitude: -123.1207,
      occurredAt: '2026-04-02T10:00:00.000Z',
      radiusMeters: 120,
      source: 'test',
      type: 'enter',
    });

    expect(createLocationPrompt).toHaveBeenCalledWith({
      gymId: 'gym_1',
      occurredAt: '2026-04-02T10:00:00.000Z',
      type: 'enter',
    });
    expect(prompt.id).toBe('prompt_1');
  });
});
