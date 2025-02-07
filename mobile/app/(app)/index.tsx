import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';

import Topbar from '@/components/common/Topbar';
import HomeNavButton from '@/components/home/HomeNavButton';
import PlotGroupsSvg from '@/components/svg/PlotGroupsSvg';
import PlotSvg from '@/components/svg/PlotSvg';

import i18n from '@/locales/i18n';
import SyncDataButton from '@/components/home/SyncDataButton';
import { useEffect, useState } from 'react';

export default function Home() {
  const [_, setLocale] = useState(i18n.locale);

  useEffect(() => {
    const unsubscribe = i18n.onChange(() => {
      setLocale(i18n.locale);
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaView
      className="flex flex-col justify-between h-full bg-Background"
      edges={{ top: 'maximum' }}
    >
      <Topbar title={i18n.t('home.title')} />
      <View className="flex flex-col">
        <HomeNavButton
          title={i18n.t('home.plotGroups')}
          icon={PlotGroupsSvg}
          link="/(plot-groups)/plot-groups"
        />
        <HomeNavButton
          title={i18n.t('home.newPlot')}
          icon={PlotSvg}
          link="/(plot-groups)/newplot"
        />
      </View>
      <View className="pb-5 border-t bg-White border-t-LightGray">
        <SyncDataButton />
      </View>
    </SafeAreaView>
  );
}
