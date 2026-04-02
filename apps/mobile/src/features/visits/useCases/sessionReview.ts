import type { Visit } from '../../../domain/models';

export const activeVisitAttentionThresholdMinutes = 8 * 60;

export function getActiveVisitElapsedMinutes(
  visit: Pick<Visit, 'startedAt' | 'status'>,
  now = new Date(),
) {
  if (visit.status !== 'active') {
    return null;
  }

  const startedAt = new Date(visit.startedAt);

  if (Number.isNaN(startedAt.getTime())) {
    return null;
  }

  return Math.round((now.getTime() - startedAt.getTime()) / 60000);
}

export function shouldReviewActiveVisit(
  visit: Pick<Visit, 'startedAt' | 'status'>,
  now = new Date(),
) {
  const elapsedMinutes = getActiveVisitElapsedMinutes(visit, now);

  return (
    elapsedMinutes !== null &&
    elapsedMinutes >= activeVisitAttentionThresholdMinutes
  );
}
