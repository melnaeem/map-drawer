import axios from 'axios'
import { getUserToken } from '../../app/utils/auth'

axios.defaults.baseURL = 'https://zones-backend-halan.herokuapp.com'

export const setupResponseInterceptor = () =>
  axios.interceptors.response.use(
    (res) => res.data,
    (error) => {
      throw error
    }
  )

export const setupRequestInterceptor = () =>
  axios.interceptors.request.use((req) => {
    const accessToken = getUserToken()
    req.headers.common.Authorization = `Bearer ${accessToken}`
    return req
  })

export default axios
