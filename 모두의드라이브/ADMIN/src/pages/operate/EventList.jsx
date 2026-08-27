import { useState, useEffect, useMemo } from 'react';
import { Card, Table, Descriptions, Input, Radio, Checkbox, Button, Space, Tag, Typography, DatePicker, Upload, App as AntApp } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import API from "@/libs/api";
import { STORAGE_URL } from '@/libs/consts';
import TiptapEditor from '@/components/TiptapEditor';
import { useAllData, useDetailView } from '@/hooks/useListPage';
import { noColumn, dateColumn } from '@/hooks/columnHelpers';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const LIMIT = 20;

const defaultForm = { title: '', content: '', imageFile: null, imageUrl: '', isActive: true, pushSend: false, startDate: null, endDate: null };

export default function Page() {
    const { message, modal } = AntApp.useApp();
    const [page, setPage] = useState(1);

    const { allData, loading, reload } = useAllData({
        url: '/admin/operate/event/list',
        params: {},
        deps: ['event'],
    });

    const filteredData = useMemo(() => allData, [allData]);
    const totalCount = filteredData.length;
    const list = useMemo(() => filteredData.slice((page - 1) * LIMIT, page * LIMIT), [filteredData, page]);

    const { editItem, form, setForm, isNew, handleEdit: _handleEdit, handleNew: _handleNew, handleCancel: _handleCancel } = useDetailView(defaultForm);
    const [imagePreview, setImagePreview] = useState('');

    const handleEdit = async (item) => {
        const { data } = await API.post('/admin/operate/event/detail', { idx: item.idx });
        const it = data || item;
        _handleEdit(it, (it) => ({
            title: it.title || '',
            content: it.content || '',
            imageFile: null,
            imageUrl: it.imageUrl || '',
            isActive: !!it.isActive,
            pushSend: !!it.pushSend,
            startDate: it.startDate || null,
            endDate: it.endDate || null,
        }));
        setImagePreview(it.imageUrl ? `${STORAGE_URL}${it.imageUrl}` : '');
    };

    const handleNew = () => {
        _handleNew();
        setImagePreview('');
    };

    const handleCancel = () => {
        _handleCancel();
        setImagePreview('');
    };

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

    const isEmptyHtml = (html) => !html || html.replace(/<[^>]*>/g, '').trim() === '';

    const handleSave = () => {
        if (!form.title?.trim()) { message.error('제목을 입력해주세요.'); return; }
        if (!form.startDate || !form.endDate) { message.error('이벤트 기간을 입력해주세요.'); return; }
        if (!form.imageFile && !form.imageUrl) { message.error('배너 이미지를 등록해주세요.'); return; }
        if (isEmptyHtml(form.content)) { message.error('내용을 입력해주세요.'); return; }

        modal.confirm({
            title: '저장',
            content: '저장하시겠습니까?',
            okText: '확인',
            cancelText: '취소',
            onOk: async () => {
                const params = {
                    title: form.title,
                    content: form.content,
                    imageUrl: form.imageUrl,
                    isActive: form.isActive ? 1 : 0,
                    pushSend: form.pushSend ? 1 : 0,
                    startDate: form.startDate,
                    endDate: form.endDate,
                };
                if (form.imageFile) params.imageFile = form.imageFile;
                if (editItem?.idx) params.idx = editItem.idx;
                const { data, error } = await API.post('/admin/operate/event/save', params);
                if (!error) {
                    // 신규 등록 + 푸시발송 체크시 이벤트 시작일에 예약 발송
                    if (!editItem?.idx && form.pushSend) {
                        await API.post('/admin/operate/push/send', {
                            targetType: 'all',
                            title: '새로운 이벤트가 시작되었어요!',
                            body: form.title,
                            sendType: 'scheduled',
                            scheduledAt: form.startDate,
                            notifyType: 'notifyEvent',
                            sourceType: 'event',
                            sourceIdx: data?.idx,
                        });
                    }
                    message.success('저장되었습니다.');
                    handleCancel();
                    reload();
                }
            },
        });
    };

    const handleExcelDownload = () => {
        if (filteredData.length === 0) return;
        const headers = ['NO', '이벤트 제목', '이벤트 기간', '등록일시', '메인노출'];
        const csvRows = [headers.join(',')];
        filteredData.forEach((item, i) => {
            const period = item.startDate && item.endDate
                ? `${dayjs(item.startDate).format('YYYY-MM-DD HH:mm')} ~ ${dayjs(item.endDate).format('YYYY-MM-DD HH:mm')}`
                : '';
            csvRows.push([
                filteredData.length - i,
                `"${(item.title || '').replace(/"/g, '""')}"`,
                `"${period}"`,
                item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : '',
                item.isActive ? '노출' : '비노출',
            ].join(','));
        });
        const bom = '﻿';
        const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `이벤트_${dayjs().format('YYYYMMDD')}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    const handleDelete = (idx) => {
        modal.confirm({
            title: '삭제',
            content: '이 이벤트를 삭제하시겠습니까?',
            okText: '삭제',
            okButtonProps: { danger: true },
            cancelText: '취소',
            onOk: async () => {
                const { error } = await API.post('/admin/operate/event/delete', { idx });
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
        {
            title: '이벤트 제목',
            dataIndex: 'title',
            ellipsis: true,
            render: (text, record) => (
                <a style={{ textDecoration: 'underline' }} onClick={() => handleEdit(record)}>{text}</a>
            ),
        },
        {
            title: '이벤트 기간',
            width: 300,
            align: 'center',
            render: (_, r) => r.startDate && r.endDate
                ? `${dayjs(r.startDate).format('YYYY-MM-DD HH:mm')} ~ ${dayjs(r.endDate).format('YYYY-MM-DD HH:mm')}`
                : '-',
        },
        dateColumn('등록일시', 'createdAt'),
        {
            title: '메인노출',
            dataIndex: 'isActive',
            width: 100,
            align: 'center',
            render: (v) => v ? <Tag color="blue">노출</Tag> : <Tag>비노출</Tag>,
        },
    ];

    if (editItem) {
        return (
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Title level={4} style={{ margin: 0 }}>{isNew ? '이벤트 등록' : '이벤트 상세보기'}</Title>
                    {!isNew && (
                        <Button danger onClick={() => handleDelete(editItem.idx)}>삭제하기</Button>
                    )}
                </div>

                <Descriptions bordered column={1} styles={{ label: { width: 150 } }}>
                    {!isNew && (
                        <Descriptions.Item label="등록일시">{editItem.createdAt ? dayjs(editItem.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                    )}
                    <Descriptions.Item label={<span>제목 <span style={{ color: 'red' }}>*</span></span>}>
                        <Input placeholder="제목을 입력하세요" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>이벤트 기간 <span style={{ color: 'red' }}>*</span></span>}>
                        <RangePicker
                            showTime={{ format: 'HH:mm' }}
                            format="YYYY-MM-DD HH:mm"
                            value={form.startDate && form.endDate ? [dayjs(form.startDate), dayjs(form.endDate)] : null}
                            onChange={(dates) => {
                                setForm({
                                    ...form,
                                    startDate: dates ? dates[0].format('YYYY-MM-DD HH:mm:00') : null,
                                    endDate: dates ? dates[1].format('YYYY-MM-DD HH:mm:00') : null,
                                });
                            }}
                            style={{ width: 380 }}
                        />
                    </Descriptions.Item>
                    <Descriptions.Item label="메인배너노출">
                        <Radio.Group value={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.value })}>
                            <Radio value={true}>노출</Radio>
                            <Radio value={false}>비노출</Radio>
                        </Radio.Group>
                    </Descriptions.Item>
                    <Descriptions.Item label="푸시발송">
                        {!isNew && editItem.pushSend ? (
                            <Tag color="blue">이벤트 시작일에 푸시 발송 예약됨</Tag>
                        ) : isNew ? (
                            <Checkbox checked={form.pushSend} onChange={e => setForm({ ...form, pushSend: e.target.checked })}>
                                이벤트 시작일에 푸시 발송
                            </Checkbox>
                        ) : (
                            <Tag>발송 안함</Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>배너 이미지 <span style={{ color: 'red' }}>*</span></span>}>
                        <Space orientation="vertical" size="small">
                            <Upload
                                accept="image/*"
                                showUploadList={false}
                                beforeUpload={handleImageUpload}
                            >
                                <Button icon={<UploadOutlined />}>이미지 선택</Button>
                            </Upload>
                            <span style={{ color: '#999', fontSize: 12 }}>권장 비율: 350 x 80 (가로형 배너)</span>
                            {imagePreview && <img src={imagePreview} alt="배너 미리보기" style={{ width: 350, height: 80, objectFit: 'cover', marginTop: 8, display: 'block', borderRadius: 4 }} />}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>내용 <span style={{ color: 'red' }}>*</span></span>}>
                        <TiptapEditor
                            value={form.content}
                            onChange={(val) => setForm(prev => ({ ...prev, content: val }))}
                            placeholder="내용을 입력하세요"
                        />
                    </Descriptions.Item>
                </Descriptions>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Space>
                        <Button onClick={handleCancel}>취소</Button>
                        <Button type="primary" onClick={handleSave}>저장</Button>
                    </Space>
                </div>
            </Card>
        );
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>이벤트</Title>
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={handleExcelDownload}>엑셀 다운로드</Button>
                    <Button type="primary" onClick={handleNew}>+등록</Button>
                </Space>
            </div>
            <Card>
            <Table
                columns={columns}
                dataSource={list}
                rowKey="idx"
                loading={loading}
                locale={{ emptyText: '데이터가 없습니다' }}
                pagination={{
                    current: page,
                    total: totalCount,
                    pageSize: LIMIT,
                    onChange: (p) => setPage(p),
                    showSizeChanger: false,
                }}
            />
        </Card>
        </>
    );
}
