"use client";

// msg-g4 단위A: 개인 회원관리 기획서 복원(A: 누락 복원 + 운영 유지).
// 필터(기획): 가입일/지역(시도+시군구)/성별/나이/직종/경력/면허번호 + (운영) 상태/면허상태/검색.
// 컬럼(기획): NO·가입일·계정·직종·이름·성별·나이·지역·경력·면허번호 + (운영) 휴대폰·상태·면허.
import { useEffect, useState, useCallback } from "react";
import { App, Table, Tag, Input, Select, Space, Button, Card, DatePicker, InputNumber } from "antd";
import type { TablePaginationConfig } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import AdminShell from "@/components/AdminShell";
import MemberDetailDrawer from "@/components/MemberDetailDrawer";
import { useAdmin } from "@/lib/useAdmin";
import { api } from "@/lib/api";
import { codeLabel, codeOptions, useCodes } from "@/lib/codes";
import { formatPhone } from "@/lib/format";

const THIS_YEAR = new Date().getFullYear(); // 출생연도→나이 기준(현재연도 동적)

type UserStatus = "active" | "suspended" | "deleted";
type LicenseStatus = "none" | "pending" | "verified" | "rejected";

interface PersonalMemberItem {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  status: UserStatus;
  licenseStatus: LicenseStatus;
  createdAt: string;
  profile: null | {
    jobType: string;
    sido: string | null;
    sigungu: string | null;
    careerYears: number;
    careerMonths: number;
    gender: "male" | "female" | null;
    birthYear: number | null;
    licenseNo: string | null;
  };
}

const STATUS_OPTS = [
  { value: "", label: "상태 전체" },
  { value: "active", label: "정상" },
  { value: "suspended", label: "정지" },
  { value: "deleted", label: "탈퇴" },
];
const LICENSE_OPTS = [
  { value: "", label: "면허 전체" },
  { value: "none", label: "미신청" },
  { value: "pending", label: "대기" },
  { value: "verified", label: "승인" },
  { value: "rejected", label: "반려" },
];
const GENDER_OPTS = [
  { value: "", label: "성별 전체" },
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
];
const HAS_LICENSE_OPTS = [
  { value: "", label: "면허번호 전체" },
  { value: "yes", label: "있음" },
  { value: "no", label: "없음" },
];

type SidoEntry = { sido: string; display: string; short: string };

export default function MembersPersonalPage() {
  const { message } = App.useApp();
  useCodes();
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<PersonalMemberItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  // 운영 필터
  const [status, setStatus] = useState("");
  const [licenseStatus, setLicenseStatus] = useState("");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  // 기획 필터
  const [createdRange, setCreatedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [gender, setGender] = useState("");
  const [jobType, setJobType] = useState("");
  const [ageMin, setAgeMin] = useState<number | null>(null);
  const [ageMax, setAgeMax] = useState<number | null>(null);
  const [careerMin, setCareerMin] = useState<number | null>(null);
  const [careerMax, setCareerMax] = useState<number | null>(null);
  const [hasLicense, setHasLicense] = useState("");
  // 지역 옵션
  const [sidos, setSidos] = useState<SidoEntry[]>([]);
  const [sigungus, setSigungus] = useState<string[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 시도 옵션 로드(공개 API)
  useEffect(() => {
    api.get<SidoEntry[]>("/api/regions/sidos").then((res) => {
      if (res.success && Array.isArray(res.data)) setSidos(res.data);
    });
  }, []);
  // 시도 선택 시 시군구 로드
  useEffect(() => {
    if (!sido) { setSigungus([]); return; }
    api.get<string[]>(`/api/regions/sigungus?sido=${encodeURIComponent(sido)}`).then((res) => {
      if (res.success && Array.isArray(res.data)) setSigungus(res.data);
    });
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
    if (gender) params.set("gender", gender);
    if (jobType) params.set("jobType", jobType);
    if (ageMin != null) params.set("ageMin", String(ageMin));
    if (ageMax != null) params.set("ageMax", String(ageMax));
    if (careerMin != null) params.set("careerMin", String(careerMin));
    if (careerMax != null) params.set("careerMax", String(careerMax));
    if (hasLicense) params.set("hasLicense", hasLicense);
    const res = await api.get<{ items: PersonalMemberItem[]; total: number }>(
      `/api/admin/members/personal?${params.toString()}`
    );
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      message.error(res.message || "목록을 불러올 수 없습니다.");
    }
  }, [page, pageSize, status, licenseStatus, q, createdRange, sido, sigungu, gender, jobType, ageMin, ageMax, careerMin, careerMax, hasLicense, message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  // BUG-2(admin QA): 검색 버튼 클릭 시 qInput을 q에 커밋해야 키워드가 반영됨(Enter 외 버튼 경로 누락 수정).
  function applyFilter() { setQ(qInput.trim()); setPage(1); }
  function resetFilter() {
    setStatus(""); setLicenseStatus(""); setQ(""); setQInput("");
    setCreatedRange(null); setSido(""); setSigungu(""); setGender(""); setJobType("");
    setAgeMin(null); setAgeMax(null); setCareerMin(null); setCareerMax(null); setHasLicense("");
    setPage(1);
  }
  function openDetail(id: number) { setSelectedId(id); setDrawerOpen(true); }

  if (authLoading || !admin) return null;

  const jobTypeOpts = [{ value: "", label: "직종 전체" }, ...codeOptions("reviewJobLabelOverride")];

  return (
    <AdminShell>
      <Card title="개인 회원 관리" data-testid="members-personal-page">
        <Space orientation="vertical" className="admin-filter" style={{ width: "100%", marginBottom: 16 }} size="small">
          <Space wrap>
            <Input
              placeholder="이름/아이디/휴대폰 검색"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onPressEnter={() => { setQ(qInput.trim()); setPage(1); }}
              style={{ width: 320 }}
              allowClear
              data-testid="members-personal-search"
            />
            <DatePicker.RangePicker
              value={createdRange as [Dayjs, Dayjs] | null}
              onChange={(v) => setCreatedRange(v as [Dayjs | null, Dayjs | null] | null)}
              placeholder={["등록일 시작", "등록일 끝"]}
              data-testid="members-personal-created-range"
            />
            <Select value={status} options={STATUS_OPTS} onChange={setStatus} style={{ width: 150 }} data-testid="members-personal-status-filter" />
            <Select value={licenseStatus} options={LICENSE_OPTS} onChange={setLicenseStatus} style={{ width: 160 }} data-testid="members-personal-license-filter" />
          </Space>
          <Space wrap>
            <Select value={sido} onChange={(v) => { setSido(v); setSigungu(""); }} style={{ width: 150 }} data-testid="members-personal-sido"
              options={[{ value: "", label: "지역(시도) 전체" }, ...sidos.map((s) => ({ value: s.sido, label: s.display }))]} />
            <Select value={sigungu} onChange={setSigungu} style={{ width: 150 }} disabled={!sido} data-testid="members-personal-sigungu"
              options={[{ value: "", label: "시군구 전체" }, ...sigungus.map((s) => ({ value: s, label: s }))]} />
            <Select value={gender} options={GENDER_OPTS} onChange={setGender} style={{ width: 150 }} data-testid="members-personal-gender" />
            <Select value={jobType} options={jobTypeOpts} onChange={setJobType} style={{ width: 150 }} data-testid="members-personal-jobtype" showSearch optionFilterProp="label" />
            <Select value={hasLicense} options={HAS_LICENSE_OPTS} onChange={setHasLicense} style={{ width: 150 }} data-testid="members-personal-haslicense" />
          </Space>
          <Space wrap>
            <span style={{ fontWeight: 700, color: "#1f2937" }}>나이</span>
            <InputNumber min={0} max={150} value={ageMin} onChange={(v) => setAgeMin(v)} placeholder="최소" style={{ width: 110 }} data-testid="members-personal-age-min" />
            <span>~</span>
            <InputNumber min={0} max={150} value={ageMax} onChange={(v) => setAgeMax(v)} placeholder="최대" style={{ width: 110 }} data-testid="members-personal-age-max" />
            <span style={{ fontWeight: 700, color: "#1f2937", marginLeft: 12 }}>경력(년)</span>
            <InputNumber min={0} max={60} value={careerMin} onChange={(v) => setCareerMin(v)} placeholder="최소" style={{ width: 110 }} data-testid="members-personal-career-min" />
            <span>~</span>
            <InputNumber min={0} max={60} value={careerMax} onChange={(v) => setCareerMax(v)} placeholder="최대" style={{ width: 110 }} data-testid="members-personal-career-max" />
            <Button type="primary" onClick={applyFilter} data-testid="members-personal-apply">검색</Button>
            <Button onClick={resetFilter}>초기화</Button>
          </Space>
        </Space>

        <Table<PersonalMemberItem>
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
          onChange={(p: TablePaginationConfig) => { setPage(p.current || 1); setPageSize(p.pageSize || 20); }}
          scroll={{ x: 1200 }}
          columns={[
            { title: "NO", dataIndex: "id", width: 64 },
            { title: "등록일", dataIndex: "createdAt", width: 110, render: (v: string) => new Date(v).toLocaleDateString("ko-KR") },
            { title: "계정", dataIndex: "email", ellipsis: true, width: 180 },
            { title: "직종", key: "jobType", width: 100, render: (_, r) => (r.profile ? codeLabel("reviewJobLabelOverride", r.profile.jobType) : "-") },
            { title: "이름", dataIndex: "name", width: 90 },
            { title: "성별", key: "gender", width: 64, render: (_, r) => (r.profile?.gender === "female" ? "여성" : r.profile?.gender === "male" ? "남성" : "-") },
            { title: "나이", key: "age", width: 64, render: (_, r) => (r.profile?.birthYear ? `${THIS_YEAR - r.profile.birthYear}세` : "-") },
            { title: "지역", key: "region", width: 130, render: (_, r) => (r.profile ? [r.profile.sido, r.profile.sigungu].filter(Boolean).join(" ") || "-" : "-") },
            { title: "경력", key: "career", width: 90, render: (_, r) => (r.profile ? (r.profile.careerYears || r.profile.careerMonths ? `${r.profile.careerYears}년 ${r.profile.careerMonths}개월` : "신입") : "-") },
            { title: "면허번호", key: "licenseNo", width: 110, render: (_, r) => r.profile?.licenseNo || "-" },
            { title: "휴대폰", dataIndex: "phone", width: 150, render: (v: string | null) => (v ? formatPhone(v) : "-") },
            {
              title: "상태", dataIndex: "status", width: 80,
              render: (s: UserStatus) => {
                const map: Record<UserStatus, { color: string; label: string }> = {
                  active: { color: "green", label: "정상" }, suspended: { color: "orange", label: "정지" }, deleted: { color: "red", label: "탈퇴" },
                };
                return <Tag color={map[s].color}>{map[s].label}</Tag>;
              },
            },
            {
              title: "면허", dataIndex: "licenseStatus", width: 80,
              render: (s: LicenseStatus) => {
                const map: Record<LicenseStatus, { color: string; label: string }> = {
                  none: { color: "default", label: "미신청" }, pending: { color: "blue", label: "대기" }, verified: { color: "green", label: "승인" }, rejected: { color: "red", label: "반려" },
                };
                return <Tag color={map[s].color}>{map[s].label}</Tag>;
              },
            },
            {
              title: "관리", key: "actions", width: 72, fixed: "right",
              render: (_, r) => (<Button size="small" onClick={() => openDetail(r.id)} data-testid={`members-personal-row-${r.id}`}>상세</Button>),
            },
          ]}
        />
      </Card>

      <MemberDetailDrawer open={drawerOpen} memberId={selectedId} onClose={() => setDrawerOpen(false)} onChanged={load} />
    </AdminShell>
  );
}
