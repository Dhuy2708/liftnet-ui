import * as signalR from "@microsoft/signalr";

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private static instance: SignalRService;

  private constructor() {
    // Stop connection on window unload to prevent leaks
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.stopConnection();
      });
    }
  }

  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }

  public async startConnection(): Promise<void> {
    if (this.connection) {
      // If already connected or connecting, do not start a new one
      if (
        this.connection.state === signalR.HubConnectionState.Connected ||
        this.connection.state === signalR.HubConnectionState.Connecting
      ) {
        return;
      }
      // If disconnected, try to start again
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL}/chat-hub`, {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect()
      .build();

    try {
      await this.connection.start();
      console.log("SignalR Connected");
    } catch (err) {
      console.error("SignalR Connection Error: ", err);
    }
  }

  public getConnection(): signalR.HubConnection | null {
    return this.connection;
  }

  public async stopConnection(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {
        // ignore
      }
      this.connection = null;
    }
  }
}

export const signalRService = SignalRService.getInstance(); 