import Card from '@/components/common/Card';
import { ShadowButtonStyle } from '@/constants/Shadow';
import { AuthContext } from '@/context/AuthContext';
import i18n from '@/locales/i18n';
import { router, useNavigation } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useContext, useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import realm from '@/realm/useRealm';
import { PlotSchema } from '@/realm/schemas';
import { Plot, PlotGroup } from '@/types/plot';
import { User } from '@/types/user';
import { RequestParams } from '@/types/auth';
import cn from '@/utils/cn';
import { isUUIDV4 } from '@/utils/uuid';

type PlotInfo = {
  name: string;
  description: string;
  size: string;
};

type PlotInfoErrors = {
  name: boolean;
};

export default function AddPlot() {
  const [plotInfo, setPlotInfo] = useState<PlotInfo>({} as PlotInfo);
  const [plotFieldErrors, setPlotFieldErrors] = useState<PlotInfoErrors>(
    {} as PlotInfoErrors
  );

  const {
    newPlot,
    selectedPlotGroup,
    selectPlotGroup,
    user,
    isConnected,
    guestAccess,
    makeRequest,
  } = useContext(AuthContext) as {
    newPlot: Plot;
    selectedPlotGroup: PlotGroup;
    selectPlotGroup: (plotGroup: PlotGroup) => void;
    user: User;
    isConnected: boolean;
    guestAccess: boolean;
    makeRequest: ({
      url,
      method,
      body,
      headers,
    }: RequestParams) => Promise<any>;
  };

  const [loading, setLoading] = useState<boolean>(false);

  const navigation = useNavigation();

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
  }, []);

  const updateState = (path: Array<string | number>, value: any) => {
    setPlotInfo((currentInfo) => {
      const updateNestedObject = (
        object: any,
        path: Array<string | number>,
        value: any
      ): any => {
        const updatedObject = { ...object };

        const key = path[0];

        setPlotFieldErrors((currentErrors) => {
          const updatedErrors = { ...currentErrors };

          if (key === 'name') {
            updatedErrors.name = false;
          }

          return updatedErrors;
        });

        if (path.length === 1) {
          updatedObject[key] = value;
        } else {
          updatedObject[key] = updateNestedObject(
            object[key] || {},
            path.slice(1),
            value
          );
        }

        return updatedObject;
      };

      return updateNestedObject(currentInfo, path, value);
    });
  };

  const validateFields = () => {
    const errors: PlotInfoErrors = {
      name: !plotInfo.name ? true : false,
    };

    setPlotFieldErrors(errors);

    return Object.values(errors).every((error) => !error);
  };

  const savePlot = async () => {
    if (!validateFields()) return;

    setLoading(true);

    try {
      if (isConnected && !isUUIDV4(selectedPlotGroup.id) && !guestAccess) {
        const response = await makeRequest({
          url: `/api/plots/${selectedPlotGroup.id}`,
          method: 'POST',
          body: {
            id: newPlot?.id ?? '',
            name: plotInfo.name,
            description: plotInfo.description,
            size: parseFloat(newPlot.size.split(' ')[0]),
            coordinates: newPlot.featureInfo.geometry.coordinates[0].map(
              (coordinate: number[]) => {
                return { latitude: coordinate[1], longitude: coordinate[0] };
              }
            ),
          },
        });

        selectPlotGroup({
          ...selectedPlotGroup,
          plots: [...selectedPlotGroup.plots, response.data.data],
        });

        if (!response.data.success) {
          Alert.alert(
            i18n.t('plots.addPlot.error'),
            i18n.t('plots.addPlot.errorMessage')
          );
          return;
        }
      }
      const plot: Plot = {
        id: newPlot?.id ?? '',
        name: plotInfo.name,
        description: plotInfo?.description ?? '',
        size: newPlot.size.split(' ')[0] ?? '',
        featureInfo: newPlot?.featureInfo ?? {
          type: 'Feature',
          properties: {},
          id: '',
          geometry: { type: 'Polygon', coordinates: [] },
        },
      };

      const plotRealm = {
        id: plot.id,
        plotGroupId: selectedPlotGroup?.id?.toString(),
        userId: guestAccess ? '0' : user.id.toString(),
        data: JSON.stringify(plot),
        synced:
          isConnected && !isUUIDV4(selectedPlotGroup.id) && !guestAccess
            ? true
            : false,
      };

      await realm.realmWrite(PlotSchema, plotRealm);

      router.back();
      router.replace(`view/${selectedPlotGroup?.id?.toString()}` as any);
    } catch (error) {
      console.error('Error saving plot', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{
        justifyContent: 'space-between',
        height: '100%',
      }}
      className="flex border-t bg-White border-t-LightGray"
    >
      <View>
        <Text className="text-[18px] font-medium mt-5 mx-5">
          {i18n.t('plots.addPlot.plotInformation')}
        </Text>
        <Card
          items={[
            {
              type: 'type',
              name: i18n.t('plots.addPlot.name') + '*',
              placeholder: i18n.t('input.type'),
              value: plotInfo?.name ?? '',
              setValue: (value: string) => updateState(['name'], value),
              error: plotFieldErrors?.name,
            },
            {
              type: 'type',
              name: i18n.t('plots.addPlot.description'),
              placeholder: i18n.t('input.type'),
              value: plotInfo?.description ?? '',
              setValue: (value: string) => updateState(['description'], value),
            },
            {
              type: 'view',
              name: i18n.t('plots.addPlot.size'),
              value: newPlot?.size ?? '',
            },
          ]}
        />
      </View>
      <Pressable
        className={cn(
          'flex flex-row items-center justify-center h-12 mx-5 mt-5 mb-10 rounded-md',
          loading ? 'bg-Blue/80' : 'bg-Blue'
        )}
        style={ShadowButtonStyle}
        onPress={savePlot}
        disabled={loading}
      >
        <ActivityIndicator color="white" animating={loading} className="mr-2" />
        <Text className="text-White text-[18px] font-medium">
          {i18n.t('plots.addPlot.savePlot')}
        </Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}
