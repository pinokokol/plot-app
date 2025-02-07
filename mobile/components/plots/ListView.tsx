import { Alert, Text, View } from 'react-native';
import ViewSwitcher, { ViewSwitcherProps } from './ViewSwitcher';
import { useContext, useEffect, useState } from 'react';
import { Plot } from '@/types/plot';
import { emptyComponent } from '../common/FlashListComponents';
import Card, { CardProps, ItemProps } from '../common/Card';
import { FlashList } from '@shopify/flash-list';
import { AuthContext } from '@/context/AuthContext';
import i18n from '@/locales/i18n';
import realm from '@/realm/useRealm';
import { PlotSchema } from '@/realm/schemas';
import { PlotGroup } from '@/types/plot';
import { User } from '@/types/user';
import { isUUIDV4 } from '@/utils/uuid';

type SummaryData = {
  numberOfPlots: number;
  totalArea: number;
};

export default function ListView({
  viewType,
  setViewType,
  setSeePlot,
}: ViewSwitcherProps) {
  const [data, setData] = useState<CardProps[]>([]);
  const [summary, setSummary] = useState<CardProps>({} as CardProps);
  const [loading, setLoading] = useState<boolean>(true);

  const {
    selectedPlotGroup,
    selectPlotGroup,
    user,
    isConnected,
    guestAccess,
    makeRequest,
  } = useContext(AuthContext) as {
    selectedPlotGroup: PlotGroup;
    selectPlotGroup: (plotGroup: PlotGroup) => void;
    user: User;
    isConnected: boolean;
    guestAccess: boolean;
    makeRequest: any;
  };

  useEffect(() => {
    if (selectedPlotGroup) {
      loadPlotsAndSummary();
    }
  }, [selectedPlotGroup]);

  const handleSeePlot = (plotId: string) => {
    if (setSeePlot) {
      setViewType('map');
      setSeePlot(plotId);
    }
  };

  const deletePlotAlert = async (plotId: string, isSynced: boolean) => {
    Alert.alert(
      i18n.t('plotGroups.delete-plot.title'),
      i18n.t('plotGroups.delete-plot.message'),
      [
        {
          text: i18n.t('plotGroups.delete-plot.cancel'),
          style: 'cancel',
        },
        {
          text: i18n.t('plotGroups.delete-plot.delete'),
          onPress: () => deletePlot(plotId, isSynced),
        },
      ]
    );
  };

  const deletePlot = async (plotId: string, isSynced: boolean) => {
    try {
      if (!isConnected && isSynced) throw new Error('No internet connection');

      if (!isConnected || guestAccess) {
        await realm.realmDeleteOne(PlotSchema, `id == '${plotId}'`);
        await loadPlotsAndSummary();
        return;
      }

      const response = await makeRequest({
        url: `/api/plots/${selectedPlotGroup.id}`,
        method: 'DELETE',
        body: {
          id: plotId,
        },
      });

      if (response.data.success) {
        await realm.realmDeleteOne(PlotSchema, `id == '${plotId}'`);
        selectPlotGroup({
          ...selectedPlotGroup,
          plots: selectedPlotGroup.plots?.filter((plot) => plot.id !== plotId),
        });
      }
    } catch (error) {
      Alert.alert(
        i18n.t('plotGroups.delete-plot.error'),
        i18n.t('plotGroups.delete-plot.errorMessage')
      );
    }
  };

  const loadPlotsAndSummary = async () => {
    setLoading(true);
    try {
      let summaryData: SummaryData = { numberOfPlots: 0, totalArea: 0 };

      const offlinePlots = await realm.realmRead(
        PlotSchema,
        undefined,
        undefined,
        undefined,
        undefined,
        `plotGroupId == '${selectedPlotGroup?.id}' AND userId == '${guestAccess ? '0' : user.id}'`
      );

      const dataToDisplay =
        offlinePlots?.map((plot: any) => {
          const plotData = JSON.parse(plot.data) as Plot;
          const summarySize = parseFloat(plotData.size.split(' ')[0]);

          summaryData.numberOfPlots += 1;
          summaryData.totalArea += summarySize;

          return {
            id: plotData.id,
            items: [
              {
                type: 'view',
                name: i18n.t('plots.addPlot.size'),
                value: plotData.size + ' ha',
                editable: false,
              },
              {
                type: 'view',
                name: i18n.t('plots.addPlot.description'),
                value: plotData.description ? plotData.description : '/',
                editable: false,
              },
            ],
            title: plotData.name,
            synced: plot.synced,
            switchView: () => handleSeePlot(plotData.id.toString()),
            canDelete: true,
            onDelete: () => deletePlotAlert(plotData.id, plot.synced),
          } as CardProps;
        }) ?? [];

      const plotGroupPlots =
        selectedPlotGroup?.plots?.reduce((acc: CardProps[], plot: any) => {
          if (dataToDisplay.find((p) => p.id === plot.id)) {
            return acc;
          }

          const summarySize = parseFloat(plot.size ?? 0);

          summaryData.numberOfPlots += 1;
          summaryData.totalArea += summarySize;

          acc.push({
            id: plot.id,
            title: plot.name,
            synced: true,
            items: [
              {
                type: 'view',
                name: i18n.t('plots.addPlot.size'),
                value: plot.size + ' ha',
                editable: false,
              },
              {
                type: 'view',
                name: i18n.t('plots.addPlot.description'),
                value: plot.description ? plot.description : '/',
                editable: false,
              },
            ],
            switchView: () => handleSeePlot(plot.id.toString()),
            canDelete: true,
            onDelete: () => deletePlotAlert(plot.id, true),
          } as CardProps);

          return acc;
        }, []) ?? [];

      setSummary({
        items: [
          {
            type: 'view',
            name: i18n.t('plots.summary'),
            value: `${summaryData.numberOfPlots} ${i18n.t('plots.plots')}, ${summaryData.totalArea.toFixed(2) ?? 0} ha ${i18n.t('plots.totalArea')}`,
            editable: false,
          },
        ] as ItemProps[],
      });

      setData([...dataToDisplay, ...plotGroupPlots]);
    } catch (error) {
      console.error('Failed to load plots:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="h-full">
      <ViewSwitcher
        viewType={viewType}
        setViewType={setViewType}
        padding
        setSeePlot={setSeePlot}
      />
      {summary?.items?.length > 0 && (
        <View>
          <Text className="text-[18px] font-medium mx-5">
            {i18n.t('plots.summaryTitle')}
          </Text>
          <Card {...summary} />
        </View>
      )}
      {data.length > 0 && (
        <Text className="text-[18px] font-medium my-2 mx-5">
          {i18n.t('plots.plotsTitle')}
        </Text>
      )}
      <View style={{ flex: 1 }}>
        <FlashList
          extraData={[isConnected]}
          data={data}
          renderItem={({ item }) => <Card {...item} />}
          estimatedItemSize={200}
          keyExtractor={(_, index) => index.toString()}
          className="flex flex-col h-full"
          ListEmptyComponent={emptyComponent(
            loading ? i18n.t('loading') : i18n.t('plots.noData')
          )}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      </View>
    </View>
  );
}
