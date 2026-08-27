"use client";

import { useEffect, useState, useCallback } from "react";
import {
  App, Table, Tag, Radio, Space, Button, Card, Image as AntImage, Modal, Form, Input,
} from "antd";
import type { TablePaginationConfig } from "antd";
import AdminShell from "@/components/AdminShell";
import MemberDetailDrawer from "@/components/MemberDetailDrawer";
import { useAdmin } from "@/lib/useAdmin";
import { api } from "@/lib/api";
import { codeLabel, useCodes } from "@/lib/codes";
import { formatBizNo } from "@/lib/format";

type UserStatus = "active" | "suspended" | "deleted";
type LicenseStatus = "none" | "pending" | "verified" | "rejected";

interface PendingItem {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  status: UserStatus;
  licenseStatus: LicenseStatus;
  createdAt: string;
  userType: "personal" | "corp";
  personalProfile: null | {
    jobType: string;
    licenseNo: string | null;
    licenseImageUrl: string | null;
  };
  corpProfile: null | {
    hospitalName: string;
    businessNo: string;
    businessLicenseImageUrl: string | null;
  };
}

// p2-6: 직종 라벨은 서버 /api/codes(jobType) 소비.

export default function LicensePendingPage() {
  const { message } = App.useApp();
  useCodes();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<"all" | "personal" | "corp">("all");
  // C1: "초기화" — 필터 전체 리셋 + 페이지1 + 필터영역 remount.
  const [resetKey, setResetKey] = useState(0);
  const resetFilters = () => {
  setUserType("all"); setPage(1);
    setResetKey((k) => k + 1);
  };
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ id: number; mode: "verify" | "reject" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("userType", userType);
    const res = await api.get<{ items: PendingItem[]; total: number }>(
      `/api/admin/members/license/pending?${params.toString()}`
    );
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      message.error(res.message || "목록을 불러올 수 없습니다.");
    }
  }, [page, pageSize, userType, message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  function openDetail(id: number) {
    setSelectedId(id);
    setDrawerOpen(true);
  }

  if (authLoading || !admin) return null;

  return (
    <AdminShell>
      <Card title="면허/사업자 인증" data-testid="members-license-page">
        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <Radio.Group
            value={userType}
            onChange={(e) => {
              setUserType(e.target.value);
              setPage(1);
            }}
            optionType="button"
            buttonStyle="solid"
            data-testid="members-license-usertype"
          >
            <Radio.Button value="all">전체</Radio.Button>
            <Radio.Button value="personal">개인(면허)</Radio.Button>
            <Radio.Button value="corp">기업(사업자)</Radio.Button>
          </Radio.Group>
          <Button onClick={resetFilters}>초기화</Button>
        </Space>

        <Table<PendingItem>
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
            { title: "NO", width: 70, render: (_v, _r, index) => total - ((page - 1) * pageSize + index) },
            {
              title: "유형",
              dataIndex: "userType",
              width: 95,
              render: (v: "personal" | "corp") => (
                <Tag color={v === "personal" ? "blue" : "purple"}>{v === "personal" ? "개인" : "기업"}</Tag>
              ),
            },
            { title: "이름/담당자", dataIndex: "name", width: 110 },
            { title: "이메일", dataIndex: "email", ellipsis: true },
            {
              title: "직종/병원명",
              key: "info",
              width: 180,
              render: (_, r) =>
                r.userType === "personal"
                  ? r.personalProfile
                    // msg-g3: 회원 직종 student 포함 → reviewJobLabelOverride(9키). 채용 jobType 8셋과 분리.
                    ? codeLabel("reviewJobLabelOverride", r.personalProfile.jobType)
                    : "-"
                  : r.corpProfile?.hospitalName || "-",
            },
            {
              title: "면허/사업자번호",
              key: "license",
              width: 140,
              render: (_, r) =>
                r.userType === "personal"
                  ? r.personalProfile?.licenseNo || "-"
                  : r.corpProfile?.businessNo
                    ? formatBizNo(r.corpProfile.businessNo)
                    : "-",
            },
            {
              title: "첨부 이미지",
              key: "image",
              width: 150,
              render: (_, r) => {
                const url =
                  r.userType === "personal"
                    ? r.personalProfile?.licenseImageUrl
                    : r.corpProfile?.businessLicenseImageUrl;
                return url ? (
                  <AntImage src={url} alt="첨부" width={60} height={40} style={{ objectFit: "cover" }} />
                ) : (
                  <Tag color="default">없음</Tag>
                );
              },
            },
            {
              title: "신청일",
              dataIndex: "createdAt",
              width: 110,
              render: (v: string) => new Date(v).toLocaleDateString("ko-KR"),
            },
            {
              title: "처리",
              key: "actions",
              width: 230,
              render: (_, r) => (
                <Space size={4}>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => setActionTarget({ id: r.id, mode: "verify" })}
                    data-testid={`members-license-approve-${r.id}`}
                  >
                    승인
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => setActionTarget({ id: r.id, mode: "reject" })}
                    data-testid={`members-license-reject-${r.id}`}
                  >
                    반려
                  </Button>
                  <Button size="small" onClick={() => openDetail(r.id)} data-testid={`members-license-row-${r.id}`}>
                    상세
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <MemberDetailDrawer
        open={drawerOpen}
        memberId={selectedId}
        onClose={() => setDrawerOpen(false)}
        onChanged={load}
      />

      <LicenseActionModal
        target={actionTarget}
        onClose={() => setActionTarget(null)}
        onDone={() => {
          setActionTarget(null);
          load();
        }}
      />
    </AdminShell>
  );
}

interface LicenseActionModalProps {
  target: { id: number; mode: "verify" | "reject" } | null;
  onClose: () => void;
  onDone: () => void;
}

function LicenseActionModal({ target, onClose, onDone }: LicenseActionModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const open = !!target;
  const mode = target?.mode || "verify";

  async function submit() {
    if (!target) return;
    const values = await form.validateFields();
    setLoading(true);
    const res = await api.patch(`/api/admin/members/${target.id}/license`, {
      licenseStatus: mode === "verify" ? "verified" : "rejected",
      reason: values.reason,
    });
    setLoading(false);
    if (res.success) {
      message.success(mode === "verify" ? "승인 처리되었습니다." : "반려 처리되었습니다.");
      form.resetFields();
      onDone();
    } else {
      message.error(res.message || "처리에 실패했습니다.");
    }
  }

  return (
    <Modal
      open={open}
      title={mode === "verify" ? "면허/사업자 승인" : "면허/사업자 반려"}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={submit}
      okText={mode === "verify" ? "승인" : "반려"}
      cancelText="취소"
      okButtonProps={{ danger: mode === "reject" }}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="reason"
          label={mode === "verify" ? "메모 (선택)" : "반려 사유"}
          rules={
            mode === "reject"
              ? [{ required: true, message: "반려 사유를 입력하세요." }, { max: 500 }]
              : [{ max: 500 }]
          }
        >
          <Input.TextArea
            rows={3}
            placeholder={mode === "verify" ? "메모를 입력하세요 (선택)" : "사용자에게 노출되는 반려 사유 (필수)"}
            data-testid="members-license-action-reason"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
