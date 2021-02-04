import { Position } from '@turf/turf'
import { ZonePoint, Zone } from '../../common/types'
import { featureModel } from '../constants/mapConfigs'

export const mapCoordinatesToPoints = (coordinates: Position[]): ZonePoint[] =>
  coordinates.map((coordinate) => ({
    lng: '' + coordinate[0],
    lat: '' + coordinate[1],
  }))

export const mapPointsToCoordinates = (
  featureZone: Zone | undefined
): Position[][] =>
  featureZone
    ? [featureZone?.points.map((point) => [+point.lng, +point.lat])]
    : []

export const mapFeaturesToZones = (features: any[]) =>
  features.map(
    ({ feature, meta }): Zone => ({
      label: meta.label,
      color: meta.color,
      points: mapCoordinatesToPoints(feature.geometry.coordinates[0]),
      featureId: feature.id,
      _id: meta.id,
    })
  )

export const mapZoneToFeatureWithMeta = (zones: Zone[]) =>
  zones.map((zone) => ({
    feature: {
      ...featureModel,
      ...{
        geometry: {
          ...featureModel.geometry,
          coordinates: mapPointsToCoordinates(zone),
        },
      },
    },
    meta: {
      label: zone.label,
      color: zone.color,
      id: zone._id,
    },
  }))
