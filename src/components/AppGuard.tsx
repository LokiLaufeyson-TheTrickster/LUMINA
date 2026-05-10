'use client';

import { useState, useEffect } from 'react';
import SplashScreen from '@/components/SplashScreen';
import PinLock from '@/components/PinLock';
import { getSetting } from '@/lib/db';
import { seedPrompts } from '@/lib/db';

export default function AppGuard({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [showPinLock, setShowPinLock] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedPrompts();
  }, []);

  const handleSplashDone = async () => {
    setShowSplash(false);
    // Check if PIN is enabled
    const pinEnabled = await getSetting('pin_enabled');
    if (pinEnabled === 'true') {
      setShowPinLock(true);
    } else {
      setReady(true);
    }
  };

  const handleUnlock = () => {
    setShowPinLock(false);
    setReady(true);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashDone} />;
  }

  if (showPinLock) {
    return <PinLock onUnlock={handleUnlock} />;
  }

  if (!ready) return null;

  return <>{children}</>;
}
