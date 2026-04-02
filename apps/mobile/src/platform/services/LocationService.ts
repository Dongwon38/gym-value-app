import type {
  CurrentPositionResult,
  GeofenceEvent,
  GymGeofenceInput,
  Unsubscribe,
} from './types';

export interface LocationService {
  getCurrentPosition(): Promise<CurrentPositionResult | null>;
  initialize(): Promise<void>;
  onGeofenceEvent(handler: (event: GeofenceEvent) => void): Unsubscribe;
  registerGymGeofence(input: GymGeofenceInput): Promise<void>;
  removeGymGeofence(gymId: string): Promise<void>;
}
