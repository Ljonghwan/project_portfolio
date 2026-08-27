import { useState, useEffect, useMemo } from 'react';
import { Card, Table, Descriptions, Input, Select, Button, Space, Typography, App as AntApp } from 'antd';
import dayjs from 'dayjs';
import API from "@/libs/api";
import { usePopup } from '@/store';
import { useAllData, useDetailView } from '@/hooks/useListPage';
import { noColumn, textColumn } from '@/hooks/columnHelpers';

const { Title } = Typography;
const LIMIT = 20;

const defaultForm = { categoryIdx: undefined, question: '', answer: '' };

export default function Page() {
    const { message, modal } = AntApp.useApp();
    const { openPopup } = usePopup();

    const [categories, setCategories] = useState([]);

    const [page, setPage] = useState(1);
    const [filterCategory, setFilterCategory] = useState(undefined);

    const { allData, loading, reload } = useAllData({
        url: '/admin/content/faq/list',
        params: {},
        deps: ['faq'],
    });

    const filteredData = useMemo(() => {
        if (!filterCategory) return allData;
        return allData.filter(item => item.categoryIdx === filterCategory);
    }, [allData, filterCategory]);

    const totalCount = filteredData.length;
    const list = useMemo(() => filteredData.slice((page - 1) * LIMIT, page * LIMIT), [filteredData, page]);

    const { editItem, form, setForm, isNew, handleEdit, handleNew, handleCancel } = useDetailView(defaultForm);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const { data } = await API.post('/admin/content/faq-category/list', {});
        setCategories(Array.isArray(data) ? data : data?.list || []);
    };

    const onEdit = async (item) => {
        const { data } = await API.post('/admin/content/faq/detail', { idx: item.idx });
        const r = data || item;
        handleEdit(r, (r) => ({
            categoryIdx: r.categoryIdx,
            question: r.question || '',
            answer: r.answer || '',
        }));
    };

    const handleSave = () => {
        if (!form.categoryIdx) { message.error('분류를 선택해주세요.'); return; }
        if (!form.question) { message.error('질문을 입력해주세요.'); return; }
        if (!form.answer) { message.error('답변을 입력해주세요.'); return; }

        modal.confirm({
            title: '저장',
            content: '저장하시겠습니까?',
            okText: '확인',
            cancelText: '취소',
            onOk: async () => {
                const params = { ...form };
                if (editItem?.idx) params.idx = editItem.idx;
                const { error } = await API.post('/admin/content/faq/save', params);
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
            content: '이 FAQ를 삭제하시겠습니까?',
            okText: '삭제',
            okButtonProps: { danger: true },
            cancelText: '취소',
            onOk: async () => {
                const { error } = await API.post('/admin/content/faq/delete', { idx });
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
            title: '분류',
            dataIndex: ['category', 'name'],
            width: 150,
            align: 'center',
            render: (v) => v || '-',
        },
        {
            title: '자주하는 질문',
            dataIndex: 'question',
            render: (text, record) => (
                <a style={{ textDecoration: 'underline' }} onClick={() => onEdit(record)}>{text}</a>
            ),
        },
    ];

    if (editItem) {
        return (
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Title level={4} style={{ margin: 0 }}>FAQ 상세보기</Title>
                    {editItem.idx && (
                        <Button danger onClick={() => handleDelete(editItem.idx)}>삭제하기</Button>
                    )}
                </div>

                <Descriptions bordered column={1} styles={{ label: { width: 150 } }}>
                    {editItem.idx && (
                        <Descriptions.Item label="등록일시">{editItem.createdAt ? dayjs(editItem.createdAt).format('YYYY-MM-DD HH:mm') : ''}</Descriptions.Item>
                    )}
                    <Descriptions.Item label={<span>분류 <span style={{ color: 'red' }}>*</span></span>}>
                        <Select
                            style={{ width: 200 }}
                            placeholder="분류 선택"
                            value={form.categoryIdx}
                            onChange={v => setForm({ ...form, categoryIdx: v })}
                            options={categories.map(c => ({ label: c.name, value: c.idx }))}
                        />
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>질문 <span style={{ color: 'red' }}>*</span></span>}>
                        <Input placeholder="질문을 입력하세요" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} />
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>답변 <span style={{ color: 'red' }}>*</span></span>}>
                        <Input.TextArea rows={10} placeholder="답변을 입력하세요" value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} />
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
                <Space>
                    <Title level={4} style={{ margin: 0 }}>FAQ</Title>
                    <Select
                        style={{ width: 160 }}
                        placeholder="전체"
                        allowClear
                        value={filterCategory}
                        onChange={v => { setFilterCategory(v); setPage(1); }}
                        options={categories.map(c => ({ label: c.name, value: c.idx }))}
                    />
                </Space>
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
