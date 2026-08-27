"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export default function PhoneVerifyField({
  phone,
  onChangePhone,
  verified,
  onVerified,
}: {
  phone: string;
  onChangePhone: (v: string) => void;
  verified: boolean;
  onVerified: (ok: boolean) => void;
}) {
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (secondsLeft <= 0) return;
    timerRef.current = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sent]);

  async function send() {
    setError(null);
    onVerified(false);
    if (!/^01\d{8,9}$/.test(phone)) {
      setError("휴대폰번호 형식이 올바르지 않습니다.");
      return;
    }
    const res = await api.post<{ expiresAt: string }>("/api/verify/phone/send", { phone });
    if (!res.success) {
      setError(res.message || "인증번호 발송에 실패했습니다.");
      return;
    }
    setSent(true);
    setSecondsLeft(300); // 서버 만료 5분과 일치(구 180s)
  }

  async function confirm() {
    setError(null);
    if (!code) {
      setError("인증번호를 입력하세요.");
      return;
    }
    const res = await api.post<{ verified: boolean }>("/api/verify/phone/confirm", { phone, code });
    if (!res.success || !res.data?.verified) {
      setError(res.message || "인증번호가 일치하지 않습니다.");
      onVerified(false);
      return;
    }
    onVerified(true);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <>
      <div className="field">
        <label>휴대폰번호<span className="req">*</span></label>
        <div className="row-with-btn">
          <div className="input-box">
            <input
              type="tel"
              inputMode="numeric"
              maxLength={11}
              placeholder="휴대폰번호 (- 없이 입력)"
              value={phone}
              onChange={(e) => { onChangePhone(e.target.value.replace(/\D/g, "")); onVerified(false); }}
              readOnly={verified}
            />
          </div>
          <button
            type="button"
            className={`verify-btn ${verified ? "done" : ""}`}
            onClick={send}
            disabled={verified}
          >
            {verified ? "인증완료" : sent ? "재발송" : "인증"}
          </button>
        </div>
      </div>

      {sent && !verified && (
        <div className="field">
          <label>인증번호 입력<span className="req">*</span></label>
          <div className="row-with-btn">
            <div className="input-box">
              <input type="text" inputMode="numeric" placeholder="인증번호 6자리" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} maxLength={6} />
              {secondsLeft > 0 && <span className="timer">{mm}:{ss}</span>}
            </div>
            <button type="button" className="verify-btn" onClick={confirm}>확인</button>
          </div>
          {error && <div className="help">{error}</div>}
        </div>
      )}
      {!sent && error && <div className="help" style={{ marginTop: -8, marginBottom: 14 }}>{error}</div>}
    </>
  );
}
