import { FC, useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface RadiusCircleProps {
  center: { lat: number; lng: number };
  radiusInMeters: number;
  visible: boolean;
  colour: string;
  onCircleClick?: () => void;
}

export const RadiusCircle: FC<RadiusCircleProps> = ({ center, radiusInMeters, visible, colour, onCircleClick }) => {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    // Always clean up existing circle first
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    // Only create new circle if visible and map exists
    if (visible && map) {
      circleRef.current = new google.maps.Circle({
        center,
        radius: radiusInMeters,
        strokeColor: colour,
        strokeOpacity: 0.8,
        strokeWeight: 1,
        fillColor: colour,
        fillOpacity: 0.1,
        map,
        clickable: true,
      });

      // Add click handler
      if (onCircleClick) {
        circleRef.current.addListener('click', onCircleClick);
      }
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, center, radiusInMeters, visible, colour, onCircleClick]);

  // Additional cleanup effect for visibility changes
  useEffect(() => {
    if (!visible && circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
  }, [visible]);

  return null;
};
