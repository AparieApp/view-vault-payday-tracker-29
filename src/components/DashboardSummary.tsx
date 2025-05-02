
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTracker } from "@/contexts/TrackerContext";
import { formatCurrency, formatNumber } from "@/lib/utils";
import ViewCountUpdater from "./ViewCountUpdater";

const DashboardSummary: React.FC = () => {
  const { state, calculateTotalPaid, calculatePendingEarnings } = useTracker();
  const { contentItems, isLoading } = state;
  
  // Calculate summary statistics
  const totalContent = contentItems.length;
  const totalViews = contentItems.reduce((sum, item) => sum + item.views, 0);
  const totalPaid = contentItems.reduce((sum, item) => sum + calculateTotalPaid(item), 0);
  const totalPending = contentItems.reduce((sum, item) => sum + calculatePendingEarnings(item), 0);
  
  const platforms = [...new Set(contentItems.map(item => item.platform))];
  const viewsByPlatform = platforms.map(platform => {
    const platformItems = contentItems.filter(item => item.platform === platform);
    const views = platformItems.reduce((sum, item) => sum + item.views, 0);
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Dashboard Summary</h2>
        <ViewCountUpdater />
      </div>
      
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
            <CardTitle>Total Views</CardTitle>
            <CardDescription>Across all platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalViews)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Paid</CardTitle>
            <CardDescription>All payouts to date</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Pending Payments</CardTitle>
            <CardDescription>Ready to process</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
      </div>
      
      {viewsByPlatform.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Views by Platform</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {viewsByPlatform.map(({ platform, views }) => (
              <Card key={platform}>
                <CardHeader className="pb-2">
                  <CardTitle className="capitalize">{platform}</CardTitle>
                  <CardDescription>Total views</CardDescription>
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
