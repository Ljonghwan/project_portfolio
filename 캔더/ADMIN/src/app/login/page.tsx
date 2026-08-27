"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Form, Input, Button, Typography, Alert } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { api, ApiError } from "@/lib/api";

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFinish(values: { username: string; password: string }) {
    setLoading(true);
    setErr(null);
    try {
      await api.post("/api/admin/auth/login", values);
      router.replace("/dashboard");
    } catch (e) {
      // 서버가 계정 존재 여부를 구분해 알려주지 않는다(유저 열거 방지) — 메시지 그대로 노출.
      setErr(e instanceof ApiError ? e.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#f7f9fc" }}>
      <Card style={{ width: 380 }} styles={{ body: { padding: 28 } }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Typography.Title level={4} style={{ margin: 0, letterSpacing: "-0.02em" }}>
            Candour <span style={{ color: "#2F6BFF" }}>Admin</span>
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
            운영 관리자 로그인
          </Typography.Text>
        </div>
        {err && <Alert type="error" title={err} showIcon style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={onFinish} disabled={loading}>
          <Form.Item name="username" rules={[{ required: true, message: "아이디를 입력하세요" }]}>
            <Input size="large" prefix={<UserOutlined />} placeholder="아이디" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "비밀번호를 입력하세요" }]}>
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="비밀번호"
              autoComplete="current-password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            로그인
          </Button>
        </Form>
      </Card>
    </div>
  );
}
