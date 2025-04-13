import { User } from "@/types/user"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type Address = {
  provinceCode: number;
  districtCode: number;
  wardCode: number;
  placeId: string;
}

type AuthState = {
  user: User | null
  isLoading: boolean
  error: string | null
}

type AuthActions = {
  login: (email: string, password: string) => Promise<void>
  register: (firstName: string, lastName: string, email: string, password: string, role?: number, address?: Address) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
}

export type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();
          
          if (!response.ok) {
            // Check for validation failures first
            if (data.validationFailure && data.validationFailure.length > 0) {
              // Get the specific validation error messages
              const validationMessages = data.validationFailure.map(
                (failure: any) => failure.errorMessage
              );
              set({ error: validationMessages.join(", "), isLoading: false });
            } else {
              // Use the general message if no specific validation errors
              set({ error: data.message || 'Login failed', isLoading: false });
            }
            return;
          }

          if (data.datas && data.datas.length > 0) {
            set({ user: data.datas[0] });
            localStorage.setItem('user', JSON.stringify(data.datas[0]));
            localStorage.setItem('token', data.datas[0].token);
          } else {
            console.error("No user data found");
            set({ error: "Username and password invalid", isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            isLoading: false,
          });
        }
      },

      register: async (firstName: string, lastName: string, email: string, password: string, role = 1, address?: Address | null) => {
        set({ isLoading: true, error: null });
        try {
          const registerData = {
            email,
            firstName,
            lastName,
            password,
            role,
            address: address || null // If address is undefined or empty, set it to null
          };

          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData),
          });

          const data = await response.json();
          console.log(data);
          
          if (!response.ok) {
            // Check for validation failures first
            if (data.validationFailure && data.validationFailure.length > 0) {
              // Get the specific validation error messages
              const validationMessages = data.validationFailure.map(
                (failure: any) => failure.errorMessage
              );
              set({ error: validationMessages.join(", ") });
            } else {
              // Use the general message if no specific validation errors
              set({ error: data.message || 'Registration failed' });
            }
            return false;
          }
          
          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Register failed",
            isLoading: false,
          });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Logout failed');
          }

          set({ user: null });
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Logout failed",
            isLoading: false,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage", 
      partialize: (state) => ({ user: state.user }), 
    },
  ),
)