import { FC, useEffect, useMemo, useState, useCallback, useRef, useContext } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { DeckProps } from '@deck.gl/core';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { TripsLayer } from '@deck.gl/geo-layers';
import { INITIAL_VIEW_STATE } from '../../util/mapUtils';
import { MapContainer, ErrorScreen, ErrorCloseIcon } from './styles';
import { ThemeContext } from 'styled-components';
import StateContext from '../../components/StateContext';
import { IconContext } from 'react-icons';
import { BiError } from 'react-icons/bi';
import { IoMdClose } from 'react-icons/io';
import hexToRgbaArray from '../../util/hexToRgbaArray';
import { ManifestMapDto } from '../../services/manifests';
import { MapContentProps, MarkerType, ManifestMapPointDto } from './types';
import MapMarker from './components/MapMarker';
import { MapControls } from './components/MapControls';
import { MAP_CONSTANTS, CONTENT_MARKER_TYPES, PLACE_MARKER_TYPES } from './constants';
import LoadingScreen from '../LoadingScreen';

type DataType = {
  waypoints: {
    coordinates: [longitude: number, latitude: number];
    timestamp: number;
  }[];
};

function getDeckGlLayers(points: ManifestMapPointDto[], theme: any) {
  if (!points || points.length < 2) return [];

  // Filter out target places and points without timestamps, then sort remaining points by timestamp
  const sortedPoints = [...points]
    .filter((point) => {
      return point.markerType !== 'TARGET_PLACE' && point.timestamp;
    })
    .sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() / 1000 : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() / 1000 : 0;
      return aTime - bTime;
    });

  // If we have less than 2 points after filtering, don't draw any path
  if (sortedPoints.length < 2) return [];

  // Convert the points to the format expected by TripsLayer, using adjusted coordinates
  const tripData: DataType = {
    waypoints: sortedPoints.map((point) => ({
      coordinates: [
        point.adjustedLongitude !== undefined ? point.adjustedLongitude : point.longitude,
        point.adjustedLatitude !== undefined ? point.adjustedLatitude : point.latitude,
      ],
      timestamp: point.timestamp ? new Date(point.timestamp).getTime() : 0,
    })),
  };

  // Get the time range from the data
  const timestamps = tripData.waypoints.map((d) => d.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);

  return [
    new TripsLayer<DataType>({
      id: 'TripsLayer',
      data: [tripData],
      getPath: (d: DataType) => d.waypoints.map((p) => p.coordinates),
      getTimestamps: (d: DataType) => d.waypoints.map((p) => p.timestamp - minTime),
      getColor: hexToRgbaArray(theme.color.primary[2]),
      currentTime: maxTime,
      trailLength: maxTime - minTime,
      capRounded: true,
      jointRounded: true,
      fadeTrail: false,
      widthMinPixels: 4,
      widthMaxPixels: 20,
      widthScale: 1,
      widthUnits: 'pixels',
    }),
  ];
}

// Function to calculate offset for overlapping markers
const calculateMarkerOffset = (points: ManifestMapPointDto[], index: number): { lat: number; lng: number } => {
  const point = points[index];
  const OFFSET_ANGLES = MAP_CONSTANTS.OFFSET_ANGLES;
  const OFFSET_DISTANCE = MAP_CONSTANTS.OFFSET_DISTANCE;

  // Find overlapping markers that come before this one in the array
  const overlappingIndices = points.slice(0, index).reduce((acc: number[], p, i) => {
    if (Math.abs(p.latitude - point.latitude) < OFFSET_DISTANCE / 2 && Math.abs(p.longitude - point.longitude) < OFFSET_DISTANCE / 2) {
      acc.push(i);
    }
    return acc;
  }, []);

  if (overlappingIndices.length === 0) {
    return { lat: 0, lng: 0 };
  }

  // Use the count of overlapping markers to determine the offset position
  const angleIndex = overlappingIndices.length % OFFSET_ANGLES.length;
  const angle = OFFSET_ANGLES[angleIndex] * (Math.PI / 180);

  return {
    lat: Number((Math.sin(angle) * OFFSET_DISTANCE).toFixed(6)),
    lng: Number((Math.cos(angle) * OFFSET_DISTANCE).toFixed(6)),
  };
};

const MapContent: FC<MapContentProps> = ({ data, theme }): JSX.Element => {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const map = useMap();
  const deckRef = useRef<GoogleMapsOverlay | null>(null);
  const { theme: currentTheme } = useContext(StateContext);
  const [currentMapId, setCurrentMapId] = useState(
    currentTheme === 'dark' ? import.meta.env.VITE_GOOGLE_MAP_ID_DARK : import.meta.env.VITE_GOOGLE_MAP_ID_LIGHT,
  );
  const [zoomKey, setZoomKey] = useState(0);

  // Update map theme when theme changes
  useEffect(() => {
    setCurrentMapId(currentTheme === 'dark' ? import.meta.env.VITE_GOOGLE_MAP_ID_DARK : import.meta.env.VITE_GOOGLE_MAP_ID_LIGHT);
  }, [currentTheme]);

  const [visibilitySettings, setVisibilitySettings] = useState({
    showManifestPlaces: true,
    showContentsPlaces: true,
    showLatestLocation: true,
    showManifestPath: true,
  });

  // Process data and apply marker offsets when data changes
  const processedData = useMemo(() => {
    if (!data || !data.points) return null;

    // Create a deep copy of the data to avoid mutating the original
    const processedData = JSON.parse(JSON.stringify(data)) as ManifestMapDto;

    // Calculate offsets once for all points
    processedData.points = processedData.points.map((point, index) => {
      const offset = calculateMarkerOffset(data.points, index);
      return {
        ...point,
        adjustedLatitude: point.latitude + offset.lat,
        adjustedLongitude: point.longitude + offset.lng,
      } as ManifestMapPointDto;
    });

    return processedData;
  }, [data]);

  // Get all points sorted by timestamp (for path rendering)
  const allSortedPoints = useMemo(() => {
    if (!processedData || !processedData.points) return [];

    return [...processedData.points]
      .filter((point) => {
        // Exclude target places and include only points with timestamps
        if (point.markerType === 'TARGET_PLACE') return false;
        return point.timestamp;
      })
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() / 1000 : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() / 1000 : 0;
        return aTime - bTime;
      });
  }, [processedData]);

  // Listen for page zoom changes with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;

    const handleResize = () => {
      // Only trigger if the aspect ratio changes significantly
      // This helps distinguish between fullscreen and actual zoom changes
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      const lastRatio = lastWidth / lastHeight;
      const currentRatio = currentWidth / currentHeight;

      // If the ratio changed by less than 5%, it's likely a zoom change
      // If it changed by more, it's likely a fullscreen toggle
      if (Math.abs(lastRatio - currentRatio) < MAP_CONSTANTS.ZOOM_RATIO_THRESHOLD) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setZoomKey((prev) => prev + 1);
        }, MAP_CONSTANTS.ZOOM_DEBOUNCE_DELAY);
      }

      lastWidth = currentWidth;
      lastHeight = currentHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleVisibilityChange = useCallback((setting: keyof typeof visibilitySettings): void => {
    setVisibilitySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  }, []);

  // Initialize DeckGL overlay
  useEffect(() => {
    if (!map) return;

    // Always create a new overlay when the map changes
    deckRef.current?.finalize();
    deckRef.current = new GoogleMapsOverlay({} as DeckProps);
    deckRef.current.setMap(map);

    // Force update layers
    if (visibilitySettings.showManifestPath && allSortedPoints.length > 0) {
      const layers = getDeckGlLayers(allSortedPoints, theme);
      deckRef.current.setProps({ layers });
    }

    return () => {
      if (deckRef.current) {
        deckRef.current.setMap(null);
      }
    };
  }, [map]);

  // Update DeckGL layers when visibility changes, data changes, or theme changes
  useEffect(() => {
    if (!deckRef.current || !map) return;

    if (visibilitySettings.showManifestPath && allSortedPoints.length > 0) {
      const layers = getDeckGlLayers(allSortedPoints, theme);
      deckRef.current.setProps({ layers });
    } else {
      deckRef.current.setProps({ layers: [] });
    }
  }, [visibilitySettings.showManifestPath, allSortedPoints, theme]);

  // Update map center when data changes and map is available
  useEffect(() => {
    if (!map || !processedData?.points || processedData.points.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    processedData.points.forEach((point) => {
      bounds.extend(new google.maps.LatLng(point.latitude, point.longitude));
    });
    map.fitBounds(bounds, MAP_CONSTANTS.DEFAULT_PADDING);
  }, [map, processedData]);

  // The displayPoints use the adjusted offset coordinates
  const displayPoints = useMemo(() => {
    if (!processedData || !processedData.points) return [];
    return processedData.points as ManifestMapPointDto[];
  }, [processedData]);

  // Calculate visible points for MapControls
  const visiblePoints = useMemo(() => {
    if (!processedData?.points) return [];

    return processedData.points.filter((point: ManifestMapPointDto) => {
      if (CONTENT_MARKER_TYPES.includes(point.markerType as MarkerType)) return visibilitySettings.showContentsPlaces;
      if (point.markerType === MarkerType.LATEST_LOCATION) return visibilitySettings.showLatestLocation;
      if (PLACE_MARKER_TYPES.includes(point.markerType as MarkerType)) return visibilitySettings.showManifestPlaces;
      return true;
    });
  }, [processedData?.points, visibilitySettings]);

  return (
    <Map
      key={`${currentMapId}-${zoomKey}`}
      mapId={currentMapId}
      style={{ width: '100%', height: '100%' }}
      defaultCenter={{ lat: INITIAL_VIEW_STATE.latitude, lng: INITIAL_VIEW_STATE.longitude }}
      defaultZoom={INITIAL_VIEW_STATE.zoom}
      gestureHandling={'greedy'}
      onClick={() => setActiveMarkerId(null)}
    >
      <MapControls
        visibilitySettings={visibilitySettings}
        onVisibilityChange={handleVisibilityChange}
        points={visiblePoints}
        padding={MAP_CONSTANTS.DEFAULT_PADDING}
      />

      {/* Render map points with pre-calculated offset positions and visibility control */}
      {displayPoints.map((point, index) => {
        // Ensure we always have valid coordinates for latitude and longitude
        const displayLatitude = typeof point.adjustedLatitude === 'number' ? point.adjustedLatitude : point.latitude;
        const displayLongitude = typeof point.adjustedLongitude === 'number' ? point.adjustedLongitude : point.longitude;

        return (
          <MapMarker
            key={`map-marker-${index}`}
            point={{
              ...point,
              latitude: displayLatitude,
              longitude: displayLongitude,
            }}
            id={`point-${index}`}
            activeMarkerId={activeMarkerId}
            setActiveMarkerId={setActiveMarkerId}
            visibilitySettings={visibilitySettings}
          />
        );
      })}
    </Map>
  );
};

const ManifestMap: FC<{
  data: ManifestMapDto | undefined;
  dataLoading?: boolean;
  dataErr?: any;
  cursor?: any;
}> = ({ data, dataLoading, dataErr }) => {
  const theme = useContext(ThemeContext);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  // Reset error dismissed state when error changes
  useEffect(() => {
    setIsErrorDismissed(false);
  }, [dataErr]);

  return (
    <>
      <MapContainer id="map">
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_API_KEY || ''} libraries={['marker']}>
          <MapContent data={data} theme={theme} />
        </APIProvider>
        {dataLoading && <LoadingScreen loading={dataLoading} />}
        {!dataLoading && dataErr && !isErrorDismissed && (
          <ErrorScreen>
            <ErrorCloseIcon onClick={() => setIsErrorDismissed(true)} aria-label="Dismiss error">
              <IoMdClose size={24} />
            </ErrorCloseIcon>
            <div style={{ margin: '0 auto' }}>
              <IconContext.Provider value={{ color: theme.color.error[2], size: '65px' }}>
                <BiError />
              </IconContext.Provider>
            </div>
            <p style={{ color: theme.color.error[2], fontWeight: 500 }}>{dataErr}</p>
          </ErrorScreen>
        )}
      </MapContainer>
    </>
  );
};

export default ManifestMap;
