import { useState, useEffect, useMemo } from 'react';
import { Card, Table, Descriptions, Input, Checkbox, Button, Space, Tag, Typography, App as AntApp } from 'antd';
import dayjs from 'dayjs';
import API from "@/libs/api";
import TiptapEditor from '@/components/TiptapEditor';
import { useAllData, useDetailView } from '@/hooks/useListPage';
import { noColumn, dateColumn, tagColumn } from '@/hooks/columnHelpers';

const { Title } = Typography;
const LIMIT = 20;

const defaultForm = { title: '', content: '', isPinned: false, pushSend: false };

export default function Page() {
    const { message, modal } = AntApp.useApp();
    const [page, setPage] = useState(1);

    const { allData, loading, reload } = useAllData({
        url: '/admin/content/notice/list',
        params: {},
        deps: ['notice'],
    });

    const filteredData = useMemo(() => allData, [allData]);
    const totalCount = filteredData.length;
    const list = useMemo(() => filteredData.slice((page - 1) * LIMIT, page * LIMIT), [filteredData, page]);

    const { editItem, form, setForm, isNew, handleEdit, handleNew, handleCancel } = useDetailView(defaultForm);

    const onEdit = async (item) => {
        const { data } = await API.post('/admin/content/notice/detail', { idx: item.idx });
        const r = data || item;
        handleEdit(r, (r) => ({
            title: r.title || '',
            content: r.content || '',
            isPinned: !!r.isPinned,
            pushSend: false,
        }));
    };

    const isEmptyHtml = (html) => !html || html.replace(/<[^>]*>/g, '').trim() === '';

    const handleSave = () => {
        if (!form.title?.trim()) { message.error('제목을 입력해주세요.'); return; }
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
                    isPinned: form.isPinned ? 1 : 0,
                    pushSend: form.pushSend ? 1 : 0,
                };
                if (editItem?.idx) params.idx = editItem.idx;
                const { error } = await API.post('/admin/content/notice/save', params);
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
            content: '이 공지사항을 삭제하시겠습니까?',
            okText: '삭제',
            okButtonProps: { danger: true },
            cancelText: '취소',
            onOk: async () => {
                const { error } = await API.post('/admin/content/notice/delete', { idx });
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
            title: '제목',
            dataIndex: 'title',
            ellipsis: true,
            render: (v, r) => (
                <a style={{ textDecoration: 'underline' }} onClick={() => onEdit(r)}>{v}</a>
            ),
        },
        {
            title: '상단고정',
            dataIndex: 'isPinned',
            width: 100,
            align: 'center',
            render: (v) => v ? <Tag color="blue">고정</Tag> : <Tag>-</Tag>,
        },
        dateColumn('등록일시', 'createdAt'),
    ];

    if (editItem) {
        return (
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Title level={4} style={{ margin: 0 }}>{isNew ? '공지사항 등록' : '공지사항 상세보기'}</Title>
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
                    <Descriptions.Item label="상단고정">
                        <Checkbox checked={form.isPinned} onChange={e => setForm({ ...form, isPinned: e.target.checked })}>상단 고정</Checkbox>
                    </Descriptions.Item>
                    <Descriptions.Item label="푸시발송">
                        {isNew ? (
                            <Checkbox checked={form.pushSend} onChange={e => setForm({ ...form, pushSend: e.target.checked })}>등록 시 푸시 발송</Checkbox>
                        ) : (
                            editItem.pushSent ? <Tag color="blue">등록 시 푸시 발송됨</Tag> : <Tag>발송 안함</Tag>
                        )}
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
                <Title level={4} style={{ margin: 0 }}>공지사항</Title>
                <Button type="primary" onClick={handleNew}>+등록</Button>
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
