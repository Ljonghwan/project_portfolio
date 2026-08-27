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
} from "antd";
import type { TablePaginationConfig } from "antd";
import AdminShell from "@/components/AdminShell";
import { useAdmin } from "@/lib/useAdmin";
import { api, apiFetch } from "@/lib/api";
import { codeLabel, codeOptions, useCodes } from "@/lib/codes";

type BoardType = "review" | "talk" | "urgent";

// p2-6: board 라벨은 서버 /api/codes(postBoard) 소비. 색만 admin UI 메타로 유지.
const BOARD_COLOR: Record<BoardType, string> = {
  review: "blue",
  talk: "purple",
  urgent: "red",
};

interface CommentItem {
  id: number;
  boardType: BoardType;
  boardId: number;
  boardTitle: string | null;
  parentId: number | null;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    alias: string;
    emailMasked: string | null;
    userType: string;
    status: string;
  } | null;
}

const STATUS_OPTS = [
  { value: "visible", label: "정상" },
  { value: "deleted", label: "삭제됨" },
  { value: "all", label: "전체" },
];


export default function CommunityCommentsPage() {
  const { message } = App.useApp();
  useCodes();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("visible");
  const [boardType, setBoardType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  // C1: "초기화" — 필터 전체 리셋 + 페이지1 + 필터영역 remount.
  const [resetKey, setResetKey] = useState(0);
  const resetFilters = () => {
  setStatus("visible"); setBoardType(""); setKeyword(""); setSearchInput(""); setPage(1);
    setResetKey((k) => k + 1);
  };

  const [deleteTarget, setDeleteTarget] = useState<CommentItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("status", status);
    if (boardType) params.set("boardType", boardType);
    if (keyword) params.set("keyword", keyword);
    const res = await api.get<{ items: CommentItem[]; total: number }>(
      `/api/admin/comments?${params.toString()}`
    );
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      message.error(res.message || "댓글 목록을 불러올 수 없습니다.");
    }
  }, [page, pageSize, status, boardType, keyword, message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  if (authLoading || !admin) return null;

  return (
    <AdminShell>
      <Card title="댓글 관리" data-testid="admin-comments-page">
        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <Select
            value={boardType}
            options={[{ value: "", label: "전체 게시판" }, ...codeOptions("postBoard")]}
            onChange={(v) => {
              setBoardType(v);
              setPage(1);
            }}
            style={{ width: 160 }}
            data-testid="admin-comments-board-filter"
          />
          <Select
            value={status}
            options={STATUS_OPTS}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            style={{ width: 140 }}
            data-testid="admin-comments-status-filter"
          />
          <Input
            placeholder="댓글 내용 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={() => {
              setKeyword(searchInput.trim());
              setPage(1);
            }}
            allowClear
            style={{ width: 240 }}
            data-testid="admin-comments-search"
          />
          <Button onClick={resetFilters}>초기화</Button>
        </Space>

        <Table<CommentItem>
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
              title: "게시글",
              key: "board",
              ellipsis: true,
              render: (_, r) =>
                r.boardTitle ? (
                  <span>
                    #{r.boardId} {r.boardTitle}
                  </span>
                ) : (
                  <span style={{ color: "#aaa" }}>#{r.boardId} (삭제됨)</span>
                ),
            },
            {
              title: "내용",
              dataIndex: "content",
              ellipsis: true,
              render: (v: string, r) =>
                r.isDeleted ? (
                  <span style={{ color: "#aaa" }}>{v}</span>
                ) : (
                  v
                ),
            },
            // {
            //   title: "부모",
            //   dataIndex: "parentId",
            //   width: 80,
            //   render: (v: number | null) => (v ? `#${v}` : "-"),
            // },
            {
              title: "작성자",
              key: "author",
              width: 180,
              render: (_, r) =>
                r.author
                  ? `${r.author.alias} (${r.author.emailMasked || "-"})`
                  : "익명",
            },
            {
              title: "상태",
              key: "status",
              width: 90,
              render: (_, r) =>
                r.isDeleted ? (
                  <Tag color="default">삭제됨</Tag>
                ) : (
                  <Tag color="green">정상</Tag>
                ),
            },
            {
              title: "작성일",
              dataIndex: "createdAt",
              width: 140,
              render: (v: string) => new Date(v).toLocaleString("ko-KR"),
            },
            {
              title: "처리",
              key: "actions",
              width: 100,
              render: (_, r) =>
                r.isDeleted ? (
                  <span style={{ color: "#888" }}>-</span>
                ) : (
                  <Button
                    size="small"
                    danger
                    onClick={() => setDeleteTarget(r)}
                    data-testid={`admin-comments-delete-${r.id}`}
                  >
                    삭제
                  </Button>
                ),
            },
          ]}
        />
      </Card>

      <DeleteCommentModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDone={() => {
          setDeleteTarget(null);
          load();
        }}
      />
    </AdminShell>
  );
}

function DeleteCommentModal({
  target,
  onClose,
  onDone,
}: {
  target: CommentItem | null;
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
    const res = await apiFetch(`/api/admin/comments/${target.id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason: values.reason }),
    });
    setLoading(false);
    if (res.success) {
      message.success("삭제했습니다.");
      form.resetFields();
      onDone();
    } else {
      message.error(res.message || "삭제에 실패했습니다.");
    }
  }

  return (
    <Modal
      open={open}
      title={target ? `댓글 #${target.id} 삭제` : "댓글 삭제"}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={submit}
      okText="삭제"
      okButtonProps={{ danger: true }}
      cancelText="취소"
      confirmLoading={loading}
      destroyOnHidden
    >
      {target && (
        <div style={{ marginBottom: 12 }}>
          <div>
            <strong>대상 게시판:</strong> {codeLabel("postBoard", target.boardType)}
          </div>
          <div>
            <strong>게시글:</strong>{" "}
            {target.boardTitle ? `#${target.boardId} ${target.boardTitle}` : `#${target.boardId} (삭제된 게시글)`}
          </div>
          <div style={{ marginTop: 8, padding: 8, background: "#fafafa" }}>
            {target.content}
          </div>
        </div>
      )}
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="reason"
          label="삭제 사유 (필수, 감사 로그)"
          rules={[{ required: true, message: "삭제 사유를 입력하세요." }, { max: 500 }]}
        >
          <Input.TextArea
            rows={3}
            maxLength={500}
            placeholder="삭제 사유를 입력하세요"
            data-testid="admin-comments-delete-reason"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
