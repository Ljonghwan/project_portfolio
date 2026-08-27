"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Form, Input, Button, Typography, Alert } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { api, setAdminToken } from "@/lib/api";
import AdminLogo from "@/components/AdminLogo";

interface LoginResponse {
  accessToken: string;
  admin: { id: number; email: string; name: string; role: "super" | "staff" };
}

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFinish(values: { email: string; password: string }) {
    setLoading(true);
    setErr(null);
    const res = await api.post<LoginResponse>("/api/admin/auth/login", values, false);
    setLoading(false);
    if (!res.success || !res.data) {
      setErr(res.message || "로그인에 실패했습니다.");
      return;
    }
    setAdminToken(res.data.accessToken);
    router.replace("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F5F7FA" }}>
      <Card style={{ width: 380 }}>
        {/* 사이드메뉴(AdminShell)와 동일한 로고 재사용 — 밝은 카드 배경용 light variant. */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <AdminLogo variant="light" badgeSize={40} fontSize={24} />
        </div>
        <Typography.Paragraph type="secondary" style={{ textAlign: "center", marginTop: 6 }}>
          운영자 전용 로그인
        </Typography.Paragraph>
        {err && <Alert type="error" title={err} showIcon style={{ marginBottom: 12 }} />}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="아이디" rules={[{ required: true, message: "아이디를 입력하세요." }, { type: "email", message: "이메일 형식이 올바르지 않습니다." }]}>
            <Input prefix={<UserOutlined />} placeholder="email" size="large" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="비밀번호" rules={[{ required: true, message: "비밀번호를 입력하세요." }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="password" size="large" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            로그인
          </Button>
        </Form>
      </Card>
    </div>
  );
}
