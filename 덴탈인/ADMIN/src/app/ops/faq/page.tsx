"use client";

import { useEffect, useState, useCallback } from "react";
import {
  App, Table, Tag, Input, Select, Space, Button, Card, Modal, Form, InputNumber, Switch,
} from "antd";
import AdminShell from "@/components/AdminShell";
import { useAdmin } from "@/lib/useAdmin";
import { api, apiFetch } from "@/lib/api";

// msg-g4 D4: FAQ 분류는 동적(FaqCategory). 고정 enum 라벨맵 제거 — /api/admin/faq-categories 소비.
interface FaqCategoryItem {
  id: number;
  name: string;
  order: number;
  isActive: boolean;
  faqCount: number;
}

interface FaqItem {
  id: number;
  categoryId: number | null;
  categoryName: string | null;
  question: string;
  answer: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormValues {
  categoryId: number;
  question: string;
  answer: string;
  order: number;
  isPublished: boolean;
}

export default function AdminFaqPage() {
  const { message, modal } = App.useApp();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [categories, setCategories] = useState<FaqCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState<number | "">("");
  // C1: "초기화" — 필터 전체 리셋 + 페이지1 + 필터영역 remount.
  const [resetKey, setResetKey] = useState(0);
  const resetFilters = () => {
  setCategoryId("");
    setResetKey((k) => k + 1);
  };
  const [editTarget, setEditTarget] = useState<FaqItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    const res = await api.get<{ items: FaqCategoryItem[] }>("/api/admin/faq-categories");
    if (res.success && res.data) setCategories(res.data.items);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId) params.set("categoryId", String(categoryId));
    const res = await api.get<{ items: FaqItem[] }>(`/api/admin/faqs?${params.toString()}`);
    setLoading(false);
    if (res.success && res.data) setItems(res.data.items);
    else message.error(res.message || "FAQ 목록을 불러올 수 없습니다.");
  }, [categoryId, message]);

  useEffect(() => {
    if (admin) {
      loadCategories();
      load();
    }
  }, [admin, loadCategories, load]);

  async function handleDelete(id: number) {
    modal.confirm({
      title: "FAQ 삭제",
      content: "이 FAQ를 삭제하시겠습니까?",
      okText: "삭제",
      okButtonProps: { danger: true },
      cancelText: "취소",
      onOk: async () => {
        const res = await apiFetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
        if (res.success) {
          message.success("삭제되었습니다.");
          load();
        } else {
          message.error(res.message || "삭제 실패");
        }
      },
    });
  }

  if (authLoading || !admin) return null;

  const filterOpts = [
    { value: "", label: "전체 분류" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <AdminShell>
      <Card
        title="FAQ"
        data-testid="admin-faqs-page"
        extra={
          <Button
            type="primary"
            onClick={() => setCreateOpen(true)}
            disabled={categories.length === 0}
            data-testid="admin-faqs-create-btn"
          >
            FAQ 추가
          </Button>
        }
      >
        {categories.length === 0 && (
          <p style={{ color: "#cf1322", marginBottom: 12 }}>
            등록된 FAQ 분류가 없습니다. 먼저 [설정 &gt; FAQ 분류관리]에서 분류를 추가하세요.
          </p>
        )}
        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <Select
            value={categoryId}
            options={filterOpts}
            onChange={(v) => setCategoryId(v as number | "")}
            style={{ width: 200 }}
            data-testid="admin-faqs-category-filter"
          />
          <Button onClick={resetFilters}>초기화</Button>
        </Space>

        <Table<FaqItem>
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={{ pageSize: 20 }}
          expandable={{
            expandedRowRender: (r) => (
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit" }}>{r.answer}</pre>
            ),
          }}
          columns={[
            { title: "ID", dataIndex: "id", width: 70 },
            {
              title: "분류",
              dataIndex: "categoryName",
              width: 140,
              render: (v: string | null) => v || <Tag>미분류</Tag>,
            },
            { title: "질문", dataIndex: "question" },
            { title: "정렬", dataIndex: "order", width: 70 },
            {
              title: "발행",
              dataIndex: "isPublished",
              width: 80,
              render: (v: boolean) => (v ? <Tag color="green">발행</Tag> : <Tag>비공개</Tag>),
            },
            {
              title: "관리",
              key: "actions",
              width: 200,
              render: (_, r) => (
                <Space size={4}>
                  <Button size="small" onClick={() => setEditTarget(r)} data-testid={`admin-faqs-edit-${r.id}`}>
                    수정
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => handleDelete(r.id)}
                    data-testid={`admin-faqs-delete-${r.id}`}
                  >
                    삭제
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <FaqFormModal
        mode="create"
        categories={categories}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onDone={() => {
          setCreateOpen(false);
          load();
        }}
      />
      <FaqFormModal
        mode="edit"
        categories={categories}
        target={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onDone={() => {
          setEditTarget(null);
          load();
        }}
      />
    </AdminShell>
  );
}

interface FaqFormProps {
  mode: "create" | "edit";
  categories: FaqCategoryItem[];
  target?: FaqItem | null;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

function FaqFormModal({ mode, categories, target, open, onClose, onDone }: FaqFormProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  // A8: destroyOnHidden Modal은 open 시점 useEffect에서 setFieldsValue 하면 Form 마운트 전이라 유실됨(수정 데이터 미채움 버그).
  // → afterOpenChange(오픈 완료 후 = 필드 마운트 후)에서 채움(banner/terms와 동일 패턴).
  const fillForm = useCallback(() => {
    if (mode === "edit" && target) {
      form.setFieldsValue({
        categoryId: target.categoryId ?? undefined,
        question: target.question,
        answer: target.answer,
        order: target.order,
        isPublished: target.isPublished,
      } as Partial<FormValues>);
    } else {
      form.resetFields();
      form.setFieldsValue({
        categoryId: categories[0]?.id,
        order: 0,
        isPublished: true,
      } as Partial<FormValues>);
    }
  }, [mode, target, form, categories]);

  async function submit() {
    const values = await form.validateFields();
    setLoading(true);
    const res = mode === "create"
      ? await api.post("/api/admin/faqs", values)
      : await api.patch(`/api/admin/faqs/${target!.id}`, values);
    setLoading(false);
    if (res.success) {
      message.success(mode === "create" ? "등록되었습니다." : "수정되었습니다.");
      onDone();
    } else {
      message.error(res.message || "처리에 실패했습니다.");
    }
  }

  return (
    <Modal
      open={open}
      afterOpenChange={(opened) => { if (opened) fillForm(); }}
      title={mode === "create" ? "FAQ 추가" : `FAQ 수정 #${target?.id}`}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={loading}
      okText="저장"
      cancelText="취소"
      width={640}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="categoryId" label="분류" rules={[{ required: true, message: "분류를 선택하세요." }]}>
          <Select
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="분류 선택"
            data-testid="admin-faqs-form-category"
          />
        </Form.Item>
        <Form.Item name="question" label="질문" rules={[{ required: true, max: 200 }]}>
          <Input data-testid="admin-faqs-form-question" />
        </Form.Item>
        <Form.Item name="answer" label="답변" rules={[{ required: true }]}>
          <Input.TextArea rows={8} data-testid="admin-faqs-form-answer" />
        </Form.Item>
        <Space size={12}>
          <Form.Item name="order" label="정렬 순서">
            <InputNumber min={0} max={9999} />
          </Form.Item>
          <Form.Item name="isPublished" label="발행" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
}
