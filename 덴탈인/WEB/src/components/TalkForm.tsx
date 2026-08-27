"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  TALK_CATEGORIES,
  TALK_CATEGORY_LABELS,
  TALK_IMAGE_MAX,
  type TalkCategory,
  type TalkFormInput,
  type TalkPost,
} from "@/lib/talks";
import ImageUploadGrid from "./ImageUploadGrid";
import ConfirmModal from "./ConfirmModal";

type Props = {
  mode: "create" | "edit";
  initial?: Partial<TalkPost> | null;
  postId?: number;
};

export default function TalkForm({ mode, initial, postId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<TalkFormInput>({
    category: (initial?.category as TalkCategory) ?? "daily",
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    images: Array.isArray(initial?.images) ? (initial!.images as string[]) : [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Why: React state(submitting) 갱신은 비동기라서 빠른 연타 시 disabled 반영 전 다중 호출이 가능.
  // useRef로 동기적 lock을 두어 첫 클릭만 실제 요청을 보내도록 보장.
  const submittingRef = useRef(false);

  const update = <K extends keyof TalkFormInput>(k: K, v: TalkFormInput[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const validate = (): TalkFormInput | null => {
    const trimmed: TalkFormInput = {
      category: form.category,
      title: form.title.trim(),
      content: form.content.trim(),
      images: form.images.slice(0, TALK_IMAGE_MAX),
    };
    if (!TALK_CATEGORIES.includes(trimmed.category)) {
      setError("카테고리를 선택해 주세요.");
      return null;
    }
    if (!trimmed.title) {
      setError("제목을 입력해 주세요.");
      return null;
    }
    if (trimmed.title.length > 20) {
      setError("제목은 20자 이내로 입력해 주세요.");
      return null;
    }
    if (!trimmed.content) {
      setError("본문을 입력해 주세요.");
      return null;
    }
    if (trimmed.content.length > 1000) {
      setError("본문은 1000자 이내로 입력해 주세요.");
      return null;
    }
    if (trimmed.images.length > TALK_IMAGE_MAX) {
      setError(`사진은 최대 ${TALK_IMAGE_MAX}장까지 첨부할 수 있습니다.`);
      return null;
    }
    return trimmed;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = validate();
    if (!trimmed) return;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    const trimmed = validate();
    if (!trimmed) {
      submittingRef.current = false;
      setConfirmOpen(false);
      return;
    }
    setSubmitting(true);
    const res =
      mode === "create"
        ? await api.post<TalkPost>("/api/talks", trimmed, true)
        : await api.patch<TalkPost>(`/api/talks/${postId}`, trimmed, true);
    setSubmitting(false);
    if (!res.success || !res.data) {
      submittingRef.current = false;
      setError(res.message || "저장에 실패했습니다.");
      setConfirmOpen(false);
      return;
    }
    setConfirmOpen(false);
    const id = res.data.id;
    if (mode === "create") {
      router.push("/talks");
    } else {
      router.push(`/talks/${id}`);
    }
    // 페이지 이동 후에는 컴포넌트가 unmount되므로 ref reset 불필요.
  };

  return (
    <>
      <form className="form-card" onSubmit={handleSubmit}>
        <h3>{mode === "create" ? "글쓰기" : "글수정"}</h3>
        <p className="form-sub">
          제목 20자 이내, 내용 1000자 이내, 이미지 최대 5장까지 첨부할 수 있어요.
        </p>

        <div className="form-row">
          <div className="lab">
            {/* BUG-1: req를 텍스트와 묶어 좌측 붙임(.lab space-between으로 별이 우측 떨어지는 문제) */}
            <span>카테고리<span className="req">*</span></span>
          </div>
          <div className="cat-chips" role="radiogroup" aria-label="카테고리">
            {TALK_CATEGORIES.map((c) => (
              <label key={c}>
                <input
                  type="radio"
                  name="talk-form-cat"
                  value={c}
                  checked={form.category === c}
                  onChange={() => update("category", c)}
                />
                <span className="pill">{TALK_CATEGORY_LABELS[c]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="lab">
            <span>
              제목<span className="req">*</span>
            </span>
            <span className="ct">{form.title.length} / 20</span>
          </div>
          <input
            className="input"
            type="text"
            maxLength={20}
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="제목을 입력해 주세요"
          />
        </div>

        <div className="form-row">
          <div className="lab">
            <span>
              본문<span className="req">*</span>
            </span>
            <span className="ct">{form.content.length} / 1000</span>
          </div>
          <textarea
            className="textarea"
            maxLength={1000}
            value={form.content}
            onChange={(e) => update("content", e.target.value.slice(0, 1000))}
            placeholder="내용을 입력하세요."
            rows={10}
          />
        </div>

        <div className="form-row">
          <div className="lab">
            <span>이미지 <span style={{ fontWeight: 500, color: "var(--ink-4)" }}>(선택사항 · 최대 5장)</span></span>
            <span className="ct">
              {form.images.length} / {TALK_IMAGE_MAX}
            </span>
          </div>
          <ImageUploadGrid
            value={form.images}
            onChange={(next) => update("images", next)}
            max={TALK_IMAGE_MAX}
          />
        </div>

        {error && (
          <div className="help" style={{ color: "#E11D48", marginTop: 8 }}>
            {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn cancel" onClick={() => router.back()}>
            취소
          </button>
          <button type="submit" className="btn submit" disabled={submitting}>
            {submitting ? "저장 중…" : mode === "create" ? "등록하기" : "수정하기"}
          </button>
        </div>
      </form>

      <ConfirmModal
        open={confirmOpen}
        title={
          mode === "create" ? "글을 등록하시겠습니까?" : "수정사항을 저장하시겠습니까?"
        }
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
        onConfirm={handleConfirm}
        busy={submitting}
      />
    </>
  );
}
