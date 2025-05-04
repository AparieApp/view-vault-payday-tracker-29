import React, { useState } from 'react';
import { useTracker } from '@/contexts/TrackerContext';
import { format, addDays, isAfter } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import PlatformIcon from './PlatformIcon';
import { formatNumber } from '@/lib/utils';
import { ExternalLink, Plus, Trash } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ContentItemForm from './ContentItemForm';
import type { ContentItem } from '@/types';

const ActiveTrackingList: React.FC = () => {
  const { state, deleteContentItem } = useTracker();
  const { contentItems, paymentSettings, isLoading } = state;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | undefined>(undefined);

  const deletingItem = contentItems.find(i => i.id === deletingId);

  const today = new Date();
  // 1) Only items with status 'tracking' and end date >= today
  const activeItems = contentItems
    .filter(item => item.status === 'tracking')
    .filter(item => {
      const rule = paymentSettings.find(r => r.id === item.paymentSettingsId);
      if (!rule || !item.uploadDate) return false;
      const end = addDays(new Date(item.uploadDate), Number(rule.trackingPeriodDays));
      return isAfter(end, today) || end.getTime() === today.getTime();
    });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Active Tracking</CardTitle>
          <Button onClick={() => setIsAddOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Content
          </Button>
        </CardHeader>
        <CardContent>
          {activeItems.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No content is currently being tracked.
            </p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {activeItems.map(item => {
                const rule = paymentSettings.find(r => r.id === item.paymentSettingsId);
                const endDate = rule && item.uploadDate
                  ? addDays(new Date(item.uploadDate), Number(rule.trackingPeriodDays))
                  : null;

                return (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger>{item.title}</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={item.platform} size={16} />
                        <span className="capitalize">{item.platform}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          Upload Date:{' '}
                          {item.uploadDate
                            ? format(new Date(item.uploadDate), 'PP')
                            : 'N/A'}
                        </div>
                        <div>
                          End Date:{' '}
                          {endDate ? format(endDate, 'PP') : 'N/A'}
                        </div>
                        <div>Starting Views: {formatNumber(item.starting_views)}</div>
                        <div>Payment Rule: {rule?.name ?? 'None'}</div>
                      </div>
                      {item.video_url && (
                        <a
                          href={item.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                        >
                          View Video <ExternalLink className="inline h-4 w-4" />
                        </a>
                      )}
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingId(item.id)}
                        >
                          <Trash className="mr-1 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Add Content Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle>Add Content Item</DialogTitle>
          <DialogDescription>
            Fill in details to add a new content item.
          </DialogDescription>
          <ContentItemForm onClose={() => setIsAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={open => !open && setDeletingId(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tracked Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingItem?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  deleteContentItem(deletingId);
                }
                setDeletingId(undefined);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ActiveTrackingList;
