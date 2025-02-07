import { useNavigation } from 'expo-router';
import { ChevronLeft, RefreshCw } from 'lucide-react-native';
import { useContext, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import realm from '@/realm/useRealm';
import { PlotGroupSchema, PlotSchema } from '@/realm/schemas';
import Card, { ItemProps } from '@/components/common/Card';
import i18n from '@/locales/i18n';
import cn from '@/utils/cn';
import { AuthContext } from '@/context/AuthContext';
import { User } from '@/types/user';
import { isUUIDV4 } from '@/utils/uuid';

interface PlotGroupIds {
  oldId: string;
  newId: number;
}

export default function DataSync() {
  const navigation = useNavigation();
  const { isConnected, makeRequest, user, guestAccess } = useContext(
    AuthContext
  ) as {
    isConnected: boolean;
    makeRequest: any;
    user: User;
    guestAccess: boolean;
  };

  const [plotGroupsToSync, setPlotGroupsToSync] = useState<ItemProps[]>([]);
  const [plotsToSync, setPlotsToSync] = useState<ItemProps[]>([]);
  const [plotGroupsToSyncData, setPlotGroupsToSyncData] = useState<any>([]);
  const [plotsToSyncData, setPlotsToSyncData] = useState<any>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          className="flex flex-row items-center justify-center mr-3"
        >
          <ChevronLeft className="text-Blue" />
          <Text className="font-medium text-Blue text-[18px]">Back</Text>
        </Pressable>
      ),
    });

    getItemsToSync();
  }, []);

  const getItemsToSync = async () => {
    setLoading(true);
    try {
      const plotGroups = (await realm.realmRead(
        PlotGroupSchema,
        undefined,
        undefined,
        undefined,
        undefined,
        `synced == false AND userId == '${user?.id}'`
      )) as any;

      const plots = (await realm.realmRead(
        PlotSchema,
        undefined,
        undefined,
        undefined,
        undefined,
        `synced == false AND userId == '${user?.id}'`
      )) as any;

      let plotGroupsData: any = [];
      let plotsData: any = [];

      const plotGroupsToSync = plotGroups.map((pg: any) => {
        const data = JSON.parse(pg.data);

        plotGroupsData.push(data);

        return {
          type: 'view',
          name: i18n.t('synced.name'),
          value: pg.name,
          editable: false,
        } as ItemProps;
      });

      const plotsToSync = plots.map((plot: any) => {
        const data = JSON.parse(plot.data);
        data.size = parseFloat(data.size.split(' ')[0]);

        plotsData.push({
          id: plot.id,
          name: data.name,
          description: data.description,
          size: data.size,
          coordinates: data.featureInfo.geometry.coordinates[0].map(
            (coordinate: number[]) => {
              return { latitude: coordinate[1], longitude: coordinate[0] };
            }
          ),
          plotGroupId: isUUIDV4(plot.plotGroupId)
            ? plot.plotGroupId
            : parseInt(plot.plotGroupId),
        });

        return {
          type: 'view',
          name: i18n.t('synced.title'),
          value: data.name,
          editable: false,
        } as ItemProps;
      });

      setPlotGroupsToSync(plotGroupsToSync);
      setPlotsToSync(plotsToSync);

      setPlotGroupsToSyncData(plotGroupsData);
      setPlotsToSyncData(plotsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    if (!isConnected) {
      return;
    }

    setSyncing(true);

    try {
      const response = await makeRequest({
        url: `/api/sync`,
        method: 'POST',
        body: {
          plotGroups: plotGroupsToSyncData,
          plots: plotsToSyncData,
        },
      });

      if (!response.data.success) {
        Alert.alert(i18n.t('synced.error'), i18n.t('synced.errorMessage'));
        return;
      }

      for (const plotGroup of plotGroupsToSyncData) {
        const newIdObj = response.data.plotGroupIds.find(
          (pg: PlotGroupIds) => pg.oldId === plotGroup.id
        );
        if (newIdObj) {
          const oldObject = await realm.realmRead(
            PlotGroupSchema,
            1,
            0,
            'name',
            'ASC',
            `id == '${plotGroup.id}'`
          );

          const plotGroupRealm = {
            id: newIdObj.newId.toString(),
            userId: oldObject[0].userId,
            data: oldObject[0].data,
            name: oldObject[0].name,
            synced: true,
          };

          await realm.realmWrite(PlotGroupSchema, plotGroupRealm);

          await realm.realmDeleteOne(
            PlotGroupSchema,
            `id == '${plotGroup.id}'`
          );
        }
      }

      for (const plot of plotsToSyncData) {
        await realm.realmUpdate(PlotSchema, plot.id, 'synced', true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSyncing(false);
      await getItemsToSync();
      Alert.alert(i18n.t('synced.syncedTitle'), i18n.t('synced.syncedMessage'));
    }
  };

  return (
    <View>
      {guestAccess ? (
        <View className="p-5">
          <Text className="text-lg">{i18n.t('synced.guestWarning')}</Text>
        </View>
      ) : (
        <View className="h-full">
          <ScrollView className="flex flex-col h-full pt-5 bg-White">
            <Text className="text-[18px] font-medium mx-5">
              {i18n.t('plotGroups.title')}
            </Text>
            {loading ? (
              <View className="flex flex-row items-center justify-center p-5 py-10">
                <Text className="text-[16px] font-medium">
                  {i18n.t('loading')}
                </Text>
              </View>
            ) : plotGroupsToSync.length > 0 ? (
              <Card items={plotGroupsToSync} />
            ) : (
              <View className="flex flex-row items-center justify-center p-5 py-10">
                <Text className="text-[16px] font-medium">
                  {i18n.t('synced.noPlotGroups')}
                </Text>
              </View>
            )}

            <Text className="text-[18px] font-medium mx-5">
              {i18n.t('plots.plotsTitle')}
            </Text>
            {loading ? (
              <View className="flex flex-row items-center justify-center p-5 py-10">
                <Text className="text-[16px] font-medium">
                  {i18n.t('loading')}
                </Text>
              </View>
            ) : plotsToSync.length > 0 ? (
              <Card items={plotsToSync} />
            ) : (
              <View className="flex flex-row items-center justify-center p-5 py-10">
                <Text className="text-[16px] font-medium">
                  {i18n.t('synced.noPlots')}
                </Text>
              </View>
            )}
          </ScrollView>
          <Pressable
            className="bg-White"
            onPress={syncData}
            disabled={
              !isConnected ||
              (plotGroupsToSync.length === 0 && plotsToSync.length === 0)
            }
          >
            {({ pressed }) => (
              <View
                className={cn(
                  pressed ||
                    !isConnected ||
                    (plotGroupsToSync.length === 0 && plotsToSync.length === 0)
                    ? 'bg-Blue/80'
                    : 'bg-Blue',
                  'flex flex-row m-5 p-3 items-center justify-center rounded-md h-[48px]'
                )}
              >
                {syncing ? (
                  <ActivityIndicator />
                ) : (
                  <RefreshCw className="text-White" />
                )}
                <View className="w-2" />
                <Text className="text-[16px] text-White font-semibold">
                  {i18n.t('home.syncData')}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
