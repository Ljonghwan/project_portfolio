"use client";

// 관리자 계정 관리(카드#029) — 슈퍼관리자 전용 화면.
// 메뉴는 AdminShell 이 운영자에게 숨기지만, URL 직접 진입은 서버 403 으로 막히고 여기선 그 사유를 밝힌다.
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import AdminShell from "@/components/AdminShell";
import { api } from "@/lib/api";
import {
  ADMIN_ACCOUNT_TEXT as T,
  ADMIN_ROLE_OPTIONS,
  adminRoleLabel,
  fmtDate,
  fmtDateTime,
} from "@/lib/labels";
import { useAdmin } from "@/lib/useAdmin";

type AdminRow = {
  id: string;
  username: string;
  name: string;
  role: string;
  lastLoginAt: string | null;
  createdAt: string;
  locked: boolean;
};

type Mode = "create" | "edit" | "reset";
type Values = { username?: string; name?: string; role?: string; password?: string };

export default function AdminsPage() {
  // AdminShell 이 미인증 리다이렉트를 이미 처리하므로 여기선 본인 식별용으로만 읽는다.
  const { admin: me } = useAdmin(false);
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [target, setTarget] = useState<AdminRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ admins: AdminRow[] }>("/api/admin/admins");
      setRows(r.admins);
      setErr(null);
    } catch (e) {
      // 조회 실패를 안 잡으면 ErrorReporter 가 오류 원장을 자기 노이즈로 채운다(admin/CLAUDE.md).
      // 운영자가 URL 로 들어오면 여기 403 메시지가 표시된다 — 빈 표는 "계정이 없다"로 읽힌다.
      setErr(e instanceof Error ? e.message : T.loadFailed);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function open(next: Mode, row?: AdminRow) {
    setTarget(row ?? null);
    setMode(next);
  }
  function close() {
    setMode(null);
    setTarget(null);
    form.resetFields();
  }

  async function submit() {
    const v = await form.validateFields();
    setSaving(true);
    try {
      if (mode === "create") {
        await api.post("/api/admin/admins", v);
        message.success(T.created);
      } else if (mode === "edit") {
        await api.patch(`/api/admin/admins/${target!.id}`, { name: v.name, role: v.role });
        message.success(T.updated);
      } else {
        await api.patch(`/api/admin/admins/${target!.id}/password`, { password: v.password });
        message.success(T.passwordReset);
      }
      close();
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : T.loadFailed);
    }
    setSaving(false);
  }

  async function remove(row: AdminRow) {
    try {
      await api.del(`/api/admin/admins/${row.id}`);
      message.success(T.removed);
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : T.loadFailed);
    }
  }

  const isMe = (row: AdminRow) => row.id === me?.id;
  const title =
    mode === "create" ? T.add : mode === "edit" ? `${target?.name} ${T.edit}` : T.resetPassword;

  return (
    <AdminShell>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        {T.title}
      </Typography.Title>
      <Typography.Paragraph type="secondary">{T.desc}</Typography.Paragraph>

      {err && <Alert type="error" title={err} showIcon style={{ marginBottom: 12 }} />}

      <Card size="small">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ marginBottom: 12 }}
          onClick={() => open("create")}
        >
          {T.add}
        </Button>
        <Table<AdminRow>
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={rows}
          pagination={false}
          columns={[
            {
              title: T.colUsername,
              dataIndex: "username",
              render: (v: string, r) => (
                <Space size={6}>
                  <span>{v}</span>
                  {isMe(r) && <Tag>나</Tag>}
                </Space>
              ),
            },
            { title: T.colName, dataIndex: "name" },
            {
              title: T.colRole,
              dataIndex: "role",
              render: (v: string) => (
                <Tag color={v === "super" ? "blue" : undefined}>{adminRoleLabel(v)}</Tag>
              ),
            },
            {
              title: T.colState,
              dataIndex: "locked",
              render: (v: boolean) => (v ? <Tag color="orange">{T.locked}</Tag> : T.normal),
            },
            {
              title: T.colLastLogin,
              dataIndex: "lastLoginAt",
              render: (v: string | null) => (v ? fmtDateTime(v) : T.never),
            },
            { title: T.colCreatedAt, dataIndex: "createdAt", render: (v: string) => fmtDate(v) },
            {
              title: " ",
              key: "actions",
              align: "right",
              render: (_: unknown, r) => (
                <Space size={4}>
                  <Button size="small" onClick={() => open("edit", r)}>
                    {T.edit}
                  </Button>
                  <Button size="small" onClick={() => open("reset", r)}>
                    {T.resetPassword}
                  </Button>
                  {/* 본인 계정 삭제는 서버도 막는다(SELF_DELETE). 버튼을 아예 빼면 행마다 버튼 수가
                      달라져 열이 어긋나므로, 자리는 두되 비활성 + 이유를 툴팁으로 보여준다. */}
                  {isMe(r) ? (
                    <Tooltip title={T.selfDeleteHint}>
                      <span>
                        <Button size="small" danger disabled>
                          {T.remove}
                        </Button>
                      </span>
                    </Tooltip>
                  ) : (
                    <Popconfirm
                      title={T.removeConfirm}
                      okText={T.remove}
                      cancelText="취소"
                      onConfirm={() => void remove(r)}
                    >
                      <Button size="small" danger>
                        {T.remove}
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        // mode·대상이 바뀌면 폼을 새로 마운트해 이전 입력이 남지 않게 한다.
        key={`${mode}-${target?.id ?? "new"}`}
        open={mode !== null}
        title={title}
        okText={mode === "create" ? T.add : "저장"}
        cancelText="취소"
        confirmLoading={saving}
        onOk={() => void submit()}
        onCancel={close}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={
            mode === "edit" ? { name: target?.name, role: target?.role } : { role: "operator" }
          }
        >
          {mode === "create" && (
            <Form.Item
              name="username"
              label={T.colUsername}
              extra="영문·숫자와 . _ - 를 쓸 수 있고, 대문자는 소문자로 저장됩니다."
              rules={[{ required: true, min: 3, message: "아이디는 3자 이상으로 입력해주세요" }]}
            >
              <Input autoComplete="off" />
            </Form.Item>
          )}
          {mode !== "reset" && (
            <>
              <Form.Item
                name="name"
                label={T.colName}
                rules={[{ required: true, message: "이름을 입력해주세요" }]}
              >
                <Input autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="role"
                label={T.colRole}
                // 본인 강등은 스스로 잠그는 행위라 서버가 거부한다(SELF_ROLE_CHANGE).
                extra={
                  mode === "edit" && target && isMe(target) ? "본인 권한은 바꿀 수 없습니다." : undefined
                }
              >
                <Select
                  options={ADMIN_ROLE_OPTIONS}
                  disabled={mode === "edit" && !!target && isMe(target)}
                />
              </Form.Item>
            </>
          )}
          {mode !== "edit" && (
            <Form.Item
              name="password"
              label={mode === "reset" ? T.newPassword : "비밀번호"}
              extra={mode === "reset" ? T.newPasswordHint : T.passwordHint}
              rules={[{ required: true, min: 8, message: T.passwordHint }]}
            >
              {/* 브라우저가 관리자 비밀번호를 자동완성으로 흘리지 않게 한다. */}
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </AdminShell>
  );
}
