import { create } from "zustand";
import axios from "axios";

interface Location {
  placeName: string;
  placeId: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: number;
  avatar: string;
  isDeleted: boolean;
  isSuspended: boolean;
}

export interface Appointment {
  id: string;
  editable: boolean;
  booker: User;
  otherParticipants: User[];
  participantCount: number;
  name: string;
  description: string;
  location: Location;
  startTime: string;
  endTime: string;
  status: number;
  repeatingType: number;
  created: string;
  modified: string;
  notiCount: number;
  price: number;
  confirmationRequest: {
    id: number;
    img: string;
    content: string;
    status: number;
    createdAt: string;
    modifiedAt: string;
    expiresdAt: string;
  } | null;
  feedbacks?: Array<{
    id: number;
    user: User;
    star: number;
    medias: string[];
    content: string;
  }>;
}

interface AppointmentResponse {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  nextPageToken: string | null;
  datas: Appointment[];
  success: boolean;
  message: string | null;
  errors: string[];
  validationFailure: unknown;
}

interface AppointmentStore {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  fetchAppointments: (searchQuery?: string, sortBy?: "starttime" | "endtime", sortOrder?: "asc" | "desc", statusFilter?: number | null, appointmentStatus?: number) => Promise<void>;
  fetchAppointmentById: (id: string) => Promise<Appointment | null>;
  setPageNumber: (page: number) => void;
  setPageSize: (size: number) => void;
  deleteAppointment: (id: string) => Promise<{ success: boolean; message: string }>;
  sendConfirmationRequest: (appointmentId: string, data: { content?: string; image?: File }) => Promise<{ success: boolean; message: string }>;
  confirmRequest: (confirmationId: number) => Promise<{ success: boolean; message: string }>;
  sendFeedback: (data: { appointmentId: string; coachId: string; content: string; star: number; medias?: File[] }) => Promise<{ success: boolean; message: string }>;
}

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: [],
  isLoading: false,
  error: null,
  pageNumber: 1,
  pageSize: 20,
  totalCount: 0,

  setPageNumber: (page: number) => set({ pageNumber: page }),
  setPageSize: (size: number) => set({ pageSize: size }),

  fetchAppointments: async (searchQuery?: string, sortBy?: "starttime" | "endtime", sortOrder?: "asc" | "desc", statusFilter?: number | null, appointmentStatus?: number) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem("token");
      const { pageNumber, pageSize } = get();

      const conditionItems = [];
      
      if (searchQuery) {
        conditionItems.push({
          property: "name",
          operator: 0,
          values: [searchQuery],
          type: 0,
          logic: 1
        });
      }

      if (statusFilter !== null && statusFilter !== undefined) {
        conditionItems.push({
          property: "status",
          operator: 0,
          values: [statusFilter.toString()],
          type: 1,
          logic: 1
        });
      }

      if (appointmentStatus !== undefined) {
        conditionItems.push({
          property: "appointmentStatus",
          operator: 0,
          values: [appointmentStatus.toString()],
          type: 1,
          logic: 1
        });
      }

      const requestBody: Record<string, unknown> = {
        conditionItems,
        pageNumber,
        pageSize
      };

      if (sortBy && sortOrder) {
        requestBody.sort = {
          name: sortBy,
          type: sortOrder === "asc" ? 1 : 2
        };
        }

      const response = await axios.post<AppointmentResponse>(
        `${import.meta.env.VITE_API_URL}/api/Appointment/list`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        set({
          appointments: response.data.datas,
          totalCount: response.data.totalCount,
          isLoading: false
        });
      } else {
        set({
          error: response.data.message || "Failed to fetch appointments",
          isLoading: false
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch appointments",
        isLoading: false
      });
    }
  },

  fetchAppointmentById: async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get<AppointmentResponse>(
        `${import.meta.env.VITE_API_URL}/api/Appointment/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success && response.data.datas.length > 0) {
        return response.data.datas[0];
      }
      return null;
    } catch (error) {
      console.error("Error fetching appointment:", error);
      return null;
    }
  },

  deleteAppointment: async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/Appointment/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        set(state => ({
          appointments: state.appointments.filter(app => app.id !== id)
        }));
        return { success: true, message: "Appointment deleted successfully" };
      }
      return { success: false, message: response.data.message || "Failed to delete appointment" };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to delete appointment" 
      };
    }
  },

  sendConfirmationRequest: async (appointmentId: string, data: { content?: string; image?: File }) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("AppointmentId", appointmentId);
      if (data.content) formData.append("Content", data.content);
      if (data.image) formData.append("Image", data.image);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Appointment/RequestConfirmation`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (response.data.success) {
        return { success: true, message: "Confirmation request sent successfully" };
      }
      return { success: false, message: response.data.message || "Failed to send confirmation request" };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to send confirmation request" 
      };
    }
  },

  confirmRequest: async (confirmationId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Appointment/confirm`,
        confirmationId,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        return { success: true, message: "Confirmation request confirmed successfully" };
      }
      return { success: false, message: response.data.message || "Failed to confirm request" };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to confirm request" 
      };
    }
  },

  sendFeedback: async (data: { appointmentId: string; coachId: string; content: string; star: number; medias?: File[] }) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("AppointmentId", data.appointmentId);
      formData.append("CoachId", data.coachId);
      formData.append("Content", data.content);
      formData.append("Star", data.star.toString());
      if (data.medias && data.medias.length > 0) {
        data.medias.forEach((file) => {
          formData.append("Medias", file);
        });
      }
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Appointment/feedback`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      if (response.data.success) {
        return { success: true, message: "Feedback sent successfully" };
      }
      return { success: false, message: response.data.message || "Failed to send feedback" };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to send feedback"
      };
    }
  }
})); 