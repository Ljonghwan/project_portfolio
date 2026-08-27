import { useState, useEffect } from 'react'
import { Space, Radio, Select, Input } from 'antd'
import API from '@/libs/api'

// 팝업/배너 공용 "연결할 페이지" 선택 필드.
// linkType: event | notice | invite | external | none
// onChange(nextLinkType, nextLinkTarget) — 타입 변경 시 target 은 '' 로 초기화됨
export default function LinkTypeField({ linkType, linkTarget, onChange }) {
    const [eventOptions, setEventOptions] = useState([])
    const [noticeOptions, setNoticeOptions] = useState([])

    useEffect(() => {
        if (linkType === 'event' && eventOptions.length === 0) {
            API.post('/admin/content/popup/event-options').then(({ data }) => setEventOptions(data || []))
        }
        if (linkType === 'notice' && noticeOptions.length === 0) {
            API.post('/admin/content/popup/notice-options').then(({ data }) => setNoticeOptions(data || []))
        }
    }, [linkType])

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <Radio.Group
                value={linkType}
                onChange={e => onChange(e.target.value, '')}
            >
                <Radio value="event">이벤트</Radio>
                <Radio value="notice">공지사항</Radio>
                <Radio value="invite">친구초대</Radio>
                <Radio value="external">외부 URL</Radio>
                <Radio value="none">링크 없음</Radio>
            </Radio.Group>
            {linkType === 'event' && (
                <Select
                    placeholder="이벤트를 선택하세요"
                    style={{ width: 300 }}
                    value={linkTarget || undefined}
                    onChange={v => onChange('event', String(v))}
                    options={eventOptions.map(o => ({ value: String(o.idx), label: o.title }))}
                />
            )}
            {linkType === 'notice' && (
                <Select
                    placeholder="공지사항을 선택하세요"
                    style={{ width: 300 }}
                    value={linkTarget || undefined}
                    onChange={v => onChange('notice', String(v))}
                    options={noticeOptions.map(o => ({ value: String(o.idx), label: o.title }))}
                />
            )}
            {linkType === 'external' && (
                <Input
                    placeholder="https://..."
                    style={{ width: 400 }}
                    value={linkTarget}
                    onChange={e => onChange('external', e.target.value)}
                />
            )}
        </Space>
    )
}
