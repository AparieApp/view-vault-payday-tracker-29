
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { Platform, PaymentSettings, ContentItem, Payout, PayoutSummary } from '@/types';
import { calculatePayment } from '@/lib/utils';

// Define the state shape
interface TrackerState {
  platforms: Platform[];
  paymentSettings: PaymentSettings[];
  contentItems: ContentItem[];
  payouts: Payout[];
}

// Define action types
type TrackerAction =
  | { type: 'ADD_PAYMENT_SETTING'; payload: PaymentSettings }
  | { type: 'UPDATE_PAYMENT_SETTING'; payload: PaymentSettings }
  | { type: 'DELETE_PAYMENT_SETTING'; payload: string }
  | { type: 'ADD_CONTENT_ITEM'; payload: ContentItem }
  | { type: 'UPDATE_CONTENT_ITEM'; payload: ContentItem }
  | { type: 'DELETE_CONTENT_ITEM'; payload: string }
  | { type: 'ADD_PAYOUT'; payload: Payout[] }
  | { type: 'LOAD_STATE'; payload: TrackerState }
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
  payouts: []
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
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

// Reducer
const trackerReducer = (state: TrackerState, action: TrackerAction): TrackerState => {
  switch (action.type) {
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
    
    case 'LOAD_STATE':
      return action.payload;
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

// Provider component
export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(trackerReducer, initialState);

  // Load state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('trackerState');
    if (savedState) {
      try {
        dispatch({ type: 'LOAD_STATE', payload: JSON.parse(savedState) });
      } catch (error) {
        console.error('Failed to parse saved state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('trackerState', JSON.stringify(state));
  }, [state]);

  // Add a new payment setting
  const addPaymentSetting = (settings: Omit<PaymentSettings, 'id'>) => {
    const newSetting: PaymentSettings = {
      ...settings,
      id: uuidv4()
    };
    dispatch({ type: 'ADD_PAYMENT_SETTING', payload: newSetting });
    toast.success("Payment setting added successfully");
  };

  // Update an existing payment setting
  const updatePaymentSetting = (settings: PaymentSettings) => {
    dispatch({ type: 'UPDATE_PAYMENT_SETTING', payload: settings });
    toast.success("Payment setting updated successfully");
  };

  // Delete a payment setting
  const deletePaymentSetting = (id: string) => {
    dispatch({ type: 'DELETE_PAYMENT_SETTING', payload: id });
    toast.success("Payment setting deleted successfully");
  };

  // Add a new content item
  const addContentItem = (item: Omit<ContentItem, 'id' | 'payouts'>) => {
    const newItem: ContentItem = {
      ...item,
      id: uuidv4(),
      payouts: []
    };
    dispatch({ type: 'ADD_CONTENT_ITEM', payload: newItem });
    toast.success("Content item added successfully");
  };

  // Update an existing content item
  const updateContentItem = (item: ContentItem) => {
    dispatch({ type: 'UPDATE_CONTENT_ITEM', payload: item });
    toast.success("Content item updated successfully");
  };

  // Delete a content item
  const deleteContentItem = (id: string) => {
    dispatch({ type: 'DELETE_CONTENT_ITEM', payload: id });
    toast.success("Content item deleted successfully");
  };

  // Process payouts for multiple content items
  const processPayout = (payoutItems: PayoutSummary[]) => {
    const payouts: Payout[] = [];
    const updatedContentItems: ContentItem[] = [];

    payoutItems.forEach(item => {
      if (item.remainingToPay <= 0) return;

      const contentItem = state.contentItems.find(c => c.id === item.contentId);
      if (!contentItem) return;

      const payout: Payout = {
        id: uuidv4(),
        date: new Date().toISOString(),
        amount: item.remainingToPay,
        contentItemId: item.contentId,
        viewCount: item.currentViews
      };

      payouts.push(payout);

      // Update content item with the new payout
      const updatedItem = {
        ...contentItem,
        payouts: [...contentItem.payouts, payout]
      };
      updatedContentItems.push(updatedItem);
    });

    if (payouts.length > 0) {
      // Add all payouts
      dispatch({ type: 'ADD_PAYOUT', payload: payouts });
      
      // Update all content items
      updatedContentItems.forEach(item => {
        dispatch({ type: 'UPDATE_CONTENT_ITEM', payload: item });
      });
      
      toast.success(`Successfully processed ${payouts.length} payouts`);
    } else {
      toast.info("No payouts to process");
    }
  };

  // Reset the state to initial values
  const resetState = () => {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      dispatch({ type: 'RESET_STATE' });
      toast.success("All data has been reset");
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
      const now = new Date();
      const daysSinceUpload = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysSinceUpload <= settings.trackingPeriodDays;
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
    getActiveContentItems
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
