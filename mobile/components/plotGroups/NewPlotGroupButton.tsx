import { ShadowButtonStyle } from '@/constants/Shadow';
import i18n from '@/locales/i18n';
import cn from '@/utils/cn';
import { Link } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable, View, Text } from 'react-native';

export default function NewPlotGroupButton() {
  return (
    <Link href="/(app)/(plot-groups)/new-plot-group" className="mb-5" asChild>
      <Pressable>
        {({ pressed }) => (
          <View
            className={cn(
              pressed ? 'bg-Blue' : 'bg-Blue',
              'flex flex-row m-5 p-3 items-center justify-center rounded-md'
            )}
          >
            <Plus className="text-White" />
            <View className="w-2" />
            <Text className="text-[16px] text-White font-semibold">
              {i18n.t('plotGroups.newPlotGroup')}
            </Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

export const ButtonWrapper = ({ children }: any) => {
  return (
    <View className="absolute bottom-0 w-full" style={ShadowButtonStyle}>
      {children}
    </View>
  );
};
