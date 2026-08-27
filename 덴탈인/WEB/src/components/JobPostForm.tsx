"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  JobPost,
  WorkType,
  SalaryType,
  CareerType,
  ApplyMethod,
  BenefitCode,
  WORK_TYPE_LABELS,
  SALARY_TYPE_LABELS,
  CAREER_TYPE_LABELS,
  CAREER_TYPES,
  JOB_DUTY_TYPES,
  JOB_DUTY_TYPE_LABELS,
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  REQUIRED_CERT_TYPES,
  REQUIRED_CERT_TYPE_LABELS,
  WORK_ENV_TAGS,
  WORK_ENV_TAG_LABELS,
  TREATMENT_FIELDS,
  TREATMENT_FIELD_LABELS,
  SUBMIT_DOCS,
  SUBMIT_DOC_LABELS,
  JOB_EDUCATIONS,
  JOB_EDUCATION_LABELS,
  JOB_POSITION_LEVELS,
  JOB_POSITION_LEVEL_LABELS,
  JOB_SALARY_TYPES,
  JOB_SALARY_TYPE_LABELS,
  APPLY_METHOD_LABELS,
  BENEFIT_LABELS,
  BENEFIT_CODES,
  notSupported,
} from "@/lib/jobs";
import { openDaumPostcode } from "@/lib/postcode";
import { geocodeAddress } from "@/lib/kakaoMap";
import { normalizeSido, composeRegion } from "@/stores/regionStore";
import { useMe } from "@/lib/useMe";

export type JobFormState = {
  title: string;
  hospitalName: string;
  businessName: string; // 사업자명(corp)
  representative: string; // 대표자명(corp)
  staffCount: string; // 직원 수(전체)
  doctorCount: string; // 원장 수
  homepage: string;
  memberDesc: string; // 구성원 설명
  hospitalIntro: string;
  hospitalImages: string[];
  videoUrl: string;
  jobDuties: string;
  requiredCerts: string[]; // p2-7: requiredCertType 키 다중
  businessType: string; // 단일
  workEnvTags: string[]; // 다중
  treatmentFields: string[]; // 다중
  submitDocs: string[]; // 다중
  preferential: string;
  qualifications: string;
  recruitStartAt: string;
  recruitEndAt: string;
  alwaysHiring: boolean;
  workType: WorkType;
  jobTypes: string[]; // p2-7: 담당업무 9셋 다중
  headcount: string;
  position: string;
  dutySummary: string;
  positionLevel: string; // jobPositionLevel 키
  salaryType: SalaryType;
  salaryMin: string;
  salaryMax: string;
  salaryNegotiable: boolean;
  education: string; // jobEducation 키
  careerType: CareerType;
  careerYearsMin: string;
  careerYearsMax: string;
  workDays: string;
  workHours: string;
  benefits: BenefitCode[];
  etcWorkConditions: string;
  applyMethod: ApplyMethod[];
  applyMethodEtc: string;
  applyEmail: string;
  applyPhone: string;
  selectionProcess: string;
  region: string;
  address: string;
  addressDetail: string;
  nearestStation: string;
  latitude: string; // 카카오 지오코딩 결과(주소 선택 시 자동 채움). 빈문자=미수집
  longitude: string;
};

const EMPTY_FORM: JobFormState = {
  title: "",
  hospitalName: "",
  businessName: "",
  representative: "",
  staffCount: "",
  doctorCount: "",
  homepage: "",
  memberDesc: "",
  hospitalIntro: "",
  hospitalImages: [],
  videoUrl: "",
  jobDuties: "",
  requiredCerts: [],
  businessType: "",
  workEnvTags: [],
  treatmentFields: [],
  submitDocs: [],
  preferential: "",
  qualifications: "",
  recruitStartAt: "",
  recruitEndAt: "",
  alwaysHiring: false,
  workType: "full_time",
  jobTypes: [],
  headcount: "1",
  position: "",
  dutySummary: "",
  positionLevel: "",
  salaryType: "monthly",
  salaryMin: "",
  salaryMax: "",
  salaryNegotiable: false,
  education: "",
  careerType: "any",
  careerYearsMin: "0",
  careerYearsMax: "0",
  workDays: "",
  workHours: "",
  benefits: [],
  etcWorkConditions: "",
  applyMethod: ["email"],
  applyMethodEtc: "",
  applyEmail: "",
  applyPhone: "",
  selectionProcess: "",
  region: "",
  address: "",
  addressDetail: "",
  nearestStation: "",
  latitude: "",
  longitude: "",
};

const WORK_TYPES: WorkType[] = ["full_time", "contract", "part_time", "intern"];
const APPLY_METHODS: ApplyMethod[] = ["email", "phone", "etc"];

// msg-g1-jobform 항목1: server zod VALIDATION_ERROR(issues)의 영문 path를 한글 필드 라벨로 매핑.
// 통일문구 대신 "어느 필드가" 명확히 — 클라 검증을 통과해도 server에서 걸리는 경우의 fallback.
const FIELD_LABELS: Record<string, string> = {
  title: "공고 제목", hospitalName: "병원명", businessName: "사업자명", representative: "대표자명",
  homepage: "홈페이지 주소", videoUrl: "영상 URL", jobDuties: "세부 내용",
  hospitalIntro: "병원 소개", memberDesc: "구성원 소개",
  salaryMin: "급여", salaryType: "급여 형태", region: "근무지(시/도)", address: "주소", addressDetail: "상세주소",
  applyEmail: "지원 이메일", applyPhone: "지원 전화번호", applyMethod: "지원 방법",
  headcount: "모집인원", workType: "근무 형태", jobTypes: "담당 업무", careerType: "경력",
  staffCount: "직원 수", doctorCount: "원장 수", workHours: "근무 시간", workDays: "근무 요일",
  preferential: "우대 사항", qualifications: "자격 요건",
};
function formatValidationIssues(issues: { path: string; message: string }[]): string {
  const lines = issues.slice(0, 4).map((it) => {
    const label = FIELD_LABELS[it.path.split(".")[0]] || it.path || "입력값";
    return `· ${label}: ${it.message}`;
  });
  return "입력값을 확인해주세요.\n" + lines.join("\n");
}

// 다중 선택 토글 헬퍼
function toggleIn(arr: string[], k: string): string[] {
  return arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k];
}

// 시안 §8 WYSIWYG 에디터(contentEditable + execCommand). p2-7 fix5 — notSupported alert 제거, 실동작.
function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // msg-g1-jobform 항목3: 줄바꿈을 <div> 대신 시맨틱 <p>로 저장(server sanitize 화이트리스트와 정합).
  useEffect(() => {
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch { /* 일부 브라우저 미지원 — div 허용으로 보존됨 */ }
  }, []);
  // 외부 value 변경(수정모드 로드)은 포커스 없을 때만 반영 → 타이핑 중 커서 점프 방지
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerHTML !== (value || "")) {
      el.innerHTML = value || "";
    }
  }, [value]);
  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };
  const onLink = () => {
    const url = window.prompt("링크 URL을 입력하세요.", "https://");
    if (url) exec("createLink", url);
  };
  return (
    <div className="job-editor">
      <div className="toolbar">
        <button type="button" aria-label="굵게" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}><b>B</b></button>
        <button type="button" aria-label="기울임" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}><i>I</i></button>
        <button type="button" aria-label="밑줄" onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}><u>U</u></button>
        <span className="div" />
        <button type="button" aria-label="목록" onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }}>≣</button>
        <button type="button" aria-label="링크" onMouseDown={(e) => { e.preventDefault(); onLink(); }}>🔗</button>
      </div>
      <div
        className="je-body"
        contentEditable
        suppressContentEditableWarning
        ref={ref}
        onInput={() => { if (ref.current) onChange(ref.current.innerHTML); }}
        data-placeholder="채용 공고에 노출될 상세 내용을 입력해 주세요."
      />
    </div>
  );
}

// 시안 cb-grid 커스텀 체크박스(다중선택). p2-7 fix4.
function CbGrid({
  keys,
  labels,
  selected,
  onToggle,
}: {
  keys: readonly string[];
  labels: Record<string, string>;
  selected: string[];
  onToggle: (k: string) => void;
}) {
  return (
    <div className="cb-grid">
      {keys.map((k) => (
        <label key={k} className="cb">
          <input type="checkbox" checked={selected.includes(k)} onChange={() => onToggle(k)} />
          {labels[k] ?? k}
        </label>
      ))}
    </div>
  );
}

export function jobPostToForm(job: JobPost): JobFormState {
  return {
    title: job.title,
    hospitalName: job.hospitalName,
    businessName: job.businessName ?? "",
    representative: job.representative ?? "",
    staffCount: job.staffCount != null ? String(job.staffCount) : "",
    doctorCount: job.doctorCount != null ? String(job.doctorCount) : "",
    homepage: job.homepage ?? "",
    memberDesc: job.memberDesc ?? "",
    hospitalIntro: job.hospitalIntro ?? "",
    hospitalImages: job.hospitalImages ?? [],
    videoUrl: job.videoUrl ?? "",
    jobDuties: job.jobDuties,
    requiredCerts: job.requiredCerts ?? [],
    businessType: job.businessType ?? "",
    workEnvTags: job.workEnvTags ?? [],
    treatmentFields: job.treatmentFields ?? [],
    submitDocs: job.submitDocs ?? [],
    preferential: job.preferential ?? "",
    qualifications: job.qualifications ?? "",
    recruitStartAt: job.recruitStartAt ? job.recruitStartAt.slice(0, 10) : "",
    recruitEndAt: job.recruitEndAt ? job.recruitEndAt.slice(0, 10) : "",
    alwaysHiring: job.alwaysHiring ?? false,
    workType: job.workType,
    jobTypes: job.jobTypes ?? [],
    headcount: String(job.headcount),
    position: job.position ?? "",
    dutySummary: job.dutySummary ?? "",
    positionLevel: job.positionLevel ?? "",
    salaryType: job.salaryType,
    salaryMin: job.salaryMin != null ? String(job.salaryMin) : "",
    salaryMax: job.salaryMax != null ? String(job.salaryMax) : "",
    salaryNegotiable: job.salaryNegotiable,
    education: job.education ?? "",
    careerType: job.careerType,
    careerYearsMin: String(job.careerYearsMin ?? 0),
    careerYearsMax: String(job.careerYearsMax ?? 0),
    workDays: job.workDays ?? "",
    workHours: job.workHours ?? "",
    benefits: job.benefits ?? [],
    etcWorkConditions: job.etcWorkConditions ?? job.workEnvironment ?? "",
    applyMethod: job.applyMethod,
    applyMethodEtc: job.applyMethodEtc ?? "",
    applyEmail: job.applyEmail ?? "",
    applyPhone: job.applyPhone ?? "",
    selectionProcess: job.selectionProcess ?? "",
    region: job.region ?? "",
    address: job.address ?? "",
    addressDetail: job.addressDetail ?? "",
    nearestStation: job.nearestStation ?? "",
    latitude: job.latitude != null ? String(job.latitude) : "",
    longitude: job.longitude != null ? String(job.longitude) : "",
  };
}

export default function JobPostForm({
  mode,
  jobId,
  initial,
}: {
  mode: "create" | "edit";
  jobId?: number;
  initial?: JobPost;
}) {
  const router = useRouter();
  const { me } = useMe(false);
  const isCorp = me?.userType === "corp";
  const [form, setForm] = useState<JobFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // p2-7 fix9: 이전 공고 불러오기(임시저장 포함) — 목록 모달에서 선택 시 폼 프리필
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevLoading, setPrevLoading] = useState(false);
  const [prevJobs, setPrevJobs] = useState<JobPost[]>([]);

  useEffect(() => {
    if (initial) setForm(jobPostToForm(initial));
  }, [initial]);

  // F-B item2: 신규 등록(create) + 기업회원이면 본인 추가정보(corpProfile)를 기본값으로 prefill.
  // 병원명→사업자명, 사업장구분→사업장, 병원주소→회사주소(주소+상세+region). 1회만, 빈 필드만 채움(이전 공고 불러오기/사용자 입력 보존).
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (mode !== "create" || initial) return;
    if (prefilledRef.current) return;
    const cp = me?.corpProfile;
    if (!isCorp || !cp) return;
    prefilledRef.current = true;
    setForm((s) => {
      const next = { ...s };
      if (!next.businessName && cp.hospitalName) next.businessName = cp.hospitalName;
      if (!next.businessType && cp.businessType) next.businessType = cp.businessType;
      if (!next.address && cp.hospitalAddress) {
        next.address = cp.hospitalAddress;
        if (!next.addressDetail && cp.hospitalDetailAddress) next.addressDetail = cp.hospitalDetailAddress;
        if (!next.region) {
          const parts = cp.hospitalAddress.trim().split(/\s+/);
          const sido = normalizeSido(parts[0] || "");
          if (sido) next.region = composeRegion(sido, parts[1] || "");
        }
      }
      return next;
    });
  }, [me, mode, initial, isCorp]);

  const openPrevModal = async () => {
    setPrevOpen(true);
    setPrevLoading(true);
    const res = await api.get<{ items: JobPost[] }>("/api/jobs/me/list?status=all&pageSize=50", true);
    setPrevLoading(false);
    if (res.success && res.data) {
      // 수정 모드면 현재 편집 중인 공고는 제외
      setPrevJobs(res.data.items.filter((j) => j.id !== jobId));
    } else {
      setPrevJobs([]);
    }
  };

  const applyPrevJob = (job: JobPost) => {
    // 제목은 "(복사)" 접미사로 구분, 나머지 필드 그대로 프리필
    const filled = jobPostToForm(job);
    setForm({ ...filled, title: filled.title ? `${filled.title} (복사)` : "" });
    setPrevOpen(false);
  };

  const update = <K extends keyof JobFormState>(k: K, v: JobFormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  // 주소 검색(다음 우편번호) → region/address 세팅 + 카카오 지오코딩으로 좌표 자동 수집(상세 지도용).
  //   지오코딩 실패(키/도메인/미인식)는 무시 — 좌표 비우고 진행(상세는 주소 fallback 렌더).
  const searchAddress = async () => {
    const r = await openDaumPostcode();
    if (!r) return;
    const sido = normalizeSido(r.region);
    setForm((prev) => ({ ...prev, region: composeRegion(sido, r.sigungu), address: r.address, latitude: "", longitude: "" }));
    const geo = await geocodeAddress(r.address);
    if (geo) setForm((prev) => ({ ...prev, latitude: String(geo.lat), longitude: String(geo.lng) }));
  };

  // p2-final BUG-3: 급여 단위별 상한. annual/monthly=만원(99,999=약10억), 그 외=원(daily/hourly 등 → 9,999,999).
  const isManwonUnit = form.salaryType === "annual" || form.salaryType === "monthly";
  const salaryCap = isManwonUnit ? 99999 : 9999999;

  // form-foot 메타: 마지막 임시저장 시각(edit는 initial.updatedAt, create는 미저장 "—").
  const lastSavedText = initial?.updatedAt
    ? new Date(initial.updatedAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  const toggleApply = (m: ApplyMethod) => {
    setForm((s) => {
      const has = s.applyMethod.includes(m);
      const next = has ? s.applyMethod.filter((x) => x !== m) : [...s.applyMethod, m];
      return { ...s, applyMethod: next.length === 0 ? s.applyMethod : next };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // p2-7 fix5: 다중 파일 업로드 — 선택한 모든 파일을 순차 업로드(최대 20장 cap).
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    // p2-final BUG-4: 20장 cap 초과 시 silent break 대신 명시 안내.
    const remaining = 20 - form.hospitalImages.length;
    if (remaining <= 0) {
      alert("병원 사진은 최대 20장까지 첨부할 수 있습니다.");
      e.target.value = "";
      return;
    }
    let capped = false;
    if (files.length > remaining) capped = true;
    setUploading(true);
    const uploaded: string[] = [];
    let failed = 0;
    for (const file of files) {
      if (form.hospitalImages.length + uploaded.length >= 20) break;
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.upload<{ url: string }>("/api/upload", fd);
      if (res.success && res.data?.url) uploaded.push(res.data.url);
      else failed += 1;
    }
    setUploading(false);
    if (uploaded.length > 0) {
      setForm((s) => ({ ...s, hospitalImages: [...s.hospitalImages, ...uploaded].slice(0, 20) }));
    }
    if (failed > 0) alert(`${failed}개 이미지 업로드에 실패했습니다.`);
    if (capped) alert("병원 사진은 최대 20장까지 첨부할 수 있어, 초과분은 제외되었습니다.");
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setForm((s) => ({ ...s, hospitalImages: s.hospitalImages.filter((_, i) => i !== idx) }));
  };

  const buildPayload = () => {
    return {
      title: form.title.trim(),
      // corp는 병원명 입력란 없음 → 사업자명을 표시명(hospitalName)으로 사용. personal은 병원명 그대로.
      hospitalName: (isCorp ? form.businessName.trim() || form.hospitalName.trim() : form.hospitalName.trim()),
      businessName: form.businessName.trim() || null,
      representative: form.representative.trim() || null,
      staffCount: form.staffCount ? Number(form.staffCount) : null,
      doctorCount: form.doctorCount ? Number(form.doctorCount) : null,
      homepage: form.homepage.trim() || null,
      memberDesc: form.memberDesc.trim() || null,
      hospitalIntro: form.hospitalIntro.trim() || null,
      hospitalImages: form.hospitalImages.length > 0 ? form.hospitalImages : null,
      videoUrl: form.videoUrl.trim() || null,
      jobDuties: form.jobDuties.trim() || null,
      requiredCerts: form.requiredCerts.length > 0 ? form.requiredCerts : null,
      businessType: form.businessType || null,
      workEnvTags: form.workEnvTags.length > 0 ? form.workEnvTags : null,
      treatmentFields: form.treatmentFields.length > 0 ? form.treatmentFields : null,
      submitDocs: form.submitDocs.length > 0 ? form.submitDocs : null,
      preferential: form.preferential.trim() || null,
      qualifications: form.qualifications.trim() || null,
      recruitStartAt: form.recruitStartAt ? new Date(form.recruitStartAt).toISOString() : null,
      // p2-7 fix6(D2): 상시모집 시 마감일 비활성(전송 안 함). publish가 이 값을 expiredAt으로 존중.
      recruitEndAt: form.alwaysHiring || !form.recruitEndAt ? null : new Date(form.recruitEndAt).toISOString(),
      alwaysHiring: form.alwaysHiring,
      workType: form.workType,
      jobTypes: form.jobTypes.length > 0 ? form.jobTypes : null,
      headcount: Math.max(1, Math.min(99, Number(form.headcount) || 1)),
      position: form.position.trim() || null,
      dutySummary: form.dutySummary.trim() || null,
      positionLevel: form.positionLevel || null,
      salaryType: form.salaryType,
      // 작업1: 급여 단일값(salaryMin). salaryMax deprecate(null). 빈 칸 → 협의(salaryNegotiable=true).
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: null,
      salaryNegotiable: !form.salaryMin,
      education: form.education.trim() || null,
      careerType: form.careerType,
      careerYearsMin: Math.max(0, Math.min(50, Number(form.careerYearsMin) || 0)),
      careerYearsMax: Math.max(0, Math.min(50, Number(form.careerYearsMax) || 0)),
      workDays: form.workDays.trim() || null,
      workHours: form.workHours.trim() || null,
      benefits: form.benefits.length > 0 ? form.benefits : null,
      etcWorkConditions: form.etcWorkConditions.trim() || null,
      applyMethod: form.applyMethod,
      applyMethodEtc: form.applyMethodEtc.trim() || null,
      applyEmail: form.applyEmail.trim() || null,
      applyPhone: form.applyPhone.trim() || null,
      selectionProcess: form.selectionProcess.trim() || null,
      region: form.region.trim() || null,
      address: form.address.trim() || null,
      addressDetail: form.addressDetail.trim() || null,
      nearestStation: form.nearestStation.trim() || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };
  };

  const submit = async (publishAfter: boolean) => {
    // 작업2: 임시저장(draft)은 필수항목 전부 면제(빈 폼 허용). 데이터 무결성(급여 상한/영상 URL)만 공통 검증.
    // 작업1: 급여 단일값 — 입력 시 상한만 검증("협의"는 빈칸).
    if (form.salaryMin) {
      const v = Number(form.salaryMin);
      if (v > salaryCap) {
        return alert(`급여는 ${salaryCap.toLocaleString()}${isManwonUnit ? "만원" : "원"} 이하로 입력하세요.`);
      }
    }
    if (form.videoUrl.trim()) {
      try {
        new URL(form.videoUrl.trim());
      } catch {
        return alert("올바른 영상 URL을 입력하세요.");
      }
    }
    // msg-g1-jobform 항목1: 홈페이지 URL 형식 검증(필드별 메시지). http(s)만 허용(server zod와 동일).
    if (form.homepage.trim()) {
      const hp = form.homepage.trim();
      const okScheme = hp.startsWith("http://") || hp.startsWith("https://");
      let okUrl = true;
      try { new URL(hp); } catch { okUrl = false; }
      if (!okScheme || !okUrl) return alert("홈페이지 주소 형식을 확인해주세요. (http:// 또는 https:// 로 시작)");
    }
    // 공개(publish) 시에만 필수 항목 검증. (서버도 /publish에서 재검증)
    if (publishAfter) {
      if (!form.title.trim()) return alert("공고 제목을 입력하세요.");
      if (isCorp) {
        if (!form.businessName.trim()) return alert("사업자명을 입력하세요.");
      } else if (!form.hospitalName.trim()) {
        return alert("병원명을 입력하세요.");
      }
      if (form.jobTypes.length === 0) return alert("담당 업무를 1개 이상 선택하세요.");
      if (form.applyMethod.includes("email") && !form.applyEmail.trim()) {
        return alert("이메일 지원을 선택하셨으면 이메일을 입력하세요.");
      }
      if (form.applyMethod.includes("phone") && !form.applyPhone.trim()) {
        return alert("전화 지원을 선택하셨으면 전화번호를 입력하세요.");
      }
      if (!form.region.trim() || !form.address.trim()) {
        return alert("회사 주소(주소 검색으로 지역·주소)를 입력해야 공개할 수 있습니다.");
      }
    }

    setSubmitting(true);
    const payload = buildPayload();
    let res;
    let targetId = jobId;
    if (mode === "create") {
      res = await api.post<JobPost>("/api/jobs", payload, true);
      if (res.success && res.data) targetId = res.data.id;
    } else {
      res = await api.patch<JobPost>(`/api/jobs/${jobId}`, payload, true);
    }

    if (!res.success) {
      setSubmitting(false);
      if (res.code === "BUSINESS_LICENSE_REQUIRED") {
        alert(res.message || "사업자등록증을 먼저 등록해 주세요.");
        router.push("/mypage/extra");
        return;
      }
      // msg-g1-jobform 항목1: 검증 실패는 필드별 메시지로(어느 필드가 왜 틀렸는지). 통일문구 회피.
      if (res.code === "VALIDATION_ERROR" && Array.isArray(res.issues) && res.issues.length > 0) {
        alert(formatValidationIssues(res.issues));
        return;
      }
      alert(res.message || "저장에 실패했습니다.");
      return;
    }

    if (publishAfter && targetId) {
      const pubRes = await api.post(`/api/jobs/${targetId}/publish`, undefined, true);
      setSubmitting(false);
      if (!pubRes.success) {
        if (pubRes.code === "BUSINESS_LICENSE_REQUIRED") {
          alert(pubRes.message || "사업자등록증 등록 후 공개할 수 있습니다.");
          router.push("/mypage/extra");
          return;
        }
        alert(pubRes.message || "공개에 실패했습니다.");
        router.push("/mypage/jobs");
        return;
      }
      alert("공고를 공개했습니다.");
      router.push("/mypage/jobs");
      return;
    }

    setSubmitting(false);
    alert(mode === "create" ? "임시저장했습니다." : "수정했습니다.");
    router.push("/mypage/jobs");
  };

  return (
    <>
      {/* 시안 mp-page-head (p2-7 fix9): 페이지 헤더 + 안내 + 이전 공고 불러오기 */}
      <div className="mp-page-head">
        <div>
          <h2>{mode === "edit" ? "채용 공고 수정" : "채용 공고"}</h2>
          <div className="sub">
            <span style={{ color: "#EF4444" }}>*</span> 표시 항목은 필수 입력입니다. 작성 중 임시저장이 가능해요.
          </div>
        </div>
        <div className="head-actions-r">
          <button type="button" className="reload-btn" onClick={openPrevModal}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            이전 공고 불러오기
          </button>
        </div>
      </div>

      {prevOpen && (
        <div className="prevjob-backdrop" onClick={() => setPrevOpen(false)}>
          <div className="prevjob-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prevjob-head">
              <h3>이전 공고 불러오기</h3>
              <button type="button" className="prevjob-x" onClick={() => setPrevOpen(false)} aria-label="닫기">✕</button>
            </div>
            <p className="prevjob-desc">불러올 공고를 선택하면 현재 폼에 내용이 채워집니다. (임시저장 포함)</p>
            <div className="prevjob-list">
              {prevLoading ? (
                <div className="prevjob-empty">불러오는 중…</div>
              ) : prevJobs.length === 0 ? (
                <div className="prevjob-empty">불러올 이전 공고가 없습니다.</div>
              ) : (
                prevJobs.map((j) => (
                  <button type="button" key={j.id} className="prevjob-item" onClick={() => applyPrevJob(j)}>
                    <span className={`prevjob-status ${j.status}`}>
                      {j.status === "draft" ? "임시저장" : j.status === "active" ? "진행중" : "마감"}
                    </span>
                    <span className="prevjob-title">{j.title || "(제목 없음)"}</span>
                    <span className="prevjob-date">{j.updatedAt ? j.updatedAt.slice(0, 10) : ""}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    <div className="job-form">
      {/* 공고 제목 — 시안 §섹션에 없어(시안 page-head) 폼 최상단 별도 배치 */}
      <section className="section">
        <div className="form-grid">
          <label>공고 제목<span className="req">*</span></label>
          <div>
            <input
              type="text"
              value={form.title}
              maxLength={80}
              placeholder="예: [강남] 진료실 스탭 모집"
              onChange={(e) => update("title", e.target.value)}
            />
            <div className="help">최대 80자</div>
          </div>
        </div>
      </section>

      <section className="section">
        <h3><span className="secnum">1</span>기본 정보</h3>
        <div className="form-grid">
          {isCorp ? (
            <>
              <label>사업자명<span className="req">*</span></label>
              <div>
                <input type="text" value={form.businessName} maxLength={100} placeholder="㈜한국" onChange={(e) => update("businessName", e.target.value)} />
              </div>
              <label>대표자명<span className="req">*</span></label>
              <div>
                <input type="text" value={form.representative} maxLength={50} placeholder="대표자명" onChange={(e) => update("representative", e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <label>병원명<span className="req">*</span></label>
              <div>
                <input type="text" value={form.hospitalName} maxLength={100} placeholder="병원명을 입력하세요" onChange={(e) => update("hospitalName", e.target.value)} />
                <div className="help">개인 회원은 병원명을 자유롭게 입력합니다.</div>
              </div>
              {/* msg-g1-jobform 항목5: 개인회원도 대표자명 입력 → 상세 병원소개에 노출 */}
              <label>대표자명</label>
              <div>
                <input type="text" value={form.representative} maxLength={50} placeholder="대표자명" onChange={(e) => update("representative", e.target.value)} />
              </div>
            </>
          )}

          <label>사업장<span className="req">*</span></label>
          <div className="chip-group">
            {BUSINESS_TYPES.map((bt) => (
              <button
                type="button"
                key={bt}
                className={`pill ${form.businessType === bt ? "on" : ""}`}
                onClick={() => update("businessType", form.businessType === bt ? "" : bt)}
              >
                {BUSINESS_TYPE_LABELS[bt]}
              </button>
            ))}
          </div>

          <label>직원 수</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <input type="number" min={0} value={form.staffCount} onChange={(e) => update("staffCount", e.target.value)} style={{ width: 110 }} />
              <span style={{ color: "var(--ink-3)", fontSize: 13 }}>명 (전체)</span>
            </span>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <input type="number" min={0} value={form.doctorCount} onChange={(e) => update("doctorCount", e.target.value)} style={{ width: 110 }} />
              <span style={{ color: "var(--ink-3)", fontSize: 13 }}>명 (원장)</span>
            </span>
          </div>

          <label>회사 주소<span className="req">*</span></label>
          <div>
            {/* 작업3: 시/도 select 제거. 주소 검색(다음 우편번호) 결과의 sido/sigungu로 region 자동 세팅.
                region은 "{시도키} {시군구}"(정규화) — 목록 지역필터(시도)와 매칭. 상세주소만 직접 입력. */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <input
                type="text"
                value={form.address}
                readOnly
                placeholder="주소 검색을 눌러 입력하세요"
                onClick={searchAddress}
                style={{ flex: 1, minWidth: 200, cursor: "pointer", background: "#fff" }}
              />
              <button type="button" className="btn-line" onClick={searchAddress}>
                주소 검색
              </button>
            </div>
            {form.region && (
              <div className="help" style={{ marginBottom: 8 }}>지역: {form.region}</div>
            )}
            <input
              type="text"
              value={form.addressDetail}
              maxLength={200}
              placeholder="상세주소를 입력하세요."
              onChange={(e) => update("addressDetail", e.target.value)}
            />
            {/* #6: 인근 지하철역(선택) — 회사주소 아래 */}
            <input
              type="text"
              value={form.nearestStation}
              maxLength={100}
              placeholder="인근 지하철역 (선택) 예: 강남역 3번 출구"
              onChange={(e) => update("nearestStation", e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>

          <label>홈페이지</label>
          <div>
            <input type="url" value={form.homepage} maxLength={300} placeholder="https://" onChange={(e) => update("homepage", e.target.value)} />
          </div>

          <label>구성원 설명</label>
          <div>
            <textarea value={form.memberDesc} maxLength={4000} placeholder="내용을 입력해 주세요." onChange={(e) => update("memberDesc", e.target.value)} />
          </div>

          <label>병원 소개</label>
          <div>
            <textarea value={form.hospitalIntro} maxLength={4000} placeholder="내용을 입력해 주세요." onChange={(e) => update("hospitalIntro", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="section">
        <h3><span className="secnum">2</span>병원 사진</h3>
        <div className="form-grid">
          <label>병원 사진</label>
          <div>
            <label className="file-picker">
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} />
              <span className="file-picker-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                사진 추가
              </span>
              <span className="file-picker-hint">{uploading ? "업로드 중…" : `PNG, JPG · 5MB 이하 · 최대 20장 (${form.hospitalImages.length}/20)`}</span>
            </label>
            <div className="img-thumbs">
              {form.hospitalImages.map((src, i) => (
                <div key={i} className="ph" style={{ backgroundImage: `url(${src})` }}>
                  <button type="button" onClick={() => removeImage(i)} aria-label="삭제">×</button>
                </div>
              ))}
            </div>
            <div className="help">1장 필수 권장, 최대 20장. 여러 장 한 번에 선택 가능합니다.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <h3><span className="secnum">3</span>상세 채용 정보</h3>
        <div className="form-grid">
          {/* 시안 §3 순서: 담당업무 → 필요자격증 → 근무형태 → 모집인원 → 직급 → 급여 → 학력 → 경력 */}
          <label>담당업무<span className="req">*</span></label>
          <CbGrid keys={JOB_DUTY_TYPES} labels={JOB_DUTY_TYPE_LABELS} selected={form.jobTypes} onToggle={(k) => update("jobTypes", toggleIn(form.jobTypes, k))} />

          <label>필요 자격증<span className="req">*</span></label>
          <CbGrid keys={REQUIRED_CERT_TYPES} labels={REQUIRED_CERT_TYPE_LABELS} selected={form.requiredCerts} onToggle={(k) => update("requiredCerts", toggleIn(form.requiredCerts, k))} />

          <label>근무 형태<span className="req">*</span></label>
          <div className="chip-group">
            {WORK_TYPES.map((wt) => (
              <button
                type="button"
                key={wt}
                className={`pill ${form.workType === wt ? "on" : ""}`}
                onClick={() => update("workType", wt)}
              >
                {WORK_TYPE_LABELS[wt]}
              </button>
            ))}
          </div>

          <label>모집인원<span className="req">*</span></label>
          <div>
            <input
              type="number"
              min={1}
              max={99}
              value={form.headcount}
              onChange={(e) => update("headcount", e.target.value)}
              style={{ width: 140 }}
            />
          </div>

          <label>직급</label>
          <div className="chip-group">
            {JOB_POSITION_LEVELS.map((pl) => (
              <button
                type="button"
                key={pl}
                className={`pill ${form.positionLevel === pl ? "on" : ""}`}
                onClick={() => update("positionLevel", form.positionLevel === pl ? "" : pl)}
              >
                {JOB_POSITION_LEVEL_LABELS[pl]}
              </button>
            ))}
          </div>

          {/* 작업1/신규1: 급여 단일 입력 — select(면접 후 결정/월급/일급/시급/연봉) + 숫자 1개 + 단위.
              면접 후 결정(interview) 선택 시 금액 input disable + 빈값. 빈칸 → "면접 후 결정" */}
          <label>급여<span className="req">*</span></label>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select
                className="job-select"
                value={form.salaryType}
                onChange={(e) => {
                  const v = e.target.value as SalaryType;
                  setForm((s) => ({ ...s, salaryType: v, salaryMin: v === "interview" ? "" : s.salaryMin }));
                }}
                style={{ width: 120 }}
              >
                {JOB_SALARY_TYPES.map((st) => (
                  <option key={st} value={st}>{JOB_SALARY_TYPE_LABELS[st]}</option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                max={salaryCap}
                value={form.salaryMin}
                disabled={form.salaryType === "interview"}
                onChange={(e) => update("salaryMin", e.target.value)}
                placeholder={form.salaryType === "interview" ? "면접 후 결정" : "0"}
                style={{ width: 140 }}
              />
              <span style={{ color: "var(--ink-3)", fontSize: 13 }}>
                {form.salaryType === "interview" ? "" : (form.salaryType === "annual" || form.salaryType === "monthly" ? "만원" : "원")}
              </span>
            </div>
          </div>

          {/* M2: 학력 — select 드롭다운 + 필수 */}
          <label>학력<span className="req">*</span></label>
          <div>
            <select
              className="job-select"
              value={form.education}
              onChange={(e) => update("education", e.target.value)}
              style={{ maxWidth: 240 }}
            >
              <option value="">선택</option>
              {JOB_EDUCATIONS.map((ed) => (
                <option key={ed} value={ed}>{JOB_EDUCATION_LABELS[ed]}</option>
              ))}
            </select>
          </div>

          <label>경력<span className="req">*</span></label>
          <div className="chip-group">
            {CAREER_TYPES.map((ct) => (
              <button
                type="button"
                key={ct}
                className={`pill ${form.careerType === ct ? "on" : ""}`}
                onClick={() => update("careerType", ct)}
              >
                {CAREER_TYPE_LABELS[ct]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* §4 근무 환경 — 근무지 환경 + 진료 분야 (다중 cb-grid) */}
      <section className="section">
        <h3><span className="secnum">4</span>근무 환경</h3>
        <div className="form-grid">
          <label>근무지 환경</label>
          <CbGrid keys={WORK_ENV_TAGS} labels={WORK_ENV_TAG_LABELS} selected={form.workEnvTags} onToggle={(k) => update("workEnvTags", toggleIn(form.workEnvTags, k))} />

          <label>진료 분야</label>
          <CbGrid keys={TREATMENT_FIELDS} labels={TREATMENT_FIELD_LABELS} selected={form.treatmentFields} onToggle={(k) => update("treatmentFields", toggleIn(form.treatmentFields, k))} />
        </div>
      </section>

      {/* §5 근무 요일 */}
      <section className="section">
        <h3><span className="secnum">5</span>근무 요일</h3>
        <div className="form-grid">
          <label>근무 요일</label>
          <div>
            <div className="day-presets">
              {["월~금(주5일)", "월~금(주40시간)", "월~토(토요일 격주휴무)", "월~토"].map((p) => (
                <button
                  type="button"
                  key={p}
                  className={`pill ${form.workDays === p ? "on" : ""}`}
                  onClick={() => update("workDays", p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.workDays}
              maxLength={100}
              placeholder="직접 입력 (예: 월·수·금 진료, 둘째·넷째 토요일 휴무)"
              onChange={(e) => update("workDays", e.target.value)}
              style={{ marginTop: 10 }}
            />
          </div>

          {/* #4: 근무 시간 input (workHours 컬럼 기존 존재) */}
          <label>근무 시간</label>
          <div>
            <input
              type="text"
              value={form.workHours}
              maxLength={100}
              placeholder="예: 09:00 ~ 18:00 (점심 13:00~14:00)"
              onChange={(e) => update("workHours", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* §6 복리후생 (다중 cb-grid) */}
      <section className="section">
        <h3><span className="secnum">6</span>복리후생</h3>
        <div className="form-grid">
          <label>제공 항목</label>
          <CbGrid keys={BENEFIT_CODES} labels={BENEFIT_LABELS} selected={form.benefits} onToggle={(k) => update("benefits", toggleIn(form.benefits, k) as BenefitCode[])} />
        </div>
      </section>

      {/* §7 기타 근무 조건 */}
      <section className="section">
        <h3><span className="secnum">7</span>기타 근무 조건</h3>
        <div className="form-grid">
          <label>우대 사항</label>
          <div>
            <textarea
              value={form.preferential}
              maxLength={4000}
              placeholder="우대하는 자격, 경력, 성향 등을 자유롭게 작성해 주세요."
              onChange={(e) => update("preferential", e.target.value)}
            />
          </div>

          <label>자격 요건</label>
          <div>
            <textarea
              value={form.qualifications}
              maxLength={4000}
              placeholder="필수 자격, 경력 요건을 작성해 주세요."
              onChange={(e) => update("qualifications", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* §8 상세 내용 (시안 WYSIWYG 에디터) + 병원 소개 영상 */}
      <section className="section">
        <h3><span className="secnum">8</span>상세 내용</h3>
        <div className="form-grid">
          <label>세부 내용</label>
          <div>
            <RichEditor value={form.jobDuties} onChange={(html) => update("jobDuties", html)} />
            <div className="help">굵게·기울임·밑줄·목록·링크 서식 지원. 공고 상세에 본문으로 노출됩니다.</div>
          </div>

          <label>병원 소개 영상</label>
          <div>
            <input
              type="url"
              value={form.videoUrl}
              maxLength={500}
              placeholder="유튜브 URL (예: https://youtu.be/abc123)"
              onChange={(e) => update("videoUrl", e.target.value)}
            />
            <div className="help">YouTube 링크를 입력하면 상세 페이지에서 영상이 임베드됩니다.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <h3><span className="secnum">9</span>접수 방법</h3>
        <div className="form-grid">
          {/* 지역/주소는 §1 회사주소로 이동(시안 일치). */}
          <label>모집 기간<span className="req">*</span></label>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="date"
                value={form.recruitStartAt}
                disabled={form.alwaysHiring}
                onChange={(e) => update("recruitStartAt", e.target.value)}
                style={{ width: 180 }}
              />
              <span aria-hidden>~</span>
              <input
                type="date"
                value={form.recruitEndAt}
                disabled={form.alwaysHiring}
                min={form.recruitStartAt || undefined}
                onChange={(e) => update("recruitEndAt", e.target.value)}
                style={{ width: 180 }}
              />
              <label className="cb" style={{ alignSelf: "flex-start", padding: "11px 14px" }}>
                <input
                  type="checkbox"
                  checked={form.alwaysHiring}
                  onChange={(e) => update("alwaysHiring", e.target.checked)}
                />
                상시 모집 (마감일 미정)
              </label>
            </div>
            <div className="help">
              {form.alwaysHiring
                ? "상시 모집이면 마감일 없이 무기한 노출됩니다."
                : "마감일을 지정하면 공개 시 그 날짜로 마감됩니다. 미입력 시 공개일 +30일로 설정됩니다."}
            </div>
          </div>

          <label>접수 방법<span className="req">*</span></label>
          <CbGrid keys={APPLY_METHODS} labels={APPLY_METHOD_LABELS} selected={form.applyMethod} onToggle={(k) => toggleApply(k as ApplyMethod)} />

          <label>제출서류</label>
          <CbGrid keys={SUBMIT_DOCS} labels={SUBMIT_DOC_LABELS} selected={form.submitDocs} onToggle={(k) => update("submitDocs", toggleIn(form.submitDocs, k))} />

          {form.applyMethod.includes("email") && (
            <>
              <label>접수 이메일</label>
              <div>
                <input
                  type="email"
                  value={form.applyEmail}
                  maxLength={190}
                  placeholder="recruit@example.com"
                  onChange={(e) => update("applyEmail", e.target.value)}
                />
              </div>
            </>
          )}

          {form.applyMethod.includes("phone") && (
            <>
              <label>접수 전화번호</label>
              <div>
                <input
                  type="tel"
                  value={form.applyPhone}
                  maxLength={20}
                  placeholder="010-1234-5678"
                  onChange={(e) => update("applyPhone", e.target.value)}
                />
              </div>
            </>
          )}

          {form.applyMethod.includes("etc") && (
            <>
              <label>기타 접수 방법</label>
              <div>
                <input
                  type="text"
                  value={form.applyMethodEtc}
                  maxLength={200}
                  placeholder="예: 방문 접수, 홈페이지 지원폼, 워크넷 등"
                  onChange={(e) => update("applyMethodEtc", e.target.value)}
                />
                <div className="help">‘기타’ 접수 방법을 자유롭게 입력하세요.</div>
              </div>
            </>
          )}

          <label>전형방법</label>
          <div>
            <textarea
              value={form.selectionProcess}
              maxLength={4000}
              placeholder="예: 서류 전형 → 1차 면접(원장) → 최종 합격 통보. 입사일 협의 가능."
              onChange={(e) => update("selectionProcess", e.target.value)}
            />
            <div className="help">접수방법 카드 하단의 “전형방법” 본문으로 노출됩니다.</div>
          </div>
        </div>
      </section>

      {/* 시안 .form-foot — 하단 sticky 카드 (p2-jobform-publ5 #4) */}
      <div className="form-foot">
        <div className="meta">마지막 임시저장 <b>{lastSavedText}</b></div>
        <div className="btns">
          <button type="button" className={`btn ${mode === "edit" ? "dark" : "line"}`} disabled={submitting} onClick={() => submit(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <path d="M17 21v-8H7v8M7 3v5h8" />
            </svg>
            {mode === "create" ? "임시 저장" : "수정 저장"}
          </button>
          {/* msg-g1-jobform 항목2: edit 모드는 "수정 저장" 1버튼만 — "수정 후 공개" 제거(draft 공개는 draft 수정→저장으로 충분). create만 등록하기 노출. */}
          {mode === "create" && (
            <button type="button" className="btn dark" disabled={submitting} onClick={() => submit(true)}>
              등록하기
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
