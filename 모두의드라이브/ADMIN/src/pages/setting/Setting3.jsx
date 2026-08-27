import { useState, useMemo } from 'react';
import { Card, Table, Descriptions, Input, Checkbox, Button, Space, Typography, App as AntApp } from 'antd';
import dayjs from 'dayjs';
import API from "@/libs/api";
import { usePopup } from '@/store';
import { useAllData, useDetailView } from '@/hooks/useListPage';

const { Title } = Typography;

const AUTH_OPTIONS = [
    { label: '회원관리', value: 1 },
    { label: '포인트/쿠폰', value: 2 },
    { label: '콘텐츠관리', value: 4 },
    { label: '운영관리', value: 8 },
    { label: '설정', value: 16 },
];

const defaultForm = { role: '', id: '', password: '', name: '', dept: '', position: '', hp: '', auth: 0 };

export default function Page() {
    const { message, modal } = AntApp.useApp();
    const { openPopup } = usePopup();

    const { allData, loading, reload } = useAllData({
        url: '/admin/setting/admin',
        params: {},
        deps: ['admin_setting'],
    });

    const list = useMemo(() => allData, [allData]);

    const { editItem, form, setForm, isNew, handleEdit: _handleEdit, handleNew, handleCancel } = useDetailView(defaultForm);
    const [idChecked, setIdChecked] = useState(false);

    const handleEdit = (item) => {
        _handleEdit(item, (it) => ({
            role: it.role || '',
            id: it.id || '',
            password: '',
            name: it.name || '',
            dept: it.dept || '',
            position: it.position || '',
            hp: it.hp || '',
            auth: it.auth || 0,
        }));
        setIdChecked(true);
    };

    const handleCheckId = async () => {
        if (!form.id) { message.error('아이디를 입력해주세요.'); return; }
        const { data, error } = await API.post('/admin/setting/admin/checkId', { id: form.id });
        if (!error) {
            if (data?.available) {
                message.success('사용 가능한 아이디입니다.');
                setIdChecked(true);
            } else {
                message.error('이미 사용중인 아이디입니다.');
                setIdChecked(false);
            }
        }
    };

    const getAuthValues = (bitmask) => {
        return AUTH_OPTIONS.filter(opt => bitmask & opt.value).map(opt => opt.value);
    };

    const handleAuthChange = (checkedValues) => {
        const auth = checkedValues.reduce((acc, v) => acc | v, 0);
        setForm({ ...form, auth });
    };

    const handleSave = () => {
        if (!form.role) { message.error('관리역할을 입력해주세요.'); return; }
        if (!form.id) { message.error('아이디를 입력해주세요.'); return; }
        if (!editItem?.idx && !idChecked) { message.error('아이디 중복확인을 해주세요.'); return; }
        if (!editItem?.idx && !form.password) { message.error('비밀번호를 입력해주세요.'); return; }
        if (!form.name) { message.error('이름을 입력해주세요.'); return; }
        if (!form.auth) { message.error('권한을 1개 이상 선택해주세요.'); return; }

        modal.confirm({
            title: '저장',
            content: '저장하시겠습니까?',
            okText: '확인',
            cancelText: '취소',
            onOk: async () => {
                const params = { ...form };
                if (editItem?.idx) {
                    params.idx = editItem.idx;
                    if (!params.password) delete params.password;
                }
                const { error } = await API.post('/admin/setting/admin/save', params);
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
            content: '이 계정을 삭제하시겠습니까?',
            okText: '삭제',
            okButtonProps: { danger: true },
            cancelText: '취소',
            onOk: async () => {
                const { error } = await API.post('/admin/setting/admin/delete', { idx });
                if (!error) {
                    message.success('삭제되었습니다.');
                    handleCancel();
                    reload();
                }
            },
        });
    };

    const columns = [
        {
            title: 'No',
            dataIndex: 'idx',
            width: 70,
            align: 'center',
        },
        {
            title: '관리역할',
            dataIndex: 'role',
            width: 120,
            align: 'center',
        },
        {
            title: '아이디',
            dataIndex: 'id',
            width: 150,
            render: (text, record) => (
                <a style={{ textDecoration: 'underline' }} onClick={() => handleEdit(record)}>{text}</a>
            ),
        },
        {
            title: '이름',
            dataIndex: 'name',
            width: 100,
            align: 'center',
        },
        {
            title: '부서',
            dataIndex: 'dept',
            width: 100,
            align: 'center',
        },
        {
            title: '직책',
            dataIndex: 'position',
            width: 100,
            align: 'center',
        },
        {
            title: '연락처',
            dataIndex: 'hp',
            width: 140,
            align: 'center',
        },
        {
            title: '등록일',
            dataIndex: 'createdAt',
            width: 160,
            align: 'center',
            render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '',
        },
    ];

    if (editItem) {
        return (
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Title level={4} style={{ margin: 0 }}>계정 상세보기</Title>
                    {!isNew && (
                        <Button danger onClick={() => handleDelete(editItem.idx)}>삭제하기</Button>
                    )}
                </div>

                <Descriptions bordered column={1} styles={{ label: { width: 150 } }}>
                    <Descriptions.Item label={<span>관리역할 <span style={{ color: 'red' }}>*</span></span>}>
                        <Input placeholder="관리역할" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ width: 300 }} />
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>아이디 <span style={{ color: 'red' }}>*</span></span>}>
                        <Space>
                            <Input
                                placeholder="아이디"
                                value={form.id}
                                onChange={e => { setForm({ ...form, id: e.target.value }); if (isNew) setIdChecked(false); }}
                                disabled={!isNew}
                                style={{ width: 250 }}
                            />
                            {isNew && <Button onClick={handleCheckId}>중복확인</Button>}
                        </Space>
                    </Descriptions.Item>
                    {isNew && (
                        <Descriptions.Item label={<span>비밀번호 <span style={{ color: 'red' }}>*</span></span>}>
                            <Input.Password placeholder="비밀번호" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ width: 300 }} />
                        </Descriptions.Item>
                    )}
                    <Descriptions.Item label={<span>이름 <span style={{ color: 'red' }}>*</span></span>}>
                        <Input placeholder="이름" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: 300 }} />
                    </Descriptions.Item>
                    <Descriptions.Item label="부서">
                        <Input placeholder="부서" value={form.dept} onChange={e => setForm({ ...form, dept: e.target.value })} style={{ width: 300 }} />
                    </Descriptions.Item>
                    <Descriptions.Item label="직책">
                        <Input placeholder="직책" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} style={{ width: 300 }} />
                    </Descriptions.Item>
                    <Descriptions.Item label="연락처">
                        <Input placeholder="연락처" value={form.hp} onChange={e => setForm({ ...form, hp: e.target.value })} style={{ width: 300 }} />
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>권한설정 <span style={{ color: 'red' }}>*</span></span>}>
                        <Checkbox.Group
                            options={AUTH_OPTIONS}
                            value={getAuthValues(form.auth)}
                            onChange={handleAuthChange}
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
                <Title level={4} style={{ margin: 0 }}>관리자 계정관리</Title>
                <Button type="primary" onClick={handleNew}>+등록</Button>
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
        </>
    );
}
