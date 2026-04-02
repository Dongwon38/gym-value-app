import {
  createVisit,
  getActiveVisit,
  getLocationPrompt,
  markLocationPromptAccepted,
} from '../../../data/repositories';

import { isCheckInPromptType } from './locationPrompts';

export class AssistedVisitConflictError extends Error {
  constructor() {
    super('An active visit already exists.');
  }
}

export class LocationPromptNotFoundError extends Error {
  constructor(promptId: string) {
    super(`Location prompt "${promptId}" could not be found.`);
  }
}

export class UnsupportedLocationPromptError extends Error {
  constructor(promptType: string, action: 'start' | 'complete') {
    super(`Location prompt type "${promptType}" cannot ${action} a visit.`);
  }
}

export async function startVisitFromPrompt(promptId: string) {
  const prompt = await getLocationPrompt(promptId);

  if (!prompt) {
    throw new LocationPromptNotFoundError(promptId);
  }

  if (!isCheckInPromptType(prompt.type)) {
    throw new UnsupportedLocationPromptError(prompt.type, 'start');
  }

  const activeVisit = await getActiveVisit();

  if (activeVisit) {
    throw new AssistedVisitConflictError();
  }

  const visit = await createVisit({
    durationMinutes: null,
    endedAt: null,
    gymId: prompt.gymId,
    source: 'prompted',
    startedAt: prompt.occurredAt,
    status: 'active',
  });
  const acceptedPrompt = await markLocationPromptAccepted(prompt.id, visit.id);

  return {
    prompt: acceptedPrompt,
    visit,
  };
}
