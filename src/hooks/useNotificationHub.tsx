import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { signalRService } from "@/services/signalRService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  UserPlus,
  UserCheck,
  UserX,
  Heart,
  Bell,
} from "lucide-react";
import { useNotificationStore } from "@/store/NotificationStore";

interface Notification {
  title: string;
  senderId: string;
  body: string;
  recieverId: string;
  senderType: number;
  recieverType: number;
  objectNames: string[];
  eventType: number;
  location: number;
  createdAt: string;
  trackId: string;
}

export const getNotificationIconComponent = (eventType: number) => {
  switch (eventType) {
    case 1:
      return Calendar;
    case 2:
      return CheckCircle2;
    case 3:
      return XCircle;
    case 10:
      return UserPlus;
    case 11:
      return UserCheck;
    case 12:
      return UserX;
    case 20:
      return Heart;
    default:
      return Bell;
  }
};

const getNotificationIconColor = (eventType: number) => {
  switch (eventType) {
    case 1:
      return "text-blue-500";
    case 2:
      return "text-green-500";
    case 3:
      return "text-red-500";
    case 10:
      return "text-purple-500";
    case 11:
      return "text-emerald-500";
    case 12:
      return "text-rose-500";
    case 20:
      return "text-pink-500";
    default:
      return "text-[#de9151]";
  }
};

export function useNotificationHub() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const processedTrackIds = useRef<Set<string>>(new Set());
  const navigate = useNavigate();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const handleNotificationClick = (notification: Notification) => {
    // Handle appointment-related notifications
    if (notification.eventType >= 1 && notification.eventType <= 4 && notification.objectNames.length >= 2) {
      const appointmentId = notification.objectNames[1];
      navigate(`/appointments/${appointmentId}`);
    }
  };

  useEffect(() => {
    const hubName = "noti-hub";
    console.log("=== Starting Notification Hub Setup ===");
    console.log("Hub Name:", hubName);

    signalRService.startConnection(hubName).then(() => {
      const conn = signalRService.getConnection(hubName);
      
      if (conn) {
        const reconnectingHandler = (error: Error | undefined) => {
          console.log("=== Connection Reconnecting ===");
          console.log("Error:", error);
          console.log("=============================");
        };

        const reconnectedHandler = (connectionId: string | undefined) => {
          console.log("=== Connection Reconnected ===");
          console.log("New Connection ID:", connectionId);
          console.log("============================");
        };

        const closeHandler = (error: Error | undefined) => {
          console.log("=== Connection Closed ===");
          console.log("Error:", error);
          console.log("=========================");
        };

        conn.onreconnecting(reconnectingHandler);
        conn.onreconnected(reconnectedHandler);
        conn.onclose(closeHandler);

        console.log("Setting up ReceiveNoti handler...");
        conn.on("ReceiveNoti", (data: unknown) => {
          try {
            console.log("Received notification:", data);
            const notification = data as Notification;
            if (!notification.recieverId) {
              console.warn("Received notification without receiverId");
              return;
            }

            // Check if we've already processed this trackId
            if (processedTrackIds.current.has(notification.trackId)) {
              console.log("Skipping duplicate notification with trackId:", notification.trackId);
              return;
            }

            // Add trackId to processed set
            processedTrackIds.current.add(notification.trackId);

            const Icon = getNotificationIconComponent(notification.eventType);
            const iconColor = getNotificationIconColor(notification.eventType);

            toast.custom((t) => (
              <div 
                className="flex items-start gap-3 w-96 bg-white border border-gray-100 shadow-lg rounded-2xl p-4 relative cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  handleNotificationClick(notification);
                  toast.dismiss(t);
                }}
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {notification.title}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{notification.body}</p>
                  <div className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 transition-colors"
                  aria-label="Close"
                >
                  <XCircle className="h-5 w-5 text-red-400 hover:text-red-600" />
                </button>
              </div>
            ), {
              duration: 5000,
              position: "top-right",
            });

            setNotifications((prev) => {
              // Check if notification with this trackId already exists
              const exists = prev.some(n => n.trackId === notification.trackId);
              if (exists) {
                return prev;
              }
              // Also push to Zustand notification store
              addNotification({
                id: Date.now(), // fallback id, ideally use backend id
                recieverId: notification.recieverId,
                senderName: notification.senderId,
                senderType: notification.senderType,
                senderAvatar: '',
                recieverType: notification.recieverType,
                title: notification.title,
                eventType: notification.eventType,
                body: notification.body,
                createdAt: notification.createdAt,
                location: notification.location,
              });
              return [notification, ...prev];
            });
          } catch (error) {
            console.error("Error processing notification:", error);
            console.error("Raw data:", data);
          }
        });

        setConnection(conn);
        console.log("Notification hub setup complete");
      } else {
        console.error("Failed to get notification hub connection");
      }
    }).catch(error => {
      console.error("Failed to start notification hub connection:", error);
    });

    return () => {
      const conn = signalRService.getConnection(hubName);
      if (conn) {
        console.log("Cleaning up notification hub connection");
        conn.off("ReceiveNoti");
        conn.onreconnecting(() => {});
        conn.onreconnected(() => {});
        conn.onclose(() => {});
      }
      // Clear processed trackIds on cleanup
      processedTrackIds.current.clear();
    };
  }, [navigate, addNotification]);

  return { notifications, connection };
}
