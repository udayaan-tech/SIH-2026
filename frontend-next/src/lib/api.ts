export const API = {
  baseUrl: 'http://localhost:3000/api/v1',

  async get(endpoint: string, queryParams?: any, options?: any) {
    let url = endpoint;
    if (queryParams) {
      const filteredParams = Object.fromEntries(
        Object.entries(queryParams).filter(([_, v]) => v != null)
      );
      const params = new URLSearchParams(filteredParams as any).toString();
      if (params) {
        url += `?${params}`;
      }
    }
    return this.request(url, { method: 'GET', ...options });
  },

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async request(endpoint: string, options: any) {
    // 1. Resolve officer ID from localStorage or fallback to standard lead IO.
    let currentOfficerId = 'NDIS-IO-4102'; // Default
    if (typeof window !== 'undefined') {
      currentOfficerId = localStorage.getItem('casevault_officer_id') || 'NDIS-IO-4102';
    }
    
    // 2. Resolve bearer token if exists
    let token = '';
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('casevault_token') || '';
    }

    const headers: any = {
      'Content-Type': 'application/json',
      'X-Request-ID': 'req_' + Math.random().toString(36).substring(2, 14),
      // 3. Inject X-Officer-ID for Zero-Trust BOLA defense
      'X-Officer-ID': currentOfficerId
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = text; // Fallback to raw text for downloads/plain responses
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error("401 Unauthorized: Triggering session flush and relogin.");
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        if (response.status === 403) {
          console.error(`403 Forbidden [BOLA/RBAC Block]: ${data.error?.message}`);
        }
        throw new Error(data.error?.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error(`[API Call Failed] ${options.method || 'GET'} ${endpoint}:`, error);
      throw error;
    }
  }
};
