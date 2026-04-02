import {
  dismissLocationPrompt,
  getActiveVisit,
  getSettings,
} from '../../../data/repositories';
import type { PlatformServices } from '../../../platform/services';
import { getPrimaryGym } from '../../gym/useCases/primaryGym';

import { createAssistedCheckInController } from './assistedCheckInController';
import { completeActiveVisit } from './completeActiveVisit';
import {
  recordLocationPromptFromGeofenceEvent,
  recordSuggestedLocationPrompt,
} from './locationPrompts';
import { startVisitFromPrompt } from './startVisitFromPrompt';

export function createDefaultAssistedCheckInController(
  services: PlatformServices,
) {
  return createAssistedCheckInController({
    ...services,
    completeActiveVisit,
    dismissLocationPrompt,
    getActiveVisit,
    getPrimaryGym,
    getSettings,
    recordLocationPromptFromGeofenceEvent,
    recordSuggestedLocationPrompt,
    startVisitFromPrompt,
  });
}
