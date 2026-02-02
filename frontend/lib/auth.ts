import { register as apiRegister, login as apiLogin, getCurrentUser as apiGetCurrentUser } from './api';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  _id?: string;
  email: string;
  full_name: string;
  role: UserRole;
  institution_id?: string;
  assigned_subjects?: string[];
}

export interface AuthUser extends User {
  // Additional auth properties if needed
}

export async function signUp(email: string, password: string, fullName: string, role: UserRole, institutionId?: string) {
  const response = await apiRegister(email, password, fullName, role, institutionId);

  if (response.token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.token);
    }
  }

  return response;
}

export async function signIn(email: string, password: string) {
  const response = await apiLogin(email, password);

  if (response.token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.token);
    }
  }

  return response;
}

export async function signOut() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Check if token exists before making the request
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        return null; // No token, user is not logged in
      }
    }

    const user = await apiGetCurrentUser();
    return user as AuthUser;
  } catch (error: any) {
    // If error is "No token provided" or "Invalid token" or "User not found", user is not logged in
    if (error.message?.includes('No token') ||
      error.message?.includes('Invalid token') ||
      error.message?.includes('token') ||
      error.message?.includes('User not found') ||
      error.message?.includes('404')) {
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      return null;
    }
    // For other errors, log but still return null
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getCurrentSession() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return token ? { token } : null;
  }
  return null;
}
