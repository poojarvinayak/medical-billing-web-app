import axios from 'axios'

const baseURL = import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_BASE_URL ?? '/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

export default api
