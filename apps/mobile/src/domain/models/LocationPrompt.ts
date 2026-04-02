export const locationPromptTypes = [
  'enter',
  'exit',
  'checkin_suggested',
  'checkout_suggested',
] as const;

export type LocationPromptType = (typeof locationPromptTypes)[number];

export interface LocationPrompt {
  createdAt: string;
  dismissedPermanently: boolean;
  gymId: string;
  id: string;
  occurredAt: string;
  relatedVisitId: string | null;
  type: LocationPromptType;
  wasAccepted: boolean;
}
