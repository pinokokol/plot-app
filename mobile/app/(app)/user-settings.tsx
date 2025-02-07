import {
  View,
  Text,
  Pressable,
  ScrollView,
  Linking,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AuthContext } from '@/context/AuthContext';
import { router, useNavigation } from 'expo-router';
import i18n from '@/locales/i18n';
import { Input } from '@/components/common/Input';
import LanguageSwitcher from '@/components/settings/LanguageSwitcher';
import { ChevronDown, ChevronLeft, LogOut, Map } from 'lucide-react-native';
import { CompanyInfo } from '@/types/company';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import Selector from '@/components/common/Selector';
import { FullWindowOverlay } from 'react-native-screens';

export default function UserSettings() {
  const { logOut, user, guestAccess } = useContext(AuthContext);

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

  const handleLogOut = () => {
    logOut();
    router.replace('/login');
  };

  return (
    <ScrollView className="h-full p-5 border-t bg-White border-t-LightGray">
      <Text className="text-[18px] font-medium">
        {i18n.t('userSettings.userInformation')}
      </Text>
      {guestAccess ? (
        <View>
          <Text>{i18n.t('userSettings.loggedInGuest')}</Text>
        </View>
      ) : (
        <View>
          <View className="flex flex-row items-center mx-1.5 mt-5 justify-evenly">
            <View className="w-1/2">
              <Text>{i18n.t('userSettings.name')}</Text>
              <Input
                value={user?.name || ''}
                onChangeText={() => {}}
                editable={false}
              />
            </View>
            <View className="mx-2.5" />
            <View className="w-1/2">
              <Text>{i18n.t('userSettings.surname')}</Text>
              <Input
                value={user?.surname || ''}
                onChangeText={() => {}}
                editable={false}
              />
            </View>
          </View>
          <View className="mt-3">
            <Text>{i18n.t('userSettings.username')}</Text>
            <Input
              value={user?.email || ''}
              onChangeText={() => {}}
              editable={false}
            />
          </View>
        </View>
      )}
      <Text className="text-[18px] font-medium mt-5 mb-3">
        {i18n.t('userSettings.offlineMaps')}
      </Text>
      <View className="flex flex-row items-center justify-between">
        <Pressable
          onPress={() => router.push('/map-download')}
          className="flex flex-row items-center justify-center w-full h-12 px-2 rounded-md bg-Blue"
        >
          <Map className="mr-2 text-White" size={20} />
          <Text className="text-White font-semibold text-[16px]">
            {i18n.t('userSettings.offlineMapsSettings')}
          </Text>
        </Pressable>
      </View>
      <Text className="text-[18px] font-medium mt-5 mb-3">
        {i18n.t('userSettings.language')}
      </Text>
      <LanguageSwitcher />
      <View className="flex flex-row items-center justify-between mt-5 mb-10">
        <Pressable
          onPress={() => handleLogOut()}
          className="flex flex-row items-center justify-center px-5 py-3 rounded-md bg-Blue"
        >
          <LogOut className="mr-2 text-White" size={20} />
          <Text className="text-White font-semibold text-[16px]">
            {i18n.t('userSettings.logOut')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
