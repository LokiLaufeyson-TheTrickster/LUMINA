'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('LUMINA SW registered:', registration.scope);
        },
        (err) => {
          console.log('LUMINA SW registration failed:', err);
        }
      );
    }
  }, []);

  return null;
}
