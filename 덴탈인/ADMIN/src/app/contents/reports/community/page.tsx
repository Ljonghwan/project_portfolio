"use client";

import { useEffect, useState, useCallback } from "react";
import {
  App,
  Table,
  Tag,
  Select,
  Space,
  Button,
  Card,
  Modal,
  Form,
  Input,
  DatePicker,
} from "antd";
import type { TablePaginationConfig } from "antd";
import type { Dayjs } from "dayjs";
import AdminShell from "@/components/AdminShell";
import { useAdmin } from "@/lib/useAdmin";
import { api } from "@/lib/api";
import { codeLabel, codeOptions, useCodes } from "@/lib/codes";
import { openFrontPost } from "@/lib/frontUrl";

type BoardType = "review" | "talk" | "urgent";
// P1-reviews FIX 이후 커뮤니티 신고 사유 enum (CommunityReport.ts / front lib/reports.ts와 일치)
type ReportReason = "ad" | "offensive" | "abuse" | "etc";
type ReportStatus = "open" | "reviewed" | "dismissed" | "acted";
type ReportAction = "hide" | "delete" | "none";

interface ReportItem {
  id: number;
  boardType: BoardType;
  boardId: number;
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
  post: {
    id: number;
    title: string | null;
    isDeleted: boolean;
    isHiddenByAdmin: boolean;
    hospitalName?: string | null;
  } | null;
}

// 그룹4 ①: 미처리(open) / 처리완료(handled) 2분류. "확인(reviewed)" 노출 제거. done=open 외 전체(서버 매핑).
const STATUS_OPTS = [
  { value: "", label: "전체" },
  { value: "open", label: "미처리" },
  { value: "done", label: "처리완료" },
];

// 신고 상태는 admin 전용 enum(open/reviewed/dismissed/acted) → /api/codes 대상 아님(색+라벨 유지).
// 그룹4 ①: open=미처리, 그 외(reviewed/dismissed/acted)=처리완료로 통합 표기.
const STATUS_TAG: Record<ReportStatus, { color: string; label: string }> = {
  open: { color: "orange", label: "미처리" },
  reviewed: { color: "green", label: "처리완료" },
  dismissed: { color: "green", label: "처리완료" },
  acted: { color: "green", label: "처리완료" },
};

// p2-6: board 라벨은 서버 /api/codes(postBoard) 소비. 색만 admin UI 메타로 유지.
const BOARD_COLOR: Record<BoardType, string> = {
  review: "blue",
  talk: "purple",
  urgent: "red",
};

// 색 메타만 admin 로컬, 라벨은 codes(reportReason 도메인)에서. (admin/CLAUDE.md 컨벤션)
const REASON_COLOR: Record<string, string> = {
  ad: "blue",
  offensive: "red",
  abuse: "magenta",
  etc: "default",
};

const ACTION_LABEL: Record<ReportAction, string> = {
  hide: "비공개 처리",
  delete: "삭제",
  none: "조치 없음",
};

export default function CommunityReportsPage() {
  const { message } = App.useApp();
  useCodes();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [boardType, setBoardType] = useState<string>("");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [keyword, setKeyword] = useState("");
  // C1: "초기화" — 필터 전체 리셋 + 페이지1 + 필터영역 remount.
  const [resetKey, setResetKey] = useState(0);
  const resetFilters = () => {
  setStatus(""); setBoardType(""); setRange(null); setKeyword(""); setPage(1);
    setResetKey((k) => k + 1);
  };
  const [kwInput, setKwInput] = useState("");
  const [actionTarget, setActionTarget] = useState<ReportItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (status) params.set("status", status);
    if (boardType) params.set("boardType", boardType);
    if (range?.[0]) params.set("createdFrom", range[0].format("YYYY-MM-DD"));
    if (range?.[1]) params.set("createdTo", range[1].format("YYYY-MM-DD"));
    if (keyword) params.set("keyword", keyword);
    const res = await api.get<{ items: ReportItem[]; total: number }>(
      `/api/admin/reports/community?${params.toString()}`
    );
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      message.error(res.message || "신고 목록을 불러올 수 없습니다.");
    }
  }, [page, pageSize, status, boardType, range, keyword, message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  if (authLoading || !admin) return null;

  return (
    <AdminShell>
      <Card title="커뮤니티 신고 관리" data-testid="admin-reports-community-page">
        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <DatePicker.RangePicker
            value={range ?? undefined}
            onChange={(v) => {
              setRange(v as [Dayjs | null, Dayjs | null] | null);
              setPage(1);
            }}
            data-testid="admin-reports-community-range"
          />
          <Input
            placeholder="신고자 이름/아이디"
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            onPressEnter={() => {
              setKeyword(kwInput.trim());
              setPage(1);
            }}
            allowClear
            style={{ width: 220 }}
            data-testid="admin-reports-community-search"
          />
          <Select
            value={boardType}
            options={[{ value: "", label: "전체 게시판" }, ...codeOptions("postBoard")]}
            onChange={(v) => {
              setBoardType(v);
              setPage(1);
            }}
            style={{ width: 160 }}
            data-testid="admin-reports-community-board-filter"
          />
          <Select
            value={status}
            options={STATUS_OPTS}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            style={{ width: 160 }}
            data-testid="admin-reports-community-status-filter"
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
              title: "게시판",
              dataIndex: "boardType",
              width: 100,
              render: (v: BoardType) => (
                <Tag color={BOARD_COLOR[v]}>{codeLabel("postBoard", v)}</Tag>
              ),
            },
            {
              title: "사유",
              dataIndex: "reason",
              width: 230,
              render: (r: ReportReason) => (
                <Tag color={REASON_COLOR[r] ?? "default"}>{codeLabel("reportReason", r)}</Tag>
              ),
            },
            {
              title: "상세",
              dataIndex: "detail",
              render: (v: string | null) => v || "-",
            },
            {
              title: "대상 게시글",
              key: "post",
              render: (_, r) =>
                r.post ? (
                  <>
                    #{r.post.id} {r.post.title || "-"}
                    <br />
                    <span style={{ color: "#888", fontSize: 12 }}>
                      {r.post.hospitalName ? `${r.post.hospitalName} · ` : ""}
                      {r.post.isDeleted ? "삭제됨" : r.post.isHiddenByAdmin ? "운영자 비공개" : "공개"}
                    </span>
                  </>
                ) : (
                  <span style={{ color: "#aaa" }}>(게시글 없음)</span>
                ),
            },
            {
              title: "신고자",
              key: "reporter",
              width: 160,
              ellipsis: true,
              render: (_, r) =>
                r.reporter ? `${r.reporter.alias} (${r.reporter.emailMasked || "-"})` : "익명",
            },
            {
              title: "상태",
              dataIndex: "status",
              width: 130,
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
              width: 200,
              render: (v: string) => new Date(v).toLocaleString("ko-KR"),
            },
            {
              title: "처리",
              key: "actions",
              width: 170,
              render: (_, r) => (
                <Space size={4} wrap>
                  {/* G6 N5: 신고 대상 게시물을 사용자페이지(front) 새 탭으로 열기(구 G2-A4 admin Drawer 대체) */}
                  <Button
                    size="small"
                    disabled={!r.post}
                    onClick={() => openFrontPost(r.boardType, r.boardId)}
                    data-testid={`admin-reports-community-view-${r.id}`}
                  >
                    게시물 보기
                  </Button>
                  {r.status === "open" ? (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setActionTarget(r)}
                      data-testid={`admin-reports-community-action-${r.id}`}
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

function ReportActionModal({
  target,
  onClose,
  onDone,
}: {
  target: ReportItem | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const open = !!target;

  async function submit() {
    if (!target) return;
    const values = await form.validateFields();
    setLoading(true);
    const decision = values.decision as "dismissed" | "acted_hide" | "acted_delete";
    const body =
      decision === "dismissed"
        ? { status: "dismissed", actionTaken: "none", reason: values.reason }
        : decision === "acted_hide"
        ? { status: "acted", actionTaken: "hide", reason: values.reason }
        : { status: "acted", actionTaken: "delete", reason: values.reason };
    const res = await api.patch(`/api/admin/reports/community/${target.id}`, body);
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
            <strong>대상:</strong>{" "}
            {target.post ? `#${target.post.id} ${target.post.title || "-"}` : "삭제된 게시글"}
          </div>
          <div>
            <strong>게시판:</strong> {codeLabel("postBoard", target.boardType)}
          </div>
          <div>
            <strong>사유:</strong> {codeLabel("reportReason", target.reason)}
          </div>
          {target.detail && (
            <div style={{ marginTop: 8, padding: 8, background: "#fafafa" }}>{target.detail}</div>
          )}
        </div>
      )}
      <Form form={form} layout="vertical" preserve={false} initialValues={{ decision: "dismissed" }}>
        <Form.Item name="decision" label="처리 방법" rules={[{ required: true }]}>
          <Select
            options={[
              { value: "dismissed", label: "반려 (조치 없음)" },
              { value: "acted_hide", label: "조치 - 운영자 비공개" },
              { value: "acted_delete", label: "조치 - 게시글 삭제" },
            ]}
            data-testid="admin-reports-community-action-decision"
          />
        </Form.Item>
        <Form.Item name="reason" label="처리 메모 (선택, 감사 로그)" rules={[{ max: 500 }]}>
          <Input.TextArea
            rows={3}
            maxLength={500}
            placeholder="처리 메모를 입력하세요 (선택)"
            data-testid="admin-reports-community-action-reason"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
