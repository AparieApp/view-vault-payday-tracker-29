
// This function would be called by a scheduled cron job
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Get all content items
    const { data: contentItems, error: fetchError } = await supabaseClient
      .from('content_items')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching content items:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Error fetching content items' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // If we wanted to actually call the platform APIs, we would fetch API keys from supabase
    // const { data: apiKeys, error: apiKeysError } = await supabaseClient
    //   .from('api_keys')
    //   .select('*');
    
    // Call the update-view-counts function for each content item
    const updateResults = [];
    
    // In a production implementation, you might want to batch these or use a queue
    for (const item of contentItems) {
      try {
        // Invoke the update-view-counts function
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/update-view-counts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
            body: JSON.stringify({ contentId: item.id }),
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update view count for item ${item.id}: ${errorText}`);
        }
        
        const result = await response.json();
        updateResults.push({
          contentId: item.id,
          result: result
        });
      } catch (err) {
        console.error(`Error updating view count for content item ${item.id}:`, err);
        updateResults.push({
          contentId: item.id,
          error: err.message
        });
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
    console.error('Error in view-count-scheduler function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
