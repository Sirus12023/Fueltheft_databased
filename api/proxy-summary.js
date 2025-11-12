// Vercel Serverless Function to proxy summary.json
// This bypasses CORS issues by fetching from the server side

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const blobUrl = 'https://65c5ztl9veaifav1.public.blob.vercel-storage.com/summary.json';
    
    const response = await fetch(blobUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Failed to fetch: ${response.status} ${response.statusText}` 
      });
    }

    const data = await response.json();
    
    // Return as JSON with proper headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch summary',
      message: error.message 
    });
  }
}

