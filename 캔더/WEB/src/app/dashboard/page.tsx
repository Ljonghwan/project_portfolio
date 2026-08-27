"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- 스타일된 로고 링크는 네이티브 <a>.
   <Link> 의 <a> 에는 styled-jsx 스코프 해시가 안 붙어 .logo 스타일이 통째로 빠진다(front/CLAUDE.md). */

import { useRouter } from "next/navigation";
import { type ComponentType, type SVGProps, useEffect, useRef, useState } from "react";
import { AssetsView } from "@/components/dashboard/AssetsView";
import { ConversationsView } from "@/components/dashboard/ConversationsView";
import { dashStyles } from "@/components/dashboard/dashStyles";
import { DraftsView } from "@/components/dashboard/DraftsView";
import { LinksView } from "@/components/dashboard/LinksView";
import { ProfileView } from "@/components/dashboard/ProfileView";
import { ResumeOnboarding } from "@/components/dashboard/ResumeOnboarding";
import { WalletView } from "@/components/dashboard/WalletView";
import {
  IconBell,
  IconChat,
  IconCoin,
  IconDraft,
  IconFile,
  IconInfo,
  IconLink,
  IconLogout,
  IconUser,
} from "@/components/icons";
import { Prism } from "@/components/Prism";
import { SiteFooter } from "@/components/SiteFooter";
import {
  ApiError,
  getMe,
  getMyAlerts,
  getMyProfile,
  getWallet,
  listAssets,
  logout as apiLogout,
  markAlertsSeen,
  type ApiAlert,
  type ApiProfileFull,
  type ApiUser,
} from "@/lib/api";
import { fmtDateTime } from "@/lib/datetime";

type Tab = "links" | "profile" | "assets" | "drafts" | "conversations" | "wallet";

// 온보딩을 이미 보고 넘긴 사용자 표시(계정별). 저장까지 마치면 프로필이 채워져 조건 자체가 깨지지만,
// "나중에/건너뛰기"로 닫은 경우도 다시 뜨지 않아야 한다.
const onboardKey = (userId: string) => `candour:onboard:${userId}`;

// 이력서에서 채울 수 있는 항목이 전부 비어 있으면 "빈 프로필"(가입 직후). displayName 은 가입 시 빈 문자열로
// 두고 사용자가 프로필에서 직접 입력하므로(카드#019 2) 판정에서 제외한다 — 넣으면 이 화면이 온보딩을 못 띄운다.
const isBlankProfile = (p: ApiProfileFull): boolean =>
  !p.headline &&
  !p.summary &&
  !p.birthDate &&
  !p.education &&
  !p.career &&
  !p.certifications?.length &&
  !p.skills?.length;

// 서버 MIN_CREDITS_TO_ANSWER 미러 — 이보다 적으면 답변이 중단되므로 배너로 알린다.
const LOW_BALANCE = 50;

// 알림 한 줄 문구(카드#031). 회사명을 아는 알림은 "{회사}에서 …" 로 시작하고, 링크 단위 사건인
// auto_disabled 는 대화가 없어 링크 라벨로 말한다. 외래어+하다는 붙여쓰기(다운로드했습니다).
function alertText(a: ApiAlert): string {
  const who = a.companyName ? `${a.companyName}에서 ` : "";
  switch (a.kind) {
    case "resume_download":
      return `${who}이력서를 다운로드했습니다`;
    case "asset_download":
      return `${who}첨부 자료를 다운로드했습니다`;
    case "first_chat":
      return `${who}첫 질문이 도착했습니다`;
    case "auto_disabled":
      return `'${a.linkLabel ?? "링크"}' 링크가 자동으로 차단되었습니다`;
  }
}

// 보조 줄 — 어느 링크에서 일어난 일인지 + 시각. auto_disabled 는 위 문구가 이미 링크를 말하므로 시각만.
function alertMeta(a: ApiAlert): string {
  const at = fmtDateTime(a.createdAt);
  return a.kind !== "auto_disabled" && a.linkLabel ? `${a.linkLabel} · ${at}` : at;
}

// 탭바에 그리는 목록(카드#036 A — 6개 → 4개). 화면 값(Tab)과 1:1이 아니다:
// - profile·assets 는 "내 자료" 한 칸으로 합쳐 탭 안 세그먼트로 갈라진다(목적지는 profile).
// - wallet 은 상단바 잔액 칩이 대신한다.
const TABS: { id: Tab; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: "links", label: "링크", Icon: IconLink },
  { id: "profile", label: "내 자료", Icon: IconFile },
  // 지원서 작성(카드#035) — 등록해 둔 프로필·자료를 근거로 문항 답변 초안을 만든다.
  // 내 자료 다음에 둔다: 근거(프로필·자료)를 먼저 채워야 쓸 수 있는 기능이라 탭 순서가 곧 안내다.
  { id: "drafts", label: "지원서 작성", Icon: IconDraft },
  // ?tab=conversations 쿼리 값은 기존 URL 호환을 위해 그대로 둔다(라벨만 교체 — 모바일 바텀탭에서
  // 한 칸 폭이 좁아 2자로 줄였고, 크레딧 소비 열람은 화면 안 설명 문구가 안내한다).
  { id: "conversations", label: "대화", Icon: IconChat },
];

// 🔒 URL ?tab= 유효성은 **TABS 가 아니라 이 집합**으로 판정한다 — 탭바에서 빠진 assets·wallet 도
// 화면 값으로는 그대로 살아 있어서(세그먼트·잔액 칩·lowbanner 목적지) TABS 로 거르면 조용히 무시된다.
const TAB_IDS: Tab[] = ["links", "profile", "assets", "drafts", "conversations", "wallet"];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [tab, setTab] = useState<Tab>("links");
  const [balance, setBalance] = useState<number | null>(null); // 잔액 부족 배너용(WalletView 가 갱신)
  const [onboard, setOnboard] = useState<ApiProfileFull | null>(null); // 온보딩 오버레이(카드#002 E)
  // 온보딩이 프로필을 덮어쓰고 닫히면 이 값을 올려 ProfileView 를 리마운트한다(폼이 옛 값을 들고 있지 않게).
  const [profileVer, setProfileVer] = useState(0);
  // 알림함(카드#031). 🔒 미읽음 수는 **여기 한 곳**에서만 나온다 — 배지를 화면별로 다시 계산하지 않는다.
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  // 알림 클릭 시 대화 탭이 열 목적지. n 은 리마운트 key — 같은 알림을 다시 눌러도 다시 열린다.
  const [convFocus, setConvFocus] = useState<{
    linkId: string;
    conversationId: string;
    n: number;
  } | null>(null);
  const focusSeq = useRef(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      // URL ?tab= 복원 — 새로고침해도 보던 탭 유지(사이클9 버그3). 프리렌더 HTML(기본 links)과의
      // 하이드레이션 불일치를 피하려고 마운트 직후 마이크로태스크에서 반영(린트 set-state-in-effect 준수).
      await Promise.resolve();
      if (alive) {
        const t = new URLSearchParams(window.location.search).get("tab") as Tab | null;
        if (t && TAB_IDS.includes(t)) setTab(t);
      }
      try {
        const { user } = await getMe();
        if (!alive) return;
        setUser(user);
        setPhase("ready");
        // 배너 시드 — 실패해도 대시보드는 뜬다(지갑은 부가 정보).
        getWallet()
          .then((w) => alive && setBalance(w.balance))
          .catch(() => {});
        // 알림함 시드 — 폴링하지 않는다(새로고침·재진입 시 갱신). 실패해도 대시보드는 그대로.
        getMyAlerts()
          .then((r) => {
            if (!alive) return;
            setAlerts(r.alerts);
            setUnread(r.unreadCount);
          })
          .catch(() => {});
        // 온보딩(카드#002 E) — 프로필이 비어 있고 자료도 없는 신규 가입자에게 한 번만.
        // 실패해도 대시보드는 그대로(부가 기능).
        if (!localStorage.getItem(onboardKey(user.id))) {
          Promise.all([getMyProfile(), listAssets()])
            .then(([{ profile }, { assets }]) => {
              if (alive && assets.length === 0 && isBlankProfile(profile)) setOnboard(profile);
            })
            .catch(() => {});
        }
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 401) {
          router.replace("/login");
          return;
        }
        setPhase("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  // 알림 패널 닫기 — 바깥 클릭·ESC. 열려 있을 때만 구독한다.
  useEffect(() => {
    if (!bellOpen) return;
    const onDown = (e: MouseEvent) => {
      if (e.target instanceof Node && !bellRef.current?.contains(e.target)) setBellOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBellOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [bellOpen]);

  // 탭 전환 + URL 반영(?tab=) — 히스토리를 쌓지 않게 replaceState(사이클9 버그3).
  // 알림 목적지도 함께 비운다 — 사용자가 직접 대화 탭을 누른 건 "그 알림을 다시 열어달라"가 아니다.
  const selectTab = (id: Tab) => {
    setTab(id);
    setConvFocus(null);
    window.history.replaceState(null, "", id === "links" ? "/dashboard" : `/dashboard?tab=${id}`);
  };

  // "내 자료" 칸은 화면 값 둘(profile·assets)을 품는다 — 활성 표시만 매핑하면 되고 state 는 그대로 하나다.
  const tabOn = (id: Tab) => (id === "profile" ? tab === "profile" || tab === "assets" : tab === id);

  // 패널을 여는 즉시 읽음 처리 — 배지는 낙관적으로 0(실패해도 다음 진입에 서버 값으로 되돌아온다).
  const toggleBell = () => {
    const next = !bellOpen;
    setBellOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      markAlertsSeen().catch(() => {});
    }
  };

  // 알림 클릭 → 그 사건이 일어난 자리로. 대화가 있으면 대화 탭에서 바로 열고,
  // 링크 단위 사건(auto_disabled)은 링크 탭으로만 보낸다.
  const openAlert = (a: ApiAlert) => {
    setBellOpen(false);
    if (!a.conversationId) {
      selectTab("links");
      return;
    }
    // n 은 **단조 증가**여야 한다 — selectTab 이 목적지를 비운 직후라 이전 값에서 +1 하면 항상 1 이 되어
    // 두 번째 알림부터 key 가 그대로고 화면이 안 움직인다(setState 배칭).
    focusSeq.current += 1;
    selectTab("conversations"); // convFocus 를 비우므로 목적지는 이 다음에 세운다.
    setConvFocus({ linkId: a.linkId, conversationId: a.conversationId, n: focusSeq.current });
  };

  const onLogout = async () => {
    try {
      await apiLogout();
    } catch {
      /* 무시 — 쿠키는 어차피 삭제 */
    }
    router.replace("/login");
  };

  return (
    <div className="dash">
      <div className="topbar">
        {/* 로고=홈(카드#019 7). 네이티브 <a> — <Link> 의 <a> 에는 스코프 해시가 안 붙어 .logo 가 죽는다. */}
        <a className="logo" href="/">
          <span className="mark">
            <Prism />
          </span>{" "}
          Candour
        </a>
        {user && (
          <div className="right">
            {/* 크레딧 잔액 칩(카드#036 A) — 탭바에서 빠진 크레딧 탭의 상시 진입점.
                진입 시 이미 받아 둔 balance 를 그대로 쓴다(추가 호출 0). null=로딩 전이면 아예 렌더하지
                않는다 — 자리를 예약하면 값이 없을 때 빈 칸이 남고, 예약 안 하면 도착 시 한 번 밀리는데
                벨·이름·로그아웃이 전부 오른쪽 정렬이라 밀리는 쪽은 왼쪽 여백뿐이다. */}
            {balance !== null && (
              <button
                type="button"
                className={"balchip" + (balance < LOW_BALANCE ? " low" : "")}
                onClick={() => selectTab("wallet")}
                aria-label={`크레딧 ${balance.toLocaleString()} — 충전하기`}
              >
                <IconCoin width={14} height={14} />
                <b>{balance.toLocaleString()}</b>
                <span className="bcu">크레딧</span>
              </button>
            )}
            {/* 알림함(카드#031) — 이름 왼쪽. .right 가 이미 오른쪽 정렬이라 여기서 margin-left:auto 를
                다시 주지 않는다(두 번째 auto 는 요소 사이를 벌린다). */}
            <div className="bellwrap" ref={bellRef}>
              <button
                type="button"
                className={"bell" + (bellOpen ? " on" : "")}
                onClick={toggleBell}
                aria-label={unread > 0 ? `알림 ${unread}건` : "알림"}
                aria-expanded={bellOpen}
              >
                <IconBell width={17} height={17} />
                {unread > 0 && <span className="bdot">{unread > 99 ? "99+" : unread}</span>}
              </button>
              {bellOpen && (
                <div className="albox">
                  <div className="alhead">알림</div>
                  {alerts.length === 0 ? (
                    <div className="alempty">아직 알림이 없습니다</div>
                  ) : (
                    <div className="allist">
                      {alerts.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className="alrow"
                          onClick={() => openAlert(a)}
                        >
                          <div className="altx">{alertText(a)}</div>
                          <div className="almeta">{alertMeta(a)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* 이름은 가입 시 빈 문자열 — `??` 로는 폴백이 안 걸린다(카드#019 2). */}
            {/* `님` 을 .uname 안에 넣어야 한다 — .right 직속이면 익명 flex item 이 되어 이름과 gap 12px 만큼 벌어진다. */}
            <span className="uname">
              <span className="who">{user.displayName || "사용자"}</span>님
            </span>
            <button type="button" className="logout" onClick={onLogout} aria-label="로그아웃">
              <IconLogout width={15} height={15} />
              <span className="ltx">로그아웃</span>
            </button>
          </div>
        )}
      </div>

      {balance !== null && balance < LOW_BALANCE && tab !== "wallet" && (
        <button type="button" className="lowbanner" onClick={() => selectTab("wallet")}>
          <IconInfo width={15} height={15} />
          크레딧이 부족해 인사담당자 질문에 답변이 중단될 수 있습니다. 충전하기 →
        </button>
      )}

      <div className="tabs" role="tablist" aria-label="대시보드 메뉴">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tabOn(t.id)}
            className={"tab" + (tabOn(t.id) ? " on" : "")}
            onClick={() => selectTab(t.id)}
          >
            <t.Icon width={15} height={15} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="wrap">
        {phase === "loading" && (
          <div className="state">
            <div className="spin" />
            <p>불러오는 중…</p>
          </div>
        )}
        {phase === "error" && (
          <div className="state">
            <p>대시보드를 불러오지 못했습니다.</p>
          </div>
        )}
        {phase === "ready" && tab === "links" && <LinksView />}
        {/* "내 자료" 탭 안 전환(카드#036 A). 별도 state 없이 selectTab 을 그대로 쓴다 —
            그래야 ?tab= 도 세그먼트를 따라오고 새로고침·뒤로가기에서 보던 쪽이 그대로 열린다. */}
        {phase === "ready" && (tab === "profile" || tab === "assets") && (
          <div className="addseg subseg" role="tablist" aria-label="내 자료 보기 전환">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "profile"}
              className={tab === "profile" ? "on" : ""}
              onClick={() => selectTab("profile")}
            >
              <IconUser width={15} height={15} />
              프로필
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "assets"}
              className={tab === "assets" ? "on" : ""}
              onClick={() => selectTab("assets")}
            >
              <IconFile width={15} height={15} />
              자료
            </button>
          </div>
        )}
        {phase === "ready" && tab === "profile" && (
          <ProfileView
            key={profileVer}
            onName={(n) => setUser((u) => (u ? { ...u, displayName: n } : u))}
            onRerunOnboard={setOnboard}
          />
        )}
        {phase === "ready" && tab === "assets" && <AssetsView />}
        {/* 잔액 부족으로 생성이 막히면 크레딧 탭으로 보낸다(lowbanner 와 같은 유도). */}
        {phase === "ready" && tab === "drafts" && (
          <DraftsView onGoWallet={() => selectTab("wallet")} />
        )}
        {/* key — 알림에서 들어올 때마다 새로 마운트해 그 링크·대화를 연다(같은 알림 재클릭 포함). */}
        {phase === "ready" && tab === "conversations" && (
          <ConversationsView key={convFocus?.n ?? 0} focus={convFocus} />
        )}
        {phase === "ready" && tab === "wallet" && <WalletView onBalance={setBalance} />}
      </div>

      {/* 폭은 본문 .wrap 과 같은 920px — 탭 카드와 좌우 경계를 맞춘다 */}
      <SiteFooter maxWidth={920} />

      {onboard && user && (
        <ResumeOnboarding
          profile={onboard}
          onClose={(savedName) => {
            localStorage.setItem(onboardKey(user.id), "1");
            setOnboard(null);
            // 저장했다면 헤더 표시명을 갱신하고, 방금 채운 프로필을 바로 확인하도록 탭을 옮긴다.
            if (savedName) {
              setUser((u) => (u ? { ...u, displayName: savedName } : u));
              setProfileVer((v) => v + 1);
              selectTab("profile");
            }
          }}
        />
      )}

      <style jsx>{dashStyles}</style>
      <style jsx>{`
        /* 내용이 짧은 탭·로딩 상태에서도 푸터가 화면 아래에 붙어 있게(중간에 뜨지 않게) */
        .dash {
          display: flex;
          flex-direction: column;
        }
        .dash .wrap {
          flex: 1 0 auto;
          width: 100%;
        }
        .lowbanner {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--warn-t);
          border: none;
          border-bottom: 1px solid #f4d9be;
          color: var(--warn);
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 700;
          padding: 10px 16px;
          cursor: pointer;
        }
        .lowbanner :global(svg) {
          stroke: var(--warn);
          flex: 0 0 auto;
        }
        .lowbanner:hover {
          background: #fbe6d4;
        }
      `}</style>
    </div>
  );
}
