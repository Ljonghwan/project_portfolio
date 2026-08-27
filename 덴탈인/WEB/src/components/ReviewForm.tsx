"use client";

// P1-reviews FIX(Q5/Q6/Q8/Q9/Q12): 4-axis rename + staff/doctor + career/salary + 등록확인 모달.
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  REVIEW_JOB_TYPE_OPTIONS,
  REVIEW_CAREER_TYPES,
  REVIEW_CAREER_TYPE_LABELS,
  REVIEW_SALARY_TYPES,
  REVIEW_SALARY_TYPE_LABELS,
  RATING_AXES,
  type RatingAxisKey,
  type Review,
  type ReviewFormInput,
  type ReviewCareerType,
  type ReviewSalaryType,
  type ReviewJobType,
} from "@/lib/reviews";
import {
  composeRegion,
  parseRegion,
  useSidoOptions,
  useSigunguList,
} from "@/stores/regionStore";
import RatingInput from "./RatingInput";
import ConfirmModal from "./ConfirmModal";

type Props = {
  mode: "create" | "edit";
  initial?: Partial<Review> | null;
  reviewId?: number;
};

// 서버 schema title VARCHAR(80) NOT NULL — 퍼블 폼에 title 입력이 없어 본문 첫 80자에서 자동 생성
function deriveTitle(content: string): string {
  const flat = content.replace(/\s+/g, " ").trim();
  if (flat.length <= 80) return flat;
  return flat.slice(0, 80);
}

export default function ReviewForm({ mode, initial, reviewId }: Props) {
  const router = useRouter();

  const initialRegion = parseRegion(initial?.region ?? "");
  const [sido, setSido] = useState<string>(initialRegion.sido);
  const [sigungu, setSigungu] = useState<string>(initialRegion.sigungu);

  const [form, setForm] = useState<ReviewFormInput>({
    hospitalName: initial?.hospitalName ?? "",
    region: initial?.region ?? "",
    jobType: (initial?.jobType as ReviewJobType) ?? "hygienist",
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    ratingSalary: initial?.ratingSalary ?? 0,
    ratingAtmosphere: initial?.ratingAtmosphere ?? 0,
    ratingWorkload: initial?.ratingWorkload ?? 0,
    ratingWelfare: initial?.ratingWelfare ?? 0,
    staffCount: initial?.staffCount ?? null,
    doctorCount: initial?.doctorCount ?? null,
    careerType: (initial?.careerType as ReviewCareerType) ?? null,
    salaryType: (initial?.salaryType as ReviewSalaryType) ?? null,
  });
  const [submitting, setSubmitting] = useState(false);
  // FULLQA #1 CRITICAL-1: React state 비동기 배칭으로 인한 3회 연타 중복 생성 차단용 동기 락.
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  // P1-reviews FIX(Q12.A): 등록확인 모달 (생성/수정 공통).
  const [confirmOpen, setConfirmOpen] = useState(false);

  const update = <K extends keyof ReviewFormInput>(k: K, v: ReviewFormInput[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const sidoOptions = useSidoOptions();
  const sigunguOptions = useSigunguList(sido);

  const handleNumberInput = (
    raw: string,
    key: "staffCount" | "doctorCount",
    max: number,
  ) => {
    if (raw === "") {
      update(key, null);
      return;
    }
    const digits = raw.replace(/[^0-9]/g, "");
    if (!digits) {
      update(key, null);
      return;
    }
    const num = Number.parseInt(digits, 10);
    if (Number.isNaN(num)) return;
    update(key, Math.min(num, max));
  };

  const validate = (): string | null => {
    if (!form.hospitalName.trim()) return "병원명을 입력해 주세요.";
    if (form.hospitalName.trim().length > 80) return "병원명은 80자 이내로 입력해 주세요.";
    if (!sido) return "시도를 선택해 주세요.";
    if (sigunguOptions.length > 0 && !sigungu) return "시군구를 선택해 주세요.";
    // 2026-07-09 항목2: 직원수/원장수는 선택 — 빈값 허용(null 전송). 입력 시에만 범위 검증.
    if (form.staffCount != null && (form.staffCount < 0 || form.staffCount > 999)) return "직원수는 0~999 사이로 입력해 주세요.";
    if (form.doctorCount != null && (form.doctorCount < 0 || form.doctorCount > 99)) return "원장수는 0~99 사이로 입력해 주세요.";
    if (!form.jobType) return "나의 업무를 선택해 주세요.";
    if (!form.careerType) return "근무년차를 선택해 주세요.";
    if (!form.salaryType) return "급여 형태를 선택해 주세요.";
    for (const ax of RATING_AXES) {
      const v = form[ax.key as RatingAxisKey] as number;
      if (!v || v < 1 || v > 5) return `${ax.label} 별점을 선택해 주세요.`;
    }
    const content = form.content.trim();
    if (!content || content.length < 10) return "본문은 10자 이상 입력해 주세요.";
    if (content.length > 4000) return "본문은 4000자 이내로 입력해 주세요.";
    return null;
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setConfirmOpen(true);
  };

  const performSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    const region = composeRegion(sido, sigungu);
    const content = form.content.trim();
    const title = deriveTitle(content);

    const payload: ReviewFormInput = {
      hospitalName: form.hospitalName.trim(),
      region,
      jobType: form.jobType,
      title,
      content,
      ratingSalary: form.ratingSalary,
      ratingAtmosphere: form.ratingAtmosphere,
      ratingWorkload: form.ratingWorkload,
      ratingWelfare: form.ratingWelfare,
      staffCount: form.staffCount,
      doctorCount: form.doctorCount,
      careerType: form.careerType,
      salaryType: form.salaryType,
    };

    setSubmitting(true);
    const res =
      mode === "create"
        ? await api.post<Review>("/api/reviews", payload, true)
        : await api.patch<Review>(`/api/reviews/${reviewId}`, payload, true);
    setSubmitting(false);
    if (!res.success || !res.data) {
      submittingRef.current = false;
      setConfirmOpen(false);
      setError(res.message || "저장에 실패했습니다.");
      return;
    }
    setConfirmOpen(false);
    // P1-reviews FIX 사이클 #4 (BUG-C1): create → /reviews 목록으로, edit → 상세로.
    if (mode === "create") {
      router.push("/reviews");
    } else {
      router.push(`/reviews/${res.data.id}`);
    }
  };

  return (
    <>
      <form className="rv-form" onSubmit={handleSubmitClick}>
        <div className="anon-note">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          병원후기는 익명으로 작성되어 회원님의 정보가 노출되지 않습니다.
        </div>

        {/* 병원정보 */}
        <div className="rv-fset">
          <h3>병원정보</h3>

          <div className="rv-row">
            <label>
              병원명<span className="req">*</span>
            </label>
            <div className="ctrl">
              <input
                className="rv-input"
                type="text"
                maxLength={80}
                value={form.hospitalName}
                onChange={(e) => update("hospitalName", e.target.value)}
                placeholder="병원명을 입력하세요."
              />
            </div>
          </div>

          <div className="rv-row">
            <label>
              병원 위치<span className="req">*</span>
            </label>
            <div className="ctrl">
              <div className="ctrl-grid-2">
                <select
                  className="rv-select"
                  value={sido}
                  onChange={(e) => {
                    setSido(e.target.value);
                    setSigungu("");
                  }}
                >
                  <option value="">시도 선택</option>
                  {sidoOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <select
                  className="rv-select"
                  value={sigungu}
                  onChange={(e) => setSigungu(e.target.value)}
                  disabled={!sido}
                >
                  <option value="">시군구 선택</option>
                  {sigunguOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rv-row">
            <label>
              직원수 · 원장수
            </label>
            <div className="ctrl">
              <div className="ctrl-grid-2">
                <input
                  className="rv-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="직원수 (숫자입력)"
                  value={form.staffCount == null ? "" : String(form.staffCount)}
                  onChange={(e) => handleNumberInput(e.target.value, "staffCount", 999)}
                />
                <input
                  className="rv-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="원장수 (숫자입력)"
                  value={form.doctorCount == null ? "" : String(form.doctorCount)}
                  onChange={(e) => handleNumberInput(e.target.value, "doctorCount", 99)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 나의 근무 조건 */}
        <div className="rv-fset">
          <h3>나의 근무 조건</h3>

          <div className="rv-row">
            <label>
              나의 업무<span className="req">*</span>
            </label>
            <div className="ctrl">
              <select
                className="rv-select"
                value={form.jobType}
                onChange={(e) => update("jobType", e.target.value as ReviewJobType)}
              >
                {REVIEW_JOB_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rv-row">
            <label>
              근무년차<span className="req">*</span>
            </label>
            <div className="ctrl">
              <select
                className="rv-select"
                value={form.careerType ?? ""}
                onChange={(e) =>
                  update(
                    "careerType",
                    (e.target.value || null) as ReviewCareerType | null,
                  )
                }
              >
                <option value="">선택</option>
                {REVIEW_CAREER_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {REVIEW_CAREER_TYPE_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rv-row">
            <label>
              급여<span className="req">*</span>
            </label>
            <div className="ctrl">
              <select
                className="rv-select"
                value={form.salaryType ?? ""}
                onChange={(e) =>
                  update(
                    "salaryType",
                    (e.target.value || null) as ReviewSalaryType | null,
                  )
                }
              >
                <option value="">선택</option>
                {REVIEW_SALARY_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {REVIEW_SALARY_TYPE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 병원 평가하기 */}
        <div className="rv-fset">
          <h3>병원 평가하기</h3>

          <div className="rv-stars-grid">
            {RATING_AXES.map((ax) => (
              <div className="row" key={ax.key}>
                <span className="k">
                  {ax.label}<span className="req">*</span>
                </span>
                <RatingInput
                  value={form[ax.key as RatingAxisKey] as number}
                  onChange={(v) => update(ax.key as RatingAxisKey, v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 본문 */}
        <div className="rv-fset">
          <h3>병원 후기</h3>
          <div className="rv-row">
            <label>
              내용<span className="req">*</span>
            </label>
            <div className="ctrl">
              <textarea
                className="rv-textarea"
                maxLength={4000}
                value={form.content}
                onChange={(e) => update("content", e.target.value)}
                placeholder={"병원의 장점과 단점 등을 알려주세요.\n경험을 사실에 기초해 써주세요.\n비방/욕설/명예훼손성 게시글 등록시 삭제조치 될 수 있습니다."}
                rows={8}
              />
              <div className="help">{form.content.length} / 4000</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rv-row">
            <div />
            <div
              className="err"
              style={{ color: "#E11D48", fontSize: 13, fontWeight: 600 }}
            >
              {error}
            </div>
          </div>
        )}

        <div className="rv-actions">
          <button type="button" className="rv-cancel" onClick={() => router.back()}>
            취소
          </button>
          <button type="submit" className="rv-submit" disabled={submitting}>
            {submitting ? "저장 중…" : mode === "create" ? "등록하기" : "수정 완료"}
          </button>
        </div>
      </form>

      <ConfirmModal
        open={confirmOpen}
        title={mode === "create" ? "글을 등록하시겠습니까?" : "수정 내용을 저장하시겠습니까?"}
        description={
          mode === "create"
            ? "등록 후 목록으로 이동합니다."
            : "저장 후 게시글 상세로 이동합니다."
        }
        cancelLabel="아니오"
        confirmLabel="확인"
        onCancel={() => {
          if (!submitting) setConfirmOpen(false);
        }}
        onConfirm={performSubmit}
        busy={submitting}
      />
    </>
  );
}
