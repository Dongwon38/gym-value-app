import type {
  CheckInNotificationInput,
  CheckOutNotificationInput,
  NotificationActionEvent,
  Unsubscribe,
} from './types';

export interface NotificationService {
  cancelByTag(tag: string): Promise<void>;
  onActionPress(
    handler: (event: NotificationActionEvent) => void,
  ): Unsubscribe;
  showCheckInSuggestion(input: CheckInNotificationInput): Promise<void>;
  showCheckOutSuggestion(input: CheckOutNotificationInput): Promise<void>;
}
