import { setFeeItemActiveState } from '../../../data/repositories';
import type { FeeItem } from '../../../domain/models';

export async function deactivateCostItem(feeItem: Pick<FeeItem, 'id'>) {
  return setFeeItemActiveState(feeItem.id, false);
}
