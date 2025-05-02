
import React, { useState, useEffect } from 'react';
import { useTracker } from '@/contexts/TrackerContext';
import { Platform } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PlatformIcon from './PlatformIcon';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ContentItemFormProps {
  editingId?: string;
  onClose: () => void;
}

const ContentItemForm: React.FC<ContentItemFormProps> = ({ editingId, onClose }) => {
  const { state, addContentItem, updateContentItem } = useTracker();
  
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [uploadDate, setUploadDate] = useState<Date>(new Date());
  const [views, setViews] = useState(0);
  const [paymentSettingsId, setPaymentSettingsId] = useState('');

  // Load existing content if editing
  useEffect(() => {
    if (editingId) {
      const existingContent = state.contentItems.find(item => item.id === editingId);
      if (existingContent) {
        setTitle(existingContent.title);
        setPlatform(existingContent.platform);
        setUploadDate(new Date(existingContent.uploadDate));
        setViews(existingContent.views);
        setPaymentSettingsId(existingContent.paymentSettingsId);
      }
    } else if (state.paymentSettings.length > 0) {
      // Set default payment setting for new items
      setPaymentSettingsId(state.paymentSettings[0].id);
    }
  }, [editingId, state.contentItems, state.paymentSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      const existingContent = state.contentItems.find(item => item.id === editingId);
      if (existingContent) {
        updateContentItem({
          ...existingContent,
          title,
          platform,
          uploadDate: uploadDate.toISOString(),
          views,
          paymentSettingsId
        });
      }
    } else {
      addContentItem({
        title,
        platform,
        uploadDate: uploadDate.toISOString(),
        views,
        paymentSettingsId
      });
    }
    
    onClose();
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{editingId ? 'Edit Content' : 'Add Content'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Content Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., How to Make a Great Video" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={(value) => setPlatform(value as Platform)}>
              <SelectTrigger id="platform">
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
              <SelectContent>
                {state.platforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    <div className="flex items-center">
                      <PlatformIcon platform={p} className="mr-2" />
                      <span className="capitalize">{p}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uploadDate">Upload Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="uploadDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !uploadDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {uploadDate ? format(uploadDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={uploadDate}
                  onSelect={(date) => date && setUploadDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="views">Views</Label>
            <Input 
              id="views" 
              type="number" 
              min="0" 
              value={views} 
              onChange={(e) => setViews(parseInt(e.target.value) || 0)} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentSettings">Payment Settings</Label>
            <Select 
              value={paymentSettingsId} 
              onValueChange={setPaymentSettingsId}
              disabled={state.paymentSettings.length === 0}
            >
              <SelectTrigger id="paymentSettings">
                <SelectValue placeholder="Select payment settings" />
              </SelectTrigger>
              <SelectContent>
                {state.paymentSettings.map((setting) => (
                  <SelectItem key={setting.id} value={setting.id}>
                    {setting.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.paymentSettings.length === 0 && (
              <p className="text-sm text-destructive">
                You need to create payment settings first.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={state.paymentSettings.length === 0}
          >
            {editingId ? 'Update Content' : 'Add Content'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ContentItemForm;
