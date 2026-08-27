import { useEffect, useState } from 'react'
import { Spin } from 'antd'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import DownloadCTA from '@/components/DownloadCTA'
import Footer from '@/components/Footer'
import { fetchConfig } from '@/api/config'
import { fetchTermList } from '@/api/term'

export default function Home() {
    const [config, setConfig] = useState(null)
    const [terms, setTerms] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        Promise.all([fetchConfig(), fetchTermList()])
            .then(([cfg, termList]) => {
                if (!mounted) return
                setConfig(cfg || null)
                setTerms(Array.isArray(termList) ? termList : [])
            })
            .finally(() => mounted && setLoading(false))
        return () => { mounted = false }
    }, [])

    const scrollToHero = () => {
        const el = document.getElementById('top')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
    }

    if (loading) {
        return (
            <div className="lp-loading">
                <Spin />
            </div>
        )
    }

    return (
        <div>
            <Header onDownloadClick={scrollToHero} />
            <Hero iosStoreUrl={config?.iosStoreUrl} aosStoreUrl={config?.aosStoreUrl} />
            <Features />
            <HowItWorks />
            <DownloadCTA iosStoreUrl={config?.iosStoreUrl} aosStoreUrl={config?.aosStoreUrl} />
            <Footer config={config} terms={terms} />
        </div>
    )
}
