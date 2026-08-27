import { useState, useEffect, useMemo } from 'react';
import { Card, Table, Descriptions, Checkbox, InputNumber, Button, Space, Tag, Typography, Upload, App as AntApp } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import API from "@/libs/api";
import { STORAGE_URL } from '@/libs/consts';
import { useAllData, useDetailView } from '@/hooks/useListPage';
import { noColumn } from '@/hooks/columnHelpers';
import LinkTypeField from '@/components/LinkTypeField';

const { Title } = Typography;
const LIMIT = 20;

const LINK_TYPE_LABELS = { event: '이벤트', notice: '공지사항', invite: '친구초대', external: '외부 URL', none: '링크 없음' };

const defaultForm = { imageUrl: '', imageFile: null, linkType: 'none', linkTarget: '', isActive: true, sortOrder: 0 };

export default function Page() {
    const { message, modal } = AntApp.useApp();
    const [page, setPage] = useState(1);

    const { allData, loading, reload } = useAllData({
        url: '/admin/content/banner/list',
        params: {},
        deps: ['banner'],
    });

    const filteredData = useMemo(() => allData, [allData]);
    const totalCount = filteredData.length;
    const list = useMemo(() => filteredData.slice((page - 1) * LIMIT, page * LIMIT), [filteredData, page]);

    const { editItem, form, setForm, isNew, handleEdit: _handleEdit, handleNew: _handleNew, handleCancel: _handleCancel } = useDetailView(defaultForm);
    const [imagePreview, setImagePreview] = useState('');

    const handleNew = () => { _handleNew(); setImagePreview(''); };
    const handleCancel = () => { _handleCancel(); setImagePreview(''); };

    const onEdit = (item) => {
        _handleEdit(item, (r) => {
            // 레거시 배너(linkType 없음 + linkUrl 있음) → 외부 URL 로 매핑
            const isLegacy = (!r.linkType || r.linkType === 'none') && r.linkUrl;
            return {
                imageUrl: r.imageUrl || '',
                imageFile: null,
                linkType: isLegacy ? 'external' : (r.linkType || 'none'),
                linkTarget: isLegacy ? r.linkUrl : (r.linkTarget || ''),
                isActive: r.isActive ?? true,
                sortOrder: r.sortOrder || 0,
            };
        });
        setImagePreview(item.imageUrl ? `${STORAGE_URL}${item.imageUrl}` : '');
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

    const handleSave = async () => {
        if (!form.imageUrl && !form.imageFile) { message.error('배너 이미지를 등록해주세요.'); return; }
        if (['event', 'notice', 'external'].includes(form.linkType) && !form.linkTarget) { message.error('연결할 페이지를 선택해주세요.'); return; }

        const needsTarget = ['event', 'notice', 'external'].includes(form.linkType);
        const params = {
            linkType: form.linkType,
            linkTarget: needsTarget ? form.linkTarget : '',
            isActive: form.isActive,
            sortOrder: Number(form.sortOrder),
            imageUrl: form.imageUrl,
        };
        if (form.imageFile?.base) params.imageFile = form.imageFile;
        if (editItem?.idx) params.idx = editItem.idx;

        const { error } = await API.post('/admin/content/banner/save', params);
        if (!error) {
            message.success('저장되었습니다.');
            handleCancel();
            reload();
        }
    };

    const handleDelete = (idx) => {
        modal.confirm({
            title: '삭제',
            content: '이 배너를 삭제하시겠습니까?',
            okText: '삭제',
            okButtonProps: { danger: true },
            cancelText: '취소',
            onOk: async () => {
                const { error } = await API.post('/admin/content/banner/delete', { idx });
                if (!error) {
                    message.success('삭제되었습니다.');
                    setPage(1);
                    reload();
                }
            },
        });
    };

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        {
            title: '이미지',
            dataIndex: 'imageUrl',
            width: 120,
            align: 'center',
            render: (v) => v
                ? <img src={`${STORAGE_URL}${v}`} alt="" style={{ width: 80, height: 40, objectFit: 'cover' }} />
                : '-',
        },
        {
            title: '연결',
            ellipsis: true,
            render: (_, r) => {
                // 레거시 배너: linkType 없이 linkUrl 만 있는 경우
                if ((!r.linkType || r.linkType === 'none') && r.linkUrl) {
                    return <a href={r.linkUrl} target="_blank" rel="noreferrer">외부 URL</a>;
                }
                const label = LINK_TYPE_LABELS[r.linkType] || '링크 없음';
                if (r.linkType === 'external' && r.linkTarget) {
                    return <a href={r.linkTarget} target="_blank" rel="noreferrer">{label}</a>;
                }
                return label;
            },
        },
        {
            title: '활성',
            dataIndex: 'isActive',
            width: 90,
            align: 'center',
            render: (v) => v ? <Tag color="green">활성</Tag> : <Tag>비활성</Tag>,
        },
        {
            title: '순서',
            dataIndex: 'sortOrder',
            width: 80,
            align: 'center',
        },
        {
            title: '관리',
            width: 120,
            align: 'center',
            render: (_, r) => (
                <Space>
                    <Button size="small" onClick={() => onEdit(r)}>수정</Button>
                    <Button size="small" danger onClick={() => handleDelete(r.idx)}>삭제</Button>
                </Space>
            ),
        },
    ];

    if (editItem) {
        return (
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Title level={4} style={{ margin: 0 }}>{isNew ? '배너 등록' : '배너 수정'}</Title>
                    {!isNew && (
                        <Button danger onClick={() => handleDelete(editItem.idx)}>삭제하기</Button>
                    )}
                </div>

                <Descriptions bordered column={1} styles={{ label: { width: 150 } }}>
                    <Descriptions.Item label={<span>배너 이미지 <span style={{ color: 'red' }}>*</span></span>}>
                        <Space direction="vertical" size="small">
                            <div style={{ fontSize: 12, color: '#999' }}>권장 비율: 4:1 (예: 1200×300px)</div>
                            <Upload
                                accept="image/*"
                                showUploadList={false}
                                beforeUpload={handleImageUpload}
                            >
                                <Button icon={<UploadOutlined />}>이미지 선택</Button>
                            </Upload>
                            {imagePreview && <img src={imagePreview} alt="배너 미리보기" style={{ width: 320, height: 'auto', objectFit: 'cover', marginTop: 8, display: 'block', borderRadius: 4 }} />}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="연결할 페이지">
                        <LinkTypeField
                            linkType={form.linkType}
                            linkTarget={form.linkTarget}
                            onChange={(linkType, linkTarget) => setForm({ ...form, linkType, linkTarget })}
                        />
                    </Descriptions.Item>
                    <Descriptions.Item label="활성">
                        <Checkbox
                            checked={form.isActive}
                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        >
                            활성
                        </Checkbox>
                    </Descriptions.Item>
                    <Descriptions.Item label="순서">
                        <InputNumber
                            value={form.sortOrder}
                            onChange={v => setForm({ ...form, sortOrder: v ?? 0 })}
                            min={0}
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
                <Title level={4} style={{ margin: 0 }}>배너 관리</Title>
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
