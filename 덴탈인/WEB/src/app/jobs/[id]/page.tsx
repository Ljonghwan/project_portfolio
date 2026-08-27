"use client";

import { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useMinimumLoading } from "@/lib/useMinimumLoading";
import SiteFooter from "@/components/SiteFooter";
import { api } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import ReportModal from "@/components/ReportModal";
import Lightbox from "@/components/Lightbox";
import { JOB_REPORT_REASON_OPTIONS, reportJob } from "@/lib/reports";
import { formatPhone } from "@/lib/format";
import JobLocationMap from "@/components/JobLocationMap";
import { kakaoMapLink } from "@/lib/kakaoMap";
import {
  JobPost,
  WORK_TYPE_LABELS,
  CAREER_TYPE_LABELS,
  APPLY_METHOD_LABELS,
  JOB_DUTY_TYPE_LABELS,
  REQUIRED_CERT_TYPE_LABELS,
  JOB_POSITION_LEVEL_LABELS,
  JOB_EDUCATION_LABELS,
  BENEFIT_LABELS,
  WORK_ENV_TAG_LABELS,
  SUBMIT_DOC_LABELS,
  formatSalary,
  notSupported,
  extractYouTubeId,
} from "@/lib/jobs";

type SecKey = "clinic" | "job" | "env" | "apply" | "loc";

const SECTIONS: { key: SecKey; id: string; label: string }[] = [
  { key: "clinic", id: "sec-clinic", label: "병원소개" },
  { key: "job", id: "sec-job", label: "상세채용정보" },
  { key: "env", id: "sec-env", label: "근무환경" },
  { key: "apply", id: "sec-apply", label: "접수방법" },
  { key: "loc", id: "sec-loc", label: "근무위치" },
];

function formatYmd(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

// "YYYY.MM.DD(요일)" 포맷 — 퍼블 sec-apply 모집기간 패턴
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
function formatYmdWithDow(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}(${DOW[d.getDay()]})`;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, loading: meLoading } = useMe(false);
  const [job, setJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const showLoading = useMinimumLoading(loading);
  const [notFound, setNotFound] = useState(false);
  const [activeSec, setActiveSec] = useState<SecKey>("clinic");
  const [reportOpen, setReportOpen] = useState(false); // F-C item11: 채용 신고 모달
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 }); // 병원 사진 확대보기
  const wrapRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (meLoading) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await api.get<JobPost>(`/api/jobs/${id}`, !!me);
      if (!alive) return;
      if (res.success && res.data) {
        setJob(res.data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id, me, meLoading]);

  const toggleBookmark = async () => {
    if (!job) return;
    if (!me) {
      if (confirm("로그인이 필요한 기능입니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      return;
    }
    if (me.userType === "corp") {
      alert("기업회원은 채용 스크랩을 사용할 수 없습니다.");
      return;
    }
    const next = !job.bookmarked;
    setJob({ ...job, bookmarked: next });
    const res = next
      ? await api.post(`/api/jobs/${job.id}/bookmark`, undefined, true)
      : await api.del(`/api/jobs/${job.id}/bookmark`, true);
    if (!res.success) {
      alert(res.message || "스크랩 처리에 실패했습니다.");
      setJob({ ...job, bookmarked: !next });
    }
  };

  const isOwner =
    !meLoading &&
    !!me &&
    me.userType === "corp" &&
    !!job &&
    me.id === job.corpUserId;

  const isExpired = !!job?.expiredAt && new Date(job.expiredAt).getTime() < Date.now();

  const handleClose = async () => {
    if (!job) return;
    if (!confirm("정말 이 공고를 마감하시겠습니까?")) return;
    const res = await api.post<JobPost>(`/api/jobs/${job.id}/close`, undefined, true);
    if (res.success && res.data) {
      setJob(res.data);
      alert("공고를 마감했습니다.");
    } else {
      alert(res.message || "마감에 실패했습니다.");
    }
  };

  const scrollToSection = (key: SecKey) => {
    setActiveSec(key);
    if (typeof document === "undefined") return;
    const el = document.getElementById(`sec-${key}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  if (showLoading) {
    return (
      <>
        <SiteHeader />
        <main className="wrap"><div className="noti-state load-state"><LoadingIndicator fullPage={false} /></div></main>
        <SiteFooter />
      </>
    );
  }

  if (notFound || !job) {
    return (
      <>
        <SiteHeader />
        <main className="wrap">
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <h2>공고를 찾을 수 없습니다.</h2>
            <p style={{ color: "var(--ink-3)", marginTop: 8 }}>이미 마감되었거나 삭제된 공고일 수 있습니다.</p>
            <Link href="/jobs" className="btn-line" style={{ marginTop: 18, display: "inline-block" }}>채용 목록으로</Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const youtubeId = extractYouTubeId(job.videoUrl);
  const hasVideo = !!(job.videoUrl && job.videoUrl.trim().length > 0);
  // p2-7: requiredCerts는 requiredCertType 키 배열 → 라벨 매핑(구 자유텍스트는 키 미존재 시 원문 노출).
  const certText = job.requiredCerts?.length
    ? job.requiredCerts.map((c) => REQUIRED_CERT_TYPE_LABELS[c] ?? c).join(", ")
    : "무관";
  const dutyText = (job.jobTypes ?? []).map((d) => JOB_DUTY_TYPE_LABELS[d] ?? d).join(", ");
  const tagText = `${dutyText ? dutyText + " · " : ""}${WORK_TYPE_LABELS[job.workType]}`;
  // BUG-2: address(도로명)에 이미 시도·시군구 포함 → region 중복 제거. 도로명+상세, 없으면 region fallback.
  const locText = [job.address, job.addressDetail].filter(Boolean).join(" ") || job.region || "위치 미정";
  const hasLocation = job.latitude != null && job.longitude != null;
  // 좌표 또는 주소가 있으면 카카오 지도 인라인 렌더(주소만 있으면 지오코딩 fallback). 둘 다 없으면 placeholder.
  const canMap = hasLocation || !!job.address;

  // 퍼블 sec-clinic 5-row 매핑 — corpProfile 우선, 없으면 폼 입력 job 필드 fallback (p2-final BUG fix)
  const cp = job.corpProfile;
  const businessName = cp?.businessName || job.businessName || job.hospitalName || "-";
  const representative = cp?.representative || job.representative || "-";
  // 구성원수: 폼 입력 staffCount/doctorCount로 구성(직원 N명 · 원장 M명), 없으면 corpProfile.employeeText
  const staffParts = [
    job.staffCount != null ? `직원 ${job.staffCount}명` : null,
    job.doctorCount != null ? `원장 ${job.doctorCount}명` : null,
  ].filter(Boolean);
  const employeeText = staffParts.length > 0 ? staffParts.join(" · ") : cp?.employeeText || "-";
  const homepage = cp?.homepage || job.homepage || null;

  // msg-g1-jobform 항목4: 실제 등록된 병원 사진만 노출(없으면 갤러리 섹션 미노출). 구 "사진 N" placeholder 제거.
  const clinicImages: string[] = (job.hospitalImages ?? []).filter((src): src is string => !!src).slice(0, 6);
  // #5: 제출서류 라벨 — submitDocs 전체(없으면 기본 이력서/자기소개서)
  const submitDocText = (job.submitDocs && job.submitDocs.length > 0)
    ? job.submitDocs.map((d) => SUBMIT_DOC_LABELS[d] || d).join(", ")
    : "이력서, 자기소개서";

  // 퍼블 sec-apply 모집기간 — 입력 시작일~마감일(없으면 등록일~만료일 fallback). 상시모집이면 "상시".
  const recruitFrom = formatYmdWithDow(job.recruitStartAt ?? job.publishedAt ?? job.createdAt);
  const recruitTo = job.alwaysHiring
    ? "상시"
    : job.recruitEndAt
      ? formatYmdWithDow(job.recruitEndAt)
      : job.expiredAt
        ? formatYmdWithDow(job.expiredAt)
        : "상시";

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        {isOwner && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end", alignItems: "center" }}>
            {/* #7: 수정(Link) ↔ 마감(button) 동일 높이·정렬 (inline-flex 중앙정렬) */}
            <Link href={`/mypage/jobs/${job.id}/edit`} className="btn-line" style={{ display: "inline-flex", alignItems: "center" }}>수정</Link>
            {job.status === "active" && (
              <button type="button" className="btn-line" style={{ display: "inline-flex", alignItems: "center" }} onClick={handleClose}>마감</button>
            )}
          </div>
        )}

        <article className="detail-wrap" ref={wrapRef} style={{ marginTop: 12 }}>
          {/* 히어로 */}
          <div className="detail-hero">
            <div>
              <span className="h-tag">{tagText}</span>
              {job.status !== "active" && (
                <span className="h-tag" style={{ background: "#FEE2E2", color: "#991B1B", marginLeft: 6 }}>
                  {job.status === "draft" ? "임시저장" : "마감"}
                </span>
              )}
              <h1>{job.title}</h1>
              <div className="meta">
                <span className="clinic-name">{job.hospitalName}</span>
                <span className="sep" />
                <span>{job.region || "지역 미정"}</span>
                <span className="sep" />
                <span>등록 {formatYmd(job.publishedAt ?? job.createdAt)}</span>
                <span className="sep" />
                <span>조회 {job.viewCount.toLocaleString()}</span>
              </div>
            </div>
            <div className="actions">
              <button
                type="button"
                className={`icon-btn ${job.bookmarked ? "on" : ""}`}
                aria-label={job.bookmarked ? "스크랩 해제" : "스크랩"}
                aria-pressed={!!job.bookmarked}
                onClick={toggleBookmark}
                title="스크랩"
              >
                <svg viewBox="0 0 24 24" fill={job.bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                  <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z" />
                </svg>
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="공유"
                title="공유"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    alert("링크를 복사했습니다.");
                  } else {
                    notSupported("공유 기능은 추후 지원 예정입니다.");
                  }
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
                </svg>
              </button>
              {/* F-C item11: 신고 — 비owner만 노출. 실 ReportModal 연결(JobReport). */}
              {!isOwner && (
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="신고"
                  title="신고"
                  onClick={() => {
                    if (!me) {
                      if (confirm("로그인이 필요한 기능입니다. 로그인 페이지로 이동할까요?")) router.push("/login");
                      return;
                    }
                    setReportOpen(true);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 21V4h13l-2 4 2 4H4" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* sticky 5-탭 */}
          <div className="detail-tabs" role="tablist">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={activeSec === s.key}
                className={activeSec === s.key ? "on" : ""}
                onClick={() => scrollToSection(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* 1. 병원 소개 — 퍼블 5-row info-grid + 6 photo gallery + bio */}
          <div className="detail-section" id="sec-clinic">
            <h3><span className="bar" />병원 소개</h3>
            <div className="info-grid">
              <div className="row">
                <div className="k">사업자명</div>
                <div className="v">{businessName}</div>
              </div>
              <div className="row">
                <div className="k">대표자명</div>
                <div className="v">{representative}</div>
              </div>
              <div className="row">
                <div className="k">사업장 구분</div>
                <div className="v">치과 의원</div>
              </div>
              <div className="row">
                <div className="k">총 구성원수</div>
                <div className="v">{employeeText}</div>
              </div>
              <div className="row" style={{ gridColumn: "1 / -1", gridTemplateColumns: "140px 1fr" }}>
                <div className="k">홈페이지</div>
                <div className="v">
                  {homepage ? (
                    <a href={homepage} target="_blank" rel="noopener noreferrer">{homepage}</a>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            </div>
            {job.hospitalIntro ? (
              <p className="clinic-bio">{job.hospitalIntro}</p>
            ) : (
              <p className="clinic-bio" style={{ color: "var(--ink-3)" }}>병원 소개가 등록되지 않았습니다.</p>
            )}

            {/* 사진 갤러리 — msg-g1-jobform 항목4: 실 이미지가 있을 때만 렌더(placeholder 제거) */}
            {clinicImages.length > 0 && (
              <div className="gallery" style={{ marginTop: 18 }} aria-label="병원 사진">
                {clinicImages.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    className="ph"
                    style={{ backgroundImage: `url(${src})`, border: 0, padding: 0, cursor: "pointer" }}
                    onClick={() => setLightbox({ open: true, index: i })}
                    aria-label={`병원 사진 ${i + 1} 확대보기`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 2. 상세 채용 정보 — 퍼블 8 kv + 영상 box + editor-content */}
          <div className="detail-section" id="sec-job">
            <h3><span className="bar" />상세 채용 정보</h3>
            <div className="kv-grid">
              <div className="kv">
                <div className="k">담당업무</div>
                <div className="v">{dutyText || job.dutySummary || job.position || "-"}</div>
              </div>
              <div className="kv">
                <div className="k">필요자격증</div>
                <div className="v">{certText}</div>
              </div>
              <div className="kv">
                <div className="k">근무형태</div>
                <div className="v">{WORK_TYPE_LABELS[job.workType]}</div>
              </div>
              <div className="kv">
                <div className="k">모집인원</div>
                <div className="v">{job.headcount}명</div>
              </div>
              <div className="kv">
                <div className="k">직급</div>
                <div className="v">{job.positionLevel ? (JOB_POSITION_LEVEL_LABELS[job.positionLevel] ?? job.positionLevel) : "-"}</div>
              </div>
              <div className="kv">
                <div className="k">급여</div>
                <div className="v salary">
                  {/* BUG-1: 급여 미입력=salaryNegotiable=true가 보편 → "(협의 가능)" 꼬리표 제거.
                      formatSalary가 이미 "면접 후 결정" 반환(PM #8 "협의 아님"). */}
                  {formatSalary(job)}
                </div>
              </div>
              <div className="kv">
                <div className="k">학력</div>
                <div className="v">{job.education ? (JOB_EDUCATION_LABELS[job.education] ?? job.education) : "학력 무관"}</div>
              </div>
              <div className="kv">
                <div className="k">경력</div>
                <div className="v">
                  {CAREER_TYPE_LABELS[job.careerType]}
                  {job.careerType !== "newcomer" && job.careerType !== "any" && job.careerYearsMin > 0 ? (
                    <small>
                      ({job.careerYearsMin}
                      {job.careerYearsMax && job.careerYearsMax > job.careerYearsMin ? `~${job.careerYearsMax}` : ""}년)
                    </small>
                  ) : null}
                </div>
              </div>
            </div>

            {/* 영상 (videoUrl 있을 때만 렌더 — 퍼블은 placeholder, 우리는 실 임베드/링크) */}
            {hasVideo && (
              <div className={`video-box ${youtubeId ? "has-embed" : ""}`} style={{ marginTop: 18 }} aria-label="병원 소개 영상">
                {youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="병원 소개 영상"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <a
                    href={job.videoUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="play"
                    aria-label="영상 새창에서 보기"
                    style={{ textDecoration: "none" }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* 상세 채용정보 본문 (담당 업무 에디터 콘텐츠) */}
            {/* p2-7 fix5: jobDuties는 서버 sanitizeRichHtml 적용된 HTML → 그대로 렌더 */}
            <div className="editor-content" dangerouslySetInnerHTML={{ __html: job.jobDuties || "" }} />
          </div>

          {/* 3. 근무환경 — 퍼블 3 h3 (근무환경 kv-grid 2 + 복리후생 benefit-list + 기타 editor-content) + 4 photo gallery */}
          <div className="detail-section" id="sec-env">
            <h3><span className="bar" />근무환경</h3>
            <div className="kv-grid">
              <div className="kv">
                <div className="k">근무요일</div>
                <div className="v">{job.workDays || "-"}</div>
              </div>
              <div className="kv">
                <div className="k">근무시간</div>
                <div className="v">{job.workHours || "-"}</div>
              </div>
            </div>

            {/* #2: 근무지 환경(workEnvTags) 표시 */}
            {job.workEnvTags && job.workEnvTags.length > 0 && (
              <div className="benefit-list" style={{ marginTop: 16 }}>
                {job.workEnvTags.map((t) => (
                  <span key={t} className="pill-tag brand">{WORK_ENV_TAG_LABELS[t] || t}</span>
                ))}
              </div>
            )}

            <h3 style={{ marginTop: 24 }}><span className="bar" />복리후생</h3>
            {job.benefits && job.benefits.length > 0 ? (
              <div className="benefit-list">
                {job.benefits.map((b) => (
                  <span key={b} className="benefit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                    {BENEFIT_LABELS[b] || b}
                  </span>
                ))}
              </div>
            ) : (
              <p className="clinic-bio" style={{ color: "var(--ink-3)" }}>등록된 복리후생이 없습니다.</p>
            )}

            <h3 style={{ marginTop: 24 }}><span className="bar" />기타 근무조건</h3>
            {/* #3: 우대 사항 + 자격 요건 표시(+ 기존 기타 근무조건). 사진 갤러리 제거. */}
            {job.preferential && (
              <div style={{ marginBottom: 14 }}>
                <div className="k" style={{ marginBottom: 4 }}>우대 사항</div>
                <div className="editor-content">{job.preferential}</div>
              </div>
            )}
            {job.qualifications && (
              <div style={{ marginBottom: 14 }}>
                <div className="k" style={{ marginBottom: 4 }}>자격 요건</div>
                <div className="editor-content">{job.qualifications}</div>
              </div>
            )}
            {(job.etcWorkConditions || job.workEnvironment) && (
              <div style={{ marginBottom: 4 }}>
                <div className="k" style={{ marginBottom: 4 }}>기타</div>
                <div className="editor-content">{job.etcWorkConditions || job.workEnvironment}</div>
              </div>
            )}
            {!job.preferential && !job.qualifications && !job.etcWorkConditions && !job.workEnvironment && (
              <p className="clinic-bio" style={{ color: "var(--ink-3)" }}>등록된 기타 근무조건이 없습니다.</p>
            )}
          </div>

          {/* 4. 접수방법 — 퍼블 모집기간 + 제출서류 kv-grid + apply-info + 전형방법 editor-content */}
          <div className="detail-section" id="sec-apply">
            <h3><span className="bar" />접수방법</h3>
            <div className="kv-grid" style={{ marginBottom: 18 }}>
              <div className="kv">
                <div className="k">모집기간</div>
                <div className="v">
                  {recruitFrom}
                  {` ~ ${recruitTo}`}
                </div>
              </div>
              <div className="kv">
                <div className="k">제출서류</div>
                <div className="v">{submitDocText}</div>
              </div>
            </div>

            <div className="apply-info">
              {job.applyMethod.map((m) => (
                <div key={m} className="apply-card">
                  <div className="ic">
                    {m === "email" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <path d="m22 6-10 7L2 6" />
                      </svg>
                    ) : m === "phone" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="label">{APPLY_METHOD_LABELS[m]}</div>
                    <div className="val">
                      {/* F-C item10: 이메일→mailto, 전화→tel 링크로 클릭 연결 */}
                      {m === "email" ? (
                        job.applyEmail ? <a href={`mailto:${job.applyEmail}`}>{job.applyEmail}</a> : "이메일 미입력"
                      ) : m === "phone" ? (
                        job.applyPhone ? <a href={`tel:${job.applyPhone.replace(/[^0-9+]/g, "")}`}>{formatPhone(job.applyPhone)}</a> : "전화 미입력"
                      ) : (
                        job.applyMethodEtc || "기타 접수"
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: 24 }}><span className="bar" />전형방법</h3>
            {job.selectionProcess ? (
              <div className="editor-content">{job.selectionProcess}</div>
            ) : (
              <p className="clinic-bio" style={{ color: "var(--ink-3)" }}>등록된 전형방법이 없습니다.</p>
            )}
          </div>

          {/* 5. 근무위치 — 퍼블 kv-grid 2 (근무지 + 인근 지하철역) + map-box + map-link */}
          <div className="detail-section" id="sec-loc">
            <h3><span className="bar" />근무위치</h3>
            <div className="kv-grid" style={{ marginBottom: 14 }}>
              <div className="kv">
                <div className="k">근무지</div>
                <div className="v">{locText}</div>
              </div>
              <div className="kv">
                <div className="k">인근 지하철역</div>
                <div className="v">{job.nearestStation || "-"}</div>
              </div>
            </div>

            {canMap ? (
              <JobLocationMap
                latitude={job.latitude}
                longitude={job.longitude}
                address={job.address}
                hospitalName={job.hospitalName}
                fallbackText={locText}
              />
            ) : (
              <div className="map-box" aria-label="근무지 지도">
                <span>{locText}</span>
              </div>
            )}
            <button
              type="button"
              className="map-link"
              onClick={() => {
                if (canMap) {
                  window.open(kakaoMapLink(job.hospitalName, job.latitude, job.longitude, job.address), "_blank", "noopener,noreferrer");
                } else {
                  notSupported("지도 보기는 주소 등록 후 지원됩니다.");
                }
              }}
            >
              카카오맵에서 열기
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </button>
          </div>

          {/* sticky bottom CTA */}
          <div className="apply-cta">
            <div className="info">
              <div>
                <div className="cta-label">제시 급여</div>
                <div className="pay-big">{formatSalary(job)}</div>
              </div>
              <div>
                <div className="cta-label">마감</div>
                <div className="cta-value">
                  <b>{job.alwaysHiring ? "상시채용" : (job.expiredAt ? formatYmd(job.expiredAt) : "상시")}</b>
                </div>
              </div>
            </div>
            <button
              type="button"
              className={`apply-btn-ghost ${job.bookmarked ? "on" : ""}`}
              aria-pressed={!!job.bookmarked}
              onClick={toggleBookmark}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={job.bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z" />
              </svg>
              {job.bookmarked ? "스크랩됨" : "스크랩"}
            </button>
            {/* F-C item10: 지원 기능 폐기 → 하단 "OOO로 지원" 버튼 제거. 접수는 접수방법 영역의 mailto/tel 링크로. */}
          </div>
        </article>
      </main>
      <SiteFooter />

      {/* F-C item11: 채용공고 신고 모달(JobReport). 비owner + 로그인 사용자만 진입. */}
      {job && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reasonOptions={JOB_REPORT_REASON_OPTIONS}
          onSubmitReport={async (reason, detail) => {
            const r = await reportJob(job.id, reason, detail);
            return {
              success: r.success,
              code: r.code,
              data: r.data ? { alreadyReported: r.data.alreadyReported } : null,
              message: r.message,
            };
          }}
        />
      )}

      <Lightbox
        images={clinicImages}
        index={lightbox.index}
        open={lightbox.open}
        onClose={() => setLightbox((s) => ({ ...s, open: false }))}
      />
    </>
  );
}
