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
      await window.aria2.getVersion();
      const status = { connected: true, message: 'Connected to aria2' };
      setAria2Status(status);
      return true;
    } catch (error) {
      console.error('Failed to check aria2 status:', error);
      setAria2Status({ connected: false, message: 'Failed to check aria2 status' });
      return false;
    }
  }, []);

  return { aria2Status, checkAria2Status };
}
