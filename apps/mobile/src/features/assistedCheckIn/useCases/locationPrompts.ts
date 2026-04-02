import {
  createLocationPrompt,
  type LocationPromptWriteInput,
} from '../../../data/repositories';
import type { LocationPromptType } from '../../../domain/models';
import type { GeofenceEvent } from '../../../platform/services';

export function isCheckInPromptType(type: LocationPromptType) {
  return type === 'enter' || type === 'checkin_suggested';
}

export function isCheckOutPromptType(type: LocationPromptType) {
  return type === 'exit' || type === 'checkout_suggested';
}

export function mapGeofenceEventToLocationPromptInput(
  event: GeofenceEvent,
): LocationPromptWriteInput {
  return {
    gymId: event.gymId,
    occurredAt: event.occurredAt,
    type: event.type,
  };
}

export async function recordLocationPromptFromGeofenceEvent(
  event: GeofenceEvent,
) {
  return createLocationPrompt(mapGeofenceEventToLocationPromptInput(event));
}

export async function recordSuggestedLocationPrompt(input: {
  gymId: string;
  occurredAt: string;
  relatedVisitId?: string | null;
  type: Extract<LocationPromptType, 'checkin_suggested' | 'checkout_suggested'>;
}) {
  return createLocationPrompt({
    gymId: input.gymId,
    occurredAt: input.occurredAt,
    relatedVisitId: input.relatedVisitId ?? null,
    type: input.type,
  });
}
