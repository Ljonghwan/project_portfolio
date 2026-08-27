"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  App, Table, Tag, Input, Space, Button, Card, Modal, Form, Switch, Image,
} from "antd";
import { UploadOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import AdminShell from "@/components/AdminShell";
import { useAdmin } from "@/lib/useAdmin";
import { api, apiFetch } from "@/lib/api";

// G3 A5: position(노출 위치)·노출 기간(startAt/endAt) 기능 제거.
//   배너는 활성 여부 + 정렬(sortOrder)만으로 관리. 정렬은 A6에서 ▲▼ 순서이동으로 변경.
interface BannerItem {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface FormValues {
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  isActive: boolean;
}

export default function AdminBannerPage() {
  const { message, modal } = App.useApp();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [reordering, setReordering] = useState(false);
  // C1: 배너는 필터가 없어 "초기화"=목록 새로고침(라벨 통일). resetKey는 Space 구조 일관성 유지용.
  const [resetKey, setResetKey] = useState(0);
  const [editTarget, setEditTarget] = useState<BannerItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<{ items: BannerItem[] }>(`/api/admin/banners`);
    setLoading(false);
    if (res.success && res.data) setItems(res.data.items);
    else message.error(res.message || "배너 목록을 불러올 수 없습니다.");
  }, [message]);

  const resetFilters = () => { setResetKey((k) => k + 1); load(); };

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  async function handleDelete(id: number) {
    modal.confirm({
      title: "배너 삭제",
      content: "이 배너를 삭제하시겠습니까?",
      okText: "삭제",
      okButtonProps: { danger: true },
      cancelText: "취소",
      onOk: async () => {
        const res = await apiFetch(`/api/admin/banners/${id}`, { method: "DELETE" });
        if (res.success) {
          message.success("삭제되었습니다.");
          load();
        } else {
          message.error(res.message || "삭제 실패");
        }
      },
    });
  }

  async function handleToggleActive(item: BannerItem) {
    const res = await api.patch(`/api/admin/banners/${item.id}`, { isActive: !item.isActive });
    if (res.success) {
      message.success(item.isActive ? "비활성화되었습니다." : "활성화되었습니다.");
      load();
    } else {
      message.error(res.message || "처리에 실패했습니다.");
    }
  }

  // G3 A6: FAQ분류관리와 동일한 ▲▼ 순서이동.
  //   items는 서버에서 sortOrder ASC로 정렬되어 옴. 인접 항목과 자리를 바꾼 뒤,
  //   index 기반으로 sortOrder를 재정규화(레거시 sortOrder 중복/0값에도 견고)하고 변경분만 PATCH.
  async function move(row: BannerItem, dir: "up" | "down") {
    const sorted = [...items];
    const idx = sorted.findIndex((x) => x.id === row.id);
    const nIdx = dir === "up" ? idx - 1 : idx + 1;
    if (nIdx < 0 || nIdx >= sorted.length) return;
    [sorted[idx], sorted[nIdx]] = [sorted[nIdx], sorted[idx]];
    const changed = sorted
      .map((x, i) => ({ id: x.id, sortOrder: i, prev: x.sortOrder }))
      .filter((x) => x.prev !== x.sortOrder);
    if (changed.length === 0) return;
    setReordering(true);
    const results = await Promise.all(
      changed.map((x) => api.patch(`/api/admin/banners/${x.id}`, { sortOrder: x.sortOrder }))
    );
    setReordering(false);
    if (results.every((r) => r.success)) load();
    else {
      message.error("순서 변경에 실패했습니다.");
      load();
    }
  }

  if (authLoading || !admin) return null;

  return (
    <AdminShell>
      <Card
        title="배너 관리"
        data-testid="admin-banners-page"
        extra={
          <Button type="primary" onClick={() => setCreateOpen(true)} data-testid="admin-banners-create-btn">
            배너 추가
          </Button>
        }
      >
        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <Button onClick={resetFilters}>초기화</Button>
          <span style={{ color: "#888", fontSize: 13 }}>▲▼ 버튼으로 노출 순서를 변경합니다.</span>
        </Space>

        <Table<BannerItem>
          rowKey="id"
          loading={loading || reordering}
          dataSource={items}
          pagination={false}
          columns={[
            // 그룹4 ③: ID → 일련번호(NO, 행 순번). 다른 리스트와 동일.
            { title: "NO", key: "no", width: 64, render: (_: unknown, __: BannerItem, i: number) => i + 1 },
            {
              title: "순서",
              key: "reorder",
              width: 96,
              render: (_, r, index) => (
                <Space size={2}>
                  <Button
                    size="small"
                    icon={<ArrowUpOutlined />}
                    disabled={index === 0 || reordering}
                    onClick={() => move(r, "up")}
                    data-testid={`admin-banners-up-${r.id}`}
                  />
                  <Button
                    size="small"
                    icon={<ArrowDownOutlined />}
                    disabled={index === items.length - 1 || reordering}
                    onClick={() => move(r, "down")}
                    data-testid={`admin-banners-down-${r.id}`}
                  />
                </Space>
              ),
            },
            {
              title: "이미지",
              dataIndex: "imageUrl",
              width: 120,
              render: (v: string) =>
                v ? <Image src={v} alt="" width={100} height={56} style={{ objectFit: "cover" }} /> : "-",
            },
            { title: "제목", dataIndex: "title", ellipsis: true },
            {
              title: "링크",
              dataIndex: "linkUrl",
              ellipsis: true,
              render: (v: string | null) =>
                v ? (
                  <a href={v} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                    {v}
                  </a>
                ) : (
                  "-"
                ),
            },
            {
              title: "활성",
              dataIndex: "isActive",
              width: 80,
              render: (v: boolean) => (v ? <Tag color="green">활성</Tag> : <Tag>비활성</Tag>),
            },
            {
              title: "관리",
              key: "actions",
              width: 240,
              render: (_, r) => (
                <Space size={4}>
                  <Button size="small" onClick={() => setEditTarget(r)} data-testid={`admin-banners-edit-${r.id}`}>
                    수정
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleToggleActive(r)}
                    data-testid={`admin-banners-toggle-${r.id}`}
                  >
                    {r.isActive ? "비활성화" : "활성화"}
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => handleDelete(r.id)}
                    data-testid={`admin-banners-delete-${r.id}`}
                  >
                    삭제
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <BannerFormModal
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onDone={() => {
          setCreateOpen(false);
          load();
        }}
      />
      <BannerFormModal
        mode="edit"
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

interface BannerFormProps {
  mode: "create" | "edit";
  target?: BannerItem | null;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

// qa-admin-banner-upload-redo(A): 배너 이미지 = 파일 업로드(/api/admin/upload public) → URL 세팅 + preview + 교체/삭제.
function ImageUploadField({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  const { message } = App.useApp();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // 동일 파일 재선택 허용
    if (!f) return;
    if (!/^image\//.test(f.type)) { message.error("이미지 파일만 업로드할 수 있습니다."); return; }
    if (f.size > 5 * 1024 * 1024) { message.error("파일 크기는 5MB 이하여야 합니다."); return; }
    setBusy(true);
    const fd = new FormData();
    fd.append("file", f);
    fd.append("visibility", "public");
    const res = await apiFetch<{ url: string }>("/api/admin/upload", { method: "POST", body: fd });
    setBusy(false);
    if (res.success && res.data?.url) { onChange?.(res.data.url); message.success("이미지가 업로드되었습니다."); }
    else message.error(res.message || "이미지 업로드에 실패했습니다.");
  };
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} data-testid="admin-banners-form-image-file" />
      {value ? (
        <Space orientation="vertical" size={8}>
          <Image src={value} alt="배너 미리보기" width={240} style={{ borderRadius: 8, border: "1px solid #eef1f4" }} />
          <Space>
            <Button icon={<UploadOutlined />} loading={busy} onClick={() => ref.current?.click()} data-testid="admin-banners-form-image">이미지 교체</Button>
            <Button icon={<DeleteOutlined />} danger onClick={() => onChange?.("")}>삭제</Button>
          </Space>
        </Space>
      ) : (
        <Button icon={<UploadOutlined />} loading={busy} onClick={() => ref.current?.click()} data-testid="admin-banners-form-image">이미지 업로드</Button>
      )}
    </div>
  );
}

function BannerFormModal({ mode, target, open, onClose, onDone }: BannerFormProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  // destroyOnHidden + afterOpenChange: Modal 오픈 완료(Form/ImageUploadField 마운트) 후 프리필(미리보기 포함).
  const fillForm = useCallback(() => {
    if (mode === "edit" && target) {
      form.setFieldsValue({
        title: target.title,
        imageUrl: target.imageUrl,
        linkUrl: target.linkUrl ?? undefined,
        isActive: target.isActive,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ isActive: true } as Partial<FormValues>);
    }
  }, [mode, target, form]);

  async function submit() {
    const values = await form.validateFields();
    setLoading(true);
    const payload = {
      title: values.title,
      imageUrl: values.imageUrl,
      linkUrl: values.linkUrl || null,
      isActive: !!values.isActive,
    };
    const res = mode === "create"
      ? await api.post("/api/admin/banners", payload)
      : await api.patch(`/api/admin/banners/${target!.id}`, payload);
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
      title={mode === "create" ? "배너 추가" : `배너 수정 #${target?.id}`}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={loading}
      okText="저장"
      cancelText="취소"
      width={640}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="title" label="제목" rules={[{ required: true, message: "제목을 입력하세요.", max: 200 }]}>
          <Input data-testid="admin-banners-form-title" />
        </Form.Item>
        <Form.Item name="imageUrl" label="배너 이미지" rules={[{ required: true, message: "배너 이미지를 업로드하세요." }]}>
          <ImageUploadField />
        </Form.Item>
        <Form.Item
          name="linkUrl"
          label="링크 URL (전체 주소, 선택)"
          extra="클릭 시 이동할 전체 주소를 입력하세요. 예) https://example.com/event"
        >
          <Input placeholder="https://example.com/..." data-testid="admin-banners-form-link" />
        </Form.Item>
        <Form.Item name="isActive" label="활성 여부" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
