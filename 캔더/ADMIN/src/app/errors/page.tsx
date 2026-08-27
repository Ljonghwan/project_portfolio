"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Input,
  Radio,
  Row,
  Select,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import AdminShell from "@/components/AdminShell";
import { api, fmtInt, qs } from "@/lib/api";
import {
  COL,
  ERROR_CODE_OPTIONS,
  ERROR_SOURCE_OPTIONS,
  errorCodeLabel,
  errorSourceLabel,
  fmtDateTime,
} from "@/lib/labels";

type ClientInfo = {
  ip?: string | null;
  userAgent?: string | null;
  browser?: string | null;
  browserVersion?: string | null;
  os?: string | null;
  osVersion?: string | null;
  deviceType?: string | null;
  screen?: string | null;
  viewport?: string | null;
  language?: string | null;
  url?: string | null;
  platform?: string | null;
};
type Log = {
  id: string;
  occurredAt: string;
  createdAt: string;
  source: string;
  code: string;
  status: number | null;
  message: string;
  fingerprint: string;
  method: string | null;
  path: string | null;
  userId: string | null;
  userName: string | null;
  adminId: string | null;
  client: ClientInfo | null;
  context: Record<string, unknown> | null;
};
type Group = {
  fingerprint: string;
  message: string;
  source: string;
  code: string;
  occurrences: number;
  affectedUsers: number;
  affectedIps: number;
  firstSeen: string;
  lastSeen: string;
  sampleId: string;
};
type Detail = { log: Log & { stack: string | null } };

// 같은 오류 묶음 하나를 펼쳤을 때 보여줄 것 — 대표 스택(묶음 안에서 동일하다) + 개별 발생 목록.
type Expanded = { detail?: Detail; logs?: Log[] };

const SOURCE_COLOR: Record<string, string> = {
  server: "red",
  job: "volcano",
  client_front: "blue",
  client_admin: "purple",
};

function clientSummary(c: ClientInfo | null): string {
  if (!c) return "-";
  const browser = [c.browser, c.browserVersion?.split(".")[0]]
    .filter(Boolean)
    .join(" ");
  const os = [c.os, c.osVersion].filter(Boolean).join(" ");
  return (
    [browser, os].filter(Boolean).join(" · ") ||
    (c.userAgent ? "알 수 없는 브라우저" : "-")
  );
}

// 스택·접속 환경 상세. 묶음 뷰에서는 대표 1건, 원본 목록에서는 그 행의 것.
function LogDetail({ log }: { log: Log & { stack?: string | null } }) {
  const c = log.client;
  return (
    <>
      <Descriptions
        size="small"
        column={2}
        bordered
        style={{ marginBottom: 12 }}
      >
        <Descriptions.Item label="발생 시각">
          {fmtDateTime(log.occurredAt, true)}
        </Descriptions.Item>
        <Descriptions.Item label={COL.requestPath}>
          {log.path ? `${log.method ?? ""} ${log.path}`.trim() : "-"}
        </Descriptions.Item>
        <Descriptions.Item label={COL.user}>
          {log.userName ?? "비로그인"}
        </Descriptions.Item>
        <Descriptions.Item label="응답 상태">
          {log.status ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label={COL.browser}>
          {clientSummary(c)}
        </Descriptions.Item>
        <Descriptions.Item label="접속 IP">{c?.ip ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="화면 크기">
          {c?.viewport
            ? `${c.viewport}${c.screen ? ` (기기 ${c.screen})` : ""}`
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="접속 주소">{c?.url ?? "-"}</Descriptions.Item>
      </Descriptions>
      {log.context ? (
        <pre style={preStyle}>{JSON.stringify(log.context, null, 2)}</pre>
      ) : null}
      {/* 스택은 길어서 기본 접힘 — 필요할 때만 편다. */}
      {log.stack ? (
        <details>
          <summary style={{ cursor: "pointer", fontSize: 13 }}>
            오류 발생 지점 보기
          </summary>
          <pre style={preStyle}>{log.stack}</pre>
        </details>
      ) : null}
    </>
  );
}

// 오류 메시지는 길이가 제각각이다(길이 폭탄 방어로 2,000자까지 저장된다) — 폭만 주면 한 행이 세로로
// 수십 줄 터진다. 2줄로 자르고 전문은 행을 펼치면 보인다(title 로 호버 시 원문도).
const messageClamp: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  wordBreak: "break-all",
};

const preStyle: React.CSSProperties = {
  margin: "8px 0 0",
  padding: 12,
  background: "#f7f9fc",
  border: "1px solid #eef1f5",
  borderRadius: 8,
  fontSize: 12,
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  maxHeight: 320,
  overflow: "auto",
};

// 정렬 기본값은 **그 뷰에 실제로 있는 컬럼(dataIndex)** 이어야 한다 — antd 는 정렬 클릭 시 컬럼
// 이름을 그대로 `sort=` 로 보내고, 서버 화이트리스트도 같은 이름을 받는다(adminController pickSort).
const GROUPED_SORT = { sort: "lastSeen", order: "desc" }; // 묶음 뷰: 최근 발생 내림차순
const RAW_SORT = { sort: "occurredAt", order: "desc" }; // 원본 목록: 발생 시각 내림차순

// 조회 실패는 반드시 잡아서 화면에 띄운다 — 안 잡으면 unhandled rejection 이 되고, 그걸 이 앱의
// ErrorReporter 가 CLIENT_UNHANDLED_REJECTION 으로 **이 원장에 다시 적는다**(관제 화면이 자기 노이즈로 오염).
const failMsg = (e: unknown) =>
  e instanceof Error ? e.message : "불러오지 못했습니다.";

// antd Table onChange 의 정렬 인자(묶음·원본 두 테이블이 제네릭만 다르고 쓰는 필드는 같다).
type SorterArg =
  | { field?: unknown; order?: string | null }
  | { field?: unknown; order?: string | null }[];

export default function ErrorsPage() {
  const [grouped, setGrouped] = useState(true); // 기본은 묶음 뷰 — 같은 사안이 수십 줄로 흩어지지 않게
  const [groups, setGroups] = useState<Group[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [occurrences, setOccurrences] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [affectedUsers, setAffectedUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(50);
  // 기본 최근 7일 — 원장은 영구 보관이라 범위를 안 주면 첫 화면이 전체 기간이 된다.
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, "day"),
    dayjs(),
  ]);
  const [source, setSource] = useState<string | undefined>();
  const [code, setCode] = useState<string | undefined>();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ sort: string; order: string }>(GROUPED_SORT);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, Expanded>>({});
  // undefined = 아직 확인 못 함(로딩 중·조회 실패) / null = 확인했고 기록이 하나도 없음.
  // 실패를 null 로 뭉뚱그리면 배너가 "아직 수집된 오류가 없습니다"라고 거짓말한다.
  const [since, setSince] = useState<string | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);

  const filters = useCallback(
    () => ({
      from: range[0].toISOString(),
      to: range[1].toISOString(),
      source,
      code,
      q: q.trim() || undefined,
    }),
    [range, source, code, q],
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      const f = filters();
      try {
        const path = grouped
          ? `/api/admin/errors/summary${qs({ ...f, groupBy: "fingerprint", page, size, ...sort })}`
          : `/api/admin/errors${qs({ ...f, page, size, ...sort })}`;
        const res = await api.get<{
          rows?: Group[];
          logs?: Log[];
          total: number;
          occurrences: number;
          groupCount: number;
          affectedUsers: number;
        }>(path);
        if (!alive) return;
        if (grouped) setGroups(res.rows ?? []);
        else setLogs(res.logs ?? []);
        setTotal(res.total);
        setOccurrences(res.occurrences);
        setGroupCount(res.groupCount);
        setAffectedUsers(res.affectedUsers);
        setExpanded({});
        setErr(null);
      } catch (e) {
        if (alive) setErr(failMsg(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [filters, grouped, page, size, sort]);

  // 수집 시작일(첫 기록) — 소급 불가라 "이 날짜 이전은 기록이 없다"를 배너에 밝힌다.
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await api.get<{ logs: Log[] }>(
          `/api/admin/errors${qs({ size: 1, sort: "occurredAt", order: "asc" })}`,
        );
        if (alive) setSince(res.logs?.[0]?.occurredAt ?? null);
      } catch {
        // 배너 문구용 부가 정보 — 실패해도 목록 조회를 방해하지 않는다(수집 시작일만 비워둔다).
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 묶음 펼치기 — 대표 1건의 스택(묶음 안에서 동일)과 그 묶음의 개별 발생 목록을 한 번만 받는다.
  const loadGroup = async (g: Group) => {
    if (expanded[g.fingerprint]) return;
    const f = filters();
    try {
      const [detail, list] = await Promise.all([
        api.get<Detail>(`/api/admin/errors/${g.sampleId}`),
        api.get<{ logs: Log[] }>(
          `/api/admin/errors${qs({ ...f, fingerprint: g.fingerprint, size: 200, ...RAW_SORT })}`,
        ),
      ]);
      setExpanded((prev) => ({
        ...prev,
        [g.fingerprint]: { detail, logs: list.logs },
      }));
    } catch (e) {
      setErr(failMsg(e));
      // 빈 값으로 표시해 펼친 행의 스피너를 멈춘다(계속 돌면 불러오는 중으로 오인).
      setExpanded((prev) => ({ ...prev, [g.fingerprint]: {} }));
    }
  };

  const loadLog = async (log: Log) => {
    if (expanded[log.id]) return;
    try {
      const detail = await api.get<Detail>(`/api/admin/errors/${log.id}`);
      setExpanded((prev) => ({ ...prev, [log.id]: { detail } }));
    } catch (e) {
      setErr(failMsg(e));
      setExpanded((prev) => ({ ...prev, [log.id]: {} }));
    }
  };

  // 서버가 실제로 적용한 정렬을 헤더 화살표에 반영한다(제어형). 안 주면 antd 내부 상태로만 그려져
  // 정렬 해제 클릭에서 화살표는 사라지는데 데이터는 그대로 내림차순인 어긋남이 생긴다.
  const sortOrder = (field: string): "ascend" | "descend" | null =>
    sort.sort === field ? (sort.order === "asc" ? "ascend" : "descend") : null;

  // antd 는 정렬 해제(내림차순에서 한 번 더 클릭)에서 field 를 주지 않는다. 그대로 무시하면 제어형
  // 화살표가 내림차순에 고정돼 **그 컬럼이 영영 오름차순이 안 된다**(클릭해도 아무 일도 안 일어남).
  // 정렬 없는 원장 목록은 의미가 없으므로 해제 대신 방향만 뒤집어 오름/내림 2단 토글로 쓴다.
  //
  // ⚠️ Table 최상위 onChange 는 정렬·페이지 이동·필터를 **한 콜백으로** 알린다(구분은 extra.action
  // 뿐) → action 을 안 보고 정렬 처리를 돌리면 아래 setPage(1) 이 pagination.onChange 가 방금 넣은
  // 페이지를 되감아 **페이지 이동이 통째로 죽는다**(2 를 눌러도 1페이지). 정렬일 때만 처리할 것.
  // 페이지 리셋은 여기서 직접 해야 한다 — antd 는 정렬에서 페이지를 리셋하지 않는다(onSorterChange →
  // triggerOnChange(…, 'sort', reset=false). 필터만 reset=true).
  const applySort = (s: SorterArg, action: "paginate" | "sort" | "filter") => {
    if (action !== "sort") return;
    const so = Array.isArray(s) ? s[0] : s;
    setPage(1);
    if (!so?.field) {
      setSort((p) => ({ ...p, order: p.order === "asc" ? "desc" : "asc" }));
      return;
    }
    setSort({
      sort: String(so.field),
      order: so.order === "ascend" ? "asc" : "desc",
    });
  };

  const sourceTag = (v: string) => (
    <Tag color={SOURCE_COLOR[v] ?? "default"}>{errorSourceLabel(v)}</Tag>
  );
  // 원문 code 는 운영자가 검색·문의에 쓰므로 한글 라벨 옆에 작게 병기한다.
  const codeCell = (v: string) => (
    <>
      {errorCodeLabel(v)}{" "}
      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
        {v}
      </Typography.Text>
    </>
  );

  // 묶음 안의 개별 발생 목록(공용) — 원본 목록 뷰의 컬럼과 같은 어휘를 쓴다.
  const occurrenceColumns = [
    {
      title: COL.time,
      dataIndex: "occurredAt",
      width: 210,
      render: (v: string) => fmtDateTime(v, true),
    },
    {
      title: COL.user,
      dataIndex: "userName",
      render: (v: string | null) => v ?? "비로그인",
    },
    {
      title: COL.requestPath,
      dataIndex: "path",
      render: (v: string | null, r: Log) =>
        v ? `${r.method ?? ""} ${v}`.trim() : "-",
    },
    {
      title: COL.browser,
      dataIndex: "client",
      render: (c: ClientInfo | null) => clientSummary(c),
    },
    {
      title: "접속 IP",
      dataIndex: "client",
      key: "ip",
      render: (c: ClientInfo | null) => c?.ip ?? "-",
    },
  ];

  return (
    <AdminShell>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        오류 관제
      </Typography.Title>

      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 12 }}
        title="접속 IP·브라우저 정보가 포함된 운영 기록입니다"
        description={
          since
            ? `${fmtDateTime(since)}부터 수집하고 있습니다. 그 이전에 발생한 오류는 기록이 없습니다.`
            : since === null
              ? "아직 수집된 오류가 없습니다."
              : undefined
        }
      />

      {err && (
        <Alert
          type="error"
          showIcon
          closable
          style={{ marginBottom: 12 }}
          title="오류 기록을 불러오지 못했습니다"
          description={err}
          onClose={() => setErr(null)}
        />
      )}

      <Card size="small" style={{ marginBottom: 12 }}>
        <Row gutter={[8, 8]} align="middle">
          <Col>
            <DatePicker.RangePicker
              value={range}
              allowClear={false}
              // 한글 날짜·시각은 antd 기본 폭(약 360px)을 넘겨 "…오전 1:2" 로 잘린다.
              style={{ width: 430, maxWidth: "100%" }}
              // 기본값이 있어 입력칸에 **값이 그대로 보인다** → format 을 안 주면 antd 기본 'YYYY-MM-DD
              // HH:mm:ss' 가 노출된다(화면에 개발자식 포맷 금지). 시는 zero-pad 없이(h), 분만 2자리(mm).
              format="YYYY년 M월 D일 A h:mm"
              showTime={{ use12Hours: true, format: "A h:mm" }}
              onChange={(v) => {
                if (!v?.[0] || !v[1]) return;
                setPage(1);
                setRange([v[0], v[1]]);
              }}
            />
          </Col>
          <Col>
            <Select
              allowClear
              placeholder="발생 위치"
              style={{ width: 150 }}
              onChange={(v) => {
                setPage(1);
                setSource(v);
              }}
              options={ERROR_SOURCE_OPTIONS}
            />
          </Col>
          <Col>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="오류 종류"
              style={{ width: 190 }}
              onChange={(v) => {
                setPage(1);
                setCode(v);
              }}
              options={ERROR_CODE_OPTIONS}
            />
          </Col>
          <Col>
            <Input.Search
              allowClear
              placeholder="오류 내용 검색"
              style={{ width: 220 }}
              onSearch={(v) => {
                setPage(1);
                setQ(v);
              }}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="기간 내 총 발생" value={fmtInt(occurrences)} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="묶음 수" value={fmtInt(groupCount)} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title={COL.affectedUsers}
              value={fmtInt(affectedUsers)}
            />
          </Card>
        </Col>
      </Row>

      <Card
        size="small"
        title="오류 목록"
        extra={
          <Radio.Group
            size="small"
            value={grouped ? "grouped" : "raw"}
            onChange={(e) => {
              const g = e.target.value === "grouped";
              setPage(1);
              // 정렬 키가 뷰마다 다르다(묶음=lastSeen/occurrences/firstSeen, 원본=occurredAt) →
              // 전환 시 그 뷰의 기본값으로 되돌려 400 을 피한다.
              setSort(g ? GROUPED_SORT : RAW_SORT);
              setGrouped(g);
            }}
            options={[
              { value: "grouped", label: "묶어보기" },
              { value: "raw", label: "원본 목록" },
            ]}
            optionType="button"
          />
        }
      >
        {grouped ? (
          <Table<Group>
            size="small"
            rowKey="fingerprint"
            loading={loading}
            dataSource={groups}
            scroll={{ x: 1370 }}
            onChange={(_p, _f, s, extra) => applySort(s, extra.action)}
            pagination={{
              current: page,
              pageSize: size,
              total,
              showSizeChanger: true,
              onChange: (p, sz) => {
                setPage(p);
                setSize(sz);
              },
            }}
            expandable={{
              onExpand: (open, r) => {
                if (open) void loadGroup(r);
              },
              expandedRowRender: (r) => {
                const e = expanded[r.fingerprint];
                return (
                  <>
                    {e?.detail ? <LogDetail log={e.detail.log} /> : null}
                    <Typography.Text
                      strong
                      style={{ display: "block", margin: "14px 0 6px" }}
                    >
                      개별 발생 {r.occurrences}건
                    </Typography.Text>
                    <Table<Log>
                      size="small"
                      rowKey="id"
                      pagination={false}
                      loading={!e}
                      dataSource={e?.logs ?? []}
                      scroll={{ x: 760 }}
                      columns={occurrenceColumns}
                    />
                  </>
                );
              },
            }}
            columns={[
              {
                title: COL.errorMessage,
                dataIndex: "message",
                width: 420,
                render: (v: string) => (
                  <span style={messageClamp} title={v}>
                    {v}
                  </span>
                ),
              },
              {
                title: COL.errorSource,
                dataIndex: "source",
                width: 130,
                render: sourceTag,
              },
              {
                title: COL.errorCode,
                dataIndex: "code",
                width: 210,
                render: codeCell,
              },
              {
                title: COL.occurrences,
                dataIndex: "occurrences",
                width: 110,
                align: "right",
                sorter: true,
                sortOrder: sortOrder("occurrences"),
                render: fmtInt,
              },
              {
                title: COL.affectedUsers,
                dataIndex: "affectedUsers",
                width: 120,
                align: "right",
                render: fmtInt,
              },
              {
                title: COL.lastSeen,
                dataIndex: "lastSeen",
                width: 200,
                sorter: true,
                sortOrder: sortOrder("lastSeen"),
                onCell: () => ({ style: { whiteSpace: "nowrap" as const } }),
                render: (v: string) => fmtDateTime(v),
              },
              {
                title: COL.firstSeen,
                dataIndex: "firstSeen",
                width: 200,
                sorter: true,
                sortOrder: sortOrder("firstSeen"),
                onCell: () => ({ style: { whiteSpace: "nowrap" as const } }),
                render: (v: string) => fmtDateTime(v),
              },
            ]}
          />
        ) : (
          <Table<Log>
            size="small"
            rowKey="id"
            loading={loading}
            dataSource={logs}
            scroll={{ x: 1370 }}
            onChange={(_p, _f, s, extra) => applySort(s, extra.action)}
            pagination={{
              current: page,
              pageSize: size,
              total,
              showSizeChanger: true,
              onChange: (p, sz) => {
                setPage(p);
                setSize(sz);
              },
            }}
            expandable={{
              onExpand: (open, r) => {
                if (open) void loadLog(r);
              },
              expandedRowRender: (r) => {
                const e = expanded[r.id];
                return e?.detail ? (
                  <LogDetail log={e.detail.log} />
                ) : (
                  <span>{e ? "불러오지 못했습니다." : "불러오는 중…"}</span>
                );
              },
            }}
            columns={[
              {
                title: COL.time,
                dataIndex: "occurredAt",
                width: 210,
                sorter: true,
                sortOrder: sortOrder("occurredAt"),
                onCell: () => ({ style: { whiteSpace: "nowrap" as const } }),
                render: (v: string) => fmtDateTime(v, true),
              },
              {
                title: COL.errorMessage,
                dataIndex: "message",
                width: 420,
                render: (v: string) => (
                  <span style={messageClamp} title={v}>
                    {v}
                  </span>
                ),
              },
              {
                title: COL.errorSource,
                dataIndex: "source",
                width: 130,
                render: sourceTag,
              },
              {
                title: COL.errorCode,
                dataIndex: "code",
                width: 210,
                render: codeCell,
              },
              {
                title: COL.user,
                dataIndex: "userName",
                width: 120,
                render: (v: string | null) => v ?? "비로그인",
              },
              {
                title: COL.requestPath,
                dataIndex: "path",
                render: (v: string | null, r: Log) =>
                  v ? `${r.method ?? ""} ${v}`.trim() : "-",
              },
            ]}
          />
        )}
      </Card>
    </AdminShell>
  );
}
