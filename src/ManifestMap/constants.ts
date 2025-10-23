import { MarkerType } from './types';

export const MARKER_Z_INDEXES = {
  [MarkerType.START_PLACE]: 6,
  [MarkerType.END_PLACE]: 5,
  [MarkerType.TARGET_PLACE]: 4,
  [MarkerType.LATEST_LOCATION]: 3,
  [MarkerType.CONTENTS_ADDED]: 3,
  [MarkerType.CONTENTS_REMOVED]: 3,
  [MarkerType.TRACKER_PATH]: 1,
};

export const MAP_CONSTANTS = {
  OFFSET_DISTANCE: 0.0001, // About 10 meters at the equator
  OFFSET_ANGLES: [0, 60, 120, 180, 240, 300], // Hexagonal pattern
  DEFAULT_PADDING: 100,
  ZOOM_RATIO_THRESHOLD: 0.05,
  ZOOM_DEBOUNCE_DELAY: 100,
  DEFAULT_ZOOM: 18,
  MARKER_SIZE: {
    SMALL: 10,
    LARGE: 36,
  },
  BORDER_WIDTH: 2,
  SHADOW: '0 2px 6px rgba(0,0,0,0.3)',
};

export const PLACE_MARKER_TYPES = [MarkerType.START_PLACE, MarkerType.END_PLACE, MarkerType.TARGET_PLACE];

export const CONTENT_MARKER_TYPES = [MarkerType.CONTENTS_ADDED, MarkerType.CONTENTS_REMOVED];
