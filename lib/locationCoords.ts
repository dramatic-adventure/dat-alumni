// lib/locationCoords.ts
export type CoordsMap = Record<string, readonly [number, number]>;

export const LOCATION_COORDS: CoordsMap = {
  // NYC family (already present)
  "New York City": [40.7128, -74.0060],
  "Brooklyn, NYC": [40.6782, -73.9442],
  "Queens, NYC": [40.7282, -73.7949],
  "Bronx, NYC": [40.8448, -73.8648],
  "Staten Island, NYC": [40.5795, -74.1502],
  "Manhattan, NYC": [40.7831, -73.9712],

  // Add key US cities you use
  "Philadelphia, PA": [39.9526, -75.1652],
  "Boston, MA": [42.3601, -71.0589],
  "Newark, NJ": [40.7357, -74.1724],
  "Jersey City, NJ": [40.7178, -74.0431],
  "Baltimore, MD": [39.2904, -76.6122],
  "Washington, DC": [38.9072, -77.0369],

  // West Coast (examples)
  "Los Angeles, CA": [34.0522, -118.2437],
  "San Francisco, CA": [37.7749, -122.4194],
  "Oakland, CA": [37.8044, -122.2711],
  "San Jose, CA": [37.3382, -121.8863],

  // Existing intl seeds
  "Quito, Ecuador": [-0.1807, -78.4678],
  "Brno, Czechia": [49.1951, 16.6068],
  "Floreana, Galápagos, Ecuador": [-1.285, -90.450],
} as const;
