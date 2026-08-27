"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import {
  IconCheck,
  IconClose,
  IconDownload,
  IconEdit,
  IconExternal,
  IconFile,
  IconInfo,
  IconLink,
  IconPlay,
  IconReissue,
  IconTrash,
  IconUpload,
} from "@/components/icons";
import {
  addLinkAsset,
  ApiError,
  assetFileUrl,
  assetThumbUrl,
  deleteAsset,
  listAssets,
  reingestAsset,
  updateAsset,
  uploadAsset,
  type AssetQuota,
  type OwnedAsset,
} from "@/lib/api";
import { dashStyles } from "./dashStyles";

// 서버 validateUpload 가 허용하는 형식 미러 — ResumeOnboarding 의 ACCEPT 와 항상 같은 값이어야 한다
// (한쪽만 빠지면 서버는 받는데 파일 선택창이 막는다). 드롭 핸들러는 없어 이 accept 가 유일한 클라이언트 게이트.
const ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,application/pdf,.txt,.md,.markdown,.docx,.pptx,.xlsx,.hwpx,text/plain";

function fmtSize(n?: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

// 한도 요약은 항상 MB 한 단위로 — fmtSize 는 값에 따라 단위가 바뀌어(512 KB) 게이지 옆 큰 숫자의
// 자릿수가 들쭉날쭉해진다.
const toMb = (n: number): number => n / 1048576;

// 분석이 끝나지 않은 자료 — 삭제 외 액션을 막고 진행 상태를 덮어 보여준다.
function isIngesting(a: OwnedAsset): boolean {
  return a.ingestStatus === "pending" || a.ingestStatus === "processing";
}

function kindTag(a: OwnedAsset): string {
  if (a.kind === "video") return "영상";
  if (a.viewerKind === "link") return "LINK";
  if (a.viewerKind === "image") return "IMAGE";
  if (a.viewerKind === "pdf") return "PDF";
  const ext = a.originalName?.split(".").pop()?.toUpperCase();
  return ext && ext.length <= 5 ? ext : "FILE";
}

export function AssetsView() {
  const [assets, setAssets] = useState<OwnedAsset[]>([]);
  const [quota, setQuota] = useState<AssetQuota | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [mode, setMode] = useState<"file" | "link" | "video">("file");
  // 파일 업로드
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [sub, setSub] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // 링크
  const [lUrl, setLUrl] = useState("");
  const [lTitle, setLTitle] = useState("");
  const [lSub, setLSub] = useState("");
  const [lBusy, setLBusy] = useState(false);
  const [lErr, setLErr] = useState<string | null>(null);

  const reload = async () => {
    const { assets, quota } = await listAssets();
    setAssets(assets);
    setQuota(quota);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await reload();
        if (alive) setPhase("ready");
      } catch {
        if (alive) setPhase("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 분석 중인 자료가 하나라도 있으면 3초마다 목록을 다시 읽어 진행 상태를 갱신한다.
  // 전부 끝나면(anyBusy=false) 인터벌 자체가 해제되고, 탭이 숨겨져 있는 동안은 호출하지 않는다.
  const anyBusy = assets.some(isIngesting);
  useEffect(() => {
    if (!anyBusy) return;
    const timer = setInterval(async () => {
      if (document.hidden) return;
      try {
        await reload();
      } catch {
        /* 일시 실패는 다음 주기에 재시도 */
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [anyBusy]);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !titleEdited) setTitle(f.name.replace(/\.[^.]+$/, ""));
    setErr(null);
  };

  const upload = async () => {
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      await uploadAsset(file, { title: title.trim() || file.name, sub: sub.trim() || undefined });
      setFile(null);
      setTitle("");
      setTitleEdited(false);
      setSub("");
      if (fileRef.current) fileRef.current.value = "";
      await reload();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "업로드에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const addLink = async (kind: "link" | "video") => {
    setLErr(null);
    setLBusy(true);
    try {
      await addLinkAsset({ title: lTitle.trim(), sub: lSub.trim() || undefined, url: lUrl.trim(), kind });
      setLUrl("");
      setLTitle("");
      setLSub("");
      await reload();
    } catch (e) {
      setLErr(e instanceof ApiError ? e.message : "등록에 실패했습니다.");
    } finally {
      setLBusy(false);
    }
  };

  const remove = async (a: OwnedAsset) => {
    if (!window.confirm(`"${a.title}" 자료를 삭제할까요?`)) return;
    try {
      await deleteAsset(a.id);
      await reload(); // 목록에서 빼는 것만으론 부족 — 삭제로 회수된 저장 용량이 상단 표시에 바로 반영돼야 한다
    } catch {
      /* 무시 */
    }
  };

  // 제목/설명만 갱신 — 인제스션은 다시 돌지 않으므로 오타 수정엔 등록 횟수가 소모되지 않는다.
  const save = async (a: OwnedAsset, meta: { title: string; sub?: string }) => {
    const { asset } = await updateAsset(a.id, meta);
    setAssets((prev) => prev.map((x) => (x.id === asset.id ? asset : x)));
  };

  const retry = async (a: OwnedAsset) => {
    try {
      const { asset } = await reingestAsset(a.id);
      setAssets((prev) => prev.map((x) => (x.id === asset.id ? asset : x)));
    } catch {
      await reload().catch(() => {}); // 409(이미 분석 중) 등 — 실제 상태로 맞춘다
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
        <p>자료를 불러오지 못했습니다.</p>
        <style jsx>{dashStyles}</style>
      </div>
    );
  }

  // 한도 요약 파생값. 게이지는 100% 에서 자른다 — 초과분까지 그리면 바가 카드를 넘어간다.
  // 초과 상태는 남은 용량이 음수가 되므로 문구를 "용량 초과 N MB" 로 바꿔 보여준다.
  const over = quota != null && quota.usedBytes > quota.limitBytes;
  const usedPct = quota ? Math.min(100, (quota.usedBytes / quota.limitBytes) * 100) : 0;

  return (
    <>
      <div className="head">
        <div>
          <h1>자료</h1>
          {/* 한도는 우측 요약 블록이 말한다 — 문구에 상한을 박아두면 값이 바뀔 때마다 어긋난다.
              파일 1개 상한은 아래 .upzone 안내가 담당. */}
          <div className="sub">
            이력서·경력기술서·포트폴리오. 이미지·PDF·문서(docx/pptx/xlsx/hwpx)·txt/md·링크.
          </div>
        </div>
        {quota ? (
          <div className={"qsum" + (over ? " over" : usedPct >= 80 ? " warn" : "")}>
            <div className="qsl">
              {over ? "용량 초과" : "남은 저장 용량"}
              <span className="big">
                {toMb(Math.abs(quota.limitBytes - quota.usedBytes)).toFixed(1)}
                <em>MB</em>
              </span>
            </div>
            <div className="qsbar">
              <i style={{ width: `${usedPct}%` }} />
            </div>
            <div className="qsfoot">
              <IconUpload width={13} height={13} />
              오늘 등록
              <b className={quota.todayCount >= quota.dailyLimit ? "done" : ""}>
                {quota.todayCount} / {quota.dailyLimit}회
              </b>
            </div>
          </div>
        ) : (
          // quota 를 못 받은 경우에도 자리를 비워 둬 목록이 위로 튀지 않는다.
          <div className="qsum empty" />
        )}
      </div>

      <div className="notice" role="note">
        <IconInfo width={16} height={16} />
        <span>
          자료를 삭제하면 이후 답변 검색에서는 제외됩니다. 다만 <b>이미 발송된 답변에 인용된 근거</b>는
          기록 무결성을 위해 해당 대화에 그대로 남습니다.
        </span>
      </div>

      <div className="addseg" role="tablist" aria-label="자료 추가 방식">
        <button type="button" className={mode === "file" ? "on" : ""} onClick={() => setMode("file")}>
          <IconUpload width={15} height={15} />
          파일 업로드
        </button>
        <button type="button" className={mode === "link" ? "on" : ""} onClick={() => setMode("link")}>
          <IconLink width={15} height={15} />
          링크 추가
        </button>
        <button type="button" className={mode === "video" ? "on" : ""} onClick={() => setMode("video")}>
          <IconPlay width={15} height={15} />
          영상 링크
        </button>
      </div>

      {mode === "file" ? (
        <div className="upzone">
          <div className="upic">
            <IconUpload width={22} height={22} />
          </div>
          <div className="uptx">
            <b>{file ? file.name : "파일을 선택해 업로드"}</b>
            {/* 허용 형식은 위 .sub 안내와 input accept 가 이미 말한다 — 여기 몫은 파일 1개 상한뿐 */}
            <p>파일 1개 최대 20MB</p>
            <div className="upfields">
              <input placeholder="제목" value={title} onChange={(e) => { setTitle(e.target.value); setTitleEdited(true); }} />
              <input placeholder="설명(선택)" value={sub} onChange={(e) => setSub(e.target.value)} />
              <button type="button" className="act" onClick={() => fileRef.current?.click()}>
                파일 선택
              </button>
              <button
                type="button"
                className="nf-submit"
                style={{ width: "auto", padding: "9px 18px" }}
                onClick={upload}
                disabled={busy || !file || !title.trim()}
              >
                {busy ? "업로드 중…" : "업로드"}
              </button>
            </div>
            {err && <div className="nf-err" style={{ marginTop: 8 }}>{err}</div>}
          </div>
          <input ref={fileRef} type="file" accept={ACCEPT} onChange={onPick} style={{ display: "none" }} />
        </div>
      ) : (
        <div className="upzone">
          <div className="upic">{mode === "video" ? <IconPlay width={22} height={22} /> : <IconLink width={22} height={22} />}</div>
          <div className="uptx">
            <b>{mode === "video" ? "영상 링크 추가" : "링크 자료 추가"}</b>
            <p>
              {mode === "video"
                ? "영상 파일은 올릴 수 없습니다. 유튜브·비메오처럼 공개된 영상 주소를 등록해 주세요. 설명은 필수입니다."
                : "http(s) 공개 주소만 (포트폴리오·데모·블로그 링크 등)"}
            </p>
            <div className="upfields">
              <input
                placeholder={mode === "video" ? "영상 주소" : "자료 주소"}
                value={lUrl}
                onChange={(e) => setLUrl(e.target.value)}
              />
              <input placeholder="제목" value={lTitle} onChange={(e) => setLTitle(e.target.value)} />
              <input
                placeholder={
                  mode === "video"
                    ? "무엇을 보여주는 영상인지 한 줄로"
                    : "설명(선택)"
                }
                value={lSub}
                onChange={(e) => setLSub(e.target.value)}
              />
              <button
                type="button"
                className="nf-submit"
                style={{ width: "auto", padding: "9px 18px" }}
                onClick={() => addLink(mode === "video" ? "video" : "link")}
                disabled={
                  lBusy || !lUrl.trim() || !lTitle.trim() || (mode === "video" && !lSub.trim())
                }
              >
                {lBusy ? "등록 중…" : mode === "video" ? "영상 등록" : "링크 등록"}
              </button>
            </div>
            {lErr && <div className="nf-err" style={{ marginTop: 8 }}>{lErr}</div>}
          </div>
        </div>
      )}

      {assets.length === 0 ? (
        <div className="empty">등록된 자료가 없습니다. 위에서 파일이나 링크를 추가하세요.</div>
      ) : (
        <div className="assetgrid">
          {assets.map((a) => (
            <AssetCard key={a.id} a={a} onRemove={remove} onRetry={retry} onSave={save} />
          ))}
        </div>
      )}
      <style jsx>{dashStyles}</style>
    </>
  );
}

function AssetCard({
  a,
  onRemove,
  onRetry,
  onSave,
}: {
  a: OwnedAsset;
  onRemove: (a: OwnedAsset) => void;
  onRetry: (a: OwnedAsset) => void;
  onSave: (a: OwnedAsset, meta: { title: string; sub?: string }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState(a.title);
  const [eSub, setESub] = useState(a.sub ?? "");
  const [eBusy, setEBusy] = useState(false);
  const [eErr, setEErr] = useState<string | null>(null);
  const isImg = a.hasFile && a.viewerKind === "image";
  const isLink = a.viewerKind === "link";
  const isVideo = a.kind === "video"; // viewerKind 는 'link' 그대로 — 판별은 kind(카드#009 D)
  const inlineView = a.viewerKind === "image" || a.viewerKind === "pdf"; // 브라우저 내장 뷰어
  const busy = isIngesting(a);
  const failed = a.ingestStatus === "failed";

  const startEdit = () => {
    setETitle(a.title);
    setESub(a.sub ?? "");
    setEErr(null);
    setEditing(true);
  };

  const commit = async () => {
    setEErr(null);
    setEBusy(true);
    try {
      await onSave(a, { title: eTitle.trim(), sub: eSub.trim() || undefined });
      setEditing(false);
    } catch (e) {
      setEErr(e instanceof ApiError ? e.message : "수정에 실패했습니다.");
    } finally {
      setEBusy(false);
    }
  };

  return (
    <div className="acard">
      <div className="athumb" style={!a.hasFile && !isLink && a.gradient ? { background: a.gradient } : undefined}>
        {isImg ? (
          // eslint-disable-next-line @next/next/no-img-element -- 인증 파일 엔드포인트(same-site 쿠키), next/image 부적합
          <img src={assetFileUrl(a.id)} alt={a.title} />
        ) : isVideo && a.hasThumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- 인증 썸네일 엔드포인트(same-site 쿠키)
          <img src={assetThumbUrl(a.id)} alt="" />
        ) : (
          <span className="ph">
            {isVideo ? <IconPlay /> : isLink ? <IconLink /> : <IconFile />}
            {kindTag(a)}
          </span>
        )}
        {isVideo && (
          <span className="playbadge" aria-hidden="true">
            <IconPlay width={30} height={30} />
          </span>
        )}
        <span className="kindtag">{kindTag(a)}</span>
        {failed && <span className="failtag">분석 실패</span>}
        {busy && (
          <div className="aover">
            <div className="spin" />
            <span>분석 중{a.ingestProgress ? ` ${a.ingestProgress}` : ""}</span>
          </div>
        )}
      </div>
      <div className="abody">
        {editing ? (
          <div className="aedit">
            {/* 등록 폼과 같은 안내 문구·같은 필수 기준(영상은 설명 필수 — 서버 videoMetaSchema 와 일치) */}
            {/* autoFocus: "수정" 을 누른 직후에만 마운트되는 필드라 포커스 이동이 곧 기대 동작 */}
            <input
              autoFocus
              aria-label="자료 제목"
              placeholder="제목"
              value={eTitle}
              onChange={(e) => setETitle(e.target.value)}
            />
            <input
              aria-label="자료 설명"
              placeholder={isVideo ? "무엇을 보여주는 영상인지 한 줄로" : "설명(선택)"}
              value={eSub}
              onChange={(e) => setESub(e.target.value)}
            />
            {eErr && <div className="nf-err">{eErr}</div>}
          </div>
        ) : (
          <>
            <div className="atitle">{a.title}</div>
            {a.sub && <div className="asub">{a.sub}</div>}
          </>
        )}
        {a.ingestError && !busy && (
          <div className={"anote" + (failed ? " fail" : "")}>{a.ingestError}</div>
        )}
        <div className={"ameta" + (isLink ? " url" : "")}>
          {isLink
            ? a.sourceUrl
            : a.originalName
              ? `${a.originalName} · ${fmtSize(a.sizeBytes)}`
              : "샘플 자료"}
        </div>
      </div>
      <div className="aacts">
        {editing ? (
          <>
            <button
              type="button"
              className="act primary"
              onClick={commit}
              disabled={eBusy || !eTitle.trim() || (isVideo && !eSub.trim())}
            >
              <IconCheck width={14} height={14} />
              {eBusy ? "저장 중…" : "저장"}
            </button>
            <button type="button" className="act" onClick={() => setEditing(false)} disabled={eBusy}>
              <IconClose width={14} height={14} />
              취소
            </button>
          </>
        ) : (
          <>
            {/* 분석 중에는 삭제만 허용 — 원본 열람·수정은 분석이 끝난 뒤에 */}
            {busy ? null : isLink && a.sourceUrl ? (
              <a className="act" href={a.sourceUrl} target="_blank" rel="noopener noreferrer">
                {isVideo ? <IconPlay width={14} height={14} /> : <IconExternal width={14} height={14} />}
                {isVideo ? "영상 열기" : "열기"}
              </a>
            ) : a.hasFile ? (
              <a className="act" href={assetFileUrl(a.id)} target="_blank" rel="noopener noreferrer">
                {inlineView ? <IconExternal width={14} height={14} /> : <IconDownload width={14} height={14} />}
                {inlineView ? "원본" : "다운로드"}
              </a>
            ) : null}
            {failed && (
              <button type="button" className="act" onClick={() => onRetry(a)}>
                <IconReissue width={14} height={14} />
                다시 시도
              </button>
            )}
            {/* 제목/설명 수정 — 삭제+재등록 하면 인제스션이 다시 돌아 등록 횟수를 한 번 더 쓴다 */}
            {!busy && (
              <button type="button" className="act" onClick={startEdit}>
                <IconEdit width={14} height={14} />
                수정
              </button>
            )}
            <button type="button" className="act danger" onClick={() => onRemove(a)}>
              <IconTrash width={14} height={14} />
              삭제
            </button>
          </>
        )}
      </div>
      <style jsx>{dashStyles}</style>
    </div>
  );
}
