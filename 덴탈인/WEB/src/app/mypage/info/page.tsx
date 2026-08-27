"use client";

// p2-mypage-g2: 내 정보 퍼블 1:1 (mypage-personal-info.html / mypage-corp-info.html 시안).
// info-tabs + form-row 2열 + 단일 저장. 개인/기업 라벨 차이만.
import { useRef, useState } from "react";
import Link from "next/link";
import MyPageShell from "@/components/MyPageShell";
import LoadingIndicator from "@/components/LoadingIndicator";
import PhoneVerifyField from "@/components/PhoneVerifyField";
import PasswordInput from "@/components/PasswordInput";
import { useAuthStore } from "@/stores/authStore";
import { useMe, type Me } from "@/lib/useMe";
import { api } from "@/lib/api";
import { formatPhone } from "@/lib/format";

const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function MyPageInfo() {
  const { me, loading, reload } = useMe();
  if (loading) return <MyPageShell me={null}><LoadingIndicator /></MyPageShell>;
  if (!me) return null;
  return <InfoForm key={me.id} me={me} reload={reload} />;
}

function InfoForm({ me, reload }: { me: Me; reload: () => void }) {
  const isCorp = me.userType === "corp";
  const [name, setName] = useState(me.name ?? "");
  const [phone, setPhone] = useState(me.phone ?? "");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneEditing, setPhoneEditing] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false); // 동기 더블클릭 가드(BUG-3)
  const [photoBusy, setPhotoBusy] = useState(false); // F10: 프로필 사진 처리 중

  // F10: 프로필 사진 변경 — 업로드(public) → PATCH /me {profileImageUrl} → me/헤더 동기화.
  async function onPhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 재선택 허용
    if (!f) return;
    setErr(null); setMsg(null); setPhotoBusy(true);
    const fd = new FormData();
    fd.append("file", f);
    fd.append("visibility", "public"); // 아바타는 헤더 <img>에 직접 노출 → public
    const up = await api.upload<{ url: string }>("/api/upload", fd);
    if (!up.success || !up.data?.url) { setPhotoBusy(false); setErr(up.message || "사진 업로드에 실패했습니다."); return; }
    const res = await api.patch("/api/users/me", { profileImageUrl: up.data.url }, true);
    setPhotoBusy(false);
    if (!res.success) { setErr(res.message || "프로필 사진 저장에 실패했습니다."); return; }
    setMsg("프로필 사진이 변경되었습니다.");
    await useAuthStore.getState().syncFromServer(); // 헤더 아바타 즉시 갱신
    reload();
  }

  async function onPhotoDelete() {
    setErr(null); setMsg(null); setPhotoBusy(true);
    const res = await api.patch("/api/users/me", { profileImageUrl: "" }, true);
    setPhotoBusy(false);
    if (!res.success) { setErr(res.message || "프로필 사진 삭제에 실패했습니다."); return; }
    setMsg("프로필 사진이 삭제되었습니다.");
    await useAuthStore.getState().syncFromServer();
    reload();
  }

  async function savePhone() {
    if (savingRef.current) return;
    setErr(null); setMsg(null);
    if (!phoneVerified) { setErr("휴대폰 인증을 완료해 주세요."); return; }
    savingRef.current = true;
    const res = await api.patch("/api/users/me/phone", { phone }, true).finally(() => { savingRef.current = false; });
    if (!res.success) { setErr(res.message || "휴대폰 변경 실패"); return; }
    setMsg("휴대폰번호가 변경되었습니다."); setPhoneEditing(false); setPhoneVerified(false); reload();
  }

  // 단일 저장: 이름 + (입력 시) 비밀번호. PATCH /api/users/me 한 번에.
  async function saveAll(e: React.FormEvent) {
    e.preventDefault();
    if (savingRef.current) return;
    setErr(null); setMsg(null);
    if (!name.trim()) { setErr("이름을 입력해 주세요."); return; }
    const body: { name: string; currentPassword?: string; newPassword?: string } = { name };
    const wantsPw = !!(newPw || newPw2 || currentPw);
    if (wantsPw) {
      if (me.snsProvider) { setErr("SNS 가입 계정은 비밀번호 변경이 불가합니다."); return; }
      if (!pwRegex.test(newPw)) { setErr("새 비밀번호는 8자 이상 영문/숫자/특수문자 조합이어야 합니다."); return; }
      if (newPw !== newPw2) { setErr("새 비밀번호가 일치하지 않습니다."); return; }
      body.currentPassword = currentPw;
      body.newPassword = newPw;
    }
    savingRef.current = true;
    setSaving(true);
    const res = await api.patch("/api/users/me", body, true).finally(() => { savingRef.current = false; });
    setSaving(false);
    if (!res.success) { setErr(res.message || "저장 실패"); return; }
    setMsg("저장되었습니다."); setCurrentPw(""); setNewPw(""); setNewPw2(""); reload();
  }

  return (
    <MyPageShell me={me}>
      <div className="mp-page-head">
        <div>
          <h2>내 정보</h2>
          <div className="sub">기본 정보를 확인하고 변경할 수 있습니다.</div>
        </div>
      </div>

      {/* F10: 프로필 사진 관리(등록/변경/삭제). 노출은 마이페이지 + 헤더 아바타. */}
      <div className="mp-card profile-photo-card">
        <div className="pp-avatar">
          {me.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.profileImageUrl} alt="프로필 사진" className="ava-img" />
          ) : (
            <span className="pp-initial">{(me.name || "?").slice(0, 1)}</span>
          )}
        </div>
        <div className="pp-body">
          <div className="pp-title">프로필 사진</div>
          <div className="pp-actions">
            <label className={`pp-btn${photoBusy ? " busy" : ""}`}>
              {photoBusy ? "처리 중…" : me.profileImageUrl ? "변경" : "등록"}
              <input type="file" accept="image/*" onChange={onPhotoFile} disabled={photoBusy} style={{ display: "none" }} />
            </label>
            {me.profileImageUrl && (
              <button type="button" className="pp-btn danger" onClick={onPhotoDelete} disabled={photoBusy}>삭제</button>
            )}
          </div>
        </div>
      </div>

      <div className="mp-card info-card info-card-corp">
        <div className="info-tabs">
          <Link href="/mypage/info" className="on">내 정보</Link>
          <Link href="/mypage/extra">추가 정보</Link>
        </div>

        <form onSubmit={saveAll} noValidate>
          <div className="form-row">
            <div className="lbl">아이디</div>
            <div className="field"><span className="row-static">{me.email}{me.snsProvider && <em style={{ marginLeft: 8, color: "var(--ink-3)", fontStyle: "normal" }}>({me.snsProvider} 가입)</em>}</span></div>
          </div>

          <div className="form-row">
            <div className="lbl">회원유형</div>
            <div className="field"><span className="row-static">{isCorp ? "기업회원" : "개인회원"}</span></div>
          </div>

          {me.snsProvider ? (
            <div className="form-row start">
              <div className="lbl">비밀번호 변경</div>
              <div className="field">
                <p className="help-msg">SNS({me.snsProvider}) 가입 회원은 비밀번호 변경이 불가합니다.</p>
              </div>
            </div>
          ) : (
            <div className="form-row start">
              <label className="lbl" htmlFor="curPw">비밀번호 변경</label>
              <div className="field">
                {/* 보안 유지(시안엔 없음, 불일치표 등재): 현재 비밀번호 확인 후 변경 */}
                <PasswordInput id="curPw" className="input-base" placeholder="현재 비밀번호" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" />
                <PasswordInput className="input-base" placeholder="새 비밀번호 (8자리 이상, 영문·숫자·특수문자)" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
                <PasswordInput className={`input-base ${newPw2 && newPw !== newPw2 ? "error" : ""}`} placeholder="비밀번호 재입력" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} autoComplete="new-password" />
                <p className="help-msg">변경하지 않으려면 비워두세요.</p>
              </div>
            </div>
          )}

          <div className="form-row">
            <label className="lbl" htmlFor="name">{isCorp ? "담당자 이름" : "이름"}</label>
            <div className="field"><input id="name" type="text" className="input-base" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" /></div>
          </div>

          <div className="form-row">
            <div className="lbl">휴대폰번호</div>
            <div className="field">
              <div className="field-row">
                <input type="tel" className="input-base readonly" value={phone ? formatPhone(phone) : "-"} readOnly style={{ flex: 1 }} />
                {!phoneEditing && (
                  <button type="button" className="btn-sub ghost" onClick={() => { setPhoneEditing(true); setPhoneVerified(false); }}>변경하기</button>
                )}
              </div>
              <div className={`phone-verify ${phoneEditing ? "show" : ""}`}>
                <PhoneVerifyField phone={phone} onChangePhone={setPhone} verified={phoneVerified} onVerified={setPhoneVerified} />
                <div className="row" style={{ marginTop: 10 }}>
                  <button type="button" className="btn-sub ghost" onClick={() => { setPhoneEditing(false); setPhone(me.phone ?? ""); setPhoneVerified(false); }}>취소</button>
                  <button type="button" className="btn-sub" onClick={savePhone} disabled={!phoneVerified}>휴대폰번호 저장</button>
                </div>
                <p className="help-msg warn" style={{ marginTop: 8 }}>휴대폰 변경 시 인증이 필요합니다.</p>
              </div>
            </div>
          </div>

          {/* 이메일 = 계정 식별자(로그인 아이디)라 변경 불가 → static 표시(불일치표) */}
          <div className="form-row">
            <div className="lbl">이메일</div>
            <div className="field"><span className="row-static">{me.email}</span></div>
          </div>

          {err && <p className="help-msg err" style={{ marginTop: 12 }}>{err}</p>}
          {msg && (
            <div className="toast" style={{ marginTop: 14 }}>
              <span className="check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg></span>
              {msg}
            </div>
          )}

          <div className="form-actions" style={{ border: 'none'}}>
            <Link href="/mypage/leave" className="leave-link">
              서비스를 더 이상 이용하지 않으신다면 <u>회원탈퇴하기</u>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
            <button type="submit" className="save-cta" disabled={saving}>저장</button>
          </div>
        </form>
      </div>
    </MyPageShell>
  );
}
