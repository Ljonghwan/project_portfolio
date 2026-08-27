import { useState, useEffect, useMemo } from 'react'
import { Card, Table, Form, Input, Select, DatePicker, Radio, Button, Space, Tag, Typography, Descriptions, Image, Row, Col, App as AntApp } from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

import API from "@/libs/api"
import { STORAGE_URL } from '@/libs/consts'
import routes from '@/libs/routes'
import { useConfigSelect, useConfigLabelMap } from '@/store'

import { useAllData } from '@/hooks/useListPage'
import { noColumn } from '@/hooks/columnHelpers'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker

const LIMIT = 20

export default function Page() {
    const { message, modal } = AntApp.useApp()
    const navigate = useNavigate()
    const categoryOptions = useConfigSelect('inquiryCategories', true)
    const categoryLabelMap = useConfigLabelMap('inquiryCategories')
    const inquiryStatusLabelMap = useConfigLabelMap('inquiryStatuses')

    const [page, setPage] = useState(1)
    const [dateRange, setDateRange] = useState(null)
    const [category, setCategory] = useState('')
    const [status, setStatus] = useState('')
    const [keyword, setKeyword] = useState('')
    const [searchParams, setSearchParams] = useState({ dateRange: null, category: '', status: '', keyword: '' })

    const [editItem, setEditItem] = useState(null)
    const [replyContent, setReplyContent] = useState('')
    const [noshowStatus, setNoshowStatus] = useState('confirmed')
    const [replyStatus, setReplyStatus] = useState('pending')
    const [originalStatus, setOriginalStatus] = useState('pending')

    const { allData, loading, reload } = useAllData({
        url: '/admin/content/inquiry/list',
        params: {},
        deps: ['inquiry'],
    })

    const filteredData = useMemo(() => {
        const s = searchParams
        return allData.filter(item => {
            // keyword: user nickname/name
            if (s.keyword) {
                const kw = s.keyword.toLowerCase()
                if (!(item.user?.nickname?.toLowerCase().includes(kw) || item.user?.name?.toLowerCase().includes(kw))) return false
            }
            // date range
            if (s.dateRange?.[0] || s.dateRange?.[1]) {
                if (!item.createdAt) return false
                const d = dayjs(item.createdAt)
                if (s.dateRange[0] && d.isBefore(dayjs(s.dateRange[0]), 'day')) return false
                if (s.dateRange[1] && d.isAfter(dayjs(s.dateRange[1]), 'day')) return false
            }
            // category
            if (s.category && item.category !== s.category) return false
            // status
            if (s.status && item.status !== s.status) return false
            return true
        })
    }, [allData, searchParams])

    const totalCount = filteredData.length
    const pagedData = filteredData.slice((page - 1) * LIMIT, page * LIMIT)

    const handleSearch = () => {
        setSearchParams({ dateRange, category, status, keyword })
        setPage(1)
    }

    const handleReset = () => {
        setDateRange(null)
        setCategory('')
        setStatus('')
        setKeyword('')
        setSearchParams({ dateRange: null, category: '', status: '', keyword: '' })
        setPage(1)
    }

    const handleDetail = async (item) => {
        history.pushState({ ...history.state, detail: true, page }, '')
        const { data } = await API.post('/admin/content/inquiry/detail', { idx: item.idx })
        if (!data) return
        setEditItem(data)
        setReplyContent(data.reply || '')
        setNoshowStatus(data.noshowStatus || 'confirmed')
        setReplyStatus(data.status === 'replied' ? 'replied' : 'pending')
        setOriginalStatus(data.status === 'replied' ? 'replied' : 'pending')
    }

    const handleCancel = () => {
        setEditItem(null)
        setReplyContent('')
    }

    const handleSave = async () => {
        const params = {
            idx: editItem.idx,
            reply: replyContent,
            status: replyStatus === 'replied' ? 'replied' : 'pending',
        }
        if (editItem.category === 'noshow') {
            params.noshowStatus = noshowStatus
        }
        const { error } = await API.post('/admin/content/inquiry/reply', params)
        if (!error) {
            message.success('저장되었습니다.')
            handleCancel()
            reload()
        }
    }

    const handleDelete = () => {
        modal.confirm({
            title: '삭제 확인',
            content: '이 문의를 삭제하시겠습니까?',
            okText: '삭제',
            cancelText: '취소',
            okType: 'danger',
            onOk: async () => {
                await API.post('/admin/content/inquiry/delete', { idx: editItem.idx })
                message.success('삭제되었습니다.')
                handleCancel()
                reload()
            },
        })
    }

    // Detail view
    if (editItem) {
        return (
            <>
                <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>문의 상세보기</Title>
                    <Button danger onClick={handleDelete}>삭제하기</Button>
                </Space>

                <Card>
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="등록일시">{editItem.createdAt ? dayjs(editItem.createdAt).format('YYYY-MM-DD HH:mm') : ''}</Descriptions.Item>
                        <Descriptions.Item label="닉네임">{editItem.user?.nickname || '-'}</Descriptions.Item>
                        <Descriptions.Item label="이름">{editItem.user?.name || '-'}</Descriptions.Item>
                        <Descriptions.Item label="분류">{categoryLabelMap[editItem.category] || editItem.category}</Descriptions.Item>
                        {editItem.category === 'noshow' && editItem.match?.idx && (
                            <Descriptions.Item label="매칭">
                                <a onClick={() => navigate(`${routes.match}?openIdx=${editItem.match.idx}`)}>
                                    {(() => {
                                        const dests = (editItem.match.destinations || [])
                                            .slice()
                                            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                                        const sigungus = dests.map(d => d.sigungu).filter(Boolean).join(', ')
                                        return `${sigungus || '-'} 드라이브`
                                    })()}
                                </a>
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="문의내용">
                            <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{editItem.content}</Paragraph>
                        </Descriptions.Item>
                        {editItem.images?.length > 0 && (
                            <Descriptions.Item label="첨부사진">
                                <Image.PreviewGroup>
                                    <Space wrap>
                                        {editItem.images.map((p, i) => (
                                            <Image
                                                key={i}
                                                src={`${STORAGE_URL}${p.imageUrl}`}
                                                width={80}
                                                height={80}
                                                style={{ objectFit: 'cover', cursor: 'pointer' }}
                                            />
                                        ))}
                                    </Space>
                                </Image.PreviewGroup>
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="답변">
                            <Input.TextArea
                                rows={6}
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="내용을 입력하세요."
                            />
                        </Descriptions.Item>
                        {editItem.category === 'noshow' && (
                            <Descriptions.Item label="노쇼여부">
                                <Radio.Group value={noshowStatus} onChange={(e) => setNoshowStatus(e.target.value)}>
                                    <Radio value="confirmed">노쇼확정</Radio>
                                    <Radio value="cancelled">노쇼취소</Radio>
                                </Radio.Group>
                                <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                                    노쇼확정 = 1만포인트 차감 / 노쇼취소 = 차감된 포인트 환불
                                </div>
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="답변여부">
                            <Radio.Group value={replyStatus} onChange={(e) => setReplyStatus(e.target.value)}>
                                <Radio value="pending" disabled={originalStatus === 'replied'}>
                                    {inquiryStatusLabelMap['pending'] || '미답변'}
                                </Radio>
                                <Radio value="replied">{inquiryStatusLabelMap['replied'] || '답변완료'}</Radio>
                            </Radio.Group>
                            <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                                {inquiryStatusLabelMap['replied'] || '답변완료'} 처리해야 회원에게 답변이 노출됩니다.
                                {originalStatus === 'replied' && ' (이미 답변 완료된 문의는 미답변으로 되돌릴 수 없습니다.)'}
                            </div>
                        </Descriptions.Item>
                    </Descriptions>

                    <Space style={{ marginTop: 16, justifyContent: 'flex-end', width: '100%' }}>
                        <Button onClick={handleCancel}>취소</Button>
                        <Button type="primary" onClick={handleSave}>저장</Button>
                    </Space>
                </Card>
            </>
        )
    }

    const NOSHOW_STATUS_LABEL = {
        confirmed: '노쇼확정',
        cancelled: '노쇼취소',
    }
    const NOSHOW_STATUS_COLOR = {
        confirmed: 'red',
        cancelled: 'green',
    }

    // List view
    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        {
            title: '등록일자',
            dataIndex: 'createdAt',
            width: 170,
            align: 'center',
            render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '',
        },
        {
            title: '작성자',
            width: 180,
            render: (_, r) => (
                <div>
                    <div>{r.user?.nickname || '-'}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{r.user?.name || '-'}</Text>
                </div>
            ),
        },
        {
            title: '분류명',
            dataIndex: 'category',
            width: 140,
            align: 'center',
            render: (v, r) => (
                <Space direction="vertical" size={2} style={{ alignItems: 'center' }}>
                    <span>{categoryLabelMap[v] || v}</span>
                    {v === 'noshow' && r.noshowStatus && (
                        <Tag color={NOSHOW_STATUS_COLOR[r.noshowStatus] || 'default'} style={{ marginRight: 0 }}>
                            {NOSHOW_STATUS_LABEL[r.noshowStatus] || r.noshowStatus}
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: '문의내용',
            dataIndex: 'content',
            ellipsis: true,
            render: (v, r) => (
                <a onClick={() => handleDetail(r)}>
                    {v?.length > 20 ? v.slice(0, 20) + '...' : v}
                </a>
            ),
        },
        {
            title: '처리',
            dataIndex: 'status',
            width: 100,
            align: 'center',
            render: (v, r) => (
                <Tag
                    color={v === 'replied' ? 'green' : 'red'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleDetail(r)}
                >
                    {inquiryStatusLabelMap[v] || v}
                </Tag>
            ),
        },
    ]

    return (
        <>
            <Typography.Title level={4} style={{ marginBottom: 16 }}>문의 관리</Typography.Title>

            <Card style={{ marginBottom: 24 }}>
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="일시" style={{ marginBottom: 12 }}>
                                <RangePicker value={dateRange} onChange={setDateRange} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="검색" style={{ marginBottom: 12 }}>
                                <Input
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onPressEnter={handleSearch}
                                    placeholder="닉네임, 아이디"
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="분류" style={{ marginBottom: 12 }}>
                                <Select
                                    value={category}
                                    onChange={setCategory}
                                    options={categoryOptions}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16} align="middle">
                        <Col flex="auto">
                            <Form.Item label="상태" style={{ marginBottom: 0 }}>
                                <Radio.Group value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <Radio value="">전체</Radio>
                                    <Radio value="pending">{inquiryStatusLabelMap['pending'] || '미답변'}</Radio>
                                    <Radio value="replied">{inquiryStatusLabelMap['replied'] || '답변완료'}</Radio>
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
        </>
    )
}
