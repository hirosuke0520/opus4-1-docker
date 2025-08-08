import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { serverFetch } from './api';

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

export async function getAuthUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return null;
    }
    
    const response = await serverFetch<{ user: User }>(
      '/auth/me',
      {},
      cookieStore.toString()
    );
    
    return response.user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth() {
  const user = await getAuthUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}