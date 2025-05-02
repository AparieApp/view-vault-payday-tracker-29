
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  contentId?: string; // Optional: update specific content item
}

// This function would be expanded to handle different platforms
async function fetchViewCount(platform: string, platformId: string): Promise<number | null> {
  // In a real implementation, this would use the platform's API
  // For now, we'll just simulate a response
  console.log(`Fetching view count for ${platform} content with ID ${platformId}`);
  
  // Mock implementation - in real world, you would implement API calls for each platform
  // This is where you'd use platform-specific APIs like YouTube API, TikTok API, etc.
  if (platform === 'youtube') {
    // Simulating YouTube API call
    return Math.floor(Math.random() * 10000); // Mock view count
  } else if (platform === 'tiktok') {
    // Simulating TikTok API call
    return Math.floor(Math.random() * 20000); // Mock view count
  } else if (platform === 'instagram') {
    // Simulating Instagram API call
    return Math.floor(Math.random() * 5000); // Mock view count
  } else {
    // For other platforms
    return Math.floor(Math.random() * 3000); // Mock view count
  }
}

// Handle HTTP requests
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    const { contentId } = await req.json() as RequestBody;
    
    // Query to get content items to update
    let query = supabaseClient.from('content_items').select('*');
    
    // If contentId is provided, only update that specific item
    if (contentId) {
      query = query.eq('id', contentId);
    }
    
    const { data: contentItems, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('Error fetching content items:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Error fetching content items' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const updateResults = [];
    const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Update each content item's view count
    for (const item of contentItems) {
      if (!item.platform_id) {
        console.log(`Skipping content item ${item.id} with no platform_id`);
        updateResults.push({ id: item.id, status: 'skipped', reason: 'No platform ID' });
        continue;
      }
      
      try {
        // Fetch view count from platform API
        const viewCount = await fetchViewCount(item.platform, item.platform_id);
        
        if (viewCount !== null) {
          // Update content item with new view count
          const { error: updateError } = await supabaseClient
            .from('content_items')
            .update({ current_views: viewCount })
            .eq('id', item.id);
          
          if (updateError) {
            console.error(`Error updating content item ${item.id}:`, updateError);
            updateResults.push({ id: item.id, status: 'error', error: updateError.message });
            continue;
          }
          
          // Add record to view history
          const { error: historyError } = await supabaseClient
            .from('view_history')
            .insert({
              content_item_id: item.id,
              record_date: today,
              view_count: viewCount
            })
            .select();
          
          if (historyError) {
            // If error is duplicate key, this is expected (we already recorded for today)
            if (historyError.code === '23505') { // Unique violation
              console.log(`View history for content item ${item.id} already recorded today, updating instead`);
              
              // Update existing record for today
              const { error: updateHistoryError } = await supabaseClient
                .from('view_history')
                .update({ view_count: viewCount })
                .eq('content_item_id', item.id)
                .eq('record_date', today);
              
              if (updateHistoryError) {
                console.error(`Error updating view history for content item ${item.id}:`, updateHistoryError);
                updateResults.push({ 
                  id: item.id, 
                  status: 'partial', 
                  views: viewCount,
                  historyError: updateHistoryError.message 
                });
                continue;
              }
            } else {
              console.error(`Error recording view history for content item ${item.id}:`, historyError);
              updateResults.push({ 
                id: item.id, 
                status: 'partial', 
                views: viewCount,
                historyError: historyError.message 
              });
              continue;
            }
          }
          
          updateResults.push({ 
            id: item.id, 
            status: 'success', 
            oldViews: item.current_views,
            newViews: viewCount
          });
        } else {
          updateResults.push({ id: item.id, status: 'error', error: 'Failed to fetch view count' });
        }
      } catch (err) {
        console.error(`Error processing content item ${item.id}:`, err);
        updateResults.push({ id: item.id, status: 'error', error: err.message });
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${contentItems.length} content items`,
        results: updateResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (err) {
    console.error('Error in update-view-counts function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
