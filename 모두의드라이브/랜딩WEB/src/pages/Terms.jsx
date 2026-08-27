import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import DOMPurify from 'dompurify'
import { fetchTermDetail } from '@/api/term'

export default function Terms() {
    const { idx } = useParams()
    const navigate = useNavigate()
    const [term, setTerm] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        fetchTermDetail(idx)
            .then((data) => mounted && setTerm(data || null))
            .finally(() => mounted && setLoading(false))
        return () => { mounted = false }
    }, [idx])

    const handleBack = () => {
        if (window.history.length > 1) navigate(-1)
        else navigate('/', { replace: true })
    }

    const renderHeader = (title) => (
        <header className="lp-header lp-terms-header">
            <div className="lp-container lp-terms-header-inner">
                <button
                    type="button"
                    className="lp-icon-btn"
                    onClick={handleBack}
                    aria-label="뒤로가기"
                >
                    <ArrowLeftOutlined />
                </button>
                <h1 className="lp-terms-header-title">{title}</h1>
                <span className="lp-icon-btn lp-icon-btn-spacer" aria-hidden="true" />
            </div>
        </header>
    )

    if (loading) {
        return (
            <div className="lp-loading">
                <Spin />
            </div>
        )
    }

    if (!term) {
        return (
            <div className="lp-terms">
                {renderHeader('약관')}
                <div className="lp-terms-inner">
                    <h1 className="lp-terms-title">약관을 찾을 수 없습니다.</h1>
                </div>
            </div>
        )
    }

    return (
        <div className="lp-terms">
            {renderHeader(term.title)}
            <div className="lp-terms-inner">
                <h1 className="lp-terms-title">{term.title}</h1>
                <div
                    className="lp-terms-body"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(term.comment || '') }}
                />
            </div>
        </div>
    )
}
