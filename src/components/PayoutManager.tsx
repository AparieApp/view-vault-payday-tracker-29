
import React, { useState } from 'react';
import { useTracker } from '@/contexts/TrackerContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { DollarSign, CalendarDays } from 'lucide-react';
import PlatformIcon from './PlatformIcon';
import { PayoutSummary } from '@/types';

const PayoutManager: React.FC = () => {
  const { state, processPayout, generatePayoutSummary } = useTracker();
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('pending');
  
  const payoutSummary = generatePayoutSummary();
  const totalPending = payoutSummary.reduce((sum, item) => sum + item.remainingToPay, 0);
  
  const handleProcessPayout = () => {
    processPayout(payoutSummary);
    setIsPayoutDialogOpen(false);
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Payments</h2>
        <Button 
          onClick={() => setIsPayoutDialogOpen(true)} 
          disabled={payoutSummary.length === 0}
          className="bg-brand-vivid-purple hover:bg-brand-vivid-purple/90"
        >
          <DollarSign className="mr-1 h-4 w-4" /> Process Payout
        </Button>
      </div>

      <Tabs defaultValue="pending" onValueChange={setCurrentTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending Payouts</TabsTrigger>
          <TabsTrigger value="history">Payout History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {payoutSummary.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending payouts.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Pending Payout Total: {formatCurrency(totalPending)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardContent className="pt-6 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Platform</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Already Paid</TableHead>
                        <TableHead>Current Total</TableHead>
                        <TableHead>Pending</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payoutSummary.map((item) => (
                        <TableRow key={item.contentId}>
                          <TableCell>
                            <PlatformIcon platform={item.platform} />
                          </TableCell>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>
                            {item.viewsAtLastPayout > 0 ? (
                              <span>
                                {formatNumber(item.viewsAtLastPayout)} → {formatNumber(item.currentViews)}
                              </span>
                            ) : (
                              formatNumber(item.currentViews)
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(item.alreadyPaid)}</TableCell>
                          <TableCell>{formatCurrency(item.currentEarned)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(item.remainingToPay)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="history">
          {state.payouts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payment history yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.payouts.map((payout) => {
                      const contentItem = state.contentItems.find(item => item.id === payout.contentItemId);
                      return (
                        <TableRow key={payout.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                              {format(new Date(payout.date), 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {contentItem ? contentItem.title : 'Unknown Content'}
                          </TableCell>
                          <TableCell>
                            {contentItem && <PlatformIcon platform={contentItem.platform} />}
                          </TableCell>
                          <TableCell>{formatNumber(payout.viewCount)}</TableCell>
                          <TableCell>{formatCurrency(payout.amount)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payout</DialogTitle>
            <DialogDescription>
              You are about to process a payout of {formatCurrency(totalPending)} for {payoutSummary.length} content items.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutSummary.map((item) => (
                  <TableRow key={item.contentId}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell><PlatformIcon platform={item.platform} /></TableCell>
                    <TableCell>{formatCurrency(item.remainingToPay)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProcessPayout} className="bg-brand-vivid-purple hover:bg-brand-vivid-purple/90">
              Confirm Payout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PayoutManager;
