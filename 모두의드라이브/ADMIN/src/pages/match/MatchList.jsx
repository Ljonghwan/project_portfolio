import { useState, useMemo, useEffect, useRef } from 'react'
import { Card, Table, Form, Input, Select, DatePicker, Button, Space, Tag, Typography, Row, Col, App as AntApp } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import API from "@/libs/api"
import { useConfigSelect, useConfigLabelMap, useConfigColorMap } from '@/store'
import { useAllData, useDetailView } from '@/hooks/useListPage'
import { noColumn } from '@/hooks/columnHelpers'
import MatchDetailView from './MatchDetailView'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const LIMIT = 20

const SEARCH_FIELD_OPTIONS = [
    { value: 'nickname', label: '닉네임' },
    { value: 'id', label: '아이디' },
    { value: 'region', label: '지역' },
    { value: 'destination', label: '목적지' },
]

const initialFilters = {
    dateRange: null,
    searchField: 'nickname',
    keyword: '',
    memberType: '',
    matchType: '',
    status: '',
}

export default function Page() {
    const { message, modal } = AntApp.useApp()
    const { editItem, setEditItem, handleEdit, handleCancel } = useDetailView({})

    const memberTypeOptions = useConfigSelect('roles', true)
    const roleLabelMap = useConfigLabelMap('roles')
    const matchTypeOptions = useConfigSelect('matchTypes', true)
    const matchTypeLabelMap = useConfigLabelMap('matchTypes')
    const matchStatusOptions = useConfigSelect('matchStatuses', true)
    const matchStatusLabelMap = useConfigLabelMap('matchStatuses')
    const matchStatusColorMap = useConfigColorMap('matchStatuses')

    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState({ ...initialFilters })
    const [searchParams, setSearchParams] = useState({ ...initialFilters })

    const { allData, loading, reload } = useAllData({
        url: '/admin/match/list',
        params: {},
        deps: ['match'],
    })

    const [searchUrlParams, setSearchUrlParams] = useSearchParams()
    const openedRef = useRef(false)
    useEffect(() => {
        if (openedRef.current) return
        const openIdx = searchUrlParams.get('openIdx')
        if (!openIdx) return
        openedRef.current = true
        ;(async () => {
            const { data } = await API.post('/admin/match/detail', { idx: Number(openIdx) })
            if (data) handleEdit(data)
            const next = new URLSearchParams(searchUrlParams)
            next.delete('openIdx')
            setSearchUrlParams(next, { replace: true })
        })()
    }, [searchUrlParams])

    const filteredData = useMemo(() => {
        const s = searchParams
        return allData.filter(item => {
            // 키워드 검색 (searchField 기반)
            if (s.keyword) {
                const kw = s.keyword.toLowerCase()
                let match = false
                switch (s.searchField) {
                    case 'nickname':
                        match = item.authorNickname?.toLowerCase().includes(kw) || item.nickname?.toLowerCase().includes(kw)
                        break
                    case 'id':
                        match = item.authorEmail?.toLowerCase().includes(kw) || item.email?.toLowerCase().includes(kw)
                        break
                    case 'region':
                        match = item.meetingRegion?.toLowerCase().includes(kw)
                        break
                    case 'destination':
                        match = item.destination?.toLowerCase().includes(kw)
                        break
                    default:
                        match = true
                }
                if (!match) return false
            }
            // 날짜 필터
            if (s.dateRange?.[0] || s.dateRange?.[1]) {
                if (!item.createdAt) return false
                const d = dayjs(item.createdAt)
                if (s.dateRange[0] && d.isBefore(s.dateRange[0], 'day')) return false
                if (s.dateRange[1] && d.isAfter(s.dateRange[1], 'day')) return false
            }
            // 회원유형
            if (s.memberType && item.authorRole !== s.memberType) return false
            // 매칭구분
            if (s.matchType && item.matchType !== s.matchType) return false
            // 상태
            if (s.status && item.status !== s.status) return false
            return true
        })
    }, [allData, searchParams])

    const totalCount = filteredData.length
    const list = filteredData.slice((page - 1) * LIMIT, page * LIMIT)

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
        const { data } = await API.post('/admin/match/detail', { idx: item.idx })
        handleEdit(data || item)
    }

    const onSimulateStart = (e, item) => {
        e.stopPropagation()
        modal.confirm({
            title: '2분 뒤 매칭 시작 시뮬',
            content: `매칭 #${item.idx}의 일정을 지금부터 2분 뒤로 옮깁니다. (개발용)`,
            okText: '실행',
            cancelText: '취소',
            onOk: async () => {
                await API.post('/admin/match/dev-simulate-start', { idx: item.idx })
                message.success('일정이 변경되었습니다')
                reload()
            },
        })
    }

    const onSimulateEnd = (e, item) => {
        e.stopPropagation()
        modal.confirm({
            title: '2분 뒤 매칭 종료 시뮬',
            content: `매칭 #${item.idx}의 종료시각을 2분 뒤로 옮깁니다. (cron이 자동 종료, 개발용)`,
            okText: '실행',
            cancelText: '취소',
            onOk: async () => {
                await API.post('/admin/match/dev-simulate-end', { idx: item.idx })
                message.success('일정이 변경되었습니다')
                reload()
            },
        })
    }

    const handleExcelDownload = () => {
        if (filteredData.length === 0) return
        const headers = ['NO', '등록일', '회원유형', '등록자 아이디', '등록자 닉네임', '매칭구분', '만나는지역', '목적지', '드라이브일시', '신청자', '확정자', '상태']
        const csvRows = [headers.join(',')]
        filteredData.forEach((item, i) => {
            csvRows.push([
                filteredData.length - i,
                item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD') : '',
                roleLabelMap[item.authorRole] || item.authorRole || '',
                item.authorEmail || '',
                `"${(item.authorNickname || '').replace(/"/g, '""')}"`,
                matchTypeLabelMap[item.matchType] || item.matchType || '',
                `"${(item.meetingRegion || '').replace(/"/g, '""')}"`,
                `"${(item.destination || '').replace(/"/g, '""')}"`,
                `${item.driveDate ? dayjs(item.driveDate).format('YYYY-MM-DD') : ''} ${item.driveTime || ''}`.trim(),
                item.applicantCount || 0,
                item.confirmedCount || 0,
                matchStatusLabelMap[item.status] || item.status || '',
            ].join(','))
        })
        const bom = '﻿'
        const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `게시글관리_${dayjs().format('YYYYMMDD')}.csv`
        a.click(); URL.revokeObjectURL(url)
    }

    // 상세 화면에서 데이터 갱신 시 pushState 없이 editItem만 교체
    const refreshDetail = async () => {
        if (!editItem) return
        const { data } = await API.post('/admin/match/detail', { idx: editItem.idx })
        if (data) setEditItem(data)
    }

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        {
            title: '등록일',
            dataIndex: 'createdAt',
            width: 120,
            align: 'center',
            render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '',
        },
        {
            title: '회원유형',
            dataIndex: 'authorRole',
            width: 90,
            align: 'center',
            render: (v) => <Tag>{roleLabelMap[v] || v}</Tag>,
        },
        {
            title: '등록자',
            key: 'author',
            width: 180,
            render: (_, r) => (
                <div>
                    <div>{r.authorNickname || '-'}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{r.authorEmail || '-'}</div>
                </div>
            ),
        },
        {
            title: '매칭구분',
            dataIndex: 'matchType',
            width: 90,
            align: 'center',
            render: (v) => matchTypeLabelMap[v] || v,
        },
        {
            title: '만나는지역',
            dataIndex: 'meetingRegion',
            ellipsis: true,
        },
        {
            title: '목적지',
            dataIndex: 'destination',
            ellipsis: true,
        },
        {
            title: '드라이브일시',
            dataIndex: 'driveDate',
            width: 150,
            align: 'center',
            render: (v, r) => `${v ? dayjs(v).format('YYYY-MM-DD') : ''} ${r.driveTime || ''}`,
        },
        {
            title: '신청자',
            dataIndex: 'applicantCount',
            width: 80,
            align: 'center',
            render: (v) => `${v || 0}명`,
        },
        {
            title: '확정자',
            dataIndex: 'confirmedCount',
            width: 80,
            align: 'center',
            render: (v) => `${v || 0}명`,
        },
        {
            title: '상태',
            dataIndex: 'status',
            width: 120,
            align: 'center',
            render: (v) => (
                <Tag color={matchStatusColorMap[v] || 'default'}>
                    {matchStatusLabelMap[v] || v}
                </Tag>
            ),
        },
        {
            title: '개발용',
            key: 'devActions',
            width: 200,
            align: 'center',
            render: (_, r) => {
                const beforeStart = ['pending', 'matching', 'confirmed'].includes(r.status)
                const inProgress = r.status === 'in_progress'
                if (!beforeStart && !inProgress) return null
                return (
                    <Space size={4}>
                        {beforeStart && (
                            <Button size="small" onClick={(e) => onSimulateStart(e, r)}>2분뒤 시작</Button>
                        )}
                        {inProgress && (
                            <Button size="small" onClick={(e) => onSimulateEnd(e, r)}>2분뒤 종료</Button>
                        )}
                    </Space>
                )
            },
        },
    ]

    if (editItem) {
        return <MatchDetailView data={editItem} onBack={handleCancel} onRefresh={refreshDetail} />
    }

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>게시글 관리</Title>
                <Text type="secondary">총 {totalCount.toLocaleString()}건</Text>
                <div style={{ marginLeft: 'auto' }}>
                    <Button icon={<DownloadOutlined />} onClick={handleExcelDownload}>엑셀 다운로드</Button>
                </div>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="등록일시" style={{ marginBottom: 12 }}>
                                <RangePicker
                                    value={filters.dateRange}
                                    onChange={(val) => setFilters(prev => ({ ...prev, dateRange: val }))}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="검색" style={{ marginBottom: 12 }}>
                                <Space.Compact style={{ width: '100%' }}>
                                    <Select
                                        value={filters.searchField}
                                        onChange={(val) => setFilters(prev => ({ ...prev, searchField: val }))}
                                        options={SEARCH_FIELD_OPTIONS}
                                        style={{ width: 120 }}
                                    />
                                    <Input
                                        value={filters.keyword}
                                        onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                                        onPressEnter={searchFunc}
                                        placeholder="검색어 입력"
                                        allowClear
                                    />
                                </Space.Compact>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="구분" style={{ marginBottom: 12 }}>
                                <Space>
                                    <Select
                                        value={filters.memberType}
                                        onChange={(val) => setFilters(prev => ({ ...prev, memberType: val }))}
                                        options={memberTypeOptions}
                                        style={{ width: 140 }}
                                        placeholder="회원유형"
                                    />
                                    <Select
                                        value={filters.matchType}
                                        onChange={(val) => setFilters(prev => ({ ...prev, matchType: val }))}
                                        options={matchTypeOptions}
                                        style={{ width: 140 }}
                                        placeholder="매칭구분"
                                    />
                                </Space>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="상태" style={{ marginBottom: 12 }}>
                                <Select
                                    value={filters.status}
                                    onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
                                    options={matchStatusOptions}
                                    style={{ width: '100%' }}
                                />
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
                onRow={(record) => ({
                    onClick: () => onEdit(record),
                    style: { cursor: 'pointer' },
                })}
            />
        </>
    )
}
