import React, { useState, useEffect, useCallback } from 'react';
import { useTracker } from '@/contexts/TrackerContext';
import { Platform, ContentItem, ContentItemStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PlatformIcon from './PlatformIcon';
import { Calendar as CalendarIcon, LinkIcon, AlertCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from "sonner";

// Still useful for platform detection
const SUPPORTED_PLATFORMS: Platform[] = ['youtube', 'tiktok', 'instagram'];

interface ContentItemFormProps {
  onClose: () => void;
}

// Simplified URL parser just for platform detection
const detectPlatformFromUrl = (url: string): Platform | null => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    } else if (hostname.includes('tiktok.com')) {
      return 'tiktok';
    } else if (hostname.includes('instagram.com') && urlObj.pathname.includes('/reel/')) {
      return 'instagram';
    }
  } catch (error) {
     // Ignore parsing errors silently
  }
  return null;
};

// Extract basic identifier (Video ID or path segment)
const extractIdFromUrl = (url: string, platform: Platform | null): string | null => {
    if (!platform || !url) return null;
    try {
        const urlObj = new URL(url);
        if (platform === 'youtube') {
            let videoId: string | null = null;
            if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.substring(1);
            } else {
                videoId = urlObj.searchParams.get('v');
            }
            return videoId;
        } else if (platform === 'tiktok') {
            const parts = urlObj.pathname.split('/');
            const idPart = parts.pop() || parts.pop();
            return idPart && /\d+/.test(idPart) ? idPart : null;
        } else if (platform === 'instagram') {
            const match = urlObj.pathname.match(/\/reel\/([^\/]+)/);
            return match ? match[1] : null;
        }
    } catch { return null; }
    return null;
}

const ContentItemForm: React.FC<ContentItemFormProps> = ({ onClose }) => {
  const { state, addContentItem } = useTracker();
  
  // Form State - Simplified for manual input
  const [videoUrl, setVideoUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<Platform | null>(null);
  const [title, setTitle] = useState('');
  const [uploadDate, setUploadDate] = useState<Date | null>(startOfDay(new Date())); // Default to today
  // Control calendar popover open state for auto-close
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [startingViews, setStartingViews] = useState(0);
  const [paymentSettingsId, setPaymentSettingsId] = useState('');

  // Set default payment setting on load
  useEffect(() => {
    if (state.paymentSettings.length > 0 && !paymentSettingsId) {
      setPaymentSettingsId(state.paymentSettings[0].id);
    }
  }, [state.paymentSettings, paymentSettingsId]);

  // Handle URL input change and detect platform
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setVideoUrl(newUrl);
    setUrlError(null);

    const platform = detectPlatformFromUrl(newUrl);
    setDetectedPlatform(platform);

    if (newUrl.trim() !== '' && !platform) {
        if (newUrl.length > 10) { // Show error only if URL seems substantial
             setUrlError("Could not detect YouTube, TikTok, or Instagram Reel URL.");
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!videoUrl || !detectedPlatform || !title || !uploadDate || !paymentSettingsId) {
        toast.error("Please fill in all fields accurately.");
        return;
    }
    if (startingViews < 0) {
        toast.error("Starting views cannot be negative.");
        return;
    }

    const platform_id = extractIdFromUrl(videoUrl, detectedPlatform);

    const contentData: Omit<ContentItem, 'id' | 'payouts' | 'final_views' | 'status'> & { status: ContentItemStatus; final_views: null } = {
        title,
        platform: detectedPlatform,
        platform_id: platform_id ?? undefined, // Store extracted ID if available
        video_url: videoUrl,
        uploadDate: uploadDate.toISOString(),
        starting_views: startingViews,
        final_views: null, // Initialized as null
        status: 'tracking', // Initial status
        paymentSettingsId
        // belongsToChannel and managedByManager can default or be omitted
    };

    try {
       await addContentItem(contentData);
       // addContentItem in context should show its own success toast
       onClose(); // Close dialog on success
    } catch (error) {
        console.error("Error adding content item:", error);
        // Context likely shows error toast
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Add New Content</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
        
          {/* 1. Video URL */}
          <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL (YouTube, TikTok, Instagram Reel)</Label>
              <div className="flex items-center gap-2">
                   <LinkIcon className="h-4 w-4 text-muted-foreground" />
                   <Input 
                    id="videoUrl" 
                    value={videoUrl} 
                    onChange={handleUrlChange} 
                    placeholder="Paste video link here..." 
                    required
                    className={cn(urlError && "border-destructive")}
                   />
              </div>
              {urlError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4"/> {urlError}</p>}
          </div>

          {/* 2. Platform (Read-only based on URL) */}
          <div className="space-y-2">
              <Label>Detected Platform</Label>
              <div className="flex items-center p-2 border rounded-md h-10 bg-muted">
                  {detectedPlatform ? (
                      <>
                          <PlatformIcon platform={detectedPlatform} className="mr-2" />
                          <span className="capitalize">{detectedPlatform}</span>
                      </>
                  ) : (
                      <span className="text-muted-foreground text-sm">Platform will be detected from URL...</span>
                  )}
              </div>
          </div>

          {/* 3. Content Title (Manual) */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base">Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Enter a descriptive title" 
              required 
              disabled={!detectedPlatform}
              className="min-h-[48px] text-base px-4" 
            />
          </div>

          {/* 4. Upload Date (Manual) */}
          <div className="space-y-2">
            <Label htmlFor="uploadDate" className="text-base">Actual Upload Date</Label>
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="uploadDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal min-h-[48px] text-base px-4",
                    !uploadDate && "text-muted-foreground",
                    "active:bg-accent/80" // Add touch feedback
                  )}
                  disabled={!detectedPlatform}
                  onClick={() => setDatePopoverOpen(true)}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {uploadDate ? format(uploadDate, "PPP") : <span>Pick upload date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={uploadDate}
                  onSelect={(date) => {
                    setUploadDate(date);
                    setDatePopoverOpen(false);
                  }}
                  defaultMonth={uploadDate ?? new Date()}
                  toDate={new Date()}
                  required
                  className="touch-pan-y" // Enable touch scrolling
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* 5. Starting Views (Manual) */}
           <div className="space-y-2">
               <Label htmlFor="startingViews">Starting Views (at time of adding)</Label>
               <Input 
                id="startingViews" 
                type="number" 
                min="0" 
                value={startingViews} 
                onChange={(e) => setStartingViews(parseInt(e.target.value) || 0)} 
                required 
                disabled={!detectedPlatform} // Enable only after platform is detected
               />
           </div>

          {/* 6. Payment Settings */}
          <div className="space-y-2">
            <Label htmlFor="paymentSettings">Payment Settings</Label>
            <Select 
              value={paymentSettingsId} 
              onValueChange={setPaymentSettingsId}
              disabled={state.paymentSettings.length === 0 || !detectedPlatform} // Enable only after platform is detected
              required
            >
              <SelectTrigger id="paymentSettings">
                <SelectValue placeholder={state.paymentSettings.length === 0 ? "Create settings first" : "Select payment rules"} />
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
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4"/> You need to create payment settings first.
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
            disabled={!detectedPlatform || !title || !uploadDate || state.paymentSettings.length === 0}
          >
            Add Content
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ContentItemForm;
