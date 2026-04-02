import type { VisitStatus } from '../models';

export type VisitFormStatus = Extract<VisitStatus, 'active' | 'completed'>;

export interface VisitFormValues {
  date: string;
  endedAt: string;
  gymId: string;
  notes: string;
  startedAt: string;
  status: VisitFormStatus;
}

export const emptyVisitFormValues: VisitFormValues = {
  date: '',
  endedAt: '',
  gymId: '',
  notes: '',
  startedAt: '',
  status: 'completed',
};
