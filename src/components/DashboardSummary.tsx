
import React from 'react';
import { useTracker } from '@/contexts/TrackerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { DollarSign, Eye, Calendar, BarChart3 } from 'lucide-react';

const DashboardSummary: React.FC = () => {
  const { state, getActiveContentItems, calculatePendingEarnings } = useTracker();
  
  // Get active content items (within tracking period)
  const activeItems = getActiveContentItems();
  
  // Calculate total views across all active content
  const totalViews = activeItems.reduce((sum, item) => sum + item.views, 0);
  
  // Calculate total pending payments
  const totalPending = activeItems.reduce((sum, item) => sum + calculatePendingEarnings(item), 0);
  
  // Calculate total paid amount
  const totalPaid = state.payouts.reduce((sum, payout) => sum + payout.amount, 0);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Content</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeItems.length}</div>
          <p className="text-xs text-muted-foreground">
            Content items within tracking period
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalViews)}</div>
          <p className="text-xs text-muted-foreground">
            Across all active content
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
          <p className="text-xs text-muted-foreground">
            Ready to be processed
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
          <p className="text-xs text-muted-foreground">
            Lifetime payments
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSummary;
