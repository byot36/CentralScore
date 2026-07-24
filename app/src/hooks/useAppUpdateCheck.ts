import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION as string | undefined;
const RELEASES_API = 'https://api.github.com/repos/byot36/CentralScore/releases/latest';

export interface AvailableUpdate {
  version: string;
  downloadUrl: string;
}

export function useAppUpdateCheck(): AvailableUpdate | null {
  const [update, setUpdate] = useState<AvailableUpdate | null>(null);

  useEffect(() => {
    if (!isNative || !CURRENT_VERSION) return;

    fetch(RELEASES_API)
      .then((res) => res.json())
      .then((data: { tag_name?: string; assets?: Array<{ browser_download_url: string; name: string }> }) => {
        const latestVersion = data.tag_name?.replace(/^v/, '');
        if (!latestVersion || latestVersion === CURRENT_VERSION) return;
        const apkAsset = data.assets?.find((a) => a.name.endsWith('.apk'));
        if (!apkAsset) return;
        setUpdate({ version: latestVersion, downloadUrl: apkAsset.browser_download_url });
      })
      .catch(() => {});
  }, []);

  return update;
}
