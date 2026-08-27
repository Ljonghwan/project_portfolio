"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  URGENT_CONTENT_MAX,
  URGENT_IMAGE_MAX,
  URGENT_SALARY_TYPES,
  URGENT_SALARY_TYPE_LABELS,
  URGENT_TITLE_MAX,
  type UrgentFormInput,
  type UrgentJobType,
  type UrgentPost,
  type UrgentSalaryType,
  type UrgentWorkType,
} from "@/lib/urgents";
import ImageUploadGrid from "./ImageUploadGrid";
import JobTypeCheckChips from "./JobTypeCheckChips";
import WorkTypeCheckChips from "./WorkTypeCheckChips";
import ConfirmModal from "./ConfirmModal";
import { openDaumPostcode } from "@/lib/postcode";

type Props = {
  mode: "create" | "edit";
  postId?: number;
  initial?: Partial<UrgentFormInput>;
};

export default function UrgentForm({ mode, postId, initial }: Props) {
  const router = useRouter();
  const [hospitalName, setHospitalName] = useState(initial?.hospitalName ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [addressDetail, setAddressDetail] = useState(initial?.addressDetail ?? "");
  const [jobTypes, setJobTypes] = useState<UrgentJobType[]>(initial?.jobTypes ?? []);
  const [workTypes, setWorkTypes] = useState<UrgentWorkType[]>(initial?.workTypes ?? []);
  const [headcount, setHeadcount] = useState(initial?.headcount ?? 1);
  const [salaryType, setSalaryType] = useState<UrgentSalaryType>(initial?.salaryType ?? "monthly");
  // p2-urgent-detail-fix 작업1: salaryText(자유입력) → salaryAmount(숫자). 협의면 빈값.
  const [salaryAmount, setSalaryAmount] = useState<string>(
    initial?.salaryAmount != null ? String(initial.salaryAmount) : ""
  );
  const [workHours, setWorkHours] = useState(initial?.workHours ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function validate(): string | null {
    if (!hospitalName.trim()) return "병원명을 입력하세요.";
    if (!title.trim()) return "제목을 입력하세요.";
    if (title.length > URGENT_TITLE_MAX) return `제목은 ${URGENT_TITLE_MAX}자 이내로 입력하세요.`;
    if (!region.trim()) return "근무지(주소 찾기)를 선택하세요.";
    if (jobTypes.length === 0) return "담당 업무를 1개 이상 선택하세요.";
    if (workTypes.length === 0) return "근무 형태를 1개 이상 선택하세요.";
    if (!Number.isFinite(headcount) || headcount < 1) return "모집 인원은 1명 이상이어야 합니다.";
    // 연락처는 선택 항목(시안 — 라벨 `*` 없음)
    if (!content.trim()) return "내용을 입력하세요.";
    if (content.length > URGENT_CONTENT_MAX) return `내용은 ${URGENT_CONTENT_MAX}자 이내로 입력하세요.`;
    if (images.length > URGENT_IMAGE_MAX) return `이미지는 최대 ${URGENT_IMAGE_MAX}장까지 업로드할 수 있습니다.`;
    return null;
  }

  // 1단계: 검증 후 ConfirmModal 오픈 (native confirm 금지 — 수다방/후기 패턴)
  function handleSubmitClick(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setConfirmOpen(true);
  }

  // 2단계: 실제 등록/수정
  async function doSubmit() {
    if (submitting) return;
    setSubmitting(true);
    const body = {
      hospitalName: hospitalName.trim(),
      title: title.trim(),
      region: region.trim(),
      address: address?.trim() ? address.trim() : null,
      addressDetail: addressDetail?.trim() ? addressDetail.trim() : null,
      jobTypes,
      workTypes,
      headcount: Number(headcount),
      salaryType,
      // 협의는 금액 null. 그 외 숫자 입력값(빈값이면 null).
      salaryAmount: salaryType === "negotiable" || salaryAmount.trim() === "" ? null : Number(salaryAmount),
      workHours: workHours?.trim() ? workHours.trim() : null,
      contactPhone: contactPhone.trim(),
      content: content.trim(),
      images,
    };
    if (mode === "create") {
      const res = await api.post<UrgentPost>("/api/urgents", body, true);
      setSubmitting(false);
      if (!res.success || !res.data) {
        setConfirmOpen(false);
        if (res.code === "BUSINESS_LICENSE_REQUIRED") {
          alert(res.message || "사업자등록증을 먼저 등록해 주세요.");
          router.push("/mypage/extra");
          return;
        }
        setError(res.message || "공고 등록에 실패했습니다.");
        return;
      }
      // 시안: 등록 확인 후 급구 게시판 목록으로 이동 (수다방/후기 정합)
      setConfirmOpen(false);
      router.push("/urgents");
      router.refresh();
    } else if (mode === "edit" && postId) {
      const res = await api.patch<UrgentPost>(`/api/urgents/${postId}`, body, true);
      setSubmitting(false);
      if (!res.success || !res.data) {
        setConfirmOpen(false);
        setError(res.message || "공고 수정에 실패했습니다.");
        return;
      }
      setConfirmOpen(false);
      router.push(`/urgents/${postId}`);
      router.refresh();
    }
  }

  return (
    <>
    <form className="form-card" onSubmit={handleSubmitClick}>
      <h3>{mode === "create" ? "급구 등록" : "급구 수정"}</h3>
      <p className="form-sub">병원명·근무지·담당업무·근무형태는 필수입니다. 등록 즉시 급구 게시판 상단에 노출돼요.</p>

      <div className="form-grid-2">
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="lab">
            <span>병원명 <span className="req">*</span></span>
          </div>
          <input
            className="input"
            placeholder="병원명을 입력하세요."
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            maxLength={100}
            suppressHydrationWarning
          />
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="lab">
            <span>제목 <span className="req">*</span></span>
            <span className="ct">{title.length} / {URGENT_TITLE_MAX}</span>
          </div>
          <input
            className="input"
            placeholder="제목을 입력하세요."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={URGENT_TITLE_MAX}
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* 시안 1:1: 시/도 select 제거 — 주소 찾기(다음 우편번호)가 sido/sigungu→region 자동 세팅(채용폼 패턴). 주소 input은 readonly. */}
      <div className="form-row" style={{ marginTop: 18 }}>
        <div className="lab">
          <span>근무지 <span className="req">*</span></span>
        </div>
        <div className="row-grid-2">
          <input
            className="input"
            placeholder="주소 찾기로 입력하세요"
            value={address ?? ""}
            readOnly
            suppressHydrationWarning
          />
          <button
            type="button"
            className="input find"
            onClick={async () => {
              const r = await openDaumPostcode();
              if (!r) return;
              if (r.region) setRegion(r.region);
              setAddress(r.address);
            }}
          >
            주소 찾기
          </button>
        </div>
        <input
          className="input"
          placeholder="상세주소"
          style={{ marginTop: 8 }}
          value={addressDetail ?? ""}
          onChange={(e) => setAddressDetail(e.target.value)}
          maxLength={200}
          suppressHydrationWarning
        />
      </div>

      <div className="form-row">
        <div className="lab">
          <span>담당 업무 <span className="req">*</span></span>
          <span style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 500 }}>중복 선택 가능</span>
        </div>
        <JobTypeCheckChips values={jobTypes} onChange={setJobTypes} />
      </div>

      <div className="form-row">
        <div className="lab">
          <span>근무 형태 <span className="req">*</span></span>
          <span style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 500 }}>중복 선택 가능</span>
        </div>
        <WorkTypeCheckChips values={workTypes} onChange={setWorkTypes} />
      </div>

      {/* 모집 인원 — 시안 폼엔 없으나 결정4로 유지(상세 spec에 노출) */}
      <div className="form-row">
        <div className="lab">
          <span>모집 인원</span>
        </div>
        <input
          className="input"
          type="number"
          min={1}
          max={99}
          value={headcount}
          onChange={(e) => setHeadcount(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
          style={{ maxWidth: 160 }}
          suppressHydrationWarning
        />
      </div>

      {/* 시안 1:1: 급여(select+input) + 근무일/시간을 한 grid-2로 묶음 */}
      <div className="form-grid-2">
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="lab">
            <span>급여 (시급/일급/월급)</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8 }}>
            <select
              className="select"
              value={salaryType}
              onChange={(e) => setSalaryType(e.target.value as UrgentSalaryType)}
              suppressHydrationWarning
            >
              {URGENT_SALARY_TYPES.map((s) => (
                <option key={s} value={s}>{URGENT_SALARY_TYPE_LABELS[s]}</option>
              ))}
            </select>
            {/* 협의 선택 시 금액칸 비활성. 월급=만원 / 일급·시급=원 단위 placeholder 안내. */}
            <input
              className="input"
              type="number"
              min={0}
              max={99999999}
              placeholder={
                salaryType === "negotiable"
                  ? "협의"
                  : salaryType === "monthly"
                    ? "예: 300 (만원)"
                    : "예: 150000 (원)"
              }
              value={salaryType === "negotiable" ? "" : salaryAmount}
              onChange={(e) => setSalaryAmount(e.target.value)}
              disabled={salaryType === "negotiable"}
              suppressHydrationWarning
            />
          </div>
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="lab">
            <span>근무일 / 시간</span>
          </div>
          <input
            className="input"
            placeholder="예: 주 5일 09:30~18:30"
            value={workHours ?? ""}
            onChange={(e) => setWorkHours(e.target.value)}
            maxLength={100}
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* 연락처 — 시안: 선택(라벨 * 없음) */}
      <div className="form-row" style={{ marginTop: 18 }}>
        <div className="lab">
          <span>연락처</span>
        </div>
        <input
          className="input"
          placeholder="예: 010-1234-5678"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          maxLength={20}
          suppressHydrationWarning
        />
      </div>

      <div className="form-row">
        <div className="lab">
          <span>내용 <span className="req">*</span></span>
          <span className="ct">{content.length} / {URGENT_CONTENT_MAX}</span>
        </div>
        <textarea
          className="textarea"
          placeholder="내용을 입력하세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={URGENT_CONTENT_MAX}
          suppressHydrationWarning
        />
      </div>

      <div className="form-row">
        <div className="lab">
          <span>이미지 <span style={{ fontWeight: 500, color: "var(--ink-4)", marginLeft: 2 }}>(선택사항 · 최대 {URGENT_IMAGE_MAX}장)</span></span>
          <span className="ct">{images.length} / {URGENT_IMAGE_MAX}</span>
        </div>
        <ImageUploadGrid value={images} onChange={setImages} max={URGENT_IMAGE_MAX} />
      </div>

      {error && (
        <div className="help" style={{ color: "#E11D48", marginTop: 12 }}>
          {error}
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn cancel" onClick={() => router.back()} disabled={submitting}>
          취소
        </button>
        <button type="submit" className="btn submit" disabled={submitting}>
          {submitting ? "저장 중…" : mode === "create" ? "등록하기" : "수정 저장"}
        </button>
      </div>
    </form>

      <ConfirmModal
        open={confirmOpen}
        title={mode === "create" ? "글을 등록하시겠습니까?" : "수정사항을 저장하시겠습니까?"}
        description={
          mode === "create"
            ? "마감일은 등록일로부터 14일 후로 설정됩니다. 확인 시 급구 게시판 목록으로 이동합니다."
            : "저장 후 급구 공고 상세로 이동합니다."
        }
        cancelLabel="아니오"
        confirmLabel="확인"
        onCancel={() => {
          if (!submitting) setConfirmOpen(false);
        }}
        onConfirm={doSubmit}
        busy={submitting}
      />
    </>
  );
}
