// 대시보드 공용 스타일(styled-jsx 문자열). 각 뷰가 `<style jsx>{dashStyles}</style>` 로 사용.
// Candour 토큰(globals.css) 기반. 이모지 없이 SVG 아이콘.
export const dashStyles = `
  .dash{min-height:100dvh;background:var(--bg2);color:var(--ink)}
  .topbar{position:sticky;top:0;z-index:40;height:56px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:12px;padding:0 24px}
  .logo{font-weight:800;font-size:17px;color:var(--ink);text-decoration:none;display:flex;align-items:center;gap:8px;letter-spacing:-.02em}
  .logo .mark{width:26px;height:26px;border-radius:7px;background:var(--ink);color:#fff;display:grid;place-items:center}
  .logo .mark :global(svg){width:18px;height:18px}
  .logo:focus-visible{outline:2px solid var(--blue);outline-offset:3px;border-radius:6px}
  .topbar .right{margin-left:auto;min-width:0;display:flex;align-items:center;gap:12px;font-size:13.5px;color:var(--ink2)}
  /* .uname 이 없으면 "님" 이 .right 의 익명 flex item 이 되어 이름과 12px 벌어진다(카드#026 마스터 지적).
     nowrap 없이는 10자 이상 이름이 두 줄로 갈라지고(375px 실측), .who 의 overflow:hidden 이
     flex 최소폭을 0 으로 풀어 이름만 말줄임되고 "님" 은 남는다. */
  .topbar .uname{display:flex;min-width:0;white-space:nowrap}
  .topbar .who{font-weight:700;overflow:hidden;text-overflow:ellipsis}
  /* flex-shrink:0 — .right 의 min-width:0 이 풀어준 축소 여지를 버튼이 먹으면 라벨이 두 줄로 갈라진다(375px 실측).
     줄어들 대상은 .uname(이름 말줄임) 하나뿐이어야 한다. */
  .logout{display:inline-flex;flex-shrink:0;align-items:center;gap:6px;color:var(--muted);border:1px solid var(--line2);background:#fff;border-radius:9px;padding:7px 12px;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:var(--t)}
  .logout:hover{border-color:var(--blue);color:var(--blue-d)}
  .logout :global(svg){stroke:currentColor}
  /* ── 크레딧 잔액 칩(카드#036 A) ── 탭바에서 빠진 크레딧 탭의 상시 진입점.
     .logout 과 같은 pill 토큰. flex-shrink:0 도 같은 이유 — 줄어들 대상은 .uname 하나뿐이다. */
  .balchip{display:inline-flex;flex-shrink:0;align-items:center;gap:6px;color:var(--ink2);border:1px solid var(--line2);background:#fff;border-radius:9px;padding:7px 11px;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:var(--t)}
  .balchip b{font-weight:800;font-variant-numeric:tabular-nums} /* 잔액이 바뀌어도 폭이 흔들리지 않게 */
  .balchip svg{stroke:currentColor;flex:0 0 auto} /* :global() 금지 — 외부상수 스타일에선 규칙이 통째로 죽는다 */
  .balchip:hover{border-color:var(--blue);color:var(--blue-d)}
  /* 잔액 부족은 lowbanner 와 같은 warn 토큰 — 배너와 칩이 같은 사건을 말한다. */
  .balchip.low{border-color:#f4d9be;background:var(--warn-t);color:var(--warn)}
  /* 상단바 폭 예산(카드#036 A) — 잔액 칩이 들어오면서 360px 에서 로그아웃이 뷰포트 밖으로 74px 밀려났다
     (body 가 overflow-x:clip 이라 스크롤도 안 생기고 그냥 잘린다). 좁은 화면에서는 두 라벨을 접어
     자리를 되돌린다: 칩은 코인 아이콘이 단위를 말하고, 로그아웃은 aria-label 로 이름이 남는다.
     줄어들 대상은 여전히 .uname 하나뿐이다(위 flex-shrink 주석). */
  @media(max-width:640px){
    .balchip .bcu,.logout .ltx{display:none}
    /* 라벨이 빠지면 높이가 텍스트 줄높이를 잃어 36 → 31px 로 주저앉는다(터치 타깃·칩/벨과의 높이 정렬).
       폭은 그대로 두고 세로만 되돌린다. */
    .logout{min-height:36px}
  }
  /* 라벨 두 개를 접어도 360px 에서는 우패딩까지 10.8px 모자란다. 이름은 이 폭에서 이미 min-width:0 으로
     짜부라져 **폭 0**(= 안 보임)인데 gap 12px 만 먹고 있으므로 접는다 — 이름이 온전히 들어가는
     421px 이상에서는 종전대로 말줄임으로 남는다(실측: 칩·벨·로그아웃 + 로고 = 350.8px). */
  @media(max-width:420px){
    .topbar .uname{display:none}
    .topbar .right{gap:8px}
  }
  /* 320px(최소 지원폭)은 라벨을 다 접고도 6.8px 이 모자란다 — 이 구간에서만 상단바 좌우 여백을 줄인다.
     360px 이상은 본문(.wrap)과 같은 24px 를 그대로 유지한다. */
  @media(max-width:359px){
    .topbar{padding:0 14px}
  }
  /* ── 알림함(카드#031) — 상단바 벨 + 드롭다운 ──
     벨은 이미 margin-left:auto 로 오른쪽에 붙은 .right 안에 들어간다 → auto 를 새로 주지 않는다.
     두 번째 auto 는 남는 공간을 두 요소 사이에 나눠 넣어 벌린다(카드#027 A 와 같은 함정).
     flex-shrink:0 은 .logout 과 같은 이유 — 줄어들 대상은 .uname(이름 말줄임) 하나뿐이다. */
  .bellwrap{position:relative;display:flex;flex-shrink:0}
  .bell{position:relative;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border:1px solid var(--line2);background:#fff;border-radius:9px;color:var(--muted);cursor:pointer;padding:0;transition:var(--t)}
  .bell:hover,.bell.on{border-color:var(--blue);color:var(--blue-d)}
  .bell svg{stroke:currentColor} /* :global() 금지 — 외부상수 스타일에선 규칙이 통째로 죽는다 */
  /* 배지는 벨 모서리에 **겹친다** — 흐름에 자리를 차지하면 옆 이름과의 12px gap 이 배지 폭만큼 더 벌어진다. */
  .bdot{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--danger);color:#fff;font-size:10.5px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}
  .albox{position:absolute;top:calc(100% + 9px);right:0;width:320px;max-width:calc(100vw - 32px);background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 12px 32px rgba(14,21,36,.14);overflow:hidden;z-index:50}
  .alhead{padding:12px 14px;font-size:12.5px;font-weight:800;color:var(--ink);border-bottom:1px solid var(--line)}
  .allist{max-height:min(58vh,360px);overflow-y:auto}
  .alrow{display:block;width:100%;text-align:left;background:#fff;border:none;border-bottom:1px solid var(--line);padding:11px 14px;font-family:inherit;cursor:pointer;transition:var(--t)}
  .alrow:last-child{border-bottom:none}
  .alrow:hover{background:var(--bg2)}
  .alrow:focus-visible{outline:2px solid var(--blue);outline-offset:-2px}
  /* overflow-wrap:anywhere — 두 줄 다 사용자 입력을 그대로 싣는다(회사명 = HR 이 비로그인으로 넣는 값,
     링크 이름 = 지원자 입력. 서버 상한은 각 120자라 공백 없는 한 덩어리면 320px 패널을 가로로 뚫는다).
     break-word 가 아니라 anywhere — 일반 문구의 줄바꿈 모양은 그대로고 긴 한 덩어리에서만 끊긴다. */
  .altx{font-size:12.5px;font-weight:600;color:var(--ink);line-height:1.5;overflow-wrap:anywhere}
  .almeta{font-size:11.5px;color:var(--muted);margin-top:3px;overflow-wrap:anywhere}
  .alempty{padding:26px 14px;text-align:center;font-size:12.5px;color:var(--muted)}
  /* 벨은 .right 안쪽(로그아웃 버튼 왼쪽)이라 오른쪽 정렬 패널이 좁은 화면에서 왼쪽으로 넘친다.
     640px 이하는 뷰포트 기준 fixed 로 좌우 16px 을 남겨 넘침 자체를 없앤다(sticky 조상은 fixed 의
     컨테이닝 블록을 만들지 않으므로 뷰포트 기준이 그대로 성립한다). top=상단바 56px + 6px. */
  @media(max-width:640px){
    .albox{position:fixed;top:62px;left:16px;right:16px;width:auto;max-width:none}
  }
  /* overflow-y:hidden 필수 — CSS 스펙상 한 축이 visible 이 아니면 다른 축도 auto 로 승격돼,
     .tab{margin-bottom:-1px} 의 1px 넘침 때문에 세로 스크롤바가 떴다. 가로 스크롤은 넓은 화면에서
     탭이 늘어날 때를 위한 보험이고, 모바일은 아래 바텀탭에서 4등분해 스크롤 자체를 없앤다. */
  .tabs{position:sticky;top:56px;z-index:39;display:flex;gap:2px;background:#fff;border-bottom:1px solid var(--line);padding:0 20px;overflow-x:auto;overflow-y:hidden}
  .tab{display:inline-flex;align-items:center;gap:7px;border:none;background:transparent;padding:14px 14px;font-family:inherit;font-size:13.5px;font-weight:700;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap}
  .tab:hover{color:var(--ink)}
  .tab.on{color:var(--blue-d);border-bottom-color:var(--blue)}
  .tab svg{stroke:currentColor} /* :global() 금지 — 외부상수 스타일에선 규칙이 통째로 죽는다 */
  .tab:focus-visible{outline:2px solid var(--blue);outline-offset:-4px;border-radius:6px}
  /* ── 모바일 바텀탭(카드#026 B) ──
     상단 탭은 좁은 화면에서 가로 스크롤을 만들었다 → 화면 하단 고정 + 등분(flex:1)으로 스크롤 0.
     아이콘 위 / 라벨 아래 세로 배치. 선택 표시는 상단탭의 밑줄 대신 색 + 상단 인디케이터.
     카드#036 A 에서 탭이 6개 → 4개(링크·내 자료·지원서 작성·대화)가 되어 한 칸 폭이 넓어졌다. */
  @media(max-width:640px){
    /* top:auto 필수 — 위 sticky 규칙의 top:56px 이 남으면 top/bottom 이 모두 지정된 fixed 요소가 되어
       탭 바가 화면 아래 끝까지 늘어난다. */
    .tabs{position:fixed;top:auto;bottom:0;left:0;right:0;z-index:41;gap:0;padding:0;overflow:visible;border-bottom:none;border-top:1px solid var(--line);padding-bottom:env(safe-area-inset-bottom);box-shadow:0 -2px 10px rgba(14,21,36,.06)}
    /* margin-bottom:-1px 는 상단탭이 아래 경계선과 겹치기 위한 값이라 해제한다(과거 세로 스크롤바 원인). */
    .tab{flex:1;min-width:0;flex-direction:column;justify-content:center;gap:4px;padding:8px 2px;min-height:56px;font-size:11px;border-bottom:none;border-top:2px solid transparent;margin-bottom:0}
    .tab svg{width:20px;height:20px}
    .tab.on{border-top-color:var(--blue)}
    /* 바텀탭이 본문 위에 떠 있다 — 그만큼 아래 여백을 주지 않으면 푸터·마지막 카드가 가려진다.
       탭 바 실측 높이 60.6px(아이콘 20 + gap 4 + 라벨 11px 한 줄 + 상하 패딩 16 + 테두리)에
       푸터가 탭에 붙어 보이지 않게 12px 여유를 더한 값. */
    .dash{padding-bottom:calc(72px + env(safe-area-inset-bottom))}
  }
  .wrap{max-width:920px;margin:0 auto;padding:34px 24px}
  .state{display:flex;flex-direction:column;align-items:center;gap:14px;padding:80px 0;color:var(--muted)}
  .spin{width:32px;height:32px;border-radius:50%;border:3px solid var(--line);border-top-color:var(--blue);animation:spin .8s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media(prefers-reduced-motion:reduce){.spin{animation-duration:1.6s}}
  .head{display:flex;align-items:flex-start;margin-bottom:20px;gap:16px}
  .head h1{font-size:24px;font-weight:800;letter-spacing:-.02em;margin:0}
  .head .sub{color:var(--muted);font-size:13.5px;margin-top:3px}
  /* 자료 등록 한도 요약(카드#013 B — 헤더 우측 블록). 수치·게이지·문구가 전부 quota 파생이라
     상한(STORAGE_LIMIT_BYTES)을 바꿔도 화면이 따라온다 — 100/10 하드코딩 없음.
     tabular-nums: 폴링으로 수치가 바뀔 때 글자폭이 흔들리지 않게(자릿수 고정). */
  .qsum{margin-left:auto;flex:0 0 auto;width:236px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:13px 16px}
  .qsl{display:flex;align-items:baseline;gap:6px;font-size:12px;font-weight:700;color:var(--muted)}
  .qsl .big{margin-left:auto;font-size:21px;font-weight:800;letter-spacing:-.02em;color:var(--ink);font-variant-numeric:tabular-nums;line-height:1.2}
  .qsl .big em{font-style:normal;font-size:12.5px;font-weight:700;color:var(--muted);margin-left:2px}
  .qsbar{height:6px;border-radius:999px;background:var(--line);overflow:hidden;margin:9px 0}
  .qsbar i{display:block;height:100%;border-radius:999px;background:var(--blue)}
  .qsfoot{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted);font-variant-numeric:tabular-nums;border-top:1px dashed var(--line2);padding-top:8px}
  .qsfoot svg{stroke:currentColor;flex:0 0 auto}
  .qsfoot b{margin-left:auto;color:var(--ink2);font-weight:800}
  /* 하루 등록 횟수 소진 — 용량이 남아 있어도 등록이 막히므로 별도로 표시해야 이유가 보인다. */
  .qsfoot b.done{color:var(--danger)}
  .qsum.warn .qsbar i{background:var(--warn)}
  .qsum.warn .qsl .big{color:var(--warn)}
  .qsum.over{border-color:#f3c9cb;background:#fdf3f3}
  .qsum.over .qsbar{background:#f6d9da}
  .qsum.over .qsbar i{background:var(--danger)}
  .qsum.over .qsl .big,.qsum.over .qsl .big em{color:var(--danger)}
  /* quota 도착 전 빈 블록이 높이를 예약 — 값이 들어와도 헤더가 흔들리지 않는다. */
  .qsum.empty{min-height:104px}
  /* 삭제-보존 고지(사이클6). 은은한 정보 배너 — Candour blue 톤. */
  .notice{display:flex;gap:9px;align-items:flex-start;background:var(--blue-t);border:1px solid var(--line);border-radius:11px;padding:11px 13px;margin-bottom:18px;color:var(--ink2);font-size:12.5px;line-height:1.55}
  /* ⚠️ 여기서 :global(svg) 를 쓰면 규칙이 통째로 죽는다 — styled-jsx 가 외부상수 문자열을 정적분석
     못 해 원문 그대로 주입하고, 브라우저는 표준이 아닌 :global(...) 셀렉터를 무시한다(카드#006에서
     .notice 의 stroke·margin 이 전부 무효였음을 실측). dashStyles 는 어차피 비스코프로 주입되므로
     자손은 평 셀렉터로 쓴다.
     정렬: svg 박스 높이를 첫 줄 line-height(1.55em)와 같게 두면 viewBox 가 preserveAspectRatio
     기본값으로 그 박스 세로 중앙에 그려져 첫 줄과 광학 정렬된다. 눈대중 margin 보정과 달리
     아이콘 크기(WalletView 15px · AssetsView 16px)가 달라도 자동으로 맞는다. */
  .notice svg{stroke:var(--blue-d);flex:0 0 auto;height:1.55em}
  .notice b{color:var(--ink);font-weight:700}
  /* 헤더 우측 보조 액션(프로필 "이력서로 자동 채우기") — .pbtn 스타일 그대로 쓰고 배치만 헤더용으로. */
  .head .pbtn{margin-left:auto;flex:0 0 auto}
  .newbtn{margin-left:auto;flex:0 0 auto;background:var(--blue);color:#fff;border:none;border-radius:11px;padding:12px 18px;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;transition:var(--t)}
  .newbtn:hover{background:var(--blue-d);transform:translateY(-2px)}
  .newbtn :global(svg){stroke:#fff}
  .newform{margin-left:auto;flex:0 0 auto;width:300px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;box-shadow:0 12px 30px rgba(14,21,36,.1)}
  /* 새 링크 발급(카드#006) — PC 는 오버레이 모달, 모바일은 헤더 아래 인라인 폼 그대로.
     .nf-wrap 은 display:contents 라 모바일에선 래퍼가 없는 것처럼 .newform 이 .head 의 flex 아이템이 된다. */
  .nf-wrap{display:contents}
  .nf-ovl{position:fixed;inset:0;z-index:60;background:rgba(14,21,36,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px}
  .nf-ovl .newform{margin-left:0;width:min(360px,100%);box-shadow:0 30px 80px rgba(14,21,36,.35);animation:nfpop .22s cubic-bezier(.2,.7,.3,1)}
  @keyframes nfpop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
  @media(prefers-reduced-motion:reduce){.nf-ovl .newform{animation:none}}
  .nf-head{display:flex;align-items:center;font-size:14px}
  .nf-head b{font-weight:800}
  .icon-btn{margin-left:auto;background:transparent;border:none;color:var(--muted);cursor:pointer;display:grid;place-items:center;padding:4px;border-radius:7px}
  .icon-btn:hover{color:var(--ink);background:var(--bg2)}
  .icon-btn :global(svg){stroke:currentColor}
  .nf-seg{display:flex;gap:4px;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:4px;margin:12px 0}
  .nf-seg button{flex:1;border:none;background:transparent;border-radius:7px;padding:8px;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--muted);cursor:pointer}
  .nf-seg button.on{background:#fff;color:var(--blue-d);box-shadow:0 1px 4px rgba(14,21,36,.08)}
  .nf-in{width:100%;border:1px solid var(--line2);border-radius:9px;padding:10px 12px;font-family:inherit;font-size:13px;margin-bottom:8px;color:var(--ink)}
  .nf-in:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-t)}
  .nf-err{color:var(--danger);font-size:12px;font-weight:600;margin-bottom:8px}
  .nf-submit{width:100%;background:var(--ink);color:#fff;border:none;border-radius:9px;padding:11px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer}
  .nf-submit:disabled{opacity:.5;cursor:not-allowed}
  .empty{background:#fff;border:1px dashed var(--line2);border-radius:14px;padding:40px 24px;text-align:center;color:var(--muted);font-size:13.5px}
  .cards{display:flex;flex-direction:column;gap:14px}
  .card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px 22px;box-shadow:0 3px 12px rgba(14,21,36,.04)}
  .card.dim{opacity:.72}
  .row1{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .label{font-size:16.5px;font-weight:800}
  /* overflow-wrap:anywhere — b-co 는 사용자 입력 회사명(최대 120자)이라 공백 없는 긴 값이면
     배지가 카드를 넘어 글자가 잘려나간다. anywhere 는 min-content 도 줄여줘 flex 아이템이 실제로 접힌다
     (max-width:100% 만으론 박스만 맞고 글자는 그대로 넘침). */
  .badge{border-radius:7px;padding:4px 9px;font-size:11px;font-weight:700;overflow-wrap:anywhere}
  .b-univ{background:var(--blue-t);color:var(--blue-d)}
  .b-comp{background:#f2ecff;color:#6b46c1}
  .b-active{background:#e7f7ee;color:var(--ok)}
  .b-disabled{background:#fdf0e6;color:var(--warn)}
  .b-revoked{background:#fdeaea;color:var(--danger)}
  .b-co{background:var(--bg2);border:1px solid var(--line);color:var(--ink2)}
  .slug{margin-left:auto;font-size:12.5px;color:var(--muted);font-family:ui-monospace,SFMono-Regular,monospace;display:inline-flex;align-items:center;gap:6px}
  .slug :global(svg){stroke:currentColor;flex:0 0 auto}
  .meta{font-size:13px;color:var(--ink2);margin-top:8px}
  .meta .co{color:var(--blue-d);font-weight:700}
  .dim-note{color:var(--muted)}
  .actions{display:flex;gap:9px;margin-top:16px;flex-wrap:wrap;align-items:center}
  .act{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line2);background:#fff;color:var(--ink);border-radius:10px;padding:9px 14px;font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer;transition:var(--t)}
  .act:hover:not(:disabled){border-color:var(--blue);color:var(--blue-d)}
  .act:disabled{opacity:.55;cursor:not-allowed}
  .act.primary{border-color:var(--blue);color:var(--blue-d);background:var(--blue-t)}
  .act.danger{color:var(--danger);border-color:#f0c9cb}
  .act.danger:hover:not(:disabled){border-color:var(--danger);color:var(--danger)}
  .act :global(svg){stroke:currentColor}
  .toggle{display:inline-flex;align-items:center;gap:8px;border:none;background:transparent;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--ink2);cursor:pointer;padding:0 4px 0 0}
  .toggle:disabled{opacity:.6;cursor:not-allowed}
  .sw{width:38px;height:22px;border-radius:11px;background:var(--ok);position:relative;transition:.2s;flex:0 0 auto}
  .sw.off{background:var(--line2)}
  .sw i{position:absolute;top:2px;left:18px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
  .sw.off i{left:2px}
  .qa{margin-top:16px;border-top:1px dashed var(--line2);padding-top:14px}
  .qh{font-size:12px;font-weight:800;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:8px}
  .qh .cnt{background:var(--bg2);border:1px solid var(--line);border-radius:6px;padding:1px 7px;color:var(--ink2)}
  /* 설명·예시 패널 트리거(카드#002 C) — 헤더 우측. text-transform/letter-spacing 은 .qh 상속을 되돌린다. */
  .qh .ibtn{margin-left:auto;display:inline-flex;align-items:center;gap:5px;background:transparent;border:1px solid var(--line2);border-radius:8px;color:var(--muted);cursor:pointer;padding:5px 10px;font-family:inherit;font-size:11px;font-weight:700;text-transform:none;letter-spacing:0;transition:var(--t)}
  .qh .ibtn:hover{border-color:var(--blue);color:var(--blue-d)}
  .qh .ibtn.on{border-color:var(--blue);color:var(--blue-d);background:var(--blue-t)}
  .qh .ibtn:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  .qh .ibtn :global(svg){stroke:currentColor;flex:0 0 auto}
  .qguide{background:#fff;border:1px dashed var(--line2);border-radius:12px;padding:14px;margin-bottom:10px;animation:slidein .24s cubic-bezier(.2,.7,.3,1)}
  @keyframes slidein{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
  @media(prefers-reduced-motion:reduce){.qguide{animation:none}}
  .gstep{display:flex;gap:9px;margin-bottom:9px}
  .gn{flex:0 0 auto;width:19px;height:19px;border-radius:50%;background:var(--ink);color:#fff;font-size:10.5px;font-weight:800;display:grid;place-items:center;margin-top:1px}
  .gstep p{margin:0;font-size:12.5px;color:var(--ink2);line-height:1.55}
  .gstep b{color:var(--ink);font-weight:700}
  .gext{font-size:10.5px;font-weight:800;letter-spacing:.06em;color:var(--muted);text-transform:uppercase;margin:12px 0 7px}
  .gbadge{flex:0 0 auto;font-size:10px;font-weight:700;color:var(--muted);border:1px solid var(--line2);border-radius:6px;padding:2px 6px}
  .qaitem{display:flex;gap:10px;align-items:flex-start;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:11px 13px;margin-bottom:8px}
  .qaitem.ghost{opacity:.85}
  .qatext{flex:1;min-width:0}
  .qaitem .q{font-size:13px;font-weight:700}
  .qaitem .a{font-size:12.5px;color:var(--ink2);margin-top:3px;white-space:pre-wrap;word-break:break-word}
  .qapresets{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
  .qapresets .qp{border:1px solid var(--line2);background:#fff;color:var(--ink2);border-radius:999px;padding:6px 12px;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:var(--t)}
  .qapresets .qp:hover{border-color:var(--blue);color:var(--blue-d);background:var(--blue-t)}
  .qapresets .qp:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  .qaform{display:flex;gap:8px;margin-top:6px}
  .qaform input{flex:1;min-width:0;border:1px solid var(--line2);border-radius:9px;padding:9px 11px;font-family:inherit;font-size:12.5px;color:var(--ink)}
  .qaform input:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-t)}
  .qaform .add{flex:0 0 auto;background:var(--ink);color:#fff;border:none;border-radius:9px;padding:0 14px;cursor:pointer;display:grid;place-items:center}
  .qaform .add:disabled{opacity:.5;cursor:not-allowed}
  .qaform .add :global(svg){stroke:#fff}

  /* 프로필 편집 */
  /* max-width 없음 — 링크·자료·대화·크레딧 카드처럼 .wrap(920px) 을 그대로 쓴다.
     폼만 640px 로 좁히면 탭 이동 시 카드 좌우 경계가 튄다(#016-2). 넓어진 폭은 .frow.two 2단으로 흡수. */
  .pform{background:#fff;border:1px solid var(--line);border-radius:16px;padding:24px;box-shadow:0 3px 12px rgba(14,21,36,.04)}
  .frow{margin-bottom:16px}
  .frow.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .flabel{display:block;font-size:12px;font-weight:700;color:var(--muted);margin-bottom:6px}
  .finput,.ftext{width:100%;border:1px solid var(--line2);border-radius:10px;padding:11px 13px;font-family:inherit;font-size:13.5px;color:var(--ink);background:#fff}
  /* keep-all: 좁은 화면에서 안내 문구·입력값이 어절 중간("함께 적/어주세요")에서 끊기지 않게 */
  .ftext{min-height:88px;resize:vertical;line-height:1.6;word-break:keep-all}
  .finput:focus,.ftext:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-t)}
  .fhint{font-size:11.5px;color:var(--muted);margin-top:5px}
  .photorow{display:flex;align-items:center;gap:14px}
  .photoprev{width:76px;height:76px;border-radius:20px;object-fit:cover;border:1px solid var(--line);display:block}
  .photoempty{width:76px;height:76px;border-radius:20px;background:var(--bg2);border:1px dashed var(--line2);display:grid;place-items:center;color:var(--muted)}
  .photobtns{display:flex;gap:8px}
  .pbtn{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line2);background:#fff;color:var(--ink2);border-radius:9px;padding:9px 13px;font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer;transition:var(--t)}
  .pbtn:hover:not(:disabled){border-color:var(--blue);color:var(--blue-d)}
  .pbtn.danger:hover:not(:disabled){border-color:var(--danger);color:var(--danger)}
  .pbtn:disabled{opacity:.55;cursor:not-allowed}
  .pbtn:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  .pubtoggle{margin-top:8px}
  .perr-inline{color:var(--danger)}
  .prow-btn{display:flex;align-items:center;margin-top:6px}
  .psave{background:var(--blue);color:#fff;border:none;border-radius:11px;padding:12px 22px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer}
  .psave:hover:not(:disabled){background:var(--blue-d)}
  .psave:disabled{opacity:.55;cursor:not-allowed}
  .saved{color:var(--ok);font-size:12.5px;font-weight:700;margin-left:12px}
  .perr{color:var(--danger);font-size:12.5px;font-weight:700;margin-left:12px}

  /* 자료 관리 */
  .addseg{display:inline-flex;gap:4px;background:var(--bg2);border:1px solid var(--line);border-radius:11px;padding:4px;margin-bottom:14px}
  .addseg button{display:inline-flex;align-items:center;gap:7px;border:none;background:transparent;border-radius:8px;padding:9px 16px;font-family:inherit;font-size:13px;font-weight:700;color:var(--muted);cursor:pointer}
  .addseg button.on{background:#fff;color:var(--blue-d);box-shadow:0 1px 4px rgba(14,21,36,.08)}
  .addseg button :global(svg){stroke:currentColor}
  .addseg button:focus-visible{outline:2px solid var(--blue);outline-offset:-2px}
  /* "내 자료" 탭 안 전환(카드#036 A) — .addseg 와 같은 pill 이되 화면 위계가 한 단계 위(본문 헤더 앞)라
     아래 간격만 넓힌다. 자료 쪽에서는 이 아래에 .addseg(추가 방식)가 한 번 더 오므로 간격으로 층을 가른다. */
  .subseg{margin-bottom:18px}
  /* 좁은 화면에서 pill 이 내용폭으로는 한 줄에 안 들어가 "파일 업로 / 드"로 접혔다
     (실측 360px: 필요 335.09px / 가용 312px). 전체폭 등분 + nowrap 으로 되돌린다 —
     좌우 padding 을 16 → 10 으로 줄인 만큼이 글자 자리가 된다.
     .subseg(프로필/자료)도 같은 클래스라 함께 전체폭이 되어 위아래 두 세그먼트가 같은 폭으로 층을 이룬다. */
  @media(max-width:640px){
    .addseg{display:flex}
    .addseg button{flex:1 1 auto;justify-content:center;white-space:nowrap;padding:9px 10px;gap:6px}
    /* ── 프로필/자료 전환을 상단 고정으로(카드#037 마스터 반려) ──
       이 세그먼트는 위계가 topbar 다음인데 본문과 함께 스크롤돼 사라져, 탭을 바꾸려면 매번
       최상단으로 되돌아가야 했다(390px 실측: 420px 스크롤 시 top -330 = 화면 밖).
       topbar(height:56px, z-index:40) 바로 아래에 붙여 상단바의 연장처럼 보이게 한다 —
       pill 트랙을 버리고 흰 전면 바 + 아래 경계선 한 줄(topbar 와 같은 언어), 선택 항목만 파란 칩.
       아래 .addseg(추가 방식)는 pill 그대로 둬서 "고정된 상단 탭 / 본문 안 세그먼트"로 층이 갈린다.
       margin 은 .wrap{padding:34px 24px} 상쇄값 — 위를 지워 topbar 에 틈 없이 붙이고(56=56)
       좌우를 전면 폭으로 편다. z-index 는 바텀탭(41)·topbar(40) 아래.
       버튼의 flex 등분·nowrap·359px 계단은 위 .addseg 규칙을 그대로 물려받는다. */
    .subseg{position:sticky;top:56px;z-index:38;margin:-34px -24px 18px;padding:7px 16px;
      background:#fff;border:0;border-bottom:1px solid var(--line);border-radius:0;gap:6px}
    /* flex-basis 0 — .addseg 는 항목 글자 길이가 제각각이라 내용폭 기준(auto) 분배가 맞지만,
       여기는 항목 2개짜리 상단 탭이라 글자 수 차이가 그대로 칩 폭 차이로 보인다(390px 실측:
       프로필 181.61 / 자료 170.39). 정확히 반씩 나눠 topbar 아래 좌우 대칭을 맞춘다. */
    .subseg button{flex-basis:0;border-radius:9px}
    .subseg button.on{background:var(--blue-t);color:var(--blue-d);box-shadow:none}
  }
  /* 320px 은 등분해도 "파일 업로드"가 24px 모자란다 — 이 구간만 padding·gap·글자를 한 단계 더 줄인다
     (상단바 좌우 여백을 359px 이하에서만 줄인 것과 같은 계단). */
  @media(max-width:359px){
    .addseg button{padding:9px 6px;gap:4px;font-size:12.5px}
  }
  .ameta.url{color:var(--blue-d);word-break:break-all}
  .upzone{border:1.5px dashed var(--line2);border-radius:14px;padding:20px;background:#fff;margin-bottom:18px;display:flex;align-items:center;gap:14px}
  .upzone .upic{width:44px;height:44px;border-radius:11px;background:var(--blue-t);color:var(--blue-d);display:grid;place-items:center;flex:0 0 auto}
  .upzone .upic :global(svg){stroke:currentColor}
  /* 선택한 파일명(b)처럼 공백 없는 긴 토큰이 min-width:0 만으로는 안 끊겨 카드 밖으로 넘친다.
     break-word 가 아니라 anywhere — 일반 문구의 줄바꿈 모양은 그대로고 긴 한 덩어리에서만 끊긴다.
     p(안내 문구)도 같은 부류가 될 수 있어 uptx 컨테이너에 건다. */
  .upzone .uptx{flex:1;min-width:0;overflow-wrap:anywhere}
  .upzone .uptx b{font-size:14px;font-weight:800}
  .upzone .uptx p{font-size:12px;color:var(--muted);margin:2px 0 0}
  .upfields{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
  /* min-width = 가장 긴 placeholder(164px) + 좌우 padding(22px) + 여유. 좁은 화면에서 칸이 더 줄지 않고 wrap 돼 문구가 안 잘린다.
     단 320px 처럼 카드 가용폭 자체가 그 하한보다 좁은 구간에선 하한이 오히려 넘침을 만들어 min() 으로 접는다 —
     가용폭 200px 이상에선 200px 그대로라 위 의도가 불변이고, 미만에서만 100% 로 따라 내려간다. */
  .upfields input{flex:1;min-width:min(200px,100%);border:1px solid var(--line2);border-radius:9px;padding:9px 11px;font-family:inherit;font-size:12.5px;color:var(--ink)}
  .assetgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
  .acard{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 3px 12px rgba(14,21,36,.04);display:flex;flex-direction:column}
  .athumb{height:132px;display:grid;place-items:center;position:relative;background:var(--bg2);overflow:hidden}
  .athumb img{width:100%;height:100%;object-fit:cover}
  .athumb .ph{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11.5px;color:var(--muted)}
  .athumb .ph :global(svg){stroke:currentColor;width:26px;height:26px}
  .athumb .kindtag{position:absolute;top:8px;left:8px;background:rgba(14,21,36,.72);color:#fff;border-radius:6px;padding:2px 7px;font-size:10px;font-weight:700;letter-spacing:.04em}
  /* 인제스션 진행 표시(카드#009 B) — 분석이 끝나기 전엔 썸네일 위에 덮어 상태를 알린다 */
  .athumb .aover{position:absolute;inset:0;background:rgba(255,255,255,.86);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font-size:12px;font-weight:700;color:var(--ink2)}
  .athumb .aover .spin{width:22px;height:22px;border-width:2.5px}
  .athumb .playbadge{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;background:rgba(14,21,36,.6);color:#fff;display:flex;align-items:center;justify-content:center}
  .athumb .playbadge svg{stroke:currentColor}
  .athumb .failtag{position:absolute;top:8px;right:8px;background:#DC2626;color:#fff;border-radius:6px;padding:2px 7px;font-size:10px;font-weight:700}
  .anote{font-size:11.5px;color:#B45309;background:#FEF3C7;border-radius:7px;padding:6px 8px;margin-top:6px;line-height:1.45}
  .anote.fail{color:#B91C1C;background:#FEE2E2}
  .abody{padding:12px 14px;flex:1;display:flex;flex-direction:column;gap:3px}
  .atitle{font-size:14px;font-weight:800;word-break:break-word}
  .asub{font-size:12px;color:var(--muted)}
  .ameta{font-size:11px;color:var(--muted);margin-top:auto;padding-top:8px}
  /* 카드 최소폭 210px 에 열기·수정·삭제 3개가 한 줄로 안 들어가므로 wrap */
  .aacts{display:flex;gap:6px;padding:0 12px 12px;flex-wrap:wrap}
  .aacts .act{padding:7px 10px;font-size:11.5px}
  /* 제목/설명 인라인 편집 — .upfields input 은 가로 나열(flex:1 + wrap)용이라 재사용 못 한다.
     여긴 카드 안 세로 스택이라 각 칸이 width:100%, 패딩도 한 단계 작다. */
  .aedit{display:flex;flex-direction:column;gap:6px}
  .aedit input{width:100%;border:1px solid var(--line2);border-radius:8px;padding:7px 9px;font-family:inherit;font-size:12.5px;color:var(--ink)}
  .aedit .nf-err{margin:0;font-size:11.5px}

  /* 대화·크레딧 열람 */
  .convpick{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
  .convpick button{border:1px solid var(--line2);background:#fff;border-radius:10px;padding:9px 14px;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--ink2);cursor:pointer;display:inline-flex;align-items:center;gap:7px}
  .convpick button.on{border-color:var(--blue);color:var(--blue-d);background:var(--blue-t)}
  .convrow{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:10px;cursor:pointer;transition:var(--t);width:100%;text-align:left;font-family:inherit}
  .convrow:hover{border-color:var(--blue);transform:translateY(-1px)}
  .convrow .cco{font-size:14px;font-weight:800}
  .convrow .cmeta{font-size:12px;color:var(--muted);margin-top:2px}
  .convrow .ccount{margin-left:auto;background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:5px 10px;font-size:11.5px;font-weight:700;color:var(--ink2);flex:0 0 auto}
  /* 다운로드 배지 — "메시지 N" 과 같은 토큰(.ccount)을 그대로 쓰고 붙이는 방식만 다르다.
     margin-left:auto 가 두 배지에 다 걸리면 남는 공간이 **둘 사이에 나뉘어** 벌어지므로 뒤엣것은 0
     (앞 배지의 auto 하나가 두 배지를 함께 오른쪽으로 민다). 간격은 .convrow 의 gap 12px. */
  .convrow .cdl{margin-left:0;display:inline-flex;align-items:center;gap:5px}
  .convrow .cdl svg{stroke:currentColor}
  .backbar{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap}
  /* 상세 상단 한 줄 — 배지가 아니라 메모라 테두리 없이 .backbtn 과 같은 12.5px 로 baseline 을 맞춘다 */
  .dlnote{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--muted)}
  .dlnote svg{stroke:currentColor}
  .backbtn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line2);background:#fff;border-radius:9px;padding:8px 12px;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--ink2);cursor:pointer}
  .backbtn:hover{border-color:var(--blue);color:var(--blue-d)}
  .backbtn :global(svg){stroke:currentColor}
  .totok{margin-left:auto;display:inline-flex;align-items:center;gap:7px;background:#fff7ec;border:1px solid #f0d599;color:#8a6100;border-radius:9px;padding:8px 12px;font-size:12.5px;font-weight:700}
  .totok :global(svg){stroke:currentColor}
  .msgview{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:0 3px 12px rgba(14,21,36,.04)}
  .m{max-width:88%;margin-bottom:16px}
  .m.hr{margin-left:auto}
  .m .who{font-size:11px;color:var(--muted);margin:0 4px 5px;font-weight:600}
  .m .bub{border-radius:14px;padding:11px 14px;font-size:14px;line-height:1.55}
  .m.hr .bub{background:var(--blue);color:#fff;border-bottom-right-radius:4px}
  .m.ai .bub{background:var(--bg2);border:1px solid var(--line);border-bottom-left-radius:4px}
  .m.ai .bub.blocked{background:#fef1f1;border-color:#f6d5d6;color:#c0343a}
  .m.ai .bub.noinfo{background:#fff8ec;border-color:#f0d599;color:#8a6100}
  .m .mfoot{display:flex;align-items:center;gap:8px;margin:6px 4px 0;flex-wrap:wrap}
  .tok{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--muted);font-weight:600}
  .tok :global(svg){stroke:currentColor;width:13px;height:13px}
  .tag-refuse{font-size:10px;color:var(--danger);font-weight:700;letter-spacing:.04em}
  .act:focus-visible,.newbtn:focus-visible,.logout:focus-visible,.balchip:focus-visible,.bell:focus-visible,.toggle:focus-visible,.nf-submit:focus-visible,.qaform .add:focus-visible,.psave:focus-visible,.convrow:focus-visible,.backbtn:focus-visible,.convpick button:focus-visible{outline:2px solid var(--blue);outline-offset:2px}

  /* ── 반응형(모바일) — 대시보드 breakpoint (QA HIGH 2건) ── */
  /* .head 는 flex-nowrap + .newform 300px 고정이라 좁은 폭에서 헤더 텍스트가 min-content(한 글자)까지
     짜부라졌다. wrap 을 허용해 폼/버튼이 헤더 아래 줄로 떨어지고 텍스트가 전체 폭을 갖게 한다. */
  /* 링크 카드: 데스크톱은 한 줄에 다 들어가지만 모바일에선 제목·배지·slug 가 서로 밀어내고
     액션 4개가 3+1 로 어정쩡하게 접힌다. 모바일에서만 세로 스택 + 액션 그리드로 재배치
     (제목 전체폭 → 배지 → slug 칩 → 토글 → 링크복사 전체폭 → 재발급/Q&A 2열). */
  @media(max-width:640px){
    .head{flex-wrap:wrap}
    .newform{width:100%;margin-left:0}
    .qsum{width:100%;margin-left:0}
    .row1{gap:7px}
    .row1 .label{width:100%;word-break:break-word}
    /* slug 는 재발급 시 16자 hex 라 길다 → 자체 행 칩으로 떨어뜨리고 break-all */
    .slug{order:9;width:100%;margin-left:0;color:var(--ink2);background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:7px 9px;word-break:break-all;line-height:1.45}
    .actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:stretch;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}
    .actions .toggle{grid-column:1/-1;order:1;min-height:44px}
    .actions .act{min-height:44px;justify-content:center;padding:11px 10px;font-size:13px}
    .actions .act.copy{grid-column:1/-1;order:2;background:var(--blue);border-color:var(--blue);color:#fff}
    .actions .act.copy:hover:not(:disabled){border-color:var(--blue);color:#fff}
    .actions .act.reissue{order:3}
    .actions .act.qabtn{order:4} /* 클래스명 qa 금지 — 아래 .qa(아코디언 패널) 규칙에 얻어걸린다 */
    .actions:not(.has-qa) .act.reissue{grid-column:1/-1}
  }
  /* 2열이 좁은 화면에서 값·placeholder 가 잘림(input scrollWidth>clientWidth) → 1열 스택.
     #016-2 에서 2열 쌍이 2 → 4 로 늘어 480px 였던 경계를 640px 로 올림(칸당 ~290px 부터 잘리기 시작). */
  @media(max-width:640px){
    .frow.two{grid-template-columns:1fr}
  }

  /* ── 크레딧 지갑(WalletView, 사이클8) ── 다른 뷰와 동일하게 뷰별 스타일도 이 공용 파일에 둔다
     (한 컴포넌트에 외부변수 참조 <style jsx> 를 2개 두면 styled-jsx 가 두 번째를 주입하지 않음). */
  .notice.warn{background:var(--warn-t);border-color:#f4d9be}
  .notice.warn svg{stroke:var(--warn)} /* :global() 금지 — 위 .notice svg 주석 참조 */
  .balhero{display:flex;align-items:center;gap:16px;background:linear-gradient(135deg,var(--ink),#1b2740);color:#fff;border-radius:18px;padding:22px 24px;margin-bottom:16px}
  .balhero.low{background:linear-gradient(135deg,#7a3d18,#a8571f)}
  .balhero .ico{width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.14);display:grid;place-items:center;flex:0 0 auto}
  .balhero .ico :global(svg){stroke:#fff;width:22px;height:22px}
  .balhero .bl{font-size:12.5px;opacity:.8;font-weight:600}
  .balhero .bv{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.1;margin-top:2px}
  .balhero .bv span{font-size:15px;font-weight:600;opacity:.85}
  .buymsg{border-radius:11px;padding:11px 14px;margin-bottom:16px;font-size:13px;font-weight:600}
  .buymsg.ok{background:var(--ok-t);color:var(--ok);border:1px solid #bfe6cd}
  .buymsg.err{background:#fdeaea;color:var(--danger);border:1px solid #f0c9cb}
  /* 열 수 = 상품 수(3). 상품 수로 나누어떨어지지 않는 열 수를 쓰면 마지막 카드만 다음 줄에
     혼자 남아 그리드가 깨진다(카드#021 에서 3열 + 상품 4개로 실제 발생). 3 의 약수는 1 뿐이라
     중간 단계(2열)를 두지 않고 좁아지면 곧바로 1열로 간다(카드#026 test 상품 제거). */
  /* auto-rows 1fr = 줄이 나뉘어도 모든 카드 높이가 같다(보너스 줄 유무로 행마다 27px 어긋나던 것).
     .paybtn 이 margin-top:auto 라 늘어난 만큼 결제 버튼이 카드 하단에 나란히 선다. */
  .prodgrid{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:14px;margin-bottom:34px}
  .prod{position:relative;background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px 18px;display:flex;flex-direction:column;box-shadow:0 3px 12px rgba(14,21,36,.04)}
  .prod.hot{border-color:var(--blue);box-shadow:0 6px 20px rgba(43,90,240,.12)}
  .pbadge{position:absolute;top:-10px;left:18px;background:var(--blue);color:#fff;border-radius:7px;padding:4px 10px;font-size:11px;font-weight:700}
  .pname{font-size:15px;font-weight:800;margin-top:4px}
  .pprice{font-size:26px;font-weight:800;letter-spacing:-.02em;margin:6px 0 14px}
  .pprice span{font-size:14px;font-weight:600;color:var(--muted);margin-left:2px}
  .pcredits{border-top:1px dashed var(--line2);padding-top:12px;display:flex;flex-direction:column;gap:6px}
  .pc-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--ink2)}
  .pc-row b{font-weight:700;color:var(--ink)}
  .pc-row.bonus{color:var(--blue-d)}
  .pc-row.bonus b{color:var(--blue-d)}
  .pc-row.total{border-top:1px solid var(--line);padding-top:8px;margin-top:2px;font-weight:700}
  .pc-row.total b{display:inline-flex;align-items:center;gap:5px;font-size:15px}
  .pc-row.total b :global(svg){stroke:var(--blue-d)}
  .pper{font-size:11.5px;color:var(--muted);margin:10px 0 14px;text-align:center}
  .paybtn{margin-top:auto;background:#fff;border:1px solid var(--blue);color:var(--blue-d);border-radius:11px;padding:11px;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;transition:var(--t)}
  .paybtn:hover:not(:disabled){background:var(--blue-t)}
  .paybtn.hot{background:var(--blue);color:#fff}
  .paybtn.hot:hover:not(:disabled){background:var(--blue-d)}
  .paybtn:disabled{opacity:.55;cursor:not-allowed}
  /* 결제 카드(카드#026 A) — 충전은 등록 카드로만 이뤄지므로 상품 그리드 위에 둔다. */
  /* .ledhead 는 baseline 정렬(제목 + 건수 텍스트)이라 버튼이 들어오면 아래로 밀린다 → 여기만 center. */
  .cardhead{align-items:center}
  .addcard{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--line2);border-radius:10px;padding:8px 13px;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--ink2);cursor:pointer;transition:var(--t)}
  .addcard:hover:not(:disabled){border-color:var(--blue);color:var(--blue-d)}
  .addcard:disabled{opacity:.55;cursor:not-allowed}
  .addcard svg{stroke:currentColor}
  .cardempty{padding:26px 20px;margin-bottom:20px}
  .cardlist{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
  .cardrow{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:13px 16px}
  .cdmeta{min-width:0}
  .cdname{display:flex;align-items:center;gap:7px;font-size:13.5px;font-weight:700;color:var(--ink)}
  .cdbadge{background:var(--blue-t);color:var(--blue-d);border-radius:6px;padding:2px 7px;font-size:10.5px;font-weight:700}
  .cdnum{font-size:12px;color:var(--muted);margin-top:3px;letter-spacing:.02em}
  .cddel{margin-left:auto;display:inline-flex;align-items:center;gap:5px;background:#fff;border:1px solid var(--line2);border-radius:9px;padding:7px 11px;font-family:inherit;font-size:12px;font-weight:700;color:var(--muted);cursor:pointer;flex:0 0 auto;transition:var(--t)}
  .cddel:hover:not(:disabled){border-color:var(--danger);color:var(--danger)}
  .cddel:disabled{opacity:.55;cursor:not-allowed}
  .cddel svg{stroke:currentColor}
  .addcard:focus-visible,.cddel:focus-visible,.pk-card:focus-visible,.pk-new:focus-visible,.pk-cancel:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  /* 카드 선택 모달 — 고르는 즉시 결제되므로 금액을 한 번 더 보여준다. */
  .pk-ovl{position:fixed;inset:0;z-index:60;background:rgba(14,21,36,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px}
  .pk{width:min(380px,100%);background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:0 30px 80px rgba(14,21,36,.35);display:flex;flex-direction:column;gap:8px}
  .pk h2{font-size:16px;font-weight:800;margin:0}
  .pk-sub{font-size:12.5px;color:var(--muted);margin-bottom:6px}
  .pk-card{display:flex;flex-direction:column;align-items:flex-start;gap:3px;background:#fff;border:1px solid var(--line2);border-radius:12px;padding:12px 14px;font-family:inherit;text-align:left;cursor:pointer;transition:var(--t)}
  .pk-card:hover{border-color:var(--blue);background:var(--blue-t)}
  .pk-new{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--blue);border:1px solid var(--blue);border-radius:12px;padding:12px;font-family:inherit;font-size:13.5px;font-weight:700;color:#fff;cursor:pointer;margin-top:2px}
  .pk-new:hover{background:var(--blue-d)}
  .pk-new svg{stroke:currentColor}
  .pk-cancel{background:none;border:none;padding:6px;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--muted);cursor:pointer}
  .pk-cancel:hover{color:var(--ink)}
  .ledhead{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px}
  .ledhead h2{font-size:16px;font-weight:800;margin:0}
  .ledcount{font-size:12.5px;color:var(--muted)}
  .ledlist{display:flex;flex-direction:column;gap:8px}
  .ledrow{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 16px}
  .lreason{display:flex;align-items:center;gap:7px;font-size:13.5px;font-weight:600;color:var(--ink)}
  .lreason :global(svg){stroke:var(--muted);flex:0 0 auto}
  .ldate{font-size:11.5px;color:var(--muted);margin-top:3px}
  .lamt{text-align:right;display:flex;flex-direction:column;gap:2px}
  .lamt .plus{font-weight:800;color:var(--ok)}
  .lamt .minus{font-weight:800;color:var(--ink)}
  .lamt .lbal{font-size:11px;color:var(--muted)}
  .moreled{align-self:center;margin-top:6px;background:#fff;border:1px solid var(--line2);border-radius:10px;padding:9px 20px;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--ink2);cursor:pointer}
  .moreled:hover{border-color:var(--blue);color:var(--blue-d)}
  @media(max-width:720px){.prodgrid{grid-template-columns:1fr}}

  /* ── 지원서 작성(DraftsView, 카드#035) ── 다른 뷰와 마찬가지로 뷰별 스타일도 이 공용 파일에 둔다. */
  /* 목록 카드 — 카드 전체가 열기 버튼이고 삭제만 따로 둔다(.card 안의 .actions 재사용). */
  .dfcard{padding:0}
  .dfopen{display:block;width:100%;text-align:left;background:transparent;border:none;font-family:inherit;color:inherit;cursor:pointer;padding:20px 22px 4px;border-radius:16px 16px 0 0}
  .dfopen:hover .label{color:var(--blue-d)}
  .dfopen:focus-visible{outline:2px solid var(--blue);outline-offset:-2px}
  /* 회사명·직무·문항은 전부 사용자 입력이다 — 공백 없는 긴 한 덩어리가 카드를 가로로 뚫지 않게(카드#031 규칙). */
  .dfcard .label,.dfcard .badge{overflow-wrap:anywhere}
  .dfq{overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .dfdate{font-size:11.5px;color:var(--muted);margin-top:8px}
  .dfcard .actions{margin-top:0;padding:0 22px 18px}
  /* 안내·오류 — .notice 계열과 같은 톤. 사용자 입력을 되싣는 문구가 있어 여기도 anywhere. */
  /* word-break:keep-all — 문구가 두 줄로 갈릴 때 어절 중간이 아니라 띄어쓰기에서 끊긴다.
     overflow-wrap:anywhere 와 함께 쓴다: 평소엔 어절 단위, 공백 없는 긴 한 덩어리(회사명·URL)만 강제로 끊는다. */
  .dferr{background:#fdeaea;border:1px solid #f0c9cb;color:var(--danger);border-radius:11px;padding:11px 14px;margin-bottom:16px;font-size:12.5px;font-weight:600;line-height:1.55;word-break:keep-all;overflow-wrap:anywhere}
  .dfnote{font-size:12.5px;font-weight:700;color:var(--ok)}
  /* 다음 행동 유도(충전·자료 등록). 버튼과 안내문이 같은 모양이라 시선이 한 곳에 모인다. */
  .dfgo{display:flex;align-items:flex-start;gap:8px;width:100%;background:var(--warn-t);border:1px solid #f4d9be;color:var(--warn);border-radius:11px;padding:11px 14px;margin-bottom:16px;font-family:inherit;font-size:12.5px;font-weight:700;line-height:1.55;word-break:keep-all;text-align:left;cursor:pointer;transition:var(--t)}
  .dfgo:hover{background:#fbe6d4}
  .dfgo.static{cursor:default}
  .dfgo.static:hover{background:var(--warn-t)}
  /* 아이콘 박스 높이를 첫 줄 line-height 와 같게 두면 두 줄이 돼도 아이콘이 첫 줄과 광학 정렬된다
     (.notice svg 와 같은 방식 — 눈대중 margin 보정 금지). */
  .dfgo svg{stroke:currentColor;flex:0 0 auto;height:1.55em}
  .dfgo:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  /* 입력칸 + 실행 버튼 한 줄. align-items:stretch 라 버튼 높이가 입력칸을 따라간다
     (눈대중 margin 보정 없이 위아래 경계가 맞는다). */
  .dfurl{display:flex;align-items:stretch;gap:8px}
  .dfurl .finput{flex:1;min-width:0}
  .dfurl .pbtn{flex:0 0 auto;white-space:nowrap}
  /* 공고 읽어오기 결과 — 누른 자리(URL 행) 바로 아래, 힌트와 같은 자리·같은 타이포. 성패는 색으로만 가른다
     (기존 --ok / --danger 토큰 그대로, 새 색 없음). 아이콘 박스 높이를 line-height 와 같게 둬야
     두 줄이 돼도 아이콘이 첫 줄과 광학 정렬된다(.dfgo svg 와 같은 방식 — 눈대중 margin 보정 금지).
     line-height 는 지정하지 않는다 — .fhint 와 같은 값(normal)이어야 힌트↔안내 전환에서 아래 폼이 1px 도 밀리지 않는다. */
  .dfurlmsg{display:flex;align-items:flex-start;gap:5px;font-weight:700;word-break:keep-all;overflow-wrap:anywhere}
  .dfurlmsg svg{flex:0 0 auto;stroke:currentColor;height:1.6em}
  .dfurlmsg span span{display:inline-block}
  .dfurlmsg.ok{color:var(--ok)}
  .dfurlmsg.bad{color:var(--danger)}
  /* 옵션 버튼 그룹 — .nf-seg 와 같은 토큰. 3등분(flex:1)이라 좌우 여백이 대칭이다. */
  .dfseg{display:flex;gap:4px;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:4px}
  .dfseg button{flex:1;min-width:0;border:none;background:transparent;border-radius:7px;padding:9px 8px;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--muted);cursor:pointer;transition:var(--t)}
  .dfseg button:hover{color:var(--ink)}
  .dfseg button.on{background:#fff;color:var(--blue-d);box-shadow:0 1px 4px rgba(14,21,36,.08)}
  .dfseg button:focus-visible{outline:2px solid var(--blue);outline-offset:-2px}
  /* 생성 진행률 — 완료한 문항은 실측(k/N), 진행 중인 문항만 그 구간 안에서 추정으로 찬다. */
  .dfprog{margin-top:14px}
  .dfprogtext{margin-bottom:8px;font-size:12.5px;font-weight:700;color:var(--ink2)}
  .dfprogrow{display:flex;align-items:center;gap:10px}
  .dfprogbar{flex:1;min-width:0;height:6px;border-radius:999px;background:var(--line);overflow:hidden}
  .dfprogfill{display:block;height:100%;border-radius:999px;background:var(--blue);transition:width .3s linear}
  /* 폭 고정 + tabular-nums — 9% → 100% 로 자릿수가 변해도 바 길이가 흔들리지 않는다(폭은 실측값). */
  .dfprogpct{flex:0 0 38px;text-align:right;font-size:12px;font-weight:800;color:var(--blue-d);font-variant-numeric:tabular-nums}
  /* 결과 패널 — 폼 카드와 같은 상자를 아래에 하나 더 둔다. */
  .dfresult{margin-top:16px}
  .dfguard{display:flex;align-items:flex-start;gap:8px;background:var(--blue-t);border:1px solid var(--line);border-radius:11px;padding:11px 13px;margin-bottom:14px;font-size:12.5px;font-weight:700;line-height:1.55;color:var(--ink2);word-break:keep-all}
  .dfguard svg{stroke:var(--blue-d);flex:0 0 auto;height:1.55em}
  /* 문장 단위 inline-block — 줄이 갈릴 때 문장 경계에서만 갈린다("직접 / 확인하세요" 방지).
     문장 하나가 통째로 안 들어갈 만큼 좁아지면 그때만 안에서 다시 접힌다(넘침 없음). */
  .dfguard span span{display:inline-block}
  .dfbody{min-height:200px;line-height:1.75;word-break:normal;overflow-wrap:anywhere}
  .dfbar{display:flex;align-items:center;gap:8px;margin-top:10px}
  .dflen{margin-right:auto;font-size:11.5px;color:var(--muted);font-variant-numeric:tabular-nums}
  .dfbar .pbtn svg{stroke:currentColor}
  .dfagain{margin-top:18px;border-top:1px dashed var(--line2);padding-top:16px}
  .dfagain .pbtn svg{stroke:currentColor}
  /* 라벨 + 물음표 버튼 한 줄 — 정렬은 컨테이너 속성으로(눈대중 margin 보정 금지). */
  .dflabelrow{display:flex;align-items:center}
  .dftip{position:relative;display:inline-flex;align-items:center}
  .dftipbtn{display:inline-flex;align-items:center;justify-content:center;margin-left:5px;padding:2px;border:none;background:transparent;color:var(--muted);border-radius:50%;cursor:pointer;transition:var(--t)}
  .dftipbtn:hover{color:var(--blue-d)}
  .dftipbtn:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  /* 툴팁은 라벨 **위**로 펼친다 — 아래·오른쪽 어디로 펼쳐도 바로 밑의 문체 버튼을 덮어
     무엇이 골라져 있는지 안 보인다(3등분 세그먼트가 폼 폭 전체를 쓴다). 위쪽은 앞 입력칸의
     여백이라 가려도 무해하고, 이 필드는 폼 중간이라 잘릴 만큼 위가 좁지 않다. */
  .dftipbox{position:absolute;left:-10px;bottom:calc(100% + 8px);z-index:20;width:max-content;max-width:min(300px,calc(100vw - 64px));display:flex;flex-direction:column;gap:6px;background:var(--ink);color:#fff;border-radius:10px;padding:10px 12px;font-size:12px;font-weight:600;line-height:1.5;letter-spacing:normal;box-shadow:0 10px 30px rgba(14,21,36,.28);word-break:keep-all;text-transform:none}
  .dftiprow b{margin-right:6px;font-weight:800}
  /* 문항 입력 반복 — 입력칸 + 삭제 버튼. stretch 라 버튼 높이가 입력칸을 따라간다. */
  .dfqrow{display:flex;align-items:stretch;gap:8px;margin-bottom:8px}
  .dfqrow .finput{flex:1;min-width:0}
  .dfqcount{flex:0 0 64px;display:flex;align-items:center;justify-content:flex-end;white-space:nowrap;font-size:11.5px;color:var(--muted);font-variant-numeric:tabular-nums}
  .dfqdel{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:42px;border:1px solid var(--line2);background:#fff;color:var(--muted);border-radius:9px;cursor:pointer;transition:var(--t)}
  .dfqdel:hover{border-color:var(--danger);color:var(--danger)}
  .dfqdel:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  .dfqadd{display:inline-flex;align-items:center;gap:6px;border:1px dashed var(--line2);background:#fff;color:var(--ink2);border-radius:9px;padding:9px 13px;font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer;transition:var(--t)}
  .dfqadd:hover{border-color:var(--blue);color:var(--blue-d)}
  .dfqadd:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  /* 공고 전문이 들어오는 칸 — 기본 높이를 넉넉히. */
  .dfpaste{min-height:150px}
  .dfcountrow{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
  .dfcount{flex:0 0 auto;font-variant-numeric:tabular-nums}
  .dfcount.over{color:var(--danger);font-weight:700}
  .dfslim{margin:8px 0 0}
  /* 그룹(카드) 머리 — 회사 · 직무 + 문항 수. */
  .dfghead{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
  .dfghead .label{overflow-wrap:anywhere}
  .dfghead .badge{overflow-wrap:anywhere}
  .dfgmeta{margin-left:auto;flex:0 0 auto;font-size:12px;font-weight:700;color:var(--muted)}
  /* 문항 섹션 — 문항 하나가 카드 하나. */
  .dfsec{margin-top:16px}
  .dfsechead{display:flex;align-items:center;gap:10px;margin-bottom:10px}
  .dfsecno{flex:0 0 auto;background:var(--blue-t);color:var(--blue-d);border-radius:7px;padding:4px 9px;font-size:11.5px;font-weight:800}
  .dfsechead .act{margin-left:auto}
  .dfsecq{margin:0 0 12px;font-size:14px;font-weight:700;line-height:1.6;word-break:keep-all;overflow-wrap:anywhere}
  .dffail .dfsecno{background:#fdeaea;color:var(--danger)}
  /* 공고 매칭 리포트(카드#036) — 칩은 기존 .badge 토큰을 그대로 쓴다(.b-univ 강조 / .b-co 회색, 새 색 없음).
     두 종류는 항상 다른 줄에 놓이므로 .b-co 의 1px 테두리가 옆 칩과 높이를 어긋나게 하지 않는다.
     .top = 그룹 카드 상단(제목 바로 아래) — 위 여백은 .dfghead 의 margin-bottom 이 이미 만든다. */
  .dfcov{margin-top:14px;border-top:1px dashed var(--line2);padding-top:14px}
  .dfcov.top{margin-top:0;margin-bottom:14px}
  .dfcovrow + .dfcovrow,.dfcovsum + .dfcovrow{margin-top:12px}
  .dfcovsum{font-size:13px;font-weight:700;color:var(--ink2);word-break:keep-all}
  .dfcovsum b{color:var(--blue-d);font-weight:800}
  .dfchips{display:flex;flex-wrap:wrap;gap:6px}
  /* 요구역량 한 줄이 통째로 들어가는 칩이라 두 줄이 될 수 있다 — keep-all 로 어절이 갈리지 않게 하고
     행간을 벌린다(.badge 의 overflow-wrap:anywhere 가 공백 없는 긴 토큰만 예외로 접는다). */
  .dfchips .badge{line-height:1.5;word-break:keep-all}
  /* .b-co 는 1px 테두리가 있고 .b-univ 는 없어 두 종류의 칩 높이가 2px 어긋난다(24.5 vs 26.5, 실측).
     투명 테두리로 박스 모델을 맞춘다 — 눈대중 margin 보정이 아니라 같은 속성으로 맞추는 방식. */
  .dfchips .b-univ{border:1px solid transparent}
  /* 좁은 화면: 입력칸 위 / 버튼 아래로 떨어뜨려 버튼이 44px 터치 영역을 갖게 한다. */
  @media(max-width:640px){
    .dfurl{flex-direction:column}
    .dfurl .pbtn{justify-content:center;min-height:44px}
    .dfbar{flex-wrap:wrap}
  }
`;
