import React, { useCallback, useEffect, useRef, useState } from 'react'

import mapboxgl, { Layer, Map } from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'

import { Feature, Polygon, Position } from '@turf/turf'

import { MapWrapper } from './style'
import { Zone, ZoneBeingCreated, ZoneDataType } from '../../../common/types'

import * as zoneValidationUtils from '../../utils/zoneValidation'
import * as mapDrawUtils from '../../utils/mapDraw'
import * as zoneTransformUtils from '../../utils/zoneTransform'
import { initMapAndMapDraw } from '../../utils/initMap'

import ZoneForm from '../ZoneForm'
import ZoneData from '../ZoneData'
import Modal from '../Modal'
import ValidationMessage from '../ValidationMessage'

import Api from '../../../common/API'

import { drawModeName } from '../../constants/mapConfigs'

mapboxgl.accessToken =
  'pk.eyJ1IjoibWVsbmFlZW0iLCJhIjoiY2traXRzc3l0MXNqMDJvcXUyanR4dnJldSJ9.ZYKXE2cEUfzRABp-vQKFlA'
let draw: MapboxDraw
let map: Map

const fetchZones = async () => {
  try {
    const response = await Api.get('/zones')
    return response
  } catch (error) {
    throw error
  }
}

const createZone = async (zone: Zone) => {
  try {
    const response = await Api.post('/zones', zone)
    return response
  } catch (error) {
    throw error
  }
}

const updateZone = async (zone: Zone) => {
  try {
    const response = await Api.put(`/zones/${zone._id}`, zone)
    return response
  } catch (error) {
    throw error
  }
}

const deleteZone = async (zoneId: string) => {
  try {
    const response = await Api.delete(`/zones/${zoneId}`)
    return response
  } catch (error) {
    throw error
  }
}

const fetchAndRenderZones = async (
  mapContainer: React.RefObject<HTMLDivElement>,
  setZones: (zones: Zone[]) => void
) => {
  const mapAndDraw = initMapAndMapDraw(map, mapContainer, draw)
  map = mapAndDraw.map
  draw = mapAndDraw.draw

  const response = await fetchZones()

  map.on('load', () => {
    const zonesWithFeatureId = mapDrawUtils.drawZonesLayers(
      map,
      draw,
      response.data
    )

    setZones(zonesWithFeatureId)
  })
}

const MapDrawer = () => {
  const mapContainer = useRef<HTMLDivElement>(null)

  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(-1)

  const [validationessage, setValidationMessage] = useState<string | null>(null)
  const [creatingZone, setCreatingZone] = useState<ZoneBeingCreated | null>(
    null
  )
  const [isEditingZone, setIsEditing] = useState(false)

  const clearValidationAlert = () => {
    setValidationMessage(null)
  }

  const clearCreatingZone = () => {
    setCreatingZone(null)
  }

  const endUpdatingZone = () => {
    setIsEditing(false)
  }

  useEffect(() => {
    fetchAndRenderZones(mapContainer, setZones)
  }, [])

  useEffect(() => {
    setSelectedZoneIndex(-1)
  }, [zones.length])

  const handleCreateZone = async ({ label, color }: ZoneDataType) => {
    clearCreatingZone()

    const coordinates = creatingZone?.coordinates as Position[][]
    const newZone = {
      label: label,
      color: color,
      points: zoneTransformUtils.mapCoordinatesToPoints([...coordinates[0]]),
    }

    await createZone(newZone)

    fetchAndRenderZones(mapContainer, setZones)
  }

  const handleZoneDataUpdate = ({ label, color }: ZoneDataType) => {
    const zonesClone = [...zones]
    const selectedZone = zonesClone[selectedZoneIndex]
    const featureId = '' + selectedZone.featureId

    selectedZone.label = label
    selectedZone.color = color
    setZones(zonesClone)

    mapDrawUtils.redrawZoneLayer(map, {
      zoneData: { label, color },
      featureId,
      coordinates: zoneTransformUtils.mapPointsToCoordinates(selectedZone),
    })

    updateZone({
      label,
      color,
      points: selectedZone.points,
      _id: selectedZone._id,
    })
    endUpdatingZone()
  }

  const handleZoneCoordinatesUpdate = useCallback(
    (newCoordinates: Position[][], featureId: string) => {
      const zonesClone = [...zones]
      const zoneIndex = zonesClone.findIndex(
        (zone) => zone.featureId === featureId
      )

      zonesClone[zoneIndex].points = zoneTransformUtils.mapCoordinatesToPoints(
        newCoordinates[0]
      )

      updateZone({
        label: zonesClone[zoneIndex].label,
        color: zonesClone[zoneIndex].color,
        points: zonesClone[zoneIndex].points,
        _id: zonesClone[zoneIndex]._id,
      })

      setZones(zonesClone)
    },
    [zones]
  )

  const handleZoneDelete = useCallback(
    (featureId: string) => {
      const deletedZone = zones.find((zone) => zone.featureId === featureId)
      const zonesNewValue = zones.filter((zone) => zone.featureId !== featureId)

      if (deletedZone && deletedZone._id) {
        deleteZone(deletedZone._id)
      }

      setZones(zonesNewValue)
    },

    [zones]
  )

  useEffect(() => {
    const handleMapClick = (e: {
      originalEvent: MouseEvent
      lngLat: { lat: number; lng: number }
    }) => {
      const currentFeatures = draw.getAll().features as any
      if (draw.getMode() !== drawModeName || currentFeatures.length < 2) {
        // If just clicking on map not trying to draw Or less than two zones dwarn no intersection could happen
        return
      }

      const isCurrentPointIntersect = zoneValidationUtils.validateCurrentDraw(
        e.lngLat,
        zones,
        currentFeatures
      )

      if (isCurrentPointIntersect) {
        setValidationMessage(
          'Current zone being drawn intersects with an existing zone, please redraw valid zone.'
        )
        draw.trash()
        draw.changeMode(drawModeName)
      }
    }

    const handleDrawCreate = (e: any) => {
      const featureId = e.features[0].id
      const polygonCoordinates = (e.features[0].geometry as Polygon).coordinates

      setCreatingZone({ featureId, coordinates: polygonCoordinates })
    }

    const handleDrawUpdate = (e: any) => {
      const eventFeature = e.features[0]
      const zoneNewCoordinates = (eventFeature.geometry as Polygon).coordinates
      const drawFeatures: any = draw.getAll()
      const isNewCoordinatesIntersects = zoneValidationUtils.validateZoneNewCoordinates(
        eventFeature,
        drawFeatures
      )
      const zoneData = (map.getLayer(eventFeature.id) as Layer).metadata

      if (isNewCoordinatesIntersects) {
        setValidationMessage("Zones can't intersect")

        const featureZone = zones.find(
          (zone) => zone.featureId === eventFeature.id
        )
        const currentFeature: any = {
          // get event from drawn features to get coordinates before update
          ...drawFeatures.features.find(
            (feature: any) => feature.id === eventFeature.id
          ),
        }

        const zoneCoordinates = zoneTransformUtils.mapPointsToCoordinates(
          featureZone
        )
        currentFeature.geometry.coordinates = zoneCoordinates

        mapDrawUtils.redrawZoneFeature(draw, currentFeature)
        mapDrawUtils.redrawZoneLayer(map, {
          featureId: eventFeature.id,
          coordinates: zoneCoordinates,
          zoneData,
        })
      } else {
        mapDrawUtils.redrawZoneLayer(map, {
          featureId: eventFeature.id,
          coordinates: zoneNewCoordinates,
          zoneData,
        })
        handleZoneCoordinatesUpdate(zoneNewCoordinates, eventFeature.id)
      }
    }

    const handleDrawDelete = (e: { features: Feature[] }) => {
      const id = '' + e.features[0].id

      if (map.getLayer(id)) {
        map.removeLayer(id).removeSource(id)
        handleZoneDelete(id)
      }
    }

    const handleSelectFeature = (e: { features: Feature[] }) => {
      if (!e.features[0]) {
        setSelectedZoneIndex(-1)
        return
      }

      const selectedFeatureId = e.features[0].id
      const selectedZoneIndex = zones.findIndex(
        ({ featureId }) => featureId === selectedFeatureId
      )

      setSelectedZoneIndex(selectedZoneIndex)
    }

    map.on('click', handleMapClick)
    map.on('draw.create', handleDrawCreate)
    map.on('draw.delete', handleDrawDelete)
    map.on('draw.update', handleDrawUpdate)
    map.on('draw.selectionchange', handleSelectFeature)

    return () => {
      map.off('click', handleMapClick)
      map.off('draw.create', handleDrawCreate)
      map.off('draw.delete', handleDrawDelete)
      map.off('draw.update', handleDrawUpdate)
      map.off('draw.selectionchange', handleSelectFeature)
    }
  }, [handleZoneCoordinatesUpdate, handleZoneDelete, zones])

  const renderCurrentModal = () => {
    if (validationessage) {
      return (
        <Modal isOpen={!!validationessage} closeModal={clearValidationAlert}>
          <ValidationMessage content={validationessage} />
        </Modal>
      )
    }

    if (creatingZone) {
      return (
        <Modal isOpen={!!creatingZone} closeModal={clearCreatingZone}>
          <ZoneForm onSubmit={handleCreateZone} />
        </Modal>
      )
    }

    if (isEditingZone) {
      const { label, color } = zones[selectedZoneIndex]

      return (
        <Modal isOpen={!!isEditingZone} closeModal={endUpdatingZone}>
          <ZoneForm
            onSubmit={handleZoneDataUpdate}
            zoneDefaulData={{ label, color }}
          />
        </Modal>
      )
    }
  }

  return (
    <MapWrapper>
      <div className="mapContainer" ref={mapContainer} />

      {selectedZoneIndex > -1 && zones[selectedZoneIndex] && (
        <ZoneData
          data={{
            label: zones[selectedZoneIndex].label,
            color: zones[selectedZoneIndex].color,
          }}
          startZoneUpdate={() => setIsEditing(true)}
        />
      )}

      {renderCurrentModal()}
    </MapWrapper>
  )
}

export default MapDrawer
