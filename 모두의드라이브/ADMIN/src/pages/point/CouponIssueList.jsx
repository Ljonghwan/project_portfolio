import { useState, useEffect, useMemo } from 'react';
import { Card, Table, Form, Input, InputNumber, DatePicker, Radio, Select, Button, Space, Tag, Typography, Row, Col, App as AntApp } from 'antd';
import dayjs from 'dayjs';
import API from "@/libs/api";
import { useConfigLabelMap } from '@/store';
import { useAllData } from '@/hooks/useListPage';
import { noColumn, dateColumn } from '@/hooks/columnHelpers';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const LIMIT = 20;

const STATUS_LABELS = {
    active: '사용전',
    used: '사용완료',
    expired: '만료',
};

const STATUS_COLORS = {
    active: 'blue',
    used: 'green',
    expired: 'default',
};

const initialFilters = {
    dateRange: null,
    keyword: '',
    status: '',
};

// ─── List View ──────────────────────────────────────────────────────────────

export default function Page() {
    const { message } = AntApp.useApp();
    const [view, setView] = useState('list'); // 'list' | 'issue'

    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ ...initialFilters });
    const [searchParams, setSearchParams] = useState({ ...initialFilters });

    const { allData, loading, reload } = useAllData({
        url: '/admin/operate/coupon-issue/list',
        params: {},
        deps: ['coupon_issue'],
    });

    const filteredData = useMemo(() => {
        const s = searchParams;
        return allData.filter(item => {
            // 키워드 검색
            if (s.keyword) {
                const kw = s.keyword.toLowerCase();
                if (!(item.user?.email?.toLowerCase().includes(kw) ||
                      item.user?.name?.toLowerCase().includes(kw) ||
                      item.user?.nickname?.toLowerCase().includes(kw))) return false;
            }
            // 날짜 필터
            if (s.dateRange?.[0] || s.dateRange?.[1]) {
                if (!item.createdAt) return false;
                const d = dayjs(item.createdAt);
                if (s.dateRange[0] && d.isBefore(s.dateRange[0], 'day')) return false;
                if (s.dateRange[1] && d.isAfter(s.dateRange[1], 'day')) return false;
            }
            // 상태
            if (s.status && item.status !== s.status) return false;
            return true;
        });
    }, [allData, searchParams]);

    const totalCount = filteredData.length;
    const list = filteredData.slice((page - 1) * LIMIT, page * LIMIT);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const searchFunc = () => {
        setSearchParams({ ...filters });
        setPage(1);
    };

    const resetFunc = () => {
        setFilters({ ...initialFilters });
        setSearchParams({ ...initialFilters });
        setPage(1);
    };

    const handleExcelDownload = () => {
        if (filteredData.length === 0) { message.warning('다운로드할 데이터가 없습니다.'); return; }
        const headers = ['NO', '발행 일시', '매장명', '매장주소', '쿠폰명', '아이디', '닉네임', '유효기간', '상태'];
        const csvRows = [headers.join(',')];
        filteredData.forEach((item, i) => {
            const statusLabel = item.status === 'used'
                ? `사용완료(${item.usedAt ? dayjs(item.usedAt).format('YYYY.MM.DD HH:mm') : ''})`
                : STATUS_LABELS[item.status] || item.status || '';
            csvRows.push([
                filteredData.length - i,
                item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : '',
                item.coupon?.storeName || '',
                item.coupon?.storeAddress || '',
                item.coupon?.couponName || '',
                item.user?.email || '',
                item.user?.nickname || '',
                item.expireAt ? dayjs(item.expireAt).format('YYYY-MM-DD') : '',
                statusLabel,
            ].join(','));
        });
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `쿠폰발행내역_${dayjs().format('YYYYMMDD')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        dateColumn('발행 일시', 'createdAt'),
        {
            title: '매장명',
            width: 150,
            ellipsis: true,
            render: (_, r) => r.coupon?.storeName || '-',
        },
        {
            title: '매장주소',
            width: 200,
            ellipsis: true,
            render: (_, r) => r.coupon?.storeAddress || '-',
        },
        {
            title: '쿠폰명',
            width: 180,
            ellipsis: true,
            render: (_, r) => r.coupon?.couponName || '-',
        },
        {
            title: '아이디',
            width: 180,
            ellipsis: true,
            render: (_, r) => r.user?.email || '-',
        },
        {
            title: '닉네임',
            width: 120,
            render: (_, r) => r.user?.nickname || '-',
        },
        {
            title: '유효기간',
            width: 130,
            align: 'center',
            render: (_, r) => r.expireAt ? dayjs(r.expireAt).format('YYYY-MM-DD') : '-',
        },
        {
            title: '상태',
            dataIndex: 'status',
            width: 180,
            align: 'center',
            render: (v, r) => {
                if (v === 'used') {
                    return (
                        <Tag color={STATUS_COLORS.used}>
                            사용완료{r.usedAt ? `(${dayjs(r.usedAt).format('YYYY.MM.DD HH:mm')})` : ''}
                        </Tag>
                    );
                }
                return <Tag color={STATUS_COLORS[v] || 'default'}>{STATUS_LABELS[v] || v || '-'}</Tag>;
            },
        },
    ];

    if (view === 'issue') {
        return (
            <IssueView
                onBack={() => { setView('list'); reload(); }}
            />
        );
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Title level={4} style={{ margin: 0 }}>쿠폰 발행 내역</Title>
                    <Text type="secondary">총 {totalCount.toLocaleString()}건</Text>
                </div>
                <Space>
                    <Button onClick={handleExcelDownload}>엑셀 다운로드</Button>
                    <Button type="primary" onClick={() => setView('issue')}>+쿠폰 발행</Button>
                </Space>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Form layout="vertical">
                    <Row gutter={16} align="bottom">
                        <Col span={6}>
                            <Form.Item label="발행 일시" style={{ marginBottom: 12 }}>
                                <RangePicker
                                    value={filters.dateRange}
                                    onChange={(val) => handleFilterChange('dateRange', val)}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="검색어" style={{ marginBottom: 12 }}>
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
                            <Form.Item label="상태" style={{ marginBottom: 12 }}>
                                <Radio.Group
                                    value={filters.status}
                                    onChange={e => handleFilterChange('status', e.target.value)}
                                >
                                    <Radio value="">전체</Radio>
                                    <Radio value="active">사용전</Radio>
                                    <Radio value="used">사용완료</Radio>
                                    <Radio value="expired">만료</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col span={4} style={{ textAlign: 'right' }}>
                            <Form.Item style={{ marginBottom: 12 }}>
                                <Space>
                                    <Button onClick={resetFunc}>초기화</Button>
                                    <Button type="primary" onClick={searchFunc}>검색</Button>
                                </Space>
                            </Form.Item>
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
                    showSizeChanger: false,
                    showTotal: () => `목록 ${LIMIT}개`,
                }}
                size="small"
                bordered
                scroll={{ x: 'max-content' }}
            />
        </>
    );
}

// ─── Issue View ──────────────────────────────────────────────────────────────

function IssueView({ onBack }) {
    const { message, modal } = AntApp.useApp();
    const roleLabelMap = useConfigLabelMap('roles');
    const [searchForm] = Form.useForm();
    const [userList, setUserList] = useState([]);
    const [userCount, setUserCount] = useState(null); // null = 아직 검색 전
    const [searchLoading, setSearchLoading] = useState(false);
    const [couponOptions, setCouponOptions] = useState([]);
    const [selectedCouponIdx, setSelectedCouponIdx] = useState(null);
    const [issueLoading, setIssueLoading] = useState(false);
    const [selectedUserKeys, setSelectedUserKeys] = useState([]);

    useEffect(() => {
        loadCouponOptions();
    }, []);

    const loadCouponOptions = async () => {
        const { data } = await API.post('/admin/operate/coupon/options');
        setCouponOptions(data || []);
    };

    const handleSearch = async () => {
        const values = searchForm.getFieldsValue();
        const [matchDateStart, matchDateEnd] = values.matchDateRange || [];

        setSearchLoading(true);
        try {
            const params = {
                matchDateStart: matchDateStart ? matchDateStart.format('YYYY-MM-DD') : '',
                matchDateEnd: matchDateEnd ? matchDateEnd.format('YYYY-MM-DD') : '',
                role: values.role || '',
                matchCountMin: values.matchCountMin ?? null,
                matchCountMax: values.matchCountMax ?? null,
                mannerScoreMin: values.mannerScoreMin ?? null,
                mannerScoreMax: values.mannerScoreMax ?? null,
            };
            const { data } = await API.post('/admin/operate/coupon-issue/search-users', params);
            const users = data?.list || [];
            setUserList(users);
            setUserCount(data?.totalCount ?? 0);
            // 검색 결과 갱신 시 기본 전체 선택
            setSelectedUserKeys(users.map(u => u.idx));
        } finally {
            setSearchLoading(false);
        }
    };

    const handleReset = () => {
        searchForm.resetFields();
        setUserList([]);
        setUserCount(null);
        setSelectedCouponIdx(null);
        setSelectedUserKeys([]);
    };

    const handleIssue = () => {
        if (!selectedCouponIdx) { message.error('쿠폰을 선택해주세요.'); return; }
        if (userList.length === 0) { message.error('지급할 회원이 없습니다.'); return; }
        if (selectedUserKeys.length === 0) { message.error('지급할 회원을 선택해주세요.'); return; }

        modal.confirm({
            title: '쿠폰 지급',
            content: `선택한 ${selectedUserKeys.length.toLocaleString()}명에게 쿠폰을 지급하시겠습니까?`,
            okText: '네',
            cancelText: '아니오',
            onOk: async () => {
                setIssueLoading(true);
                try {
                    const { error } = await API.post('/admin/operate/coupon-issue/issue', {
                        couponIdx: selectedCouponIdx,
                        userIdxList: selectedUserKeys,
                    });
                    if (!error) {
                        modal.success({
                            content: '지급되었습니다.',
                            okText: '확인',
                            onOk: () => onBack(),
                        });
                    }
                } finally {
                    setIssueLoading(false);
                }
            },
        });
    };

    const rowSelection = {
        selectedRowKeys: selectedUserKeys,
        onChange: (keys) => setSelectedUserKeys(keys),
    };

    const userColumns = [
        {
            title: 'NO',
            width: 60,
            align: 'center',
            render: (_, __, i) => i + 1,
        },
        {
            title: '회원 구분',
            dataIndex: 'role',
            width: 100,
            align: 'center',
            render: (v) => roleLabelMap[v] || v,
        },
        {
            title: '아이디',
            dataIndex: 'email',
            width: 200,
            ellipsis: true,
            render: (v) => v || '-',
        },
        {
            title: '닉네임',
            dataIndex: 'nickname',
            width: 130,
            render: (v) => v || '-',
        },
        {
            title: '매칭횟수',
            dataIndex: 'matchCount',
            width: 100,
            align: 'center',
            render: (v) => v ?? 0,
        },
        {
            title: '매너점수',
            dataIndex: 'mannerScore',
            width: 100,
            align: 'center',
            render: (v) => v == null ? '-' : Math.round(Number(v)),
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>쿠폰 발행</Title>
                <Button onClick={onBack}>← 목록으로</Button>
            </div>

            {/* 검색 필터 */}
            <Card style={{ marginBottom: 24 }}>
                <Form form={searchForm} layout="vertical" initialValues={{ role: '' }}>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="매칭기간" name="matchDateRange" style={{ marginBottom: 12 }}>
                                <RangePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="회원 유형" name="role" style={{ marginBottom: 12 }}>
                                <Radio.Group>
                                    <Radio value="">전체</Radio>
                                    <Radio value="owner">오너</Radio>
                                    <Radio value="guest">게스트</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16} align="bottom">
                        <Col span={8}>
                            <Form.Item label="매칭횟수" style={{ marginBottom: 12 }}>
                                <Space>
                                    <Form.Item name="matchCountMin" noStyle>
                                        <InputNumber min={0} placeholder="최소" style={{ width: 100 }} />
                                    </Form.Item>
                                    <span>~</span>
                                    <Form.Item name="matchCountMax" noStyle>
                                        <InputNumber min={0} placeholder="최대" style={{ width: 100 }} />
                                    </Form.Item>
                                    <span>회</span>
                                </Space>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="매너점수" style={{ marginBottom: 12 }}>
                                <Space>
                                    <Form.Item name="mannerScoreMin" noStyle>
                                        <InputNumber min={0} placeholder="최소" style={{ width: 100 }} />
                                    </Form.Item>
                                    <span>~</span>
                                    <Form.Item name="mannerScoreMax" noStyle>
                                        <InputNumber min={0} placeholder="최대" style={{ width: 100 }} />
                                    </Form.Item>
                                    <span>점</span>
                                </Space>
                            </Form.Item>
                        </Col>
                        <Col span={8} style={{ textAlign: 'right' }}>
                            <Form.Item style={{ marginBottom: 12 }}>
                                <Space>
                                    <Button onClick={handleReset}>초기화</Button>
                                    <Button type="primary" onClick={handleSearch} loading={searchLoading}>검색</Button>
                                </Space>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {/* 검색 결과 + 지급 */}
            {userCount !== null && (
                <Card style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text strong style={{ fontSize: 16 }}>
                            대상 {userCount.toLocaleString()}명
                            {userCount > 0 && (
                                <Text style={{ fontSize: 14, marginLeft: 12, color: '#1d39c4' }}>
                                    (선택 {selectedUserKeys.length.toLocaleString()}명)
                                </Text>
                            )}
                        </Text>
                        <Space>
                            <Select
                                placeholder="매장명 선택"
                                style={{ width: 200 }}
                                value={selectedCouponIdx}
                                onChange={(val) => setSelectedCouponIdx(val)}
                                options={couponOptions.map(c => ({
                                    label: `[${c.storeName}] ${c.couponName}`,
                                    value: c.idx,
                                }))}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            />
                            <Button
                                type="primary"
                                onClick={handleIssue}
                                loading={issueLoading}
                                disabled={!selectedCouponIdx || selectedUserKeys.length === 0}
                            >
                                지급하기 ({selectedUserKeys.length.toLocaleString()}명)
                            </Button>
                        </Space>
                    </div>

                    <Table
                        rowSelection={rowSelection}
                        columns={userColumns}
                        dataSource={userList}
                        rowKey="idx"
                        loading={searchLoading}
                        locale={{ emptyText: '검색 결과가 없습니다' }}
                        pagination={false}
                        size="small"
                        bordered
                        scroll={{ x: 'max-content' }}
                    />
                </Card>
            )}
        </>
    );
}
