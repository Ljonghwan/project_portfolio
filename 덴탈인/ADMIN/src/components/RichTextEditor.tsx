"use client";

import { useEffect, useRef, useState } from "react";
import { App } from "antd";
import { PictureOutlined } from "@ant-design/icons";
import { apiFetch } from "@/lib/api";

// G3 A7: 약관(terms)에 인라인이던 WYSIWYG 에디터를 공통 컴포넌트로 추출.
//   contentEditable + execCommand 패턴(사용자 글쓰기 RichEditor와 동일). antd Form.Item이 value/onChange 주입.
//   저장 시 서버 sanitizeRichHtml로 2차 방어.
//   allowImages=true면 툴바에 이미지 업로드 버튼 노출 → /api/admin/upload(public) 업로드 후 본문에 <img> 삽입.
export default function RichTextEditor({
  value,
  onChange,
  allowImages = false,
  testId,
  minHeight = 280,
}: {
  value?: string;
  onChange?: (html: string) => void;
  allowImages?: boolean;
  testId?: string;
  minHeight?: number;
}) {
  const { message } = App.useApp();
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerHTML !== (value || "")) el.innerHTML = value || "";
  }, [value]);

  const emit = () => { if (ref.current) onChange?.(ref.current.innerHTML); };
  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    emit();
  };
  const onLink = () => {
    const url = window.prompt("링크 URL을 입력하세요.", "https://");
    if (url) exec("createLink", url);
  };

  const onPickImage = () => fileRef.current?.click();
  const onImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // 동일 파일 재선택 허용
    if (!f) return;
    if (!/^image\//.test(f.type)) { message.error("이미지 파일만 업로드할 수 있습니다."); return; }
    if (f.size > 5 * 1024 * 1024) { message.error("파일 크기는 5MB 이하여야 합니다."); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", f);
    fd.append("visibility", "public");
    const res = await apiFetch<{ url: string }>("/api/admin/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.success && res.data?.url) {
      // 본문 끝(또는 현재 커서)에 이미지 삽입. 에디터에 포커스 후 insertImage.
      ref.current?.focus();
      document.execCommand("insertImage", false, res.data.url);
      emit();
      message.success("이미지가 본문에 삽입되었습니다.");
    } else {
      message.error(res.message || "이미지 업로드에 실패했습니다.");
    }
  };

  const btn: React.CSSProperties = {
    minWidth: 32, height: 28, border: "1px solid #d9d9d9", background: "#fff",
    borderRadius: 6, cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 8px",
  };

  return (
    <div style={{ border: "1px solid #d9d9d9", borderRadius: 8, overflow: "hidden" }}>
      <style>{`.rte-editable img{max-width:100%;height:auto;border-radius:4px;}`}</style>
      <div style={{ display: "flex", gap: 4, padding: 8, borderBottom: "1px solid #f0f0f0", background: "#fafafa", flexWrap: "wrap" }}>
        <button type="button" aria-label="굵게" style={btn} onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}><b>B</b></button>
        <button type="button" aria-label="기울임" style={btn} onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}><i>I</i></button>
        <button type="button" aria-label="밑줄" style={btn} onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}><u>U</u></button>
        <button type="button" aria-label="목록" style={btn} onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }}>≣</button>
        <button type="button" aria-label="링크" style={btn} onMouseDown={(e) => { e.preventDefault(); onLink(); }}>🔗</button>
        {allowImages && (
          <button
            type="button"
            aria-label="이미지"
            style={{ ...btn, opacity: uploading ? 0.6 : 1 }}
            disabled={uploading}
            onMouseDown={(e) => { e.preventDefault(); if (!uploading) onPickImage(); }}
            data-testid={testId ? `${testId}-image` : undefined}
          >
            {uploading ? "…" : <PictureOutlined />}
          </button>
        )}
      </div>
      {allowImages && (
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onImageFile} data-testid={testId ? `${testId}-image-file` : undefined} />
      )}
      <div
        ref={ref}
        className="rte-editable"
        contentEditable
        suppressContentEditableWarning
        data-testid={testId}
        onInput={emit}
        style={{ minHeight, maxHeight: 480, overflowY: "auto", padding: 14, fontSize: 14, lineHeight: 1.7, outline: "none" }}
      />
    </div>
  );
}
