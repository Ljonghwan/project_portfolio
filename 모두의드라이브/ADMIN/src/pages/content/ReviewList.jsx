import { useState, useMemo } from 'react'
import { Card, Table, Form, Input, DatePicker, Radio, Button, Space, Tag, Typography, Modal, Descriptions, Image, Row, Col, App as AntApp, Popconfirm } from 'antd'
import dayjs from 'dayjs'

import API from "@/libs/api"
import { STORAGE_URL } from '@/libs/consts'
import { useAllData } from '@/hooks/useListPage'
import { noColumn } from '@/hooks/columnHelpers'

const { Text } = Typography
const { RangePicker } = DatePicker

const LIMIT = 20

const getSnsLabel = (socialType) => {
    switch (socialType) {
        case 'kakao': return '카카오'
        case 'naver': return '네이버'
        case 'apple': return '애플'
        case 'google': return '구글'
        default: return ''
    }
}

export default function Page() {
    const { message } = AntApp.useApp()
    const [page, setPage] = useState(1)
    const [dateRange, setDateRange] = useState(null)
    const [keyword, setKeyword] = useState('')
    const [status, setStatus] = useState('all')
    const [searchParams, setSearchParams] = useState({ dateRange: null, keyword: '', status: 'all' })

    // Popup states
    const [driveOpen, setDriveOpen] = useState(false)
    const [driveData, setDriveData] = useState(null)
    const [manageOpen, setManageOpen] = useState(false)
    const [manageData, setManageData] = useState(null)
    const [manageVisibility, setManageVisibility] = useState('visible')

    const { allData, loading, reload } = useAllData({
        url: '/admin/content/drive-review/list',
        params: {},
        deps: ['review'],
    })

    const filteredData = useMemo(() => {
        const s = searchParams
        return allData.filter(item => {
            // keyword: user nickname or content
            if (s.keyword) {
                const kw = s.keyword.toLowerCase()
                if (!(item.user?.nickname?.toLowerCase().includes(kw) || item.content?.toLowerCase().includes(kw))) return false
            }
            // date range
            if (s.dateRange?.[0] || s.dateRange?.[1]) {
                if (!item.createdAt) return false
                const d = dayjs(item.createdAt)
                if (s.dateRange[0] && d.isBefore(dayjs(s.dateRange[0]), 'day')) return false
                if (s.dateRange[1] && d.isAfter(dayjs(s.dateRange[1]), 'day')) return false
            }
            // status: visible/hidden
            if (s.status && s.status !== 'all') {
                if (s.status === 'visible' && item.isHidden) return false
                if (s.status === 'hidden' && !item.isHidden) return false
            }
            return true
        })
    }, [allData, searchParams])

    const totalCount = filteredData.length
    const pagedData = filteredData.slice((page - 1) * LIMIT, page * LIMIT)

    const handleSearch = () => {
        setSearchParams({ dateRange, keyword, status })
        setPage(1)
    }

    const handleReset = () => {
        setDateRange(null)
        setKeyword('')
        setStatus('all')
        setSearchParams({ dateRange: null, keyword: '', status: 'all' })
        setPage(1)
    }

    const openDrive = (item) => { setDriveData(item); setDriveOpen(true) }
    const openManage = (item) => { setManageData(item); setManageVisibility(item.isHidden ? 'hidden' : 'visible'); setManageOpen(true) }

    const handleManageSave = async () => {
        const { error } = await API.post('/admin/content/drive-review/toggle', {
            idx: manageData.idx,
            isHidden: manageVisibility === 'hidden',
        })
        if (!error) {
            message.success('저장되었습니다.')
            setManageOpen(false)
            reload()
        }
    }

    const handleManageDelete = async () => {
        await API.post('/admin/content/drive-review/delete', { idx: manageData.idx })
        message.success('삭제되었습니다.')
        setManageOpen(false)
        reload()
    }

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        {
            title: '등록일자',
            dataIndex: 'createdAt',
            width: 120,
            align: 'center',
            render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '',
        },
        {
            title: '작성자',
            width: 300,
            ellipsis: true,
            render: (_, r) => (
                <div>
                    <div>{r.user?.nickname || '-'}</div>
                    {r.user?.email && <Text type="secondary" style={{ fontSize: 12 }}>{r.user?.email}</Text>}
                </div>
            ),
        },
        {
            title: '드라이브후기',
            dataIndex: 'content',
            ellipsis: true,
            render: (v, r) => v ? (
                <a onClick={() => openDrive(r)}>{v.length > 50 ? v.slice(0, 50) + '...' : v}</a>
            ) : '-',
        },
        {
            title: '관리',
            width: 100,
            align: 'center',
            render: (_, r) => (
                <Tag
                    color={r.isHidden ? 'red' : 'green'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openManage(r)}
                >
                    {r.isHidden ? '비노출' : '노출'}
                </Tag>
            ),
        },
    ]

    return (
        <>
            <Typography.Title level={4} style={{ marginBottom: 16 }}>드라이브후기 관리</Typography.Title>

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
                                    placeholder="닉네임, 제목"
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="상태" style={{ marginBottom: 12 }}>
                                <Radio.Group value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <Radio value="all">전체</Radio>
                                    <Radio value="visible">노출</Radio>
                                    <Radio value="hidden">비노출</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24} style={{ textAlign: 'right' }}>
                            <Space>
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
                    showTotal: (total) => `총 ${total}건`,
                }}
            />

            {/* 드라이브후기 Modal */}
            <Modal
                title="드라이브후기 상세"
                open={driveOpen}
                onCancel={() => setDriveOpen(false)}
                footer={<Button onClick={() => setDriveOpen(false)}>닫기</Button>}
                width={560}
            >
                {driveData && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="작성자">{driveData.user?.nickname || '-'}</Descriptions.Item>
                        <Descriptions.Item label="리뷰 내용">{driveData.content || '-'}</Descriptions.Item>
                        <Descriptions.Item label="사진">
                            {driveData.photos?.length > 0 ? (
                                <Image.PreviewGroup>
                                    <Space wrap>
                                        {driveData.photos.map((photo, i) => (
                                            <Image
                                                key={i}
                                                src={photo.imageUrl ? `${STORAGE_URL}${photo.imageUrl}` : undefined}
                                                width={100}
                                                height={100}
                                                style={{ objectFit: 'cover', borderRadius: 4 }}
                                            />
                                        ))}
                                    </Space>
                                </Image.PreviewGroup>
                            ) : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="코스">
                            {driveData.courses?.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: 16 }}>
                                    {driveData.courses.map((course, i) => (
                                        <li key={i} style={{ marginBottom: 4 }}>
                                            <Text strong>{course.placeName}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 12 }}>{course.roadAddress || course.address}</Text>
                                        </li>
                                    ))}
                                </ul>
                            ) : '-'}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            {/* 관리 Modal */}
            <Modal
                title="드라이브후기 관리"
                open={manageOpen}
                onCancel={() => setManageOpen(false)}
                footer={null}
                width={400}
            >
                <div style={{ marginBottom: 20 }}>
                    <Radio.Group value={manageVisibility} onChange={(e) => setManageVisibility(e.target.value)}>
                        <Radio value="visible">노출</Radio>
                        <Radio value="hidden">비노출</Radio>
                    </Radio.Group>
                </div>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Popconfirm
                        title="이 후기를 삭제하시겠습니까?"
                        onConfirm={handleManageDelete}
                        okText="삭제"
                        cancelText="취소"
                    >
                        <Button danger>삭제하기</Button>
                    </Popconfirm>
                    <Button type="primary" onClick={handleManageSave}>저장</Button>
                </Space>
            </Modal>
        </>
    )
}
