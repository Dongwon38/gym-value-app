export const dashboardRangeTypes = [
  'current_year',
  'current_month',
  'all_time',
] as const;
export type DashboardRangeType = (typeof dashboardRangeTypes)[number];

export interface DashboardStats {
  rangeType: DashboardRangeType;
  totalPaid: number | null;
  totalVisits: number;
  totalDurationMinutes: number;
  totalDurationHours: number;
  uniqueVisitDays: number;
  averageVisitLengthMinutes: number | null;
  costPerVisit: number | null;
  costPerHour: number | null;
  costPerActiveDay: number | null;
  hasActiveVisit: boolean;
  activeVisitId?: string;
  latestVisitAt?: string;
}
