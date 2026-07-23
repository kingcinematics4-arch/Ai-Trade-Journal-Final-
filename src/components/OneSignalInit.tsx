'use client';

import { useEffect } from 'react';
import { initOneSignal, getOneSignalDiagnostics } from '@/lib/oneSignal';

export default function OneSignalInit() {
  useEffect(() => {
    const appId = "bb029fae-5823-43ca-8870-2260b03223d8";
    console.log('[OneSignalInit] Component mounted. App ID from env:', appId);

    if (!appId) {
      console.error('[OneSignalInit] NEXT_PUBLIC_ONESIGNAL_APP_ID is not set in .env.local');
      return;
    }

    void initOneSignal(appId)
      .then(() => {
        const diag = getOneSignalDiagnostics();
        if (!diag.sdkInitialized) {
          console.error('[OneSignalInit] OneSignal initialization did not complete successfully');
        }
      })
      .catch((err) => {
        console.error('[OneSignalInit] OneSignal initialization threw:', err);
      });
  }, []);

  return null;
}
