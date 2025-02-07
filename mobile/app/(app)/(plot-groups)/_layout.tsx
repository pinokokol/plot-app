import i18n from '@/locales/i18n';
import { Stack } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

export default function PlotGroupsLayout() {
  return (
    <Stack>
      <Stack.Screen name="[type]" options={{ headerShown: false }} />
      <Stack.Screen
        name="new-plot-group"
        options={{
          presentation: 'modal',
          title: i18n.t('plotGroups.newPlotGroup'),
          headerLeft: () => <LeftHeader />,
        }}
      />
      <Stack.Screen
        name="view/[type]"
        options={{
          presentation: 'modal',
          title: i18n.t('plots.title'),
          headerLeft: () => <LeftHeader />,
        }}
      />
      <Stack.Screen
        name="view/add-plot"
        options={{
          presentation: 'modal',
          title: i18n.t('plots.addPlot.newPlot'),
          headerLeft: () => <LeftHeader />,
        }}
      />
    </Stack>
  );
}

const LeftHeader = () => (
  <Pressable className="flex flex-row items-center justify-center mr-3">
    <ChevronLeft className="text-Blue" />
    <Text className="font-medium text-Blue text-[18px]">Back</Text>
  </Pressable>
);
