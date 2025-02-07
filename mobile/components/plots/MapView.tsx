import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  Switch,
} from 'react-native';
import ViewSwitcher, { ViewSwitcherProps } from './ViewSwitcher';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import {
  LocateFixed,
  MapPin,
  MapPinned,
  Navigation,
  Plus,
  Redo2,
  Undo2,
} from 'lucide-react-native';
import i18n from '@/locales/i18n';
import { Position } from '@rnmapbox/maps/lib/typescript/src/types/Position';
import Colors from '@/constants/Colors';
import MarkerSvg from '../svg/MarkerSvg';
import { CameraRef } from '@rnmapbox/maps/lib/typescript/src/components/Camera';
import cn from '@/utils/cn';
import { router, useNavigation, useSegments } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { uuid } from 'expo-modules-core';
import { FeatureInfo, Plot } from '@/types/plot';
import realm from '@/realm/useRealm';
import { PlotSchema } from '@/realm/schemas';
import { PlotGroup } from '@/types/plot';
import { User } from '@/types/user';
import Card, { CardProps } from '../common/Card';
import * as turf from '@turf/turf';
import MarkerPlotSvg from '../svg/MarkerPlotSvg';

// NEW IMPORTS FOR OPTIMISATION:
import * as Battery from 'expo-battery';
import { LightSensor, Accelerometer } from 'expo-sensors';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '');

// Some constants for sensor-based location update adjustments:
const ACCELERATION_THRESHOLD = 1.5;
const BASE_UPDATE_INTERVAL = 5000;
const RAPID_UPDATE_INTERVAL = 2000;

export default function MapView({
  viewType,
  setViewType,
  type,
  seePlot,
  setSeePlot,
}: ViewSwitcherProps) {
  // Existing state
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [addingNewPlot, setAddingNewPlot] = useState<boolean>(false);
  const [locationsForFeature, setLocationsForFeature] = useState<Position[]>(
    []
  );
  const [locationsForFeatureCache, setLocationsForFeatureCache] = useState<
    Position[]
  >([]);
  const [featureCollection, setFeatureCollection] =
    useState<GeoJSON.FeatureCollection>({
      type: 'FeatureCollection',
      features: [],
    });
  const [centroidCollection, setCentroidCollection] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const cameraRef = useRef<CameraRef>(null);
  const {
    selectedPlotGroup,
    newPlot,
    setNewPlot,
    user,
    guestAccess,
    makeRequest,
  } = useContext(AuthContext) as {
    newPlot: Plot | null;
    setNewPlot: (plot: Plot) => void;
    selectedPlotGroup: PlotGroup;
    user: User;
    guestAccess: boolean;
    makeRequest: any;
  };
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true);
  const [cardInfoCollection, setCardInfoCollection] = useState<any[]>([]);
  const [cardInfo, setCardInfo] = useState<CardProps | null>(null);
  const navigation = useNavigation();
  const segments = useSegments();

  // ─── NEW: STATES FOR SENSOR OPTIMISATION ────────────────────────────────
  const [optimisationEnabled, setOptimisationEnabled] = useState(false);
  const [optimisationPopupVisible, setOptimisationPopupVisible] =
    useState(false);

  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [batteryError, setBatteryError] = useState<string | null>(null);

  const [lightLevel, setLightLevel] = useState<number | null>(null);
  const [lightError, setLightError] = useState<string | null>(null);

  const [accelerometerData, setAccelerometerData] = useState({
    x: 0,
    y: 0,
    z: 0,
    total: 0,
  });
  const [accelerometerError, setAccelerometerError] = useState<string | null>(
    null
  );

  const [isMeasuring, setIsMeasuring] = useState(false);

  // ─── EFFECT: SET UP SENSOR SUBSCRIPTIONS WHEN OPTIMISATION IS ENABLED ───────────
  useEffect(() => {
    if (!optimisationEnabled) return;

    // Battery
    let batterySubscription: Battery.Subscription | null = null;
    (async () => {
      try {
        const initialLevel = await Battery.getBatteryLevelAsync();
        setBatteryLevel(initialLevel);
        batterySubscription = Battery.addBatteryLevelListener(
          ({ batteryLevel }) => {
            setBatteryLevel(batteryLevel);
          }
        );
      } catch (error) {
        setBatteryError(
          `Battery error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    })();
    return () => {
      batterySubscription?.remove();
    };
  }, [optimisationEnabled]);

  useEffect(() => {
    if (!optimisationEnabled) return;
    let lightSubscription: any = null;
    (async () => {
      try {
        const isAvailable = await LightSensor.isAvailableAsync();
        if (!isAvailable) {
          setLightError('Light sensor not available on this device');
          return;
        }
        LightSensor.setUpdateInterval(1000);
        lightSubscription = LightSensor.addListener((data) => {
          setLightLevel(data.illuminance);
        });
      } catch (error) {
        setLightError(
          `Light sensor error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    })();
    return () => {
      lightSubscription?.remove();
    };
  }, [optimisationEnabled]);

  useEffect(() => {
    if (!optimisationEnabled) return;
    let accelerometerSubscription: any = null;
    (async () => {
      try {
        const isAvailable = await Accelerometer.isAvailableAsync();
        if (!isAvailable) {
          setAccelerometerError('Accelerometer not available on this device');
          return;
        }
        Accelerometer.setUpdateInterval(1000);
        accelerometerSubscription = Accelerometer.addListener((data) => {
          const total = Math.sqrt(
            data.x * data.x + data.y * data.y + data.z * data.z
          );
          setAccelerometerData({ ...data, total });
        });
      } catch (error) {
        setAccelerometerError(
          `Accelerometer error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    })();
    return () => {
      accelerometerSubscription?.remove();
    };
  }, [optimisationEnabled]);

  // ─── REPLACE THE DEFAULT LOCATION WATCH WITH ONE THAT USES THE SENSOR VALUES WHEN OPTIMISATION IS ENABLED ───────────────────────────
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      if (optimisationEnabled) {
        // Compute an effective accuracy based on battery and light sensor values.
        const effectiveAccuracy = computeEffectiveAccuracy(
          batteryLevel,
          lightLevel
        );
        let updateInterval: number;
        let distanceInterval: number;
        if (batteryLevel !== null && batteryLevel <= 0.2) {
          updateInterval = 10000;
          distanceInterval = 20;
        } else if (accelerometerData.total > ACCELERATION_THRESHOLD) {
          updateInterval = RAPID_UPDATE_INTERVAL;
          distanceInterval = 5;
        } else {
          updateInterval = BASE_UPDATE_INTERVAL;
          distanceInterval = 10;
        }
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: effectiveAccuracy,
            timeInterval: updateInterval,
            distanceInterval: distanceInterval,
          },
          (newLocation) => {
            setLocation(newLocation);
          }
        );
      } else {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 1,
          },
          (newLocation) => {
            setLocation(newLocation);
          }
        );
      }
    })();

    return () => {
      locationSubscription && locationSubscription.remove();
    };
    // We re-run only when the optimisation toggle changes.
  }, [optimisationEnabled]);

  // Helper function to compute an “effective” accuracy from battery and light sensor data.
  const computeEffectiveAccuracy = (
    battery: number | null,
    light: number | null
  ): Location.Accuracy => {
    let batteryAccuracy = Location.Accuracy.Balanced;
    if (battery !== null) {
      batteryAccuracy =
        battery > 0.5
          ? Location.Accuracy.High
          : battery <= 0.2
            ? Location.Accuracy.Low
            : Location.Accuracy.Balanced;
    }
    let lightAccuracy = Location.Accuracy.Balanced;
    if (light !== null) {
      lightAccuracy =
        light < 500 ? Location.Accuracy.High : Location.Accuracy.Balanced;
    }
    if (battery !== null && battery <= 0.2) {
      return Location.Accuracy.Low;
    }
    if (
      batteryAccuracy === Location.Accuracy.High ||
      lightAccuracy === Location.Accuracy.High
    ) {
      return Location.Accuracy.High;
    }
    return Location.Accuracy.Balanced;
  };

  // ─── EXISTING EFFECTS/USE-EFFECTS FOR MAP & PLOTS ─────────────────────────────
  useEffect(() => {
    if (type === 'new') {
      setAddingNewPlot(true);
    } else if (
      seePlot &&
      !addingNewPlot &&
      centroidCollection?.features &&
      centroidCollection?.features?.length > 0 &&
      !isMapLoading
    ) {
      const centroid = centroidCollection.features.find(
        (c: any) => c.properties.id.toString() === seePlot
      ) as any;
      if (centroid) {
        focusOnLocation(
          centroid.geometry.coordinates[1],
          centroid.geometry.coordinates[0]
        );
        handleSettingCardInfo(seePlot);
      }
    }
  }, [type, seePlot, centroidCollection, isMapLoading]);

  useEffect(() => {
    navigation.setOptions({
      title: addingNewPlot
        ? i18n.t('plots.addPlot.newPlot')
        : i18n.t('plots.title'),
      gestureEnabled: !addingNewPlot,
    });

    const handleBeforeRemove = (e: any) => {
      e.preventDefault();
      if ((segments as string[]).includes('add-plot')) {
        setAddingNewPlot(false);
        navigation.dispatch(e.data.action);
        return;
      }
      Alert.alert(
        i18n.t('plots.addPlot.discardChangesTitle'),
        i18n.t('plots.addPlot.discardChangesMessage'),
        [
          {
            text: i18n.t('plots.addPlot.cancel'),
            style: 'cancel',
          },
          {
            text: i18n.t('plots.addPlot.discardChangesButton'),
            onPress: () => {
              setAddingNewPlot(false);
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    };

    if (addingNewPlot) {
      navigation.addListener('beforeRemove', handleBeforeRemove);
    } else {
      navigation.removeListener('beforeRemove', handleBeforeRemove);
    }

    return () => {
      navigation.removeListener('beforeRemove', handleBeforeRemove);
    };
  }, [addingNewPlot, segments]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 1 },
        (newLocation) => {
          setLocation(newLocation);
        }
      );

      return () => {
        if (locationSubscription) {
          locationSubscription.remove();
        }
      };
    })();
  }, []);

  useEffect(() => {
    if (selectedPlotGroup) {
      loadExistingPlots();
    }
  }, [selectedPlotGroup]);

  const loadExistingPlots = async () => {
    try {
      if ((segments as string[]).includes('add-plot')) {
        return;
      }

      const offlinePlots = await realm.realmRead(
        PlotSchema,
        undefined,
        undefined,
        undefined,
        undefined,
        `plotGroupId == '${selectedPlotGroup?.id}' AND userId == '${guestAccess ? '0' : user.id}'`
      );

      let features: GeoJSON.Feature[] = [];
      let cardInfos = [];

      if (offlinePlots && offlinePlots.length !== 0) {
        for (let plot of offlinePlots) {
          const plotData = JSON.parse(plot.data as any) as Plot;

          features.push(plotData.featureInfo);
          cardInfos.push({
            id: plotData.featureInfo.id,
            name: plotData.name,
            description: plotData.description,
            size: plotData.size,
            synced: false,
          });
        }
      }

      if (selectedPlotGroup.plots && selectedPlotGroup.plots.length > 0) {
        for (let plot of selectedPlotGroup.plots as any) {
          if (
            !plot.coordinates ||
            plot.coordinates.length === 0 ||
            cardInfos.find((c) => c.id === plot.id)
          ) {
            continue;
          }

          const featureInfo = {
            type: 'Feature',
            properties: {},
            id: plot.id,
            geometry: {
              type: 'Polygon',
              coordinates: [
                plot?.coordinates.map((c: any) => [c.longitude, c.latitude]),
              ],
            },
          };

          features.push(featureInfo as any);
          cardInfos.push({
            id: plot.id,
            name: plot.name,
            description: plot.description,
            size: plot.size + ' ha',
            synced: true,
          });
        }
      }

      const centroids = features.map((feature) => {
        const centroid = turf.centroid(feature as any);
        centroid.properties = { id: feature.id };
        return centroid;
      });

      setCardInfoCollection(cardInfos);

      setFeatureCollection({
        type: 'FeatureCollection',
        features,
      });

      setCentroidCollection({
        type: 'FeatureCollection',
        features: centroids,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const addLocationToLocations = async () => {
    if (location) {
      if (!location?.coords?.accuracy || location?.coords?.accuracy > 10) {
        Alert.alert(
          i18n.t('plots.addPlot.GPSAccuracyTitle'),
          i18n.t('plots.addPlot.GPSAccuracyMessage'),
          [{ text: i18n.t('plots.addPlot.ok') }]
        );
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setLocationsForFeatureCache([]);
      setLocationsForFeature([
        ...locationsForFeature,
        [location.coords.longitude, location.coords.latitude],
      ]);
    }
  };

  useEffect(() => {
    if (locationsForFeature.length > 0) {
      addPointToFeature();
    }
  }, [locationsForFeature, segments]);

  const addPointToFeature = () => {
    if (locationsForFeature.length < 3) {
      const filteredFeatures = featureCollection.features.filter(
        (f: GeoJSON.Feature) =>
          f.id !== 'NewFeature' && f.id !== newPlot?.featureInfo.id
      ) as GeoJSON.Feature[];

      setFeatureCollection({
        type: 'FeatureCollection',
        features: filteredFeatures,
      });
      return;
    }

    let feature = featureCollection.features.find((f: GeoJSON.Feature) => {
      return f.id === 'NewFeature';
    }) as GeoJSON.Feature;

    if (!feature) {
      feature = {
        type: 'Feature',
        properties: {},
        id: 'NewFeature',
        geometry: {
          type: 'Polygon',
          coordinates: [[...locationsForFeature, locationsForFeature[0]]],
        },
      };

      setFeatureCollection({
        type: 'FeatureCollection',
        features: [...featureCollection.features, feature],
      });
      return;
    }

    (feature.geometry as GeoJSON.Polygon).coordinates = [
      [...locationsForFeature, locationsForFeature[0]],
    ];

    const filteredFeatures = featureCollection.features.filter(
      (f: GeoJSON.Feature) =>
        f.id !== 'NewFeature' && f.id !== newPlot?.featureInfo.id
    ) as GeoJSON.Feature[];

    setFeatureCollection({
      type: 'FeatureCollection',
      features: [...filteredFeatures, feature],
    });
  };

  const savePlotShape = async () => {
    if (locationsForFeature.length < 3) {
      Alert.alert(
        i18n.t('plots.addPlot.notEnoughPointsTitle'),
        i18n.t('plots.addPlot.notEnoughPointsMessage')
      );
      return;
    }

    let featureInfo = featureCollection.features.find(
      (f: GeoJSON.Feature) => f.id === 'NewFeature'
    ) as FeatureInfo;

    if (!featureInfo || featureInfo.id !== 'NewFeature') {
      return;
    }

    const id = uuid.v4();

    featureInfo.id = id;

    setNewPlot({
      id,
      name: '',
      description: '',
      size: (turf.area(featureInfo.geometry) / 10000).toFixed(2) + ' ha',
      featureInfo,
    });

    router.push('/(app)/(plot-groups)/view/add-plot');
  };

  const focusOnLocation = (lat?: number, lon?: number) => {
    if (location && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [
          lon ? lon : location.coords.longitude,
          lat ? lat : location.coords.latitude,
        ],
        zoomLevel: 16,
        animationDuration: 500,
      });
    }
  };

  const handlePolygonPress = (e: any) => {
    const cardInfoId = e.features[0].id;
    handleSettingCardInfo(cardInfoId);
  };

  const handleSettingCardInfo = (cardInfoId: string) => {
    const plot = cardInfoCollection.find((c) => c.id.toString() === cardInfoId);
    if (!plot) {
      return;
    }

    setCardInfo({
      limitScreen: true,
      canClose: true,
      onClose: () => setCardInfo(null),
      items: [
        {
          type: 'view',
          name: i18n.t('plots.addPlot.size'),
          value: plot.size,
          editable: false,
        },
        {
          type: 'view',
          name: i18n.t('plots.addPlot.description'),
          value: plot.description ? plot.description : '/',
          editable: false,
        },
      ],
      title: plot.name,
      synced: plot.synced,
    });
  };

  const undo = () => {
    if (locationsForFeature.length > 0) {
      const lastLocation = locationsForFeature[locationsForFeature.length - 1];
      setLocationsForFeature(locationsForFeature.slice(0, -1));
      setLocationsForFeatureCache([...locationsForFeatureCache, lastLocation]);
    }
  };

  const redo = () => {
    if (locationsForFeatureCache.length > 0) {
      const lastLocation =
        locationsForFeatureCache[locationsForFeatureCache.length - 1];
      setLocationsForFeatureCache(locationsForFeatureCache.slice(0, -1));
      setLocationsForFeature([...locationsForFeature, lastLocation]);
    }
  };

  const cancelNewPlot = () => {
    setAddingNewPlot(false);
    setLocationsForFeature([]);
    setLocationsForFeatureCache([]);

    const filteredFeatures = featureCollection.features.filter(
      (f: GeoJSON.Feature) =>
        f.id !== 'NewFeature' && f.id !== newPlot?.featureInfo.id
    ) as GeoJSON.Feature[];

    setFeatureCollection({
      type: 'FeatureCollection',
      features: [...filteredFeatures],
    });
  };

  const fitCameraToCentroids = () => {
    if (!centroidCollection || centroidCollection.features.length === 0) {
      return;
    }

    const coordinates = centroidCollection.features.map(
      (feature: any) => feature.geometry.coordinates
    );

    const longitudeCoordinates = coordinates.map((coord) => coord[0]);
    const latitudeCoordinates = coordinates.map((coord) => coord[1]);

    const minLongitude = Math.min(...longitudeCoordinates);
    const maxLongitude = Math.max(...longitudeCoordinates);
    const minLatitude = Math.min(...latitudeCoordinates);
    const maxLatitude = Math.max(...latitudeCoordinates);

    if (cameraRef.current) {
      cameraRef.current.fitBounds(
        [minLongitude, minLatitude],
        [maxLongitude, maxLatitude],
        [20, 20],
        1000
      );
    }
  };

  // ─── NEW: Function to measure current location for 30 seconds ─────────────────
  const handleMeasureCurrentLocation = async () => {
    let collectedData = [] as any[];
    setIsMeasuring(true);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location permission not granted');
      setIsMeasuring(false);
      return;
    }

    const startTime = Date.now();
    const measurementInterval = setInterval(async () => {
      try {
        const newLocation = await Location.getCurrentPositionAsync({
          accuracy: optimisationEnabled
            ? computeEffectiveAccuracy(batteryLevel, lightLevel)
            : Location.Accuracy.BestForNavigation,
        });

        const measurementData = {
          timestamp: Date.now(),
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
          accuracy: newLocation.coords.accuracy,
          elapsedTime: Date.now() - startTime,
        };

        collectedData.push(measurementData);
        console.log('Measurement data point:', measurementData);
      } catch (error) {
        console.error('Error getting location:', error);
      }
    }, 1000);

    // Stop after 30 seconds
    setTimeout(async () => {
      clearInterval(measurementInterval);
      setIsMeasuring(false);

      await makeRequest({
        url: `/api/data-collection`,
        method: 'POST',
        body: {
          collectedData,
          optimisationEnabled,
          batteryLevel,
          lightLevel,
        },
      });
    }, 30000);
  };

  return (
    <View className="flex-1 h-full">
      <View className="flex-1 h-full">
        {isMapLoading && (
          <View
            style={{
              height: Dimensions.get('window').height - 200,
            }}
            className="absolute flex flex-col items-center justify-center w-full"
          >
            <ActivityIndicator size="large" animating={isMapLoading} />
            <Text className="mt-2">{i18n.t('plots.mapLoading')}</Text>
          </View>
        )}
        {location && (
          <Mapbox.MapView
            onDidFinishLoadingMap={() => {
              setIsMapLoading(false);
              focusOnLocation();
            }}
            styleURL={Mapbox.StyleURL.SatelliteStreet}
            style={{
              height: Dimensions.get('window').height,
            }}
          >
            <Mapbox.Camera
              defaultSettings={{
                centerCoordinate: [
                  location.coords.longitude,
                  location.coords.latitude,
                ],
                zoomLevel: 14,
              }}
              ref={cameraRef}
            />
            <Mapbox.PointAnnotation
              coordinate={[location.coords.longitude, location.coords.latitude]}
              id="current-location"
              key={location.timestamp.toString()}
            >
              <View className="relative flex flex-row items-center justify-center w-5 h-5 bg-white rounded-full">
                <View className="w-4 h-4 bg-blue-500 rounded-full" />
              </View>
            </Mapbox.PointAnnotation>

            {locationsForFeature.length > 0 &&
              locationsForFeature.map((location, index) => (
                <Mapbox.MarkerView
                  coordinate={[location[0], location[1]]}
                  key={index}
                  id={`location-${index}`}
                >
                  <View className="relative z-10 mb-3">
                    <Text className="absolute z-20 left-[8.5px] top-[3px] text-White">
                      {index + 1}
                    </Text>
                    <MarkerSvg />
                  </View>
                </Mapbox.MarkerView>
              ))}

            {centroidCollection &&
              centroidCollection.features.map(
                (centroid: any, index: number) => (
                  <Mapbox.MarkerView
                    coordinate={[
                      centroid.geometry.coordinates[0],
                      centroid.geometry.coordinates[1],
                    ]}
                    key={index}
                    id={`centroid-${index}`}
                  >
                    <Pressable
                      className="relative z-10 mb-3"
                      onPress={() =>
                        handleSettingCardInfo(centroid.properties.id.toString())
                      }
                    >
                      <MarkerPlotSvg />
                    </Pressable>
                  </Mapbox.MarkerView>
                )
              )}

            <Mapbox.ShapeSource
              id={'some-feature'}
              shape={featureCollection}
              onPress={handlePolygonPress}
            >
              <Mapbox.LineLayer
                sourceID="some-feature"
                id="some-feature-line"
                style={{
                  lineColor: Colors.green,
                  lineWidth: 1,
                }}
              />
              <Mapbox.FillLayer
                sourceID="some-feature"
                id="some-feature-fill"
                style={{
                  fillColor: Colors.green,
                  fillOpacity: 0.5,
                }}
              />
            </Mapbox.ShapeSource>
          </Mapbox.MapView>
        )}
      </View>

      {/* Optimisation button */}
      <Pressable
        className="mt-10"
        onPress={() => setOptimisationPopupVisible(true)}
        style={styles.optimisationButton}
      >
        <Text style={styles.optimisationButtonText}>Optimisation</Text>
      </Pressable>

      {/* Optimisation popup */}
      <Modal
        visible={optimisationPopupVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOptimisationPopupVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Optimisation Settings</Text>
            <View style={styles.modalRow}>
              <Text>Battery Level: </Text>
              <Text>
                {batteryLevel !== null
                  ? `${(batteryLevel * 100).toFixed(0)}%`
                  : 'Loading...'}
              </Text>
            </View>
            <View style={styles.modalRow}>
              <Text>Light Level: </Text>
              <Text>
                {lightLevel !== null
                  ? `${lightLevel.toFixed(2)} lux`
                  : 'Loading...'}
              </Text>
            </View>
            <View style={styles.modalRow}>
              <Text>Accel (total): </Text>
              <Text>{accelerometerData.total.toFixed(2)}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text>Optimisation Enabled:</Text>
              <Switch
                value={optimisationEnabled}
                onValueChange={(value) => setOptimisationEnabled(value)}
              />
            </View>
            <Pressable
              style={styles.modalButton}
              onPress={handleMeasureCurrentLocation}
            >
              <Text style={styles.modalButtonText}>
                {isMeasuring ? 'Measuring...' : 'Measure current location'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setOptimisationPopupVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {addingNewPlot ? (
        <View
          className="flex flex-col justify-between h-full"
          pointerEvents="box-none"
        >
          {location?.coords.accuracy && (
            <View
              className="flex flex-row self-start px-3 py-2 mx-5 mt-5 rounded-md bg-White"
              style={style.shadowMedium}
            >
              {location.coords.accuracy < 10 ? (
                <View
                  className="flex flex-row items-center self-start justify-start"
                  key={location.coords.accuracy}
                >
                  <LocateFixed className="mr-2 text-Blue" size={20} />
                  <Text className="text-Blue">
                    {i18n.t('plots.addPlot.highGPSAccuracy', {
                      accuracy: Math.round(location.coords.accuracy),
                    })}
                  </Text>
                </View>
              ) : location.coords.accuracy < 30 ? (
                <View
                  className="flex flex-row items-center justify-start"
                  key={location.coords.accuracy}
                >
                  <LocateFixed className="mr-2 text-Blue" size={20} />
                  <Text className="text-Blue">
                    {i18n.t('plots.addPlot.mediumGPSAccuracy', {
                      accuracy: Math.round(location.coords.accuracy),
                    })}
                  </Text>
                </View>
              ) : (
                <View
                  className="flex flex-row items-center justify-start"
                  key={location.coords.accuracy}
                >
                  <LocateFixed className="mr-2 text-red-500" size={20} />
                  <Text className="text-red-500">
                    {i18n.t('plots.addPlot.lowGPSAccuracy', {
                      accuracy: Math.round(location.coords.accuracy),
                    })}
                  </Text>
                </View>
              )}
            </View>
          )}
          <View className="absolute bottom-0 flex flex-col w-full">
            <View className="flex flex-row items-center justify-between mx-5">
              <View className="flex flex-row items-center">
                {/* Undo */}
                <Pressable
                  className="flex flex-row items-center justify-center px-3 py-2 mr-2 rounded-md bg-White"
                  style={style.shadowMedium}
                  disabled={locationsForFeature.length === 0}
                  onPress={undo}
                >
                  <Undo2
                    className={cn(
                      'mr-2',
                      locationsForFeature.length === 0
                        ? 'text-DarkGray'
                        : 'text-black'
                    )}
                    size={20}
                  />
                  <Text
                    className={cn(
                      'font-semibold text-[16px]',
                      locationsForFeature.length === 0
                        ? 'text-DarkGray'
                        : 'text-black'
                    )}
                  >
                    {i18n.t('plots.addPlot.undo')}
                  </Text>
                </Pressable>
                {/* Redo */}
                <Pressable
                  className="flex flex-row items-center justify-center px-3 py-2 rounded-md bg-White"
                  style={style.shadowMedium}
                  disabled={locationsForFeatureCache.length === 0}
                  onPress={redo}
                >
                  <Text
                    className={cn(
                      'font-semibold text-[16px]',
                      locationsForFeatureCache.length === 0
                        ? 'text-DarkGray'
                        : 'text-black'
                    )}
                  >
                    {i18n.t('plots.addPlot.redo')}
                  </Text>
                  <Redo2
                    className={cn(
                      'ml-2',
                      locationsForFeatureCache.length === 0
                        ? 'text-DarkGray'
                        : 'text-black'
                    )}
                    size={20}
                  />
                </Pressable>
              </View>
              {/* Location button */}
              <View className="flex flex-row items-center self-end">
                <Pressable
                  className="flex flex-row items-center justify-center w-16 h-16 mb-5 mr-2 border-2 border-blue-500 rounded-full bg-White"
                  onPress={() => fitCameraToCentroids()}
                  style={style.shadowMedium}
                >
                  <MapPinned className="text-blue-500" size={30} />
                </Pressable>
                <Pressable
                  className="flex flex-row items-center justify-center w-16 h-16 mb-5 border-2 border-blue-500 rounded-full bg-White"
                  onPress={() => focusOnLocation()}
                  style={style.shadowMedium}
                >
                  <Navigation className="text-blue-500" size={30} />
                </Pressable>
              </View>
            </View>
            <View className="w-full p-5 bg-White rounded-t-md">
              {/* Add location button */}
              <Pressable
                onPress={addLocationToLocations}
                className="flex flex-row items-center justify-center px-5 py-3 rounded-md bg-Blue"
              >
                <MapPin className="mr-2 text-White" size={20} />
                <Text className="text-White font-semibold text-[16px]">
                  {i18n.t('plots.addPlot.addCurrentLocation')}
                </Text>
              </Pressable>
              <View className="flex flex-row items-center justify-center mt-2">
                <Pressable
                  onPress={cancelNewPlot}
                  className="flex flex-row items-center justify-center flex-grow px-5 py-3 mr-2 border rounded-md bg-White border-LightGray"
                >
                  <Text className="text-black/60 font-semibold text-[16px]">
                    {i18n.t('plots.addPlot.cancel')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={savePlotShape}
                  className={cn(
                    'flex flex-row items-center justify-center flex-grow px-5 py-3 rounded-md bg-Blue',
                    featureCollection.features.find(
                      (f: GeoJSON.Feature) => f.id === 'NewFeature'
                    ) === undefined
                      ? 'opacity-50'
                      : ''
                  )}
                  disabled={
                    featureCollection.features.find(
                      (f: GeoJSON.Feature) => f.id === 'NewFeature'
                    ) === undefined
                  }
                >
                  <Text className="text-White font-semibold text-[16px]">
                    {i18n.t('plots.addPlot.savePlotShape')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View
          className="flex flex-col justify-between h-full p-5"
          pointerEvents="box-none"
        >
          {type === 'new' ? (
            <View />
          ) : (
            <ViewSwitcher
              viewType={viewType}
              setViewType={setViewType}
              setSeePlot={setSeePlot}
            />
          )}
          <View className="flex flex-col">
            {cardInfo && <Card {...cardInfo} />}
            {/* Location button */}
            <View className="flex flex-row items-center self-end">
              <Pressable
                className="flex flex-row items-center justify-center w-16 h-16 mb-5 mr-2 border-2 border-blue-500 rounded-full bg-White"
                onPress={() => fitCameraToCentroids()}
                style={style.shadowMedium}
              >
                <MapPinned className="text-blue-500" size={30} />
              </Pressable>
              <Pressable
                className="flex flex-row items-center justify-center w-16 h-16 mb-5 border-2 border-blue-500 rounded-full bg-White"
                onPress={() => focusOnLocation()}
                style={style.shadowMedium}
              >
                <Navigation className="text-blue-500" size={30} />
              </Pressable>
            </View>

            {/* New plot button */}
            <Pressable
              onPress={() => {
                setAddingNewPlot(true);
                setCardInfo(null);
              }}
              className="flex flex-row items-center justify-center w-full h-12 px-5 mb-10 rounded-md bg-Blue"
              style={style.shadowLarge}
            >
              <Plus className="mr-2 text-White" size={20} />
              <Text className="text-White font-semibold text-[16px]">
                {i18n.t('plots.addPlot.newPlot')}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const style = StyleSheet.create({
  shadowLarge: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.45,
    shadowRadius: 3.84,
    elevation: 8,
  },
  shadowMedium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 2,
  },
});

const styles = StyleSheet.create({
  optimisationButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: Colors.blue,
    padding: 10,
    borderRadius: 8,
    elevation: 5,
  },
  optimisationButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalButton: {
    backgroundColor: Colors.blue,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: Colors.blue,
    fontWeight: 'bold',
  },
});
