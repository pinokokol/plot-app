import Card from '@/components/common/Card';
import { ShadowButtonStyle } from '@/constants/Shadow';
import { AuthContext } from '@/context/AuthContext';
import i18n from '@/locales/i18n';
import { User } from '@/types/user';

import { useNavigation } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useContext, useEffect, useRef, useState } from 'react';
import { Text, Pressable, Alert, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { uuid } from 'expo-modules-core';
import realm from '@/realm/useRealm';
import { RequestParams } from '@/types/auth';
import { PlotGroup } from '@/types/plot';
import { PlotGroupSchema } from '@/realm/schemas';

export default function NewPlotGroup() {
  const { isConnected, guestAccess, makeRequest, user } = useContext(
    AuthContext
  ) as {
    isConnected: boolean;
    guestAccess: boolean;
    makeRequest: ({
      url,
      method,
      body,
      headers,
    }: RequestParams) => Promise<any>;
    user: User;
  };

  const navigation = useNavigation();
  const [plotGroup, setPlotGroup] = useState<PlotGroup>({} as PlotGroup);
  const [error, setError] = useState<boolean>(false);

  const updateState = (path: Array<string | number>, value: any) => {
    setPlotGroup((currentPlotGroup) => {
      const updateNestedObject = (
        object: any,
        path: Array<string | number>,
        value: any
      ): any => {
        const updatedObject = { ...object };

        const key = path[0];

        if (path.length === 1) {
          updatedObject[key] = value;
        } else {
          updatedObject[key] = updateNestedObject(
            object[key] || {},
            path.slice(1),
            value
          );
        }

        setError(false);

        return updatedObject;
      };

      return updateNestedObject(currentPlotGroup, path, value);
    });
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
    });
  }, []);

  const savePlotGroup = async () => {
    if (!plotGroup?.name) {
      setError(true);
      return;
    }

    try {
      let plotGroupId = uuid.v4();
      if (isConnected && !guestAccess) {
        const response = await makeRequest({
          url: `/api/plots/plot-groups`,
          method: 'POST',
          body: {
            name: plotGroup.name,
          },
        });

        if (response?.data?.success) {
          plotGroupId = response.data.data.id;
        } else {
          throw new Error();
        }
      }

      const plotGroupRealm = {
        id: plotGroupId.toString(),
        userId: user?.id ? user.id.toString() : guestAccess ? '0' : '',
        data: JSON.stringify({
          id: plotGroupId,
          name: plotGroup.name,
        }),
        name: plotGroup.name ? plotGroup.name : '',
        synced: isConnected && !guestAccess ? true : false,
      };

      await realm.realmWrite(PlotGroupSchema, plotGroupRealm);

      Alert.alert(
        i18n.t('plotGroups.newPlotGroupCreation.success'),
        i18n.t('plotGroups.newPlotGroupCreation.successMessage'),
        [
          {
            text: i18n.t('plotGroups.newPlotGroupCreation.ok'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        i18n.t('plotGroups.newPlotGroupCreation.error'),
        i18n.t('plotGroups.newPlotGroupCreation.errorMessage')
      );
    }
  };

  return (
    <KeyboardAwareScrollView
      extraScrollHeight={52}
      className="h-full border-t bg-White border-t-LightGray"
    >
      <Text className="text-[18px] font-medium mt-5 mx-5">
        {i18n.t('plotGroups.info.title')}
      </Text>
      <Card
        items={[
          {
            type: 'type',
            name: i18n.t('plotGroups.info.name'),
            placeholder: i18n.t('input.type'),
            value: plotGroup?.name ?? '',
            setValue: (value: string) => updateState(['name'], value),
            error: error,
          },
        ]}
      />

      <Pressable
        onPress={savePlotGroup}
        className="flex flex-row items-center justify-center h-12 mx-5 mt-5 mb-10 rounded-md bg-Blue"
        style={ShadowButtonStyle}
      >
        <Text className="text-White text-[18px] font-medium">
          {i18n.t('plotGroups.newPlotGroupCreation.savePlotGroup')}
        </Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}
