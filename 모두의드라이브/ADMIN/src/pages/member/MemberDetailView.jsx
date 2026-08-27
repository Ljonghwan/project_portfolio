import { useState, useEffect } from 'react'
import {
    App as AntApp,
    Card, Table, Tabs, Descriptions, Avatar, Image, Timeline, Badge,
    Typography, Button, Space, Tag, Radio, Modal, Input, Select, Spin, InputNumber,
} from 'antd'
import { UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import API from "@/libs/api"
import { STORAGE_URL } from '@/libs/consts'
import { useConfigLabelMap, useConfigSelect, useConfigColorMap } from '@/store'

const { Title, Text, Link } = Typography
const { TextArea } = Input

const getSnsLabel = (socialType) => {
    switch (socialType) {
        case 'kakao': return '카카오'
        case 'naver': return '네이버'
        case 'apple': return '애플'
        case 'google': return '구글'
        default: return ''
    }
}

export default function MemberDetailView({ data, onBack, onRefresh }) {
    const { message, modal } = AntApp.useApp()
    const idx = data?.idx
    const genderLabelMap = useConfigLabelMap('genders')
    const roleLabelMap = useConfigLabelMap('roles')
    const carTypeLabelMap = useConfigLabelMap('carTypes')
    const driveLevelLabelMap = useConfigLabelMap('driveLevels')
    const profileTagLabelMap = useConfigLabelMap('profileTags')
    const matchStatusLabelMap = useConfigLabelMap('matchStatuses')
    const matchStatusColorMap = useConfigColorMap('matchStatuses')
    const matchTypeLabelMap = useConfigLabelMap('matchTypes')
    const suspendReasonOptions = useConfigSelect('suspendReasons')

    // 게시글 탭 (본인이 작성한 매칭)
    const [matches, setMatches] = useState([])
    const [matchPage, setMatchPage] = useState(1)
    const [matchTotal, setMatchTotal] = useState(0)
    const [matchLoading, setMatchLoading] = useState(false)

    // 매칭내역 탭 (본인이 참여한 매칭)
    const [participated, setParticipated] = useState([])
    const [participatedPage, setParticipatedPage] = useState(1)
    const [participatedTotal, setParticipatedTotal] = useState(0)
    const [participatedLoading, setParticipatedLoading] = useState(false)

    // 포인트 탭 — 거래 이력
    const [pointTxs, setPointTxs] = useState([])
    const [pointTotal, setPointTotal] = useState(0)
    const [pointLoading, setPointLoading] = useState(false)

    // 선물함 탭
    const [gifts, setGifts] = useState([])
    const [giftTab, setGiftTab] = useState('received')
    const [giftPage, setGiftPage] = useState(1)
    const [giftTotal, setGiftTotal] = useState(0)

    // 이용정지
    const [statusValue, setStatusValue] = useState(data?.status || 'active')
    const [suspendModalOpen, setSuspendModalOpen] = useState(false)
    const [suspendReasonKey, setSuspendReasonKey] = useState(undefined)
    const [suspendReason, setSuspendReason] = useState('')

    // 현재 활성 탭
    const [activeTab, setActiveTab] = useState('info')

    useEffect(() => {
        setStatusValue(data?.status || 'active')
    }, [data])

    useEffect(() => {
        if (idx && activeTab === 'match') matchFunc()
    }, [activeTab, matchPage])

    useEffect(() => {
        if (idx && activeTab === 'participated') participatedFunc()
    }, [activeTab, participatedPage])

    useEffect(() => {
        if (idx && activeTab === 'point') pointFunc()
    }, [activeTab, idx])

    useEffect(() => {
        if (idx && activeTab === 'gift') giftFunc()
    }, [activeTab, giftTab, giftPage])

    const matchFunc = async () => {
        setMatchLoading(true)
        const { data: result } = await API.post('/admin/member/matches', { idx, page: matchPage, limit: 20 })
        setMatches(result?.list || [])
        setMatchTotal(result?.totalCount || 0)
        setMatchLoading(false)
    }

    const participatedFunc = async () => {
        setParticipatedLoading(true)
        try {
            const { data: result } = await API.post('/admin/member/participated-matches', { idx, page: participatedPage, limit: 20 })
            setParticipated(result?.list || [])
            setParticipatedTotal(result?.totalCount || 0)
        } finally {
            setParticipatedLoading(false)
        }
    }

    const pointFunc = async () => {
        setPointLoading(true)
        try {
            const { data: result } = await API.post('/admin/member/points', { idx, limit: 0 })
            setPointTxs(result?.list || [])
            setPointTotal(result?.totalCount || 0)
        } finally {
            setPointLoading(false)
        }
    }

    const giftFunc = async () => {
        const { data: result } = await API.post('/admin/member/gifts', { idx, type: giftTab, page: giftPage, limit: 20 })
        setGifts(result?.list || [])
        setGiftTotal(result?.totalCount || 0)
    }

    // [C125-5] 포인트 수동 지급/차감 (서버 /admin/point/manual 재사용)
    const [manualOpen, setManualOpen] = useState(false)
    const [mpPointType, setMpPointType] = useState('free')   // 'free' | 'paid'
    const [mpType, setMpType] = useState('earn')             // 'earn'(지급) | 'spend'(차감)
    const [mpAmount, setMpAmount] = useState(null)
    const [mpReason, setMpReason] = useState('')
    const [mpSaving, setMpSaving] = useState(false)

    const mpCurrentBalance = mpPointType === 'paid'
        ? (data?.paidPointBalance || 0)
        : (data?.freePointBalance || 0)
    // 차감 시 보유 잔액 초과 불가
    const mpExceeds = mpType === 'spend' && Number(mpAmount || 0) > mpCurrentBalance
    const mpValid = Number(mpAmount || 0) > 0 && mpReason.trim().length > 0 && !mpExceeds

    const openManual = () => {
        setMpPointType('free')
        setMpType('earn')
        setMpAmount(null)
        setMpReason('')
        setManualOpen(true)
    }

    const handleManualSubmit = async () => {
        if (!mpValid || mpSaving) return
        setMpSaving(true)
        try {
            const { error } = await API.post('/admin/point/manual', {
                userIdx: idx,
                type: mpType,
                amount: Number(mpAmount),
                reason: mpReason.trim(),
                pointType: mpPointType,
            })
            if (error) return
            message.success('포인트가 처리되었습니다.')
            setManualOpen(false)
            onRefresh?.()   // 상세(잔액) 갱신
            pointFunc()     // 거래 이력 갱신
        } finally {
            setMpSaving(false)
        }
    }

    const handleStatusSave = () => {
        if (statusValue === 'suspended' && data?.status !== 'suspended') {
            setSuspendReasonKey(undefined)
            setSuspendReason('')
            setSuspendModalOpen(true)
        } else if (statusValue === 'active' && data?.status !== 'active') {
            modal.confirm({
                title: '정지 해제',
                content: '정지를 해제하시겠습니까?',
                okText: '확인',
                cancelText: '취소',
                onOk: async () => {
                    await API.post('/admin/member/status', { idx, status: 'active' })
                    message.success('처리되었습니다.')
                    onRefresh()
                },
            })
        }
    }

    const handleSuspendConfirm = async () => {
        await API.post('/admin/member/status', { idx, status: 'suspended', reasonKey: suspendReasonKey, reason: suspendReason })
        message.success('이용정지 처리되었습니다.')
        setSuspendModalOpen(false)
        onRefresh()
    }

    const matchColumns = [
        {
            title: 'NO', key: 'no', width: 70, align: 'center',
            render: (_, __, i) => matchTotal - ((matchPage - 1) * 20) - i,
        },
        {
            title: '등록일', key: 'createdAt', width: 140, align: 'center',
            render: (_, m) => m.createdAt ? dayjs(m.createdAt).format('YYYY-MM-DD HH:mm') : '',
        },
        {
            title: '회원유형', dataIndex: 'authorRole', width: 90, align: 'center',
            render: (val) => roleLabelMap[val] || val || '-',
        },
        {
            title: '매칭구분', dataIndex: 'matchType', width: 100, align: 'center',
            render: (val) => matchTypeLabelMap[val] || val || '-',
        },
        {
            title: '만나는지역', key: 'meetingRegions',
            render: (_, m) => m.meetingRegions?.map(r => `${r.sido} ${r.sigungu}`).join(', ') || '-',
        },
        {
            title: '목적지', key: 'destinations',
            render: (_, m) => m.destinations?.map(d => [d.sido, d.sigungu].filter(Boolean).join(' ')).filter(Boolean).join(', ') || '-',
        },
        {
            title: '드라이브일시', key: 'driveDate', width: 180,
            render: (_, m) => {
                const date = m.driveDate ? dayjs(m.driveDate).format('YYYY-MM-DD') : ''
                const start = (m.driveStartTime || '').slice(0, 5)
                const end = (m.driveEndTime || '').slice(0, 5)
                const timeRange = (start && end) ? ` ${start}~${end}` : ''
                return `${date}${timeRange}` || '-'
            },
        },
        {
            title: '신청자', dataIndex: 'applicantCount', width: 80, align: 'center',
            render: (val) => val || 0,
        },
        {
            title: '확정자', dataIndex: 'confirmedCount', width: 80, align: 'center',
            render: (val) => val || 0,
        },
        {
            title: '상태', dataIndex: 'status', width: 120, align: 'center',
            render: (val) => <Tag color={matchStatusColorMap[val] || 'default'}>{matchStatusLabelMap[val] || val || '-'}</Tag>,
        },
    ]

    const participatedColumns = [
        {
            title: 'NO', key: 'no', width: 70, align: 'center',
            render: (_, __, i) => participatedTotal - ((participatedPage - 1) * 20) - i,
        },
        {
            title: '참여일', key: 'joinedAt', width: 140, align: 'center',
            render: (_, m) => m.joinedAt ? dayjs(m.joinedAt).format('YYYY-MM-DD HH:mm') : '',
        },
        {
            title: '작성자', key: 'author', width: 160,
            render: (_, m) => m.author?.nickname ? `${m.author.nickname}${m.author.email ? ` (${m.author.email})` : ''}` : '-',
        },
        {
            title: '작성자 유형', dataIndex: ['author', 'role'], width: 140, align: 'center',
            render: (val) => roleLabelMap[val] || val || '-',
        },
        {
            title: '매칭구분', dataIndex: 'matchType', width: 100, align: 'center',
            render: (val) => matchTypeLabelMap[val] || val || '-',
        },
        {
            title: '만나는지역', key: 'meetingRegions',
            render: (_, m) => m.meetingRegions?.map(r => `${r.sido} ${r.sigungu}`).join(', ') || '-',
        },
        {
            title: '목적지', key: 'destinations',
            render: (_, m) => m.destinations?.map(d => [d.sido, d.sigungu].filter(Boolean).join(' ')).filter(Boolean).join(', ') || '-',
        },
        {
            title: '드라이브일시', key: 'driveDate', width: 180,
            render: (_, m) => {
                const date = m.driveDate ? dayjs(m.driveDate).format('YYYY-MM-DD') : ''
                const start = (m.driveStartTime || '').slice(0, 5)
                const end = (m.driveEndTime || '').slice(0, 5)
                const timeRange = (start && end) ? ` ${start}~${end}` : ''
                return `${date}${timeRange}` || '-'
            },
        },
        {
            title: '내 참여상태', dataIndex: 'myStatus', width: 110, align: 'center',
            render: (val) => {
                const labelMap = { pending: '대기', accepted: '확정', rejected: '거절', cancelled: '취소' }
                const colorMap = { pending: 'default', accepted: 'green', rejected: 'red', cancelled: 'orange' }
                return <Tag color={colorMap[val] || 'default'}>{labelMap[val] || val || '-'}</Tag>
            },
        },
        {
            title: '매칭상태', dataIndex: 'status', width: 120, align: 'center',
            render: (val) => <Tag color={matchStatusColorMap[val] || 'default'}>{matchStatusLabelMap[val] || val || '-'}</Tag>,
        },
    ]

    const giftColumns = [
        {
            title: 'NO', key: 'no', width: 70, align: 'center',
            render: (_, __, i) => giftTotal - ((giftPage - 1) * 20) - i,
        },
        {
            title: '일자', key: 'createdAt', width: 160, align: 'center',
            render: (_, g) => g.createdAt ? dayjs(g.createdAt).format('YYYY-MM-DD HH:mm') : '',
        },
        {
            title: giftTab === 'received' ? '보낸 회원' : '받은 회원',
            key: 'other',
            render: (_, g) => `${g.otherNickname}(${g.otherEmail})`,
        },
        {
            title: '쿠폰명', dataIndex: 'couponName', key: 'couponName',
        },
    ]

    if (!data) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>

    const tabItems = [
        {
            key: 'info',
            label: '기본정보',
            children: (
                <Space orientation="vertical" size="large" style={{ display: 'flex' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Avatar
                            size={80}
                            src={data.photos?.[0]?.imageUrl ? `${STORAGE_URL}${data.photos[0].imageUrl}` : undefined}
                            icon={!data.photos?.[0]?.imageUrl && <UserOutlined />}
                        />
                        <div>
                            <Title level={4} style={{ margin: 0 }}>{data.nickname}</Title>
                            <Badge
                                count={`${roleLabelMap[data.role] || data.role}회원`}
                                style={{ backgroundColor: data.role === 'owner' ? '#1677ff' : '#52c41a', marginTop: 4 }}
                            />
                        </div>
                    </div>

                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="가입일시">{data.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') : ''}</Descriptions.Item>
                        <Descriptions.Item label="계정">
                            {data.socialType && <span style={{ marginRight: 4, color: '#888', fontSize: 12 }}>[{getSnsLabel(data.socialType)}]</span>}
                            {data.email || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="회원유형">{`${roleLabelMap[data.role] || data.role}회원`}</Descriptions.Item>
                        <Descriptions.Item label="추천인코드">{data.referralCode || '-'}</Descriptions.Item>
                        <Descriptions.Item label="이름/나이/성별">
                            {data.name}/{data.age}세/{genderLabelMap[data.gender] || data.gender}
                        </Descriptions.Item>
                        <Descriptions.Item label="휴대폰번호">{data.phone}</Descriptions.Item>
                        <Descriptions.Item label="닉네임">{data.nickname}</Descriptions.Item>
                        <Descriptions.Item label="사시는곳">{data.regionSido} {data.regionSigungu}</Descriptions.Item>
                        <Descriptions.Item label="차종">
                            {data.cars?.map(c => `${carTypeLabelMap[c.carType] || c.carType}${c.carModel ? ` (${c.carModel})` : ''}`).join(', ') || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="드라이브레벨">{driveLevelLabelMap[data.ownerProfile?.driveLevel] || data.ownerProfile?.driveLevel || '-'}</Descriptions.Item>
                        <Descriptions.Item label="선택모드">{data.driveModes?.map(key => profileTagLabelMap[key] || key).join(', ') || '-'}</Descriptions.Item>
                        <Descriptions.Item label="직업">{data.job || '-'}</Descriptions.Item>
                        <Descriptions.Item label="취미">{data.hobby || '-'}</Descriptions.Item>
                        <Descriptions.Item label="마케팅활동동의">{data.marketingAgree ? '동의' : '비동의'}</Descriptions.Item>
                        <Descriptions.Item label="소개" span={2}>{data.introduction || '-'}</Descriptions.Item>
                    </Descriptions>

                    {data.photos?.length > 0 && (
                        <Card title="사진" size="small">
                            <Image.PreviewGroup>
                                <Space wrap>
                                    {data.photos.map((photo, i) => (
                                        <Image
                                            key={i}
                                            width={120}
                                            height={120}
                                            src={photo.imageUrl ? `${STORAGE_URL}${photo.imageUrl}` : undefined}
                                            alt={`사진 ${i + 1}`}
                                            style={{ objectFit: 'cover', borderRadius: 8 }}
                                        />
                                    ))}
                                </Space>
                            </Image.PreviewGroup>
                        </Card>
                    )}

                    <Card title="활동 통계" size="small">
                        <Descriptions bordered column={5} size="small">
                            <Descriptions.Item label="매칭횟수">{(data.stats?.matchCount || 0).toLocaleString()}건</Descriptions.Item>
                            <Descriptions.Item label="참여횟수">{(data.stats?.participantCount || 0).toLocaleString()}건</Descriptions.Item>
                            <Descriptions.Item label="리뷰수">{(data.stats?.reviewCount || 0).toLocaleString()}건</Descriptions.Item>
                            <Descriptions.Item label="노쇼횟수">
                                <span style={{ color: (data.stats?.noshowCount || 0) > 0 ? '#cf1322' : undefined }}>
                                    {(data.stats?.noshowCount || 0).toLocaleString()}건
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="신고횟수">
                                <span style={{ color: (data.stats?.reportCount || 0) > 0 ? '#cf1322' : undefined }}>
                                    {(data.stats?.reportCount || 0).toLocaleString()}건
                                </span>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card title="이용정지" size="small">
                        <Space>
                            <Radio.Group value={statusValue} onChange={e => setStatusValue(e.target.value)}>
                                <Radio value="active">활성</Radio>
                                <Radio value="suspended">이용정지</Radio>
                            </Radio.Group>
                            <Button
                                type="primary"
                                danger={statusValue === 'suspended'}
                                onClick={handleStatusSave}
                                disabled={statusValue === data.status}
                            >
                                저장
                            </Button>
                        </Space>
                    </Card>

                    {data.suspendHistory?.length > 0 && (
                        <Card title="이용정지 이력" size="small">
                            <Timeline
                                items={data.suspendHistory.map((h) => ({
                                    content: (
                                        <div>
                                            <Text type="secondary">{h.createdAt ? dayjs(h.createdAt).format('YYYY-MM-DD HH:mm') : ''}</Text>
                                            <br />
                                            <Text>{h.reason}</Text>
                                        </div>
                                    ),
                                }))}
                            />
                        </Card>
                    )}
                </Space>
            ),
        },
        {
            key: 'match',
            label: '게시글',
            children: (
                <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
                    <Text strong>{matchTotal}건</Text>
                    <Table
                        columns={matchColumns}
                        dataSource={matches}
                        rowKey="idx"
                        loading={matchLoading}
                        pagination={{
                            current: matchPage,
                            pageSize: 20,
                            total: matchTotal,
                            onChange: (p) => setMatchPage(p),
                        }}
                    />
                </Space>
            ),
        },
        {
            key: 'participated',
            label: '매칭내역',
            children: (
                <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
                    <Text strong>{participatedTotal}건</Text>
                    <Table
                        columns={participatedColumns}
                        dataSource={participated}
                        rowKey="idx"
                        loading={participatedLoading}
                        locale={{ emptyText: '참여한 매칭이 없습니다' }}
                        pagination={{
                            current: participatedPage,
                            pageSize: 20,
                            total: participatedTotal,
                            onChange: (p) => setParticipatedPage(p),
                        }}
                    />
                </Space>
            ),
        },
        {
            key: 'point',
            label: '포인트',
            children: (
                <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="등록카드">{data.registeredCard || '-'}</Descriptions.Item>
                        <Descriptions.Item label="충전포인트">
                            <Link>{(data.chargePointTotal || 0).toLocaleString()}P</Link>
                        </Descriptions.Item>
                        <Descriptions.Item label="획득포인트">
                            <Link>{(data.earnPointTotal || 0).toLocaleString()}P</Link>
                        </Descriptions.Item>
                        <Descriptions.Item label="사용포인트">
                            <Link>{(data.spendPointTotal || 0).toLocaleString()}P</Link>
                        </Descriptions.Item>
                        <Descriptions.Item label="현재보유포인트">
                            {(data.pointBalance || 0).toLocaleString()}P
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                                (무료 {(data.freePointBalance || 0).toLocaleString()}P / 유료 {(data.paidPointBalance || 0).toLocaleString()}P)
                            </Text>
                        </Descriptions.Item>
                    </Descriptions>
                    <div style={{ textAlign: 'right' }}>
                        <Button type="primary" onClick={openManual}>포인트 지급/차감</Button>
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>거래 이력 ({pointTotal.toLocaleString()}건)</Text>
                        <Table
                            columns={[
                                {
                                    title: '일시', dataIndex: 'createdAt', width: 160,
                                    render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
                                },
                                {
                                    title: '유형', dataIndex: 'type', width: 90, align: 'center',
                                    render: (v, row) => {
                                        const colorMap = { charge: 'blue', earn: 'green', spend: 'orange', refund: 'cyan', penalty: 'red' }
                                        const labelMap = { charge: '충전', earn: '획득', spend: '사용', refund: '환불', penalty: '차감' }
                                        // 노쇼 취소 환불은 사용자 입장에서 잔액이 증가하는 '획득' 거래로 표시
                                        const isNoshowRefund = v === 'refund' && /취소/.test(row?.reason || '')
                                        const label = isNoshowRefund ? '획득' : (labelMap[v] || v)
                                        const color = isNoshowRefund ? 'green' : (colorMap[v] || 'default')
                                        return <Tag color={color}>{label}</Tag>
                                    },
                                },
                                {
                                    title: '포인트', dataIndex: 'amount', width: 110, align: 'right',
                                    render: (v, r) => {
                                        // amount는 항상 양수 저장. 잔액 증가 여부로 부호 결정.
                                        // refund는 '노쇼 취소 환불'(+) / '포인트 환불 신청'·'회원탈퇴 환불 신청'(-) 두 케이스 존재.
                                        let isCredit
                                        if (r.type === 'charge' || r.type === 'earn') isCredit = true
                                        else if (r.type === 'spend' || r.type === 'penalty') isCredit = false
                                        else if (r.type === 'refund') isCredit = (r.reason || '').includes('취소')
                                        else isCredit = true
                                        const sign = isCredit ? '+' : '-'
                                        return <span style={{ color: isCredit ? '#3f8600' : '#cf1322' }}>
                                            {sign}{(v || 0).toLocaleString()}P
                                        </span>
                                    },
                                },
                                { title: '잔액', dataIndex: 'balanceAfter', width: 110, align: 'right', render: (v) => v != null ? `${v.toLocaleString()}P` : '-' },
                                { title: '사유', dataIndex: 'reason', render: (v) => v || '-' },
                            ]}
                            dataSource={pointTxs}
                            rowKey="idx"
                            loading={pointLoading}
                            locale={{ emptyText: '거래 이력이 없습니다' }}
                            pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (total) => `총 ${total}건` }}
                            size="small"
                            bordered
                        />
                    </div>
                </Space>
            ),
        },
        {
            key: 'gift',
            label: '선물함',
            children: (
                <Tabs
                    activeKey={giftTab}
                    onChange={(key) => { setGiftTab(key); setGiftPage(1) }}
                    items={[
                        {
                            key: 'received',
                            label: '받은선물',
                            children: (
                                <Table
                                    columns={giftColumns}
                                    dataSource={gifts}
                                    rowKey={(g) => g.idx || Math.random()}
                                    pagination={{
                                        current: giftPage,
                                        pageSize: 20,
                                        total: giftTotal,
                                        onChange: (p) => setGiftPage(p),
                                    }}
                                />
                            ),
                        },
                        {
                            key: 'sent',
                            label: '보낸선물',
                            children: (
                                <Table
                                    columns={giftColumns}
                                    dataSource={gifts}
                                    rowKey={(g) => g.idx || Math.random()}
                                    pagination={{
                                        current: giftPage,
                                        pageSize: 20,
                                        total: giftTotal,
                                        onChange: (p) => setGiftPage(p),
                                    }}
                                />
                            ),
                        },
                    ]}
                />
            ),
        },
    ]

    return (
        <>
            <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button onClick={onBack}>← 목록</Button>
                    <Title level={4} style={{ margin: 0 }}>
                        {roleLabelMap[data.role] || data.role} 회원 정보
                    </Title>
                </div>

                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                />
            </Space>

            <Modal
                title="이용정지"
                open={suspendModalOpen}
                onOk={handleSuspendConfirm}
                onCancel={() => setSuspendModalOpen(false)}
                okText="이용정지 처리"
                okButtonProps={{ disabled: !suspendReasonKey }}
                cancelText="취소"
            >
                <p style={{ marginBottom: 10 }}>이용정지 사유를 선택해 주세요.</p>
                <Select
                    placeholder="사유 선택"
                    value={suspendReasonKey}
                    onChange={(val) => setSuspendReasonKey(val)}
                    options={suspendReasonOptions}
                    style={{ width: '100%', marginBottom: 12 }}
                />
                {suspendReasonKey === 'other' && (
                    <TextArea
                        rows={3}
                        placeholder="기타 사유를 입력해 주세요."
                        value={suspendReason}
                        onChange={e => setSuspendReason(e.target.value)}
                    />
                )}
            </Modal>

            {/* [C125-5] 포인트 수동 지급/차감 */}
            <Modal
                title="포인트 지급/차감"
                open={manualOpen}
                onOk={handleManualSubmit}
                onCancel={() => setManualOpen(false)}
                okText="처리"
                okButtonProps={{ disabled: !mpValid, loading: mpSaving }}
                cancelText="취소"
                destroyOnClose
            >
                <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                    <div>
                        <Text type="secondary">현재 보유: </Text>
                        <Text strong style={{ color: mpPointType === 'free' ? '#1677ff' : undefined }}>무료 {(data?.freePointBalance || 0).toLocaleString()}P</Text>
                        <Text type="secondary"> / </Text>
                        <Text strong style={{ color: mpPointType === 'paid' ? '#1677ff' : undefined }}>유료 {(data?.paidPointBalance || 0).toLocaleString()}P</Text>
                    </div>
                    <div>
                        <Text style={{ display: 'block', marginBottom: 4 }}>구분</Text>
                        <Radio.Group value={mpPointType} onChange={e => setMpPointType(e.target.value)}>
                            <Radio value="free">무료 포인트</Radio>
                            <Radio value="paid">유료 포인트</Radio>
                        </Radio.Group>
                    </div>
                    <div>
                        <Text style={{ display: 'block', marginBottom: 4 }}>동작</Text>
                        <Radio.Group value={mpType} onChange={e => setMpType(e.target.value)}>
                            <Radio value="earn">지급</Radio>
                            <Radio value="spend">차감</Radio>
                        </Radio.Group>
                    </div>
                    <div>
                        <Text style={{ display: 'block', marginBottom: 4 }}>금액 (P)</Text>
                        <InputNumber
                            value={mpAmount}
                            onChange={setMpAmount}
                            min={1}
                            step={100}
                            style={{ width: '100%' }}
                            placeholder="포인트 금액"
                            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={v => v.replace(/,/g, '')}
                            status={mpExceeds ? 'error' : undefined}
                        />
                        {mpExceeds && (
                            <Text type="danger" style={{ fontSize: 12 }}>
                                보유 잔액({mpCurrentBalance.toLocaleString()}P)을 초과하여 차감할 수 없습니다.
                            </Text>
                        )}
                    </div>
                    <div>
                        <Text style={{ display: 'block', marginBottom: 4 }}>사유</Text>
                        <TextArea
                            rows={2}
                            value={mpReason}
                            onChange={e => setMpReason(e.target.value)}
                            placeholder="지급/차감 사유를 입력해 주세요."
                            maxLength={100}
                        />
                    </div>
                </Space>
            </Modal>
        </>
    )
}
