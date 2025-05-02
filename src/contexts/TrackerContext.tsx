
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { toast } from "sonner";
import { Platform, PaymentSettings, ContentItem, Payout, PayoutSummary } from '@/types';
import { calculatePayment, isWithinDays } from '@/lib/utils';
import { 
  getPaymentSettings, 
  createPaymentSetting, 
  updateChannel, 
  getContentItems, 
  createContentItem,
  updateContentItem,
  deleteContentItem,
  createPayout
} from '@/services/supabaseService';
import { supabase } from "@/integrations/supabase/client";

// Define the state shape
interface TrackerState {
  platforms: Platform[];
  paymentSettings: PaymentSettings[];
  contentItems: ContentItem[];
  payouts: Payout[];
  isLoading: boolean;
}

// Define action types
type TrackerAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'FETCH_PAYMENT_SETTINGS'; payload: PaymentSettings[] }
  | { type: 'ADD_PAYMENT_SETTING'; payload: PaymentSettings }
  | { type: 'UPDATE_PAYMENT_SETTING'; payload: PaymentSettings }
  | { type: 'DELETE_PAYMENT_SETTING'; payload: string }
  | { type: 'FETCH_CONTENT_ITEMS'; payload: ContentItem[] }
  | { type: 'ADD_CONTENT_ITEM'; payload: ContentItem }
  | { type: 'UPDATE_CONTENT_ITEM'; payload: ContentItem }
  | { type: 'DELETE_CONTENT_ITEM'; payload: string }
  | { type: 'ADD_PAYOUT'; payload: Payout[] }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: TrackerState = {
  platforms: [
    'tiktok',
    'youtube',
    'instagram',
    'twitter',
    'linkedin',
    'threads',
    'facebook',
    'bluesky',
    'pinterest'
  ],
  paymentSettings: [],
  contentItems: [],
  payouts: [],
  isLoading: true
};

// Create context
interface TrackerContextType {
  state: TrackerState;
  addPaymentSetting: (settings: Omit<PaymentSettings, 'id'>) => void;
  updatePaymentSetting: (settings: PaymentSettings) => void;
  deletePaymentSetting: (id: string) => void;
  addContentItem: (item: Omit<ContentItem, 'id' | 'payouts'>) => void;
  updateContentItem: (item: ContentItem) => void;
  deleteContentItem: (id: string) => void;
  processPayout: (payoutItems: PayoutSummary[]) => void;
  resetState: () => void;
  calculateEarnings: (contentItem: ContentItem) => number;
  calculatePendingEarnings: (contentItem: ContentItem) => number;
  calculateTotalPaid: (contentItem: ContentItem) => number;
  generatePayoutSummary: () => PayoutSummary[];
  getActiveContentItems: () => ContentItem[];
  refreshData: () => Promise<void>;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

// Reducer
const trackerReducer = (state: TrackerState, action: TrackerAction): TrackerState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'FETCH_PAYMENT_SETTINGS':
      return {
        ...state,
        paymentSettings: action.payload
      };
    
    case 'ADD_PAYMENT_SETTING':
      return {
        ...state,
        paymentSettings: [...state.paymentSettings, action.payload]
      };
    
    case 'UPDATE_PAYMENT_SETTING':
      return {
        ...state,
        paymentSettings: state.paymentSettings.map(setting =>
          setting.id === action.payload.id ? action.payload : setting
        )
      };
    
    case 'DELETE_PAYMENT_SETTING':
      return {
        ...state,
        paymentSettings: state.paymentSettings.filter(setting => setting.id !== action.payload)
      };
    
    case 'FETCH_CONTENT_ITEMS':
      return {
        ...state,
        contentItems: action.payload
      };
    
    case 'ADD_CONTENT_ITEM':
      return {
        ...state,
        contentItems: [...state.contentItems, action.payload]
      };
    
    case 'UPDATE_CONTENT_ITEM':
      return {
        ...state,
        contentItems: state.contentItems.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    
    case 'DELETE_CONTENT_ITEM':
      return {
        ...state,
        contentItems: state.contentItems.filter(item => item.id !== action.payload)
      };
    
    case 'ADD_PAYOUT':
      return {
        ...state,
        payouts: [...state.payouts, ...action.payload]
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

// Provider component
export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(trackerReducer, initialState);

  // Load data from Supabase on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Function to load data from Supabase
  const loadData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Load payment settings
      const paymentSettings = await getPaymentSettings();
      dispatch({ type: 'FETCH_PAYMENT_SETTINGS', payload: paymentSettings });
      
      // Load content items with their payouts
      const contentItems = await getContentItems();
      dispatch({ type: 'FETCH_CONTENT_ITEMS', payload: contentItems });
      
      // Note: payouts are loaded with content items in the getContentItems function
      
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      toast({
        title: "Error",
        description: "Failed to load data from the database.",
        variant: "destructive"
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  // Add a new payment setting
  const addPaymentSetting = async (settings: Omit<PaymentSettings, 'id'>) => {
    try {
      const newSetting = await createPaymentSetting(settings);
      if (newSetting) {
        dispatch({ type: 'ADD_PAYMENT_SETTING', payload: newSetting });
        toast({
          title: "Success",
          description: "Payment setting added successfully"
        });
      }
    } catch (error) {
      console.error('Error adding payment setting:', error);
      toast({
        title: "Error",
        description: "Failed to add payment setting.",
        variant: "destructive"
      });
    }
  };

  // Update an existing payment setting
  const updatePaymentSetting = async (settings: PaymentSettings) => {
    try {
      // For now, we'll just update the local state
      // In a real implementation, we would update the Supabase record
      dispatch({ type: 'UPDATE_PAYMENT_SETTING', payload: settings });
      toast({
        title: "Success",
        description: "Payment setting updated successfully"
      });
    } catch (error) {
      console.error('Error updating payment setting:', error);
      toast({
        title: "Error", 
        description: "Failed to update payment setting.",
        variant: "destructive"
      });
    }
  };

  // Delete a payment setting
  const deletePaymentSetting = async (id: string) => {
    try {
      // For now, we'll just update the local state
      // In a real implementation, we would delete the Supabase record
      dispatch({ type: 'DELETE_PAYMENT_SETTING', payload: id });
      toast({
        title: "Success",
        description: "Payment setting deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting payment setting:', error);
      toast({
        title: "Error",
        description: "Failed to delete payment setting.",
        variant: "destructive"
      });
    }
  };

  // Add a new content item
  const addContentItem = async (item: Omit<ContentItem, 'id' | 'payouts'>) => {
    try {
      const newItem = await createContentItem(item);
      if (newItem) {
        dispatch({ type: 'ADD_CONTENT_ITEM', payload: newItem });
        toast({
          title: "Success",
          description: "Content item added successfully"
        });
      }
    } catch (error) {
      console.error('Error adding content item:', error);
      toast({
        title: "Error",
        description: "Failed to add content item.",
        variant: "destructive"
      });
    }
  };

  // Update an existing content item
  const updateContentItem = async (item: ContentItem) => {
    try {
      const success = await updateContentItem(item);
      if (success) {
        dispatch({ type: 'UPDATE_CONTENT_ITEM', payload: item });
        toast({
          title: "Success",
          description: "Content item updated successfully"
        });
      }
    } catch (error) {
      console.error('Error updating content item:', error);
      toast({
        title: "Error",
        description: "Failed to update content item.",
        variant: "destructive"
      });
    }
  };

  // Delete a content item
  const deleteContentItem = async (id: string) => {
    try {
      const success = await deleteContentItem(id);
      if (success) {
        dispatch({ type: 'DELETE_CONTENT_ITEM', payload: id });
        toast({
          title: "Success",
          description: "Content item deleted successfully"
        });
      }
    } catch (error) {
      console.error('Error deleting content item:', error);
      toast({
        title: "Error",
        description: "Failed to delete content item.",
        variant: "destructive"
      });
    }
  };

  // Process payouts for multiple content items
  const processPayout = async (payoutItems: PayoutSummary[]) => {
    try {
      const payouts: Payout[] = [];
      const updatedContentItems: ContentItem[] = [];

      for (const item of payoutItems) {
        if (item.remainingToPay <= 0) continue;

        const contentItem = state.contentItems.find(c => c.id === item.contentId);
        if (!contentItem) continue;

        const payout = {
          date: new Date().toISOString(),
          amount: item.remainingToPay,
          contentItemId: item.contentId,
          viewCount: item.currentViews
        };

        const newPayout = await createPayout(payout);
        if (newPayout) {
          payouts.push(newPayout);

          // Update content item with the new payout
          const updatedItem = {
            ...contentItem,
            payouts: [...contentItem.payouts, newPayout]
          };
          updatedContentItems.push(updatedItem);
        }
      }

      if (payouts.length > 0) {
        // Add all payouts
        dispatch({ type: 'ADD_PAYOUT', payload: payouts });
        
        // Update all content items
        updatedContentItems.forEach(item => {
          dispatch({ type: 'UPDATE_CONTENT_ITEM', payload: item });
        });
        
        toast({
          title: "Success",
          description: `Successfully processed ${payouts.length} payouts`
        });
      } else {
        toast({
          title: "Info",
          description: "No payouts to process"
        });
      }
    } catch (error) {
      console.error('Error processing payouts:', error);
      toast({
        title: "Error",
        description: "Failed to process payouts.",
        variant: "destructive"
      });
    }
  };

  // Reset the state to initial values
  const resetState = () => {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      dispatch({ type: 'RESET_STATE' });
      toast({
        title: "Success",
        description: "All data has been reset"
      });
    }
  };

  // Calculate total earnings for a content item
  const calculateEarnings = (contentItem: ContentItem) => {
    const settings = state.paymentSettings.find(s => s.id === contentItem.paymentSettingsId);
    if (!settings) return 0;

    return calculatePayment(
      settings.basePay,
      settings.viewRate,
      settings.viewsPerUnit,
      contentItem.views,
      settings.bonusThresholds,
      settings.maxPayout
    );
  };

  // Calculate pending earnings (not yet paid out)
  const calculatePendingEarnings = (contentItem: ContentItem) => {
    const totalEarnings = calculateEarnings(contentItem);
    const totalPaid = calculateTotalPaid(contentItem);
    return Math.max(0, totalEarnings - totalPaid);
  };

  // Calculate total amount paid for a content item
  const calculateTotalPaid = (contentItem: ContentItem) => {
    return contentItem.payouts.reduce((sum, payout) => sum + payout.amount, 0);
  };

  // Get only active content items (within tracking period)
  const getActiveContentItems = () => {
    return state.contentItems.filter(item => {
      const settings = state.paymentSettings.find(s => s.id === item.paymentSettingsId);
      if (!settings) return false;

      const uploadDate = new Date(item.uploadDate);
      return isWithinDays(uploadDate, settings.trackingPeriodDays);
    });
  };

  // Generate a summary of all pending payouts
  const generatePayoutSummary = (): PayoutSummary[] => {
    const activeItems = getActiveContentItems();
    
    return activeItems.map(item => {
      const lastPayout = item.payouts.length > 0 
        ? item.payouts.reduce((latest, payout) => {
            return new Date(payout.date) > new Date(latest.date) ? payout : latest;
          }, item.payouts[0])
        : null;
      
      const viewsAtLastPayout = lastPayout ? lastPayout.viewCount : 0;
      const totalPaid = calculateTotalPaid(item);
      const currentEarned = calculateEarnings(item);
      
      return {
        contentId: item.id,
        title: item.title,
        platform: item.platform,
        alreadyPaid: totalPaid,
        currentEarned,
        remainingToPay: Math.max(0, currentEarned - totalPaid),
        viewsAtLastPayout,
        currentViews: item.views
      };
    }).filter(item => item.remainingToPay > 0);
  };

  const contextValue: TrackerContextType = {
    state,
    addPaymentSetting,
    updatePaymentSetting,
    deletePaymentSetting,
    addContentItem,
    updateContentItem,
    deleteContentItem,
    processPayout,
    resetState,
    calculateEarnings,
    calculatePendingEarnings,
    calculateTotalPaid,
    generatePayoutSummary,
    getActiveContentItems,
    refreshData
  };

  return (
    <TrackerContext.Provider value={contextValue}>
      {children}
    </TrackerContext.Provider>
  );
};

// Custom hook to use the tracker context
export const useTracker = (): TrackerContextType => {
  const context = useContext(TrackerContext);
  if (context === undefined) {
    throw new Error('useTracker must be used within a TrackerProvider');
  }
  return context;
};
