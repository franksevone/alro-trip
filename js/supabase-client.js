// Supabase Client Helper for Centralized Cloud Data
const SUPABASE_URL = 'https://lyjdyozhzbshffrnigor.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2osam1UwdDAU6UH6_WYbGw_CwPlkA1W';

let _supabaseClient = null;

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    try {
      _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return _supabaseClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  }
  return null;
}

// Fetch itinerary data from Supabase
async function fetchItineraryFromSupabase() {
  try {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('itinerary_store')
        .select('data')
        .eq('id', 'main')
        .maybeSingle();
      if (!error && data && data.data && data.data.days) {
        return data.data;
      }
    } else {
      // Fallback direct REST fetch
      const res = await fetch(`${SUPABASE_URL}/rest/v1/itinerary_store?id=eq.main&select=data`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0 && rows[0].data && rows[0].data.days) {
          return rows[0].data;
        }
      }
    }
  } catch (err) {
    console.warn('Supabase fetch failed, falling back to local files:', err.message);
  }
  return null;
}

// Save itinerary data to Supabase
async function saveItineraryToSupabase(itineraryData) {
  try {
    const payload = {
      id: 'main',
      data: itineraryData,
      updated_at: new Date().toISOString()
    };

    const client = getSupabaseClient();
    if (client) {
      const { error } = await client
        .from('itinerary_store')
        .upsert(payload);
      if (!error) return { success: true };
      console.warn('Supabase JS upsert error:', error);
    }

    // Fallback direct REST fetch
    const res = await fetch(`${SUPABASE_URL}/rest/v1/itinerary_store`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return { success: true };
    } else {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.message || res.statusText };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Window exports
if (typeof window !== 'undefined') {
  window.fetchItineraryFromSupabase = fetchItineraryFromSupabase;
  window.saveItineraryToSupabase = saveItineraryToSupabase;
  window.SUPABASE_URL = SUPABASE_URL;
}
