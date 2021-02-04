import React, { useEffect, useRef, useState } from 'react'
import './App.css'
import mapboxgl, { Layer, Map } from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import * as turf from '@turf/turf'
import { Feature, Polygon, Position } from '@turf/turf'

import Modal from 'react-modal'

import styled from 'styled-components'
import CloseIcon from './components/shared/icons/CloseIcon'
import {
  ColorPreview,
  dangerColor,
  mainColor,
  StyledButton,
} from './components/shared/style'

import ZoneForm from './components/ZoneForm'

mapboxgl.accessToken =
  'pk.eyJ1IjoibWVsbmFlZW0iLCJhIjoiY2traXRzc3l0MXNqMDJvcXUyanR4dnJldSJ9.ZYKXE2cEUfzRABp-vQKFlA'

let draw: MapboxDraw
let map: Map
const drawModeName = 'draw_polygon'

const MapWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;

  .mapboxgl-ctrl-group button.active,
  .mapboxgl-ctrl-group button.active:hover,
  .mapboxgl-ctrl-group button:hover {
    background-color: #ddd;
  }
`

function polygonsIntersects(polygonX: Position[][], polygonY: Position[][]) {
  return turf.intersect(turf.polygon(polygonX), turf.polygon(polygonY))
}

function isPointInside(pointPosition: Position, polygon: Position[][]) {
  if (polygon[0].length < 4) {
    return false
  }

  const point = turf.point(pointPosition)
  // here first is lng and then lat
  const turfPolygon = turf.polygon(polygon, { name: 'poly1' })

  return turf.inside(point, turfPolygon)
}

interface ZonePoint {
  lat: string
  lng: string
}

export interface ZoneData {
  label: string
  color: string
}
interface Zone extends ZoneData {
  points: ZonePoint[]
  featureId?: string
}

const drawPolygonLayer = (
  points: Position[][],
  id: string,
  zoneData: ZoneData
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

const ZoneDataWrapper = styled.div`
  background-color: #333;
  color: #fff;
  border-radius: 3px;
  top: 10px;
  left: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  padding: 10px;
  position: absolute;
  max-width: 400px;
  font-size: 16px;
  line-height: 1.8;

  strong {
    font-size: 14px;
  }

  .color-preview {
    display: flex;

    strong {
      margin-inline-end: 10px;
    }
  }
`
const renderZoneData = (
  zoneData: ZoneData,
  startZoneUpdate: (e: MouseEvent) => void
) => (
  <ZoneDataWrapper>
    <span>
      <strong>Name:</strong> {zoneData.label}
    </span>
    <br />
    <div className="color-preview">
      <strong>Color:</strong> <ColorPreview color={zoneData.color} /> <br />
    </div>
    <strong>Color Hex:</strong> {zoneData.color} <br />
    <StyledButton backgroundColor={mainColor} onClick={startZoneUpdate}>
      Edit zone
    </StyledButton>
  </ZoneDataWrapper>
)

const mapPolygonToZonePoint = (coordinates: Position[]): ZonePoint[] =>
  coordinates.map((coordinate) => ({
    lng: '' + coordinate[0],
    lat: '' + coordinate[1],
  }))

const mapPointsToCoordinates = (featureZone: Zone): Position[][] => [
  featureZone?.points.map((point) => [+point.lng, +point.lat]),
]

const mapInitConfigs = {
  lng: 31.208853,
  lat: 30.013056,
  zoom: 12,
}

const drawCustomStyles = [
  // ACTIVE (being drawn)
  // line stroke
  {
    id: 'gl-draw-line',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': '#D20C0C',
      'line-dasharray': [0.2, 2],
      'line-width': 2,
    },
  },
  // polygon fill
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: {
      'fill-color': '#D20C0C',
      'fill-outline-color': '#D20C0C',
      'fill-opacity': 0.1,
    },
  },
  // polygon outline stroke
  // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
  {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': '#D20C0C',
      'line-dasharray': [0.2, 2],
      'line-width': 2,
    },
  },
  // vertex point halos
  {
    id: 'gl-draw-polygon-and-line-vertex-halo-active',
    type: 'circle',
    filter: [
      'all',
      ['==', 'meta', 'vertex'],
      ['==', '$type', 'Point'],
      ['!=', 'mode', 'static'],
    ],
    paint: {
      'circle-radius': 10,
      'circle-color': '#FFF',
    },
  },
  // vertex points
  {
    id: 'gl-draw-polygon-and-line-vertex-active',
    type: 'circle',
    filter: [
      'all',
      ['==', 'meta', 'vertex'],
      ['==', '$type', 'Point'],
      ['!=', 'mode', 'static'],
    ],
    paint: {
      'circle-radius': 8,
      'circle-color': '#D20C0C',
    },
  },

  // INACTIVE (static, already drawn)
  // line stroke
  {
    id: 'gl-draw-line-static',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['==', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': '#000',
      'line-width': 3,
    },
  },
  // polygon fill
  {
    id: 'gl-draw-polygon-fill-static',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
    paint: {
      'fill-color': '#000',
      'fill-outline-color': '#000',
      'fill-opacity': 0.1,
    },
  },
  // polygon outline
  {
    id: 'gl-draw-polygon-stroke-static',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': '#000',
      'line-width': 3,
    },
  },
  // Point between two created points
  {
    id: 'gl-draw-polygon-midpoint',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
    paint: {
      'circle-radius': 5,
      'circle-color': '#f35f5f',
    },
  },
]

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

const featureModel: Feature = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Polygon', coordinates: [0, 0] },
}

const ModalCloseBtn = styled(StyledButton)`
  position: absolute;
  top: 5px;
  width: auto;
  right: 10px;
  padding: 0;
  margin: 0;
  font-size: 15px;
  background: transparent;
  color: black;
`
const renderModal = (
  content: JSX.Element | string | null,
  modalIsOpen: boolean,
  closeModal: (event: any) => void
) => (
  <Modal
    isOpen={modalIsOpen}
    onRequestClose={closeModal}
    contentLabel="Example Modal"
    style={{
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9,
      },
      content: {
        margin: '0 auto',
        height: 'max-content',
        maxHeight: '90vh',
        width: 'fit-content',
        maxWidth: '100%',
        top: '50%',
        transform: 'translate(0, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }}
  >
    {content}
    <ModalCloseBtn title="close modal" onClick={closeModal}>
      X
    </ModalCloseBtn>
  </Modal>
)

const ValidationMessageWrapper = styled.div`
  text-align: center;
  max-width: 400px;

  p {
    line-height: 1.3;
    font-size: 20px;
  }
`
const renderValidationMessage = (validationMessage: string) => (
  <ValidationMessageWrapper>
    <CloseIcon color={dangerColor} />
    <p>{validationMessage}</p>
  </ValidationMessageWrapper>
)

const mapFeaturesToZones = (features: any[]) =>
  features.map(
    ({ feature, meta }): Zone => ({
      label: meta.label,
      color: meta.color,
      points: mapPolygonToZonePoint(feature.geometry.coordinates[0]),
      featureId: feature.id,
    })
  )

const mapZoneToFeatureWithMeta = (zones: Zone[]) =>
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
    },
  }))

const drawFeatureAndAssignIds = (features: any) =>
  features.map((feature: any) => ({
    ...feature,
    feature: {
      ...feature.feature,
      id: draw.add(feature.feature)[0],
    },
  }))

const drawZonesOnMap = (zones: Zone[]): Zone[] => {
  const featuresWithMeta = mapZoneToFeatureWithMeta(zones)
  const featuresWithMetaAndIds = drawFeatureAndAssignIds(featuresWithMeta)

  featuresWithMetaAndIds.forEach(
    ({ feature, meta }: { feature: GeoJSON.Feature; meta: ZoneData }) => {
      drawPolygonLayer(
        (feature.geometry as Polygon).coordinates,
        '' + feature.id,
        meta
      )
    }
  )

  return mapFeaturesToZones(featuresWithMetaAndIds)
}

function App() {
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(-1)

  const [validationessage, setValidationMessage] = useState<string | null>(null)
  const [creatingZone, setCreatingZone] = useState<{
    featureId: string
    coordinates: Position[][]
  } | null>(null)
  const [isEditingZone, setIsEditing] = useState(false)

  const mapContainer = useRef<HTMLDivElement>(null)

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

    map.on('load', () => {
      const zonesWithFeatureId = drawZonesOnMap(zonesSavedValues)
      setZones(zonesWithFeatureId)
    })
  }, [])

  const handleCreateZone = ({ label, color }: ZoneData) => {
    clearCreatingZone()

    const coordinates = creatingZone?.coordinates as Position[][]
    const featureId = creatingZone?.featureId as string
    drawPolygonLayer(coordinates, featureId, {
      label,
      color,
    })

    setZones((prevState) => [
      ...prevState,
      {
        label: label,
        color: color,
        points: mapPolygonToZonePoint([...coordinates[0]]),
        featureId,
      },
    ])
  }

  const handleZoneDataUpdate = ({ label, color }: ZoneData) => {
    const zonesClone = [...zones]
    const selectedZone = zonesClone[selectedZoneIndex]
    const featureId = '' + selectedZone.featureId

    selectedZone.label = label
    selectedZone.color = color

    setZones(zonesClone)

    map.removeLayer(featureId).removeSource(featureId)
    drawPolygonLayer(mapPointsToCoordinates(selectedZone), featureId, {
      label,
      color,
    })

    endUpdatingZone()
  }

  useEffect(() => {
    const validateCurrentDraw = (e: {
      originalEvent: MouseEvent
      lngLat: { lat: number; lng: number }
    }) => {
      // If just clicking on map not trying to draw
      if (draw.getMode() !== drawModeName) {
        return
      }

      const currentFeatures = draw.getAll().features
      // If less than two zones not itercection could happen
      if (currentFeatures.length < 2) {
        return
      }

      // find if the point being drawn inside polygon
      const {
        lngLat: { lat, lng },
      } = e

      const drawnFeaturesIds = zones.map((zone) => zone.featureId)
      const currentFeaturesIds = currentFeatures.map(
        (feature) => '' + feature.id
      )
      const currentFeatureId = currentFeaturesIds.filter(
        (id) => !drawnFeaturesIds.includes(id)
      )[0]
      const currentFeatureIndex = currentFeatures.findIndex(
        (feature) => feature.id === currentFeatureId
      )
      const currentFeature = currentFeatures[currentFeatureIndex]

      const isCurrentPointIntersect = currentFeatures.some((feature, i) => {
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

      if (isCurrentPointIntersect) {
        setValidationMessage(
          'Current zone being drawn intersects with an existing zone, please redraw valid zone.'
        )
        draw.trash()
        draw.changeMode(drawModeName)
      }
    }

    const handleCreateArea = (e: any) => {
      const featureId = e.features[0].id
      const polygonCoordinates = (e.features[0].geometry as Polygon).coordinates

      setCreatingZone({ featureId, coordinates: polygonCoordinates })
    }

    const handleZoneCoordinatesUpdate = (
      newCoordinates: any,
      featureId: string
    ) => {
      const zonesClone = [...zones]
      const zoneIndex = zonesClone.findIndex(
        (zone) => zone.featureId === featureId
      )

      zonesClone[zoneIndex].points = mapPolygonToZonePoint(newCoordinates[0])
      setZones(zonesClone)
    }

    const deleteZone = (featureId: string) => {
      const zonesNewValue = zones.filter((zone) => zone.featureId !== featureId)
      setZones(zonesNewValue)
    }

    const handleDrawUpdate = (e: any) => {
      const eventFeature = e.features[0]

      const { label, color } = (map.getLayer(eventFeature.id) as Layer).metadata

      const drawFeatures = draw.getAll()
      const polygonNewCoordinates = (eventFeature.geometry as Polygon)
        .coordinates

      const isNewCoordinatesIntersects = drawFeatures.features.some(
        (feature) => {
          if (feature.id === eventFeature.id) {
            return false
          }

          return polygonsIntersects(
            polygonNewCoordinates,
            (feature.geometry as Polygon).coordinates
          )
        }
      )

      if (isNewCoordinatesIntersects) {
        setValidationMessage("Zones can't intersect")

        const featureZone = zones.find(
          (zone) => zone.featureId === eventFeature.id
        )

        if (featureZone) {
          const currentFeature = {
            ...drawFeatures.features.find(
              (feture) => feture.id === eventFeature.id
            ),
          }

          const featurePrevCoordinates = mapPointsToCoordinates(featureZone)

          ;(currentFeature.geometry as Polygon).coordinates = featurePrevCoordinates

          draw.delete('' + currentFeature.id)
          draw.add(currentFeature)
          draw.changeMode('simple_select', {
            featureIds: [currentFeature.id],
          })

          map.removeLayer(eventFeature.id).removeSource(eventFeature.id)
          drawPolygonLayer(featurePrevCoordinates, eventFeature.id, {
            label,
            color,
          })
        }

        return false
      }

      map.removeLayer(eventFeature.id).removeSource(eventFeature.id)
      drawPolygonLayer(polygonNewCoordinates, eventFeature.id, {
        label,
        color,
      })

      handleZoneCoordinatesUpdate(polygonNewCoordinates, eventFeature.id)
    }

    const handleDeleteArea = (e: { features: Feature[] }) => {
      const id = '' + e.features[0].id

      if (map.getLayer(id)) {
        map.removeLayer(id).removeSource(id)
        deleteZone(id)
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

    map.on('click', validateCurrentDraw)
    map.on('draw.create', handleCreateArea)
    map.on('draw.delete', handleDeleteArea)
    map.on('draw.update', handleDrawUpdate)
    map.on('draw.selectionchange', handleSelectFeature)

    return () => {
      map.off('click', validateCurrentDraw)
      map.off('draw.create', handleCreateArea)
      map.off('draw.delete', handleDeleteArea)
      map.off('draw.update', handleDrawUpdate)
      map.off('draw.selectionchange', handleSelectFeature)
    }
  }, [zones])

  useEffect(() => {
    setSelectedZoneIndex(-1)
  }, [zones.length])

  const renderCurrentModal = () => {
    if (validationessage) {
      return renderModal(
        renderValidationMessage(validationessage),
        !!validationessage,
        clearValidationAlert
      )
    }

    if (creatingZone) {
      return renderModal(
        <ZoneForm onSubmit={handleCreateZone} />,
        !!creatingZone,
        clearCreatingZone
      )
    }

    if (isEditingZone) {
      const { label, color } = zones[selectedZoneIndex]

      return renderModal(
        <ZoneForm
          onSubmit={handleZoneDataUpdate}
          zoneDefaulData={{ label, color }}
        />,
        !!isEditingZone,
        endUpdatingZone
      )
    }
  }

  return (
    <MapWrapper>
      <div className="mapContainer" ref={mapContainer} />

      {selectedZoneIndex > -1 &&
        zones[selectedZoneIndex] &&
        renderZoneData(
          {
            label: zones[selectedZoneIndex].label,
            color: zones[selectedZoneIndex].color,
          },
          () => setIsEditing(true)
        )}

      {renderCurrentModal()}
    </MapWrapper>
  )
}

export default App
