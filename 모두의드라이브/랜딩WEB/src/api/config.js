import { post } from './client'

export const fetchConfig = async () => {
    const res = await post('/config')
    return res.data
}
