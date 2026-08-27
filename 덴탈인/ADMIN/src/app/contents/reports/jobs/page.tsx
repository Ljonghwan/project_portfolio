"use client";

import { useEffect, useState, useCallback } from "react";
import {
  App, Table, Tag, Select, Space, Button, Card, Modal, Form, Input,
} from "antd";
import type { TablePaginationConfig } from "antd";
import AdminShell from "@/components/AdminShell";
import { useAdmin } from "@/lib/useAdmin";
import { api } from "@/lib/api";
import { openFrontPost } from "@/lib/frontUrl";

type ReportReason = "spam" | "fraud" | "inappropriate" | "other";
type ReportStatus = "open" | "reviewed" | "dismissed" | "acted";
type ReportAction = "force_close" | "delete" | "none";

interface ReportItem {
  id: number;
  jobPostId: number;
  reason: ReportReason;
  reasonLabel: string;
  detail: string | null;
  status: ReportStatus;
  reviewedByAdminId: number | null;
  reviewedAt: string | null;
  actionTaken: ReportAction | null;
  createdAt: string;
  reporter: {
    id: number;
    alias: string;
    emailMasked: string | null;
  } | null;
  job: {
    id: number;
    title: string;
    hospitalName: string;
    status: string;
    deletedAt: string | null;
  } | null;
}

const STATUS_OPTS = [
  { value: "", label: "전체" },
  { value: "open", label: "대기" },
  { value: "reviewed", label: "확인" },
  { value: "dismissed", label: "반려" },
  { value: "acted", label: "조치 완료" },
];

const STATUS_TAG: Record<ReportStatus, { color: string; label: string }> = {
  open: { color: "orange", label: "대기" },
  reviewed: { color: "blue", label: "확인" },
  dismissed: { color: "default", label: "반려" },
  acted: { color: "green", label: "조치 완료" },
};

const REASON_TAG: Record<ReportReason, { color: string; label: string }> = {
  spam: { color: "blue", label: "스팸/광고" },
  fraud: { color: "red", label: "허위/사기" },
  inappropriate: { color: "orange", label: "부적절" },
  other: { color: "default", label: "기타" },
};

const ACTION_LABEL: Record<ReportAction, string> = {
  force_close: "강제 마감",
  delete: "삭제",
  none: "조치 없음",
};

export default function JobReportsPage() {
  const { message } = App.useApp();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  // C1: "초기화" — 필터 전체 리셋 + 페이지1 + 필터영역 remount.
  const [resetKey, setResetKey] = useState(0);
  const resetFilters = () => {
  setStatus(""); setPage(1);
    setResetKey((k) => k + 1);
  };
  const [actionTarget, setActionTarget] = useState<ReportItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (status) params.set("status", status);
    const res = await api.get<{ items: ReportItem[]; total: number }>(
      `/api/admin/reports/jobs?${params.toString()}`
    );
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      message.error(res.message || "신고 목록을 불러올 수 없습니다.");
    }
  }, [page, pageSize, status, message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  if (authLoading || !admin) return null;

  return (
    <AdminShell>
      <Card title="채용공고 신고 관리" data-testid="admin-reports-jobs-page">
        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <Select
            value={status}
            options={STATUS_OPTS}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            style={{ width: 160 }}
            data-testid="admin-reports-jobs-status-filter"
          />
          <Button onClick={resetFilters}>초기화</Button>
        </Space>

        <Table<ReportItem>
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
            {
              title: "사유",
              dataIndex: "reason",
              width: 110,
              render: (r: ReportReason) => (
                <Tag color={REASON_TAG[r].color}>{REASON_TAG[r].label}</Tag>
              ),
            },
            {
              title: "상세",
              dataIndex: "detail",
              ellipsis: true,
              render: (v: string | null) => v || "-",
            },
            {
              title: "대상 공고",
              key: "job",
              render: (_, r) =>
                r.job ? (
                  <>
                    #{r.job.id} {r.job.title}
                    <br />
                    <span style={{ color: "#888", fontSize: 12 }}>
                      {r.job.hospitalName} ({r.job.status})
                      {r.job.deletedAt && " · 삭제됨"}
                    </span>
                  </>
                ) : (
                  "-"
                ),
            },
            {
              title: "신고자",
              key: "reporter",
              width: 140,
              ellipsis: true,
              render: (_, r) =>
                r.reporter ? `${r.reporter.alias} (${r.reporter.emailMasked || "-"})` : "익명",
            },
            {
              title: "상태",
              dataIndex: "status",
              width: 120,
              render: (s: ReportStatus, r) => (
                <Space orientation="vertical" size={2}>
                  <Tag color={STATUS_TAG[s].color}>{STATUS_TAG[s].label}</Tag>
                  {r.actionTaken && r.actionTaken !== "none" && (
                    <Tag color="purple">{ACTION_LABEL[r.actionTaken]}</Tag>
                  )}
                </Space>
              ),
            },
            {
              title: "접수일",
              dataIndex: "createdAt",
              width: 130,
              render: (v: string) => new Date(v).toLocaleString("ko-KR"),
            },
            {
              title: "처리",
              key: "actions",
              width: 170,
              render: (_, r) => (
                <Space size={4} wrap>
                  {/* G6 N5: 신고 대상 공고를 사용자페이지(front) 새 탭으로 열기(구 G2-A4 admin Drawer 대체) */}
                  <Button
                    size="small"
                    disabled={!r.job}
                    onClick={() => openFrontPost("job", r.jobPostId)}
                    data-testid={`admin-reports-jobs-view-${r.id}`}
                  >
                    게시물 보기
                  </Button>
                  {r.status === "open" ? (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setActionTarget(r)}
                      data-testid={`admin-reports-jobs-action-${r.id}`}
                    >
                      처리
                    </Button>
                  ) : (
                    <span style={{ color: "#888" }}>완료</span>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <ReportActionModal
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

interface ReportActionModalProps {
  target: ReportItem | null;
  onClose: () => void;
  onDone: () => void;
}

function ReportActionModal({ target, onClose, onDone }: ReportActionModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const open = !!target;

  async function submit() {
    if (!target) return;
    const values = await form.validateFields();
    setLoading(true);
    const decision = values.decision as "dismissed" | "acted_force_close" | "acted_delete";
    const body =
      decision === "dismissed"
        ? { status: "dismissed", actionTaken: "none", reason: values.reason }
        : decision === "acted_force_close"
        ? { status: "acted", actionTaken: "force_close", reason: values.reason }
        : { status: "acted", actionTaken: "delete", reason: values.reason };
    const res = await api.patch(`/api/admin/reports/jobs/${target.id}`, body);
    setLoading(false);
    if (res.success) {
      message.success("처리되었습니다.");
      form.resetFields();
      onDone();
    } else {
      message.error(res.message || "처리에 실패했습니다.");
    }
  }

  return (
    <Modal
      open={open}
      title={target ? `신고 #${target.id} 처리` : "신고 처리"}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={submit}
      okText="처리"
      cancelText="취소"
      confirmLoading={loading}
      destroyOnHidden
    >
      {target && (
        <div style={{ marginBottom: 12 }}>
          <div>
            <strong>대상:</strong> {target.job ? `#${target.job.id} ${target.job.title}` : "삭제된 공고"}
          </div>
          <div>
            <strong>사유:</strong> {REASON_TAG[target.reason].label}
          </div>
          {target.detail && (
            <div style={{ marginTop: 8, padding: 8, background: "#fafafa" }}>{target.detail}</div>
          )}
        </div>
      )}
      <Form form={form} layout="vertical" preserve={false} initialValues={{ decision: "dismissed" }}>
        <Form.Item
          name="decision"
          label="처리 방법"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: "dismissed", label: "반려 (조치 없음)" },
              { value: "acted_force_close", label: "조치 - 강제 마감" },
              { value: "acted_delete", label: "조치 - 공고 삭제" },
            ]}
            data-testid="admin-reports-jobs-action-decision"
          />
        </Form.Item>
        <Form.Item
          name="reason"
          label="처리 메모 (선택, 감사 로그 기록용)"
          rules={[{ max: 500 }]}
        >
          <Input.TextArea
            rows={3}
            maxLength={500}
            placeholder="처리 메모를 입력하세요 (선택)"
            data-testid="admin-reports-jobs-action-reason"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
