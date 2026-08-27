"use client";

import { use, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Row,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import AdminShell from "@/components/AdminShell";
import { api, fmtInt, fmtUsd } from "@/lib/api";
import { answerKindLabel, fmtDateTime, fmtTime } from "@/lib/labels";

type Detail = {
  user: { id: string; displayName: string; createdAt: string };
  profile: Record<string, unknown> | null;
  links: Record<string, unknown>[];
  assets: Record<string, unknown>[];
  chunks: { id: string; sourceAssetId: string | null; page: number | null; text: string }[];
  conversations: Record<string, unknown>[];
  messages: Record<string, unknown>[];
  usage: { calls: string; tokens: string; cost: string };
  wallet: { balance: number; ledger: LedgerRow[] };
};

type LedgerRow = {
  id: string;
  entryType: "charge" | "debit";
  reason: "purchase" | "answer" | "ingest" | "embedding" | "admin_adjust";
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
};

const REASON_LABEL: Record<LedgerRow["reason"], string> = {
  purchase: "충전",
  answer: "AI 답변",
  ingest: "자료 분석",
  embedding: "검색 색인",
  admin_adjust: "관리자 조정",
};

type Chunk = { id: string; sourceAssetId: string | null; page: number | null; text: string };

// 추출 원문을 자료별로 묶는다(삽입 순서 유지 = 서버가 준 created_at 오름차순).
function groupChunks(chunks: Chunk[]): [string, Chunk[]][] {
  const map = new Map<string, Chunk[]>();
  for (const c of chunks) {
    const k = c.sourceAssetId ?? "(자료 없음)";
    map.set(k, [...(map.get(k) ?? []), c]);
  }
  return [...map.entries()];
}
function assetTitleOf(assets: Record<string, unknown>[], assetId: string): string {
  const hit = assets.find((a) => String(a.id) === assetId);
  return hit ? String(hit.title) : "(삭제된 자료)";
}

const KIND_COLOR: Record<string, string> = {
  answer: "green",
  no_info: "orange",
  blocked: "red",
  insufficient: "gold",
};

// AI 답변의 경량 마크다운(**굵게**)을 실제 굵기로 — 관리자 화면에 마커가 그대로 보이면 읽기 나쁘다.
// 마커만 지우지 않고 굵게 렌더해 원문 정보를 잃지 않는다.
function renderBold(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*\n]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

// 대화 말풍선 — 인사담당자 질문은 우측, AI 답변은 좌측(색으로도 구분).
function Bubble({ m }: { m: Record<string, unknown> }) {
  const isHr = m.role === "hr";
  const kind = m.answerKind ? String(m.answerKind) : null;
  return (
    <div style={{ display: "flex", justifyContent: isHr ? "flex-end" : "flex-start", marginBottom: 10 }}>
      <div style={{ maxWidth: "76%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
            justifyContent: isHr ? "flex-end" : "flex-start",
          }}
        >
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {isHr ? "인사담당자" : "AI 답변"}
          </Typography.Text>
          {!isHr && kind ? (
            <Tag color={KIND_COLOR[kind]} style={{ marginInlineEnd: 0 }}>
              {answerKindLabel(kind)}
            </Tag>
          ) : null}
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {fmtTime(String(m.createdAt))}
          </Typography.Text>
        </div>
        <div
          style={{
            background: isHr ? "#2F6BFF" : "#F4F6FA",
            color: isHr ? "#fff" : "#0F172A",
            border: isHr ? "none" : "1px solid #E8ECF3",
            borderRadius: 12,
            padding: "9px 12px",
            whiteSpace: "pre-wrap",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {renderBold(String(m.text))}
        </div>
      </div>
    </div>
  );
}

// 대화 하나. 길면 앞부분만 보여주고 "전체 보기"로 펼친다.
const CONVERSATION_PREVIEW = 6;
function ConversationCard({ title, messages }: { title: string; messages: Record<string, unknown>[] }) {
  const [open, setOpen] = useState(false);
  const long = messages.length > CONVERSATION_PREVIEW;
  const shown = open || !long ? messages : messages.slice(0, CONVERSATION_PREVIEW);
  return (
    <Card size="small" style={{ marginBottom: 12 }} title={title}>
      {shown.map((m) => (
        <Bubble key={String(m.id)} m={m} />
      ))}
      {long ? (
        <Button type="link" size="small" style={{ paddingInline: 0 }} onClick={() => setOpen((v) => !v)}>
          {open ? "접기" : `전체 보기 (${messages.length}개)`}
        </Button>
      ) : null}
    </Card>
  );
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.get<Detail>(`/api/admin/members/${id}`);
        if (alive) setD(r);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : "불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <AdminShell>
        <div style={{ display: "grid", placeItems: "center", padding: 80 }}>
          <Spin />
        </div>
      </AdminShell>
    );
  }
  if (err || !d) {
    return (
      <AdminShell>
        <Alert type="error" title={err ?? "회원을 찾을 수 없습니다."} showIcon />
      </AdminShell>
    );
  }

  const p = (d.profile ?? {}) as Record<string, unknown>;
  const msgsByConv = (cid: string) => d.messages.filter((m) => m.conversationId === cid);

  return (
    <AdminShell>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        {/* 이름은 가입 시 빈 문자열 — 비워 두면 제목 줄이 통째로 사라진다(카드#019 2). */}
        {d.user.displayName || "이름 미입력"}
      </Typography.Title>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        title="이 화면은 회원의 이력서 원문과 대화 원문을 포함합니다. 열람 기록은 관리자 감사 로그에 남습니다."
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="AI 호출" value={fmtInt(d.usage.calls)} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="누적 토큰" value={fmtInt(d.usage.tokens)} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="누적 비용(원가)" value={fmtUsd(d.usage.cost)} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="크레딧 잔액" value={fmtInt(d.wallet.balance)} suffix="크레딧" />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: "profile",
            label: "프로필",
            children: (
              <Card size="small">
                <Descriptions column={2} size="small" bordered>
                  {/* `||` — 이름은 가입 시 빈 문자열이라 `??` 로는 폴백이 안 걸린다(카드#019 2). */}
                  <Descriptions.Item label="이름">{String(p.displayName || "-")}</Descriptions.Item>
                  <Descriptions.Item label="한줄소개">{String(p.headline ?? "-")}</Descriptions.Item>
                  <Descriptions.Item label="나이">{String(p.age ?? "-")}</Descriptions.Item>
                  <Descriptions.Item label="학력">{String(p.education ?? "-")}</Descriptions.Item>
                  <Descriptions.Item label="요약" span={2}>{String(p.summary ?? "-")}</Descriptions.Item>
                </Descriptions>
              </Card>
            ),
          },
          {
            key: "links",
            label: `링크 (${d.links.length})`,
            children: (
              <Table
                size="small"
                rowKey={(r) => String(r.id)}
                dataSource={d.links}
                pagination={false}
                columns={[
                  { title: "슬러그", dataIndex: "slug" },
                  { title: "이름", dataIndex: "label" },
                  { title: "유형", dataIndex: "type" },
                  {
                    title: "상태",
                    dataIndex: "status",
                    render: (v: string) => (
                      <Tag color={v === "active" ? "green" : v === "disabled" ? "orange" : "red"}>{v}</Tag>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: "assets",
            label: `자료 (${d.assets.length})`,
            children: (
              <>
                <Table
                  size="small"
                  rowKey={(r) => String(r.id)}
                  dataSource={d.assets}
                  pagination={false}
                  style={{ marginBottom: 12 }}
                  columns={[
                    { title: "제목", dataIndex: "title" },
                    { title: "종류", dataIndex: "kind" },
                    { title: "원본파일", dataIndex: "originalName" },
                    { title: "MIME", dataIndex: "mimeType" },
                  ]}
                />
                <Card size="small" title="추출 원문(AI 근거로 쓰이는 텍스트)">
                  {d.chunks.length === 0 ? (
                    <Typography.Text type="secondary">추출된 내용이 없습니다.</Typography.Text>
                  ) : (
                    // 자료별로 묶어 접어둔다 — 100페이지 PDF 의 조각이 한 줄로 쏟아지면 어느 자료 것인지 안 보인다.
                    <Collapse
                      size="small"
                      items={groupChunks(d.chunks).map(([assetId, list]) => ({
                        key: assetId,
                        label: `${assetTitleOf(d.assets, assetId)} · ${list.length}개 조각`,
                        children: (
                          <>
                            {list.map((c) => (
                              <div key={c.id} style={{ marginBottom: 10 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  {c.page ? `${c.page}페이지` : "페이지 정보 없음"}
                                </Typography.Text>
                                <pre
                                  style={{
                                    whiteSpace: "pre-wrap",
                                    background: "#f7f9fc",
                                    border: "1px solid #eef1f5",
                                    borderRadius: 8,
                                    padding: 12,
                                    fontSize: 12.5,
                                    margin: "4px 0 0",
                                  }}
                                >
                                  {c.text}
                                </pre>
                              </div>
                            ))}
                          </>
                        ),
                      }))}
                    />
                  )}
                </Card>
              </>
            ),
          },
          {
            key: "conversations",
            label: `대화 (${d.conversations.length})`,
            children:
              d.conversations.length === 0 ? (
                <Typography.Text type="secondary">대화가 없습니다.</Typography.Text>
              ) : (
                d.conversations.map((c) => {
                  const cid = String(c.id);
                  return (
                    <ConversationCard
                      key={cid}
                      title={`${String(c.companyName ?? "(회사명 없음)")} · ${fmtDateTime(String(c.startedAt))}`}
                      messages={msgsByConv(cid)}
                    />
                  );
                })
              ),
          },
          {
            key: "wallet",
            label: `크레딧 (${d.wallet.ledger.length})`,
            children: (
              <Table
                size="small"
                rowKey={(r) => r.id}
                dataSource={d.wallet.ledger}
                pagination={{ pageSize: 20, hideOnSinglePage: true }}
                columns={[
                  {
                    title: "일시",
                    dataIndex: "createdAt",
                    render: (v: string) => fmtDateTime(v),
                  },
                  {
                    title: "구분",
                    dataIndex: "entryType",
                    render: (v: string) => (
                      <Tag color={v === "charge" ? "green" : "default"}>
                        {v === "charge" ? "충전" : "차감"}
                      </Tag>
                    ),
                  },
                  {
                    title: "사유",
                    dataIndex: "reason",
                    render: (v: LedgerRow["reason"]) => REASON_LABEL[v] ?? v,
                  },
                  { title: "설명", dataIndex: "description", render: (v: string | null) => v ?? "-" },
                  {
                    title: "변동",
                    dataIndex: "amount",
                    align: "right" as const,
                    render: (v: number, r: LedgerRow) => (
                      <span style={{ fontWeight: 700, color: r.entryType === "charge" ? "#1f7a44" : "#1f2937" }}>
                        {r.entryType === "charge" ? "+" : "−"}
                        {fmtInt(v)}
                      </span>
                    ),
                  },
                  {
                    title: "잔액",
                    dataIndex: "balanceAfter",
                    align: "right" as const,
                    render: (v: number) => fmtInt(v),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </AdminShell>
  );
}
