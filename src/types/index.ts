
export type Platform = 
  | 'tiktok'
  | 'youtube'
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'threads'
  | 'facebook'
  | 'bluesky'
  | 'pinterest';

export interface BonusThreshold {
  threshold: number;
  amount: number;
}

export interface PaymentSettings {
  id: string;
  basePay: number;
  viewRate: number;
  viewsPerUnit: number; // e.g., 1000 for "$X per 1000 views"
  trackingPeriodDays: number;
  maxPayout?: number;
  bonusThresholds: BonusThreshold[];
  combineViews: boolean;
}

export interface ContentItem {
  id: string;
  title: string;
  platform: Platform;
  uploadDate: string; // ISO date string
  views: number;
  paymentSettingsId: string;
  payouts: Payout[];
}

export interface Payout {
  id: string;
  date: string; // ISO date string
  amount: number;
  contentItemId: string;
  viewCount: number;
}

export interface PayoutSummary {
  contentId: string;
  title: string;
  platform: Platform;
  alreadyPaid: number;
  currentEarned: number;
  remainingToPay: number;
  viewsAtLastPayout: number;
  currentViews: number;
}
