import { Zone } from '../types'
import Api from './index'

export const fetchZones = async () => {
  try {
    const response = await Api.get('/zones')
    return response
  } catch (error) {
    throw error
  }
}

export const createZone = async (zone: Zone) => {
  try {
    const response = await Api.post('/zones', zone)
    return response
  } catch (error) {
    throw error
  }
}

export const updateZone = async (zone: Zone) => {
  try {
    const response = await Api.put(`/zones/${zone._id}`, zone)
    return response
  } catch (error) {
    throw error
  }
}

export const deleteZone = async (zoneId: string) => {
  try {
    const response = await Api.delete(`/zones/${zoneId}`)
    return response
  } catch (error) {
    throw error
  }
}
