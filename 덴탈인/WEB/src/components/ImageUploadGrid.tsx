"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { TALK_IMAGE_MAX } from "@/lib/talks";

type UploadResponse = { url: string };

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
};

export default function ImageUploadGrid({ value, onChange, max = TALK_IMAGE_MAX }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(0, max - value.length);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const list = Array.from(files).slice(0, remaining);
    if (list.length === 0) {
      setError(`최대 ${max}장까지 첨부할 수 있습니다.`);
      return;
    }
    setUploading(true);
    const added: string[] = [];
    for (const file of list) {
      if (!file.type.startsWith("image/")) {
        setError("이미지 파일만 업로드할 수 있습니다.");
        continue;
      }
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.upload<UploadResponse>("/api/upload", fd);
      if (!res.success || !res.data?.url) {
        setError(res.message || "이미지 업로드에 실패했습니다.");
        continue;
      }
      added.push(res.data.url);
    }
    setUploading(false);
    if (added.length > 0) onChange([...value, ...added].slice(0, max));
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (idx: number) => {
    const next = value.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div>
      <div className="uploads">
        {value.map((src, i) => (
          <div className="upload-thumb" key={`${src}-${i}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`업로드 이미지 ${i + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <button
              type="button"
              className="x"
              onClick={() => removeAt(i)}
              aria-label={`이미지 ${i + 1} 삭제`}
            >
              ×
            </button>
          </div>
        ))}
        {value.length < max && (
          <label
            className="upload-slot"
            style={{ cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.6 : 1 }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />
            <span className="ico">+</span>
            <span>{uploading ? "업로드 중…" : `사진 (${value.length}/${max})`}</span>
          </label>
        )}
      </div>
      {error && (
        <div className="help" style={{ color: "#E11D48", marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
}
