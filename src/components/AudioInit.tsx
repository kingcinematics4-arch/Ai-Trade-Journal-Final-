'use client';

import { useEffect } from 'react';
import { preloadNotificationSounds } from '@/lib/audio/preloadSounds';

export default function AudioInit(): null {
  useEffect(() => {
    preloadNotificationSounds();
  }, []);
  return null;
}
