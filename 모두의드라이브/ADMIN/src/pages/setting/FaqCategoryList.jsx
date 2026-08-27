import { useState, useMemo } from 'react';
import { Card, Table, Input, Select, Button, Space, Typography, Modal, App as AntApp } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import API from "@/libs/api";
import { usePopup } from '@/store';
import { useAllData } from '@/hooks/useListPage';

const { Title } = Typography;

export default function Page() {
    const { message } = AntApp.useApp();
    const { openPopup } = usePopup();

    const { allData, loading, reload } = useAllData({
        url: '/admin/content/faq-category/list',
        params: {},
        deps: ['faq_category'],
    });

    const list = useMemo(() => allData, [allData]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [addName, setAddName] = useState('');

    const [editModal, setEditModal] = useState(null);
    const [editName, setEditName] = useState('');

    const [deleteModal, setDeleteModal] = useState(null);
    const [replaceCategoryIdx, setReplaceCategoryIdx] = useState(undefined);

    // Add
    const handleOpenAdd = () => {
        setAddName('');
        setShowAddModal(true);
    };

    const handleAdd = async () => {
        if (!addName.trim()) {
            message.error('분류명을 입력해주세요.');
            return;
        }
        const { error } = await API.post('/admin/content/faq-category/save', { name: addName.trim() });
        if (!error) {
            message.success('등록되었습니다.');
            setShowAddModal(false);
            setAddName('');
            reload();
        }
    };

    // Edit
    const handleOpenEdit = (item) => {
        setEditModal(item);
        setEditName(item.name || '');
    };

    const handleEdit = async () => {
        if (!editName.trim()) {
            message.error('분류명을 입력해주세요.');
            return;
        }
        const { error } = await API.post('/admin/content/faq-category/save', {
            idx: editModal.idx,
            name: editName.trim(),
        });
        if (!error) {
            message.success('수정되었습니다.');
            setEditModal(null);
            setEditName('');
            reload();
        }
    };

    // Delete
    const handleOpenDelete = (item) => {
        setDeleteModal(item);
        setReplaceCategoryIdx(undefined);
    };

    const handleDelete = async () => {
        if (!replaceCategoryIdx) {
            message.error('재지정할 분류를 선택해주세요.');
            return;
        }
        const { error } = await API.post('/admin/content/faq-category/delete', {
            idx: deleteModal.idx,
            replaceCategoryIdx: Number(replaceCategoryIdx),
        });
        if (!error) {
            message.success('삭제되었습니다.');
            setDeleteModal(null);
            setReplaceCategoryIdx(undefined);
            reload();
        }
    };

    // Order
    const handleOrder = async (idx, direction) => {
        const { error } = await API.post('/admin/content/faq-category/order', { idx, direction });
        if (!error) reload();
    };

    const columns = [
        {
            title: '순서',
            width: 120,
            align: 'center',
            render: (_, record, index) => (
                <Space>
                    <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => handleOrder(record.idx, 'up')}
                    />
                    <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === list.length - 1}
                        onClick={() => handleOrder(record.idx, 'down')}
                    />
                </Space>
            ),
        },
        {
            title: '분류명',
            dataIndex: 'name',
        },
        {
            title: '관리',
            width: 180,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button size="small" onClick={() => handleOpenEdit(record)}>수정</Button>
                    <Button size="small" danger onClick={() => handleOpenDelete(record)}>삭제</Button>
                </Space>
            ),
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>FAQ 분류관리</Title>
                <Button type="primary" onClick={handleOpenAdd}>추가</Button>
            </div>
            <Card>
            <Table
                columns={columns}
                dataSource={list}
                rowKey="idx"
                loading={loading}
                locale={{ emptyText: '데이터가 없습니다' }}
                pagination={false}
            />
        </Card>

            {/* Add Modal */}
            <Modal
                title="FAQ분류 추가"
                open={showAddModal}
                onCancel={() => setShowAddModal(false)}
                footer={
                    <Space>
                        <Button onClick={() => setShowAddModal(false)}>취소</Button>
                        <Button type="primary" onClick={handleAdd}>등록</Button>
                    </Space>
                }
            >
                <Input
                    placeholder="분류명을 입력하세요."
                    value={addName}
                    onChange={e => setAddName(e.target.value)}
                    onPressEnter={handleAdd}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                title="FAQ분류 수정"
                open={!!editModal}
                onCancel={() => setEditModal(null)}
                footer={
                    <Space>
                        <Button onClick={() => setEditModal(null)}>취소</Button>
                        <Button type="primary" onClick={handleEdit}>수정</Button>
                    </Space>
                }
            >
                <p style={{ marginBottom: 12, color: '#888' }}>
                    분류를 수정하면 등록된 FAQ의 분류명이 모두 수정됩니다.
                </p>
                <Input
                    placeholder="분류명을 입력하세요."
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onPressEnter={handleEdit}
                />
            </Modal>

            {/* Delete Modal */}
            <Modal
                title="FAQ분류 삭제"
                open={!!deleteModal}
                onCancel={() => setDeleteModal(null)}
                footer={
                    <Space>
                        <Button onClick={() => setDeleteModal(null)}>취소</Button>
                        <Button danger onClick={handleDelete}>삭제</Button>
                    </Space>
                }
            >
                <p style={{ marginBottom: 12, color: '#888' }}>
                    분류 삭제 시 이전의 등록된 FAQ의 분류명을 다시 지정해 주셔야 합니다.
                </p>
                <Select
                    style={{ width: '100%' }}
                    placeholder="분류를 선택해주세요"
                    value={replaceCategoryIdx}
                    onChange={v => setReplaceCategoryIdx(v)}
                    options={list.filter(item => item.idx !== deleteModal?.idx).map(item => ({ label: item.name, value: item.idx }))}
                />
            </Modal>
        </>
    );
}
