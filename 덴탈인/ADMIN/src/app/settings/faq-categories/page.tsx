"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App, Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag, Typography,
} from "antd";
import {
  ArrowUpOutlined, ArrowDownOutlined,
} from "@ant-design/icons";
import AdminShell from "@/components/AdminShell";
import { useAdmin } from "@/lib/useAdmin";
import { api, apiFetch } from "@/lib/api";

// msg-g4 D4(기획 FAQ분류관리): 분류 추가/수정/삭제 + 순서변경. 삭제 시 연결 FAQ 재지정 강제.
interface CategoryItem {
  id: number;
  name: string;
  order: number;
  isActive: boolean;
  faqCount: number;
}

export default function FaqCategoriesPage() {
  const { message, modal } = App.useApp();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createForm] = Form.useForm<{ name: string }>();
  const [editForm] = Form.useForm<{ name: string; isActive: boolean }>();
  const [deleteForm] = Form.useForm<{ reassignToId: number }>();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<{ items: CategoryItem[] }>("/api/admin/faq-categories");
    setLoading(false);
    if (res.success && res.data) setItems(res.data.items);
    else message.error(res.message || "분류 목록을 불러올 수 없습니다.");
  }, [message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  async function submitCreate() {
    try {
      const v = await createForm.validateFields();
      setSubmitting(true);
      const res = await api.post("/api/admin/faq-categories", { name: v.name });
      setSubmitting(false);
      if (!res.success) {
        message.error(res.message || "추가 실패");
        return;
      }
      message.success("분류가 추가되었습니다.");
      setCreateOpen(false);
      createForm.resetFields();
      load();
    } catch {
      setSubmitting(false);
    }
  }

  async function submitEdit() {
    if (!editTarget) return;
    try {
      const v = await editForm.validateFields();
      setSubmitting(true);
      const res = await api.patch(`/api/admin/faq-categories/${editTarget.id}`, {
        name: v.name,
        isActive: v.isActive,
      });
      setSubmitting(false);
      if (!res.success) {
        message.error(res.message || "수정 실패");
        return;
      }
      message.success("수정되었습니다. 연결된 FAQ에도 분류명이 반영됩니다.");
      setEditTarget(null);
      load();
    } catch {
      setSubmitting(false);
    }
  }

  // 순서변경: 이웃과 order 값 교환 (2회 PATCH)
  async function move(row: CategoryItem, dir: -1 | 1) {
    const sorted = [...items].sort((a, b) => a.order - b.order || a.id - b.id);
    const idx = sorted.findIndex((c) => c.id === row.id);
    const neighbor = sorted[idx + dir];
    if (!neighbor) return;
    setLoading(true);
    const r1 = await api.patch(`/api/admin/faq-categories/${row.id}`, { order: neighbor.order });
    const r2 = await api.patch(`/api/admin/faq-categories/${neighbor.id}`, { order: row.order });
    if (!r1.success || !r2.success) message.error("순서 변경 실패");
    await load();
  }

  function openDelete(row: CategoryItem) {
    setDeleteTarget(row);
    deleteForm.resetFields();
  }

  async function submitDelete() {
    if (!deleteTarget) return;
    const hasLinked = deleteTarget.faqCount > 0;
    let reassignToId: number | undefined;
    if (hasLinked) {
      try {
        const v = await deleteForm.validateFields();
        reassignToId = v.reassignToId;
      } catch {
        return;
      }
    }
    const confirmed = await new Promise<boolean>((resolve) => {
      modal.confirm({
        title: "분류 삭제",
        content: hasLinked
          ? `연결된 FAQ ${deleteTarget.faqCount}건을 선택한 분류로 이동한 뒤 "${deleteTarget.name}" 분류를 삭제합니다.`
          : `"${deleteTarget.name}" 분류를 삭제하시겠습니까?`,
        okText: "삭제",
        okButtonProps: { danger: true },
        cancelText: "취소",
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    if (!confirmed) return;
    setSubmitting(true);
    const res = await apiFetch(`/api/admin/faq-categories/${deleteTarget.id}`, {
      method: "DELETE",
      body: hasLinked ? JSON.stringify({ reassignToId }) : undefined,
    });
    setSubmitting(false);
    if (!res.success) {
      message.error(res.message || "삭제 실패");
      return;
    }
    message.success("삭제되었습니다.");
    setDeleteTarget(null);
    load();
  }

  if (authLoading || !admin) return null;

  const sorted = [...items].sort((a, b) => a.order - b.order || a.id - b.id);

  return (
    <AdminShell>
      <Card
        title="FAQ 분류관리"
        data-testid="admin-faq-categories-page"
        extra={
          <Button
            type="primary"
            onClick={() => {
              createForm.resetFields();
              setCreateOpen(true);
            }}
            data-testid="admin-faq-categories-create-btn"
          >
            분류 추가
          </Button>
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          FAQ 등록 시 선택하는 분류를 관리합니다. 분류명을 수정하면 연결된 FAQ에 자동 반영되며, 삭제 시 연결된 FAQ는 다른 분류로 이동해야 합니다.
        </Typography.Paragraph>
        <Table<CategoryItem>
          rowKey="id"
          loading={loading}
          dataSource={sorted}
          pagination={false}
          columns={[
            {
              title: "순서",
              key: "order",
              width: 120,
              render: (_, r, idx) => (
                <Space size={2}>
                  <Button
                    size="small"
                    icon={<ArrowUpOutlined />}
                    disabled={idx === 0}
                    onClick={() => move(r, -1)}
                    data-testid={`admin-faq-categories-up-${r.id}`}
                  />
                  <Button
                    size="small"
                    icon={<ArrowDownOutlined />}
                    disabled={idx === sorted.length - 1}
                    onClick={() => move(r, 1)}
                    data-testid={`admin-faq-categories-down-${r.id}`}
                  />
                </Space>
              ),
            },
            { title: "분류명", dataIndex: "name" },
            {
              title: "FAQ 수",
              dataIndex: "faqCount",
              width: 90,
              render: (v: number) => <Tag color={v > 0 ? "blue" : "default"}>{v}</Tag>,
            },
            {
              title: "노출",
              dataIndex: "isActive",
              width: 90,
              render: (v: boolean) => (v ? <Tag color="green">노출</Tag> : <Tag>숨김</Tag>),
            },
            {
              title: "관리",
              key: "actions",
              width: 160,
              render: (_, r) => (
                <Space size={4}>
                  <Button
                    size="small"
                    onClick={() => setEditTarget(r)} // A8: 프리필은 Modal afterOpenChange(필드 마운트 후)에서
                    data-testid={`admin-faq-categories-edit-${r.id}`}
                  >
                    수정
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => openDelete(r)}
                    data-testid={`admin-faq-categories-delete-${r.id}`}
                  >
                    삭제
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="분류 추가"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={submitCreate}
        confirmLoading={submitting}
        okText="등록"
        cancelText="취소"
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            label="분류명"
            name="name"
            rules={[{ required: true, message: "분류명을 입력하세요." }, { max: 50 }]}
          >
            <Input placeholder="분류명을 입력하세요." data-testid="admin-faq-categories-create-name" />
          </Form.Item>
          <Typography.Text type="secondary">새 분류는 목록 최하단에 추가됩니다.</Typography.Text>
        </Form>
      </Modal>

      <Modal
        title="분류 수정"
        open={!!editTarget}
        afterOpenChange={(opened) => {
          // A8: destroyOnHidden Modal은 마운트 후(afterOpenChange) 프리필해야 값이 유실되지 않음.
          if (opened && editTarget) editForm.setFieldsValue({ name: editTarget.name, isActive: editTarget.isActive });
        }}
        onCancel={() => setEditTarget(null)}
        onOk={submitEdit}
        confirmLoading={submitting}
        okText="저장"
        cancelText="취소"
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="분류명"
            name="name"
            rules={[{ required: true, message: "분류명을 입력하세요." }, { max: 50 }]}
          >
            <Input data-testid="admin-faq-categories-edit-name" />
          </Form.Item>
          <Form.Item label="노출" name="isActive" valuePropName="checked">
            <Switch data-testid="admin-faq-categories-edit-active" />
          </Form.Item>
          <Typography.Text type="secondary">분류명을 수정하면 연결된 FAQ에 모두 반영됩니다.</Typography.Text>
        </Form>
      </Modal>

      <Modal
        title="분류 삭제"
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onOk={submitDelete}
        confirmLoading={submitting}
        okText="삭제 진행"
        okButtonProps={{ danger: true }}
        cancelText="취소"
        destroyOnHidden
      >
        {deleteTarget && deleteTarget.faqCount > 0 ? (
          <Form form={deleteForm} layout="vertical">
            <Typography.Paragraph>
              <b>{deleteTarget.name}</b> 분류에 연결된 FAQ가 <b>{deleteTarget.faqCount}건</b> 있습니다. 삭제하려면
              해당 FAQ를 이동할 다른 분류를 선택하세요.
            </Typography.Paragraph>
            <Form.Item
              label="이동할 분류"
              name="reassignToId"
              rules={[{ required: true, message: "이동할 분류를 선택하세요." }]}
            >
              <Select
                placeholder="분류 선택"
                options={items
                  .filter((c) => c.id !== deleteTarget.id)
                  .map((c) => ({ value: c.id, label: c.name }))}
                data-testid="admin-faq-categories-delete-reassign"
              />
            </Form.Item>
          </Form>
        ) : (
          <Typography.Paragraph>
            <b>{deleteTarget?.name}</b> 분류를 삭제하시겠습니까?
          </Typography.Paragraph>
        )}
      </Modal>
    </AdminShell>
  );
}
