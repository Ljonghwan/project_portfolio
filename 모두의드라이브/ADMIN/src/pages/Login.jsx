import { useState } from 'react'
import { Form, Input, Button, Card, Typography, App as AntApp, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useUser } from '@/store';
import API from "@/libs/api";

const { Title, Text } = Typography;

export default function Login() {
    const { message } = AntApp.useApp();
    const { login } = useUser();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        setLoading(true);
        const { data, error } = await API.post('/admin/login', {
            id: values.id,
            pw: values.pw,
        }, { silent: true });
        setLoading(false);

        if (error) {
            message.error('아이디 또는 비밀번호가 일치하지 않습니다.');
            return;
        }

        login({ token: data });
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
        }}>
            <Card
                style={{ width: 400, maxWidth: 400, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                styles={{ body: { padding: '40px 32px' } }}
            >
                <Space orientation="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#6c00fe' }}>모두의 드라이브</Title>
                        <Text type="secondary">관리자</Text>
                    </div>

                    <Form
                        name="login"
                        onFinish={onFinish}
                        size="large"
                        style={{ textAlign: 'left' }}
                    >
                        <Form.Item
                            name="id"
                            rules={[{ required: true, message: '아이디를 입력해주세요.' }]}
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="아이디"
                            />
                        </Form.Item>

                        <Form.Item
                            name="pw"
                            rules={[{ required: true, message: '비밀번호를 입력해주세요.' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="비밀번호"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                style={{ height: 48, fontSize: 16, background: '#6c00fe', borderColor: '#6c00fe' }}
                            >
                                로그인
                            </Button>
                        </Form.Item>
                    </Form>
                </Space>
            </Card>
        </div>
    );
}
