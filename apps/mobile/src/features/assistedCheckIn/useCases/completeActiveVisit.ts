import {
  getActiveVisit,
  getLocationPrompt,
  markLocationPromptAccepted,
  updateVisit,
} from '../../../data/repositories';

import {
  LocationPromptNotFoundError,
  UnsupportedLocationPromptError,
} from './startVisitFromPrompt';
import { isCheckOutPromptType } from './locationPrompts';

export class ActiveVisitNotFoundError extends Error {
  constructor() {
    super('There is no active visit to complete.');
  }
}

export class AssistedVisitPromptMismatchError extends Error {
  constructor() {
    super('The prompt gym does not match the current active visit.');
  }
}

export function deriveDurationMinutesFromIsoRange(
  startedAt: string,
  endedAt: string,
) {
  const startedAtDate = new Date(startedAt);
  const endedAtDate = new Date(endedAt);

  if (
    Number.isNaN(startedAtDate.getTime()) ||
    Number.isNaN(endedAtDate.getTime())
  ) {
    return null;
  }

  return Math.round((endedAtDate.getTime() - startedAtDate.getTime()) / 60000);
}

export async function completeActiveVisit(promptId: string) {
  const prompt = await getLocationPrompt(promptId);

  if (!prompt) {
    throw new LocationPromptNotFoundError(promptId);
  }

  if (!isCheckOutPromptType(prompt.type)) {
    throw new UnsupportedLocationPromptError(prompt.type, 'complete');
  }

  const activeVisit = await getActiveVisit();

  if (!activeVisit) {
    throw new ActiveVisitNotFoundError();
  }

  if (activeVisit.gymId !== prompt.gymId) {
    throw new AssistedVisitPromptMismatchError();
  }

  const durationMinutes = deriveDurationMinutesFromIsoRange(
    activeVisit.startedAt,
    prompt.occurredAt,
  );

  if (durationMinutes === null || durationMinutes < 1) {
    throw new Error('The prompt timestamp cannot complete the active visit.');
  }

  const visit = await updateVisit(activeVisit.id, {
    confidence: activeVisit.confidence,
    durationMinutes,
    endedAt: prompt.occurredAt,
    gymId: activeVisit.gymId,
    notes: activeVisit.notes,
    source: activeVisit.source,
    startedAt: activeVisit.startedAt,
    status: 'completed',
  });
  const acceptedPrompt = await markLocationPromptAccepted(prompt.id, visit.id);

  return {
    prompt: acceptedPrompt,
    visit,
  };
}
