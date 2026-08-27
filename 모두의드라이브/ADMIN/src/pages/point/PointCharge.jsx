import { useState, useEffect, useMemo } from 'react';
import { Card, Table, Form, Input, DatePicker, Radio, Button, Space, Tag, Typography, Row, Col, Descriptions } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePopup } from '@/store';
import { useAllData } from '@/hooks/useListPage';
import { noColumn, dateColumn, numberColumn } from '@/hooks/columnHelpers';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PAYMENT_METHOD_LABELS = {
    card: '카드결제',
    kakaopay: '카카오페이',
    iap_google: '인앱(구글)',
    iap_apple: '인앱(애플)',
};

const LIMIT = 20;

const initialFilters = {
    dateRange: null,
    keyword: '',
    paymentMethod: '',
    paymentStatus: '',
};

export default function Page() {
    const { openPopup } = usePopup();

    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ ...initialFilters });
    const [searchParams, setSearchParams] = useState({ ...initialFilters });

    const { allData, loading, reload } = useAllData({
        url: '/admin/point/charges',
        params: {},
        deps: ['point_charges'],
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
            // 결제수단
            if (s.paymentMethod && item.paymentMethod !== s.paymentMethod) return false;
            // 결제상태
            if (s.paymentStatus && item.paymentStatus !== s.paymentStatus) return false;
            return true;
        });
    }, [allData, searchParams]);

    const totalCount = filteredData.length;
    const list = filteredData.slice((page - 1) * LIMIT, page * LIMIT);

    // 통계: 필터된 데이터 기준
    const stats = useMemo(() => {
        let totalCharge = 0; // 충전포인트 합계
        let totalPayment = 0; // 결제완료 금액 합계
        let totalCancelled = 0; // 결제취소 금액 합계
        let completedCount = 0;
        let cancelledCount = 0;
        filteredData.forEach(item => {
            const amount = item.amount || 0;
            const paymentAmount = item.paymentAmount || 0;
            if (item.paymentStatus === 'completed') {
                totalCharge += amount;
                totalPayment += paymentAmount;
                completedCount++;
            } else if (item.paymentStatus === 'cancelled') {
                totalCancelled += paymentAmount;
                cancelledCount++;
            }
        });
        return { totalCharge, totalPayment, totalCancelled, completedCount, cancelledCount };
    }, [filteredData]);

    const periodLabel = useMemo(() => {
        const s = searchParams;
        if (s.dateRange?.[0] || s.dateRange?.[1]) {
            const start = s.dateRange?.[0] ? dayjs(s.dateRange[0]).format('YYYY-MM-DD') : '';
            const end = s.dateRange?.[1] ? dayjs(s.dateRange[1]).format('YYYY-MM-DD') : '';
            return `${start} ~ ${end}`;
        }
        return '전체 기간';
    }, [searchParams]);

    const handleExcelDownload = () => {
        if (filteredData.length === 0) return;
        const headers = ['NO', '결제일시', '아이디', '이름', '닉네임', '충전포인트', '결제금액', '결제상태', '결제수단'];
        const csvRows = [headers.join(',')];
        const paymentStatusLabel = { completed: '결제완료', cancelled: '결제취소' };
        filteredData.forEach((item, i) => {
            csvRows.push([
                filteredData.length - i,
                item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : '',
                item.user?.email || '',
                item.user?.name || '',
                item.user?.nickname || '',
                item.amount || 0,
                item.paymentAmount || 0,
                paymentStatusLabel[item.paymentStatus] || item.paymentStatus || '',
                PAYMENT_METHOD_LABELS[item.paymentMethod] || item.paymentMethod || '',
            ].map(v => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v).join(','));
        });
        const bom = '﻿';
        const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `충전내역_${dayjs().format('YYYYMMDD')}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

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

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        dateColumn('결제일시', 'createdAt'),
        { title: '아이디', dataIndex: ['user', 'email'], width: 220, render: (v) => v || '-' },
        { title: '이름', dataIndex: ['user', 'name'], width: 100, render: (v) => v || '-' },
        { title: '닉네임', dataIndex: ['user', 'nickname'], width: 100, render: (v) => v || '-' },
        numberColumn('충전포인트', 'amount'),
        {
            title: '결제금액', dataIndex: 'paymentAmount', width: 120, align: 'right',
            render: (v, record) => (
                <span style={{ color: record.paymentStatus === 'cancelled' ? 'red' : undefined }}>
                    {(v || 0).toLocaleString()}
                </span>
            ),
        },
        {
            title: '결제상태', dataIndex: 'paymentStatus', width: 100, align: 'center',
            render: (v) => {
                if (v === 'completed') return <Tag color="green">결제완료</Tag>;
                if (v === 'cancelled') return <Tag color="red">결제취소</Tag>;
                return v || '-';
            },
        },
        {
            title: '결제수단', dataIndex: 'paymentMethod', width: 120, align: 'center',
            render: (v) => PAYMENT_METHOD_LABELS[v] || v || '-',
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>충전 내역</Title>
                <Text type="secondary">총 {totalCount.toLocaleString()}건</Text>
                <div style={{ marginLeft: 'auto' }}>
                    <Button icon={<DownloadOutlined />} onClick={handleExcelDownload}>엑셀 다운로드</Button>
                </div>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="결제일시" style={{ marginBottom: 12 }}>
                                <RangePicker
                                    value={filters.dateRange}
                                    onChange={(val) => handleFilterChange('dateRange', val)}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="검색어" style={{ marginBottom: 12 }}>
                                <Input
                                    placeholder="이메일, 이름, 닉네임"
                                    value={filters.keyword}
                                    onChange={e => handleFilterChange('keyword', e.target.value)}
                                    onPressEnter={searchFunc}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="결제상태" style={{ marginBottom: 12 }}>
                                <Radio.Group
                                    value={filters.paymentStatus}
                                    onChange={e => handleFilterChange('paymentStatus', e.target.value)}
                                >
                                    <Radio value="">전체</Radio>
                                    <Radio value="completed">결제완료</Radio>
                                    <Radio value="cancelled">결제취소</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16} align="middle">
                        <Col flex="auto">
                            <Form.Item label="결제수단" style={{ marginBottom: 0 }}>
                                <Radio.Group
                                    value={filters.paymentMethod}
                                    onChange={e => handleFilterChange('paymentMethod', e.target.value)}
                                >
                                    <Radio value="">전체</Radio>
                                    <Radio value="card">카드결제</Radio>
                                    <Radio value="kakaopay">카카오페이</Radio>
                                    <Radio value="iap_apple">인앱(애플)</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col>
                            <Space style={{ marginTop: 4 }}>
                                <Button onClick={resetFunc}>초기화</Button>
                                <Button type="primary" onClick={searchFunc}>검색</Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </Card>

            <Card size="small" style={{ marginBottom: 16 }}>
                <Descriptions bordered column={4} size="small">
                    <Descriptions.Item label="조회기간">{periodLabel}</Descriptions.Item>
                    <Descriptions.Item label="총 충전포인트">
                        {stats.totalCharge.toLocaleString()} P ({stats.completedCount.toLocaleString()}건)
                    </Descriptions.Item>
                    <Descriptions.Item label="총 결제금액">
                        {stats.totalPayment.toLocaleString()} 원 ({stats.completedCount.toLocaleString()}건)
                    </Descriptions.Item>
                    <Descriptions.Item label="총 결제취소">
                        <span style={{ color: stats.totalCancelled > 0 ? '#cf1322' : undefined }}>
                            {stats.totalCancelled.toLocaleString()} 원 ({stats.cancelledCount.toLocaleString()}건)
                        </span>
                    </Descriptions.Item>
                </Descriptions>
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
                }}
                size="small"
                bordered
                scroll={{ x: 'max-content' }}
            />
        </>
    );
}
