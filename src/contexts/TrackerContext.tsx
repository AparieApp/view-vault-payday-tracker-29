import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from "sonner";
import { Platform, PaymentSettings, ContentItem, Payout, PayoutSummary, ContentItemStatus } from '@/types';
import { calculatePayment, isWithinDays } from '@/lib/utils';
import { 
  getPaymentSettings, 
  createPaymentSetting, 
  getContentItems, 
  createContentItem as createContentItemInSupabase,
  updateContentItem as updateContentItemInSupabase,
  deleteContentItem as deleteContentItemInSupabase,
  createPayout,
  deletePayout as deletePayoutInSupabase,
  deletePaymentSetting as deletePaymentSettingInSupabase
} from '@/services/supabaseService';

// Define the state shape
interface TrackerState {
  platforms: Platform[];
  paymentSettings: PaymentSettings[];
  contentItems: ContentItem[];
  isLoading: boolean;
}

// Define action types
type TrackerAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ALL_DATA'; payload: { paymentSettings: PaymentSettings[], contentItems: ContentItem[] } }
  | { type: 'ADD_PAYMENT_SETTING'; payload: PaymentSettings }
  | { type: 'ADD_CONTENT_ITEM'; payload: ContentItem }
  | { type: 'UPDATE_CONTENT_ITEM'; payload: ContentItem }
  | { type: 'DELETE_CONTENT_ITEM'; payload: string }
  | { type: 'ADD_PAYOUT_TO_ITEM'; payload: { contentItemId: string; payout: Payout } }
  | { type: 'DELETE_PAYOUT'; payload: string }
  | { type: 'DELETE_PAYMENT_SETTING'; payload: string }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: TrackerState = {
  platforms: [
    'tiktok',
    'youtube',
    'instagram'
  ],
  paymentSettings: [],
  contentItems: [],
  isLoading: true
};

// Create context
interface TrackerContextType {
  state: TrackerState;
  addPaymentSetting: (settings: Omit<PaymentSettings, 'id'>) => Promise<void>;
  addContentItem: (itemData: Omit<ContentItem, 'id' | 'payouts' | 'final_views' | 'status'> & { status: ContentItemStatus; final_views: null }) => Promise<void>;
  updateContentItem: (item: ContentItem) => Promise<void>;
  deleteContentItem: (id: string) => Promise<void>;
  deletePayout: (id: string) => Promise<void>;
  deletePaymentSetting: (id: string) => Promise<void>;
  processPayout: (finalizedItems: ContentItem[]) => Promise<void>;
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
    
    case 'SET_ALL_DATA':
      return {
        ...state,
        paymentSettings: action.payload.paymentSettings,
        contentItems: action.payload.contentItems,
        isLoading: false
      };
    
    case 'ADD_PAYMENT_SETTING':
      return {
        ...state,
        paymentSettings: [...state.paymentSettings, action.payload]
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
    
    case 'ADD_PAYOUT_TO_ITEM':
      return {
        ...state,
        contentItems: state.contentItems.map(item =>
          item.id === action.payload.contentItemId
            ? { ...item, payouts: [...item.payouts, action.payload.payout] }
            : item
        )
      };
    
    case 'DELETE_PAYOUT':
      return {
        ...state,
        contentItems: state.contentItems.map(item => ({
          ...item,
          payouts: item.payouts.filter(p => p.id !== action.payload)
        }))
      };
    
    case 'DELETE_PAYMENT_SETTING':
      return {
        ...state,
        paymentSettings: state.paymentSettings.filter(s => s.id !== action.payload)
      };
    
    case 'RESET_STATE':
      return { ...initialState, isLoading: false };
    
    default:
      return state;
  }
};

// Provider component
export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(trackerReducer, initialState);

  // Load data from Supabase on component mount
  useEffect(() => {
    refreshData();
  }, []);

  // Function to load data from Supabase
  const refreshData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [paymentSettings, contentItems] = await Promise.all([
        getPaymentSettings(),
        getContentItems()
      ]);
      const mappedContentItems = contentItems.map(item => ({
        ...item,
        status: item.status || 'tracking',
        starting_views: item.starting_views || 0,
        final_views: item.final_views !== undefined ? item.final_views : null,
        payouts: item.payouts || []
      }));
      dispatch({ type: 'SET_ALL_DATA', payload: { paymentSettings, contentItems: mappedContentItems } });
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      toast("Error Loading Data", {
        description: "Failed to load data from the database. Please try again later.",
      });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Add a new payment setting
  const addPaymentSetting = async (settingsData: Omit<PaymentSettings, 'id'>) => {
    try {
      const newSetting = await createPaymentSetting(settingsData);
      if (newSetting) {
        dispatch({ type: 'ADD_PAYMENT_SETTING', payload: newSetting });
        toast.success("Payment setting added successfully");
      } else {
        toast.error("Failed to add payment setting.");
      }
    } catch (error) {
      console.error('Error adding payment setting:', error);
      toast.error("Error adding payment setting", { description: (error as Error).message });
      throw error;
    }
  };

  // Add a new content item
  const addContentItem = async (itemData: Omit<ContentItem, 'id' | 'payouts' | 'final_views' | 'status'> & { status: ContentItemStatus; final_views: null }) => {
    try {
      const newItem = await createContentItemInSupabase(itemData);
      if (newItem) {
        const fullNewItem: ContentItem = { 
          ...newItem,
          platform_id: itemData.platform_id,
          video_url: itemData.video_url,
          starting_views: itemData.starting_views,
          final_views: null,
          status: 'tracking',
          payouts: [] 
        }; 
        dispatch({ type: 'ADD_CONTENT_ITEM', payload: fullNewItem });
        toast.success("Content item added successfully");
      } else {
        toast.error("Failed to add content item.");
      }
    } catch (error) {
      console.error('Error adding content item:', error);
      toast.error("Error adding content item", { description: (error as Error).message });
      throw error;
    }
  };

  // Update an existing content item
  const updateContentItem = async (item: ContentItem) => {
    try {
      const itemToUpdate = {
        id: item.id,
        title: item.title,
        uploadDate: item.uploadDate,
        starting_views: item.starting_views,
        final_views: item.final_views,
        status: item.status,
        paymentSettingsId: item.paymentSettingsId,
      }
      const success = await updateContentItemInSupabase(itemToUpdate as Partial<ContentItem> & { id: string });
      if (success) {
        dispatch({ type: 'UPDATE_CONTENT_ITEM', payload: item });
        toast.success(`Content item '${item.title}' updated successfully.`);
      } else {
        toast.error(`Failed to update content item '${item.title}'.`);
      }
    } catch (error) {
      console.error('Error updating content item:', error);
      toast.error(`Error updating content item '${item.title}'`, { description: (error as Error).message });
      throw error;
    }
  };

  // Delete a content item
  const deleteContentItem = async (id: string) => {
    try {
      const success = await deleteContentItemInSupabase(id);
      if (success) {
        dispatch({ type: 'DELETE_CONTENT_ITEM', payload: id });
        toast.success("Content item deleted successfully");
      } else {
        toast.error("Failed to delete content item.");
      }
    } catch (error) {
      console.error('Error deleting content item:', error);
      toast.error("Error deleting content item", { description: (error as Error).message });
      throw error;
    }
  };

  // Delete a payment setting
  const deletePaymentSetting = async (id: string) => {
    try {
      const success = await deletePaymentSettingInSupabase(id);
      if (success) {
        dispatch({ type: 'DELETE_PAYMENT_SETTING', payload: id });
        toast.success("Payment setting deleted successfully");
      } else {
        toast.error("Failed to delete payment setting.");
      }
    } catch (error) {
      console.error('Error deleting payment setting:', error);
      toast.error("Error deleting payment setting", { description: (error as Error).message });
    }
  };

  // Process payouts for multiple content items
  const processPayout = async (finalizedItems: ContentItem[]) => {
    if (!finalizedItems || finalizedItems.length === 0) {
      toast.info("No finalized items selected for payout.");
      return;
    }
    
    let payoutsCreatedCount = 0;
    let totalPayoutAmount = 0;
    const errors: string[] = [];

    try {
      for (const item of finalizedItems) {
        if (item.status !== 'finalized' || item.final_views === null || item.final_views < 0) {
          console.warn(`Skipping item ${item.id} - not finalized or invalid final views.`);
          continue;
        }
        
        const settings = state.paymentSettings.find(s => s.id === item.paymentSettingsId);
        if (!settings) {
          errors.push(`Payment settings not found for '${item.title}'.`);
          continue;
        }
        
        const paymentAmount = calculatePayment(
          settings.basePay,
          settings.viewRate,
          settings.viewsPerUnit,
          item.final_views,
          settings.bonusThresholds,
          settings.maxPayout
        );

        const totalAlreadyPaid = item.payouts.reduce((sum, p) => sum + p.amount, 0);
        const amountToPay = Math.max(0, paymentAmount - totalAlreadyPaid);

        if (amountToPay > 0) {
          const payoutData = {
            date: new Date().toISOString(),
            amount: amountToPay,
            contentItemId: item.id,
            viewCount: item.final_views
          };
          
          const newPayout = await createPayout(payoutData);
          if (newPayout) {
            const updatedItemState = { ...item, status: 'paid' as ContentItemStatus, payouts: [...item.payouts, newPayout] };
            dispatch({ type: 'UPDATE_CONTENT_ITEM', payload: updatedItemState });
            
            await updateContentItemInSupabase({ id: item.id, status: 'paid' }).catch(err => {
              console.error(`Failed to update status to 'paid' in DB for ${item.id}:`, err);
            }); 
            
            payoutsCreatedCount++;
            totalPayoutAmount += amountToPay;
          } else {
            errors.push(`Failed to create payout record for '${item.title}'.`);
          }
        } else {
          const updatedItemState = { ...item, status: 'paid' as ContentItemStatus };
          dispatch({ type: 'UPDATE_CONTENT_ITEM', payload: updatedItemState });
          await updateContentItemInSupabase({ id: item.id, status: 'paid' }).catch(err => {
            console.error(`Failed to update status to 'paid' in DB for ${item.id} (zero amount):`, err);
          }); 
          console.log(`Item '${item.title}' already fully paid or zero earnings.`);
        }
      }

      if (payoutsCreatedCount > 0) {
        toast.success(`Processed ${payoutsCreatedCount} payouts totalling ${formatCurrency(totalPayoutAmount)}.`);
      } else if (errors.length === 0) {
        toast.info("No new payouts were needed for the selected items.");
      }
      
      if (errors.length > 0) {
        toast.error("Some errors occurred during payout processing:", { 
          description: errors.join("\n") 
        });
      }

    } catch (error) {
      console.error('Error processing payouts:', error);
      toast.error("Failed to process payouts.", { description: (error as Error).message });
    }
  };

  // Delete a payout record
  const deletePayout = async (payoutId: string) => {
    try {
      const success = await deletePayoutInSupabase(payoutId);
      if (success) {
        dispatch({ type: 'DELETE_PAYOUT', payload: payoutId });
        toast.success("Payout deleted successfully");
      } else {
        toast.error("Failed to delete payout.");
      }
    } catch (error) {
      console.error('Error deleting payout:', error);
      toast.error("Error deleting payout", { description: (error as Error).message });
    }
  };

  const contextValue: TrackerContextType = {
    state,
    addPaymentSetting,
    addContentItem,
    updateContentItem,
    deleteContentItem,
    deletePaymentSetting,
    deletePayout,
    processPayout,
    refreshData,
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

// Helper to format currency (move to utils?)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};
