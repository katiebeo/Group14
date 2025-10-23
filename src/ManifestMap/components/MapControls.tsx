import { FC, useEffect, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { FaCog } from 'react-icons/fa';
import { VisibilitySettings } from '../types';
import { MAP_CONSTANTS } from '../constants';
import { MapControlContainer, ControlPanel, ControlButton, ZoomToFitButton } from '../styles';
import Checkbox from '../../Checkbox';

interface MapControlsProps {
  visibilitySettings: VisibilitySettings;
  onVisibilityChange: (setting: keyof VisibilitySettings) => void;
  points: Array<{ latitude: number; longitude: number }>;
  padding?: number;
}

export const MapControls: FC<MapControlsProps> = ({ visibilitySettings, onVisibilityChange, points, padding = MAP_CONSTANTS.DEFAULT_PADDING }) => {
  const [isOpen, setIsOpen] = useState(false);
  const map = useMap();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.map-control-panel') && !target.closest('.settings-button')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleZoomToFit = () => {
    if (!map || points.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((point) => {
      bounds.extend(new google.maps.LatLng(point.latitude, point.longitude));
    });
    map.fitBounds(bounds, padding);
  };

  return (
    <>
      <MapControlContainer className="map-control-panel">
        {isOpen && (
          <ControlPanel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Checkbox
                style={{ display: 'inline-block' }}
                name="showManifestPlaces"
                label="Manifest Places"
                checked={visibilitySettings.showManifestPlaces}
                onChange={() => onVisibilityChange('showManifestPlaces')}
              />
              <Checkbox
                style={{ display: 'inline-block' }}
                name="showContentsPlaces"
                label="Contents Places"
                checked={visibilitySettings.showContentsPlaces}
                onChange={() => onVisibilityChange('showContentsPlaces')}
              />
              <Checkbox
                style={{ display: 'inline-block' }}
                name="showLatestLocation"
                label="Latest Location"
                checked={visibilitySettings.showLatestLocation}
                onChange={() => onVisibilityChange('showLatestLocation')}
              />
              <Checkbox
                style={{ display: 'inline-block' }}
                name="showManifestPath"
                label="Manifest Path"
                checked={visibilitySettings.showManifestPath}
                onChange={() => onVisibilityChange('showManifestPath')}
              />
            </div>
          </ControlPanel>
        )}

        <ControlButton onClick={() => setIsOpen(!isOpen)} className="settings-button" aria-label="Toggle visibility settings" aria-expanded={isOpen}>
          <FaCog size={18} />
        </ControlButton>
      </MapControlContainer>

      <ZoomToFitButton onClick={handleZoomToFit} aria-label="Show all markers">
        Show All
      </ZoomToFitButton>
    </>
  );
};
