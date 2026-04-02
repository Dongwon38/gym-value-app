export interface GymFormValues {
  latitude: string;
  longitude: string;
  name: string;
  radiusMeters: string;
  timezone: string;
}

export const emptyGymFormValues: GymFormValues = {
  latitude: '',
  longitude: '',
  name: '',
  radiusMeters: '',
  timezone: '',
};
