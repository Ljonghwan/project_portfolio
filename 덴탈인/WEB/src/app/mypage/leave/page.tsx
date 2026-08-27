"use client";

// 회원 탈퇴 퍼블 1:1 (mypage-personal/corp-leave 시안).
// 고객사 피드백 6(2026-06-19): 비밀번호 확인 입력 추가(본인 확인, 이전 Q1=B 번복) + 탈퇴 사유 코드 서버 저장.
// 탈퇴 약관 = GET /api/terms?type=withdrawal.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import MyPageShell from "@/components/MyPageShell";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingIndicator from "@/components/LoadingIndicator";
import PasswordInput from "@/components/PasswordInput";
import { useMe } from "@/lib/useMe";
import { api } from "@/lib/api";
import { useCodeOptions } from "@/stores/codeStore";
import { useAuthStore } from "@/stores/authStore";

const WITHDRAWAL_FALLBACK = `
<h5>제1조 (목적)</h5>
<p>본 약관은 덴탈인(이하 "회사") 서비스의 회원탈퇴 절차 및 탈퇴 시 처리되는 회원 정보의 범위를 규정함을 목적으로 합니다.</p>
<h5>제2조 (탈퇴 처리)</h5>
<ul>
<li>회원이 탈퇴를 신청하면 즉시 계정이 비활성화되며 로그인이 불가능합니다.</li>
<li>작성한 게시글·댓글은 작성자명이 '탈퇴한 회원'으로 표시되어 본인 식별이 불가능하도록 처리됩니다.</li>
<li>면허/사업자 인증 기록 및 본인 인증 정보는 즉시 파기됩니다.</li>
</ul>
<h5>제3조 (보관 정보)</h5>
<p>관계 법령에 따라 분쟁 처리(3년), 부정 이용 방지(30일) 등 일부 정보는 일정 기간 보관됩니다.</p>
<h5>제4조 (재가입 제한)</h5>
<p>탈퇴 후 30일간 동일 이메일로 재가입이 제한됩니다.</p>
`;

export default function MyPageLeave() {
  const router = useRouter();
  const { me, loading } = useMe();
  const isCorp = me?.userType === "corp";
  const isSns = !!me?.snsProvider; // SNS 계정은 비밀번호가 없어 본인확인 비번 입력 생략
  const reasonOptions = useCodeOptions("withdrawReason"); // 코드 마스터(서버 저장 키와 동일)

  const [agree, setAgree] = useState(false);
  const [tried, setTried] = useState(false);
  const [reason, setReason] = useState(""); // 선택한 사유 코드(key)
  const [reasonText, setReasonText] = useState("");
  const [password, setPassword] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [terms, setTerms] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    (async () => {
      const res = await api.get<{ content: string }>("/api/terms?type=withdrawal");
      if (res.success && res.data?.content) setTerms(res.data.content);
    })();
  }, []);

  if (loading) return <MyPageShell me={null}><LoadingIndicator /></MyPageShell>;
  if (!me) return null;

  const onLeaveClick = () => {
    if (!agree) { setTried(true); return; }
    // 비밀번호 확인(이메일 계정만). SNS 계정은 비번이 없어 생략.
    if (!isSns && !password.trim()) { setTried(true); setPwErr("비밀번호를 입력해 주세요."); return; }
    setConfirmOpen(true);
  };

  const runLeave = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const body = {
      password: isSns ? undefined : password,
      withdrawReason: reason || undefined,
      withdrawReasonText: reasonText.trim() || undefined,
    };
    const res = await api.del("/api/users/me", true, body).finally(() => { busyRef.current = false; });
    setBusy(false);
    setConfirmOpen(false);
    if (!res.success) {
      // 비번 불일치는 모달 닫고 인라인 에러로 안내
      if (res.code === "INVALID_PASSWORD" || res.code === "PASSWORD_REQUIRED") {
        setPwErr(res.message || "비밀번호가 일치하지 않습니다.");
        return;
      }
      alert(res.message || "탈퇴에 실패했습니다.");
      return;
    }
    useAuthStore.getState().clearAuth();
    alert("회원탈퇴가 완료되었습니다.");
    router.replace("/");
  };

  const termsHtml = DOMPurify.sanitize(terms || WITHDRAWAL_FALLBACK);

  return (
    <MyPageShell me={me}>
      <div className="mp-page-head">
        <div>
          <h2>회원 탈퇴</h2>
          <div className="sub">탈퇴 전 아래 안내사항을 꼭 확인해주세요.</div>
        </div>
      </div>

      <div className="mp-card info-card">
        <div className="leave-warn">
          <div className="icn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </div>
          <div>
            {isCorp ? (
              <>
                <h4>탈퇴 시 모든 채용 데이터가 삭제됩니다</h4>
                <p>등록한 채용 공고와 임시저장 글이 모두 삭제됩니다. 진행 중인 공고는 먼저 마감해 주세요. 탈퇴 후 동일 이메일로 30일간 재가입이 제한되며, 삭제된 데이터는 복구되지 않습니다.</p>
              </>
            ) : (
              <>
                <h4>탈퇴 시 다음 데이터는 모두 삭제됩니다</h4>
                <p>계정 정보, 작성한 게시글·댓글, 즐겨찾기, 면허증 인증 기록, 1:1 문의 내역. 탈퇴 후 동일 이메일로 30일간 재가입이 제한되며, 삭제된 데이터는 복구되지 않습니다.</p>
              </>
            )}
          </div>
        </div>

        <h4 className="terms-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          회원탈퇴 약관
        </h4>
        <div className="terms-box" dangerouslySetInnerHTML={{ __html: termsHtml }} />

        <div className={`agree-row ${tried && !agree ? "err" : ""}`}>
          <label>
            <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); if (e.target.checked) setTried(false); }} />
            회원탈퇴 약관을 충분히 확인했으며, 이에 동의합니다.
          </label>
        </div>
        <p className={`agree-err ${tried && !agree ? "show" : ""}`}>탈퇴 약관에 동의해 주세요.</p>

        {!isCorp && (
          <div className="leave-section">
            <h4>탈퇴 사유 (선택)</h4>
            <div className="reason-grid">
              {reasonOptions.map((opt) => (
                <label key={opt.key}>
                  <input type="radio" name="reason" checked={reason === opt.key} onChange={() => setReason(opt.key)} />
                  {opt.label}
                </label>
              ))}
            </div>
            {/* 기타(etc) 선택 시에만 직접 입력 textarea 노출 */}
            {reason === "etc" && (
              <textarea className="reason-text" placeholder="탈퇴 사유를 자유롭게 작성해주세요. (선택)" value={reasonText} onChange={(e) => setReasonText(e.target.value)} />
            )}
          </div>
        )}

        {/* 고객사 피드백 6: 비밀번호 확인(본인 확인). SNS 계정은 비번이 없어 안내로 대체. */}
        <div className="leave-section">
          <h4>비밀번호 확인</h4>
          {isSns ? (
            <p className="leave-sns-note">SNS({me.snsProvider}) 계정은 비밀번호 확인 없이 탈퇴가 진행됩니다.</p>
          ) : (
            <>
              <PasswordInput
                className={`leave-pass${tried && pwErr ? " err" : ""}`}
                placeholder="본인 확인을 위해 비밀번호를 입력해주세요."
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (pwErr) setPwErr(""); }}
              />
              {pwErr && <p className="agree-err show">{pwErr}</p>}
            </>
          )}
        </div>

        <div className="leave-actions">
          <button type="button" className="btn-stay" onClick={() => router.push("/mypage")}>서비스 계속 이용하기</button>
          {/* BUG-3: disabled로 막으면 미동의 클릭 시 agree-err 안내가 도달 불가 → busy만 disable, 미동의는 onLeaveClick에서 err 표시 */}
          <button type="button" className="btn-leave" disabled={busy} onClick={onLeaveClick}>서비스 탈퇴하기</button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        variant="danger"
        title="정말 탈퇴하시겠습니까?"
        description="탈퇴 후에는 계정과 데이터를 복구할 수 없습니다."
        cancelLabel="아니오"
        confirmLabel="탈퇴하기"
        busy={busy}
        onCancel={() => !busy && setConfirmOpen(false)}
        onConfirm={runLeave}
      />
    </MyPageShell>
  );
}
