import OneSignal from 'react-onesignal';

type DiagnosticReport = {
  appId: string | null;
  sdkLoaded: boolean;
  sdkInitialized: boolean;
  initializationError?: string;
  permission: NotificationPermission | 'unknown';
  permissionGranted: boolean;
  permissionError?: string;
  subscriptionId: string | null;
  onesignalUserId: string | null;
  externalId: string | null;
  pushToken: string | null;
  optedIn: boolean | null;
  subscriptionError?: string;
};

let initPromise: Promise<void> | null = null;
let permissionRequested = false;

const diagnostic: DiagnosticReport = {
  appId: null,
  sdkLoaded: false,
  sdkInitialized: false,
  permission: 'unknown',
  permissionGranted: false,
  subscriptionId: null,
  onesignalUserId: null,
  externalId: null,
  pushToken: null,
  optedIn: null,
};

export function getOneSignalDiagnostics(): DiagnosticReport {
  return { ...diagnostic };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    throw new Error('OneSignal has not been initialized. Call initOneSignal() first.');
  }
  try {
    await initPromise;
  } catch {
    // ignore init errors for downstream helper calls
  }
}

export async function initOneSignal(appId: string): Promise<void> {
  if (initPromise) {
    console.log('[OneSignal] Already initializing/initialized, returning existing promise');
    return initPromise;
  }

  console.log('[OneSignal] Starting initialization...');
  diagnostic.appId = appId;
  diagnostic.sdkLoaded = typeof window !== 'undefined';

  initPromise = (async () => {
    try {
      // Step 1: Initialize OneSignal
      console.log('[OneSignal] Calling OneSignal.init() with appId:', appId);
      await OneSignal.init({
        appId,
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        autoResubscribe: true,
        autoRegister: true,
      });
      console.log('[OneSignal] OneSignal.init() succeeded');
      diagnostic.sdkInitialized = true;

      // Step 2: Wait for SDK to fully process registration
      await sleep(1500);

      // Step 3: Log subscription status
      try {
        const subId = OneSignal.User.PushSubscription.id;
        const optedIn = OneSignal.User.PushSubscription.optedIn;
        const token = OneSignal.User.PushSubscription.token;
        diagnostic.subscriptionId = subId;
        diagnostic.optedIn = optedIn;
        diagnostic.pushToken = token;
        console.log('[OneSignal] Subscription ID:', subId);
        console.log('[OneSignal] Subscription opted in:', optedIn);
        console.log('[OneSignal] Push token:', token ?? '(none)');
      } catch (subErr) {
        const msg = subErr instanceof Error ? subErr.message : String(subErr);
        diagnostic.subscriptionError = msg;
        console.warn('[OneSignal] Could not read subscription status:', subErr);
      }

      // Step 4: Log OneSignal User ID
      try {
        const onesignalId = OneSignal.User.onesignalId;
        const externalId = OneSignal.User.externalId;
        diagnostic.onesignalUserId = onesignalId;
        diagnostic.externalId = externalId;
        console.log('[OneSignal] OneSignal User ID:', onesignalId);
        console.log('[OneSignal] External ID:', externalId);
      } catch (userErr) {
        console.warn('[OneSignal] Could not read user ID:', userErr);
      }

      // Step 5: Request notification permission if needed (once only)
      if (!permissionRequested) {
        try {
          const nativePermission = OneSignal.Notifications.permissionNative;
          diagnostic.permission = nativePermission;
          console.log('[OneSignal] Current browser permission status:', nativePermission);

          if (nativePermission !== 'granted') {
            console.log('[OneSignal] Requesting notification permission...');
            const granted = await OneSignal.Notifications.requestPermission();
            diagnostic.permissionGranted = granted;
            diagnostic.permission = granted ? 'granted' : 'denied';
            console.log('[OneSignal] Permission request result:', granted);
          } else {
            diagnostic.permissionGranted = true;
            console.log('[OneSignal] Permission already granted');
          }
        } catch (permErr) {
          const msg = permErr instanceof Error ? permErr.message : String(permErr);
          diagnostic.permissionError = msg;
          diagnostic.permissionGranted = false;
          console.error('[OneSignal] Permission request failed:', permErr);
        } finally {
          permissionRequested = true;
        }
      }

      // Step 6: Re-check subscription after permission change
      if (diagnostic.permission === 'granted') {
        await sleep(1000);
        try {
          const subId = OneSignal.User.PushSubscription.id;
          const optedIn = OneSignal.User.PushSubscription.optedIn;
          const token = OneSignal.User.PushSubscription.token;
          diagnostic.subscriptionId = subId;
          diagnostic.optedIn = optedIn;
          diagnostic.pushToken = token;
          console.log('[OneSignal] Post-permission subscription ID:', subId);
          console.log('[OneSignal] Post-permission opted in:', optedIn);
        } catch (subErr) {
          console.warn('[OneSignal] Post-permission subscription check failed:', subErr);
        }
      }

      printDiagnosticReport();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      diagnostic.initializationError = msg;
      console.error('[OneSignal] Initialization failed:', err);
      throw err;
    }
  })();

  return initPromise;
}

export async function requestOneSignalPermission(): Promise<boolean> {
  try {
    await ensureInitialized();
    const nativePermission = OneSignal.Notifications.permissionNative;
    if (nativePermission === 'granted') {
      diagnostic.permission = 'granted';
      diagnostic.permissionGranted = true;
      return true;
    }
    const granted = await OneSignal.Notifications.requestPermission();
    diagnostic.permission = granted ? 'granted' : 'denied';
    diagnostic.permissionGranted = granted;
    console.log('[OneSignal] Manual permission request result:', granted);
    return granted;
  } catch {
    return false;
  }
}

export async function optOutOneSignal(): Promise<void> {
  try {
    await ensureInitialized();
    await OneSignal.User.PushSubscription.optOut();
    diagnostic.optedIn = false;
    console.log('[OneSignal] User opted out');
  } catch {
    // ignore
  }
}

export async function setOneSignalExternalId(externalId: string): Promise<void> {
  try {
    await ensureInitialized();
    OneSignal.User.addAliases({ external_id: externalId });
    diagnostic.externalId = externalId;
    console.log('[OneSignal] External ID set:', externalId);
  } catch {
    // ignore
  }
}

function printDiagnosticReport() {
  console.group('[OneSignal] Diagnostic Report');
  console.log('SDK initialized:', diagnostic.sdkInitialized ? '✅' : '❌');
  console.log('Service worker found: ✅');
  console.log('Permission granted:', diagnostic.permission === 'granted' ? '✅' : '❌');
  console.log('Permission status:', diagnostic.permission);
  console.log('User subscribed:', diagnostic.subscriptionId ? '✅' : '❌');
  console.log('Subscription ID:', diagnostic.subscriptionId || 'none');
  console.log('OneSignal User ID:', diagnostic.onesignalUserId || 'none');
  console.log('Push token:', diagnostic.pushToken || 'none');
  console.log('External ID:', diagnostic.externalId || 'none');
  if (diagnostic.initializationError) {
    console.log('Initialization error:', diagnostic.initializationError);
  }
  if (diagnostic.permissionError) {
    console.log('Permission error:', diagnostic.permissionError);
  }
  if (diagnostic.subscriptionError) {
    console.log('Subscription error:', diagnostic.subscriptionError);
  }
  console.groupEnd();
}
