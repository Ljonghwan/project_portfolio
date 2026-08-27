"use client";

// msg-g4 단위A-2: 기업 회원관리 기획서 복원.
// 필터(기획): 가입일/지역(시도+시군구) + 검색에 병원명 추가 + (운영) 상태/사업자인증.
// 컬럼(기획): NO·가입일·계정·이름·병원명·병원주소 + (운영) 휴대폰·상태·면허·관리.
import { useEffect, useState, useCallback } from "react";
import { App, Table, Tag, Input, Select, Space, Button, Card, DatePicker } from "antd";
import type { TablePaginationConfig } from "antd";
import type { Dayjs } from "dayjs";
import AdminShell from "@/components/AdminShell";
import MemberDetailDrawer from "@/components/MemberDetailDrawer";
import { useAdmin } from "@/lib/useAdmin";
import { api } from "@/lib/api";
import { formatPhone } from "@/lib/format";

type UserStatus = "active" | "suspended" | "deleted";
type LicenseStatus = "none" | "pending" | "verified" | "rejected";

interface CorpMemberItem {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  status: UserStatus;
  licenseStatus: LicenseStatus;
  createdAt: string;
  profile: null | { hospitalName: string; hospitalAddress: string | null; businessNo: string };
}

const STATUS_OPTS = [
  { value: "", label: "상태 전체" }, { value: "active", label: "정상" }, { value: "suspended", label: "정지" }, { value: "deleted", label: "탈퇴" },
];
const LICENSE_OPTS = [
  { value: "", label: "인증 전체" }, { value: "none", label: "미신청" }, { value: "pending", label: "대기" }, { value: "verified", label: "승인" }, { value: "rejected", label: "반려" },
];
type SidoEntry = { sido: string; display: string; short: string };

export default function MembersCorpPage() {
  const { message } = App.useApp();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<CorpMemberItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [licenseStatus, setLicenseStatus] = useState("");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [createdRange, setCreatedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [sidos, setSidos] = useState<SidoEntry[]>([]);
  const [sigungus, setSigungus] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    api.get<SidoEntry[]>("/api/regions/sidos").then((res) => { if (res.success && Array.isArray(res.data)) setSidos(res.data); });
  }, []);
  useEffect(() => {
    if (!sido) { setSigungus([]); return; }
    api.get<string[]>(`/api/regions/sigungus?sido=${encodeURIComponent(sido)}`).then((res) => { if (res.success && Array.isArray(res.data)) setSigungus(res.data); });
  }, [sido]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (status) params.set("status", status);
    if (licenseStatus) params.set("licenseStatus", licenseStatus);
    if (q) params.set("q", q);
    if (createdRange?.[0]) params.set("createdFrom", createdRange[0].format("YYYY-MM-DD"));
    if (createdRange?.[1]) params.set("createdTo", createdRange[1].format("YYYY-MM-DD"));
    if (sido) params.set("sido", sido);
    if (sigungu) params.set("sigungu", sigungu);
    const res = await api.get<{ items: CorpMemberItem[]; total: number }>(`/api/admin/members/corp?${params.toString()}`);
    setLoading(false);
    if (res.success && res.data) { setItems(res.data.items); setTotal(res.data.total); }
    else message.error(res.message || "목록을 불러올 수 없습니다.");
  }, [page, pageSize, status, licenseStatus, q, createdRange, sido, sigungu, message]);

  useEffect(() => { if (admin) load(); }, [admin, load]);

  // BUG-2(admin QA): 검색 버튼 클릭 시 qInput을 q에 커밋해야 키워드가 반영됨(Enter 외 버튼 경로 누락 수정).
  function applyFilter() { setQ(qInput.trim()); setPage(1); }
  function resetFilter() {
    setStatus(""); setLicenseStatus(""); setQ(""); setQInput(""); setCreatedRange(null); setSido(""); setSigungu(""); setPage(1);
  }
  function openDetail(id: number) { setSelectedId(id); setDrawerOpen(true); }

  if (authLoading || !admin) return null;

  return (
    <AdminShell>
      <Card title="기업 회원 관리" data-testid="members-corp-page">
        <Space orientation="vertical" className="admin-filter" style={{ width: "100%", marginBottom: 16 }} size="small">
          <Space wrap>
            <Input
              placeholder="이름/아이디/휴대폰/병원명 검색"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onPressEnter={() => { setQ(qInput.trim()); setPage(1); }}
              style={{ width: 360 }}
              allowClear
              data-testid="members-corp-search"
            />
            <DatePicker.RangePicker
              value={createdRange as [Dayjs, Dayjs] | null}
              onChange={(v) => setCreatedRange(v as [Dayjs | null, Dayjs | null] | null)}
              placeholder={["등록일 시작", "등록일 끝"]}
              data-testid="members-corp-created-range"
            />
            <Select value={status} options={STATUS_OPTS} onChange={setStatus} style={{ width: 150 }} data-testid="members-corp-status-filter" />
            <Select value={licenseStatus} options={LICENSE_OPTS} onChange={setLicenseStatus} style={{ width: 160 }} data-testid="members-corp-license-filter" />
          </Space>
          <Space wrap>
            <Select value={sido} onChange={(v) => { setSido(v); setSigungu(""); }} style={{ width: 150 }} data-testid="members-corp-sido"
              options={[{ value: "", label: "지역(시도) 전체" }, ...sidos.map((s) => ({ value: s.sido, label: s.display }))]} />
            <Select value={sigungu} onChange={setSigungu} style={{ width: 150 }} disabled={!sido} data-testid="members-corp-sigungu"
              options={[{ value: "", label: "시군구 전체" }, ...sigungus.map((s) => ({ value: s, label: s }))]} />
            <Button type="primary" onClick={applyFilter} data-testid="members-corp-apply">검색</Button>
            <Button onClick={resetFilter}>초기화</Button>
          </Space>
        </Space>

        <Table<CorpMemberItem>
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
          onChange={(p: TablePaginationConfig) => { setPage(p.current || 1); setPageSize(p.pageSize || 20); }}
          scroll={{ x: 1100 }}
          columns={[
            { title: "NO", dataIndex: "id", width: 64 },
            { title: "등록일", dataIndex: "createdAt", width: 110, render: (v: string) => new Date(v).toLocaleDateString("ko-KR") },
            { title: "계정", dataIndex: "email", ellipsis: true, width: 210 },
            { title: "이름", dataIndex: "name", width: 160 },
            { title: "병원명", key: "hospitalName", width: 200, ellipsis: true, render: (_, r) => r.profile?.hospitalName || "-" },
            { title: "병원주소", key: "hospitalAddress", width: 240, ellipsis: true, render: (_, r) => r.profile?.hospitalAddress || "-" },
            { title: "휴대폰", dataIndex: "phone", width: 160, render: (v: string | null) => (v ? formatPhone(v) : "-") },
            {
              title: "상태", dataIndex: "status", width: 80,
              render: (s: UserStatus) => {
                const map: Record<UserStatus, { color: string; label: string }> = { active: { color: "green", label: "정상" }, suspended: { color: "orange", label: "정지" }, deleted: { color: "red", label: "탈퇴" } };
                return <Tag color={map[s].color}>{map[s].label}</Tag>;
              },
            },
            {
              title: "사업자 인증", dataIndex: "licenseStatus", width: 110,
              render: (s: LicenseStatus) => {
                const map: Record<LicenseStatus, { color: string; label: string }> = { none: { color: "default", label: "미신청" }, pending: { color: "blue", label: "대기" }, verified: { color: "green", label: "승인" }, rejected: { color: "red", label: "반려" } };
                return <Tag color={map[s].color}>{map[s].label}</Tag>;
              },
            },
            {
              title: "관리", key: "actions", width: 72, fixed: "right",
              render: (_, r) => (<Button size="small" onClick={() => openDetail(r.id)} data-testid={`members-corp-row-${r.id}`}>상세</Button>),
            },
          ]}
        />
      </Card>

      <MemberDetailDrawer open={drawerOpen} memberId={selectedId} onClose={() => setDrawerOpen(false)} onChanged={load} />
    </AdminShell>
  );
}
