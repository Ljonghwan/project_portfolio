"use client";

import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Table, Typography, Alert, Spin } from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminShell from "@/components/AdminShell";
import { api, fmtInt, fmtUsd } from "@/lib/api";
import { COL, actionLabel, fmtDateTime, fmtDayKey, fmtDayKeyShort, providerLabel } from "@/lib/labels";

type Row = { provider?: string; action?: string; calls: string; tokens: string; cost: string };
type Daily = { day: string; provider: string; tokens: string; cost: string };
type Dash = {
  counts: Record<string, string>;
  usage: {
    totals: { calls: string; tokens: string; cost: string; since: string | null; fails: string };
    byProvider: Row[];
    byAction: Row[];
    daily: Daily[];
  };
  billing: {
    revenueKrw: string;
    paidOrders: string;
    creditsSold: string;
    creditsCharged: string;
    creditsSpent: string;
  };
};

export default function DashboardPage() {
  const [d, setD] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.get<Dash>("/api/admin/dashboard");
        if (alive) setD(r);
      } catch {
        // 화면 안내는 아래 `!d` 분기가 한다. 여기서 잡지 않으면 unhandled rejection 이 되고
        // ErrorReporter 가 CLIENT_UNHANDLED_REJECTION 으로 오류 원장에 중복 기록한다(카드#010).
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 일자별 provider 합계 → 차트용 wide 포맷.
  const chart = (() => {
    const byDay = new Map<string, Record<string, number>>();
    for (const r of d?.usage.daily ?? []) {
      const e = byDay.get(r.day) ?? { day: r.day } as unknown as Record<string, number>;
      (e as Record<string, unknown>).day = r.day;
      e[r.provider] = Number(r.cost);
      byDay.set(r.day, e);
    }
    return [...byDay.values()];
  })();

  return (
    <AdminShell>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        대시보드
      </Typography.Title>
      {loading ? (
        <div style={{ display: "grid", placeItems: "center", padding: 80 }}>
          <Spin />
        </div>
      ) : !d ? (
        <Alert type="error" title="대시보드를 불러오지 못했습니다." showIcon />
      ) : (
        <>
          <Row gutter={[12, 12]}>
            {[
              ["가입 회원", d.counts.users],
              ["링크", d.counts.links],
              ["자료", d.counts.assets],
              ["대화", d.counts.conversations],
              ["메시지", d.counts.messages],
            ].map(([label, v]) => (
              <Col key={label} xs={12} md={8} lg={4}>
                <Card size="small">
                  <Statistic title={label} value={fmtInt(v)} />
                </Card>
              </Col>
            ))}
            <Col xs={12} md={8} lg={4}>
              <Card size="small">
                <Statistic title="누적 AI 원가(USD)" value={fmtUsd(d.usage.totals.cost)} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
            <Col xs={12} md={8} lg={5}>
              <Card size="small">
                <Statistic title="누적 매출" value={fmtInt(d.billing.revenueKrw)} suffix="원" />
              </Card>
            </Col>
            <Col xs={12} md={8} lg={5}>
              <Card size="small">
                <Statistic title="결제 건수" value={fmtInt(d.billing.paidOrders)} suffix="건" />
              </Card>
            </Col>
            <Col xs={12} md={8} lg={5}>
              <Card size="small">
                <Statistic title="판매 크레딧" value={fmtInt(d.billing.creditsSold)} />
              </Card>
            </Col>
            <Col xs={12} md={8} lg={5}>
              <Card size="small">
                <Statistic title="소진 크레딧" value={fmtInt(d.billing.creditsSpent)} />
              </Card>
            </Col>
          </Row>

          <Alert
            style={{ marginTop: 16 }}
            type="info"
            showIcon
            title={
              d.usage.totals.since
                ? `AI 사용량 집계 시작: ${fmtDateTime(d.usage.totals.since)} — 이전 사용분은 기록이 없어 집계되지 않습니다.`
                : "AI 사용량 기록이 아직 없습니다. 인제스션·답변이 발생하면 이때부터 집계됩니다."
            }
          />

          <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={14}>
              <Card size="small" title="일자별 원가 추이(최근 14일, AI 공급사별 USD)">
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" fontSize={11} tickFormatter={fmtDayKeyShort} />
                      <YAxis fontSize={11} />
                      <Tooltip
                        formatter={(v: number, n) => [fmtUsd(v), providerLabel(String(n))]}
                        labelFormatter={fmtDayKey}
                      />
                      <Legend formatter={(v) => providerLabel(String(v))} />
                      <Bar dataKey="anthropic" stackId="a" fill="#2F6BFF" />
                      <Bar dataKey="voyage" stackId="a" fill="#1F9D5B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card size="small" title="AI 공급사별" style={{ marginBottom: 12 }}>
                <Table
                  size="small"
                  rowKey={(r) => r.provider ?? ""}
                  pagination={false}
                  dataSource={d.usage.byProvider}
                  columns={[
                    { title: "AI 공급사", dataIndex: "provider", render: providerLabel },
                    { title: COL.calls, dataIndex: "calls", align: "right", render: fmtInt },
                    { title: COL.tokens, dataIndex: "tokens", align: "right", render: fmtInt },
                    { title: COL.cost, dataIndex: "cost", align: "right", render: fmtUsd },
                  ]}
                />
              </Card>
              <Card size="small" title="행동별">
                <Table
                  size="small"
                  rowKey={(r) => r.action ?? ""}
                  pagination={false}
                  dataSource={d.usage.byAction}
                  columns={[
                    { title: COL.action, dataIndex: "action", render: actionLabel },
                    { title: COL.calls, dataIndex: "calls", align: "right", render: fmtInt },
                    { title: COL.tokens, dataIndex: "tokens", align: "right", render: fmtInt },
                    { title: COL.cost, dataIndex: "cost", align: "right", render: fmtUsd },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </AdminShell>
  );
}
