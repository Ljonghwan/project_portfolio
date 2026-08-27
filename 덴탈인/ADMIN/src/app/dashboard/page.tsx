"use client";

// A-1 파트2: 대시보드 — 기획서(admin.pdf) 사양. KPI 카드 2개(기간 토글) + 라인차트 3개(RangePicker+검색).
import { useEffect, useState, useCallback } from "react";
import {
  App,
  Card,
  Col,
  Row,
  Statistic,
  Segmented,
  Typography,
  Spin,
  DatePicker,
  Button,
  Space,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import AdminShell from "@/components/AdminShell";
import { useAdmin } from "@/lib/useAdmin";
import { api } from "@/lib/api";

type Period = "all" | "30d" | "7d" | "today";
const PERIOD_OPTS = [
  { label: "전체기간", value: "all" },
  { label: "최근 30일", value: "30d" },
  { label: "최근 7일", value: "7d" },
  { label: "오늘", value: "today" },
];

interface KpiData {
  members: { personal: number; corp: number };
  posts: { review: number; talk: number; jobActive: number; jobTotal: number };
}

// ── KPI 카드(자체 기간 토글) ──
function KpiCard({ title, render }: { title: string; render: (d: KpiData) => React.ReactNode }) {
  const { message } = App.useApp();
  const [period, setPeriod] = useState<Period>("all");
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await api.get<KpiData>(`/api/admin/dashboard/kpi?period=${period}`);
      if (!alive) return;
      setLoading(false);
      if (res.success && res.data) setData(res.data);
      else message.error(res.message || "지표를 불러올 수 없습니다.");
    })();
    return () => { alive = false; };
  }, [period, message]);

  return (
    <Card
      title={title}
      extra={
        <Segmented
          size="small"
          value={period}
          options={PERIOD_OPTS}
          onChange={(v) => setPeriod(v as Period)}
        />
      }
    >
      <Spin spinning={loading}>{data ? render(data) : <div style={{ height: 60 }} />}</Spin>
    </Card>
  );
}

// ── 라인차트(자체 RangePicker + 검색) ──
function SeriesChart({ title, type, unit }: { title: string; type: "personal" | "corp" | "job"; unit: string }) {
  const { message } = App.useApp();
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(29, "day"), dayjs()]);
  const [applied, setApplied] = useState<[Dayjs, Dayjs]>([dayjs().subtract(29, "day"), dayjs()]);
  const [items, setItems] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const from = applied[0].format("YYYY-MM-DD");
    const to = applied[1].format("YYYY-MM-DD");
    const res = await api.get<{ items: { date: string; count: number }[] }>(
      `/api/admin/dashboard/series?type=${type}&from=${from}&to=${to}`
    );
    setLoading(false);
    if (res.success && res.data) setItems(res.data.items);
    else message.error(res.message || "시계열을 불러올 수 없습니다.");
  }, [applied, type, message]);

  useEffect(() => { load(); }, [load]);

  return (
    <Card
      title={title}
      extra={
        <Space>
          <DatePicker.RangePicker
            value={range}
            onChange={(v) => { if (v && v[0] && v[1]) setRange([v[0], v[1]]); }}
            allowClear={false}
          />
          <Button type="primary" onClick={() => setApplied(range)}>검색</Button>
        </Space>
      }
    >
      <div style={{ width: "100%", height: 280 }}>
        <Spin spinning={loading} style={{ width: "100%" }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={items} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F4" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => dayjs(d).format("M/D")}
                minTickGap={24}
                tick={{ fontSize: 12 }}
              />
              <YAxis allowDecimals={false} width={40} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: number) => [`${v}${unit}`, "건수"]}
                labelFormatter={(d: string) => dayjs(d).format("M월 D일")}
              />
              <Line
                type="monotone"
                dataKey="count"
                name={title}
                stroke="#0FB5A6"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Spin>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { admin, loading: authLoading } = useAdmin();
  if (authLoading || !admin) return null;

  return (
    <AdminShell>
      <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>대시보드</Typography.Title>

      {/* KPI 카드 2개 — 각 우상단 기간 토글 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={10}>
          <KpiCard
            title="가입자"
            render={(d) => (
              <Row gutter={16}>
                <Col span={12}><Statistic title="개인회원" value={d.members.personal} suffix="명" /></Col>
                <Col span={12}><Statistic title="기업회원" value={d.members.corp} suffix="명" /></Col>
              </Row>
            )}
          />
        </Col>
        <Col xs={24} md={14}>
          <KpiCard
            title="게시글"
            render={(d) => (
              <Row gutter={[16, 12]}>
                <Col xs={12} sm={6}><Statistic title="병원후기" value={d.posts.review} /></Col>
                <Col xs={12} sm={6}><Statistic title="수다방" value={d.posts.talk} /></Col>
                <Col xs={12} sm={6}><Statistic title="진행중 구인정보" value={d.posts.jobActive} /></Col>
                <Col xs={12} sm={6}><Statistic title="전체 구인정보" value={d.posts.jobTotal} /></Col>
              </Row>
            )}
          />
        </Col>
      </Row>

      {/* 라인차트 3개 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}><SeriesChart title="개인 회원 가입 현황" type="personal" unit="명" /></Col>
        <Col xs={24} xl={12}><SeriesChart title="기업회원 가입 현황" type="corp" unit="명" /></Col>
        <Col xs={24}><SeriesChart title="채용공고 등록 현황" type="job" unit="건" /></Col>
      </Row>
    </AdminShell>
  );
}
