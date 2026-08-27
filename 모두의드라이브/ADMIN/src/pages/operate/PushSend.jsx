import { useState, useEffect, useMemo } from 'react';
import { Card, Table, Descriptions, Input, Checkbox, Button, Space, Select, Radio, DatePicker, InputNumber, Tag, Typography, App as AntApp } from 'antd';
import dayjs from 'dayjs';
import API from "@/libs/api";
import { useConfigLabelMap } from '@/store';
import { useAllData } from '@/hooks/useListPage';
import { noColumn, dateColumn } from '@/hooks/columnHelpers';

const { Title } = Typography;
const LIMIT = 20;

export default function Page() {
    const { message, modal } = AntApp.useApp();
    const [page, setPage] = useState(1);

    const { allData, loading, reload } = useAllData({
        url: '/admin/operate/push/list',
        params: {},
        deps: ['push'],
    });

    const filteredData = useMemo(() => allData, [allData]);
    const totalCount = filteredData.length;
    const list = useMemo(() => filteredData.slice((page - 1) * LIMIT, page * LIMIT), [filteredData, page]);

    const roleLabelMap = useConfigLabelMap('roles');
    const genderLabelMap = useConfigLabelMap('genders');

    const [osAndroid, setOsAndroid] = useState(true);
    const [osIos, setOsIos] = useState(true);
    const [roleOwner, setRoleOwner] = useState(true);
    const [roleGuest, setRoleGuest] = useState(true);
    const [genderF, setGenderF] = useState(true);
    const [genderM, setGenderM] = useState(true);
    const [content, setContent] = useState('');

    // 지역 필터
    const [sidoList, setSidoList] = useState([]);
    const [sigunguList, setSigunguList] = useState([]);
    const [sido, setSido] = useState(null);
    const [sigungu, setSigungu] = useState(null);

    // 출생년도 필터
    const [birthYearFrom, setBirthYearFrom] = useState(null);
    const [birthYearTo, setBirthYearTo] = useState(null);

    // 예약발송
    const [sendType, setSendType] = useState('immediate');
    const [scheduledAt, setScheduledAt] = useState(null);

    useEffect(() => {
        loadSido();
    }, []);

    const loadSido = async () => {
        const { data } = await API.post('/admin/operate/dong/sido', {});
        setSidoList(data || []);
    };

    const handleSidoChange = async (value) => {
        setSido(value);
        setSigungu(null);
        if (value && value !== 'all') {
            const { data } = await API.post('/admin/operate/dong/sigungu', { sido: value });
            setSigunguList(data || []);
        } else {
            setSigunguList([]);
        }
    };

    const sendFunc = () => {
        if (!content?.trim()) { message.error('발송내용을 입력해주세요.'); return; }
        if (sendType === 'scheduled' && !scheduledAt) { message.error('예약발송 일시를 선택해주세요.'); return; }

        modal.confirm({
            title: sendType === 'scheduled' ? '예약 발송' : '알림 발송',
            content: sendType === 'scheduled'
                ? `${dayjs(scheduledAt).format('YYYY-MM-DD HH:mm')}에 발송 예약하시겠습니까?`
                : '알림을 즉시 발송하시겠습니까?',
            okText: '확인',
            cancelText: '취소',
            onOk: async () => {
                const os = [];
                if (osAndroid) os.push('android');
                if (osIos) os.push('ios');
                const role = [];
                if (roleOwner) role.push('owner');
                if (roleGuest) role.push('guest');
                const gender = [];
                if (genderF) gender.push('F');
                if (genderM) gender.push('M');

                const params = {
                    body: content, os, role, gender,
                    sendType,
                };
                if (sido && sido !== 'all') {
                    params.sido = sido;
                    if (sigungu && sigungu !== 'all') params.sigungu = sigungu;
                }
                if (birthYearFrom) params.birthYearFrom = birthYearFrom;
                if (birthYearTo) params.birthYearTo = birthYearTo;
                if (sendType === 'scheduled') params.scheduledAt = scheduledAt;

                const { error } = await API.post('/admin/operate/push/send', params);
                if (!error) {
                    message.success(sendType === 'scheduled' ? '예약되었습니다.' : '발송되었습니다.');
                    setContent('');
                    setSendType('immediate');
                    setScheduledAt(null);
                    reload();
                }
            },
        });
    };

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        dateColumn('발송일자', 'createdAt', { width: 150 }),
        {
            title: '발송유형',
            dataIndex: 'sendType',
            width: 100,
            align: 'center',
            render: (v, r) => v === 'scheduled'
                ? <Tag color="orange">예약 {r.scheduledAt ? dayjs(r.scheduledAt).format('MM-DD HH:mm') : ''}</Tag>
                : <Tag color="blue">즉시</Tag>,
        },
        {
            title: 'OS',
            dataIndex: 'os',
            width: 120,
            align: 'center',
            render: (v) => { const arr = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(arr) ? arr.join(', ') : '-'; },
        },
        {
            title: '회원유형',
            dataIndex: 'role',
            width: 120,
            align: 'center',
            render: (v) => { const arr = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(arr) ? arr.map(r => roleLabelMap[r] || r).join(', ') : '-'; },
        },
        {
            title: '성별',
            dataIndex: 'gender',
            width: 100,
            align: 'center',
            render: (v) => { const arr = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(arr) ? arr.map(g => genderLabelMap[g] || g).join(', ') : '-'; },
        },
        {
            title: '지역',
            width: 120,
            align: 'center',
            render: (_, r) => [r.sido, r.sigungu].filter(Boolean).join(' ') || '전체',
        },
        {
            title: '출생년도',
            width: 120,
            align: 'center',
            render: (_, r) => (r.birthYearFrom || r.birthYearTo) ? `${r.birthYearFrom || ''}~${r.birthYearTo || ''}` : '-',
        },
        {
            title: '내용',
            dataIndex: 'body',
            width: 300,
            ellipsis: true,
        },
        {
            title: '발송수',
            width: 100,
            align: 'center',
            render: (_, r) => r.sendType === 'scheduled' && r.sentCount === 0
                ? <Tag color="orange">미발송</Tag>
                : <span>{r.sentCount}건</span>,
        },
    ];

    return (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: -8 }}>
                <Title level={4} style={{ margin: 0 }}>알림 발송</Title>
            </div>
            <Card>
                <Descriptions bordered column={1} styles={{ label: { width: 120 } }}>
                    <Descriptions.Item label="발송대상">
                        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                            <Space size="large">
                                <span style={{ fontWeight: 'bold', width: 70, display: 'inline-block' }}>OS</span>
                                <Checkbox checked={osAndroid} onChange={e => setOsAndroid(e.target.checked)}>안드로이드</Checkbox>
                                <Checkbox checked={osIos} onChange={e => setOsIos(e.target.checked)}>아이폰</Checkbox>
                            </Space>
                            <Space size="large">
                                <span style={{ fontWeight: 'bold', width: 70, display: 'inline-block' }}>회원유형</span>
                                <Checkbox checked={roleOwner} onChange={e => setRoleOwner(e.target.checked)}>{roleLabelMap['owner'] || '오너'}</Checkbox>
                                <Checkbox checked={roleGuest} onChange={e => setRoleGuest(e.target.checked)}>{roleLabelMap['guest'] || '게스트'}</Checkbox>
                            </Space>
                            <Space size="large">
                                <span style={{ fontWeight: 'bold', width: 70, display: 'inline-block' }}>성별</span>
                                <Checkbox checked={genderF} onChange={e => setGenderF(e.target.checked)}>{genderLabelMap['F'] || '여성'}</Checkbox>
                                <Checkbox checked={genderM} onChange={e => setGenderM(e.target.checked)}>{genderLabelMap['M'] || '남성'}</Checkbox>
                            </Space>
                            <Space size="large">
                                <span style={{ fontWeight: 'bold', width: 70, display: 'inline-block' }}>지역</span>
                                <Select
                                    placeholder="시/도"
                                    value={sido}
                                    onChange={handleSidoChange}
                                    style={{ width: 150 }}
                                    options={[{ label: '전체', value: 'all' }, ...sidoList.map(s => ({ label: s, value: s }))]}
                                />
                                <Select
                                    placeholder="시/군/구"
                                    value={sigungu}
                                    onChange={setSigungu}
                                    style={{ width: 150 }}
                                    disabled={!sido || sido === 'all'}
                                    options={[{ label: '전체', value: 'all' }, ...sigunguList.map(s => ({ label: s, value: s }))]}
                                />
                            </Space>
                            <Space size="large">
                                <span style={{ fontWeight: 'bold', width: 70, display: 'inline-block' }}>출생년도</span>
                                <InputNumber placeholder="1990" min={1940} max={2020} value={birthYearFrom} onChange={setBirthYearFrom} style={{ width: 100 }} /> 년 ~
                                <InputNumber placeholder="2000" min={1940} max={2020} value={birthYearTo} onChange={setBirthYearTo} style={{ width: 100 }} /> 년
                            </Space>
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="발송유형">
                        <Space>
                            <Radio.Group value={sendType} onChange={e => setSendType(e.target.value)}>
                                <Radio value="immediate">즉시발송</Radio>
                                <Radio value="scheduled">예약발송</Radio>
                            </Radio.Group>
                            {sendType === 'scheduled' && (
                                <DatePicker
                                    showTime
                                    format="YYYY-MM-DD HH:mm"
                                    placeholder="예약 일시"
                                    value={scheduledAt ? dayjs(scheduledAt) : null}
                                    onChange={(d) => setScheduledAt(d ? d.format('YYYY-MM-DD HH:mm:00') : null)}
                                />
                            )}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label={<span>내용 <span style={{ color: 'red' }}>*</span></span>}>
                        <Input.TextArea rows={4} value={content} onChange={e => setContent(e.target.value)} placeholder="내용을 입력하세요." />
                    </Descriptions.Item>
                </Descriptions>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Button type="primary" onClick={sendFunc}>
                        {sendType === 'scheduled' ? '예약 발송' : '즉시 발송'}
                    </Button>
                </div>
            </Card>

            <Card>
                <Title level={5} style={{ marginBottom: 16 }}>발송내역</Title>
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
                    scroll={{ x: 1100 }}
                />
            </Card>
        </Space>
    );
}
