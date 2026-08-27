"use client";

import { useEffect, useState, useCallback } from "react";
import {
  App,
  Table,
  Tag,
  Select,
  Input,
  Space,
  Button,
  Card,
  Modal,
  Form,
  Drawer,
  Typography,
  Descriptions,
  DatePicker,
} from "antd";
import type { TablePaginationConfig } from "antd";
import type { Dayjs } from "dayjs";
import AdminShell from "@/components/AdminShell";
import { useAdmin } from "@/lib/useAdmin";
import { api, apiFetch } from "@/lib/api";

type QnaStatus = "open" | "answered" | "closed";

interface QnaItem {
  id: number;
  title: string;
  content: string;
  status: QnaStatus;
  answer: string | null;
  answeredAt: string | null;
  isMember: boolean;
  // 비회원 문의 작성자 정보(고객사 피드백 A). isMember=false일 때만 채워짐.
  guest: { name: string | null; email: string | null; phone: string | null } | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    alias: string;
    emailMasked: string | null;
    userType: "personal" | "corp";
    status: "active" | "suspended" | "deleted";
  } | null;
}

// 작성자 표시: 회원=닉네임(유형/이메일), 비회원=이름(이메일/연락처).
function authorLabel(r: QnaItem): string {
  if (r.isMember) {
    return r.author
      ? `${r.author.alias} (${USER_TYPE_LABEL[r.author.userType]}/${r.author.emailMasked || "-"})`
      : "탈퇴/삭제";
  }
  const g = r.guest;
  if (!g) return "비회원";
  return `${g.name || "비회원"} (${g.email || "-"}/${g.phone || "-"})`;
}

const STATUS_OPTS = [
  { value: "", label: "전체" },
  { value: "open", label: "대기" },
  { value: "answered", label: "답변완료" },
  { value: "closed", label: "종료" },
];

const STATUS_TAG: Record<QnaStatus, { color: string; label: string }> = {
  open: { color: "orange", label: "대기" },
  answered: { color: "green", label: "답변완료" },
  closed: { color: "default", label: "종료" },
};

const USER_TYPE_LABEL: Record<"personal" | "corp", string> = {
  personal: "개인",
  corp: "기업",
};

export default function SupportQnasPage() {
  const { message } = App.useApp();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<QnaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [createdRange, setCreatedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null); // msg-g4 일자 필터
  // C1: "초기화" — 필터 전체 리셋 + 페이지1 + 필터영역 remount.
  const [resetKey, setResetKey] = useState(0);
  const resetFilters = () => {
  setStatus(""); setKeyword(""); setCreatedRange(null); setPage(1);
    setResetKey((k) => k + 1);
  };
  const [detail, setDetail] = useState<QnaItem | null>(null);
  const [answerTarget, setAnswerTarget] = useState<QnaItem | null>(null);
  const [closeTarget, setCloseTarget] = useState<QnaItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QnaItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (status) params.set("status", status);
    if (keyword) params.set("keyword", keyword);
    if (createdRange?.[0]) params.set("createdFrom", createdRange[0].format("YYYY-MM-DD"));
    if (createdRange?.[1]) params.set("createdTo", createdRange[1].format("YYYY-MM-DD"));
    const res = await api.get<{ items: QnaItem[]; total: number }>(
      `/api/admin/support/qnas?${params.toString()}`
    );
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      message.error(res.message || "문의 목록을 불러올 수 없습니다.");
    }
  }, [page, pageSize, status, keyword, createdRange, message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  if (authLoading || !admin) return null;

  return (
    <AdminShell>
      <Card title="1:1 문의 관리" data-testid="admin-support-qnas-page">
        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <Select
            value={status}
            options={STATUS_OPTS}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            style={{ width: 160 }}
            data-testid="admin-support-qnas-status-filter"
          />
          <Input
            placeholder="이름/아이디 검색"
            allowClear
            style={{ width: 240 }}
            onPressEnter={(e) => {
              setKeyword((e.target as HTMLInputElement).value.trim());
              setPage(1);
            }}
            data-testid="admin-support-qnas-search"
          />
          <DatePicker.RangePicker
            value={createdRange as [Dayjs, Dayjs] | null}
            onChange={(v) => { setCreatedRange(v as [Dayjs | null, Dayjs | null] | null); setPage(1); }}
            placeholder={["접수일 시작", "접수일 끝"]}
            data-testid="admin-support-qnas-created-range"
          />
          <Button onClick={resetFilters}>초기화</Button>
        </Space>

        <Table<QnaItem>
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
              title: "상태",
              dataIndex: "status",
              width: 110,
              render: (s: QnaStatus) => (
                <Tag color={STATUS_TAG[s].color}>{STATUS_TAG[s].label}</Tag>
              ),
            },
            {
              title: "제목",
              dataIndex: "title",
              render: (v: string, r) => (
                <a
                  onClick={() => setDetail(r)}
                  data-testid={`admin-support-qnas-row-${r.id}`}
                >
                  {v}
                </a>
              ),
            },
            {
              // 구분: 회원/비회원. 비회원 문의는 guest 정보 노출.
              title: "구분",
              key: "isMember",
              width: 80,
              render: (_, r) => (r.isMember ? <Tag color="blue">회원</Tag> : <Tag color="gold">비회원</Tag>),
            },
            {
              title: "작성자",
              key: "author",
              width: 220,
              ellipsis: true,
              render: (_, r) => authorLabel(r),
            },
            {
              title: "접수일",
              dataIndex: "createdAt",
              width: 150,
              render: (v: string) => new Date(v).toLocaleString("ko-KR"),
            },
            {
              title: "답변일",
              dataIndex: "answeredAt",
              width: 150,
              render: (v: string | null) =>
                v ? new Date(v).toLocaleString("ko-KR") : "-",
            },
            {
              title: "처리",
              key: "actions",
              width: 240,
              render: (_, r) => (
                <Space>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => setAnswerTarget(r)}
                    data-testid={`admin-support-qnas-answer-${r.id}`}
                  >
                    {r.status === "open" ? "답변" : "수정"}
                  </Button>
                  {r.status !== "closed" && (
                    <Button
                      size="small"
                      danger
                      onClick={() => setCloseTarget(r)}
                      data-testid={`admin-support-qnas-close-${r.id}`}
                    >
                      종료
                    </Button>
                  )}
                  {/* 피드백 A4: 문의 삭제 기능 */}
                  <Button
                    size="small"
                    danger
                    onClick={() => setDeleteTarget(r)}
                    data-testid={`admin-support-qnas-delete-${r.id}`}
                  >
                    삭제
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={detail ? `문의 #${detail.id}` : "문의 상세"}
        open={!!detail}
        onClose={() => setDetail(null)}
        size="large"
        destroyOnHidden
      >
        {detail && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="상태">
                <Tag color={STATUS_TAG[detail.status].color}>
                  {STATUS_TAG[detail.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="제목">{detail.title}</Descriptions.Item>
              <Descriptions.Item label="구분">
                {detail.isMember ? <Tag color="blue">회원</Tag> : <Tag color="gold">비회원</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="작성자">{authorLabel(detail)}</Descriptions.Item>
              <Descriptions.Item label="접수일">
                {new Date(detail.createdAt).toLocaleString("ko-KR")}
              </Descriptions.Item>
              <Descriptions.Item label="답변일">
                {detail.answeredAt
                  ? new Date(detail.answeredAt).toLocaleString("ko-KR")
                  : "-"}
              </Descriptions.Item>
            </Descriptions>
            <Typography.Title level={5} style={{ marginTop: 16 }}>
              문의 내용
            </Typography.Title>
            <div
              style={{
                whiteSpace: "pre-wrap",
                background: "#fafafa",
                padding: 12,
                borderRadius: 4,
                border: "1px solid #f0f0f0",
              }}
            >
              {detail.content}
            </div>
            {detail.answer && (
              <>
                <Typography.Title level={5} style={{ marginTop: 16 }}>
                  답변
                </Typography.Title>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    background: "#f6ffed",
                    padding: 12,
                    borderRadius: 4,
                    border: "1px solid #b7eb8f",
                  }}
                >
                  {detail.answer}
                </div>
              </>
            )}
          </>
        )}
      </Drawer>

      <QnaAnswerModal
        target={answerTarget}
        onClose={() => setAnswerTarget(null)}
        onDone={() => {
          setAnswerTarget(null);
          load();
        }}
      />
      <QnaCloseModal
        target={closeTarget}
        onClose={() => setCloseTarget(null)}
        onDone={() => {
          setCloseTarget(null);
          load();
        }}
      />
      <QnaDeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDone={() => {
          setDeleteTarget(null);
          setDetail(null);
          load();
        }}
      />
    </AdminShell>
  );
}

function QnaAnswerModal({
  target,
  onClose,
  onDone,
}: {
  target: QnaItem | null;
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
    const res = await api.patch(`/api/admin/support/qnas/${target.id}/answer`, {
      answer: values.answer,
      status: values.status,
    });
    setLoading(false);
    if (res.success) {
      message.success("답변이 저장되었습니다.");
      onDone();
    } else {
      message.error(res.message || "저장에 실패했습니다.");
    }
  }

  return (
    <Modal
      key={target ? `answer-${target.id}` : "answer-empty"}
      open={open}
      title={target ? `문의 #${target.id} 답변` : "답변"}
      onCancel={onClose}
      onOk={submit}
      okText="저장"
      cancelText="취소"
      confirmLoading={loading}
      width={640}
      destroyOnHidden
    >
      {target && (
        <div style={{ marginBottom: 12 }}>
          <div>
            <strong>제목:</strong> {target.title}
          </div>
          <div
            style={{
              marginTop: 8,
              padding: 8,
              background: "#fafafa",
              borderRadius: 4,
              whiteSpace: "pre-wrap",
            }}
          >
            {target.content}
          </div>
        </div>
      )}
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{
          answer: target?.answer || "",
          status: target?.status === "closed" ? "closed" : "answered",
        }}
      >
        <Form.Item
          name="answer"
          label="답변"
          rules={[
            { required: true, message: "답변 내용을 입력하세요." },
            { max: 4000, message: "답변은 최대 4000자까지 입력 가능합니다." },
          ]}
        >
          <Input.TextArea
            rows={6}
            maxLength={4000}
            placeholder="고객에게 전달할 답변을 입력하세요."
            data-testid="admin-support-qnas-answer-text"
          />
        </Form.Item>
        <Form.Item
          name="status"
          label="처리 후 상태"
          rules={[{ required: true, message: "처리 후 상태를 선택하세요." }]}
        >
          <Select
            options={[
              { value: "answered", label: "답변완료" },
              { value: "closed", label: "종료" },
            ]}
            data-testid="admin-support-qnas-answer-status"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// 피드백 A4: 문의 삭제 모달(soft-delete + 사유 선택입력). DELETE+body라 apiFetch 직접 사용.
function QnaDeleteModal({
  target,
  onClose,
  onDone,
}: {
  target: QnaItem | null;
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
    const res = await apiFetch(`/api/admin/support/qnas/${target.id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason: values.reason || undefined }),
    });
    setLoading(false);
    if (res.success) {
      message.success("문의를 삭제했습니다.");
      onDone();
    } else {
      message.error(res.message || "삭제에 실패했습니다.");
    }
  }

  return (
    <Modal
      key={target ? `delete-${target.id}` : "delete-empty"}
      open={open}
      title={target ? `문의 #${target.id} 삭제` : "삭제"}
      onCancel={onClose}
      onOk={submit}
      okText="삭제"
      okButtonProps={{ danger: true }}
      cancelText="취소"
      confirmLoading={loading}
      destroyOnHidden
    >
      <p style={{ marginBottom: 12 }}>이 문의를 삭제하시겠습니까? 삭제 후에는 목록에서 보이지 않습니다.</p>
      <Form form={form} layout="vertical" preserve={false} initialValues={{ reason: "" }}>
        <Form.Item
          name="reason"
          label="삭제 사유 (선택, 감사 로그)"
          rules={[{ max: 500, message: "삭제 사유는 최대 500자까지 입력 가능합니다." }]}
        >
          <Input.TextArea
            rows={3}
            maxLength={500}
            placeholder="삭제 사유(선택)"
            data-testid="admin-support-qnas-delete-reason"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function QnaCloseModal({
  target,
  onClose,
  onDone,
}: {
  target: QnaItem | null;
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
    const res = await api.patch(`/api/admin/support/qnas/${target.id}/close`, {
      reason: values.reason,
    });
    setLoading(false);
    if (res.success) {
      message.success("종료되었습니다.");
      onDone();
    } else {
      message.error(res.message || "처리에 실패했습니다.");
    }
  }

  return (
    <Modal
      key={target ? `close-${target.id}` : "close-empty"}
      open={open}
      title={target ? `문의 #${target.id} 종료` : "종료"}
      onCancel={onClose}
      onOk={submit}
      okText="종료"
      cancelText="취소"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{ reason: "" }}
      >
        <Form.Item
          name="reason"
          label="종료 사유 (감사 로그)"
          rules={[
            { required: true, message: "종료 사유를 입력하세요." },
            { max: 500, message: "종료 사유는 최대 500자까지 입력 가능합니다." },
          ]}
        >
          <Input.TextArea
            rows={3}
            maxLength={500}
            placeholder="종료 사유를 입력하세요 (필수)."
            data-testid="admin-support-qnas-close-reason"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
