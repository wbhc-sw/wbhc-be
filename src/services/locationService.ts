import https from 'https';

interface LocationData {
  city?: string;
  region?: string;
  country?: string;
  country_name?: string;
}

// Cache to avoid repeated API calls for the same IP
const locationCache = new Map<string, string>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get geographic location from IP address using ip-api.com (free, no API key needed)
 * Returns format: "City, Country" or "Country" if city is not available
 */
export async function getLocationFromIP(ipAddress: string | null | undefined): Promise<string | null> {
  // Return null for invalid/local IPs
  if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
    return null;
  }

  // Check cache first
  const cached = locationCache.get(ipAddress);
  if (cached) {
    return cached;
  }

  try {
    // Use ip-api.com (free, 45 requests per minute limit)
    const location = await fetchLocation(ipAddress);
    
    if (location) {
      // Cache the result
      locationCache.set(ipAddress, location);
      
      // Clean up old cache entries after 24h
      setTimeout(() => {
        locationCache.delete(ipAddress);
      }, CACHE_TTL);
      
      return location;
    }
    
    return null;
  } catch (error) {
    console.error('[LocationService] Error fetching location:', error);
    return null;
  }
}

function fetchLocation(ip: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const url = `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed: LocationData & { status?: string } = JSON.parse(data);
          
          if (parsed.status === 'success') {
            const parts: string[] = [];
            
            if (parsed.city) {
              parts.push(parsed.city);
            }
            
            if (parsed.country) {
              parts.push(parsed.country);
            }
            
            const location = parts.length > 0 ? parts.join(', ') : null;
            resolve(location);
          } else {
            resolve(null);
          }
        } catch (err) {
          resolve(null);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Alternative: Get location using ipapi.co (free, 1000 requests per day, no API key)
 * Uncomment this if ip-api.com has rate limit issues
 */
/*
function fetchLocationAlternative(ip: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ipapi.co',
      path: `/${ip}/json/`,
      headers: {
        'User-Agent': 'InvestorApp/1.0'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed: LocationData = JSON.parse(data);
          
          const parts: string[] = [];
          
          if (parsed.city) {
            parts.push(parsed.city);
          }
          
          if (parsed.country_name) {
            parts.push(parsed.country_name);
          }
          
          const location = parts.length > 0 ? parts.join(', ') : null;
          resolve(location);
        } catch (err) {
          resolve(null);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}
*/

