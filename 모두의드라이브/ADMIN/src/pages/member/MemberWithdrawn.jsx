import { useState, useEffect, useMemo } from 'react'
import { Card, Table, Form, Input, DatePicker, Radio, Button, Space, Tag, Typography, Row, Col, App as AntApp, Badge } from 'antd'
import dayjs from 'dayjs'
import API from "@/libs/api"
import { useConfigLabelMap, useConfigSelect } from '@/store'
import { useAllData } from '@/hooks/useListPage'
import { noColumn, dateColumn } from '@/hooks/columnHelpers'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const LIMIT = 20

const initialFilters = {
    dateRange: null,
    memberType: '',
    keyword: '',
    gender: '',
}

const maskEmail = (email) => {
    if (!email) return '-'
    const [local, domain] = email.split('@')
    if (!local) return email
    if (local.length <= 2) return local + '***' + (domain ? '@' + domain : '')
    return local.slice(0, 2) + '***' + (domain ? '@' + domain : '')
}

const maskName = (name) => {
    if (!name) return '-'
    if (name.length <= 1) return name + '***'
    return name.slice(0, 1) + '*'.repeat(name.length - 1)
}

export default function Page() {
    const { message, modal } = AntApp.useApp()
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState({ ...initialFilters })
    const [searchParams, setSearchParams] = useState({ ...initialFilters })
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [deleteLoading, setDeleteLoading] = useState(false)
    const roleLabelMap = useConfigLabelMap('roles')
    const genderLabelMap = useConfigLabelMap('genders')
    const genderOptions = useConfigSelect('genders')

    // 전체 데이터 가져오기
    const { allData, loading, reload } = useAllData({
        url: '/admin/member/list',
        params: { status: 'withdrawn' },
        deps: ['withdrawn'],
    })

    // 프론트 필터링
    const filteredData = useMemo(() => {
        const s = searchParams
        return allData.filter(item => {
            if (s.keyword) {
                const kw = s.keyword.toLowerCase()
                if (!(item.name?.toLowerCase().includes(kw) ||
                      item.nickname?.toLowerCase().includes(kw) ||
                      item.phone?.includes(kw) ||
                      item.email?.toLowerCase().includes(kw))) return false
            }
            if (s.dateRange?.[0] || s.dateRange?.[1]) {
                const d = item.withdrawnAt ? dayjs(item.withdrawnAt) : null
                if (!d) return false
                if (s.dateRange[0] && d.isBefore(s.dateRange[0], 'day')) return false
                if (s.dateRange[1] && d.isAfter(s.dateRange[1], 'day')) return false
            }
            if (s.memberType && item.role !== s.memberType) return false
            if (s.gender && item.gender !== s.gender) return false
            return true
        })
    }, [allData, searchParams])

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

    const handleDeleteSelected = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('익명화 처리할 항목을 선택해주세요.')
            return
        }
        modal.confirm({
            title: `선택한 ${selectedRowKeys.length}건의 회원을 익명화 처리하시겠습니까?`,
            content: (
                <div>
                    <p style={{ marginTop: 0, marginBottom: 8 }}>이 작업은 되돌릴 수 없으며, 회원의 개인정보(PII)가 즉시 익명화됩니다.</p>
                    <ul style={{ paddingLeft: 18, marginTop: 0, marginBottom: 8 }}>
                        <li>이름·닉네임·이메일·연락처·생년월일·성별 등 식별정보 제거</li>
                        <li>프로필 이미지·자기소개·관심사·거주지역 등 프로필 정보 제거</li>
                        <li>SNS 로그인 정보, 푸시 토큰 등 인증/연결 정보 제거</li>
                        <li>닉네임은 <code>탈퇴회원_&#123;idx&#125;</code> 형태로 치환</li>
                        <li>회원 상태가 <strong>익명화 처리됨</strong>(anonymized)으로 변경</li>
                    </ul>
                    <p style={{ marginBottom: 0, color: '#1d39c4' }}>매칭·게시글·포인트·후기 등 연관 데이터는 그대로 유지됩니다.</p>
                </div>
            ),
            width: 560,
            okText: '익명화 처리',
            okType: 'danger',
            cancelText: '취소',
            onOk: async () => {
                setDeleteLoading(true)
                try {
                    await API.post('/admin/member/withdrawn/delete', { idxList: selectedRowKeys })
                    message.success('익명화 처리되었습니다.')
                    setSelectedRowKeys([])
                    reload()
                } catch (e) {
                    message.error('익명화 처리 중 오류가 발생했습니다.')
                } finally {
                    setDeleteLoading(false)
                }
            },
        })
    }

    const handleExcelDownload = () => {
        // 엑셀은 필터된 전체 데이터를 사용
        if (filteredData.length === 0) { message.warning('다운로드할 데이터가 없습니다.'); return; }
        const headers = ['NO', '가입일시', '회원유형', '성별', '이메일(ID)', '이름', '닉네임', '포인트', '탈퇴사유', '탈퇴일시'];
        const csvRows = [headers.join(',')];
        filteredData.forEach((item, i) => {
            csvRows.push([
                filteredData.length - i,
                item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : '',
                roleLabelMap[item.role] || item.role,
                genderLabelMap[item.gender] || '',
                maskEmail(item.email),
                maskName(item.name),
                item.nickname || '',
                item.pointBalance || 0,
                `"${(item.withdrawReason || '').replace(/"/g, '""')}"`,
                item.withdrawnAt ? dayjs(item.withdrawnAt).format('YYYY-MM-DD HH:mm') : ''
            ].join(','));
        });
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `탈퇴회원_${dayjs().format('YYYYMMDD')}.csv`;
        a.click(); URL.revokeObjectURL(url);
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
    }

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        dateColumn('가입일시', 'createdAt'),
        {
            title: '회원유형',
            dataIndex: 'role',
            key: 'role',
            width: 100,
            align: 'center',
            render: (val) => (
                <Tag color={val === 'owner' ? 'blue' : 'green'}>
                    {roleLabelMap[val] || val}
                </Tag>
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
            title: '이메일(ID)',
            dataIndex: 'email',
            key: 'email',
            render: (val) => maskEmail(val),
        },
        {
            title: '이름',
            dataIndex: 'name',
            key: 'name',
            width: 100,
            render: (val) => maskName(val),
        },
        {
            title: '닉네임',
            dataIndex: 'nickname',
            key: 'nickname',
            render: (val) => val || '-',
        },
        {
            title: '포인트',
            dataIndex: 'pointBalance',
            key: 'pointBalance',
            width: 120,
            align: 'right',
            render: (val) => {
                const v = val || 0
                const text = v.toLocaleString()
                return v < 0
                    ? <span style={{ color: '#ff4d4f' }}>{text}</span>
                    : text
            },
        },
        {
            title: '탈퇴사유',
            dataIndex: 'withdrawReason',
            key: 'withdrawReason',
            ellipsis: true,
            render: (val) => val || '-',
        },
        dateColumn('탈퇴일시', 'withdrawnAt'),
    ]

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>탈퇴회원</Title>
                <Text type="secondary">총 {totalCount.toLocaleString()}명</Text>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="탈퇴일" style={{ marginBottom: 12 }}>
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
                            <Form.Item label="회원유형" style={{ marginBottom: 12 }}>
                                <Radio.Group
                                    value={filters.memberType}
                                    onChange={e => handleFilterChange('memberType', e.target.value)}
                                >
                                    <Radio value="">전체</Radio>
                                    <Radio value="owner">오너</Radio>
                                    <Radio value="guest">게스트</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Space>
                    <Text>검색결과 {totalCount.toLocaleString()}</Text>
                    <Badge count={selectedRowKeys.length} size="small">
                        <Button
                            danger
                            onClick={handleDeleteSelected}
                            loading={deleteLoading}
                            disabled={selectedRowKeys.length === 0}
                        >
                            선택 목록 익명화 처리
                        </Button>
                    </Badge>
                </Space>
                <Button onClick={handleExcelDownload}>엑셀 다운로드</Button>
            </div>

            <Table
                rowSelection={rowSelection}
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
        </>
    )
}
