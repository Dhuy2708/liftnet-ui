import * as signalR from "@microsoft/signalr";

class SignalRService {
  private connections: Map<string, signalR.HubConnection> = new Map();
  private static instance: SignalRService;

  private constructor() {
    // Stop connection on window unload to prevent leaks
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.stopAllConnections();
      });
    }
  }

  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }

  public async startConnection(hubName: string): Promise<void> {
    if (!hubName) {
      console.error("Hub name is required");
      return;
    }

    if (this.connections.has(hubName)) {
      const connection = this.connections.get(hubName)!;
      if (
        connection.state === signalR.HubConnectionState.Connected ||
        connection.state === signalR.HubConnectionState.Connecting
      ) {
        console.log(`Already connected or connecting to ${hubName}`)
        return;
      }
    }

    console.log(`Starting connection to ${hubName}...`)
    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
    const hubUrl = `${baseUrl}/${hubName}`;
    console.log(`Connecting to hub URL: ${hubUrl}`);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect()
      .build();

    try {
      await connection.start();
      console.log(`Successfully connected to ${hubName}`);
      this.connections.set(hubName, connection);
    } catch (err) {
      console.error(`Failed to connect to ${hubName}: `, err);
    }
  }

  public getConnection(hubName: string): signalR.HubConnection | null {
    return this.connections.get(hubName) || null;
  }

  public async stopConnection(hubName: string): Promise<void> {
    const connection = this.connections.get(hubName);
    if (connection) {
      try {
        await connection.stop();
      } catch {
        // ignore
      }
      this.connections.delete(hubName);
    }
  }

  public async stopAllConnections(): Promise<void> {
    for (const [hubName] of this.connections) {
      await this.stopConnection(hubName);
    }
  }
}

export const signalRService = SignalRService.getInstance(); 