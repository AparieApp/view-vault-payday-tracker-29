
import React, { useState } from 'react';
import { Button } from './ui/button';
import { toast } from "sonner";
import { RefreshCw } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useTracker } from '@/contexts/TrackerContext';

interface ViewCountUpdaterProps {
  contentItemId?: string; // Optional: specific content item to update
  buttonText?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const ViewCountUpdater: React.FC<ViewCountUpdaterProps> = ({ 
  contentItemId,
  buttonText = "Update View Counts",
  variant = "outline",
  size = "default"
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { refreshData } = useTracker();
  
  const updateViewCounts = async () => {
    setIsUpdating(true);
    
    try {
      const payload: { contentId?: string } = {};
      
      if (contentItemId) {
        payload.contentId = contentItemId;
      }
      
      const { data, error } = await supabase.functions.invoke('update-view-counts', {
        body: payload
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.success) {
        toast({
          title: "View counts updated",
          description: data.message
        });
        
        // Refresh data in the context
        await refreshData();
      } else {
        toast({
          title: "Update failed",
          description: data.error || "Failed to update view counts",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating view counts:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Button 
      variant={variant}
      size={size}
      onClick={updateViewCounts}
      disabled={isUpdating}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
      {buttonText}
    </Button>
  );
};

export default ViewCountUpdater;
