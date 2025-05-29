import { create } from "zustand";
import axios from "axios";

interface PaymentStore {
  isLoading: boolean;
  error: string | null;
  createPaymentUrl: (moneyToPay: number, description: string) => Promise<string | null>;
}

export const usePaymentStore = create<PaymentStore>((set) => ({
  isLoading: false,
  error: null,

  createPaymentUrl: async (moneyToPay: number, description: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Payment/vnpay/createPaymentUrl`,
        {
          params: {
            moneyToPay,
            description
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data) {
        set({ isLoading: false });
        return response.data;
      }
      return null;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create payment URL",
        isLoading: false
      });
      return null;
    }
  }
})); 