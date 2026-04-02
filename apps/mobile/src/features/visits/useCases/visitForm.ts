import { emptyVisitFormValues, type VisitFormValues } from '../../../domain/forms';
import type { Visit } from '../../../domain/models';

function padTime(value: number) {
  return String(value).padStart(2, '0');
}

function getLocalTodayDate() {
  const today = new Date();

  return `${today.getFullYear()}-${padTime(today.getMonth() + 1)}-${padTime(today.getDate())}`;
}

export function createNewVisitFormValues(gymId: string): VisitFormValues {
  return {
    ...emptyVisitFormValues,
    date: getLocalTodayDate(),
    endedAt: '',
    gymId,
    startedAt: '',
    status: 'completed',
  };
}

export function mapVisitToFormValues(visit: Visit): VisitFormValues {
  const startedAt = new Date(visit.startedAt);
  const endedAt = visit.endedAt ? new Date(visit.endedAt) : null;

  const date = `${startedAt.getFullYear()}-${padTime(
    startedAt.getMonth() + 1,
  )}-${padTime(startedAt.getDate())}`;

  return {
    date,
    endedAt: endedAt ? `${padTime(endedAt.getHours())}:${padTime(endedAt.getMinutes())}` : '',
    gymId: visit.gymId,
    notes: visit.notes ?? '',
    startedAt: `${padTime(startedAt.getHours())}:${padTime(startedAt.getMinutes())}`,
    status: visit.status === 'active' ? 'active' : 'completed',
  };
}
