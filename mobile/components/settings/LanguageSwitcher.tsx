import i18n from '@/locales/i18n';
import cn from '@/utils/cn';
import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';

export default function LanguageSwitcher() {
  const [locales, setLocales] = useState([
    { label: i18n.t('userSettings.english'), value: 'en' },
    { label: i18n.t('userSettings.german'), value: 'de' },
    { label: i18n.t('userSettings.spanish'), value: 'es' },
  ]);

  useEffect(() => {
    const unsubscribe = i18n.onChange(() => {
      setLocales([
        { label: i18n.t('userSettings.english'), value: 'en' },
        { label: i18n.t('userSettings.german'), value: 'de' },
        { label: i18n.t('userSettings.spanish'), value: 'es' },
      ]);
    });

    return unsubscribe;
  }, []);

  return (
    <View className="pl-3 border rounded-md border-LightGray">
      {locales.map((locale, index) => (
        <Pressable
          key={index}
          className={cn(
            'flex flex-row justify-between pb-4 pr-3 mt-4 border-b border-b-LightGray',
            index === locales.length - 1 && 'border-b-0'
          )}
          onPress={() => {
            i18n.locale = locale.value;
          }}
        >
          <Text className={cn(i18n.locale !== locale.value && 'text-DarkGray')}>
            {locale.label}
          </Text>
          {i18n.locale === locale.value ? (
            <View className="flex flex-row items-center justify-center w-5 h-5 rounded-full bg-[#333333]">
              <View className="flex flex-row items-center justify-center w-4 h-4 rounded-full bg-White">
                <View className="flex flex-row items-center justify-center w-2.5 h-2.5 rounded-full bg-[#333333]" />
              </View>
            </View>
          ) : (
            <View className="flex flex-row items-center justify-center w-5 h-5 rounded-full bg-DarkGray">
              <View className="flex flex-row items-center justify-center w-4 h-4 rounded-full bg-White" />
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}
