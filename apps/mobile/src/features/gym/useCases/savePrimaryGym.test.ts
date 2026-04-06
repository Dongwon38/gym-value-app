jest.mock('../../../data/repositories', () => ({
  createGym: jest.fn(),
  updateGym: jest.fn(),
}));

import { emptyGymFormValues } from '../../../domain/forms';
import { createGym, updateGym } from '../../../data/repositories';
import {
  GymFormValidationError,
  savePrimaryGym,
} from './savePrimaryGym';

describe('savePrimaryGym', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new primary gym from valid form values', async () => {
    (createGym as jest.Mock).mockResolvedValue({ id: 'gym_1', name: 'Downtown Gym' });

    await savePrimaryGym({
      ...emptyGymFormValues,
      latitude: '49.2827',
      longitude: '-123.1207',
      name: 'Downtown Gym',
      radiusMeters: '151',
      timezone: 'America/Vancouver',
    });

    expect(createGym).toHaveBeenCalledWith({
      isActive: true,
      isPrimary: true,
      latitude: 49.2827,
      longitude: -123.1207,
      name: 'Downtown Gym',
      radiusMeters: 151,
      searchSource: 'manual',
      timezone: 'America/Vancouver',
    });
  });

  it('updates an existing primary gym when an id is provided', async () => {
    (updateGym as jest.Mock).mockResolvedValue({ id: 'gym_1', name: 'Downtown Gym' });

    await savePrimaryGym({
      ...emptyGymFormValues,
      latitude: '49.2827',
      longitude: '-123.1207',
      name: 'Downtown Gym',
      radiusMeters: '150',
      timezone: 'America/Vancouver',
    }, 'gym_1');

    expect(updateGym).toHaveBeenCalledWith(
      'gym_1',
      expect.objectContaining({
        name: 'Downtown Gym',
        searchSource: 'manual',
      }),
    );
  });

  it('throws a validation error when the gym form is invalid', async () => {
    await expect(
      savePrimaryGym({
        ...emptyGymFormValues,
        latitude: '91',
        longitude: '',
        name: '',
        radiusMeters: '10',
        timezone: '',
      }),
    ).rejects.toBeInstanceOf(GymFormValidationError);
  });
});
