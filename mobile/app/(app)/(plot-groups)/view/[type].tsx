import ListView from '@/components/plots/ListView';
import MapView from '@/components/plots/MapView';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { useContext, useEffect, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { AuthContext } from '@/context/AuthContext';
import i18n from '@/locales/i18n';
import realm from '@/realm/useRealm';
import { PlotGroupSchema, PlotSchema } from '@/realm/schemas';
import { isUUIDV4 } from '@/utils/uuid';

export default function ViewPlots() {
  const { makeRequest, selectedPlotGroup, isConnected, guestAccess } =
    useContext(AuthContext);

  const navigation = useNavigation();
  const { type } = useLocalSearchParams();

  const [viewType, setViewType] = useState<'list' | 'map'>('list');
  const [seePlot, setSeePlot] = useState<string>('');

  const deletePlotGroupAlert = async () => {
    Alert.alert(
      i18n.t('plotGroups.delete.title'),
      i18n.t('plotGroups.delete.message'),
      [
        {
          text: i18n.t('plotGroups.delete.cancel'),
          style: 'cancel',
        },
        {
          text: i18n.t('plotGroups.delete.delete'),
          onPress: () => deletePlotGroup(),
        },
      ]
    );
  };

  const deletePlotGroup = async () => {
    if (!selectedPlotGroup || typeof selectedPlotGroup === 'string') {
      return;
    }

    try {
      const plotGroupRealm = await realm.realmRead(
        PlotGroupSchema,
        1,
        0,
        'name',
        'ASC',
        `id == '${selectedPlotGroup.id}'`
      );

      if (!isConnected && plotGroupRealm[0].synced)
        throw new Error('Synced item can be deleted only when online');

      if (!isConnected || guestAccess || isUUIDV4(selectedPlotGroup.id)) {
        await realm.realmDeleteOne(
          PlotGroupSchema,
          `id == '${selectedPlotGroup.id}'`
        );

        if (selectedPlotGroup?.plots?.length > 0) {
          for (const plot of selectedPlotGroup.plots) {
            await realm.realmDeleteOne(PlotSchema, `id == '${plot.id}'`);
          }
        }

        navigation.goBack();
        return;
      }

      const response = await makeRequest({
        url: `/api/plots/plot-groups/${selectedPlotGroup.id}`,
        method: 'DELETE',
      });

      if (response.data.success) {
        await realm.realmDeleteOne(
          PlotGroupSchema,
          `id == '${selectedPlotGroup.id}'`
        );

        if (selectedPlotGroup?.plots?.length > 0) {
          for (const plot of selectedPlotGroup.plots) {
            await realm.realmDeleteOne(PlotSchema, `id == '${plot.id}'`);
          }
        }

        navigation.goBack();
      }
    } catch (error) {
      Alert.alert(
        i18n.t('plotGroups.delete.error'),
        i18n.t('plotGroups.delete.errorMessage')
      );
    }
  };

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
      headerRight: () => (
        <Pressable
          onPress={deletePlotGroupAlert}
          className="flex flex-row items-center justify-center mr-3"
        >
          <Trash2 className="h-auto text-black" size={20} />
        </Pressable>
      ),
    });
  }, []);

  return (
    <View className="h-full border-t bg-White border-t-LightGray">
      {viewType === 'list' && type !== 'new' ? (
        <ListView
          viewType={viewType}
          setViewType={setViewType}
          setSeePlot={setSeePlot}
        />
      ) : (
        <MapView
          viewType={viewType}
          setViewType={setViewType}
          type={type}
          seePlot={seePlot}
          setSeePlot={setSeePlot}
        />
      )}
    </View>
  );
}
