import { useState, useEffect, useMemo } from 'react'
import { Card, Table, Form, Input, DatePicker, Radio, Button, Space, Tag, Typography, Modal, Row, Col, App as AntApp } from 'antd'
import dayjs from 'dayjs'

import API from "@/libs/api"
import { usePopup, useConfigLabelMap, useConfigSelect } from '@/store'
import routes from "@/libs/routes"
import { useAllData } from '@/hooks/useListPage'
import { noColumn, tagColumn } from '@/hooks/columnHelpers'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const LIMIT = 20

export default function Page() {
    const { message } = AntApp.useApp()
    const reportStatusLabelMap = useConfigLabelMap('reportStatuses')
    const reportStatusOptions = useConfigSelect('reportStatuses', true)
    const reportReasonLabelMap = useConfigLabelMap('reportReasons')

    const [page, setPage] = useState(1)
    const [dateRange, setDateRange] = useState(null)
    const [keyword, setKeyword] = useState('')
    const [reportType, setReportType] = useState('')
    const [status, setStatus] = useState('')
    const [searchParams, setSearchParams] = useState({ dateRange: null, keyword: '', reportType: '', status: '' })

    // Process modal
    const [processOpen, setProcessOpen] = useState(false)
    const [processItem, setProcessItem] = useState(null)
    const [processStatus, setProcessStatus] = useState('pending')
    const [processNote, setProcessNote] = useState('')

    // Reason modal
    const [reasonOpen, setReasonOpen] = useState(false)
    const [reasonText, setReasonText] = useState('')

    const { allData, loading, reload } = useAllData({
        url: '/admin/content/report/list',
        params: {},
        deps: ['report'],
    })

    const filteredData = useMemo(() => {
        const s = searchParams
        return allData.filter(item => {
            // keyword: reporter nickname
            if (s.keyword) {
                const kw = s.keyword.toLowerCase()
                if (!item.reporter?.nickname?.toLowerCase().includes(kw)) return false
            }
            // date range
            if (s.dateRange?.[0] || s.dateRange?.[1]) {
                if (!item.createdAt) return false
                const d = dayjs(item.createdAt)
                if (s.dateRange[0] && d.isBefore(dayjs(s.dateRange[0]), 'day')) return false
                if (s.dateRange[1] && d.isAfter(dayjs(s.dateRange[1]), 'day')) return false
            }
            // reportType
            if (s.reportType && item.reportType !== s.reportType) return false
            // status
            if (s.status && item.status !== s.status) return false
            return true
        })
    }, [allData, searchParams])

    const totalCount = filteredData.length
    const pagedData = filteredData.slice((page - 1) * LIMIT, page * LIMIT)

    const handleSearch = () => {
        setSearchParams({ dateRange, keyword, reportType, status })
        setPage(1)
    }

    const handleReset = () => {
        setDateRange(null)
        setKeyword('')
        setReportType('')
        setStatus('')
        setSearchParams({ dateRange: null, keyword: '', reportType: '', status: '' })
        setPage(1)
    }

    const openReasonModal = (item) => {
        setReasonText(item.detail || item.reason || '-')
        setReasonOpen(true)
    }

    const openProcessModal = (item) => {
        setProcessItem(item)
        setProcessStatus(item.status || 'pending')
        setProcessNote(item.adminNote || '')
        setProcessOpen(true)
    }

    const handleProcessSave = async () => {
        await API.post('/admin/content/report/process', {
            idx: processItem.idx,
            status: processStatus,
            adminNote: processNote,
        })
        message.success('처리되었습니다.')
        setProcessOpen(false)
        setProcessItem(null)
        reload()
    }

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        {
            title: '신고일시',
            dataIndex: 'createdAt',
            width: 170,
            align: 'center',
            render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '',
        },
        {
            title: '신고자',
            width: 160,
            render: (_, r) => (
                <div>
                    <div>{r.reporter?.nickname || '-'}</div>
                </div>
            ),
        },
        {
            title: '신고대상',
            width: 160,
            render: (_, r) => (
                <div>
                    <div>{r.reported?.nickname || '-'}</div>
                </div>
            ),
        },
        {
            title: '구분',
            dataIndex: 'reportType',
            width: 100,
            align: 'center',
            render: (v) => (
                <Tag color={v === 'user' ? 'blue' : 'orange'}>
                    {v === 'user' ? '회원' : '게시물'}
                </Tag>
            ),
        },
        {
            title: '신고사유',
            dataIndex: 'reason',
            ellipsis: true,
            render: (v) => reportReasonLabelMap[v] || v,
        },
        {
            title: '기타신고사유',
            width: 130,
            align: 'center',
            render: (_, r) => r.detail ? (
                <a onClick={() => openReasonModal(r)}>보기</a>
            ) : '-',
        },
        {
            title: '처리',
            width: 100,
            align: 'center',
            render: (_, r) => r.status === 'resolved' ? (
                <Tag color="green" style={{ cursor: 'pointer' }} onClick={() => openProcessModal(r)}>
                    {reportStatusLabelMap['resolved'] || '처리완료'}
                </Tag>
            ) : (
                <Button size="small" onClick={() => openProcessModal(r)}>처리</Button>
            ),
        },
    ]

    return (
        <>
            <Typography.Title level={4} style={{ marginBottom: 16 }}>신고 관리</Typography.Title>

            <Card style={{ marginBottom: 24 }}>
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="일자" style={{ marginBottom: 12 }}>
                                <RangePicker value={dateRange} onChange={setDateRange} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="검색" style={{ marginBottom: 12 }}>
                                <Input
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onPressEnter={handleSearch}
                                    placeholder="닉네임, 이름"
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="구분" style={{ marginBottom: 12 }}>
                                <Radio.Group value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                    <Radio value="">전체</Radio>
                                    <Radio value="post">게시물신고</Radio>
                                    <Radio value="user">회원신고</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16} align="middle">
                        <Col flex="auto">
                            <Form.Item label="처리상태" style={{ marginBottom: 0 }}>
                                <Radio.Group value={status} onChange={(e) => setStatus(e.target.value)}>
                                    {reportStatusOptions.map(opt => (
                                        <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
                                    ))}
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col>
                            <Space style={{ marginTop: 4 }}>
                                <Button onClick={handleReset}>초기화</Button>
                                <Button type="primary" onClick={handleSearch}>검색</Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </Card>

            <Table
                columns={columns}
                dataSource={pagedData}
                rowKey="idx"
                loading={loading}
                locale={{ emptyText: '데이터가 없습니다' }}
                pagination={{
                    current: page,
                    pageSize: LIMIT,
                    total: totalCount,
                    onChange: (p) => setPage(p),
                    showTotal: (total) => `검색결과 ${total}건`,
                }}
            />

            {/* 기타신고사유 Modal */}
            <Modal
                title="기타 신고사유"
                open={reasonOpen}
                onCancel={() => setReasonOpen(false)}
                footer={<Button onClick={() => setReasonOpen(false)}>확인</Button>}
            >
                <p style={{ whiteSpace: 'pre-wrap' }}>{reasonText}</p>
            </Modal>

            {/* 처리 Modal */}
            <Modal
                title="처리"
                open={processOpen}
                onCancel={() => setProcessOpen(false)}
                onOk={handleProcessSave}
                okText="저장"
                cancelText="취소"
            >
                <div style={{ marginBottom: 16 }}>
                    <span style={{ marginRight: 12 }}>처리상태</span>
                    <Radio.Group value={processStatus} onChange={(e) => setProcessStatus(e.target.value)}>
                        {reportStatusOptions.filter(opt => opt.value).map(opt => (
                            <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
                        ))}
                    </Radio.Group>
                </div>
                <div>
                    <span>내용</span>
                    <Input.TextArea
                        rows={4}
                        value={processNote}
                        onChange={(e) => setProcessNote(e.target.value)}
                        placeholder="내용 입력"
                        style={{ marginTop: 8 }}
                    />
                </div>
            </Modal>
        </>
    )
}
