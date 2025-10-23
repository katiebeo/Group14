import { ManifestMapDto, ManifestMapPointDto as OriginalManifestMapPointDto } from '../../services/manifests';

// Extend the ManifestMapPointDto to include adjusted coordinates
export interface ManifestMapPointDto extends OriginalManifestMapPointDto {
  adjustedLatitude?: number;
  adjustedLongitude?: number;
  displayLatitude?: number;
  displayLongitude?: number;
}

export enum MarkerType {
  START_PLACE = 'START_PLACE',
  END_PLACE = 'END_PLACE',
  TARGET_PLACE = 'TARGET_PLACE',
  LATEST_LOCATION = 'LATEST_LOCATION',
  CONTENTS_ADDED = 'CONTENTS_ADDED',
  CONTENTS_REMOVED = 'CONTENTS_REMOVED',
  TRACKER_PATH = 'TRACKER_PATH',
}

export interface MarkerStyles {
  background: string;
  borderColor: string;
  glyphColor: string;
  scale?: number;
}

export interface VisibilitySettings {
  showManifestPlaces: boolean;
  showContentsPlaces: boolean;
  showLatestLocation: boolean;
  showManifestPath: boolean;
}

export interface MapTheme {
  color: {
    main_bg: string[];
    panel_bg: string[];
    primary: string[];
    secondary: string[];
    success: string[];
    danger: string[];
    font: string[];
    border: string[];
  };
  fontFamily: {
    body: string;
  };
  fontSize: {
    m: string;
  };
  short_datetime: string;
}

export interface MapContentProps {
  data: ManifestMapDto | undefined;
  theme: MapTheme;
}

export interface MapMarkerProps {
  point: ManifestMapPointDto;
  id: string;
  activeMarkerId: string | null;
  setActiveMarkerId: (id: string | null) => void;
  visibilitySettings: VisibilitySettings;
}
