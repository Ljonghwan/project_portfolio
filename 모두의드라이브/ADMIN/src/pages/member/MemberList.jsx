import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, Table, Form, Input, Select, DatePicker, Radio, Button, Space, Typography, InputNumber, Row, Col, message } from 'antd'
import dayjs from 'dayjs'

import API from "@/libs/api"
import { usePopup, useConfigSelect, useConfigLabelMap } from '@/store'
import { useAllData, useDetailView } from '@/hooks/useListPage'
import { noColumn } from '@/hooks/columnHelpers'
import MemberDetailView from './MemberDetailView'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const LIMIT = 20

const initialFilters = {
    dateRange: null,
    keyword: '',
    sido: undefined,
    sigungu: undefined,
    gender: '',
    socialType: '',
    ageMin: null,
    ageMax: null,
    freePointMin: null,
    freePointMax: null,
    paidPointMin: null,
    paidPointMax: null,
    mannerMin: null,
    mannerMax: null,
}

const getSnsLabel = (socialType) => {
    switch (socialType) {
        case 'kakao': return '카카오'
        case 'naver': return '네이버'
        case 'apple': return '애플'
        case 'google': return '구글'
        default: return ''
    }
}

const SNS_OPTIONS = [
    { label: '전체', value: '' },
    { label: '카카오', value: 'kakao' },
    { label: '애플', value: 'apple' },
]

export default function Page({ defaultRole = '', defaultStatus = '' }) {
    const { openPopup } = usePopup()
    const [messageApi, contextHolder] = message.useMessage()
    const { editItem, setEditItem, handleEdit, handleCancel } = useDetailView({})
    const genderOptions = useConfigSelect('genders')
    const genderLabelMap = useConfigLabelMap('genders')
    const roleLabelMap = useConfigLabelMap('roles')

    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState({ ...initialFilters })
    const [searchParams, setSearchParams] = useState({ ...initialFilters })

    // 탭 전환 시 초기값으로 리셋 + 상세보기 닫기
    const prevKeyRef = useRef(`${defaultRole}_${defaultStatus}`)
    useEffect(() => {
        const currentKey = `${defaultRole}_${defaultStatus}`
        if (prevKeyRef.current !== currentKey) {
            setPage(1)
            setFilters({ ...initialFilters })
            setSearchParams({ ...initialFilters })
            setEditItem(null)
            prevKeyRef.current = currentKey
        }
    }, [defaultRole, defaultStatus, setEditItem])

    // 지역 데이터 (서버 API)
    const [sidoList, setSidoList] = useState([])
    const [sigunguList, setSigunguList] = useState([])

    const pageTitle = defaultStatus === 'suspended'
        ? '이용정지 회원'
        : defaultRole
            ? `${roleLabelMap[defaultRole] || defaultRole} 회원`
            : '회원 목록'

    const dateLabel = defaultStatus === 'suspended' ? '이용 정지일' : '가입일'

    // 시도 목록 로드
    useEffect(() => {
        API.post('/v1/region/sido').then(({ data }) => setSidoList(data || []))
    }, [])

    // 시군구 목록 로드 (시도 선택 시)
    useEffect(() => {
        if (filters.sido) {
            API.post('/v1/region/sigungu', { sido: filters.sido }).then(({ data }) => setSigunguList(data || []))
        } else {
            setSigunguList([])
        }
    }, [filters.sido])

    // 전체 데이터 가져오기 (서버에서 role/status만 필터)
    const { allData, loading, reload } = useAllData({
        url: '/admin/member/list',
        params: { role: defaultRole, status: defaultStatus },
        deps: [defaultRole, defaultStatus],
    })

    // 프론트 필터링
    const filteredData = useMemo(() => {
        const s = searchParams
        return allData.filter(item => {
            // 키워드 검색
            if (s.keyword) {
                const kw = s.keyword.toLowerCase()
                if (!(item.name?.toLowerCase().includes(kw) ||
                      item.nickname?.toLowerCase().includes(kw) ||
                      item.phone?.includes(kw) ||
                      item.email?.toLowerCase().includes(kw))) return false
            }
            // 날짜 필터
            if (s.dateRange?.[0] || s.dateRange?.[1]) {
                const dateField = defaultStatus === 'suspended' ? item.suspendedAt : item.createdAt
                if (!dateField) return false
                const d = dayjs(dateField)
                if (s.dateRange[0] && d.isBefore(s.dateRange[0], 'day')) return false
                if (s.dateRange[1] && d.isAfter(s.dateRange[1], 'day')) return false
            }
            // 성별
            if (s.gender && item.gender !== s.gender) return false
            // SNS 타입
            if (s.socialType && item.socialType !== s.socialType) return false
            // 지역
            if (s.sido && item.regionSido !== s.sido) return false
            if (s.sigungu && item.regionSigungu !== s.sigungu) return false
            // 나이
            if (s.ageMin != null && (item.age == null || item.age < s.ageMin)) return false
            if (s.ageMax != null && (item.age == null || item.age > s.ageMax)) return false
            // 무료포인트
            if (s.freePointMin != null && (item.freePointBalance || 0) < s.freePointMin) return false
            if (s.freePointMax != null && (item.freePointBalance || 0) > s.freePointMax) return false
            // 유료포인트
            if (s.paidPointMin != null && (item.paidPointBalance || 0) < s.paidPointMin) return false
            if (s.paidPointMax != null && (item.paidPointBalance || 0) > s.paidPointMax) return false
            // 매너점수
            if (s.mannerMin != null && (item.mannerScore ?? 0) < s.mannerMin) return false
            if (s.mannerMax != null && (item.mannerScore ?? 0) > s.mannerMax) return false
            return true
        })
    }, [allData, searchParams, defaultStatus])

    // 프론트 페이지네이션
    const totalCount = filteredData.length
    const list = filteredData.slice((page - 1) * LIMIT, page * LIMIT)

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const searchFunc = () => {
        setSearchParams({ ...filters })
        setPage(1)
    }

    const resetFunc = () => {
        setFilters({ ...initialFilters })
        setSearchParams({ ...initialFilters })
        setPage(1)
    }

    const onEdit = async (item) => {
        const { data } = await API.post('/admin/member/detail', { idx: item.idx })
        handleEdit(data || item)
    }

    // 상세 화면에서 데이터 갱신 시 pushState 없이 editItem만 교체
    const refreshDetail = async () => {
        if (!editItem) return
        const { data } = await API.post('/admin/member/detail', { idx: editItem.idx })
        if (data) setEditItem(data)
    }

    const dateField = defaultStatus === 'suspended' ? 'suspendedAt' : 'createdAt'

    const handleExcelDownload = () => {
        if (filteredData.length === 0) { messageApi.warning('다운로드할 데이터가 없습니다.'); return }
        const headers = ['NO', dateLabel, '이메일(ID)', 'SNS', '이름', '휴대폰', '닉네임', '성별', '나이', '지역', '매너', '무료P', '유료P']
        const csvRows = [headers.join(',')]
        const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
        filteredData.forEach((item, i) => {
            csvRows.push([
                filteredData.length - i,
                item[dateField] ? dayjs(item[dateField]).format('YYYY-MM-DD HH:mm') : '',
                escape(item.email || ''),
                getSnsLabel(item.socialType) || '',
                escape(item.name || ''),
                escape(item.phone || ''),
                escape(item.nickname || ''),
                genderLabelMap[item.gender] || '',
                item.age || '',
                escape(item.region || ''),
                item.mannerScore == null ? '' : Math.round(Number(item.mannerScore)),
                item.freePointBalance || 0,
                item.paidPointBalance || 0,
            ].join(','))
        })
        const bom = '﻿'
        const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const namePrefix = defaultStatus === 'suspended' ? '이용정지회원' : (defaultRole ? `${roleLabelMap[defaultRole] || defaultRole}회원` : '회원')
        a.href = url
        a.download = `${namePrefix}_${dayjs().format('YYYYMMDD')}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        {
            title: dateLabel,
            key: 'date',
            width: 110,
            align: 'center',
            render: (_, item) => {
                const d = item[dateField]
                return d ? dayjs(d).format('YYYY-MM-DD') : '-'
            },
        },
        {
            title: '이메일',
            key: 'account',
            width: 200,
            ellipsis: true,
            render: (_, item) => (
                <span>
                    {item.socialType && <span style={{ marginRight: 4, color: '#888', fontSize: 12 }}>[{getSnsLabel(item.socialType)}]</span>}
                    {item.email}
                </span>
            ),
        },
        {
            title: '이름',
            dataIndex: 'name',
            key: 'name',
            width: 90,
            render: (text, item) => (
                <a onClick={() => onEdit(item)}>{text}</a>
            ),
        },
        {
            // [C124-2] 이름-닉네임 사이 휴대폰 컬럼 (USER_TB.phone)
            title: '휴대폰',
            dataIndex: 'phone',
            key: 'phone',
            width: 130,
            render: (v) => v || '-',
        },
        {
            title: '닉네임',
            dataIndex: 'nickname',
            key: 'nickname',
            width: 100,
            render: (text, item) => (
                <a onClick={() => onEdit(item)}>{text}</a>
            ),
        },
        {
            title: '성별',
            dataIndex: 'gender',
            key: 'gender',
            width: 60,
            align: 'center',
            render: (val) => genderLabelMap[val] || '-',
        },
        {
            title: '나이',
            dataIndex: 'age',
            key: 'age',
            width: 55,
            align: 'center',
            render: (val) => val || '-',
        },
        {
            title: '지역',
            dataIndex: 'region',
            key: 'region',
            width: 100,
            align: 'center',
            render: (val) => val || '-',
        },
        {
            title: '매너',
            dataIndex: 'mannerScore',
            key: 'mannerScore',
            width: 65,
            align: 'center',
            render: (val) => val == null ? '-' : Math.round(Number(val)),
        },
        {
            title: '무료P',
            dataIndex: 'freePointBalance',
            key: 'freePointBalance',
            width: 90,
            align: 'center',
            render: (val) => {
                const v = val || 0
                return <span style={v < 0 ? { color: 'red' } : {}}>{v.toLocaleString()}</span>
            },
        },
        {
            title: '유료P',
            dataIndex: 'paidPointBalance',
            key: 'paidPointBalance',
            width: 90,
            align: 'center',
            render: (val) => {
                const v = val || 0
                return <span style={v < 0 ? { color: 'red' } : {}}>{v.toLocaleString()}</span>
            },
        },
    ]

    if (editItem) {
        return <MemberDetailView data={editItem} onBack={handleCancel} onRefresh={refreshDetail} />
    }

    return (
        <>
            {contextHolder}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Title level={4} style={{ margin: 0 }}>{pageTitle}</Title>
                    <Text type="secondary">총 {totalCount.toLocaleString()}명</Text>
                </div>
                <Button onClick={handleExcelDownload}>엑셀 다운로드</Button>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label={dateLabel} style={{ marginBottom: 12 }}>
                                <RangePicker
                                    value={filters.dateRange}
                                    onChange={(val) => handleFilterChange('dateRange', val)}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="검색" style={{ marginBottom: 12 }}>
                                <Input
                                    placeholder="닉네임, 아이디, 휴대폰번호"
                                    value={filters.keyword}
                                    onChange={e => handleFilterChange('keyword', e.target.value)}
                                    onPressEnter={searchFunc}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="성별" style={{ marginBottom: 12 }}>
                                <Radio.Group
                                    value={filters.gender}
                                    onChange={e => handleFilterChange('gender', e.target.value)}
                                >
                                    <Radio value="">전체</Radio>
                                    {genderOptions.map(o => (
                                        <Radio key={o.value} value={o.value}>{o.label}</Radio>
                                    ))}
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="SNS 로그인" style={{ marginBottom: 12 }}>
                                <Radio.Group
                                    value={filters.socialType}
                                    onChange={e => handleFilterChange('socialType', e.target.value)}
                                >
                                    {SNS_OPTIONS.map(o => (
                                        <Radio key={o.value} value={o.value}>{o.label}</Radio>
                                    ))}
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="지역" style={{ marginBottom: 12 }}>
                                <Space>
                                    <Select
                                        placeholder="시/도"
                                        value={filters.sido}
                                        onChange={(val) => {
                                            handleFilterChange('sido', val)
                                            handleFilterChange('sigungu', undefined)
                                        }}
                                        allowClear
                                        style={{ width: 130 }}
                                        options={sidoList.map(s => ({ label: s, value: s }))}
                                    />
                                    <Select
                                        placeholder="시/군/구"
                                        value={filters.sigungu}
                                        onChange={(val) => handleFilterChange('sigungu', val)}
                                        allowClear
                                        style={{ width: 130 }}
                                        options={sigunguList.map(s => ({ label: s, value: s }))}
                                    />
                                </Space>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="나이" style={{ marginBottom: 12 }}>
                                <Space>
                                    <InputNumber placeholder="최소" value={filters.ageMin} onChange={val => handleFilterChange('ageMin', val)} min={0} controls={false} style={{ width: 80 }} />
                                    <span>~</span>
                                    <InputNumber placeholder="최대" value={filters.ageMax} onChange={val => handleFilterChange('ageMax', val)} min={0} controls={false} style={{ width: 80 }} />
                                </Space>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="매너점수" style={{ marginBottom: 12 }}>
                                <Space>
                                    <InputNumber placeholder="최소" value={filters.mannerMin} onChange={val => handleFilterChange('mannerMin', val)} min={0} controls={false} style={{ width: 100 }} />
                                    <span>~</span>
                                    <InputNumber placeholder="최대" value={filters.mannerMax} onChange={val => handleFilterChange('mannerMax', val)} min={0} controls={false} style={{ width: 100 }} />
                                </Space>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="무료포인트" style={{ marginBottom: 12 }}>
                                <Space>
                                    <InputNumber placeholder="최소" value={filters.freePointMin} onChange={val => handleFilterChange('freePointMin', val)} controls={false} style={{ width: 100 }} />
                                    <span>~</span>
                                    <InputNumber placeholder="최대" value={filters.freePointMax} onChange={val => handleFilterChange('freePointMax', val)} controls={false} style={{ width: 100 }} />
                                </Space>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="유료포인트" style={{ marginBottom: 12 }}>
                                <Space>
                                    <InputNumber placeholder="최소" value={filters.paidPointMin} onChange={val => handleFilterChange('paidPointMin', val)} controls={false} style={{ width: 100 }} />
                                    <span>~</span>
                                    <InputNumber placeholder="최대" value={filters.paidPointMax} onChange={val => handleFilterChange('paidPointMax', val)} controls={false} style={{ width: 100 }} />
                                </Space>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24} style={{ textAlign: 'right' }}>
                            <Space>
                                <Button onClick={resetFunc}>초기화</Button>
                                <Button type="primary" onClick={searchFunc}>검색</Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </Card>

            <Table
                columns={columns}
                dataSource={list}
                rowKey="idx"
                loading={loading}
                locale={{ emptyText: '데이터가 없습니다' }}
                pagination={{
                    current: page,
                    pageSize: LIMIT,
                    total: totalCount,
                    onChange: (p) => setPage(p),
                    showTotal: (total) => `총 ${total}건`,
                }}
                scroll={{ x: 'max-content' }}
            />
        </>
    )
}
