import * as turf from '@turf/turf'
import {
  Feature,
  FeatureCollection,
  Geometry,
  Polygon,
  Position,
  Properties,
} from '@turf/turf'
import { Zone } from '../../common/types'

export function polygonsIntersects(
  polygonX: Position[][],
  polygonY: Position[][]
) {
  return turf.intersect(turf.polygon(polygonX), turf.polygon(polygonY))
}

export function isPointInside(pointPosition: Position, polygon: Position[][]) {
  if (polygon[0].length < 4) {
    return false
  }

  const point = turf.point(pointPosition)
  // here first is lng and then lat
  const turfPolygon = turf.polygon(polygon, { name: 'poly1' })

  return turf.inside(point, turfPolygon)
}

export const validateCurrentDraw = (
  { lng, lat }: { lng: number; lat: number },
  zones: Zone[],
  currentFeatures: Feature<Geometry, Properties>[]
): boolean => {
  const drawnFeaturesIds = zones.map((zone) => zone.featureId)
  const currentFeaturesIds = currentFeatures.map((feature) => '' + feature.id)

  const currentFeatureId = currentFeaturesIds.filter(
    (id) => !drawnFeaturesIds.includes(id)
  )[0]
  const currentFeatureIndex = currentFeatures.findIndex(
    (feature) => feature.id === currentFeatureId
  )

  const currentFeature = currentFeatures[currentFeatureIndex]

  return currentFeatures.some((feature, i) => {
    // ignore current feature as it can't intersect with itself
    if (i === currentFeatureIndex) {
      return false
    }

    const featureCoordinates = (feature.geometry as Polygon).coordinates

    if (isPointInside([lng, lat], featureCoordinates)) {
      return true
    }

    const currentFeatureCoordinates = (currentFeature?.geometry as Polygon)
      .coordinates
    return (
      // if the compared points 4 or more it is a polygon
      currentFeatureCoordinates[0].length >= 4 &&
      polygonsIntersects(currentFeatureCoordinates, featureCoordinates)
    )
  })
}

export const validateZoneNewCoordinates = (
  eventZoneFeature: Feature<Geometry, Properties>,
  drawFeatures: FeatureCollection<Geometry, Properties>
) => {
  const polygonNewCoordinates = eventZoneFeature.geometry.coordinates

  return drawFeatures.features.some((feature) => {
    if (feature.id === eventZoneFeature?.id) {
      return false
    }

    return polygonsIntersects(
      polygonNewCoordinates as Position[][],
      feature.geometry.coordinates as Position[][]
    )
  })
}
