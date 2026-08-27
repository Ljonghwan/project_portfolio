"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Card, Col, DatePicker, Radio, Row, Select, Statistic, Table, Tag, Typography } from "antd";
import type { Dayjs } from "dayjs";
import AdminShell from "@/components/AdminShell";
import { api, fmtInt, fmtUsd, qs } from "@/lib/api";
import {
  ACTION_OPTIONS,
  COL,
  GROUP_BY_OPTIONS,
  PROVIDER_OPTIONS,
  actionLabel,
  errorLabel,
  fmtDateTime,
  fmtDayKey,
  providerModel,
} from "@/lib/labels";

type Log = {
  id: string;
  createdAt: string;
  userId: string | null;
  userName: string | null;
  action: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: string;
  assetId: string | null;
  conversationId: string | null;
  ok: boolean;
  errorCode: string | null;
};
// 묶음 행 — 자료(없으면 대화, 그것도 없으면 개별 로그) + 행동 + 날짜 단위.
type Group = {
  groupKey: string;
  action: string;
  day: string;
  assetId: string | null;
  conversationId: string | null;
  logId: string;
  userId: string | null;
  userName: string | null;
  assetTitle: string | null;
  assetDeleted: boolean;
  calls: number;
  okCalls: number;
  failCalls: number;
  totalTokens: number;
  costUsd: string;
  createdAt: string;
  provider: string;
  model: string;
};
type Summary = { key: string; calls: string; tokens: string; cost: string };

function groupTarget(g: Group): string {
  if (g.assetId) {
    if (!g.assetTitle) return "(삭제된 자료)";
    return g.assetDeleted ? `${g.assetTitle} (삭제됨)` : g.assetTitle;
  }
  if (g.conversationId) return "대화";
  return "개별 호출";
}

export default function UsagePage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [sumTokens, setSumTokens] = useState(0);
  const [sumCost, setSumCost] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(50);
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [provider, setProvider] = useState<string | undefined>();
  const [action, setAction] = useState<string | undefined>();
  const [groupBy, setGroupBy] = useState("day");
  const [grouped, setGrouped] = useState(true); // 기본은 묶음 뷰(카드#009 E)
  const [summary, setSummary] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<{ sort: string; order: string }>({ sort: "createdAt", order: "desc" });
  // 펼친 묶음의 원본 로그 — groupKey → 로그 목록(펼칠 때 한 번만 조회).
  const [children, setChildren] = useState<Record<string, Log[]>>({});
  const [err, setErr] = useState<string | null>(null);

  const filters = useCallback(
    () => ({
      from: range?.[0] ? range[0].toISOString() : undefined,
      to: range?.[1] ? range[1].toISOString() : undefined,
      provider,
      action,
    }),
    [range, provider, action],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const f = filters();
      try {
        const [l, s] = await Promise.all([
          api.get<{ logs: (Log & Group)[]; total: number; tokens: number; cost: number }>(
            `/api/admin/usage${qs({ ...f, page, size, ...sort, group: grouped ? "asset" : undefined })}`,
          ),
          api.get<{ rows: Summary[] }>(`/api/admin/usage/summary${qs({ ...f, groupBy })}`),
        ]);
        if (!alive) return;
        if (grouped) {
          setGroups(l.logs as Group[]);
          setChildren({});
        } else {
          setLogs(l.logs as Log[]);
        }
        setTotal(l.total);
        setSumTokens(l.tokens);
        setSumCost(l.cost);
        setSummary(s.rows);
        setErr(null);
      } catch (e) {
        // 안 잡으면 unhandled rejection → ErrorReporter 가 오류 원장에 중복 기록한다(카드#010).
        // 빈 표는 "사용량이 없다"로 읽히므로 실패는 반드시 화면에 밝힌다.
        if (alive) setErr(e instanceof Error ? e.message : "불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [filters, page, size, groupBy, sort, grouped]);

  // ⚠️ Table 최상위 onChange 는 정렬·페이지 이동·필터를 **한 콜백으로** 알린다(구분은 extra.action
  // 뿐) → action 을 안 보고 정렬 처리를 돌리면 아래 setPage(1) 이 pagination.onChange 가 방금 넣은
  // 페이지를 되감아 페이지 이동이 통째로 죽는다(카드#010 QA 실측). 정렬일 때만 처리할 것.
  // 페이지 리셋은 여기서 직접 — antd 는 정렬에서 페이지를 리셋하지 않는다(onSorterChange →
  // triggerOnChange(…, 'sort', reset=false). 필터만 reset=true).
  const applySort = (
    s: { field?: unknown; order?: string | null } | { field?: unknown; order?: string | null }[],
    action: "paginate" | "sort" | "filter",
  ) => {
    if (action !== "sort") return;
    const so = Array.isArray(s) ? s[0] : s;
    setPage(1);
    if (so?.field) setSort({ sort: String(so.field), order: so.order === "ascend" ? "asc" : "desc" });
  };

  // 묶음 펼치기 — 그 묶음(자료/대화/로그 + 행동 + 그 날짜)에 해당하는 원본 로그만 다시 받는다.
  const loadChildren = async (g: Group) => {
    if (children[g.groupKey]) return;
    const day = { from: `${g.day}T00:00:00+09:00`, to: `${g.day}T23:59:59.999+09:00` };
    try {
      const res = await api.get<{ logs: Log[] }>(
        `/api/admin/usage${qs({
          ...day,
          action: g.action,
          assetId: g.assetId ?? undefined,
          conversationId: g.assetId ? undefined : (g.conversationId ?? undefined),
          logId: g.assetId || g.conversationId ? undefined : g.logId,
          size: 200,
          sort: "createdAt",
          order: "asc",
        })}`,
      );
      setChildren((prev) => ({ ...prev, [g.groupKey]: res.logs }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "불러오지 못했습니다.");
      // 빈 값으로 표시해 펼친 행의 스피너를 멈춘다(계속 돌면 불러오는 중으로 오인).
      setChildren((prev) => ({ ...prev, [g.groupKey]: [] }));
    }
  };

  const logColumns = [
    {
      title: COL.time,
      dataIndex: "createdAt",
      sorter: true,
      render: (v: string) => fmtDateTime(v, true),
    },
    { title: COL.user, dataIndex: "userName", render: (v: string | null) => v ?? "-" },
    { title: COL.action, dataIndex: "action", render: (v: string) => actionLabel(v) },
    {
      title: COL.providerModel,
      dataIndex: "provider",
      render: (_v: string, r: Log) => providerModel(r.provider, r.model),
    },
    { title: COL.tokensIn, dataIndex: "inputTokens", align: "right" as const, render: fmtInt },
    { title: COL.tokensOut, dataIndex: "outputTokens", align: "right" as const, render: fmtInt },
    { title: COL.tokens, dataIndex: "totalTokens", align: "right" as const, sorter: true, render: fmtInt },
    { title: COL.cost, dataIndex: "costUsd", align: "right" as const, sorter: true, render: fmtUsd },
    {
      title: COL.result,
      dataIndex: "ok",
      render: (ok: boolean, r: Log) =>
        ok ? <Tag color="green">성공</Tag> : <Tag color="red">{errorLabel(r.errorCode)}</Tag>,
    },
  ];

  return (
    <AdminShell>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        AI 사용량 관제
      </Typography.Title>

      {err && (
        <Alert
          type="error"
          showIcon
          closable
          style={{ marginBottom: 12 }}
          title="사용량 기록을 불러오지 못했습니다"
          description={err}
          onClose={() => setErr(null)}
        />
      )}

      <Card size="small" style={{ marginBottom: 12 }}>
        <Row gutter={[8, 8]} align="middle">
          <Col>
            <DatePicker.RangePicker
              // 한글 날짜·시각은 antd 기본 폭(약 360px)을 넘겨 잘린다(errors/page.tsx 와 동일 사유).
              style={{ width: 430, maxWidth: "100%" }}
              // format 을 안 주면 antd 기본 'YYYY-MM-DD HH:mm:ss' 가 그대로 노출된다(화면에 개발자식
              // 포맷 금지 — admin/CLAUDE.md). 시는 zero-pad 없이(h), 분만 2자리(mm).
              format="YYYY년 M월 D일 A h:mm"
              showTime={{ use12Hours: true, format: "A h:mm" }}
              onChange={(v) => {
                setPage(1);
                setRange(v as [Dayjs, Dayjs] | null);
              }}
            />
          </Col>
          <Col>
            <Select
              allowClear
              placeholder="AI 공급사"
              style={{ width: 140 }}
              onChange={(v) => { setPage(1); setProvider(v); }}
              options={PROVIDER_OPTIONS}
            />
          </Col>
          <Col>
            <Select
              allowClear
              placeholder="행동"
              style={{ width: 190 }}
              onChange={(v) => { setPage(1); setAction(v); }}
              options={ACTION_OPTIONS}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={8}>
          <Card size="small">
            <Statistic title={grouped ? "묶음 수" : COL.calls} value={fmtInt(total)} />
          </Card>
        </Col>
        <Col xs={8}><Card size="small"><Statistic title={COL.tokens} value={fmtInt(sumTokens)} /></Card></Col>
        <Col xs={8}><Card size="small"><Statistic title={COL.cost} value={fmtUsd(sumCost)} /></Card></Col>
      </Row>

      <Card
        size="small"
        title="집계"
        style={{ marginBottom: 12 }}
        extra={
          <Select value={groupBy} style={{ width: 150 }} onChange={setGroupBy} options={GROUP_BY_OPTIONS} />
        }
      >
        <Table<Summary>
          size="small"
          rowKey="key"
          pagination={false}
          dataSource={summary}
          columns={[
            {
              title: "구분",
              dataIndex: "key",
              // 일자별 집계의 key 는 서버가 'YYYY-MM-DD'(전송 포맷)로 준다 → 화면엔 한글 날짜로.
              render: (v: string) => (groupBy === "day" ? fmtDayKey(v) : v),
            },
            { title: COL.calls, dataIndex: "calls", align: "right", render: fmtInt },
            { title: COL.tokens, dataIndex: "tokens", align: "right", render: fmtInt },
            { title: COL.cost, dataIndex: "cost", align: "right", render: fmtUsd },
          ]}
        />
      </Card>

      <Card
        size="small"
        title="상세 로그"
        extra={
          <Radio.Group
            size="small"
            value={grouped ? "grouped" : "raw"}
            onChange={(e) => {
              setPage(1);
              // 정렬 키는 뷰마다 다르다(묶음에만 'calls') → 전환 시 기본값으로 되돌려 400 을 피한다.
              setSort({ sort: "createdAt", order: "desc" });
              setGrouped(e.target.value === "grouped");
            }}
            options={[
              { value: "grouped", label: "묶어보기" },
              { value: "raw", label: "원본 로그" },
            ]}
            optionType="button"
          />
        }
      >
        {grouped ? (
          <Table<Group>
            size="small"
            rowKey="groupKey"
            loading={loading}
            dataSource={groups}
            onChange={(_p, _f, s, extra) => applySort(s, extra.action)}
            pagination={{
              current: page,
              pageSize: size,
              total,
              showSizeChanger: true,
              onChange: (p, sz) => { setPage(p); setSize(sz); },
            }}
            expandable={{
              onExpand: (open, r) => { if (open) void loadChildren(r); },
              expandedRowRender: (r) => (
                <Table<Log>
                  size="small"
                  rowKey="id"
                  pagination={false}
                  loading={!children[r.groupKey]}
                  dataSource={children[r.groupKey] ?? []}
                  columns={logColumns}
                />
              ),
            }}
            columns={[
              {
                title: "날짜",
                dataIndex: "day",
                width: 132,
                onCell: () => ({ style: { whiteSpace: "nowrap" as const } }),
                render: (v: string) => fmtDayKey(v),
              },
              {
                title: COL.target,
                dataIndex: "groupKey",
                render: (_v: string, r) => groupTarget(r),
              },
              { title: COL.user, dataIndex: "userName", render: (v: string | null) => v ?? "-" },
              { title: COL.action, dataIndex: "action", render: (v: string) => actionLabel(v) },
              {
                title: COL.providerModel,
                dataIndex: "provider",
                render: (_v: string, r) => providerModel(r.provider, r.model),
              },
              { title: COL.calls, dataIndex: "calls", align: "right", sorter: true, render: fmtInt },
              { title: COL.tokens, dataIndex: "totalTokens", align: "right", sorter: true, render: fmtInt },
              { title: COL.cost, dataIndex: "costUsd", align: "right", sorter: true, render: fmtUsd },
              {
                title: COL.result,
                dataIndex: "failCalls",
                render: (fail: number, r) =>
                  fail === 0 ? (
                    <Tag color="green">성공 {r.okCalls}</Tag>
                  ) : (
                    <Tag color="red">실패 {fail} / 성공 {r.okCalls}</Tag>
                  ),
              },
            ]}
          />
        ) : (
          <Table<Log>
            size="small"
            rowKey="id"
            loading={loading}
            dataSource={logs}
            onChange={(_p, _f, s, extra) => applySort(s, extra.action)}
            pagination={{
              current: page,
              pageSize: size,
              total,
              showSizeChanger: true,
              onChange: (p, sz) => { setPage(p); setSize(sz); },
            }}
            columns={logColumns}
          />
        )}
      </Card>
    </AdminShell>
  );
}
