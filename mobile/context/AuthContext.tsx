import { createContext, useEffect, useState } from 'react';
import { useStorageState } from './useStorageState';
import { User } from '@/types/user';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import axios from 'axios';

import { LogInResponse, RequestParams } from '@/types/auth';
import { Plot, PlotGroup } from '@/types/plot';
import { decode } from 'base-64';
import realm from '@/realm/useRealm';
import { PlotGroupSchema, PlotSchema } from '@/realm/schemas';

const instance = process.env.EXPO_PUBLIC_API_URI;

export const AuthContext = createContext<{
  logIn: (username: string, password: string) => Promise<LogInResponse>;
  logOut: () => void;
  logInGuest: () => void;
  checkAuth: () => Promise<boolean>;
  selectPlotGroup: (plotGroup: PlotGroup) => void;
  setNewPlot: (plot: Plot) => void;
  makeRequest: ({ url, method, body, headers }: RequestParams) => Promise<any>;
  accessToken: string | null;
  user: User | null;
  getConnection: Promise<NetInfoState>;
  guestAccess: boolean;
  isConnected: boolean;
  selectedPlotGroup: PlotGroup | string | null;
  newPlot: Plot | null;
}>({
  logIn: async () => ({ success: false, errorStatus: '' }),
  logOut: () => null,
  logInGuest: () => null,
  checkAuth: async () => false,
  makeRequest: async () => null,
  selectPlotGroup: () => null,
  setNewPlot: () => null,
  accessToken: null,
  user: null,
  getConnection: Promise.resolve({ isConnected: false } as NetInfoState),
  guestAccess: false,
  isConnected: false,
  selectedPlotGroup: null,
  newPlot: null,
});

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(decode(token.split('.')[1]));
    const expirationDate = new Date(payload.exp * 1000);
    const currentDate = new Date();

    return expirationDate < currentDate;
  } catch (error) {
    console.error('Error decoding token:', error);
    return false;
  }
};

export function SessionProvider(props: React.PropsWithChildren<any>) {
  const [accessToken, setAccessToken] = useStorageState<string | null>(
    'access_token',
    null
  );
  const [user, setUser] = useStorageState<User | null>('user', null);

  const [selectedPlotGroup, setSelectedPlotGroup] = useStorageState<
    PlotGroup | string | null
  >('selected_plot_group', null, 'asyncStorage');

  const [guestAccess, setGuestAccess] = useState<boolean>(false);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [newPlot, setNewPlot] = useState<Plot | null>(null);

  const checkAuth = async (): Promise<boolean> => {
    if (!(await NetInfo.fetch()).isConnected) {
      return true;
    }

    if (accessToken && !isTokenExpired(accessToken)) {
      return true;
    }

    return false;
  };

  const logIn = async (
    email: string,
    password: string
  ): Promise<LogInResponse> => {
    try {
      const responseLogin = await axios.post(
        `${instance}/api/authentication/login`,
        {
          email,
          password,
        }
      );

      const setCookieHeader = responseLogin.headers['set-cookie'];

      if (setCookieHeader && responseLogin.data.success) {
        const accessToken = setCookieHeader[0]
          .split(',')[0]
          .split(';')[0]
          .split('=')[1];

        setAccessToken(accessToken);

        const responseUserData = await axios.get(
          `${instance}/api/user/profile`
        );

        if (responseUserData.data.success) {
          setGuestAccess(false);
          const user = responseUserData.data.user as User;
          setUser(user);

          await fetchPlotGroups(user);

          return { success: true, errorStatus: '' };
        }
      }
    } catch (error: any) {
      if (error.response.data.status === 'AUTH_ERROR') {
        return { success: false, errorStatus: 'AUTH_ERROR' };
      } else {
        return { success: false, errorStatus: 'GENERIC_ERROR' };
      }
    }

    return { success: false, errorStatus: 'GENERIC_ERROR' };
  };

  const logOut = async () => {
    if (guestAccess) {
      await realm.realmDeleteAll(PlotGroupSchema, '');
      await realm.realmDeleteAll(PlotSchema, '');
    }

    setAccessToken(null);
    setUser(null);
    setSelectedPlotGroup(null);
    setNewPlot(null);
    setGuestAccess(false);

    await realm.realmDeleteAll(PlotGroupSchema, 'synced == true');
  };

  const logInGuest = async () => {
    setGuestAccess(true);
    setUser(null);
    setAccessToken(null);
    setSelectedPlotGroup(null);
    setNewPlot(null);
  };

  const makeRequest = async ({ url, method, body, headers }: RequestParams) => {
    if (isTokenExpired(accessToken ?? '')) {
      logOut();
      return;
    }

    return await axios.request({
      url: instance + url,
      method,
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
      data: body,
    });
  };

  const fetchPlotGroups = async (user: User) => {
    await realm.realmDeleteAll(PlotGroupSchema, 'synced == true');
    const plotGroupsResponse = await axios.get(
      `${instance}/api/plots/plot-groups`
    );

    const plotGroups = plotGroupsResponse.data.data as PlotGroup[];

    const plotGroupsRealm = plotGroups.map((plotGroup) => {
      return {
        id: plotGroup.id ? plotGroup.id.toString() : '',
        userId: user.id ? user.id.toString() : '',
        data: JSON.stringify(plotGroup),
        name: plotGroup.name,
        synced: true,
      };
    });

    await realm.realmWriteMultiple(PlotGroupSchema, plotGroupsRealm);
  };

  const getConnection = async () => {
    return await NetInfo.fetch();
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state?.isConnected ?? false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        logIn,
        logOut,
        logInGuest,
        guestAccess,
        checkAuth,
        makeRequest,
        accessToken,
        user,
        getConnection: getConnection(),
        isConnected,
        newPlot,
        setNewPlot,
        selectedPlotGroup,
        selectPlotGroup: setSelectedPlotGroup,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
