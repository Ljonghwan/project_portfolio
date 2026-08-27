import { useState, useMemo } from 'react';
import { Card, Table, Form, Input, Select, DatePicker, Button, Space, Typography, Row, Col } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAllData } from '@/hooks/useListPage';
import { noColumn, dateColumn } from '@/hooks/columnHelpers';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const LIMIT = 20;

const NOSHOW_REASON = '노쇼 차감';

const initialFilters = {
    dateRange: null,
    keyword: '',
    reason: '',
};

export default function Page() {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ ...initialFilters });
    const [searchParams, setSearchParams] = useState({ ...initialFilters });

    const { allData, loading } = useAllData({
        url: '/admin/point/list',
        params: { types: ['spend', 'penalty'] },
        deps: ['point_spend'],
    });

    const reasonOptions = useMemo(() => {
        const unique = Array.from(new Set(allData.map(it => it.reason).filter(Boolean)));
        unique.sort((a, b) => a.localeCompare(b, 'ko'));
        return [{ value: '', label: '전체' }, ...unique.map(r => ({ value: r, label: r }))];
    }, [allData]);

    const filteredData = useMemo(() => {
        const s = searchParams;
        return allData.filter(item => {
            if (s.keyword) {
                const kw = s.keyword.toLowerCase();
                if (!(item.user?.email?.toLowerCase().includes(kw) ||
                      item.user?.name?.toLowerCase().includes(kw) ||
                      item.user?.nickname?.toLowerCase().includes(kw))) return false;
            }
            if (s.dateRange?.[0] || s.dateRange?.[1]) {
                if (!item.createdAt) return false;
                const d = dayjs(item.createdAt);
                if (s.dateRange[0] && d.isBefore(s.dateRange[0], 'day')) return false;
                if (s.dateRange[1] && d.isAfter(s.dateRange[1], 'day')) return false;
            }
            if (s.reason && item.reason !== s.reason) return false;
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
        if (filteredData.length === 0) return;
        const headers = ['NO', '사용일시', '아이디', '이름', '닉네임', '사용포인트', '사용내역'];
        const csvRows = [headers.join(',')];
        filteredData.forEach((item, i) => {
            csvRows.push([
                filteredData.length - i,
                item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : '',
                item.user?.email || '',
                item.user?.name || '',
                item.user?.nickname || '',
                item.amount || 0,
                `"${(item.reason || '').replace(/"/g, '""')}"`,
            ].join(','));
        });
        const bom = '﻿';
        const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `사용내역_${dayjs().format('YYYYMMDD')}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        dateColumn('사용일시', 'createdAt'),
        { title: '아이디', dataIndex: ['user', 'email'], width: 220, render: (v) => v || '-' },
        { title: '이름', dataIndex: ['user', 'name'], width: 100, render: (v) => v || '-' },
        { title: '닉네임', dataIndex: ['user', 'nickname'], width: 100, render: (v) => v || '-' },
        {
            title: '사용포인트', dataIndex: 'amount', width: 120, align: 'right',
            render: (v, record) => (
                <span style={{ color: record.reason === NOSHOW_REASON ? 'red' : undefined }}>
                    {(v || 0).toLocaleString()}P
                </span>
            ),
        },
        {
            title: '사용내역', dataIndex: 'reason', width: 180,
            render: (v) => (
                <span style={{ color: v === NOSHOW_REASON ? 'red' : undefined }}>
                    {v || '-'}
                </span>
            ),
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>사용 내역</Title>
                <Text type="secondary">총 {totalCount.toLocaleString()}건</Text>
                <div style={{ marginLeft: 'auto' }}>
                    <Button icon={<DownloadOutlined />} onClick={handleExcelDownload}>엑셀 다운로드</Button>
                </div>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Form layout="vertical">
                    <Row gutter={16} align="bottom">
                        <Col span={8}>
                            <Form.Item label="사용일시" style={{ marginBottom: 12 }}>
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
                        <Col span={4}>
                            <Form.Item label="사용내역" style={{ marginBottom: 12 }}>
                                <Select
                                    value={filters.reason}
                                    onChange={(val) => handleFilterChange('reason', val)}
                                    options={reasonOptions}
                                />
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
                rowClassName={(record) => record.reason === NOSHOW_REASON ? 'ant-table-row-danger' : ''}
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

            <style>{`
                .ant-table-row-danger td {
                    background-color: #fff1f0 !important;
                }
            `}</style>
        </>
    );
}
