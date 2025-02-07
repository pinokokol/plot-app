import { Stack, router, useSegments } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useContext, useEffect, useRef, useState } from 'react';

import { AuthContext } from '@/context/AuthContext';
import i18n from '@/locales/i18n';

import Mapbox from '@rnmapbox/maps';
import OfflinePack from '@rnmapbox/maps/lib/typescript/src/modules/offline/OfflinePack';
import { ChevronLeft } from 'lucide-react-native';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '');

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function AppLayout() {
  const { checkAuth, accessToken, guestAccess } = useContext(AuthContext);

  const segments = useSegments();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hasNavigatedToMapDownload = useRef<boolean>(false);

  useEffect(() => {
    handleAuthCheck();
  }, [segments, accessToken]);

  const handleAuthCheck = async () => {
    if (guestAccess) {
      setIsLoading(false);
      checkForOfflineMaps();
      return;
    }

    if (accessToken === 'none') {
      router.replace('/login');
      return;
    } else if (accessToken) {
      const isAuth = await checkAuth();

      if (!isAuth) {
        router.replace('/login');
      } else {
        setIsLoading(false);
        checkForOfflineMaps();
      }
    }
  };

  const checkForOfflineMaps = async () => {
    try {
      const packs: OfflinePack[] = await Mapbox.offlineManager.getPacks();
      if (packs.length === 0 && !hasNavigatedToMapDownload.current) {
        hasNavigatedToMapDownload.current = true;
        router.push('/map-download');
      }
    } catch (error) {
      console.error('Error fetching offline packs:', error);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="data-sync"
        options={{
          presentation: 'modal',
          title: i18n.t('home.syncData'),
          headerLeft: () => <LeftHeader />,
        }}
      />
      <Stack.Screen name="(plot-groups)" options={{ headerShown: false }} />
      <Stack.Screen
        name="user-settings"
        options={{
          presentation: 'modal',
          title: i18n.t('userSettings.title'),
          headerLeft: () => <LeftHeader />,
        }}
      />
      <Stack.Screen
        name="map-download"
        options={{
          presentation: 'modal',
          title: i18n.t('plots.mapDownload'),
          headerLeft: () => <LeftHeader />,
        }}
      />
    </Stack>
  );
}

const LeftHeader = () => (
  <Pressable className="flex flex-row items-center justify-center mr-3">
    <ChevronLeft className="text-Blue" />
    <Text className="font-medium text-Blue text-[18px]">Back</Text>
  </Pressable>
);
