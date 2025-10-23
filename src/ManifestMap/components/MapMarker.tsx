import { FC, useContext, useState, useMemo, useEffect } from 'react';
import { AdvancedMarker, InfoWindow, Pin, useAdvancedMarkerRef, useMap } from '@vis.gl/react-google-maps';
import { ThemeContext } from 'styled-components';
import { FaPlay, FaStop, FaFlagCheckered, FaPlus, FaMinus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { printLength } from '../../../util/formatUnits';
import { formatUTCDateToLocal } from '../../../util/dateUtils';
import Bold from '../../Bold';
import { MarkerType, MapMarkerProps } from '../types';
import { MARKER_Z_INDEXES, MAP_CONSTANTS, CONTENT_MARKER_TYPES, PLACE_MARKER_TYPES } from '../constants';
import { SmallMarker, LargeMarker, PinContainer, InfoWindowContent, InfoWindowRow } from '../styles';
import { RadiusCircle } from './RadiusCircle';

const MapMarker: FC<MapMarkerProps> = ({ point, id, activeMarkerId, setActiveMarkerId, visibilitySettings }) => {
  const theme = useContext(ThemeContext);
  const map = useMap();
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [isHovered, setIsHovered] = useState(false);
  const isActive = id === activeMarkerId;

  // Check if marker should be visible based on its type and visibility settings
  const isVisible = useMemo(() => {
    if (CONTENT_MARKER_TYPES.includes(point.markerType as MarkerType)) return visibilitySettings.showContentsPlaces;
    if (point.markerType === MarkerType.LATEST_LOCATION) return visibilitySettings.showLatestLocation;
    if (PLACE_MARKER_TYPES.includes(point.markerType as MarkerType)) return visibilitySettings.showManifestPlaces;
    if (point.markerType === MarkerType.TRACKER_PATH) return visibilitySettings.showManifestPath;
    return true;
  }, [point.markerType, visibilitySettings]);

  // When visibility changes or component unmounts, ensure we clean up hover/active states
  useEffect(() => {
    if (!isVisible) {
      setIsHovered(false);
      if (id === activeMarkerId) {
        setActiveMarkerId(null);
      }
    }
    return () => {
      if (id === activeMarkerId) {
        setActiveMarkerId(null);
      }
    };
  }, [isVisible, id, activeMarkerId, setActiveMarkerId]);

  // If not visible, don't render anything
  if (!isVisible) return null;

  const handleMarkerClick = () => {
    setActiveMarkerId(id);

    // Zoom to the marker position
    if (map) {
      if (point.radius && point.radius > 0) {
        // Create a bounds object that includes the radius
        const bounds = new google.maps.Circle({
          center: { lat: point.latitude, lng: point.longitude },
          radius: Number(point.radius),
        }).getBounds();

        // Fit the map to these bounds with some padding
        if (bounds) {
          map.fitBounds(bounds, MAP_CONSTANTS.DEFAULT_PADDING);
        }
      } else {
        // Default zoom if no radius is provided
        map.panTo({ lat: point.latitude, lng: point.longitude });
        map.setZoom(MAP_CONSTANTS.DEFAULT_ZOOM);
      }
    }
  };

  const renderMarkerElement = () => {
    switch (point.markerType) {
      case MarkerType.START_PLACE:
        return (
          <Pin background={theme.color.secondary[2]} borderColor="#fff" glyphColor="#fff">
            <PinContainer isActive={isActive} isHovered={isHovered}>
              <FaPlay size={12} />
            </PinContainer>
          </Pin>
        );

      case MarkerType.END_PLACE:
        return (
          <Pin background={theme.color.secondary[2]} borderColor="#fff" glyphColor="#fff">
            <PinContainer isActive={isActive} isHovered={isHovered}>
              <FaStop size={12} />
            </PinContainer>
          </Pin>
        );

      case MarkerType.TARGET_PLACE:
        return (
          <Pin background={theme.color.secondary[2]} borderColor="#fff" glyphColor="#fff">
            <PinContainer isActive={isActive} isHovered={isHovered}>
              <FaFlagCheckered size={12} />
            </PinContainer>
          </Pin>
        );

      case MarkerType.LATEST_LOCATION:
        return <Pin background={theme.color.success[2]} borderColor="#fff" glyphColor="#fff" />;

      case MarkerType.CONTENTS_ADDED:
        return (
          <LargeMarker isActive={isActive} isHovered={isHovered} bgColor={theme.color.success[2]}>
            {point.contentsAddedCount || <FaPlus size={14} />}
          </LargeMarker>
        );

      case MarkerType.CONTENTS_REMOVED:
        return (
          <LargeMarker isActive={isActive} isHovered={isHovered} bgColor={theme.color.danger[2]}>
            {point.contentsRemovedCount || <FaMinus size={14} />}
          </LargeMarker>
        );

      default:
        return <SmallMarker isActive={isActive} isHovered={isHovered} />;
    }
  };

  const getMarkerTitle = () => {
    switch (point.markerType) {
      case MarkerType.CONTENTS_ADDED:
        return 'Contents Added';
      case MarkerType.CONTENTS_REMOVED:
        return 'Contents Removed';
      case MarkerType.LATEST_LOCATION:
        return 'Latest Location';
      case MarkerType.START_PLACE:
        return 'Start Place';
      case MarkerType.END_PLACE:
        return 'End Place';
      case MarkerType.TARGET_PLACE:
        return 'Target Place';
      default:
        return point.timestamp ? formatUTCDateToLocal(point.timestamp) : '';
    }
  };

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        onClick={handleMarkerClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        position={{ lat: point.latitude, lng: point.longitude }}
        zIndex={MARKER_Z_INDEXES[point.markerType as MarkerType] || 1}
        title={getMarkerTitle()}
      >
        {renderMarkerElement()}
      </AdvancedMarker>

      {/* Show InfoWindow when marker is active or hovered */}
      {(isActive || isHovered) && (
        <InfoWindow
          anchor={marker}
          maxWidth={300}
          onCloseClick={() => setActiveMarkerId(null)}
          headerContent={<Bold>{getMarkerTitle()}</Bold>}
          pixelOffset={[0, -10]}
        >
          <InfoWindowContent>
            {point.placeName && (
              <InfoWindowRow>
                <Bold>Place:</Bold>{' '}
                {point.placeId ? (
                  <Link to={`/places/${point.placeId}`} title={point.placeName}>
                    {point.placeName}
                  </Link>
                ) : (
                  point.placeName
                )}
              </InfoWindowRow>
            )}
            {point.timestamp && (
              <InfoWindowRow>
                <Bold>Date:</Bold> {formatUTCDateToLocal(point.timestamp)}
              </InfoWindowRow>
            )}
            {point.markerType === MarkerType.TARGET_PLACE && point.deadline && (
              <InfoWindowRow>
                <Bold>Deadline:</Bold> {formatUTCDateToLocal(point.deadline)}
              </InfoWindowRow>
            )}
            {point.radius && (
              <InfoWindowRow>
                <Bold>{point.markerType === MarkerType.LATEST_LOCATION ? 'Accuracy' : 'Radius'}:</Bold> {printLength(Number(point.radius))}
              </InfoWindowRow>
            )}

            {/* Show contents details for added contents */}
            {point.markerType === MarkerType.CONTENTS_ADDED && point.contentsAddedCount && point.contentsAddedCount > 0 && (
              <InfoWindowRow>
                <Bold>Added Contents:</Bold> {point.contentsAddedCount}
              </InfoWindowRow>
            )}

            {/* Show contents details for removed contents */}
            {point.markerType === MarkerType.CONTENTS_REMOVED && point.contentsRemovedCount && point.contentsRemovedCount > 0 && (
              <InfoWindowRow>
                <Bold>Removed Contents:</Bold> {point.contentsRemovedCount}
              </InfoWindowRow>
            )}
          </InfoWindowContent>
        </InfoWindow>
      )}

      {/* Show RadiusCircle when marker is hovered or active and radius data exists */}
      {point.radius != null && Number(point.radius) > 0 && (
        <RadiusCircle
          center={{ lat: point.latitude, lng: point.longitude }}
          radiusInMeters={Number(point.radius)}
          visible={isHovered || isActive}
          colour={
            point.markerType === MarkerType.LATEST_LOCATION
              ? theme.color.success[2]
              : point.markerType === MarkerType.CONTENTS_ADDED
              ? theme.color.success[2]
              : point.markerType === MarkerType.CONTENTS_REMOVED
              ? theme.color.danger[2]
              : theme.color.secondary[2]
          }
          onCircleClick={() => {
            if (isActive) {
              setActiveMarkerId(null);
            }
          }}
        />
      )}
    </>
  );
};

export default MapMarker;
