"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { IconFile, IconUpload } from "@/components/icons";
import {
  ApiError,
  parseResumeFile,
  updateMyProfile,
  type ApiProfileFull,
  type ParsedResume,
} from "@/lib/api";
import { useModalA11y } from "@/lib/modalA11y";
import { dashStyles } from "./dashStyles";
import { joinArr, splitArr } from "./ProfileView";

// 서버 PARSE_MAX_BYTES 미러 — 왕복 낭비 없이 즉시 안내.
const MAX_BYTES = 20 * 1024 * 1024;
// 서버 validateUpload 가 허용하는 형식 미러(magic number 재검증) — AssetsView 의 ACCEPT 와 같은 값.
const ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,application/pdf,.txt,.md,.markdown,.docx,.pptx,.xlsx,.hwpx,text/plain";

type Step = "pick" | "parsing" | "review";

type Form = {
  displayName: string;
  gender: "" | "male" | "female";
  birthDate: string;
  education: string;
  career: string;
  certifications: string;
  skills: string;
};

const STEP_LABEL: Record<Step, string> = {
  pick: "STEP 1 / 3 · 이력서 첨부",
  parsing: "STEP 2 / 3 · 분석 중",
  review: "STEP 3 / 3 · 확인·수정",
};

const STEP_NO: Record<Step, number> = { pick: 1, parsing: 2, review: 3 };

// 추출 성공 항목 수 — "N개 항목을 찾았어요" 칩. 빈 값/빈 배열은 세지 않는다.
function foundCount(p: ParsedResume): number {
  return [
    p.displayName,
    p.gender,
    p.birthDate,
    p.education,
    p.career,
    p.certifications.length ? "y" : null,
    p.skills.length ? "y" : null,
  ].filter(Boolean).length;
}

/**
 * 온보딩 이력서 파싱 오버레이(카드#002 E) — 신규 가입자에게 한 번만 뜬다(뜨는 조건은 dashboard/page).
 * 첨부 → 서버가 LLM 1회로 추출(무과금·저장 안 함) → 사용자가 확인·수정 → 저장.
 */
export function ResumeOnboarding({
  profile,
  onClose,
}: {
  profile: ApiProfileFull;
  onClose: (savedName?: string) => void;
}) {
  const [step, setStep] = useState<Step>("pick");
  const [form, setForm] = useState<Form>({
    displayName: profile.displayName ?? "",
    gender: profile.gender ?? "",
    birthDate: profile.birthDate ?? "",
    education: profile.education ?? "",
    career: profile.career ?? "",
    certifications: joinArr(profile.certifications),
    skills: joinArr(profile.skills),
  });
  const [found, setFound] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // 분석 중에는 ESC 닫기만 막는다(포커스 트랩은 유지) — 실수로 닫으면 하루 5회 분석 할당량만 소모된다.
  useModalA11y(true, () => onClose(), sheetRef, undefined, step === "parsing");

  const set = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 재선택도 change 가 발생하게 초기화
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setErr("20MB 이하의 파일만 분석할 수 있습니다.");
      return;
    }
    setErr(null);
    setStep("parsing");
    try {
      const { parsed } = await parseResumeFile(file);
      setForm((f) => ({
        // 추출 못 한 항목은 기존 값을 유지한다(빈 문자열로 덮어쓰지 않음).
        displayName: parsed.displayName ?? f.displayName,
        gender: parsed.gender ?? f.gender,
        birthDate: parsed.birthDate ?? f.birthDate,
        education: parsed.education ?? f.education,
        career: parsed.career ?? f.career,
        certifications: parsed.certifications.length
          ? joinArr(parsed.certifications)
          : f.certifications,
        skills: parsed.skills.length ? joinArr(parsed.skills) : f.skills,
      }));
      setFound(foundCount(parsed));
      setStep("review");
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "이력서를 분석하지 못했습니다.");
      setStep("pick");
    }
  };

  const save = async () => {
    setErr(null);
    setBusy(true);
    const name = form.displayName.trim();
    try {
      // PUT 은 전체 덮어쓰기 — 온보딩이 다루지 않는 필드(한 줄 소개·연락처 등)는 기존 값을 그대로 돌려보낸다.
      await updateMyProfile({
        displayName: name,
        headline: profile.headline ?? null,
        summary: profile.summary ?? null,
        email: profile.email ?? null,
        phone: profile.phone ?? null,
        emailPublic: profile.emailPublic ?? false,
        phonePublic: profile.phonePublic ?? false,
        birthDate: form.birthDate || null,
        gender: form.gender || null,
        education: form.education.trim() || null,
        career: form.career.trim() || null,
        certifications: splitArr(form.certifications),
        skills: splitArr(form.skills),
      });
      onClose(name);
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "저장에 실패했습니다.");
      setBusy(false);
    }
  };

  const n = STEP_NO[step];

  return (
    <div className="ovl">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onbTitle"
        // 분석 중엔 안에 포커스 가능한 요소가 없다 — 컨테이너가 포커스를 받아야 트랩이 유지된다.
        tabIndex={-1}
        ref={sheetRef}
      >
        <div className="steps">
          {[1, 2, 3].map((i) => (
            <span key={i} className={"st" + (i < n ? " done" : i === n ? " on" : "")} />
          ))}
        </div>
        <div className="stlabel">{STEP_LABEL[step]}</div>

        <div className="inner">
          {step === "pick" && (
            <>
              <div className="icwrap">
                <IconFile width={22} height={22} />
              </div>
              <h3 id="onbTitle">이력서 한 장이면 준비 끝</h3>
              <p className="desc">
                파일을 올리면 이름·학력·경력·자격증을 자동으로 채워드려요. 확인하고 고칠 수 있습니다.
              </p>
              <button type="button" className="drop" onClick={() => fileRef.current?.click()}>
                <IconUpload width={24} height={24} />
                <b>이력서 파일 선택</b>
                <small>PDF · 이미지 · docx · hwpx (20MB 이하)</small>
              </button>
              <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={pick} />
              {err && <div className="oerr">{err}</div>}
              <div className="acts">
                <button type="button" className="ghost" onClick={() => onClose()}>
                  나중에 직접 입력할게요
                </button>
              </div>
            </>
          )}

          {step === "parsing" && (
            <>
              <div className="icwrap">
                <div className="spin" />
              </div>
              <h3 id="onbTitle">이력서를 읽고 있어요</h3>
              <p className="desc">잠시만 기다려주세요. 보통 10초 안에 끝납니다.</p>
              <div className="track">
                <i />
              </div>
              <div className="ohint">분석에는 비용이 청구되지 않습니다.</div>
            </>
          )}

          {step === "review" && (
            <>
              <span className="okchip">{found}개 항목을 찾았어요</span>
              <h3 id="onbTitle">맞는지 확인해주세요</h3>
              <p className="desc">
                잘못 읽은 부분은 지금 고칠 수 있어요. 저장을 눌러야 반영되며, 프로필에 이미 있던 값은
                여기 내용으로 덮어써집니다.
              </p>
              <div className="scroll">
                <div className="frow two">
                  <div>
                    <label className="flabel" htmlFor="onbName">
                      이름
                    </label>
                    <input
                      id="onbName"
                      className="finput"
                      value={form.displayName}
                      onChange={set("displayName")}
                    />
                  </div>
                  <div>
                    <label className="flabel" htmlFor="onbGender">
                      성별
                    </label>
                    <select
                      id="onbGender"
                      className="finput"
                      value={form.gender}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, gender: e.target.value as Form["gender"] }))
                      }
                    >
                      <option value="">미입력</option>
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                    </select>
                  </div>
                </div>
                <div className="frow two">
                  <div>
                    <label className="flabel" htmlFor="onbBirth">
                      생년월일
                    </label>
                    <input
                      id="onbBirth"
                      className="finput"
                      type="date"
                      value={form.birthDate}
                      onChange={set("birthDate")}
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                  <div>
                    <label className="flabel" htmlFor="onbEdu">
                      학력
                    </label>
                    <input
                      id="onbEdu"
                      className="finput"
                      value={form.education}
                      onChange={set("education")}
                    />
                  </div>
                </div>
                <div className="frow">
                  <label className="flabel" htmlFor="onbCareer">
                    경력
                  </label>
                  <textarea
                    id="onbCareer"
                    className="ftext"
                    value={form.career}
                    onChange={set("career")}
                  />
                </div>
                <div className="frow">
                  <label className="flabel" htmlFor="onbCerts">
                    자격증
                  </label>
                  <input
                    id="onbCerts"
                    className="finput"
                    value={form.certifications}
                    onChange={set("certifications")}
                  />
                  <div className="fhint">쉼표(,)로 구분해서 입력</div>
                </div>
                <div className="frow">
                  <label className="flabel" htmlFor="onbSkills">
                    핵심 역량
                  </label>
                  <input
                    id="onbSkills"
                    className="finput"
                    value={form.skills}
                    onChange={set("skills")}
                  />
                  <div className="fhint">쉼표(,)로 구분해서 입력</div>
                </div>
              </div>
              {err && <div className="oerr">{err}</div>}
              <div className="acts">
                <button
                  type="button"
                  className="prim"
                  onClick={save}
                  disabled={busy || !form.displayName.trim()}
                >
                  {busy ? "저장 중…" : "저장하고 시작하기"}
                </button>
                <button type="button" className="ghost" onClick={() => onClose()} disabled={busy}>
                  건너뛰기
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{dashStyles}</style>
      <style jsx>{`
        .ovl {
          position: fixed;
          inset: 0;
          z-index: 60;
          background: rgba(14, 21, 36, 0.55);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .sheet {
          background: #fff;
          border-radius: 16px;
          width: min(420px, 100%);
          max-height: min(88dvh, 720px);
          display: flex;
          flex-direction: column;
          box-shadow: 0 30px 80px rgba(14, 21, 36, 0.35);
          overflow: hidden;
          animation: onbpop 0.24s cubic-bezier(0.2, 0.7, 0.3, 1);
        }
        @keyframes onbpop {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .sheet {
            animation: none;
          }
        }
        .steps {
          display: flex;
          gap: 6px;
          padding: 16px 20px 0;
          flex: 0 0 auto;
        }
        .st {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          background: var(--line);
          transition: background 0.25s;
        }
        .st.on {
          background: var(--blue);
        }
        .st.done {
          background: var(--ok);
        }
        .stlabel {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--muted);
          padding: 9px 20px 0;
          letter-spacing: 0.04em;
          flex: 0 0 auto;
        }
        .inner {
          padding: 12px 20px 20px;
          overflow: auto;
        }
        .icwrap {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          background: var(--blue-t);
          display: grid;
          place-items: center;
          margin-bottom: 12px;
        }
        .icwrap :global(svg) {
          stroke: var(--blue-d);
        }
        .icwrap .spin {
          width: 22px;
          height: 22px;
          border-width: 2.5px;
        }
        .inner h3 {
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 6px;
        }
        .desc {
          font-size: 12.5px;
          color: var(--ink2);
          margin: 0 0 14px;
          line-height: 1.6;
        }
        .drop {
          width: 100%;
          border: 1.5px dashed var(--line2);
          border-radius: 12px;
          background: var(--bg2);
          padding: 20px 14px;
          text-align: center;
          font-family: inherit;
          color: var(--ink);
          cursor: pointer;
          transition: var(--t);
        }
        .drop:hover {
          border-color: var(--blue);
          background: var(--blue-t);
        }
        .drop:focus-visible {
          outline: 2px solid var(--blue);
          outline-offset: 2px;
        }
        .drop :global(svg) {
          stroke: var(--blue);
          margin-bottom: 6px;
        }
        .drop b {
          display: block;
          font-size: 12.5px;
          font-weight: 800;
        }
        .drop small {
          font-size: 11px;
          color: var(--muted);
        }
        .track {
          height: 5px;
          border-radius: 3px;
          background: var(--line);
          overflow: hidden;
          margin-top: 4px;
        }
        .track i {
          display: block;
          height: 100%;
          width: 62%;
          background: linear-gradient(90deg, var(--blue), #7aa2ff);
          border-radius: 3px;
          animation: onbgrow 2.4s ease-in-out infinite alternate;
        }
        @keyframes onbgrow {
          from {
            width: 24%;
          }
          to {
            width: 88%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .track i {
            animation: none;
            width: 62%;
          }
        }
        .ohint {
          font-size: 11px;
          color: var(--muted);
          margin-top: 10px;
        }
        .okchip {
          display: inline-flex;
          align-items: center;
          background: #e7f5ec;
          color: var(--ok);
          border-radius: 7px;
          padding: 3px 9px;
          font-size: 10.5px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .scroll {
          max-height: 42dvh;
          overflow: auto;
          padding-right: 4px;
        }
        .scroll .frow {
          margin-bottom: 11px;
        }
        .scroll .ftext {
          min-height: 72px;
        }
        .oerr {
          color: var(--danger);
          font-size: 12px;
          font-weight: 600;
          margin-top: 10px;
        }
        .acts {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          align-items: center;
        }
        .prim {
          background: var(--blue);
          border: 1px solid var(--blue);
          color: #fff;
          border-radius: 10px;
          padding: 11px 18px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .prim:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ghost {
          margin-left: auto;
          border: none;
          background: transparent;
          color: var(--muted);
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .ghost:hover {
          color: var(--ink2);
        }
        .prim:focus-visible,
        .ghost:focus-visible {
          outline: 2px solid var(--blue);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
