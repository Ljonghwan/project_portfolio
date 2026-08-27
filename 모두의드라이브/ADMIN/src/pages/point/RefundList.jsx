import { useState, useEffect, useMemo } from 'react'
import { Card, Table, Form, Input, DatePicker, Radio, Button, Space, Typography, Row, Col, Modal, App as AntApp } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import API from "@/libs/api"
import { useAllData } from '@/hooks/useListPage'
import { noColumn, dateColumn } from '@/hooks/columnHelpers'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const LIMIT = 20

const initialFilters = {
    dateRange: null,
    status: '',
    keyword: '',
}

export default function Page() {
    const { message } = AntApp.useApp()
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState({ ...initialFilters })
    const [searchParams, setSearchParams] = useState({ ...initialFilters })
    const [processModal, setProcessModal] = useState({ open: false, item: null, status: 'pending' })
    const [processLoading, setProcessLoading] = useState(false)

    const { allData, loading, reload } = useAllData({
        url: '/admin/point/refund/list',
        params: {},
        deps: ['refund'],
    })

    const filteredData = useMemo(() => {
        const s = searchParams
        return allData.filter(item => {
            // 키워드 검색
            if (s.keyword) {
                const kw = s.keyword.toLowerCase()
                if (!(item.user?.email?.toLowerCase().includes(kw) ||
                      item.user?.name?.toLowerCase().includes(kw) ||
                      item.user?.nickname?.toLowerCase().includes(kw))) return false
            }
            // 날짜 필터
            if (s.dateRange?.[0] || s.dateRange?.[1]) {
                if (!item.createdAt) return false
                const d = dayjs(item.createdAt)
                if (s.dateRange[0] && d.isBefore(s.dateRange[0], 'day')) return false
                if (s.dateRange[1] && d.isAfter(s.dateRange[1], 'day')) return false
            }
            // 처리상태
            if (s.status && item.status !== s.status) return false
            return true
        })
    }, [allData, searchParams])

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

    const openProcessModal = (item) => {
        setProcessModal({ open: true, item, status: item.status || 'pending' })
    }

    const closeProcessModal = () => {
        setProcessModal({ open: false, item: null, status: 'pending' })
    }

    const handleExcelDownload = () => {
        if (filteredData.length === 0) return
        const headers = ['NO', '요청일시', '아이디', '이름', '닉네임', '보유한 유료 포인트', '은행명', '계좌번호', '예금주', '처리상태', '처리일시']
        const statusLabel = { pending: '미처리', completed: '처리완료' }
        const csvRows = [headers.join(',')]
        filteredData.forEach((item, i) => {
            csvRows.push([
                filteredData.length - i,
                item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : '',
                item.user?.email || '',
                item.user?.name || '',
                item.user?.nickname || '',
                item.paidPointBalance || 0,
                `"${(item.bankName || '').replace(/"/g, '""')}"`,
                `"${(item.accountNumber || '').replace(/"/g, '""')}"`,
                `"${(item.accountHolder || '').replace(/"/g, '""')}"`,
                statusLabel[item.status] || item.status || '',
                item.processedAt ? dayjs(item.processedAt).format('YYYY-MM-DD HH:mm') : '',
            ].join(','))
        })
        const bom = '﻿'
        const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `환불내역_${dayjs().format('YYYYMMDD')}.csv`
        a.click(); URL.revokeObjectURL(url)
    }

    const handleProcessSave = async () => {
        if (!processModal.item) return
        setProcessLoading(true)
        try {
            await API.post('/admin/point/refund/process', {
                idx: processModal.item.idx,
                status: processModal.status,
            })
            message.success('처리되었습니다.')
            closeProcessModal()
            reload()
        } catch (e) {
            message.error('처리 중 오류가 발생했습니다.')
        } finally {
            setProcessLoading(false)
        }
    }

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        dateColumn('요청 일시', 'createdAt'),
        {
            title: '아이디',
            key: 'email',
            render: (_, item) => item.user?.email || '-',
        },
        {
            title: '이름',
            key: 'name',
            width: 100,
            render: (_, item) => item.user?.name || '-',
        },
        {
            title: '보유한 유료 포인트',
            dataIndex: 'paidPointBalance',
            key: 'paidPointBalance',
            width: 200,
            align: 'right',
            render: (v) => (v || 0).toLocaleString(),
        },
        {
            title: '은행명',
            dataIndex: 'bankName',
            key: 'bankName',
            width: 200,
            render: (v) => v || '-',
        },
        {
            title: '계좌번호',
            dataIndex: 'accountNumber',
            key: 'accountNumber',
            render: (v) => v || '-',
        },
        {
            title: '예금주',
            dataIndex: 'accountHolder',
            key: 'accountHolder',
            width: 100,
            render: (v) => v || '-',
        },
        {
            title: '환불처리',
            key: 'process',
            width: 120,
            align: 'center',
            render: (_, item) => {
                if (item.status === 'completed') {
                    return (
                        <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'pre-line' }}>
                            {`처리완료\n${item.processedAt ? dayjs(item.processedAt).format('MM-DD HH:mm') : ''}`}
                        </Text>
                    )
                }
                return (
                    <Button size="small" type="primary" onClick={() => openProcessModal(item)}>
                        처리
                    </Button>
                )
            },
        },
    ]

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>환불 내역</Title>
                <Text type="secondary">총 {totalCount.toLocaleString()}건</Text>
                <div style={{ marginLeft: 'auto' }}>
                    <Button icon={<DownloadOutlined />} onClick={handleExcelDownload}>엑셀 다운로드</Button>
                </div>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="환불 요청일" style={{ marginBottom: 12 }}>
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
                                    placeholder="아이디, 이름, 닉네임"
                                    value={filters.keyword}
                                    onChange={e => handleFilterChange('keyword', e.target.value)}
                                    onPressEnter={searchFunc}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="처리상태" style={{ marginBottom: 12 }}>
                                <Radio.Group
                                    value={filters.status}
                                    onChange={e => handleFilterChange('status', e.target.value)}
                                >
                                    <Radio value="">전체</Radio>
                                    <Radio value="pending">미처리</Radio>
                                    <Radio value="completed">처리완료</Radio>
                                </Radio.Group>
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

            <div style={{ marginBottom: 12 }}>
                <Text>검색결과 {totalCount.toLocaleString()}</Text>
            </div>

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
            />

            <Modal
                title="환불 처리"
                open={processModal.open}
                onCancel={closeProcessModal}
                footer={[
                    <Button key="cancel" onClick={closeProcessModal}>취소</Button>,
                    <Button key="save" type="primary" loading={processLoading} onClick={handleProcessSave}>저장</Button>,
                ]}
            >
                <Form layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item label="처리상태">
                        <Radio.Group
                            value={processModal.status}
                            onChange={e => setProcessModal(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <Radio value="pending">미처리</Radio>
                            <Radio value="completed">처리완료</Radio>
                        </Radio.Group>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}
