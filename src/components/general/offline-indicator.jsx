"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WifiOff, Wifi, RefreshCw, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOffline } from "@/app/hooks/use-offline";
import { useSync } from "@/app/hooks/use-sync";

export function OfflineIndicator() {
  const { isOnline } = useOffline();
  const { isSyncing, syncError, pendingChanges, syncData } = useSync();

  if (isOnline && pendingChanges === 0 && !syncError) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      {!isOnline && (
        <Alert className="mb-2 border-destructive bg-destructive/10">
          <WifiOff className="h-4 w-4 text-destructive" />
          <AlertDescription className="ml-2 text-destructive">
            You are currently offline. Changes will be saved locally and synced
            when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {isOnline && pendingChanges > 0 && (
        <Alert className="mb-2 border-primary bg-primary/10">
          <Wifi className="h-4 w-4 text-primary" />
          <AlertDescription className="ml-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>
                {isSyncing ? "Syncing..." : `${pendingChanges} pending changes`}
              </span>
              <Badge variant="secondary">{pendingChanges}</Badge>
            </div>
            {!isSyncing && (
              <Button
                size="sm"
                variant="outline"
                onClick={syncData}
                className="ml-2 bg-transparent"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Sync Now
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {syncError && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="ml-2 flex items-center justify-between text-destructive">
            <span>{syncError}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={syncData}
              className="ml-2 bg-transparent"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
