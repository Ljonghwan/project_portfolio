"use client";

import { useEffect, useState, useCallback } from "react";
import {
  App, Table, Tag, Input, Select, Space, Button, Card, Drawer, Modal, Form, DatePicker, Checkbox,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import AdminShell from "@/components/AdminShell";
import RichTextEditor from "@/components/RichTextEditor";
import { useAdmin } from "@/lib/useAdmin";
import { api, apiFetch } from "@/lib/api";

type TermsType = "service" | "privacy" | "marketing" | "thirdParty" | "withdrawal" | "qnaPrivacy";

const TYPE_LABELS: Record<TermsType, string> = {
  service: "이용약관",
  privacy: "개인정보처리방침",
  marketing: "마케팅 수신동의",
  thirdParty: "제3자 정보제공",
  withdrawal: "회원탈퇴 약관",
  qnaPrivacy: "문의하기 약관(개인정보 동의)",
};

const TYPE_OPTS = [
  { value: "", label: "전체" },
  { value: "service", label: TYPE_LABELS.service },
  { value: "privacy", label: TYPE_LABELS.privacy },
  { value: "marketing", label: TYPE_LABELS.marketing },
  { value: "thirdParty", label: TYPE_LABELS.thirdParty },
  { value: "withdrawal", label: TYPE_LABELS.withdrawal },
  { value: "qnaPrivacy", label: TYPE_LABELS.qnaPrivacy },
];

// p2-mypage-g5 Q2=A: WYSIWYG 패턴(contentEditable + execCommand). G3 A7에서 공통 `RichTextEditor`로 추출.
// 약관은 이미지 미허용(allowImages 생략).

interface TermsItem {
  id: number;
  type: TermsType;
  version: string;
  title: string;
  content: string;
  effectiveAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormValues {
  type: TermsType;
  version: string;
  title: string;
  content: string;
  effectiveAt: Dayjs;
  isActive: boolean;
}

export default function AdminTermsPage() {
  const { message, modal } = App.useApp();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<TermsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<string>("");
  // C1: "초기화" — 필터 전체 리셋 + 페이지1 + 필터영역 remount.
  const [resetKey, setResetKey] = useState(0);
  const resetFilters = () => {
  setType("");
    setResetKey((k) => k + 1);
  };
  const [editTarget, setEditTarget] = useState<TermsItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<TermsItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    const res = await api.get<{ items: TermsItem[] }>(`/api/admin/terms?${params.toString()}`);
    setLoading(false);
    if (res.success && res.data) setItems(res.data.items);
    else message.error(res.message || "약관 목록을 불러올 수 없습니다.");
  }, [type, message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  async function handleDelete(id: number) {
    modal.confirm({
      title: "약관 삭제",
      content: "이 약관을 삭제하시겠습니까? (활성 약관은 삭제 불가)",
      okText: "삭제",
      okButtonProps: { danger: true },
      cancelText: "취소",
      onOk: async () => {
        const res = await apiFetch(`/api/admin/terms/${id}`, { method: "DELETE" });
        if (res.success) {
          message.success("삭제되었습니다.");
          load();
        } else {
          message.error(res.message || "삭제 실패");
        }
      },
    });
  }

  async function handleActivate(id: number) {
    const res = await api.patch(`/api/admin/terms/${id}/activate`);
    if (res.success) {
      message.success("활성화되었습니다.");
      load();
    } else {
      message.error(res.message || "활성화 실패");
    }
  }

  if (authLoading || !admin) return null;

  return (
    <AdminShell>
      <Card
        title="약관 관리"
        data-testid="admin-terms-page"
        extra={
          <Button type="primary" onClick={() => setCreateOpen(true)} data-testid="admin-terms-create-btn">
            약관 추가
          </Button>
        }
      >
        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <Select
            value={type}
            options={TYPE_OPTS}
            onChange={setType}
            style={{ width: 200 }}
            data-testid="admin-terms-type-filter"
          />
          <Button onClick={resetFilters}>초기화</Button>
        </Space>

        <Table<TermsItem>
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={{ pageSize: 20 }}
          columns={[
            { title: "ID", dataIndex: "id", width: 70 },
            {
              title: "구분",
              dataIndex: "type",
              width: 160,
              render: (v: TermsType) => TYPE_LABELS[v],
            },
            { title: "버전", dataIndex: "version", width: 100 },
            { title: "제목", dataIndex: "title", ellipsis: true },
            {
              title: "시행일",
              dataIndex: "effectiveAt",
              width: 130,
              render: (v: string) => new Date(v).toLocaleDateString("ko-KR"),
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
              width: 320,
              render: (_, r) => (
                <Space size={4}>
                  <Button size="small" onClick={() => setViewTarget(r)} data-testid={`admin-terms-view-${r.id}`}>
                    보기
                  </Button>
                  <Button size="small" onClick={() => setEditTarget(r)} data-testid={`admin-terms-edit-${r.id}`}>
                    수정
                  </Button>
                  {!r.isActive && (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => handleActivate(r.id)}
                      data-testid={`admin-terms-activate-${r.id}`}
                    >
                      활성화
                    </Button>
                  )}
                  <Button
                    size="small"
                    danger
                    onClick={() => handleDelete(r.id)}
                    disabled={r.isActive}
                    data-testid={`admin-terms-delete-${r.id}`}
                  >
                    삭제
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <TermsFormModal
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onDone={() => {
          setCreateOpen(false);
          load();
        }}
      />
      <TermsFormModal
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
        title={viewTarget ? `${TYPE_LABELS[viewTarget.type]} v${viewTarget.version}` : ""}
        size="large"
        destroyOnHidden
      >
        {viewTarget && (
          <>
            <p style={{ color: "#666", marginBottom: 8 }}>
              시행일: {new Date(viewTarget.effectiveAt).toLocaleDateString("ko-KR")}
              {viewTarget.isActive && <Tag color="green" style={{ marginLeft: 8 }}>활성</Tag>}
            </p>
            <h3 style={{ marginTop: 0 }}>{viewTarget.title}</h3>
            {/* p2-mypage-g5: 본문은 WYSIWYG HTML(서버 sanitizeRichHtml 적용 후 저장) → HTML 렌더 */}
            <div style={{ fontSize: 14, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: viewTarget.content }} />
          </>
        )}
      </Drawer>
    </AdminShell>
  );
}

interface TermsFormProps {
  mode: "create" | "edit";
  target?: TermsItem | null;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

function TermsFormModal({ mode, target, open, onClose, onDone }: TermsFormProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  // 문의하기 약관(qnaPrivacy)만 plain textarea 저장(다른 타입은 WYSIWYG 유지).
  const watchType = Form.useWatch("type", form);

  // BUG-2 fix(p2-mypage-g5-1): Modal destroyOnHidden로 Form이 닫힐 때 언마운트됨 →
  // open 시점 useEffect의 setFieldsValue가 Form 마운트 전이라 유실. afterOpenChange(오픈 완료 후)에서 채움.
  const fillForm = useCallback(() => {
    if (mode === "edit" && target) {
      form.setFieldsValue({
        type: target.type,
        version: target.version,
        title: target.title,
        content: target.content,
        effectiveAt: dayjs(target.effectiveAt),
        isActive: target.isActive,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        type: "service",
        isActive: false,
        effectiveAt: dayjs(),
      } as Partial<FormValues>);
    }
  }, [mode, target, form]);

  async function submit() {
    const values = await form.validateFields();
    setLoading(true);
    const payload = {
      type: values.type,
      version: values.version,
      title: values.title,
      content: values.content,
      effectiveAt: values.effectiveAt.toISOString(),
      isActive: !!values.isActive,
    };
    const res = mode === "create"
      ? await api.post("/api/admin/terms", payload)
      : await api.patch(`/api/admin/terms/${target!.id}`, payload);
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
      title={mode === "create" ? "약관 추가" : `약관 수정 #${target?.id}`}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={loading}
      okText="저장"
      cancelText="취소"
      width={720}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="type" label="구분" rules={[{ required: true }]}>
          <Select
            options={[
              { value: "service", label: TYPE_LABELS.service },
              { value: "privacy", label: TYPE_LABELS.privacy },
              { value: "marketing", label: TYPE_LABELS.marketing },
              { value: "thirdParty", label: TYPE_LABELS.thirdParty },
              { value: "withdrawal", label: TYPE_LABELS.withdrawal },
              { value: "qnaPrivacy", label: TYPE_LABELS.qnaPrivacy },
            ]}
            data-testid="admin-terms-form-type"
          />
        </Form.Item>
        <Form.Item name="version" label="버전 (예: 1.0)" rules={[{ required: true, max: 30 }]}>
          <Input data-testid="admin-terms-form-version" />
        </Form.Item>
        <Form.Item name="title" label="제목" rules={[{ required: true, max: 200 }]}>
          <Input data-testid="admin-terms-form-title" />
        </Form.Item>
        <Form.Item name="effectiveAt" label="시행일" rules={[{ required: true }]}>
          <DatePicker
            style={{ width: 200 }}
            data-testid="admin-terms-form-effective-at"
          />
        </Form.Item>
        <Form.Item name="content" label="본문" rules={[{ required: true }]}>
          {/* 문의하기 약관만 plain textarea(줄바꿈 보존, HTML 아님). 그 외는 WYSIWYG. */}
          {watchType === "qnaPrivacy" ? (
            <Input.TextArea rows={12} data-testid="admin-terms-form-content" placeholder="개인정보 수집 및 이용 동의 본문 (plain text — 줄바꿈은 그대로 표시됩니다)" />
          ) : (
            <RichTextEditor testId="admin-terms-form-content" />
          )}
        </Form.Item>
        <Form.Item name="isActive" label="활성 여부" valuePropName="checked">
          {/* native input → antd Checkbox: checked undefined→false 정규화로 uncontrolled→controlled 경고 제거(p2-mypage-g5-1 재검 LOW) */}
          <Checkbox data-testid="admin-terms-form-active" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
