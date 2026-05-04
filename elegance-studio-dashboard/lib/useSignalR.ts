import { useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { getToken } from './auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5134'

type EventMap = Record<string, (...args: unknown[]) => void>

export function useSignalR(events: EventMap, groups: string[], enabled = true) {
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const eventsRef     = useRef<EventMap>(events)
  const groupsRef     = useRef<string[]>(groups)

  // Mantém referência actualizada sem re-criar a ligação
  useEffect(() => { eventsRef.current = events }, [events])
  useEffect(() => { groupsRef.current = groups },  [groups])

  const connect = useCallback(async () => {
    if (!enabled) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API}/hubs/bookings`, {
        accessTokenFactory: () => getToken() ?? '',
        transport: signalR.HttpTransportType.WebSockets |
                   signalR.HttpTransportType.ServerSentEvents |
                   signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    // Registar eventos
    Object.entries(eventsRef.current).forEach(([event, handler]) => {
      connection.on(event, (...args) => eventsRef.current[event]?.(...args))
    })

    connectionRef.current = connection

    try {
      await connection.start()

      // Juntar aos grupos
      for (const group of groupsRef.current) {
        try {
          await connection.invoke('JoinGroup', group)
        } catch { /* grupo pode não existir ainda */ }
      }
    } catch (err) {
      console.warn('[SignalR] Falha na ligação:', err)
    }
  }, [enabled])

  useEffect(() => {
    connect()

    return () => {
      connectionRef.current?.stop()
      connectionRef.current = null
    }
  }, [connect])

  return connectionRef
}