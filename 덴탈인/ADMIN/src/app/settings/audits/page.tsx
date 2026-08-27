"use client";

import { useEffect, useState, useCallback } from "react";
import {
  App,
  Table,
  Tag,
  Input,
  Space,
  Button,
  Card,
  Drawer,
  Typography,
  Descriptions,
  DatePicker,
} from "antd";
import type { TablePaginationConfig } from "antd";
import AdminShell from "@/components/AdminShell";
import { useAdmin } from "@/lib/useAdmin";
import { api } from "@/lib/api";

interface AuditItem {
  id: number;
  action: string;
  targetType: string;
  targetId: number;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  ipAddress: string;
  createdAt: string;
  admin: {
    id: number;
    name: string;
    emailMasked: string;
    role: "super" | "staff";
  } | null;
}

export default function AuditsPage() {
  const { message } = App.useApp();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [actionQ, setActionQ] = useState("");
  const [targetTypeQ, setTargetTypeQ] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [detail, setDetail] = useState<AuditItem | null>(null);
  // C1: "초기화" — 필터 전체 리셋 + 페이지1 + 필터영역 remount(uncontrolled 입력 비움).
  const [resetKey, setResetKey] = useState(0);
  const resetFilters = () => {
    setActionQ(""); setTargetTypeQ(""); setFrom(""); setTo(""); setPage(1);
    setResetKey((k) => k + 1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (actionQ) params.set("action", actionQ);
    if (targetTypeQ) params.set("targetType", targetTypeQ);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await api.get<{ items: AuditItem[]; total: number }>(
      `/api/admin/audits?${params.toString()}`
    );
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      message.error(res.message || "감사 로그를 불러올 수 없습니다.");
    }
  }, [page, pageSize, actionQ, targetTypeQ, from, to, message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  if (authLoading || !admin) return null;

  return (
    <AdminShell>
      <Card title="감사 로그" data-testid="admin-audits-page">
        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <Input
            placeholder="action 검색 (예: support.qna.answer)"
            allowClear
            style={{ width: 280 }}
            onPressEnter={(e) => {
              setActionQ((e.target as HTMLInputElement).value.trim());
              setPage(1);
            }}
            data-testid="admin-audits-action-filter"
          />
          <Input
            placeholder="targetType (예: SupportQna)"
            allowClear
            style={{ width: 220 }}
            onPressEnter={(e) => {
              setTargetTypeQ((e.target as HTMLInputElement).value.trim());
              setPage(1);
            }}
            data-testid="admin-audits-target-filter"
          />
          <DatePicker.RangePicker
            showTime
            onChange={(range) => {
              setFrom(range?.[0]?.toISOString() || "");
              setTo(range?.[1]?.toISOString() || "");
              setPage(1);
            }}
            data-testid="admin-audits-date-filter"
          />
          <Button onClick={resetFilters}>초기화</Button>
        </Space>

        <Table<AuditItem>
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
            { title: "ID", dataIndex: "id", width: 80 },
            {
              title: "시각",
              dataIndex: "createdAt",
              width: 170,
              render: (v: string) => new Date(v).toLocaleString("ko-KR"),
            },
            {
              title: "운영자",
              key: "admin",
              width: 200,
              render: (_, r) =>
                r.admin
                  ? `${r.admin.name} (${r.admin.role}/${r.admin.emailMasked})`
                  : "(삭제됨)",
            },
            {
              title: "action",
              dataIndex: "action",
              width: 200,
              render: (v: string) => <Tag color="blue">{v}</Tag>,
            },
            {
              title: "대상",
              key: "target",
              width: 200,
              render: (_, r) => `${r.targetType}#${r.targetId}`,
            },
            {
              title: "사유",
              dataIndex: "reason",
              ellipsis: true,
              render: (v: string | null) => v || "-",
            },
            {
              title: "IP",
              dataIndex: "ipAddress",
              width: 140,
              render: (v: string) => v || "-",
            },
            {
              title: "상세",
              key: "detail",
              width: 80,
              render: (_, r) => (
                <Button
                  size="small"
                  onClick={() => setDetail(r)}
                  data-testid={`admin-audits-detail-${r.id}`}
                >
                  보기
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={detail ? `감사 로그 #${detail.id}` : "감사 로그 상세"}
        open={!!detail}
        onClose={() => setDetail(null)}
        size="large"
        destroyOnHidden
      >
        {detail && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="시각">
                {new Date(detail.createdAt).toLocaleString("ko-KR")}
              </Descriptions.Item>
              <Descriptions.Item label="운영자">
                {detail.admin
                  ? `${detail.admin.name} (${detail.admin.role}/${detail.admin.emailMasked})`
                  : "(삭제됨)"}
              </Descriptions.Item>
              <Descriptions.Item label="action">
                <Tag color="blue">{detail.action}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="대상">
                {detail.targetType}#{detail.targetId}
              </Descriptions.Item>
              <Descriptions.Item label="사유">{detail.reason || "-"}</Descriptions.Item>
              <Descriptions.Item label="IP">{detail.ipAddress || "-"}</Descriptions.Item>
            </Descriptions>

            <Typography.Title level={5} style={{ marginTop: 16 }}>
              변경 전 (before)
            </Typography.Title>
            <pre
              style={{
                background: "#fafafa",
                padding: 12,
                borderRadius: 4,
                border: "1px solid #f0f0f0",
                fontSize: 12,
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {detail.before ? JSON.stringify(detail.before, null, 2) : "(없음)"}
            </pre>

            <Typography.Title level={5} style={{ marginTop: 16 }}>
              변경 후 (after)
            </Typography.Title>
            <pre
              style={{
                background: "#f6ffed",
                padding: 12,
                borderRadius: 4,
                border: "1px solid #b7eb8f",
                fontSize: 12,
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {detail.after ? JSON.stringify(detail.after, null, 2) : "(없음)"}
            </pre>
          </>
        )}
      </Drawer>
    </AdminShell>
  );
}
