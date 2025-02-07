import { deleteItemAsync, setItemAsync, getItemAsync } from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useReducer, useEffect, useCallback } from 'react';

type StorageValue = string | object | number | null | boolean;
type StorageType = 'secureStore' | 'asyncStorage';

type UseStateHook<T> = [T, (value: T) => void];

function useAsyncState<T>(initialValue: T): UseStateHook<T> {
  return useReducer(
    (state: T, action: T): T => action,
    initialValue
  ) as UseStateHook<T>;
}

async function setStorageItemAsync(
  key: string,
  value: StorageValue,
  storageType: StorageType
) {
  const valueToStore = JSON.stringify(value);
  if (value === null) {
    if (storageType === 'secureStore') {
      await deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } else {
    if (storageType === 'secureStore') {
      await setItemAsync(key, valueToStore);
    } else {
      await AsyncStorage.setItem(key, valueToStore);
    }
  }
}

export function useStorageState<T extends StorageValue>(
  key: string,
  initialValue: T,
  storageType: StorageType = 'secureStore'
): UseStateHook<T> {
  const [state, setState] = useAsyncState<T>(initialValue);

  useEffect(() => {
    (async () => {
      let value: string | null = null;
      if (storageType === 'secureStore') {
        value = await getItemAsync(key);
      } else {
        value = await AsyncStorage.getItem(key);
      }
      const parsedValue = value ? JSON.parse(value) : 'none';
      setState(parsedValue);
    })();
  }, [key, storageType, initialValue]);

  const setValue = useCallback(
    async (value: T) => {
      setState(value);
      await setStorageItemAsync(key, value, storageType);
    },
    [key, storageType]
  );

  return [state, setValue];
}
