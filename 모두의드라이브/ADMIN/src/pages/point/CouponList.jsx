import { useState, useEffect, useMemo } from 'react';
import { Card, Table, Descriptions, Form, Input, InputNumber, DatePicker, Button, Space, Typography, Row, Col, Modal, Upload, App as AntApp } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import DaumPostcode from 'react-daum-postcode';
import API from "@/libs/api";
import { STORAGE_URL } from '@/libs/consts';
import { useAllData, useDetailView } from '@/hooks/useListPage';
import { noColumn, dateColumn } from '@/hooks/columnHelpers';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const LIMIT = 20;

const defaultForm = {
    storeName: '',
    storeAddress: '',
    storeAddressDetail: '',
    couponName: '',
    validDays: null,
    imageFile: null,
    imageUrl: '',
};

export default function Page() {
    const { message, modal } = AntApp.useApp();
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [dateRange, setDateRange] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchDateRange, setSearchDateRange] = useState(null);
    const [isPostOpen, setIsPostOpen] = useState(false);

    const { allData, loading, reload } = useAllData({
        url: '/admin/operate/coupon/list',
        params: {},
        deps: ['coupon'],
    });

    const filteredData = useMemo(() => {
        return allData.filter(item => {
            // keyword filter
            if (searchKeyword) {
                const kw = searchKeyword.toLowerCase();
                if (!(item.storeName?.toLowerCase().includes(kw) || item.couponName?.toLowerCase().includes(kw))) return false;
            }
            // date range filter
            if (searchDateRange?.[0] || searchDateRange?.[1]) {
                if (!item.createdAt) return false;
                const d = dayjs(item.createdAt);
                if (searchDateRange[0] && d.isBefore(dayjs(searchDateRange[0]), 'day')) return false;
                if (searchDateRange[1] && d.isAfter(dayjs(searchDateRange[1]), 'day')) return false;
            }
            return true;
        });
    }, [allData, searchKeyword, searchDateRange]);

    const totalCount = filteredData.length;
    const list = useMemo(() => filteredData.slice((page - 1) * LIMIT, page * LIMIT), [filteredData, page]);

    const { editItem, form, setForm, isNew, handleEdit: _handleEdit, handleNew: _handleNew, handleCancel: _handleCancel } = useDetailView(defaultForm);
    const [imagePreview, setImagePreview] = useState('');

    const handleNew = () => { _handleNew(); setImagePreview(''); };
    const handleCancel = () => { _handleCancel(); setImagePreview(''); };

    const handleImageUpload = (file) => {
        const reader = new FileReader();
        reader.onload = () => {
            const ext = file.name.split('.').pop().toLowerCase();
            setForm(prev => ({ ...prev, imageFile: { base: reader.result, ext } }));
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
        return false;
    };

    const handleSearch = () => {
        setSearchKeyword(keyword);
        setSearchDateRange(dateRange);
        setPage(1);
    };
    const handleReset = () => {
        setKeyword('');
        setDateRange(null);
        setSearchKeyword('');
        setSearchDateRange(null);
        setPage(1);
    };

    const handleExcelDownload = () => {
        if (filteredData.length === 0) return;
        const headers = ['NO', '발행일시', '매장명', '매장주소', '쿠폰명', '유효기간(일)'];
        const csvRows = [headers.join(',')];
        filteredData.forEach((item, i) => {
            const addr = [item.storeAddress, item.storeAddressDetail].filter(Boolean).join(' ');
            csvRows.push([
                filteredData.length - i,
                item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : '',
                `"${(item.storeName || '').replace(/"/g, '""')}"`,
                `"${addr.replace(/"/g, '""')}"`,
                `"${(item.couponName || '').replace(/"/g, '""')}"`,
                item.validDays || '',
            ].join(','));
        });
        const bom = '﻿';
        const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `쿠폰관리_${dayjs().format('YYYYMMDD')}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    const handleAddrComplete = (data) => {
        setForm(prev => ({ ...prev, storeAddress: data.address }));
        setIsPostOpen(false);
    };

    const onEdit = (item) => {
        _handleEdit(item, (r) => ({
            storeName: r.storeName || '',
            storeAddress: r.storeAddress || '',
            storeAddressDetail: r.storeAddressDetail || '',
            couponName: r.couponName || '',
            validDays: r.validDays || null,
            imageFile: null,
            imageUrl: r.imageUrl || '',
        }));
        setImagePreview(item.imageUrl ? `${STORAGE_URL}${item.imageUrl}` : '');
    };

    const handleSave = () => {
        if (!form.storeName?.trim()) { message.error('매장명을 입력해주세요.'); return; }
        if (!form.storeAddress?.trim()) { message.error('매장주소를 입력해주세요.'); return; }
        if (!form.couponName?.trim()) { message.error('쿠폰명을 입력해주세요.'); return; }
        if (!form.validDays) { message.error('유효기간을 입력해주세요.'); return; }
        if (!form.imageUrl && !form.imageFile) { message.error('쿠폰 이미지를 등록해주세요.'); return; }

        modal.confirm({
            title: '저장',
            content: '저장하시겠습니까?',
            okText: '확인',
            cancelText: '취소',
            onOk: async () => {
                const params = {
                    storeName: form.storeName,
                    storeAddress: form.storeAddress,
                    storeAddressDetail: form.storeAddressDetail,
                    couponName: form.couponName,
                    validDays: form.validDays,
                    imageUrl: form.imageUrl,
                };
                if (form.imageFile) params.imageFile = form.imageFile;
                if (editItem?.idx) params.idx = editItem.idx;
                const { error } = await API.post('/admin/operate/coupon/save', params);
                if (!error) {
                    message.success('저장되었습니다.');
                    handleCancel();
                    reload();
                }
            },
        });
    };

    const handleDelete = (idx) => {
        modal.confirm({
            title: '삭제',
            content: (
                <div>
                    <p>이 쿠폰을 삭제하시겠습니까?</p>
                    <p style={{ color: '#999', fontSize: 12 }}>삭제해도 이미 회원에게 지급된 쿠폰은 유지됩니다.</p>
                </div>
            ),
            okText: '삭제',
            okButtonProps: { danger: true },
            cancelText: '취소',
            onOk: async () => {
                const { error } = await API.post('/admin/operate/coupon/delete', { idx });
                if (!error) {
                    message.success('삭제되었습니다.');
                    handleCancel();
                    reload();
                }
            },
        });
    };

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        dateColumn('발행 일시', 'createdAt'),
        { title: '매장명', dataIndex: 'storeName', width: 150, ellipsis: true, render: (v) => v || '-' },
        {
            title: '매장주소',
            width: 250,
            ellipsis: true,
            render: (_, r) => {
                const addr = [r.storeAddress, r.storeAddressDetail].filter(Boolean).join(' ');
                return addr || '-';
            },
        },
        {
            title: '쿠폰명',
            dataIndex: 'couponName',
            width: 200,
            ellipsis: true,
            render: (v, r) => (
                <a style={{ textDecoration: 'underline' }} onClick={() => onEdit(r)}>{v || '-'}</a>
            ),
        },
        {
            title: '유효기간',
            dataIndex: 'validDays',
            width: 100,
            align: 'center',
            render: (v) => v ? `${v}일` : '-',
        },
    ];

    if (editItem) {
        return (
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Title level={4} style={{ margin: 0 }}>{isNew ? '쿠폰 등록' : '쿠폰 상세보기'}</Title>
                    {!isNew && (
                        <Button danger onClick={() => handleDelete(editItem.idx)}>삭제하기</Button>
                    )}
                </div>

                <Descriptions bordered column={1} styles={{ label: { width: 150 } }}>
                    {!isNew && (
                        <Descriptions.Item label="등록 일시">
                            {editItem.createdAt ? dayjs(editItem.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                        </Descriptions.Item>
                    )}
                    <Descriptions.Item label={<span>매장명 <span style={{ color: 'red' }}>*</span></span>}>
                        <Input
                            placeholder="매장명을 입력하세요"
                            value={form.storeName}
                            onChange={e => setForm(prev => ({ ...prev, storeName: e.target.value }))}
                        />
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>매장주소 <span style={{ color: 'red' }}>*</span></span>}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                                <Input
                                    value={form.storeAddress}
                                    readOnly
                                    placeholder="주소검색 버튼을 눌러 주소를 입력하세요"
                                    style={{ width: 360 }}
                                />
                                <Button onClick={() => setIsPostOpen(true)}>주소검색</Button>
                            </Space>
                            <Input
                                placeholder="상세주소를 입력하세요"
                                value={form.storeAddressDetail}
                                onChange={e => setForm(prev => ({ ...prev, storeAddressDetail: e.target.value }))}
                            />
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>쿠폰명 <span style={{ color: 'red' }}>*</span></span>}>
                        <Input
                            placeholder="쿠폰명을 입력하세요"
                            value={form.couponName}
                            onChange={e => setForm(prev => ({ ...prev, couponName: e.target.value }))}
                        />
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>유효기간 <span style={{ color: 'red' }}>*</span></span>}>
                        <Space direction="vertical">
                            <Space>
                                <InputNumber
                                    min={1}
                                    placeholder="숫자 입력"
                                    value={form.validDays}
                                    onChange={v => setForm(prev => ({ ...prev, validDays: v }))}
                                    style={{ width: 120 }}
                                />
                                <span>일</span>
                            </Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                (회원에게 지급된일로부터 유효기간까지 사용 가능)
                            </Text>
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>쿠폰이미지 <span style={{ color: 'red' }}>*</span></span>}>
                        <Space direction="vertical" size="small">
                            <Upload
                                accept="image/*"
                                showUploadList={false}
                                beforeUpload={handleImageUpload}
                            >
                                <Button icon={<UploadOutlined />}>이미지 선택</Button>
                            </Upload>
                            <Text type="secondary" style={{ fontSize: 12 }}>권장 비율 1:1</Text>
                            {imagePreview && <img src={imagePreview} alt="쿠폰 미리보기" style={{ width: 200, height: 200, objectFit: 'cover', marginTop: 8, display: 'block', borderRadius: 4 }} />}
                        </Space>
                    </Descriptions.Item>
                </Descriptions>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Space>
                        <Button onClick={handleCancel}>취소</Button>
                        <Button type="primary" onClick={handleSave}>저장</Button>
                    </Space>
                </div>

                <Modal
                    open={isPostOpen}
                    onCancel={() => setIsPostOpen(false)}
                    footer={null}
                    title="주소 검색"
                    width={600}
                    destroyOnHidden
                >
                    <DaumPostcode onComplete={handleAddrComplete} autoClose={false} style={{ height: 450 }} />
                </Modal>
            </Card>
        );
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Title level={4} style={{ margin: 0 }}>쿠폰 관리</Title>
                    <Text type="secondary">총 {totalCount.toLocaleString()}건</Text>
                </div>
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={handleExcelDownload}>엑셀 다운로드</Button>
                    <Button type="primary" onClick={handleNew}>+쿠폰 등록</Button>
                </Space>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Row gutter={16} align="bottom">
                    <Col span={8}>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', marginBottom: 4 }}>등록 일시</label>
                            <RangePicker
                                style={{ width: '100%' }}
                                value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                                onChange={(dates) => setDateRange(dates ? [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')] : null)}
                            />
                        </div>
                    </Col>
                    <Col span={8}>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', marginBottom: 4 }}>검색어</label>
                            <Input
                                placeholder="매장명, 쿠폰명"
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                                onPressEnter={handleSearch}
                                allowClear
                            />
                        </div>
                    </Col>
                    <Col span={8} style={{ textAlign: 'right' }}>
                        <div style={{ marginBottom: 12 }}>
                            <Space>
                                <Button onClick={handleReset}>초기화</Button>
                                <Button type="primary" onClick={handleSearch}>검색</Button>
                            </Space>
                        </div>
                    </Col>
                </Row>
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
                    showTotal: (total) => `목록 ${LIMIT}개`,
                }}
                size="small"
                bordered
                scroll={{ x: 'max-content' }}
            />
        </>
    );
}
