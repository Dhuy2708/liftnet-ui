import { User } from "@/types/user"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import axios from "axios"
import { signalRService } from "../services/signalRService"

type Address = {
  provinceCode: number;
  districtCode: number;
  wardCode: number;
  placeId: string;
}

interface ValidationFailure {
  propertyName: string
  errorMessage: string
  attemptedValue: string
  customState: string
  severity: number
  errorCode: string
  formattedMessagePlaceholderValues: Record<string, string>
}

interface BasicInfo {
  id: string
  username: string
  firstName: string
  lastName: string
  avatar: string
  role: number
}

type AuthState = {
  user: User | null
  isLoading: boolean
  error: string | null
  basicInfo: BasicInfo | null
}

type AuthActions = {
  login: (email: string, password: string) => Promise<void>
  register: (firstName: string, lastName: string, email: string, password: string, role?: number, address?: Address, age?: number, gender?: number) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
  getBasicInfo: () => Promise<boolean>
  setBasicInfo: (info: BasicInfo) => void
  checkSession: () => Promise<boolean>
}

export type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      basicInfo: null,

      setBasicInfo: (info: BasicInfo) => {
        set({ basicInfo: info })
        localStorage.setItem('basicInfo', JSON.stringify(info))
      },

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
            if (data.validationFailure && data.validationFailure.length > 0) {
              const validationMessages = data.validationFailure.map(
                (failure: ValidationFailure) => failure.errorMessage
              );
              set({ error: validationMessages.join(", "), isLoading: false });
            } else {
              set({ error: data.message || 'Login failed', isLoading: false });
            }
            return;
          }

          if (data.datas && data.datas.length > 0) {
            const user = data.datas[0];
            set({ user });
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', user.token);

            // Get basic info immediately after successful login
            const basicInfoResponse = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/Auth/basicInfo`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Accept: "*/*",
                  Authorization: `Bearer ${user.token}`
                }
              }
            );

            if (basicInfoResponse.data.datas && basicInfoResponse.data.datas.length > 0) {
              const basicInfo = basicInfoResponse.data.datas[0];
              set({ basicInfo });
              localStorage.setItem('basicInfo', JSON.stringify(basicInfo));
            }
          } else {
            console.error("No user data found");
            set({ error: "Username and password invalid", isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            isLoading: false,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (firstName: string, lastName: string, email: string, password: string, role = 1, address?: Address | null, age?: number, gender?: number) => {
        set({ isLoading: true, error: null });
        try {
          const registerData = {
            email,
            firstName,
            lastName,
            password,
            role,
            address: address || null,
            age,
            gender
          };

          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData),
          });

          const data = await response.json();
          
          if (!response.ok) {
            if (data.validationFailure && data.validationFailure.length > 0) {
              const validationMessages = data.validationFailure.map(
                (failure: ValidationFailure) => failure.errorMessage
              );
              set({ error: validationMessages.join(", ") });
            } else {
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
          const token = localStorage.getItem('token');
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/Auth/logout`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.status === 200) {
            await signalRService.stopConnection();
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('basicInfo');
            set({ user: null, basicInfo: null, isLoading: false });
          } else {
            throw new Error('Logout failed');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Logout failed",
            isLoading: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      getBasicInfo: async () => {
        // First try to get from localStorage
        const storedBasicInfo = localStorage.getItem('basicInfo');
        if (storedBasicInfo) {
          const basicInfo = JSON.parse(storedBasicInfo);
          set({ basicInfo });
          return true;
        }

        // If not in localStorage, fetch from API
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/Auth/basicInfo`, {
            headers: {
              "Content-Type": "application/json",
              Accept: "*/*",
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.data.datas && response.data.datas.length > 0) {
            const basicInfo = response.data.datas[0];
            set({ basicInfo });
            localStorage.setItem('basicInfo', JSON.stringify(basicInfo));
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to fetch basic info:', error);
          return false;
        }
      },

      checkSession: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return false;

          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/Auth/check`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          return response.status === 200;
        } catch (error) {
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, basicInfo: state.basicInfo }),
    },
  ),
)