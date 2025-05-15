import { create } from "zustand";
import axios from "axios";
import { format } from "date-fns";

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

export interface Event {
  id: string;
  appointmentId: string;
  title: string;
  description: string;
  color: string;
  startTime: string;
  endTime: string;
  rule: number;
  location?: Location;
}

interface Appointment {
  id: string;
  booker: User;
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
}

interface EventsByDate {
  [date: string]: Event[];
}

interface ScheduleResponse {
  datas: Event[];
  success: boolean;
  message: string | null;
  errors: string[];
  validationFailure: unknown;
}

interface AppointmentResponse {
  datas: Appointment[];
  success: boolean;
  message: string | null;
  errors: string[];
  validationFailure: unknown;
}

interface ScheduleStore {
  events: EventsByDate;
  isLoading: boolean;
  error: string | null;
  selectedAppointment: Appointment | null;
  fetchEvents: (params: {
    startDate: string;
    endDate: string;
    eventSearch?: string;
    userIds?: string[];
  }) => Promise<void>;
  fetchAppointmentById: (id: string) => Promise<Appointment | null>;
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  events: {},
  isLoading: false,
  error: null,
  selectedAppointment: null,

  fetchEvents: async ({ startDate, endDate, eventSearch, userIds }) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem("token");
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      
      if (eventSearch) {
        params.append('eventSearch', eventSearch);
      }
      
      if (userIds && userIds.length > 0) {
        userIds.forEach(id => params.append('userIds', id));
      }

      const response = await axios.get<ScheduleResponse>(
        `${import.meta.env.VITE_API_URL}/api/Schedule/events?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        // Group events by date
        const eventsByDate: EventsByDate = {};
        response.data.datas.forEach(event => {
          const date = format(new Date(event.startTime), 'yyyy-MM-dd');
          if (!eventsByDate[date]) {
            eventsByDate[date] = [];
          }
          eventsByDate[date].push(event);
        });

        set({
          events: eventsByDate,
          isLoading: false
        });
      } else {
        set({
          error: response.data.message || "Failed to fetch events",
          isLoading: false
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch events",
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
        const appointment = response.data.datas[0];
        set({ selectedAppointment: appointment });
        return appointment;
      }
      return null;
    } catch (error) {
      console.error("Error fetching appointment:", error);
      return null;
    }
  }
}));