import LoginLowerBlobSvg from '@/components/svg/LoginLowerBlob';
import LoginUpperBlobSvg from '@/components/svg/LoginUpperBlob';
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Modal from 'react-native-modalbox';
import LanguageSwitcher from '@/components/settings/LanguageSwitcher';
import { Globe, X } from 'lucide-react-native';

import i18n from '@/locales/i18n';
import { Input, InputPassword } from '@/components/common/Input';
import { useState, useContext } from 'react';

import { AuthContext } from '@/context/AuthContext';
import { router } from 'expo-router';

export default function Login() {
  const [username, setUsername] = useState<string>('pino@app.com');
  const [password, setPassword] = useState<string>('Pino9999');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [askLanguage, setAskLanguage] = useState<boolean>(false);

  const { logIn, logInGuest } = useContext(AuthContext);

  const handleLogIn = async () => {
    setIsLoading(true);

    Keyboard.dismiss();

    const logInResult = await logIn(username, password);

    if (logInResult.success) {
      router.replace('/(app)/');
    } else {
      switch (logInResult.errorStatus) {
        case 'AUTH_ERROR':
          setLoginError(i18n.t('login.authError'));
          break;
        case 'GENERIC_ERROR':
          setLoginError(i18n.t('login.genericError'));
          break;
        default:
          setLoginError(i18n.t('login.genericError'));
          break;
      }
    }

    setIsLoading(false);
  };

  const handleLogInGuest = async () => {
    setIsLoading(true);

    Keyboard.dismiss();

    try {
      logInGuest();
    } catch (error) {
      console.error('Error logging in as guest:', error);
    }

    router.replace('/(app)/');

    setIsLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex flex-col justify-between h-full bg-White">
        {askLanguage && (
          <Modal
            isOpen={askLanguage}
            onClosed={() => setAskLanguage(false)}
            position={'center'}
            backdropPressToClose={true}
            style={{
              height: 286,
              width: '90%',
              marginRight: 250,
              borderRadius: 8,
              padding: 20,
              justifyContent: 'space-between',
            }}
          >
            <View>
              <View className="flex flex-row items-center justify-between mb-2">
                <Text className="text-[18px] font-medium">
                  {i18n.t('userSettings.language')}
                </Text>
                <Pressable onPress={() => setAskLanguage(false)} className="">
                  <X size={20} className="text-black" />
                </Pressable>
              </View>

              <LanguageSwitcher />
              <Pressable
                onPress={() => setAskLanguage(false)}
                className="py-2 mt-4 rounded-md bg-Blue"
              >
                <Text className="text-center text-white">{i18n.t('ok')}</Text>
              </Pressable>
            </View>
          </Modal>
        )}

        <LoginUpperBlobSvg />
        <SafeAreaView className="px-5">
          <KeyboardAvoidingView
            behavior="position"
            keyboardVerticalOffset={300}
          >
            <View className="flex flex-row items-center justify-between">
              <View>
                <Text className="text-[24px] font-semibold">
                  {i18n.t('login.welcomeBack')}
                </Text>
                <Text className="text-[20px]">
                  {i18n.t('login.welcomeBackSubtitle')}
                </Text>
              </View>
              <Pressable onPress={() => setAskLanguage(true)}>
                <Globe size={20} className="text-black" />
              </Pressable>
            </View>

            <View className="mt-5">
              <Text>{i18n.t('login.username')}</Text>
              <Input
                placeholder={i18n.t('login.usernamePlaceholder')}
                value={username}
                onChangeText={setUsername}
              />
            </View>
            <View className="mt-3">
              <Text>{i18n.t('login.password')}</Text>
              <InputPassword
                placeholder={i18n.t('login.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                isPasswordVisible={isPasswordVisible}
                setIsPasswordVisible={setIsPasswordVisible}
              />
            </View>
            {loginError && (
              <View className="my-3">
                <Text className="text-red-500">{loginError}</Text>
              </View>
            )}
            <View className="flex flex-row items-center justify-end my-5">
              <Pressable
                onPress={() => handleLogInGuest()}
                className="px-5 py-3 mr-2 rounded-md bg-Blue"
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-White font-semibold text-[16px]">
                    {i18n.t('login.guest')}
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => handleLogIn()}
                className="px-5 py-3 rounded-md bg-Blue"
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-White font-semibold text-[16px]">
                    {i18n.t('login.login')}
                  </Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
        <View className="items-end">
          <LoginLowerBlobSvg />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
