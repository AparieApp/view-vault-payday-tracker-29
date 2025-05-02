
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function calculatePayment(
  basePay: number,
  viewRate: number,
  viewsPerUnit: number,
  views: number,
  bonusThresholds: { threshold: number; amount: number }[],
  maxPayout?: number
): number {
  // Calculate base pay
  let total = basePay;
  
  // Calculate view-based pay
  const viewBasedPay = (views / viewsPerUnit) * viewRate;
  total += viewBasedPay;
  
  // Apply bonuses
  bonusThresholds.forEach(bonus => {
    if (views >= bonus.threshold) {
      total += bonus.amount;
    }
  });
  
  // Apply max payout cap if provided
  if (maxPayout !== undefined && maxPayout > 0 && total > maxPayout) {
    return maxPayout;
  }
  
  return total;
}

export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // Hours * minutes * seconds * milliseconds
  return Math.round(Math.abs((startDate.getTime() - endDate.getTime()) / oneDay));
}

export function isWithinDays(date: Date, days: number): boolean {
  const now = new Date();
  const diffInDays = calculateDaysBetween(date, now);
  return diffInDays <= days;
}
