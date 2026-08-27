import { useState } from 'react';
import { Card, Input, Button, Typography, Space, App as AntApp } from 'antd';
import API from "@/libs/api";
import { usePopup } from '@/store';

const { Title } = Typography;

export default function Page() {
    const { message } = AntApp.useApp();
    const { openPopup } = usePopup();

    const [nowpw, setNowpw] = useState('');
    const [pass, setPass] = useState('');
    const [pass2, setPass2] = useState('');
    const [loading, setLoading] = useState(false);

    const mismatch = pass && pass2 && pass !== pass2;

    const handleSave = async () => {
        if (!nowpw) { message.error('현재 비밀번호를 입력해주세요.'); return; }
        if (!pass) { message.error('변경할 비밀번호를 입력해주세요.'); return; }
        if (pass !== pass2) { message.error('비밀번호가 일치하지 않습니다.'); return; }

        setLoading(true);
        const { error } = await API.post('/admin/login/changePass', { nowpw, pass, pass2 });
        setLoading(false);

        if (!error) {
            message.success('비밀번호가 변경되었습니다.');
            setNowpw('');
            setPass('');
            setPass2('');
        }
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>관리자 비밀번호</Title>
            </div>
            <Card>
            <div style={{ maxWidth: 500 }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                        <p style={{ marginBottom: 8 }}>현재 비밀번호를 입력하세요.</p>
                        <Input.Password
                            placeholder="비밀번호 입력"
                            value={nowpw}
                            onChange={e => setNowpw(e.target.value)}
                        />
                    </div>

                    <div>
                        <p style={{ marginBottom: 8 }}>변경할 비밀번호를 입력하세요.</p>
                        <Input.Password
                            placeholder="비밀번호 입력"
                            value={pass}
                            onChange={e => setPass(e.target.value)}
                        />
                        <Input.Password
                            style={{ marginTop: 10 }}
                            placeholder="비밀번호 재입력"
                            value={pass2}
                            onChange={e => setPass2(e.target.value)}
                        />
                        {mismatch && (
                            <p style={{ color: 'red', marginTop: 8 }}>비밀번호가 일치하지 않습니다</p>
                        )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Button type="primary" loading={loading} onClick={handleSave}>저장</Button>
                    </div>
                </Space>
            </div>
        </Card>
        </>
    );
}
