"use client";

import { useEffect, useState, useCallback } from "react";
import {
  App, Table, Tag, Input, Select, Space, Button, Card, Drawer, Descriptions, Modal, Form, DatePicker, Image as AntImage,
} from "antd";
import type { TablePaginationConfig } from "antd";
import type { Dayjs } from "dayjs";
import AdminShell from "@/components/AdminShell";
import { useAdmin } from "@/lib/useAdmin";
import { api, apiFetch } from "@/lib/api";
import { codeLabel, codeOptions, useCodes } from "@/lib/codes";
import { formatPhone, formatBizNo } from "@/lib/format";

type SidoEntry = { sido: string; display: string; short: string };

type JobStatus = "draft" | "active" | "closed" | "forceClosed";
type JobType =
  | "clinical"
  | "desk"
  | "consultant"
  | "hygienist"
  | "coordinator"
  | "insurance"
  | "technician"
  | "management";
type WorkType = "full_time" | "contract" | "part_time" | "intern";

// p2-6-fix1: 하드코딩 라벨맵 제거 → 서버 /api/codes 소비(codeLabel). front와 동일 출처.
function jobTypeLabel(v: string | null | undefined): string {
  return codeLabel("jobType", v);
}

// p2-final: 채용공고 담당업무(jobTypes 배열)는 urgentJobType 9-set 도메인 사용(front JOB_DUTY_TYPE_LABELS와 동일 출처).
function jobDutyLabel(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return "-";
  return arr.map((k) => codeLabel("urgentJobType", k)).join(", ");
}

function workTypeLabel(v: string | null | undefined): string {
  return codeLabel("workType", v);
}

// 항목5: 필요자격증(requiredCertType)·근무환경 태그(workEnvTag) 한글 라벨 매핑(영문 슬러그 노출 방지).
function certLabel(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return "-";
  return arr.map((k) => codeLabel("requiredCertType", k)).join(", ");
}
function workEnvTagLabel(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return "";
  return arr.map((k) => codeLabel("workEnvTag", k)).join(", ");
}

// 그룹3: 급여 한글 표기(사용자페이지 formatSalary와 동일 규칙). 만원-단위(annual/monthly) vs 원-단위.
function salaryText(salaryType: string, salaryMin: number | null, negotiable: boolean): string {
  if (negotiable || salaryMin == null) return "협의";
  const label = codeLabel("salaryType", salaryType);
  const unit = salaryType === "annual" || salaryType === "monthly" ? "만원" : "원";
  return `${label} ${salaryMin.toLocaleString()}${unit}`;
}

// 그룹3: 업무내용 HTML raw 노출 방지 — 블록/br 태그는 줄바꿈으로, 나머지 태그 제거(plain text).
function htmlToText(html: string | null | undefined): string {
  if (!html) return "-";
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim() || "-";
}

// 그룹3: 접수방법 한글 라벨 + 이메일/전화.
function applyMethodText(methods: string[] | null, email: string | null, phone: string | null, etc: string | null): string {
  const parts: string[] = [];
  (methods || []).forEach((m) => {
    const label = codeLabel("applyMethod", m);
    if (m === "email" && email) parts.push(`이메일(${email})`);
    else if (m === "phone" && phone) parts.push(`전화(${phone})`);
    else if (m === "etc" && etc) parts.push(`기타(${etc})`);
    else parts.push(label);
  });
  return parts.length ? parts.join(", ") : "-";
}

interface JobListItem {
  id: number;
  corpUserId: number;
  title: string;
  hospitalName: string;
  jobTypes: string[] | null;
  workType: string;
  region: string | null;
  // QA BUG-2: 목록 급여 컬럼.
  salaryType: string;
  salaryMin: number | null;
  salaryNegotiable: boolean;
  status: JobStatus;
  isHiddenByAdmin: boolean;
  viewCount: number;
  publishedAt: string | null;
  closedAt: string | null;
  expiredAt: string | null;
  recruitStartAt: string | null;
  recruitEndAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  corp: {
    id: number;
    name: string;
    email: string;
    hospitalName: string | null;
    businessNo: string | null;
  } | null;
}

interface JobDetail extends Omit<JobListItem, "corp"> {
  hospitalIntro: string | null;
  hospitalImages: string[] | null; // 병원 사진(public URL) — Drawer 썸네일 노출
  requiredCerts: string[] | null; // 그룹3: 필요자격증
  videoUrl: string | null; // 그룹3: 병원소개 영상
  workEnvTags: string[] | null; // 그룹3: 근무환경 태그
  applyMethodEtc: string | null;
  jobDuties: string;
  headcount: number;
  position: string | null;
  salaryType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryNegotiable: boolean;
  careerType: string;
  careerYearsMin: number;
  applyMethod: string[];
  applyEmail: string | null;
  applyPhone: string | null;
  address: string | null;
  addressDetail: string | null;
  workEnvironment: string | null;
  updatedAt: string;
  corp: JobListItem["corp"] & { phone: string | null; licenseStatus: string; hospitalAddress: string | null } | null;
}

const STATUS_OPTS = [
  { value: "", label: "전체(삭제 제외)" },
  { value: "draft", label: "임시저장" },
  { value: "active", label: "활성" },
  { value: "closed", label: "마감" },
  { value: "forceClosed", label: "강제마감" },
  { value: "deleted", label: "삭제됨만" },
  { value: "all", label: "전체(삭제 포함)" },
];

// p2-6-fix1: 직종 옵션은 /api/codes(jobType)에서. (STATUS_TAG/APP_STATUS_TAG는 antd color + admin 전용
// forceClosed 포함이라 admin UI 메타로 유지)

const STATUS_TAG: Record<JobStatus, { color: string; label: string }> = {
  draft: { color: "default", label: "임시저장" },
  active: { color: "green", label: "활성" },
  closed: { color: "blue", label: "마감" },
  forceClosed: { color: "red", label: "강제마감" },
};

// p2-jobapply-remove-final: 지원자(application) 관리 전면 제거.

export default function AdminJobsPage() {
  const { message } = App.useApp();
  useCodes(); // /api/codes 1회 로드 + 라벨 준비 시 리렌더
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<JobListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [qInput, setQInput] = useState("");
  // msg-g4 단위B-3 기획 필터: 등록일/채용기간/근무지역/근무형태/직급/자격증
  const [createdRange, setCreatedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [recruitRange, setRecruitRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [sido, setSido] = useState("");
  const [workType, setWorkType] = useState("");
  // C1: "초기화" — 필터 전체 리셋 + 페이지1 + 필터영역 remount.
  const [resetKey, setResetKey] = useState(0);
  const resetFilters = () => {
  setStatus(""); setJobTypes([]); setKeyword(""); setCreatedRange(null); setRecruitRange(null); setSido(""); setWorkType(""); setPage(1);
  setQInput("");
    setResetKey((k) => k + 1);
  };
  const [positionLevel, setPositionLevel] = useState("");
  const [requiredCert, setRequiredCert] = useState("");
  const [hidden, setHidden] = useState(""); // 노출여부: ''(전체)|'no'(노출)|'yes'(비노출)
  const [sidos, setSidos] = useState<SidoEntry[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // BUG-4(admin QA): mutation(강제마감/활성화/삭제/비공개) 성공 후 열린 상세 Drawer가 stale.
  // reloadKey를 bump하면 Drawer가 상세를 재요청해 상태/버튼이 최신화됨.
  const [detailReloadKey, setDetailReloadKey] = useState(0);
  const [actionTarget, setActionTarget] = useState<{
    id: number;
    mode: "force_close" | "activate" | "delete";
  } | null>(null);
  // msg-g4 노출여부 비공개/복원
  const [hideTarget, setHideTarget] = useState<{ id: number; isHiddenByAdmin: boolean } | null>(null);
  const [hideReason, setHideReason] = useState("");
  const [hideSubmitting, setHideSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (status) params.set("status", status);
    if (keyword) params.set("keyword", keyword);
    if (jobTypes.length > 0) params.set("jobType", jobTypes.join(","));
    if (createdRange?.[0]) params.set("createdFrom", createdRange[0].format("YYYY-MM-DD"));
    if (createdRange?.[1]) params.set("createdTo", createdRange[1].format("YYYY-MM-DD"));
    if (recruitRange?.[0]) params.set("recruitFrom", recruitRange[0].format("YYYY-MM-DD"));
    if (recruitRange?.[1]) params.set("recruitTo", recruitRange[1].format("YYYY-MM-DD"));
    if (sido) params.set("region", sido);
    if (workType) params.set("workType", workType);
    if (positionLevel) params.set("positionLevel", positionLevel);
    if (requiredCert) params.set("requiredCert", requiredCert);
    if (hidden) params.set("hidden", hidden);
    const res = await api.get<{ items: JobListItem[]; total: number }>(
      `/api/admin/jobs?${params.toString()}`
    );
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      message.error(res.message || "목록을 불러올 수 없습니다.");
    }
  }, [page, pageSize, status, keyword, jobTypes, createdRange, recruitRange, sido, workType, positionLevel, requiredCert, hidden, message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  useEffect(() => {
    api.get<SidoEntry[]>("/api/regions/sidos").then((res) => { if (res.success && Array.isArray(res.data)) setSidos(res.data); });
  }, []);

  async function submitHide() {
    if (!hideTarget) return;
    const next = !hideTarget.isHiddenByAdmin;
    setHideSubmitting(true);
    const res = await apiFetch(`/api/admin/jobs/${hideTarget.id}/hidden`, {
      method: "PATCH",
      body: JSON.stringify({ isHiddenByAdmin: next, reason: hideReason.trim() || undefined }),
    });
    setHideSubmitting(false);
    if (!res.success) { message.error(res.message || "처리에 실패했습니다."); return; }
    message.success(next ? "비공개 처리했습니다." : "공개로 복원했습니다.");
    setHideTarget(null);
    setHideReason("");
    load();
    setDetailReloadKey((k) => k + 1);
  }

  if (authLoading || !admin) return null;

  return (
    <AdminShell>
      <Card title="채용공고 관리" data-testid="admin-jobs-page">
        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <Input
            placeholder="공고 제목/병원명 검색"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onPressEnter={() => {
              setKeyword(qInput.trim());
              setPage(1);
            }}
            style={{ width: 280 }}
            allowClear
            data-testid="admin-jobs-search"
          />
          <Select
            value={status}
            options={STATUS_OPTS}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            style={{ width: 180 }}
            data-testid="admin-jobs-status-filter"
          />
          <Select
            mode="multiple"
            allowClear
            value={jobTypes}
            options={codeOptions("urgentJobType")}
            onChange={(v) => {
              setJobTypes(v);
              setPage(1);
            }}
            style={{ minWidth: 200 }}
            placeholder="업무(직종) 다중"
            data-testid="admin-jobs-jobtype-filter"
          />
          <DatePicker.RangePicker
            value={createdRange as [Dayjs, Dayjs] | null}
            onChange={(v) => { setCreatedRange(v as [Dayjs | null, Dayjs | null] | null); setPage(1); }}
            placeholder={["등록일 시작", "등록일 끝"]}
            data-testid="admin-jobs-created-range"
          />
          <DatePicker.RangePicker
            value={recruitRange as [Dayjs, Dayjs] | null}
            onChange={(v) => { setRecruitRange(v as [Dayjs | null, Dayjs | null] | null); setPage(1); }}
            placeholder={["채용기간 시작", "마감"]}
            data-testid="admin-jobs-recruit-range"
          />
          <Select
            value={sido}
            onChange={(v) => { setSido(v); setPage(1); }}
            style={{ width: 130 }}
            data-testid="admin-jobs-sido"
            options={[{ value: "", label: "근무지역(시도) 전체" }, ...sidos.map((s) => ({ value: s.sido, label: s.display }))]}
          />
          <Select
            value={workType}
            onChange={(v) => { setWorkType(v); setPage(1); }}
            style={{ width: 130 }}
            data-testid="admin-jobs-worktype"
            options={[{ value: "", label: "근무형태 전체" }, ...codeOptions("workType")]}
          />
          <Select
            value={positionLevel}
            onChange={(v) => { setPositionLevel(v); setPage(1); }}
            style={{ width: 120 }}
            data-testid="admin-jobs-positionlevel"
            options={[{ value: "", label: "직급 전체" }, ...codeOptions("jobPositionLevel")]}
          />
          <Select
            value={requiredCert}
            onChange={(v) => { setRequiredCert(v); setPage(1); }}
            style={{ width: 140 }}
            showSearch
            optionFilterProp="label"
            data-testid="admin-jobs-requiredcert"
            options={[{ value: "", label: "자격증 전체" }, ...codeOptions("requiredCertType")]}
          />
          <Select
            value={hidden}
            onChange={(v) => { setHidden(v); setPage(1); }}
            style={{ width: 130 }}
            data-testid="admin-jobs-hidden-filter"
            options={[{ value: "", label: "노출여부 전체" }, { value: "no", label: "노출" }, { value: "yes", label: "운영자 비공개" }]}
          />
          <Button onClick={resetFilters}>초기화</Button>
        </Space>

        <Table<JobListItem>
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
            { title: "제목", dataIndex: "title" },
            {
              title: "병원명",
              dataIndex: "hospitalName",
              width: 150,
              ellipsis: true,
              render: (v: string) => v || "-",
            },
            {
              // 그룹3: 등록자(공고 등록 기업 계정) 표시
              title: "등록자",
              key: "corp",
              width: 160,
              ellipsis: true,
              render: (_: unknown, r: JobListItem) =>
                r.corp ? `${r.corp.name || "-"} (${r.corp.email || "-"})` : "-",
            },
            {
              title: "직종",
              dataIndex: "jobTypes",
              width: 160,
              render: (v: string[] | null) => jobDutyLabel(v),
            },
            { title: "지역", dataIndex: "region", width: 120, render: (v: string | null) => v || "-" },
            
            {
              // 채용기간(기획): 모집기간(recruitStartAt~recruitEndAt). 없으면 게시~만료 fallback.
              title: "채용기간",
              key: "recruitPeriod",
              width: 200,
              render: (_, r) => {
                const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(/\.$/, "") : null);
                const s = fmt(r.recruitStartAt) ?? fmt(r.publishedAt);
                const e = fmt(r.recruitEndAt) ?? fmt(r.expiredAt);
                return s || e ? `${s ?? "?"} ~ ${e ?? "상시"}` : "-";
              },
            },
            {
              title: "상태",
              dataIndex: "status",
              width: 100,
              render: (s: JobStatus, r) => {
                const tag = STATUS_TAG[s];
                return (
                  <Space size={4} orientation="vertical">
                    <Tag color={tag.color}>{tag.label}</Tag>
                    {r.deletedAt && <Tag color="red">삭제</Tag>}
                  </Space>
                );
              },
            },
            {
              // 노출여부(기획) — status와 별개.
              title: "노출여부",
              key: "isHiddenByAdmin",
              width: 100,
              render: (_, r) => (r.isHiddenByAdmin ? <Tag color="orange">운영자 비공개</Tag> : <Tag color="green">공개중</Tag>),
            },
            { title: "조회", dataIndex: "viewCount", width: 70 },
            {
              title: "등록일",
              dataIndex: "createdAt",
              width: 110,
              render: (v: string) => new Date(v).toLocaleDateString("ko-KR"),
            },
            {
              title: "관리",
              key: "actions",
              width: 160,
              render: (_, r) => (
                <Space size={4} wrap>
                  <Button
                    size="small"
                    onClick={() => { setSelectedId(r.id); setDrawerOpen(true); }}
                    data-testid={`admin-jobs-row-${r.id}`}
                  >
                    상세
                  </Button>
                  <Button
                    size="small"
                    onClick={() => { setHideReason(""); setHideTarget({ id: r.id, isHiddenByAdmin: r.isHiddenByAdmin }); }}
                    data-testid={`admin-jobs-hide-${r.id}`}
                  >
                    {r.isHiddenByAdmin ? "복원" : "비공개"}
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <JobDetailDrawer
        open={drawerOpen}
        jobId={selectedId}
        reloadKey={detailReloadKey}
        onClose={() => setDrawerOpen(false)}
        onAction={(target) => setActionTarget(target)}
      />

      <JobActionModal
        target={actionTarget}
        onClose={() => setActionTarget(null)}
        onDone={() => {
          setActionTarget(null);
          load();
          setDetailReloadKey((k) => k + 1);
        }}
      />

      {/* msg-g4 노출여부 비공개/복원 */}
      <Modal
        title={hideTarget?.isHiddenByAdmin ? "공고 공개 복원" : "공고 운영자 비공개"}
        open={!!hideTarget}
        onCancel={() => setHideTarget(null)}
        onOk={submitHide}
        confirmLoading={hideSubmitting}
        okText={hideTarget?.isHiddenByAdmin ? "공개 복원" : "비공개 처리"}
        okButtonProps={{ danger: !hideTarget?.isHiddenByAdmin }}
        cancelText="취소"
        destroyOnHidden
      >
        <p>{hideTarget?.isHiddenByAdmin ? "이 공고를 다시 공개합니다(사용자에게 노출)." : "이 공고를 운영자 비공개 처리합니다. 사용자 목록·상세·검색에서 제외됩니다(작성자 본인은 마이페이지에서 확인 가능)."}</p>
        <Input.TextArea
          rows={3}
          placeholder="사유 (선택, 최대 500자)"
          value={hideReason}
          maxLength={500}
          onChange={(e) => setHideReason(e.target.value)}
          data-testid="admin-jobs-hide-reason"
        />
      </Modal>
    </AdminShell>
  );
}

interface JobDetailDrawerProps {
  open: boolean;
  jobId: number | null;
  reloadKey: number;
  onClose: () => void;
  onAction: (t: { id: number; mode: "force_close" | "activate" | "delete" }) => void;
}

function JobDetailDrawer({ open, jobId, reloadKey, onClose, onAction }: JobDetailDrawerProps) {
  const { message } = App.useApp();
  const [detail, setDetail] = useState<JobDetail | null>(null);

  useEffect(() => {
    if (!open || !jobId) {
      setDetail(null);
      return;
    }
    (async () => {
      const res = await api.get<JobDetail>(`/api/admin/jobs/${jobId}`);
      if (res.success && res.data) setDetail(res.data);
      else message.error(res.message || "상세를 불러올 수 없습니다.");
    })();
    // BUG-4(admin QA): reloadKey 변경 시 상세 재요청 → mutation 후 상태/버튼 최신화.
  }, [open, jobId, reloadKey, message]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={detail ? `공고 #${detail.id} 상세` : "공고 상세"}
      size="large"
      destroyOnHidden
    >
      {detail && (
        <>
          <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="제목">{detail.title}</Descriptions.Item>
            <Descriptions.Item label="병원명">{detail.hospitalName}</Descriptions.Item>
            <Descriptions.Item label="상태">
              <Tag color={STATUS_TAG[detail.status].color}>{STATUS_TAG[detail.status].label}</Tag>
              {detail.deletedAt && (
                <Tag color="red" style={{ marginLeft: 8 }}>
                  삭제됨 ({new Date(detail.deletedAt).toLocaleString("ko-KR")})
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="직종">{jobDutyLabel(detail.jobTypes)}</Descriptions.Item>
            <Descriptions.Item label="고용형태">{workTypeLabel(detail.workType)}</Descriptions.Item>
            <Descriptions.Item label="모집인원">{detail.headcount}</Descriptions.Item>
            <Descriptions.Item label="급여">
              {/* 그룹3: 급여 한글 라벨 + 단위(사용자페이지 formatSalary와 동일). */}
              {salaryText(detail.salaryType, detail.salaryMin, detail.salaryNegotiable)}
            </Descriptions.Item>
            <Descriptions.Item label="경력">
              {codeLabel("careerType", detail.careerType)}
            </Descriptions.Item>
            <Descriptions.Item label="지역">
              {[detail.region, detail.address, detail.addressDetail].filter(Boolean).join(" ") || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="조회수">{detail.viewCount}</Descriptions.Item>
            <Descriptions.Item label="등록일">
              {new Date(detail.createdAt).toLocaleString("ko-KR")}
            </Descriptions.Item>
            <Descriptions.Item label="작성자">
              {detail.corp ? (
                <div data-testid="admin-jobs-corp-info">
                  <div>
                    <strong>{detail.corp.name || "-"}</strong>
                    {" "}
                    <span style={{ color: "#666" }}>({detail.corp.email || "-"})</span>
                  </div>
                  <div style={{ marginTop: 4, color: "#666", fontSize: 13 }}>
                    병원: {detail.corp.hospitalName || "-"} / 사업자번호: {detail.corp.businessNo ? formatBizNo(detail.corp.businessNo) : "-"}
                  </div>
                  {detail.corp.phone && (
                    <div style={{ color: "#666", fontSize: 13 }}>연락처: {formatPhone(detail.corp.phone)}</div>
                  )}
                </div>
              ) : (
                <span style={{ color: "#999" }}>등록 기업 정보 없음 (corpUserId={detail.corpUserId})</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="업무 내용">
              {/* 그룹3: HTML raw 노출 방지 — 태그 제거 후 줄바꿈 보존 plain text */}
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit" }}>{htmlToText(detail.jobDuties)}</pre>
            </Descriptions.Item>
            {detail.hospitalIntro && (
              <Descriptions.Item label="병원 소개">
                <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit" }}>{htmlToText(detail.hospitalIntro)}</pre>
              </Descriptions.Item>
            )}
            {/* 그룹3: 필요자격증 / 병원소개 영상 / 근무환경 / 접수방법 (로고 제외) */}
            <Descriptions.Item label="필요 자격증">
              {/* 항목5: 영문 슬러그 → 한글 라벨(requiredCertType 도메인) */}
              {certLabel(detail.requiredCerts)}
            </Descriptions.Item>
            <Descriptions.Item label="병원소개 영상">
              {detail.videoUrl ? (
                <a href={detail.videoUrl} target="_blank" rel="noopener noreferrer">{detail.videoUrl}</a>
              ) : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="근무환경">
              {/* 항목5: 자유텍스트(workEnvironment) + 태그(workEnvTag 도메인 한글 라벨) */}
              {[detail.workEnvironment, workEnvTagLabel(detail.workEnvTags)].filter((v) => v && v.length).join(" / ") || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="접수방법">
              {applyMethodText(detail.applyMethod, detail.applyEmail, detail.applyPhone, detail.applyMethodEtc)}
            </Descriptions.Item>
          </Descriptions>

          {/* 항목5: 병원 사진(hospitalImages, public 자산 — toViewableUrl 불필요). 있을 때만 노출. */}
          {detail.hospitalImages && detail.hospitalImages.length > 0 && (
            <div style={{ marginBottom: 16 }} data-testid="admin-jobs-hospital-images">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>병원 사진</div>
              <AntImage.PreviewGroup>
                <Space wrap size={8}>
                  {detail.hospitalImages.map((url, i) => (
                    <AntImage
                      key={`${url}-${i}`}
                      src={url}
                      alt={`병원 사진 ${i + 1}`}
                      width={96}
                      height={96}
                      style={{ objectFit: "cover", borderRadius: 6 }}
                    />
                  ))}
                </Space>
              </AntImage.PreviewGroup>
            </div>
          )}

          <Space wrap style={{ marginBottom: 16 }}>
            {detail.status === "active" && !detail.deletedAt && (
              <Button
                danger
                onClick={() => onAction({ id: detail.id, mode: "force_close" })}
                data-testid="admin-jobs-force-close-btn"
              >
                강제 마감
              </Button>
            )}
            {(detail.status === "closed" || detail.status === "forceClosed") && !detail.deletedAt && (
              <Button
                onClick={() => onAction({ id: detail.id, mode: "activate" })}
                data-testid="admin-jobs-activate-btn"
              >
                활성화
              </Button>
            )}
            {!detail.deletedAt && (
              <Button
                danger
                type="primary"
                onClick={() => onAction({ id: detail.id, mode: "delete" })}
                data-testid="admin-jobs-delete-btn"
              >
                삭제
              </Button>
            )}
          </Space>
        </>
      )}
      {detail === null && <div>로딩 중…</div>}
    </Drawer>
  );
}

interface JobActionModalProps {
  target: { id: number; mode: "force_close" | "activate" | "delete" } | null;
  onClose: () => void;
  onDone: () => void;
}

function JobActionModal({ target, onClose, onDone }: JobActionModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const open = !!target;
  const mode = target?.mode || "force_close";

  const titleMap = {
    force_close: "공고 강제 마감",
    activate: "공고 활성화",
    delete: "공고 삭제",
  };
  const okMap = { force_close: "강제 마감", activate: "활성화", delete: "삭제" };

  async function submit() {
    if (!target) return;
    const values = await form.validateFields();
    setLoading(true);
    let res: { success: boolean; message?: string };
    if (mode === "delete") {
      res = await apiFetch(`/api/admin/jobs/${target.id}`, {
        method: "DELETE",
        body: JSON.stringify({ reason: values.reason }),
        headers: { "Content-Type": "application/json" },
      });
    } else {
      const status = mode === "force_close" ? "forceClosed" : "active";
      res = await api.patch(`/api/admin/jobs/${target.id}/status`, {
        status,
        reason: values.reason,
      });
    }
    setLoading(false);
    if (res.success) {
      message.success("처리되었습니다.");
      form.resetFields();
      onDone();
    } else {
      message.error(res.message || "처리에 실패했습니다.");
    }
  }

  return (
    <Modal
      open={open}
      title={titleMap[mode]}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={submit}
      okText={okMap[mode]}
      cancelText="취소"
      okButtonProps={{ danger: mode !== "activate" }}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="reason"
          label={mode === "delete" ? "삭제 사유" : "사유"}
          rules={
            mode === "delete"
              ? [{ required: true, message: "사유를 입력하세요." }, { max: 500 }]
              : [{ max: 500 }]
          }
        >
          <Input.TextArea
            rows={3}
            placeholder={mode === "delete" ? "삭제 사유 (필수)" : "사유 (선택)"}
            data-testid="admin-jobs-action-reason"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
