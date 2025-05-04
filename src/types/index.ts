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
  name: string;
  basePay: number;
  viewRate: number;
  viewsPerUnit: number; // e.g., 1000 for "$X per 1000 views"
  trackingPeriodDays: number;
  maxPayout?: number;
  bonusThresholds: BonusThreshold[];
  combineViews: boolean;
}

export type ContentItemStatus = 'tracking' | 'finalized' | 'paid';

export interface ContentItem {
  id: string;
  title: string;
  platform: Platform;
  platform_id?: string; // ID or URL for the content on the platform
  video_url?: string; // Store the original URL
  uploadDate: string; // ISO date string (Manually set by user)
  starting_views: number; // Manually set by user at time of adding
  final_views: number | null; // Manually set by user at end of tracking
  status: ContentItemStatus;
  paymentSettingsId: string;
  payouts: Payout[];
  belongsToChannel?: boolean; // Added property
  managedByManager?: boolean; // Added property
}

export interface Channel {
  id: string;
  name: string;
  platform: Platform;
  platform_id: string;
  platform_url: string;
  default_payment_settings_id: string | null;
  created_at: string;
  updated_at: string;
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
