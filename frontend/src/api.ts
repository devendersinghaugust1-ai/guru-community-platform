import axios from 'axios'

// In production (Railway), frontend is served by FastAPI so API is on same origin
// In development, API is on localhost:8000
const baseURL = import.meta.env.PROD ? '/api' : 'http://localhost:8000'

const api = axios.create({ baseURL })
export default api
