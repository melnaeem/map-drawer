import { Position } from '@turf/turf'

export interface ZonePoint {
  lat: string
  lng: string
}

export interface ZoneDataType {
  label: string
  color: string
}

export interface Zone extends ZoneDataType {
  points: ZonePoint[]
  _id?: string // id is not required as the point maybe not created yet
  featureId?: string
}

export interface ZoneDataPropTypes {
  data: ZoneDataType
  startZoneUpdate: (e: MouseEvent) => void
}

export interface ModalPropTypes {
  children: JSX.Element | string | null
  isOpen: boolean
  closeModal: (event: any) => void
}

export interface ZoneBeingCreated {
  featureId: string
  coordinates: Position[][]
}

export interface DrawZoneParam {
  featureId: string
  coordinates: Position[][]
  zoneData: ZoneDataType
}
