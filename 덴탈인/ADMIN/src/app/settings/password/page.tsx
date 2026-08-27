"use client";

import { useState } from "react";
import { App, Card, Form, Input, Button, Typography } from "antd";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { useAdmin } from "@/lib/useAdmin";
import { api, setAdminToken } from "@/lib/api";

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function PasswordChangePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { admin, loading: authLoading } = useAdmin();
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  if (authLoading || !admin) return null;

  async function onFinish(values: FormValues) {
    setSubmitting(true);
    const res = await api.patch<null>("/api/admin/auth/password", {
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    });
    setSubmitting(false);
    if (res.success) {
      message.success(res.message || "비밀번호가 변경되었습니다. 다시 로그인해 주세요.");
      setAdminToken(null);
      setTimeout(() => router.replace("/login"), 600);
    } else {
      message.error(res.message || "비밀번호 변경에 실패했습니다.");
    }
  }

  return (
    <AdminShell>
      <Card title="비밀번호 변경" data-testid="admin-password-page" style={{ maxWidth: 560 }}>
        <Typography.Paragraph type="secondary">
          변경 후에는 자동으로 로그아웃되며, 새 비밀번호로 다시 로그인해야 합니다.
        </Typography.Paragraph>
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          preserve={false}
        >
          <Form.Item
            name="currentPassword"
            label="현재 비밀번호"
            rules={[{ required: true, message: "현재 비밀번호를 입력하세요." }]}
          >
            <Input.Password
              autoComplete="current-password"
              data-testid="admin-password-current"
            />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="새 비밀번호"
            rules={[
              { required: true, message: "새 비밀번호를 입력하세요." },
              {
                pattern: PASSWORD_REGEX,
                message: "영문/숫자/특수문자를 포함해 8자 이상이어야 합니다.",
              },
            ]}
          >
            <Input.Password
              autoComplete="new-password"
              data-testid="admin-password-new"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="새 비밀번호 확인"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "새 비밀번호 확인을 입력하세요." },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("새 비밀번호 확인이 일치하지 않습니다."));
                },
              }),
            ]}
          >
            <Input.Password
              autoComplete="new-password"
              data-testid="admin-password-confirm"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              data-testid="admin-password-submit"
            >
              변경
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </AdminShell>
  );
}
