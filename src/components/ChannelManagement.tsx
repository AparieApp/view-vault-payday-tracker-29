
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash } from 'lucide-react';
import PlatformIcon from './PlatformIcon';
import { Platform } from '@/types';
import { Channel, getChannels, createChannel, updateChannel, deleteChannel, getPaymentSettings } from '@/services/supabaseService';

const ChannelManagement: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    platform: 'youtube' as Platform,
    platformId: '',
    platformUrl: '',
    defaultPaymentSettingsId: ''
  });
  const [paymentSettingsOptions, setPaymentSettingsOptions] = useState<{ value: string; label: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchChannels();
    fetchPaymentSettings();
  }, []);

  const fetchChannels = async () => {
    setIsLoading(true);
    const fetchedChannels = await getChannels();
    setChannels(fetchedChannels);
    setIsLoading(false);
  };

  const fetchPaymentSettings = async () => {
    const settings = await getPaymentSettings();
    setPaymentSettingsOptions(
      settings.map(setting => ({
        value: setting.id,
        label: setting.name
      }))
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddNewClick = () => {
    setCurrentChannel(null);
    setFormData({
      name: '',
      platform: 'youtube',
      platformId: '',
      platformUrl: '',
      defaultPaymentSettingsId: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditClick = (channel: Channel) => {
    setCurrentChannel(channel);
    setFormData({
      name: channel.name,
      platform: channel.platform,
      platformId: channel.platform_id,
      platformUrl: channel.platform_url,
      defaultPaymentSettingsId: channel.default_payment_settings_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (channelId: string) => {
    setChannelToDelete(channelId);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentChannel) {
        // Update existing channel
        const success = await updateChannel({
          id: currentChannel.id,
          name: formData.name,
          platform: formData.platform,
          platform_id: formData.platformId,
          platform_url: formData.platformUrl,
          default_payment_settings_id: formData.defaultPaymentSettingsId || null
        });
        
        if (success) {
          toast({
            title: "Channel updated",
            description: `Channel "${formData.name}" has been updated successfully.`
          });
          fetchChannels();
        }
      } else {
        // Create new channel
        const newChannel = await createChannel({
          name: formData.name,
          platform: formData.platform,
          platform_id: formData.platformId,
          platform_url: formData.platformUrl,
          default_payment_settings_id: formData.defaultPaymentSettingsId || null
        });
        
        if (newChannel) {
          toast({
            title: "Channel created",
            description: `Channel "${formData.name}" has been created successfully.`
          });
          fetchChannels();
        }
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving channel:', error);
      toast({
        title: "Error",
        description: "An error occurred while saving the channel.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!channelToDelete) return;
    
    try {
      const success = await deleteChannel(channelToDelete);
      
      if (success) {
        toast({
          title: "Channel deleted",
          description: "Channel has been deleted successfully."
        });
        fetchChannels();
      }
      
      setIsDeleteDialogOpen(false);
      setChannelToDelete(null);
    } catch (error) {
      console.error('Error deleting channel:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the channel.",
        variant: "destructive"
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Channel Management</h2>
        <Button onClick={handleAddNewClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Channel
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <div className="text-center text-muted-foreground">Loading channels...</div>
        </div>
      ) : channels.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-60 text-center">
            <div className="text-muted-foreground mb-4">
              No channels added yet. Add your first channel to start tracking content.
            </div>
            <Button onClick={handleAddNewClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Channel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map(channel => (
            <Card key={channel.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <div className="mr-2">
                    <PlatformIcon platform={channel.platform} size={24} />
                  </div>
                  <CardTitle className="text-lg">{channel.name}</CardTitle>
                </div>
                <CardDescription>{channel.platform}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform ID:</span>
                    <span className="truncate max-w-[180px]">{channel.platform_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">URL:</span>
                    <a 
                      href={channel.platform_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary truncate max-w-[180px] hover:underline"
                    >
                      {new URL(channel.platform_url).hostname}
                    </a>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEditClick(channel)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(channel.id)}>
                  <Trash className="h-4 w-4 mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Channel Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentChannel ? 'Edit Channel' : 'Add New Channel'}</DialogTitle>
            <DialogDescription>
              {currentChannel 
                ? 'Update the details for this channel.' 
                : 'Enter the details of the channel you want to track.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Channel Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter channel name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => handleSelectChange('platform', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="threads">Threads</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="bluesky">Bluesky</SelectItem>
                    <SelectItem value="pinterest">Pinterest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="platformId">Platform ID</Label>
                <Input
                  id="platformId"
                  name="platformId"
                  value={formData.platformId}
                  onChange={handleInputChange}
                  placeholder="Enter platform ID or username"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="platformUrl">Platform URL</Label>
                <Input
                  id="platformUrl"
                  name="platformUrl"
                  value={formData.platformUrl}
                  onChange={handleInputChange}
                  placeholder="Enter channel URL"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="defaultPaymentSettings">Default Payment Settings</Label>
                <Select
                  value={formData.defaultPaymentSettingsId}
                  onValueChange={(value) => handleSelectChange('defaultPaymentSettingsId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment settings (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {paymentSettingsOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{currentChannel ? 'Update' : 'Add'} Channel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this channel and remove any associations to content items.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChannelManagement;
