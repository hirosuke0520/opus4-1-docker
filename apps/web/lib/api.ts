const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export class ApiClient {
  private static async fetchWithCredentials(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${API_URL}${endpoint}`;
    
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  static async get<T>(endpoint: string): Promise<T> {
    const response = await this.fetchWithCredentials(endpoint);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }
    
    return response.json();
  }

  static async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.fetchWithCredentials(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }
    
    return response.json();
  }

  static async patch<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.fetchWithCredentials(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }
    
    return response.json();
  }

  static async delete(endpoint: string): Promise<void> {
    const response = await this.fetchWithCredentials(endpoint, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }
  }
}

// Server-side API calls
export async function serverFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  cookies?: string
): Promise<T> {
  const apiUrl = process.env.API_BASE_URL || 'http://api:8787';
  const url = `${apiUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies ? { Cookie: cookies } : {}),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Request failed');
  }
  
  return response.json();
}