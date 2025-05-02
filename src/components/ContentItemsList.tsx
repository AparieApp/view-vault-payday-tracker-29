
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { ContentItem, Channel } from "@/types";
import { getChannels, assignContentToChannel, getChannelsForContent } from "@/services/supabaseService";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import ViewCountUpdater from "./ViewCountUpdater";
import { toast } from "sonner";

const ContentItemsList: React.FC = () => {
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

        {contentItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="mb-4 text-muted-foreground">
                No content items added yet. Start tracking your content to see
                earnings.
              </p>
              <Button onClick={handleAddClick}>
                <Plus className="mr-2 h-4 w-4" /> Add Your First Content Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead>Payment Settings</TableHead>
                  <TableHead>Channel?</TableHead>
                  <TableHead>Manager?</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentItems.map((item) => {
                  const paymentSetting = paymentSettings.find(
                    (setting) => setting.id === item.paymentSettingsId
                  );
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <PlatformIcon platform={item.platform} size={20} />
                          <span className="ml-2 capitalize">{item.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(item.uploadDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          {formatNumber(item.views)}
                          <ViewCountUpdater
                            contentItemId={item.id}
                            buttonText=""
                            variant="ghost"
                            size="icon"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {paymentSetting ? paymentSetting.name : "None"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Checkbox
                            checked={item.belongsToChannel ?? false}
                            onCheckedChange={() => handleAttributionToggle(item, 'belongsToChannel')}
                          />
                          {item.belongsToChannel ? (
                            <Check className="h-4 w-4 ml-2 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 ml-2 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Checkbox
                            checked={item.managedByManager ?? false}
                            onCheckedChange={() => handleAttributionToggle(item, 'managedByManager')}
                          />
                          {item.managedByManager ? (
                            <Check className="h-4 w-4 ml-2 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 ml-2 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* To be implemented with earnings calculation */}
                        {formatCurrency(0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(item.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(item.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

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
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                content item and any associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default ContentItemsList;
