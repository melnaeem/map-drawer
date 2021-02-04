import { Map } from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'

import { Feature, Polygon, Position } from '@turf/turf'
import { DrawZoneParam, Zone, ZoneDataType } from '../../common/types'
import { mapFeaturesToZones, mapZoneToFeatureWithMeta } from './zoneTransform'

export const drawZoneLayer = (
  map: Map,
  points: Position[][],
  id: string,
  zoneData: ZoneDataType
) => {
  const color = zoneData.color || '#000'

  map.addLayer({
    id: id,
    type: 'fill',
    source: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: points,
        },
      } as GeoJSON.Feature<GeoJSON.Geometry>,
    },
    layout: {},
    paint: {
      'fill-color': color,
      'fill-opacity': 0.7,
    },
    metadata: { label: zoneData.label, color: color },
  })
}

const drawZonesAndAssignIds = (draw: MapboxDraw, features: any) =>
  features.map((feature: any) => ({
    ...feature,
    feature: {
      ...feature.feature,
      id: draw.add(feature.feature)[0],
    },
  }))

export const drawZonesLayers = (
  map: Map,
  draw: MapboxDraw,
  zones: Zone[]
): Zone[] => {
  const featuresWithMeta = mapZoneToFeatureWithMeta(zones)
  const featuresWithMetaAndIds = drawZonesAndAssignIds(draw, featuresWithMeta)

  featuresWithMetaAndIds.forEach(
    ({ feature, meta }: { feature: GeoJSON.Feature; meta: ZoneDataType }) => {
      drawZoneLayer(
        map,
        (feature.geometry as Polygon).coordinates,
        '' + feature.id,
        meta
      )
    }
  )

  return mapFeaturesToZones(featuresWithMetaAndIds)
}

export const redrawZoneLayer = (
  map: Map,
  { featureId, coordinates, zoneData }: DrawZoneParam
) => {
  map.removeLayer(featureId).removeSource(featureId)
  drawZoneLayer(map, coordinates, featureId, zoneData)
}

export const redrawZoneFeature = (draw: MapboxDraw, feature: Feature) => {
  draw.delete('' + feature.id)
  draw.add(feature)
  draw.changeMode('simple_select', {
    featureIds: [feature.id],
  })
}
