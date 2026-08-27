import axios from 'axios'

axios.defaults.timeout = 20000
axios.defaults.baseURL = import.meta.env.VITE_API_URL
axios.defaults.headers.common['scd'] = import.meta.env.VITE_SCD

export const post = async (url, sender = {}) => {
    const headers = { 'Content-Type': 'application/json' }
    try {
        const { data } = await axios.post(url, sender, { headers })
        return { data, error: null }
    } catch (e) {
        return { data: null, error: e?.response?.data || { message: '요청 실패' } }
    }
}

export default { post }
