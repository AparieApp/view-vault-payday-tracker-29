import React, { useState } from 'react';
import { useTracker } from '@/contexts/TrackerContext';
import { formatCurrency, formatNumber, calculatePayment } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PlatformIcon from './PlatformIcon';
import { Payout, ContentItem } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';

const PayoutManager: React.FC = () => {
  const { state, processPayout } = useTracker();
  const { contentItems, paymentSettings, isLoading } = state;
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // --- Pending Payouts Calculation (Items with status 'finalized') ---
  const finalizedItems = contentItems.filter(item => item.status === 'finalized');

  const calculateFinalEarnings = (item: ContentItem): number => {
      const setting = paymentSettings.find(s => s.id === item.paymentSettingsId);
      if (!setting || item.final_views === null || item.final_views === undefined) return 0;
      
      return calculatePayment(
          setting.basePay,
          setting.viewRate,
          setting.viewsPerUnit,
          item.final_views,
          setting.bonusThresholds,
          setting.maxPayout
      );
  };

  const calculateTotalPaid = (item: ContentItem): number => {
    return (item.payouts || []).reduce((sum, payout) => sum + payout.amount, 0);
  };

  const payoutSummary = finalizedItems.map(item => {
    const totalEarned = calculateFinalEarnings(item);
    const alreadyPaid = calculateTotalPaid(item);
    const remainingToPay = Math.max(0, totalEarned - alreadyPaid);
    return {
      ...item,
      totalEarned,
      alreadyPaid,
      remainingToPay,
    };
  }).filter(item => item.remainingToPay > 0);

  const totalPending = payoutSummary.reduce((sum, item) => sum + item.remainingToPay, 0);

  // --- Payout History Calculation (Items with status 'paid') ---
  const payoutHistory = contentItems.flatMap(item => 
      (item.payouts || []).map(payout => ({ ...payout, contentItem: item }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- Actions ---
  const handleProcessPayouts = () => {
    if (payoutSummary.length > 0) {
      setIsConfirmDialogOpen(true);
    } else {
      toast.info("No pending payouts to process.");
    }
  };

  const confirmPayout = async () => {
    setIsConfirmDialogOpen(false);
    try {
       await processPayout(payoutSummary);
    } catch (e) {
        console.error("Payout processing failed", e);
    }
  };
  
  if (isLoading) {
      return (
        <Card>
            <CardHeader>
              <CardTitle>Payouts</CardTitle>
            </CardHeader>
            <CardContent><p>Loading payout information...</p></CardContent>
        </Card>
      )
  }

  return (
    <Tabs defaultValue="pending">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Payouts</TabsTrigger>
          <TabsTrigger value="history">Payout History</TabsTrigger>
        </TabsList>
        <Button onClick={handleProcessPayouts} disabled={payoutSummary.length === 0}>
          Process All Pending Payouts ({formatCurrency(totalPending)})
        </Button>
      </div>

      {/* Pending Payouts Tab */}
      <TabsContent value="pending">
        <Card>
          <CardHeader>
            <CardTitle>Pending Payouts</CardTitle>
            <CardDescription>Content items with finalized views awaiting payout.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {payoutSummary.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending payouts based on finalized views.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead className="text-right">Final Views</TableHead>
                      <TableHead className="text-right">Total Earned</TableHead>
                      <TableHead className="text-right">Already Paid</TableHead>
                      <TableHead className="text-right font-semibold">Amount Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutSummary.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {item.video_url ? (
                            <a href={item.video_url} target="_blank" rel="noopener noreferrer" title={item.title} className="hover:underline flex items-center gap-1 group">
                               <span className="truncate group-hover:whitespace-normal">{item.title}</span>
                               <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            </a>
                          ) : (
                             <span title={item.title}>{item.title}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <PlatformIcon platform={item.platform} size={16} />
                            <span className="ml-2 capitalize">{item.platform}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(item.final_views ?? 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.totalEarned)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.alreadyPaid)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(item.remainingToPay)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Payout History Tab */}
      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
             <CardDescription>Record of all past payouts made.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {payoutHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No payout history yet.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead className="text-right">Final Views at Payout</TableHead>
                      <TableHead className="text-right">Amount Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutHistory.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>{format(new Date(payout.date), 'PP pp')}</TableCell>
                        <TableCell className="font-medium max-w-xs truncate">
                            {payout.contentItem?.video_url ? (
                                <a href={payout.contentItem.video_url} target="_blank" rel="noopener noreferrer" title={payout.contentItem.title} className="hover:underline flex items-center gap-1 group">
                                   <span className="truncate group-hover:whitespace-normal">{payout.contentItem.title}</span>
                                   <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                </a>
                            ) : (
                               <span title={payout.contentItem?.title || 'Content Deleted?'}>{payout.contentItem?.title || 'Content Deleted?'}</span>
                            )}
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center">
                            {payout.contentItem && <PlatformIcon platform={payout.contentItem.platform} size={16} />} 
                            <span className="ml-2 capitalize">{payout.contentItem?.platform || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(payout.viewCount)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(payout.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Payout Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payout</DialogTitle>
            <DialogDescription>
              You are about to process payouts totalling <span className="font-bold">{formatCurrency(totalPending)}</span> for {payoutSummary.length} finalized content item(s).
              This action will mark these items as 'Paid'.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmPayout}>Confirm & Process Payouts</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default PayoutManager;
