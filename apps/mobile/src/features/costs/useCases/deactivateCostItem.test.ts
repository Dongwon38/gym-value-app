jest.mock('../../../data/repositories', () => ({
  setFeeItemActiveState: jest.fn(),
}));

import { setFeeItemActiveState } from '../../../data/repositories';
import { deactivateCostItem } from './deactivateCostItem';

describe('deactivateCostItem', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('marks the selected fee item inactive', async () => {
    (setFeeItemActiveState as jest.Mock).mockResolvedValue({
      id: 'fee_1',
      isActive: false,
    });

    await deactivateCostItem({ id: 'fee_1' });

    expect(setFeeItemActiveState).toHaveBeenCalledWith('fee_1', false);
  });
});
