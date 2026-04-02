import type { Visit, VisitStatus } from '../../../domain/models';
import { listVisits } from '../../../data/repositories';

const visitStatusLabels: Record<VisitStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function padTime(value: number) {
  return String(value).padStart(2, '0');
}

function formatTime(date: Date) {
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
}

export async function getVisits() {
  return listVisits();
}

export function formatVisitStatus(status: VisitStatus) {
  return visitStatusLabels[status];
}

export function formatVisitDuration(durationMinutes: number | null) {
  if (durationMinutes === null) {
    return 'In progress';
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

export function formatVisitWindow({
  endedAt,
  startedAt,
}: Pick<Visit, 'endedAt' | 'startedAt'>) {
  const startedDate = new Date(startedAt);

  if (Number.isNaN(startedDate.getTime())) {
    return startedAt;
  }

  const startedLabel = `${startedDate.getFullYear()}-${padTime(
    startedDate.getMonth() + 1,
  )}-${padTime(startedDate.getDate())} ${formatTime(startedDate)}`;

  if (!endedAt) {
    return `${startedLabel} to active`;
  }

  const endedDate = new Date(endedAt);

  if (Number.isNaN(endedDate.getTime())) {
    return `${startedLabel} to ${endedAt}`;
  }

  return `${startedLabel} to ${formatTime(endedDate)}`;
}
