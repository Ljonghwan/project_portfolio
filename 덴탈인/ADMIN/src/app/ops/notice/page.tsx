"use client";

import { useEffect, useState, useCallback } from "react";
import {
  App, Table, Tag, Input, Space, Button, Card, Modal, Form, Switch, Drawer,
} from "antd";
import AdminShell from "@/components/AdminShell";
import RichTextEditor from "@/components/RichTextEditor";
import { useAdmin } from "@/lib/useAdmin";
import { api, apiFetch } from "@/lib/api";

interface NoticeItem {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface FormValues {
  title: string;
  content: string;
  isPinned: boolean;
  isPublished: boolean;
}

export default function AdminNoticePage() {
  const { message, modal } = App.useApp();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  // C1: "초기화" — 필터 전체 리셋 + 페이지1 + 필터영역 remount.
  const [resetKey, setResetKey] = useState(0);
  const resetFilters = () => {
  setKeyword(""); setPage(1);
  setQInput("");
    setResetKey((k) => k + 1);
  };
  const [qInput, setQInput] = useState("");
  const [editTarget, setEditTarget] = useState<NoticeItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<NoticeItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (keyword) params.set("keyword", keyword);
    const res = await api.get<{ items: NoticeItem[]; total: number }>(
      `/api/admin/notices?${params.toString()}`
    );
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      message.error(res.message || "공지 목록을 불러올 수 없습니다.");
    }
  }, [page, pageSize, keyword, message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  async function handleDelete(id: number) {
    modal.confirm({
      title: "공지 삭제",
      content: "이 공지를 삭제하시겠습니까?",
      okText: "삭제",
      okButtonProps: { danger: true },
      cancelText: "취소",
      onOk: async () => {
        const res = await apiFetch(`/api/admin/notices/${id}`, { method: "DELETE" });
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

  return (
    <AdminShell>
      <Card
        title="공지사항 관리"
        data-testid="admin-notices-page"
        extra={
          <Button type="primary" onClick={() => setCreateOpen(true)} data-testid="admin-notices-create-btn">
            공지 등록
          </Button>
        }
      >
        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <Input
            placeholder="제목/본문 검색"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onPressEnter={() => {
              setKeyword(qInput.trim());
              setPage(1);
            }}
            style={{ width: 280 }}
            allowClear
            data-testid="admin-notices-search"
          />
          <Button onClick={resetFilters}>초기화</Button>
        </Space>

        <Table<NoticeItem>
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
          }}
          onChange={(p) => {
            setPage(p.current || 1);
            setPageSize(p.pageSize || 20);
          }}
          columns={[
            { title: "ID", dataIndex: "id", width: 70 },
            {
              title: "제목",
              dataIndex: "title",
              render: (v: string, r) => (
                <Space size={4}>
                  {r.isPinned && <Tag color="red">고정</Tag>}
                  <span>{v}</span>
                </Space>
              ),
            },
            { title: "조회", dataIndex: "viewCount", width: 80 },
            {
              title: "발행",
              dataIndex: "isPublished",
              width: 80,
              render: (v: boolean) => (v ? <Tag color="green">발행</Tag> : <Tag>비공개</Tag>),
            },
            {
              title: "등록일",
              dataIndex: "createdAt",
              width: 130,
              render: (v: string) => new Date(v).toLocaleDateString("ko-KR"),
            },
            {
              title: "관리",
              key: "actions",
              width: 260,
              render: (_, r) => (
                <Space size={4}>
                  <Button size="small" onClick={() => setViewTarget(r)} data-testid={`admin-notices-view-${r.id}`}>
                    보기
                  </Button>
                  <Button size="small" onClick={() => setEditTarget(r)} data-testid={`admin-notices-edit-${r.id}`}>
                    수정
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => handleDelete(r.id)}
                    data-testid={`admin-notices-delete-${r.id}`}
                  >
                    삭제
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <NoticeFormModal
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onDone={() => {
          setCreateOpen(false);
          load();
        }}
      />
      <NoticeFormModal
        mode="edit"
        target={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onDone={() => {
          setEditTarget(null);
          load();
        }}
      />

      <Drawer
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={viewTarget?.title || ""}
        size="large"
        destroyOnHidden
      >
        {viewTarget && (
          <>
            <p style={{ color: "#666", marginBottom: 16 }}>
              조회: {viewTarget.viewCount} · 등록일: {new Date(viewTarget.createdAt).toLocaleString("ko-KR")}
              {viewTarget.isPinned && <Tag color="red" style={{ marginLeft: 8 }}>고정</Tag>}
              {!viewTarget.isPublished && <Tag style={{ marginLeft: 8 }}>비공개</Tag>}
            </p>
            {/* G3 A7: 본문은 스마트에디터 HTML(서버 sanitize 저장) → HTML 렌더. img 반응형. */}
            <div
              className="rte-preview"
              style={{ fontSize: 14, lineHeight: 1.8, color: "#1a1a1a" }}
              dangerouslySetInnerHTML={{ __html: viewTarget.content }}
            />
            <style>{`.rte-preview img{max-width:100%;height:auto;border-radius:6px;margin:8px 0;}`}</style>
          </>
        )}
      </Drawer>
    </AdminShell>
  );
}

interface NoticeFormProps {
  mode: "create" | "edit";
  target?: NoticeItem | null;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

function NoticeFormModal({ mode, target, open, onClose, onDone }: NoticeFormProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  // A8: destroyOnHidden Modal은 open 시점 useEffect의 setFieldsValue가 Form 마운트 전이라 유실됨.
  // → afterOpenChange(오픈 완료 후)에서 채움(banner/terms/faq와 동일 패턴).
  const fillForm = useCallback(() => {
    if (mode === "edit" && target) {
      form.setFieldsValue({
        title: target.title,
        content: target.content,
        isPinned: target.isPinned,
        isPublished: target.isPublished,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ isPinned: false, isPublished: true } as Partial<FormValues>);
    }
  }, [mode, target, form]);

  async function submit() {
    const values = await form.validateFields();
    setLoading(true);
    const res = mode === "create"
      ? await api.post("/api/admin/notices", values)
      : await api.patch(`/api/admin/notices/${target!.id}`, values);
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
      title={mode === "create" ? "공지 등록" : `공지 수정 #${target?.id}`}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={loading}
      okText="저장"
      cancelText="취소"
      width={720}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="title" label="제목" rules={[{ required: true, max: 200 }]}>
          <Input data-testid="admin-notices-form-title" />
        </Form.Item>
        {/* G3 A7: 공지 본문 = 리치(스마트) 에디터 + 본문 이미지 삽입(allowImages). 저장 시 서버 sanitizeRichHtml(allowImages). */}
        <Form.Item name="content" label="본문" rules={[{ required: true, message: "본문을 입력하세요." }]}>
          <RichTextEditor allowImages testId="admin-notices-form-content" minHeight={320} />
        </Form.Item>
        <Space size={12}>
          <Form.Item name="isPinned" label="상단 고정" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isPublished" label="발행" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
}
