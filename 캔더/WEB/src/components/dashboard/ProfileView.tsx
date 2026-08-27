"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import {
  ApiError,
  deleteProfilePhoto,
  getMyProfile,
  profilePhotoUrl,
  updateMyProfile,
  uploadProfilePhoto,
  type ApiProfileFull,
} from "@/lib/api";
import { IconFile, IconTrash, IconUpload, IconUser } from "@/components/icons";
import { dashStyles } from "./dashStyles";

type Form = {
  displayName: string;
  headline: string;
  summary: string;
  birthDate: string; // YYYY-MM-DD
  gender: "" | "male" | "female"; // ""=미입력
  education: string;
  career: string;
  certifications: string;
  skills: string;
  email: string;
  phone: string;
  emailPublic: boolean;
  phonePublic: boolean;
};

export const joinArr = (a?: string[] | null) => (a ?? []).join(", ");
export const splitArr = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function ProfileView({
  onName,
  onRerunOnboard,
}: {
  onName?: (name: string) => void;
  // 온보딩 오버레이는 부모(dashboard/page)가 이미 렌더한다 — 여기선 서버 저장본을 넘겨 열어달라고만 요청한다.
  onRerunOnboard?: (p: ApiProfileFull) => void;
}) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [form, setForm] = useState<Form>({
    displayName: "",
    headline: "",
    summary: "",
    birthDate: "",
    gender: "",
    education: "",
    career: "",
    certifications: "",
    skills: "",
    email: "",
    phone: "",
    emailPublic: false,
    phonePublic: false,
  });
  // 서버 저장본 원본 — 온보딩 재실행에 그대로 넘긴다(온보딩이 다루지 않는 필드를 PUT 에 되돌려주므로 필요).
  const [raw, setRaw] = useState<ApiProfileFull | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // 프로필 사진 — hasPhoto 는 서버 상태, photoVer 는 업로드 직후 <img> 캐시 무효화용.
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoVer, setPhotoVer] = useState(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    getMyProfile()
      .then(({ profile: p }) => {
        if (!alive) return;
        setForm({
          displayName: p.displayName ?? "",
          headline: p.headline ?? "",
          summary: p.summary ?? "",
          birthDate: p.birthDate ?? "",
          gender: p.gender ?? "",
          education: p.education ?? "",
          career: p.career ?? "",
          certifications: joinArr(p.certifications),
          skills: joinArr(p.skills),
          email: p.email ?? "",
          phone: p.phone ?? "",
          emailPublic: p.emailPublic ?? false,
          phonePublic: p.phonePublic ?? false,
        });
        setHasPhoto(p.hasPhoto ?? false);
        setRaw(p);
        setPhase("ready");
      })
      .catch(() => alive && setPhase("error"));
    return () => {
      alive = false;
    };
  }, []);

  const set =
    (k: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setSaved(false);
    };

  const togglePub = (k: "emailPublic" | "phonePublic") => {
    setForm((f) => ({ ...f, [k]: !f[k] }));
    setSaved(false);
  };

  const save = async () => {
    setErr(null);
    setSaved(false);
    setBusy(true);
    try {
      const { profile: p } = await updateMyProfile({
        displayName: form.displayName.trim(),
        headline: form.headline.trim() || null,
        summary: form.summary.trim() || null,
        birthDate: form.birthDate || null,
        gender: form.gender || null,
        education: form.education.trim() || null,
        career: form.career.trim() || null,
        certifications: splitArr(form.certifications),
        skills: splitArr(form.skills),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        emailPublic: form.emailPublic,
        phonePublic: form.phonePublic,
      });
      // PUT 응답 = 최신 저장본. 갱신 안 하면 raw 가 진입 시점에 고정돼, 온보딩 재실행이 옛 값을
      // 그대로 PUT 에 되돌려보내 방금 저장한 한 줄 소개·연락처가 조용히 원복된다.
      setRaw(p);
      setSaved(true);
      onName?.(form.displayName.trim()); // 헤더 표시명 즉시 갱신(서버도 User.displayName 동기화, 사이클9)
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const pickPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 재선택도 change 이벤트가 발생하게 초기화
    if (!file) return;
    setPhotoErr(null);
    setPhotoBusy(true);
    try {
      const { profile: p } = await uploadProfilePhoto(file);
      setHasPhoto(p.hasPhoto ?? true);
      setPhotoVer(Date.now());
    } catch (e2) {
      setPhotoErr(e2 instanceof ApiError ? e2.message : "사진 업로드에 실패했습니다.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setPhotoErr(null);
    setPhotoBusy(true);
    try {
      await deleteProfilePhoto();
      setHasPhoto(false);
    } catch (e2) {
      setPhotoErr(e2 instanceof ApiError ? e2.message : "사진 삭제에 실패했습니다.");
    } finally {
      setPhotoBusy(false);
    }
  };

  if (phase === "loading") {
    return (
      <div className="state">
        <div className="spin" />
        <p>불러오는 중…</p>
        <style jsx>{dashStyles}</style>
      </div>
    );
  }
  if (phase === "error") {
    return (
      <div className="state">
        <p>프로필을 불러오지 못했습니다.</p>
        <style jsx>{dashStyles}</style>
      </div>
    );
  }

  return (
    <>
      <div className="head">
        <div>
          <h1>프로필</h1>
          <div className="sub">인사담당자에게 보이는 지원자 정보. AI 대변인 답변의 기본 신상.</div>
        </div>
        {onRerunOnboard && raw && (
          <button type="button" className="pbtn" onClick={() => onRerunOnboard(raw)}>
            <IconFile width={14} height={14} />
            이력서로 자동 채우기
          </button>
        )}
      </div>
      <div className="pform">
        <div className="frow">
          <label className="flabel">프로필 사진</label>
          <div className="photorow">
            {hasPhoto ? (
              // 인가가 필요한 동적 이미지(세션 쿠키) — next/image 옵티마이저는 쿠키를 전달하지 못한다.
              // eslint-disable-next-line @next/next/no-img-element
              <img className="photoprev" src={profilePhotoUrl(photoVer)} alt="프로필 사진 미리보기" />
            ) : (
              <div className="photoempty" aria-hidden="true">
                <IconUser width={24} height={24} />
              </div>
            )}
            <div className="photobtns">
              <button
                type="button"
                className="pbtn"
                onClick={() => fileRef.current?.click()}
                disabled={photoBusy}
              >
                <IconUpload width={14} height={14} />
                {photoBusy ? "처리 중…" : hasPhoto ? "사진 변경" : "사진 업로드"}
              </button>
              {hasPhoto && (
                <button type="button" className="pbtn danger" onClick={removePhoto} disabled={photoBusy}>
                  <IconTrash width={14} height={14} />
                  삭제
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={pickPhoto}
            />
          </div>
          <div className="fhint">
            인사담당자 화면·PDF 이력서에 표시됩니다. 정사각형으로 잘려 저장돼요.
          </div>
          {photoErr && <div className="fhint perr-inline">{photoErr}</div>}
        </div>
        <div className="frow two">
          <div>
            <label className="flabel">이름</label>
            <input className="finput" value={form.displayName} onChange={set("displayName")} placeholder="이력서에 표시될 이름" />
          </div>
          <div>
            <label className="flabel">한 줄 소개</label>
            <input className="finput" value={form.headline} onChange={set("headline")} placeholder="직무와 경력이 드러나는 한 문장" />
          </div>
        </div>
        <div className="frow">
          <label className="flabel">핵심 요약</label>
          <textarea className="ftext" value={form.summary} onChange={set("summary")} placeholder="경력·강점을 요약해주세요" />
        </div>
        <div className="frow two">
          <div>
            <label className="flabel">생년월일</label>
            <input className="finput" type="date" value={form.birthDate} onChange={set("birthDate")} max={new Date().toISOString().slice(0, 10)} />
            <div className="fhint">나이는 생년월일로 자동 계산되어 표시됩니다</div>
          </div>
          <div>
            <label className="flabel">성별</label>
            {/* 네이티브 select — 값 집합이 고정(male/female)이라 서버 zod 와 1:1. 미입력이 기본. */}
            <select
              className="finput"
              value={form.gender}
              onChange={(e) => {
                setForm((f) => ({ ...f, gender: e.target.value as Form["gender"] }));
                setSaved(false);
              }}
            >
              <option value="">미입력</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>
        </div>
        <div className="frow">
          <label className="flabel">학력</label>
          <input className="finput" value={form.education} onChange={set("education")} placeholder="최종 학력과 전공" />
        </div>
        <div className="frow">
          <label className="flabel">경력</label>
          <textarea className="ftext" value={form.career} onChange={set("career")} placeholder="회사, 재직 기간, 담당 업무를 함께 적어주세요" />
        </div>
        <div className="frow two">
          <div>
            <label className="flabel">이메일</label>
            <input
              className="finput"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="연락받을 이메일 주소"
            />
            <button type="button" className="toggle pubtoggle" onClick={() => togglePub("emailPublic")}>
              <span className={"sw" + (form.emailPublic ? "" : " off")}>
                <i />
              </span>
              인사담당자에게 공개
            </button>
          </div>
          <div>
            <label className="flabel">휴대폰</label>
            <input
              className="finput"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="연락받을 휴대폰 번호"
            />
            <button type="button" className="toggle pubtoggle" onClick={() => togglePub("phonePublic")}>
              <span className={"sw" + (form.phonePublic ? "" : " off")}>
                <i />
              </span>
              인사담당자에게 공개
            </button>
          </div>
        </div>
        <div className="frow">
          <div className="fhint">공개를 끄면 인사담당자 화면·PDF 어디에도 연락처가 나가지 않습니다. 저장을 눌러야 반영돼요.</div>
        </div>
        <div className="frow two">
          <div>
            <label className="flabel">자격증</label>
            <input className="finput" value={form.certifications} onChange={set("certifications")} placeholder="보유한 자격증" />
            <div className="fhint">쉼표(,)로 구분해서 입력</div>
          </div>
          <div>
            <label className="flabel">핵심 역량</label>
            <input className="finput" value={form.skills} onChange={set("skills")} placeholder="자신 있는 기술과 역량" />
            <div className="fhint">쉼표(,)로 구분해서 입력</div>
          </div>
        </div>
        <div className="prow-btn">
          <button type="button" className="psave" onClick={save} disabled={busy || !form.displayName.trim()}>
            {busy ? "저장 중…" : "저장"}
          </button>
          {saved && <span className="saved">저장되었습니다</span>}
          {err && <span className="perr">{err}</span>}
        </div>
      </div>
      <style jsx>{dashStyles}</style>
    </>
  );
}
