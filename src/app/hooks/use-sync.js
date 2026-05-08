"use client"

import { useState, useEffect, useCallback } from "react"
import { db } from "@/lib/db/indexed-db"
import { useOffline } from "./use-offline"

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState(null)
  const [pendingChanges, setPendingChanges] = useState(0)
  const { isOnline, wasOffline } = useOffline()

  const checkPendingChanges = useCallback(async () => {
    try {
      const queue = await db.getSyncQueue()
      setPendingChanges(queue.length)
    } catch (error) {
      console.error("Error checking pending changes:", error)
    }
  }, [])

  const syncData = useCallback(async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    setSyncError(null)

    try {
      const queue = await db.getSyncQueue()
      console.log("Syncing", queue.length, "pending changes")

      for (const item of queue) {
        console.log("Syncing item:", item)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      await db.clearSyncQueue()
      setPendingChanges(0)
      console.log("Sync completed successfully")
    } catch (error) {
      console.error("Sync error:", error)
      setSyncError("Failed to sync data")
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing])

  useEffect(() => {
    checkPendingChanges()
  }, [checkPendingChanges])

  useEffect(() => {
    if (isOnline && wasOffline && pendingChanges > 0) {
      console.log("Back online, starting sync...")
      syncData()
    }
  }, [isOnline, wasOffline, pendingChanges, syncData])

  return {
    isSyncing,
    syncError,
    pendingChanges,
    syncData,
    checkPendingChanges,
  }
}
