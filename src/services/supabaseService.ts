import { supabase } from "@/integrations/supabase/client";
import { Platform, PaymentSettings, ContentItem, Payout, BonusThreshold } from '@/types';

// Channel interfaces
export interface Channel {
  id: string;
  name: string;
  platform: Platform;
  platform_id: string;
  platform_url: string;
  default_payment_settings_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelContentMapping {
  id: string;
  channel_id: string;
  content_item_id: string;
  created_at: string;
}

export interface ViewHistory {
  id: string;
  content_item_id: string;
  record_date: string;
  view_count: number;
  created_at: string;
}

// Channel functions
export async function getChannels(): Promise<Channel[]> {
  const { data, error } = await supabase
    .from('channels')
    .select('*');
  
  if (error) {
    console.error('Error fetching channels:', error);
    return [];
  }
  
  // Properly cast platform to Platform type
  return (data || []).map(channel => ({
    ...channel,
    platform: channel.platform as Platform
  }));
}

export async function getChannelById(id: string): Promise<Channel | null> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching channel with id ${id}:`, error);
    return null;
  }
  
  if (!data) return null;
  
  // Properly cast platform to Platform type
  return {
    ...data,
    platform: data.platform as Platform
  };
}

export async function createChannel(channel: Omit<Channel, 'id' | 'created_at' | 'updated_at'>): Promise<Channel | null> {
  const { data, error } = await supabase
    .from('channels')
    .insert([channel])
    .select();
  
  if (error) {
    console.error('Error creating channel:', error);
    return null;
  }
  
  if (!data || data.length === 0) return null;
  
  // Properly cast platform to Platform type
  return {
    ...data[0],
    platform: data[0].platform as Platform
  };
}

export async function updateChannel(channel: Partial<Channel> & { id: string }): Promise<boolean> {
  const { error } = await supabase
    .from('channels')
    .update(channel)
    .eq('id', channel.id);
  
  if (error) {
    console.error('Error updating channel:', error);
    return false;
  }
  
  return true;
}

export async function deleteChannel(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('channels')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting channel with id ${id}:`, error);
    return false;
  }
  
  return true;
}

// Content item functions
export async function getContentItems(): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select(`
      *,
      payouts(*)
    `);
  
  if (error) {
    console.error('Error fetching content items:', error);
    return [];
  }
  
  return (data || []).map(item => ({
    id: item.id,
    title: item.title,
    platform: item.platform as Platform,
    uploadDate: item.upload_date,
    views: item.current_views,
    paymentSettingsId: item.payment_settings_id || '',
    payouts: (item.payouts || []).map((payout: any) => ({
      id: payout.id,
      date: payout.date,
      amount: payout.amount,
      contentItemId: payout.content_item_id,
      viewCount: payout.view_count
    })),
    belongsToChannel: item.belongs_to_channel,
    managedByManager: item.managed_by_manager
  }));
}

export async function createContentItem(item: Omit<ContentItem, 'id' | 'payouts'>): Promise<ContentItem | null> {
  const { data, error } = await supabase
    .from('content_items')
    .insert([{
      title: item.title,
      platform: item.platform,
      platform_id: null, // Can be updated later
      upload_date: item.uploadDate,
      current_views: item.views,
      payment_settings_id: item.paymentSettingsId,
      belongs_to_channel: true, // Default to true
      managed_by_manager: true, // Default to true
    }])
    .select();
  
  if (error) {
    console.error('Error creating content item:', error);
    return null;
  }
  
  return data?.[0] ? {
    id: data[0].id,
    title: data[0].title,
    platform: data[0].platform as Platform,
    uploadDate: data[0].upload_date,
    views: data[0].current_views,
    paymentSettingsId: data[0].payment_settings_id || '',
    payouts: []
  } : null;
}

export async function updateContentItem(item: Partial<ContentItem> & { id: string }): Promise<boolean> {
  const { error } = await supabase
    .from('content_items')
    .update({
      title: item.title,
      platform: item.platform,
      upload_date: item.uploadDate,
      current_views: item.views,
      payment_settings_id: item.paymentSettingsId,
    })
    .eq('id', item.id);
  
  if (error) {
    console.error('Error updating content item:', error);
    return false;
  }
  
  return true;
}

export async function deleteContentItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting content item with id ${id}:`, error);
    return false;
  }
  
  return true;
}

// Payment settings functions
export async function getPaymentSettings(): Promise<PaymentSettings[]> {
  const { data: settingsData, error: settingsError } = await supabase
    .from('payment_settings')
    .select('*');
  
  if (settingsError) {
    console.error('Error fetching payment settings:', settingsError);
    return [];
  }
  
  const paymentSettings = [];
  
  for (const setting of settingsData || []) {
    const { data: bonusData, error: bonusError } = await supabase
      .from('bonus_thresholds')
      .select('*')
      .eq('payment_settings_id', setting.id);
    
    if (bonusError) {
      console.error(`Error fetching bonus thresholds for payment setting ${setting.id}:`, bonusError);
      continue;
    }
    
    const bonusThresholds: BonusThreshold[] = (bonusData || []).map(bonus => ({
      threshold: bonus.threshold,
      amount: bonus.amount
    }));
    
    paymentSettings.push({
      id: setting.id,
      name: setting.name,
      basePay: setting.base_pay,
      viewRate: setting.view_rate,
      viewsPerUnit: setting.views_per_unit,
      trackingPeriodDays: setting.tracking_period_days,
      maxPayout: setting.max_payout,
      bonusThresholds,
      combineViews: setting.combine_views
    });
  }
  
  return paymentSettings;
}

export async function createPaymentSetting(setting: Omit<PaymentSettings, 'id'>): Promise<PaymentSettings | null> {
  // Insert payment setting
  const { data: settingData, error: settingError } = await supabase
    .from('payment_settings')
    .insert([{
      name: setting.name,
      base_pay: setting.basePay,
      view_rate: setting.viewRate,
      views_per_unit: setting.viewsPerUnit,
      tracking_period_days: setting.trackingPeriodDays,
      max_payout: setting.maxPayout,
      combine_views: setting.combineViews
    }])
    .select();
  
  if (settingError || !settingData?.[0]) {
    console.error('Error creating payment setting:', settingError);
    return null;
  }
  
  const newSettingId = settingData[0].id;
  
  // Insert bonus thresholds
  if (setting.bonusThresholds.length > 0) {
    const bonusInserts = setting.bonusThresholds.map(bonus => ({
      payment_settings_id: newSettingId,
      threshold: bonus.threshold,
      amount: bonus.amount
    }));
    
    const { error: bonusError } = await supabase
      .from('bonus_thresholds')
      .insert(bonusInserts);
    
    if (bonusError) {
      console.error('Error creating bonus thresholds:', bonusError);
      // We don't return null here because the payment setting was created
    }
  }
  
  return {
    ...setting,
    id: newSettingId
  };
}

export async function createPayout(payout: Omit<Payout, 'id'>): Promise<Payout | null> {
  const { data, error } = await supabase
    .from('payouts')
    .insert([{
      date: payout.date,
      amount: payout.amount,
      content_item_id: payout.contentItemId,
      view_count: payout.viewCount
    }])
    .select();
  
  if (error) {
    console.error('Error creating payout:', error);
    return null;
  }
  
  return data?.[0] ? {
    id: data[0].id,
    date: data[0].date,
    amount: data[0].amount,
    contentItemId: data[0].content_item_id,
    viewCount: data[0].view_count
  } : null;
}

// Channel-Content mapping functions
export async function assignContentToChannel(contentItemId: string, channelId: string): Promise<boolean> {
  const { error } = await supabase
    .from('channel_content_mappings')
    .insert([{
      channel_id: channelId,
      content_item_id: contentItemId
    }]);
  
  if (error) {
    console.error('Error assigning content to channel:', error);
    return false;
  }
  
  return true;
}

export async function getContentForChannel(channelId: string): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('channel_content_mappings')
    .select(`
      content_item_id,
      content_items(*)
    `)
    .eq('channel_id', channelId);
  
  if (error) {
    console.error(`Error fetching content for channel ${channelId}:`, error);
    return [];
  }
  
  return (data || []).map(mapping => ({
    id: mapping.content_items.id,
    title: mapping.content_items.title,
    platform: mapping.content_items.platform as Platform,
    uploadDate: mapping.content_items.upload_date,
    views: mapping.content_items.current_views,
    paymentSettingsId: mapping.content_items.payment_settings_id || '',
    payouts: [],
    belongsToChannel: mapping.content_items.belongs_to_channel,
    managedByManager: mapping.content_items.managed_by_manager
  }));
}

export async function getChannelsForContent(contentItemId: string): Promise<Channel[]> {
  const { data, error } = await supabase
    .from('channel_content_mappings')
    .select(`
      channel_id,
      channels(*)
    `)
    .eq('content_item_id', contentItemId);
  
  if (error) {
    console.error(`Error fetching channels for content ${contentItemId}:`, error);
    return [];
  }
  
  return (data || []).map(mapping => ({
    ...mapping.channels,
    platform: mapping.channels.platform as Platform
  }));
}

// View history functions
export async function addViewHistoryRecord(contentItemId: string, viewCount: number, date = new Date()): Promise<boolean> {
  const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  
  const { error } = await supabase
    .from('view_history')
    .insert([{
      content_item_id: contentItemId,
      record_date: dateStr,
      view_count: viewCount
    }])
    .select();
  
  if (error) {
    console.error('Error adding view history record:', error);
    return false;
  }
  
  return true;
}

export async function getViewHistoryForContent(contentItemId: string): Promise<ViewHistory[]> {
  const { data, error } = await supabase
    .from('view_history')
    .select('*')
    .eq('content_item_id', contentItemId)
    .order('record_date', { ascending: true });
  
  if (error) {
    console.error(`Error fetching view history for content ${contentItemId}:`, error);
    return [];
  }
  
  return data || [];
}
