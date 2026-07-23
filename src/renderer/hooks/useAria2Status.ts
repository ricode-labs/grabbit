import { useState, useCallback } from 'react';

export interface Aria2Status {
  connected: boolean;
  message: string;
}

export function useAria2Status() {
  const [aria2Status, setAria2Status] = useState<Aria2Status>({
    connected: false,
    message: 'Checking aria2...'
  });

  const checkAria2Status = useCallback(async () => {
    try {
      const status = await window.electronAPI.getAria2Status();
      setAria2Status(status);
      return status.connected;
    } catch (error) {
      console.error('Failed to check aria2 status:', error);
      setAria2Status({ connected: false, message: 'Failed to check aria2 status' });

      // Try to reconnect if connection check fails
      try {
        const reconnectResult = await window.electronAPI.reconnectAria2();
        if (reconnectResult.success) {
          setAria2Status({ connected: true, message: 'Reconnected to aria2' });
          return true;
        }
      } catch (reconnectError) {
        console.error('Reconnection attempt failed:', reconnectError);
      }

      return false;
    }
  }, []);

  return { aria2Status, checkAria2Status };
}
