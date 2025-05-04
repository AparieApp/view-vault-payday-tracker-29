import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTracker } from "@/contexts/TrackerContext";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ContentItem } from "@/types";

const DashboardSummary: React.FC = () => {
  const { state } = useTracker();
  const { contentItems, paymentSettings, isLoading } = state;
  
  // Recalculate summaries based on potentially updated logic/fields
  const totalContent = contentItems.length;
  
  const calculateTotalPaid = (item: ContentItem): number => {
      return (item.payouts || []).reduce((sum, payout) => sum + payout.amount, 0);
  };
  
  const calculateFinalEarnings = (item: ContentItem): number => {
      const setting = paymentSettings.find(s => s.id === item.paymentSettingsId);
      if (!setting || item.final_views === null || item.final_views === undefined) return 0;
      // Assuming calculatePayment exists in utils or needs importing/defining
      // return calculatePayment(setting..., item.final_views, ...);
      // Placeholder until calculatePayment utility is confirmed/added
       const paymentAmount = (item.final_views / (setting.viewsPerUnit || 1000)) * (setting.viewRate || 0) + (setting.basePay || 0);
       return setting.maxPayout ? Math.min(paymentAmount, setting.maxPayout) : paymentAmount;
  };
  
  const totalPaid = contentItems.reduce((sum, item) => sum + calculateTotalPaid(item), 0);
  
  // Pending = Total Earned (based on final views for finalized items) - Total Paid
  const totalPending = contentItems
      .filter(item => item.status === 'finalized')
      .reduce((sum, item) => {
          const itemEarnings = calculateFinalEarnings(item);
          const itemPaid = calculateTotalPaid(item);
          return sum + Math.max(0, itemEarnings - itemPaid);
      }, 0);
  
  // We can still show starting views by platform if desired
  const platforms = [...new Set(contentItems.map(item => item.platform))];
  const startingViewsByPlatform = platforms.map(platform => {
    const platformItems = contentItems.filter(item => item.platform === platform);
    const views = platformItems.reduce((sum, item) => sum + item.starting_views, 0);
    return { platform, views };
  }).sort((a, b) => b.views - a.views);
  
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-muted rounded w-24 mb-2"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard Summary</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Content</CardTitle>
            <CardDescription>All tracked content items</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalContent}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Paid</CardTitle>
            <CardDescription>All payouts processed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Pending Payments</CardTitle>
            <CardDescription>Based on finalized views</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Starting Views</CardTitle>
            <CardDescription>Sum of initial views when added</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(contentItems.reduce((sum, item) => sum + item.starting_views, 0))}</p>
          </CardContent>
        </Card>
      </div>
      
      {startingViewsByPlatform.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Starting Views by Platform</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {startingViewsByPlatform.map(({ platform, views }) => (
              <Card key={platform}>
                <CardHeader className="pb-2">
                  <CardTitle className="capitalize">{platform}</CardTitle>
                  <CardDescription>Total starting views</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatNumber(views)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSummary;
