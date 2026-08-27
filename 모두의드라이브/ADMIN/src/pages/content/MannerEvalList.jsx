import { useState, useMemo } from 'react';
import { Card, Table, Form, Input, DatePicker, InputNumber, Button, Space, Typography, Row, Col, Modal, Descriptions, App as AntApp } from 'antd';
import dayjs from 'dayjs';
import { useAllData } from '@/hooks/useListPage';
import { noColumn, dateColumn } from '@/hooks/columnHelpers';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const LIMIT = 20;

const initialFilters = {
    dateRange: null,
    keyword: '',
    scoreMin: null,
    scoreMax: null,
};

export default function Page() {
    const { message } = AntApp.useApp();
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ ...initialFilters });
    const [searchParams, setSearchParams] = useState({ ...initialFilters });
    const [detail, setDetail] = useState(null);

    const { allData, loading } = useAllData({
        url: '/admin/content/manner-eval/list',
        params: {},
        deps: ['manner_eval'],
    });

    const filteredData = useMemo(() => {
        const s = searchParams;
        return allData.filter(item => {
            if (s.keyword) {
                const kw = s.keyword.toLowerCase();
                const hit = (item.evaluatorNickname || '').toLowerCase().includes(kw)
                    || (item.targetNickname || '').toLowerCase().includes(kw)
                    || (item.evaluatorEmail || '').toLowerCase().includes(kw)
                    || (item.targetEmail || '').toLowerCase().includes(kw);
                if (!hit) return false;
            }
            if (s.dateRange?.[0] || s.dateRange?.[1]) {
                if (!item.createdAt) return false;
                const d = dayjs(item.createdAt);
                if (s.dateRange[0] && d.isBefore(s.dateRange[0], 'day')) return false;
                if (s.dateRange[1] && d.isAfter(s.dateRange[1], 'day')) return false;
            }
            if (s.scoreMin != null && (item.score ?? 0) < s.scoreMin) return false;
            if (s.scoreMax != null && (item.score ?? 0) > s.scoreMax) return false;
            return true;
        });
    }, [allData, searchParams]);

    const totalCount = filteredData.length;
    const pagedData = filteredData.slice((page - 1) * LIMIT, page * LIMIT);

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
        const headers = ['NO', '등록일', '평가자 닉네임', '평가자 이메일', '대상자 닉네임', '대상자 이메일', '점수', '내용'];
        const csvRows = [headers.join(',')];
        const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        filteredData.forEach((item, i) => {
            csvRows.push([
                filteredData.length - i,
                item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : '',
                escape(item.evaluatorNickname || ''),
                escape(item.evaluatorEmail || ''),
                escape(item.targetNickname || ''),
                escape(item.targetEmail || ''),
                item.score ?? '',
                escape(item.content || ''),
            ].join(','));
        });
        const bom = '﻿';
        const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `매너평가_${dayjs().format('YYYYMMDD')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        dateColumn('등록일', 'createdAt', { format: 'YYYY-MM-DD HH:mm', width: 140 }),
        {
            title: '평가자',
            width: 180,
            ellipsis: true,
            render: (_, r) => (
                <div>
                    <div>{r.evaluatorNickname || '-'}</div>
                    {r.evaluatorEmail && <Text type="secondary" style={{ fontSize: 12 }}>{r.evaluatorEmail}</Text>}
                </div>
            ),
        },
        {
            title: '대상자',
            width: 180,
            ellipsis: true,
            render: (_, r) => (
                <div>
                    <div>{r.targetNickname || '-'}</div>
                    {r.targetEmail && <Text type="secondary" style={{ fontSize: 12 }}>{r.targetEmail}</Text>}
                </div>
            ),
        },
        {
            title: '점수',
            dataIndex: 'score',
            width: 80,
            align: 'center',
            render: (v) => v ?? '-',
        },
        {
            title: '평가내용',
            dataIndex: 'content',
            ellipsis: true,
            render: (v, r) => v ? (
                <a onClick={() => setDetail(r)}>{v.length > 50 ? v.slice(0, 50) + '...' : v}</a>
            ) : '-',
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Title level={4} style={{ margin: 0 }}>매너 평가 조회</Title>
                    <Text type="secondary">총 {totalCount.toLocaleString()}건</Text>
                </div>
                <Button onClick={handleExcelDownload}>엑셀 다운로드</Button>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="등록일" style={{ marginBottom: 12 }}>
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
                                    placeholder="평가자/대상자 닉네임 또는 이메일"
                                    value={filters.keyword}
                                    onChange={e => handleFilterChange('keyword', e.target.value)}
                                    onPressEnter={searchFunc}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="점수" style={{ marginBottom: 12 }}>
                                <Space>
                                    <InputNumber placeholder="최소" value={filters.scoreMin} onChange={val => handleFilterChange('scoreMin', val)} min={0} max={100} controls={false} style={{ width: 100 }} />
                                    <span>~</span>
                                    <InputNumber placeholder="최대" value={filters.scoreMax} onChange={val => handleFilterChange('scoreMax', val)} min={0} max={100} controls={false} style={{ width: 100 }} />
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
                dataSource={pagedData}
                rowKey="idx"
                loading={loading}
                locale={{ emptyText: '데이터가 없습니다' }}
                pagination={{
                    current: page,
                    total: totalCount,
                    pageSize: LIMIT,
                    onChange: (p) => setPage(p),
                    showTotal: (total) => `총 ${total}건`,
                }}
            />

            <Modal
                title="매너 평가 상세"
                open={!!detail}
                onCancel={() => setDetail(null)}
                footer={<Button onClick={() => setDetail(null)}>닫기</Button>}
                width={560}
            >
                {detail && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="등록일">{detail.createdAt ? dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                        <Descriptions.Item label="평가자">
                            {detail.evaluatorNickname || '-'}
                            {detail.evaluatorEmail && <div><Text type="secondary" style={{ fontSize: 12 }}>{detail.evaluatorEmail}</Text></div>}
                        </Descriptions.Item>
                        <Descriptions.Item label="대상자">
                            {detail.targetNickname || '-'}
                            {detail.targetEmail && <div><Text type="secondary" style={{ fontSize: 12 }}>{detail.targetEmail}</Text></div>}
                        </Descriptions.Item>
                        <Descriptions.Item label="점수">{detail.score ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="평가 항목">
                            {/* [C118-1] itemLabels 우선, 빈 경우 items(키) 라도 노출 */}
                            {Array.isArray(detail.itemLabels) && detail.itemLabels.length > 0
                                ? detail.itemLabels.join(', ')
                                : (Array.isArray(detail.items) && detail.items.length > 0
                                    ? detail.items.join(', ')
                                    : '-')}
                        </Descriptions.Item>
                        <Descriptions.Item label="평가 내용">
                            <div style={{ whiteSpace: 'pre-wrap' }}>{detail.content || '-'}</div>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </>
    );
}
