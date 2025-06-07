import { useEffect, useState } from "react"
import * as signalR from "@microsoft/signalr"
import { signalRService } from "@/services/signalRService"

export function useSignalR(hubName: string) {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null)

  useEffect(() => {
    signalRService.startConnection(hubName).then(() => {
      setConnection(signalRService.getConnection(hubName))
    })

    return () => {
      signalRService.stopConnection(hubName)
    }
  }, [hubName])

  return { connection }
} 