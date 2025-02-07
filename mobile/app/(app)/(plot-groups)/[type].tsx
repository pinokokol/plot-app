import Topbar from '@/components/common/Topbar';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '@/locales/i18n';
import SearchInput from '@/components/common/SearchInput';
import { useContext, useEffect, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { AuthContext } from '@/context/AuthContext';
import Card, { CardProps, ItemProps } from '@/components/common/Card';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import NewPlotGroupButton, {
  ButtonWrapper,
} from '@/components/plotGroups/NewPlotGroupButton';
import { useLocalSearchParams, useSegments } from 'expo-router';
import { emptyComponent } from '@/components/common/FlashListComponents';
import realm from '@/realm/useRealm';
import { PlotGroup } from '@/types/plot';
import { PlotGroupSchema } from '@/realm/schemas';

export default function PlotGroups() {
  let loadingPlots = false;
  const { type } = useLocalSearchParams();
  const [search, setSearch] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('name_asc');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [data, setData] = useState<CardProps[]>([]);
  const [dataCount, setDataCount] = useState<number>(100);
  const [preventOnEndReached, setPreventOnEndReached] =
    useState<boolean>(false);

  const [offset, setOffset] = useState<number>(0);
  const limit = 10;

  const { isConnected, makeRequest, user, guestAccess } =
    useContext(AuthContext);

  const segments = useSegments();

  const sortItems = [
    {
      label: i18n.t('plotGroups.sort.name'),
      value: 'name_asc',
      icon: ChevronUp,
    },
    {
      label: i18n.t('plotGroups.sort.name'),
      value: 'name_desc',
      icon: ChevronDown,
    },
    { label: i18n.t('plotGroups.sort.id'), value: 'id_asc', icon: ChevronUp },
    {
      label: i18n.t('plotGroups.sort.id'),
      value: 'id_desc',
      icon: ChevronDown,
    },
  ];

  useEffect(() => {
    if (
      segments.find((segment) => segment === 'info' || segment === 'view') ===
      undefined
    ) {
      handlePlotGroups(limit, offset, true);
    } else {
      setOffset(0);
    }
  }, [selectedSort, search, segments]);

  useEffect(() => {
    if (!isLoading && !loadingPlots) {
      handlePlotGroups(limit, offset, false);
    }
  }, [offset]);

  const handlePlotGroups = async (
    limitHF: number,
    offsetHF: number,
    resetData: boolean
  ) => {
    if (isConnected && !guestAccess) {
      await fetchPlotGroups(limitHF, offsetHF, resetData);
    } else {
      await loadPlotGroups(limitHF, offsetHF, resetData);
    }
  };

  const fetchPlotGroups = async (
    limit: number,
    offset: number,
    resetData: boolean
  ) => {
    setIsLoading(true);

    try {
      const sort = selectedSort.split('_');

      const response = await makeRequest({
        url: `/api/plots/plot-groups?limit=${limit}&offset=${offset}&sort=${sort[0]}&order=${sort[1]}&query=${search}`,
        method: 'GET',
      });

      if (response.data.success) {
        const plotGroups = response.data.data.map((plotGroup: PlotGroup) => {
          return {
            title: `${plotGroup.name ?? ''}`,
            items: [] as ItemProps[],
            navigationPath:
              type === 'plot-groups' ? `view/${plotGroup.id}` : `view/new`,
            navigationParams: {
              type: 'plot-group',
              data: plotGroup,
            },
            roundTitle: true,
          } as CardProps;
        });

        const searchString = `userId == '${user?.id}' AND name CONTAINS[c] '${search}' AND synced == false`;

        const plotGroupsRealm = await realm.realmRead(
          PlotGroupSchema,
          limit,
          offset,
          sort[0],
          sort[1].toUpperCase() as 'ASC' | 'DESC',
          searchString
        );

        const plotGroupsRealmData = plotGroupsRealm.map((plotGroup: any) => ({
          data: JSON.parse(plotGroup.data) as PlotGroup,
          synced: plotGroup.synced,
        }));

        const offlineData = plotGroupsRealmData.map(
          (plotGroup: { data: PlotGroup; synced: boolean }) => {
            return {
              title: `${plotGroup.data.name ?? ''}`,
              synced: plotGroup.synced,
              items: [] as ItemProps[],
              navigationPath:
                type === 'plot-groups'
                  ? `view/${plotGroup.data.id}`
                  : `view/new`,
              navigationParams: {
                type: 'plot-group',
                data: plotGroup.data,
              },
              roundTitle: true,
            } as CardProps;
          }
        );

        setDataCount(
          response.data.data.length === 0 || offlineData.length === 0
            ? 1
            : response.data.data.length + offlineData.length
        );

        if (resetData) {
          setData([...offlineData, ...plotGroups]);
          setOffset(0);
        } else {
          setData([...data, ...offlineData, ...plotGroups]);
        }
      }
    } catch (error) {
      setError(i18n.t('plotGroups.errorFetch'));
    } finally {
      setPreventOnEndReached(true);
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const loadPlotGroups = async (
    limit: number,
    offset: number,
    resetData: boolean
  ) => {
    loadingPlots = true;
    setIsLoading(true);
    try {
      const sort = selectedSort.split('_');
      const searchString = `userId == '${guestAccess ? '0' : user?.id}' AND name CONTAINS[c] '${search}'`;

      const plotGroupsRealm = await realm.realmRead(
        PlotGroupSchema,
        limit,
        offset,
        sort[0],
        sort[1].toUpperCase() as 'ASC' | 'DESC',
        searchString
      );

      const plotGroupsRealmData = plotGroupsRealm.map((plotGroup: any) => ({
        data: JSON.parse(plotGroup.data) as PlotGroup,
        synced: plotGroup.synced,
      }));

      const offlineData = plotGroupsRealmData.map(
        (plotGroup: { data: PlotGroup; synced: boolean }) => {
          return {
            title: `${plotGroup.data.name ?? ''}`,
            synced: plotGroup.synced,
            items: [] as ItemProps[],
            navigationPath:
              type === 'plot-groups' ? `view/${plotGroup.data.id}` : `view/new`,
            navigationParams: {
              type: 'plot-group',
              data: plotGroup.data,
            },
            roundTitle: true,
          } as CardProps;
        }
      );

      setDataCount(offlineData.length === 0 ? 1 : offlineData.length);

      if (resetData) {
        setData(offlineData);
        setOffset(0);
      } else {
        setData([...data, ...offlineData]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setPreventOnEndReached(true);
      setIsRefreshing(false);
      setIsLoading(false);
      loadingPlots = false;
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    setOffset(0);
    handlePlotGroups(10, 0, true);
  };

  const onEndReached = () => {
    if (!isLoading && !preventOnEndReached) {
      setOffset((prevOffset) => prevOffset + 10);
    }
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return <ActivityIndicator style={{ margin: 20 }} />;
  };

  return (
    <SafeAreaView
      edges={['top']}
      className="flex flex-col h-full bg-Background"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="mb-3">
          <Topbar
            title={
              type === 'plot-groups'
                ? i18n.t('plotGroups.title')
                : i18n.t('plotGroups.titleNewPlot')
            }
            goBack
          />
          <SearchInput
            input={search}
            setInput={setSearch}
            selectedSort={selectedSort}
            setSelectedSort={setSelectedSort}
            sortItems={sortItems}
          />
        </View>
      </TouchableWithoutFeedback>

      <View style={{ flex: 1 }}>
        <FlashList
          data={data}
          renderItem={({ item }) => <Card {...item} />}
          estimatedItemSize={dataCount}
          keyExtractor={(_, index) => index.toString()}
          className="flex flex-col h-full"
          ListEmptyComponent={emptyComponent(
            isLoading ? i18n.t('loading') : i18n.t('plotGroups.noData')
          )}
          ListFooterComponent={renderFooter}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingBottom: Platform.OS === 'ios' ? 50 : 100,
          }}
          onMomentumScrollBegin={() => setPreventOnEndReached(false)}
        />
      </View>
      {type === 'plot-groups' && (
        <ButtonWrapper>
          <NewPlotGroupButton />
        </ButtonWrapper>
      )}
    </SafeAreaView>
  );
}
