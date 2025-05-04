import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTracker } from "@/contexts/TrackerContext";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Plus, ExternalLink, Edit, Trash, Check, X } from "lucide-react";
import PlatformIcon from "./PlatformIcon";
import ContentItemForm from "./ContentItemForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ContentItem, Channel } from "@/types";
import { getChannels, assignContentToChannel, getChannelsForContent } from "@/services/supabaseService";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import ViewCountUpdater from "./ViewCountUpdater";
import { toast } from "sonner";
import { format, addDays } from 'date-fns';

const ActiveTrackingList: React.FC = () => {
  const { state, deleteContentItem, updateContentItem } = useTracker();
  const { contentItems, paymentSettings, isLoading } = state;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [contentChannels, setContentChannels] = useState<Record<string, Channel[]>>({});
  const [loadingChannels, setLoadingChannels] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoadingChannels(true);
    try {
      const allChannels = await getChannels();
      setChannels(allChannels);
      
      // Fetch channel associations for each content item
      const channelMap: Record<string, Channel[]> = {};
      
      for (const item of contentItems) {
        const itemChannels = await getChannelsForContent(item.id);
        channelMap[item.id] = itemChannels;
      }
      
      setContentChannels(channelMap);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleAddClick = () => {
    setSelectedItemId(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (id: string) => {
    setSelectedItemId(id);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      await deleteContentItem(itemToDelete);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedItemId(null);
  };
  
  const handleAttributionToggle = async (item: ContentItem, field: 'belongsToChannel' | 'managedByManager') => {
    try {
      // Update the content item in Supabase
      const updated = { ...item };
      
      if (field === 'belongsToChannel') {
        updated.belongsToChannel = !item.belongsToChannel;
      } else {
        updated.managedByManager = !item.managedByManager;
      }
      
      await updateContentItem(updated);
      
      // Toast notification
      toast("Setting updated", {
        description: `Content item ${field === 'belongsToChannel' ? 'channel attribution' : 'manager attribution'} updated.`
      });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast("Error", {
        description: `Failed to update content item attribution.`,
        variant: "destructive"
      });
    }
  };
  
  const handleChannelSelect = async (contentItemId: string, channelId: string) => {
    try {
      const success = await assignContentToChannel(contentItemId, channelId);
      
      if (success) {
        toast("Channel assigned", {
          description: "Content item assigned to channel successfully."
        });
        
        // Update local state
        const channel = channels.find(c => c.id === channelId);
        if (channel) {
          setContentChannels(prev => ({
            ...prev,
            [contentItemId]: [...(prev[contentItemId] || []), channel]
          }));
        }
      }
    } catch (error) {
      console.error('Error assigning channel:', error);
      toast("Error", {
        description: "Failed to assign content to channel.",
        variant: "destructive"
      });
    }
  };

  const activeItems = contentItems.filter(item => item.status === 'tracking');

  const getTrackingEndDate = (item: ContentItem): Date | null => {
    const setting = paymentSettings.find(s => s.id === item.paymentSettingsId);
    if (!setting || !item.uploadDate) return null;
    try {
      const startDate = new Date(item.uploadDate);
      return addDays(startDate, setting.trackingPeriodDays);
    } catch (e) {
      return null; // Invalid date format
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Content Items</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-full mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded w-full mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Content Items</h2>
          <div className="flex gap-2">
            <ViewCountUpdater buttonText="Update All View Counts" />
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" /> Add Content Item
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Actively Tracking Content</CardTitle>
          </CardHeader>
          <CardContent>
            {activeItems.length === 0 ? (
              <p className="text-muted-foreground">
                No content items are currently being tracked. Add new content to begin.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Tracking End</TableHead>
                      <TableHead className="text-right">Starting Views</TableHead>
                      <TableHead>Payment Settings</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeItems.map((item) => {
                      const paymentSetting = paymentSettings.find(
                        (setting) => setting.id === item.paymentSettingsId
                      );
                      const trackingEndDate = getTrackingEndDate(item);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.video_url ? (
                                <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                    {item.title}
                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                </a>
                            ) : item.title}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <PlatformIcon platform={item.platform} size={20} />
                              <span className="ml-2 capitalize">{item.platform}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(item.uploadDate), 'PP')}
                          </TableCell>
                          <TableCell>
                            {trackingEndDate ? format(trackingEndDate, 'PP') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(item.starting_views)}
                          </TableCell>
                          <TableCell>
                            {paymentSetting ? paymentSetting.name : "None"}
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item.id)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <ContentItemForm
              editingId={selectedItemId || undefined}
              onClose={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the content item and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default ActiveTrackingList;
