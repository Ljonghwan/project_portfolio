"use client";

// 본인 비밀번호 변경(카드#029) — 전 등급이 쓴다. 헤더 드롭다운에서 연다.
import { useState } from "react";
import { App, Form, Input, Modal } from "antd";
import { api } from "@/lib/api";
import { ADMIN_ACCOUNT_TEXT as T } from "@/lib/labels";

type Values = { currentPassword: string; newPassword: string };

export default function ChangePasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const [saving, setSaving] = useState(false);

  async function submit() {
    const v = await form.validateFields();
    setSaving(true);
    try {
      await api.post("/api/admin/auth/password", v);
      message.success(T.passwordChanged);
      form.resetFields();
      onClose();
    } catch (e) {
      message.error(e instanceof Error ? e.message : T.loadFailed);
    }
    setSaving(false);
  }

  return (
    <Modal
      open={open}
      title={T.changeMyPassword}
      okText={T.changeMyPassword}
      cancelText="취소"
      confirmLoading={saving}
      onOk={() => void submit()}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="currentPassword"
          label={T.currentPassword}
          rules={[{ required: true, message: "현재 비밀번호를 입력해주세요" }]}
        >
          {/* 관리자 비밀번호가 브라우저 자동완성으로 흘러나가지 않게 한다. */}
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label={T.newPassword}
          extra={T.passwordHint}
          rules={[{ required: true, min: 8, message: T.passwordHint }]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
