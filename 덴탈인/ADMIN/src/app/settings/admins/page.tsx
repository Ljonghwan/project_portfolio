"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TablePaginationConfig } from "antd";
import AdminShell from "@/components/AdminShell";
import {
  useAdmin,
  ADMIN_MENU_KEYS,
  ADMIN_MENU_LABELS,
  type AdminMenuKey,
  type AdminPermissions,
} from "@/lib/useAdmin";
import { api, apiFetch } from "@/lib/api";
import { formatPhone } from "@/lib/format";

type AdminRole = "super" | "staff";

// 권한 객체 → 체크된 메뉴키 배열 / 배열 → 객체 변환 (Checkbox.Group 호환)
function permsToArray(p?: Partial<AdminPermissions> | null): AdminMenuKey[] {
  if (!p) return [];
  return ADMIN_MENU_KEYS.filter((k) => p[k] === true);
}
function arrayToPerms(arr: AdminMenuKey[]): AdminPermissions {
  return ADMIN_MENU_KEYS.reduce((acc, k) => {
    acc[k] = arr.includes(k);
    return acc;
  }, {} as AdminPermissions);
}
const MENU_OPTIONS = ADMIN_MENU_KEYS.map((k) => ({ value: k, label: ADMIN_MENU_LABELS[k] }));

interface AdminItem {
  id: number;
  email: string;
  emailMasked: string;
  name: string;
  role: AdminRole;
  department: string | null;
  position: string | null;
  contact: string | null;
  permissions: AdminPermissions;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const ROLE_OPTS: { value: "" | AdminRole; label: string }[] = [
  { value: "", label: "전체" },
  { value: "super", label: "수퍼관리자" },
  { value: "staff", label: "운영자" },
];

const ACTIVE_OPTS: { value: "" | "true" | "false"; label: string }[] = [
  { value: "", label: "전체" },
  { value: "true", label: "활성" },
  { value: "false", label: "비활성" },
];

const ROLE_LABEL: Record<AdminRole, string> = {
  super: "수퍼관리자",
  staff: "운영자",
};

export default function AdminsPage() {
  const { message, modal } = App.useApp();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<AdminItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"" | AdminRole>("");
  const [isActive, setIsActive] = useState<"" | "true" | "false">("");
  const [q, setQ] = useState("");
  // C1: "초기화" — 필터 전체 리셋 + 페이지1 + 필터영역 remount.
  const [resetKey, setResetKey] = useState(0);
  const resetFilters = () => {
  setRole(""); setIsActive(""); setQ(""); setPage(1);
  setQInput("");
    setResetKey((k) => k + 1);
  };
  const [qInput, setQInput] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminItem | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminItem | null>(null);

  const [createForm] = Form.useForm<{
    email: string;
    password: string;
    name: string;
    role: AdminRole;
    department?: string;
    position?: string;
    contact?: string;
    permissions?: AdminMenuKey[];
  }>();
  const [editForm] = Form.useForm<{
    name: string;
    role: AdminRole;
    department?: string;
    position?: string;
    contact?: string;
    permissions?: AdminMenuKey[];
    isActive: boolean;
  }>();
  const createRole = Form.useWatch("role", createForm);
  const editRole = Form.useWatch("role", editForm);
  const [resetForm] = Form.useForm<{ newPassword: string; reason: string }>();
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (role) params.set("role", role);
    if (isActive) params.set("isActive", isActive);
    if (q) params.set("q", q);
    const res = await api.get<{ items: AdminItem[]; total: number }>(
      `/api/admin/admins?${params.toString()}`
    );
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      message.error(res.message || "운영자 목록을 불러올 수 없습니다.");
    }
  }, [page, pageSize, role, isActive, q, message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  function openEdit(row: AdminItem) {
    // A8: 프리필은 Modal afterOpenChange(필드 마운트 후)에서 — destroyOnHidden 폼 값 유실 방지.
    setEditTarget(row);
  }

  function fillEditForm(row: AdminItem) {
    editForm.setFieldsValue({
      name: row.name,
      role: row.role,
      department: row.department ?? undefined,
      position: row.position ?? undefined,
      contact: row.contact ?? undefined,
      permissions: permsToArray(row.permissions),
      isActive: row.isActive,
    });
  }

  function openReset(row: AdminItem) {
    setResetTarget(row);
    resetForm.resetFields();
  }

  async function submitCreate() {
    try {
      const v = await createForm.validateFields();
      setSubmitting(true);
      const payload = { ...v, permissions: arrayToPerms(v.permissions ?? []) };
      const res = await api.post<AdminItem>("/api/admin/admins", payload);
      setSubmitting(false);
      if (!res.success) {
        message.error(res.message || "생성 실패");
        return;
      }
      message.success("운영자 계정이 생성되었습니다.");
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
      const payload = { ...v, permissions: arrayToPerms(v.permissions ?? []) };
      const res = await api.patch<AdminItem>(`/api/admin/admins/${editTarget.id}`, payload);
      setSubmitting(false);
      if (!res.success) {
        message.error(res.message || "수정 실패");
        return;
      }
      message.success("수정되었습니다.");
      setEditTarget(null);
      load();
    } catch {
      setSubmitting(false);
    }
  }

  // 그룹4 ④: 운영자 계정 삭제(Popconfirm). 본인/마지막 super는 서버 가드(CANNOT_DELETE_SELF/LAST_SUPER).
  async function handleDelete(row: AdminItem) {
    const res = await apiFetch(`/api/admin/admins/${row.id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason: "운영자 계정 삭제" }),
    });
    if (res.success) {
      message.success("운영자 계정을 삭제했습니다.");
      load();
    } else {
      message.error(res.message || "삭제에 실패했습니다.");
    }
  }

  async function submitReset() {
    if (!resetTarget) return;
    try {
      const v = await resetForm.validateFields();
      const confirmed = await new Promise<boolean>((resolve) => {
        modal.confirm({
          title: "비밀번호 재설정",
          content: `${resetTarget.name} (${resetTarget.email}) 의 비밀번호를 재설정하시겠습니까?`,
          okText: "재설정",
          cancelText: "취소",
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (!confirmed) return;
      setSubmitting(true);
      const res = await api.patch(`/api/admin/admins/${resetTarget.id}/password`, v);
      setSubmitting(false);
      if (!res.success) {
        message.error(res.message || "비밀번호 재설정 실패");
        return;
      }
      message.success("비밀번호가 재설정되었습니다.");
      setResetTarget(null);
      load();
    } catch {
      setSubmitting(false);
    }
  }

  if (authLoading || !admin) return null;

  const isSuper = admin.role === "super";

  return (
    <AdminShell>
      <Card
        title="관리자 계정"
        data-testid="admin-admins-page"
        extra={
          isSuper ? (
            <Button
              type="primary"
              onClick={() => {
                createForm.resetFields();
                setCreateOpen(true);
              }}
              data-testid="admin-admins-create-btn"
            >
              + 신규 운영자
            </Button>
          ) : null
        }
      >
        {!isSuper && (
          <Typography.Paragraph type="warning" style={{ marginBottom: 16 }}>
            운영자 계정 관리는 수퍼관리자(super) 권한 계정만 사용할 수 있습니다.
          </Typography.Paragraph>
        )}

        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <Input
            placeholder="이메일/이름 검색"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onPressEnter={() => {
              setQ(qInput.trim());
              setPage(1);
            }}
            allowClear
            style={{ width: 240 }}
            data-testid="admin-admins-search"
          />
          <Select
            value={role}
            options={ROLE_OPTS}
            onChange={(v) => {
              setRole(v);
              setPage(1);
            }}
            style={{ width: 140 }}
            data-testid="admin-admins-role-filter"
          />
          <Select
            value={isActive}
            options={ACTIVE_OPTS}
            onChange={(v) => {
              setIsActive(v);
              setPage(1);
            }}
            style={{ width: 120 }}
            data-testid="admin-admins-active-filter"
          />
          <Button onClick={resetFilters}>초기화</Button>
        </Space>

        <Table<AdminItem>
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
          }}
          onChange={(p: TablePaginationConfig) => {
            setPage(p.current || 1);
            setPageSize(p.pageSize || 20);
          }}
          columns={[
            { title: "ID", dataIndex: "id", width: 70 },
            { title: "이름", dataIndex: "name", width: 120 },
            { title: "이메일", dataIndex: "email", ellipsis: true },
            {
              title: "권한",
              dataIndex: "role",
              width: 110,
              render: (r: AdminRole) => (
                <Tag color={r === "super" ? "purple" : "blue"}>{ROLE_LABEL[r]}</Tag>
              ),
            },
            {
              title: "부서",
              dataIndex: "department",
              width: 100,
              render: (v: string | null) => v || "-",
            },
            {
              title: "직책",
              dataIndex: "position",
              width: 90,
              render: (v: string | null) => v || "-",
            },
            {
              title: "연락처",
              dataIndex: "contact",
              width: 130,
              // G4 C1: 휴대폰 형식이면 하이픈 표시(방어적 — 자릿수 안 맞으면 원본). 자유텍스트 연락처는 그대로.
              render: (v: string | null) => (v ? formatPhone(v) : "-"),
            },
            {
              title: "메뉴 권한",
              key: "permissions",
              width: 220,
              render: (_, r) =>
                r.role === "super" ? (
                  <Tag color="purple">전체 권한</Tag>
                ) : (
                  <Space size={[2, 2]} wrap>
                    {permsToArray(r.permissions).length === 0 ? (
                      <span style={{ color: "#aaa" }}>없음</span>
                    ) : (
                      permsToArray(r.permissions).map((k) => (
                        <Tag key={k} color="blue" style={{ marginInlineEnd: 0 }}>
                          {ADMIN_MENU_LABELS[k].replace(/\(.*\)/, "")}
                        </Tag>
                      ))
                    )}
                  </Space>
                ),
            },
            {
              title: "활성",
              dataIndex: "isActive",
              width: 90,
              render: (v: boolean) =>
                v ? <Tag color="green">활성</Tag> : <Tag color="red">비활성</Tag>,
            },
            {
              title: "최근 로그인",
              dataIndex: "lastLoginAt",
              width: 160,
              render: (v: string | null) =>
                v ? new Date(v).toLocaleString("ko-KR") : "-",
            },
            {
              title: "등록일",
              dataIndex: "createdAt",
              width: 120,
              render: (v: string) => new Date(v).toLocaleDateString("ko-KR"),
            },
            {
              title: "관리",
              key: "actions",
              width: 180,
              render: (_, r) => (
                <Space>
                  <Button
                    size="small"
                    disabled={!isSuper}
                    onClick={() => openEdit(r)}
                    data-testid={`admin-admins-edit-${r.id}`}
                  >
                    수정
                  </Button>
                  <Button
                    size="small"
                    disabled={!isSuper || r.id === admin.id}
                    onClick={() => openReset(r)}
                    data-testid={`admin-admins-reset-${r.id}`}
                  >
                    비밀번호
                  </Button>
                  {/* 그룹4 ④: 삭제(본인 제외). 마지막 super는 서버 가드. */}
                  <Popconfirm
                    title="운영자 계정을 삭제하시겠습니까?"
                    description="삭제 후 복구할 수 없습니다."
                    okText="삭제"
                    cancelText="취소"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDelete(r)}
                    disabled={!isSuper || r.id === admin.id}
                  >
                    <Button
                      size="small"
                      danger
                      disabled={!isSuper || r.id === admin.id}
                      data-testid={`admin-admins-delete-${r.id}`}
                    >
                      삭제
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="신규 운영자"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={submitCreate}
        confirmLoading={submitting}
        okText="생성"
        cancelText="취소"
        destroyOnHidden
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ role: "staff" }}
        >
          <Form.Item
            label="이메일"
            name="email"
            rules={[
              { required: true, message: "이메일을 입력하세요." },
              { type: "email", message: "이메일 형식이 올바르지 않습니다." },
              { max: 190 },
            ]}
          >
            <Input data-testid="admin-admins-create-email" />
          </Form.Item>
          <Form.Item
            label="이름"
            name="name"
            rules={[{ required: true, message: "이름을 입력하세요." }, { max: 50 }]}
          >
            <Input data-testid="admin-admins-create-name" />
          </Form.Item>
          <Form.Item
            label="비밀번호"
            name="password"
            rules={[
              { required: true, message: "비밀번호를 입력하세요." },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                message: "영문/숫자/특수문자를 포함해 8자 이상이어야 합니다.",
              },
            ]}
          >
            <Input.Password data-testid="admin-admins-create-password" />
          </Form.Item>
          <Form.Item
            label="권한"
            name="role"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "super", label: "수퍼관리자" },
                { value: "staff", label: "운영자" },
              ]}
              data-testid="admin-admins-create-role"
            />
          </Form.Item>
          <Form.Item label="부서" name="department" rules={[{ max: 50 }]}>
            <Input placeholder="예: 콘텐츠팀" data-testid="admin-admins-create-department" />
          </Form.Item>
          <Form.Item label="직책" name="position" rules={[{ max: 50 }]}>
            <Input placeholder="예: 대리" data-testid="admin-admins-create-position" />
          </Form.Item>
          <Form.Item label="연락처" name="contact" rules={[{ max: 30 }]}>
            <Input placeholder="예: 010-1234-5678" data-testid="admin-admins-create-contact" />
          </Form.Item>
          <Form.Item
            label="메뉴 권한"
            name="permissions"
            // 그룹4 ④: 운영자(staff)는 메뉴 권한 1개 이상 필수.
            rules={createRole === "super" ? [] : [{ validator: (_, v: string[]) => (v && v.length > 0 ? Promise.resolve() : Promise.reject(new Error("메뉴 권한을 1개 이상 선택하세요."))) }]}
          >
            {createRole === "super" ? (
              <Typography.Text type="secondary">수퍼관리자는 모든 메뉴에 접근합니다.</Typography.Text>
            ) : (
              <Checkbox.Group options={MENU_OPTIONS} data-testid="admin-admins-create-permissions" />
            )}
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="운영자 수정"
        open={!!editTarget}
        afterOpenChange={(opened) => { if (opened && editTarget) fillEditForm(editTarget); }}
        onCancel={() => setEditTarget(null)}
        onOk={submitEdit}
        confirmLoading={submitting}
        okText="저장"
        cancelText="취소"
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="이메일">
            <Input value={editTarget?.email ?? ""} disabled />
          </Form.Item>
          <Form.Item
            label="이름"
            name="name"
            rules={[{ required: true }, { max: 50 }]}
          >
            <Input data-testid="admin-admins-edit-name" />
          </Form.Item>
          <Form.Item label="권한" name="role" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "super", label: "수퍼관리자" },
                { value: "staff", label: "운영자" },
              ]}
              disabled={editTarget?.id === admin.id}
              data-testid="admin-admins-edit-role"
            />
          </Form.Item>
          <Form.Item label="부서" name="department" rules={[{ max: 50 }]}>
            <Input placeholder="예: 콘텐츠팀" data-testid="admin-admins-edit-department" />
          </Form.Item>
          <Form.Item label="직책" name="position" rules={[{ max: 50 }]}>
            <Input placeholder="예: 대리" data-testid="admin-admins-edit-position" />
          </Form.Item>
          <Form.Item label="연락처" name="contact" rules={[{ max: 30 }]}>
            <Input placeholder="예: 010-1234-5678" data-testid="admin-admins-edit-contact" />
          </Form.Item>
          <Form.Item
            label="메뉴 권한"
            name="permissions"
            // 그룹4 ④: 운영자(staff)는 메뉴 권한 1개 이상 필수.
            rules={editRole === "super" ? [] : [{ validator: (_, v: string[]) => (v && v.length > 0 ? Promise.resolve() : Promise.reject(new Error("메뉴 권한을 1개 이상 선택하세요."))) }]}
          >
            {editRole === "super" ? (
              <Typography.Text type="secondary">수퍼관리자는 모든 메뉴에 접근합니다.</Typography.Text>
            ) : (
              <Checkbox.Group options={MENU_OPTIONS} data-testid="admin-admins-edit-permissions" />
            )}
          </Form.Item>
          <Form.Item
            label="활성"
            name="isActive"
            valuePropName="checked"
          >
            <Switch
              disabled={editTarget?.id === admin.id}
              data-testid="admin-admins-edit-active"
            />
          </Form.Item>
          {editTarget?.id === admin.id && (
            <Typography.Paragraph type="warning" style={{ marginBottom: 0 }}>
              본인 계정의 권한·활성 상태는 변경할 수 없습니다.
            </Typography.Paragraph>
          )}
        </Form>
      </Modal>

      <Modal
        title="비밀번호 재설정"
        open={!!resetTarget}
        onCancel={() => setResetTarget(null)}
        onOk={submitReset}
        confirmLoading={submitting}
        okText="재설정"
        cancelText="취소"
        destroyOnHidden
      >
        <Form form={resetForm} layout="vertical">
          <Form.Item label="대상">
            <Input value={resetTarget ? `${resetTarget.name} (${resetTarget.email})` : ""} disabled />
          </Form.Item>
          <Form.Item
            label="새 비밀번호"
            name="newPassword"
            rules={[
              { required: true, message: "새 비밀번호를 입력하세요." },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                message: "영문/숫자/특수문자를 포함해 8자 이상이어야 합니다.",
              },
            ]}
          >
            <Input.Password data-testid="admin-admins-reset-password" />
          </Form.Item>
          <Form.Item
            label="사유"
            name="reason"
            rules={[{ required: true, message: "재설정 사유를 입력하세요." }, { max: 500 }]}
          >
            <Input.TextArea rows={3} data-testid="admin-admins-reset-reason" />
          </Form.Item>
        </Form>
      </Modal>
    </AdminShell>
  );
}
