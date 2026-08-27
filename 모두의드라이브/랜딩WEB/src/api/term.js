import { post } from './client'

export const fetchTermList = async () => {
    const res = await post('/term')
    return res.data
}

export const fetchTermDetail = async (idx) => {
    const res = await post('/term', { idx })
    return res.data
}
