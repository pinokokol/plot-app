import { View, Text } from 'react-native';

export const emptyComponent = (text: string) => {
  return (
    <View className="flex flex-row items-center justify-center p-5 mt-[60%]">
      <Text className="text-[16px] font-medium">{text}</Text>
    </View>
  );
};
