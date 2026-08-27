import { useState, useEffect, useMemo } from 'react'
import { Card, Table, Descriptions, Input, Radio, Button, Space, Tag, Typography, Upload, App as AntApp } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import API from "@/libs/api"
import { STORAGE_URL } from '@/libs/consts'

import { useAllData, useDetailView } from '@/hooks/useListPage'
import { noColumn, dateColumn } from '@/hooks/columnHelpers'
import LinkTypeField from '@/components/LinkTypeField'

const { Title } = Typography
const LIMIT = 20

const defaultForm = {
    title: '',
    isActive: 1,
    linkType: 'none',
    linkTarget: '',
    imageUrl: '',
    imageFile: null,
}

export default function Page() {
    const { message, modal } = AntApp.useApp()
    const [page, setPage] = useState(1)

    const { allData, loading, reload } = useAllData({
        url: '/admin/content/popup/list',
        params: {},
        deps: ['popup'],
    })

    const filteredData = useMemo(() => allData, [allData])
    const totalCount = filteredData.length
    const list = useMemo(() => filteredData.slice((page - 1) * LIMIT, page * LIMIT), [filteredData, page])

    const { editItem, form, setForm, isNew, handleEdit, handleNew: _handleNew, handleCancel: _handleCancel } = useDetailView(defaultForm)
    const [imagePreview, setImagePreview] = useState('')

    const handleNew = () => { _handleNew(); setImagePreview('') }
    const handleCancel = () => { _handleCancel(); setImagePreview('') }

    const handleImageUpload = (file) => {
        const reader = new FileReader()
        reader.onload = () => {
            const ext = file.name.split('.').pop().toLowerCase()
            setForm(prev => ({ ...prev, imageFile: { base: reader.result, ext } }))
            setImagePreview(reader.result)
        }
        reader.readAsDataURL(file)
        return false
    }

    const onEdit = (item) => {
        handleEdit(item, (r) => ({
            title: r.title || '',
            isActive: r.isActive ?? 1,
            linkType: r.linkType || 'none',
            linkTarget: r.linkTarget || '',
            imageUrl: r.imageUrl || '',
            imageFile: null,
        }))
        setImagePreview(item.imageUrl ? `${STORAGE_URL}${item.imageUrl}` : '')
    }

    const handleSave = async () => {
        if (!form.title) { message.error('제목을 입력해주세요.'); return }
        if (!form.imageUrl && !form.imageFile) { message.error('배너 이미지를 등록해주세요.'); return }
        if (['event', 'notice', 'external'].includes(form.linkType) && !form.linkTarget) { message.error('연결할 페이지를 선택해주세요.'); return }

        const needsTarget = ['event', 'notice', 'external'].includes(form.linkType)
        const params = {
            title: form.title,
            isActive: form.isActive,
            linkType: form.linkType,
            linkTarget: needsTarget ? form.linkTarget : '',
            imageUrl: form.imageUrl,
        }
        if (form.imageFile?.base) {
            params.imageFile = form.imageFile
        }
        if (editItem?.idx) params.idx = editItem.idx

        const { error } = await API.post('/admin/content/popup/save', params)
        if (!error) {
            message.success('저장되었습니다.')
            handleCancel()
            reload()
        }
    }

    const handleDelete = (idx) => {
        modal.confirm({
            title: '삭제',
            content: '이 팝업을 삭제하시겠습니까?',
            okText: '삭제',
            okButtonProps: { danger: true },
            cancelText: '취소',
            onOk: async () => {
                const { error } = await API.post('/admin/content/popup/delete', { idx })
                if (!error) {
                    message.success('삭제되었습니다.')
                    handleCancel()
                    reload()
                }
            },
        })
    }

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        {
            title: '팝업 제목',
            dataIndex: 'title',
            ellipsis: true,
            render: (v, r) => (
                <a style={{ textDecoration: 'underline' }} onClick={() => onEdit(r)}>{v}</a>
            ),
        },
        dateColumn('등록일시', 'createdAt'),
        {
            title: '팝업 노출',
            dataIndex: 'isActive',
            width: 100,
            align: 'center',
            render: (v) => v
                ? <Tag color="green">노출</Tag>
                : <Tag style={{ color: '#999', borderColor: '#d9d9d9', background: '#fafafa' }}>비노출</Tag>,
        },
    ]

    if (editItem) {
        return (
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Title level={4} style={{ margin: 0 }}>
                        {isNew ? '메인 팝업 등록' : '메인 팝업 상세보기'}
                    </Title>
                    {!isNew && (
                        <Button danger onClick={() => handleDelete(editItem.idx)}>삭제하기</Button>
                    )}
                </div>

                <Descriptions bordered column={1} styles={{ label: { width: 150 } }}>
                    {!isNew && (
                        <Descriptions.Item label="등록일시">
                            {editItem.createdAt ? dayjs(editItem.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                        </Descriptions.Item>
                    )}
                    <Descriptions.Item label={<span>제목 <span style={{ color: 'red' }}>*</span></span>}>
                        <Input
                            placeholder="제목을 입력하세요"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                        />
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>팝업 노출 <span style={{ color: 'red' }}>*</span></span>}>
                        <Radio.Group
                            value={form.isActive}
                            onChange={e => setForm({ ...form, isActive: e.target.value })}
                        >
                            <Radio value={1}>노출</Radio>
                            <Radio value={0}>비노출</Radio>
                        </Radio.Group>
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>연결할 페이지 <span style={{ color: 'red' }}>*</span></span>}>
                        <LinkTypeField
                            linkType={form.linkType}
                            linkTarget={form.linkTarget}
                            onChange={(linkType, linkTarget) => setForm({ ...form, linkType, linkTarget })}
                        />
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>배너 <span style={{ color: 'red' }}>*</span></span>}>
                        <Space direction="vertical" size="small">
                            <Upload
                                accept="image/*"
                                showUploadList={false}
                                beforeUpload={handleImageUpload}
                            >
                                <Button icon={<UploadOutlined />}>이미지 선택</Button>
                            </Upload>
                            <span style={{ color: '#999', fontSize: 12 }}>권장 비율: 1:1 (정사각형)</span>
                            {imagePreview && <img src={imagePreview} alt="배너 미리보기" style={{ width: 200, height: 200, objectFit: 'cover', marginTop: 8, display: 'block', borderRadius: 4 }} />}
                        </Space>
                    </Descriptions.Item>
                </Descriptions>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Space>
                        <Button onClick={handleCancel}>취소</Button>
                        <Button type="primary" onClick={handleSave}>저장</Button>
                    </Space>
                </div>
            </Card>
        )
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>메인 팝업</Title>
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
    )
}
