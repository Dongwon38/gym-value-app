import { cancelVisit as cancelVisitRepository } from '../../../data/repositories';
import type { Visit } from '../../../domain/models';

export async function cancelVisit(visit: Pick<Visit, 'id'>) {
  return cancelVisitRepository(visit.id);
}
