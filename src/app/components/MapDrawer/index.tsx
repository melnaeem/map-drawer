import React, { useCallback, useEffect, useRef, useState } from 'react'

import mapboxgl, { Layer, Map } from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'

import { Feature, Polygon, Position } from '@turf/turf'

import { MapWrapper } from './style'
import { Zone, ZoneBeingCreated, ZoneDataType } from '../../../common/types'

import * as zoneValidationUtils from '../../utils/zoneValidation'
import * as mapDrawUtils from '../../utils/mapDraw'
import * as zoneTransformUtils from '../../utils/zoneTransform'
import {  initMapAndMapDraw } from '../../utils/initMap'

import ZoneForm from '../ZoneForm'
import ZoneData from '../ZoneData'
import Modal from '../Modal'
import ValidationMessage from '../ValidationMessage'

import { drawModeName } from '../../constants/mapConfigs'


mapboxgl.accessToken =
  'pk.eyJ1IjoibWVsbmFlZW0iLCJhIjoiY2traXRzc3l0MXNqMDJvcXUyanR4dnJldSJ9.ZYKXE2cEUfzRABp-vQKFlA'
let draw: MapboxDraw
let map: Map

const zonesSavedValues = [
  {
    color: '#4BD80D',
    label: 'The green zone',
    points: [
      { lng: '31.29356788952535', lat: '30.0545901854577' },
      { lng: '31.280607455565644', lat: '30.056598840290533' },
      { lng: '31.27052234966979', lat: '30.04526959019087' },
      { lng: '31.26496481259113', lat: '30.039010070583316' },
      { lng: '31.266960376097984', lat: '30.03170984783172' },
      { lng: '31.273826831175825', lat: '30.04032813266413' },
      { lng: '31.281637423827277', lat: '30.047013637190176' },
      { lng: '31.29356788952535', lat: '30.0545901854577' },
    ],
  },
  {
    color: '#0D31E9',
    label: 'The blue area',
    points: [
      { lng: '31.16374314644071', lat: '30.032732416559284' },
      { lng: '31.163914807818543', lat: '30.026490216893833' },
      { lng: '31.186230786821994', lat: '30.023220707126313' },
      { lng: '31.168978818437836', lat: '30.037413678307985' },
      { lng: '31.16374314644071', lat: '30.032732416559284' },
    ],
  },
]

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
    const mapAndDraw = initMapAndMapDraw(map, mapContainer, draw)
    map = mapAndDraw.map
    draw = mapAndDraw.draw

    map.on('load', () => {
      const zonesWithFeatureId = mapDrawUtils.drawZonesLayers(
        map,
        draw,
        zonesSavedValues
      )
      setZones(zonesWithFeatureId)
    })
  }, [])

  const handleCreateZone = ({ label, color }: ZoneDataType) => {
    clearCreatingZone()

    const coordinates = creatingZone?.coordinates as Position[][]
    const featureId = creatingZone?.featureId as string

    mapDrawUtils.drawZoneLayer(map, coordinates, featureId, {
      label,
      color,
    })

    setZones([
      ...zones,
      {
        label: label,
        color: color,
        points: zoneTransformUtils.mapCoordinatesToPoints([...coordinates[0]]),
        featureId,
      },
    ])
  }

  const handleZoneDataSubmit = ({ label, color }: ZoneDataType) => {
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
    endUpdatingZone()
  }

  const handleZoneDelete = useCallback(
    (featureId: string) => {
      const zonesNewValue = zones.filter((zone) => zone.featureId !== featureId)
      setZones(zonesNewValue)
    },

    [zones]
  )

  const handleZoneCoordinatesUpdate = useCallback(
    (newCoordinates: Position[][], featureId: string) => {
      const zonesClone = [...zones]
      const zoneIndex = zonesClone.findIndex(
        (zone) => zone.featureId === featureId
      )

      zonesClone[zoneIndex].points = zoneTransformUtils.mapCoordinatesToPoints(newCoordinates[0])
      setZones(zonesClone)
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

        const zoneCoordinates = zoneTransformUtils.mapPointsToCoordinates(featureZone)
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

  useEffect(() => {
    setSelectedZoneIndex(-1)
  }, [zones.length])

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
            onSubmit={handleZoneDataSubmit}
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
