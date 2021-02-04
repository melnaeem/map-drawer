import { Feature } from "@turf/turf"

export const drawModeName = 'draw_polygon'

export const mapInitConfigs = {
  lng: 31.208853,
  lat: 30.013056,
  zoom: 12,
}

export const featureModel: Feature = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Polygon', coordinates: [0, 0] },
}
