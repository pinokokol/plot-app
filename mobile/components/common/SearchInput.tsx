import { Pressable, TextInput, View, Text, Keyboard } from 'react-native';
import { ArrowDownUp, LucideIcon, Search } from 'lucide-react-native';
import i18n from '@/locales/i18n';
import Colors from '@/constants/Colors';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useRef } from 'react';
import Selector from './Selector';

type SearchInputProps = {
  input: string;
  setInput: (input: string) => void;
  selectedSort: string;
  setSelectedSort: (selectedSort: string) => void;
  sortItems: { label: string; value: string; icon?: LucideIcon }[];
};

export default function SearchInput(props: SearchInputProps) {
  const bottomSheetSortModalRef = useRef<BottomSheetModal>(null);

  const snapPointsSort = useMemo(() => ['40%'], []);

  const handlePresentSortModalPress = useCallback(() => {
    Keyboard.dismiss();
    bottomSheetSortModalRef.current?.present();
  }, []);

  const setSelectedSort = (selectedSort: string) => {
    props.setSelectedSort(selectedSort);
    bottomSheetSortModalRef.current?.close();
  };

  return (
    <View className="flex flex-row items-center justify-between px-5">
      <View className="relative flex flex-row items-center justify-between h-12 mt-1 border rounded-md border-LightGray bg-White w-[85%]">
        <Search className="absolute text-LightGray left-4" />
        <TextInput
          placeholder={i18n.t('plotGroups.search')}
          value={props.input}
          onChangeText={props.setInput}
          placeholderTextColor={Colors.darkGray}
          className="text-[16px] h-12 px-2 pl-12 rounded-md w-full"
        />
      </View>
      <Pressable
        onPress={handlePresentSortModalPress}
        className="flex flex-row items-center justify-center flex-grow w-12 h-12 mt-1 ml-2 border rounded-md border-LightGray bg-White"
      >
        <ArrowDownUp className="text-LightGray" />
      </Pressable>
      <BottomSheetModal
        ref={bottomSheetSortModalRef}
        index={0}
        snapPoints={snapPointsSort}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            onPress={() => bottomSheetSortModalRef.current?.close()}
            disappearsOnIndex={-1}
          />
        )}
        enableDismissOnClose={true}
      >
        <BottomSheetView className="rounded-t-md">
          <Text className="px-5 font-medium text-[16px]">
            {i18n.t('plotGroups.sort.sortBy')}
          </Text>
          <Selector
            items={props.sortItems}
            selected={props.selectedSort}
            setSelected={setSelectedSort}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}
