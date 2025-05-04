import React, { useState, useEffect } from 'react';
import { useTracker } from '@/contexts/TrackerContext';
import { ContentItem, ContentItemStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PlatformIcon from './PlatformIcon';
import { formatNumber } from '@/lib/utils';
import { format, addDays, isPast } from 'date-fns';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

const FinalizeViewsList: React.FC = () => {
  const { state, updateContentItem } = useTracker();
  const { contentItems, paymentSettings, isLoading } = state;

  // Local state to manage input values for final views
  const [finalViewInputs, setFinalViewInputs] = useState<Record<string, string>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null); // Track which item is being saved

  // Determine which items are ready for finalization
  const finalizableItems = contentItems.filter(item => {
    if (item.status !== 'tracking') return false;
    const setting = paymentSettings.find(s => s.id === item.paymentSettingsId);
    if (!setting || !item.uploadDate) return false;
    try {
      const startDate = new Date(item.uploadDate);
      const days = Number(setting.trackingPeriodDays);
      if (isNaN(days)) return false;
      const endDate = addDays(startDate, days);
      return isPast(endDate);
    } catch {
      return false;
    }
  });

  // Initialize input state when items change
  useEffect(() => {
    const initialInputs: Record<string, string> = {};
    finalizableItems.forEach(item => {
      // Only set if not already present, don't overwrite user input
      if (finalViewInputs[item.id] === undefined) {
        initialInputs[item.id] = ''; // Start empty
      }
    });
    // Merge with existing inputs to preserve user typing
    setFinalViewInputs(prev => ({ ...initialInputs, ...prev }));
  }, [contentItems, paymentSettings]); // Re-run if items or settings change

  const handleInputChange = (itemId: string, value: string) => {
    setFinalViewInputs(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSaveFinalViews = async (item: ContentItem) => {
    const finalViewsStr = finalViewInputs[item.id];
    const finalViewsNum = parseInt(finalViewsStr, 10);

    if (isNaN(finalViewsNum) || finalViewsStr.trim() === '') {
      toast.error('Please enter a valid number for final views.');
      return;
    }

    if (finalViewsNum < item.starting_views) {
      toast.error('Final views cannot be less than starting views.', {
        description: `Starting views were ${formatNumber(item.starting_views)}.`
      });
      return;
    }

    setSavingItemId(item.id);
    try {
      await updateContentItem({
        ...item,
        final_views: finalViewsNum,
        status: 'finalized' as ContentItemStatus,
      });
      toast.success(`Final views saved for "${item.title}".`);
      // Remove the input from local state after successful save
      setFinalViewInputs(prev => {
        const newState = { ...prev };
        delete newState[item.id];
        return newState;
      });
    } catch (error) {
      // Error toast is likely handled by the context
      console.error("Error saving final views:", error);
    } finally {
      setSavingItemId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Finalize Content Views</CardTitle>
          <CardDescription>Items past their tracking period appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finalize Content Views</CardTitle>
        <CardDescription>
          Enter the final view count for items whose tracking period has ended.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {finalizableItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No content items are ready for final view input yet.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Starting Views</TableHead>
                  <TableHead>Final Views Input</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalizableItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                       <span title={item.title}>{item.title}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <PlatformIcon platform={item.platform} size={16} />
                        <span className="ml-2 capitalize">{item.platform}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.starting_views)}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={item.starting_views} // Prevent going below start
                        placeholder={`Min ${formatNumber(item.starting_views)} views`}
                        value={finalViewInputs[item.id] || ''}
                        onChange={(e) => handleInputChange(item.id, e.target.value)}
                        className="max-w-[180px]" // Limit width
                        disabled={savingItemId === item.id}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleSaveFinalViews(item)}
                        disabled={!finalViewInputs[item.id] || finalViewInputs[item.id].trim() === '' || savingItemId === item.id}
                        size="sm"
                      >
                        {savingItemId === item.id ? 'Saving...' : 'Save Final Views'}
                        {savingItemId !== item.id && <CheckCircle className="ml-2 h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinalizeViewsList; 