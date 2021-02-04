import { Map } from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'

import { drawModeName, mapInitConfigs } from '../constants/mapConfigs'
import mapboxgl from 'mapbox-gl'
import drawCustomStyles from '../constants/drawCustomStyles'

export const initMapAndMapDraw = (
  map: Map,
  mapContainer: React.RefObject<HTMLDivElement>,
  draw: MapboxDraw
): { map: Map; draw: MapboxDraw } => {
  map = new mapboxgl.Map({
    container: mapContainer.current || '',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [mapInitConfigs.lng, mapInitConfigs.lat],
    zoom: mapInitConfigs.zoom,
  })

  draw = new MapboxDraw({
    defaultMode: drawModeName,
    displayControlsDefault: false,
    controls: {
      polygon: true,
      trash: true,
    },
    styles: drawCustomStyles,
  })

  map.addControl(draw)

  return { map, draw }
}
