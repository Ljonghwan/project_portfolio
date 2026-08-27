"use client";

// Sprint p2-3-fix1 — 행정구역(시/도 + 시군구 2단계) 전역 store. 단일 출처 = 서버 정적 상수.
// 서버 `/api/regions/sidos`(시도+표시명) / `/api/regions/sigungus?sido=`(시군구) 소비.
// 외부 DB·동(洞) 데이터 없음. front 어디에도 시/도·시군구 리터럴이 없다.
import { create } from "zustand";
import { useEffect } from "react";
import { api } from "@/lib/api";

export type SidoMeta = { sido: string; display: string; short: string };

type RegionState = {
  sidos: string[]; // 서버 정렬 순서 유지
  sidoMeta: Record<string, { display: string; short: string }>;
  sigungusBySido: Record<string, string[]>;
  loaded: boolean; // 시/도 로드 완료
  loading: boolean;
  sigunguLoading: Record<string, boolean>;
  /** 시/도 목록 1회 fetch (멱등). */
  init: () => Promise<void>;
  /** 특정 시/도의 시군구 lazy fetch (캐시, 멱등). */
  loadSigungus: (sido: string) => Promise<void>;
};

export const useRegionStore = create<RegionState>((set, get) => ({
  sidos: [],
  sidoMeta: {},
  sigungusBySido: {},
  loaded: false,
  loading: false,
  sigunguLoading: {},
  init: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const res = await api.get<SidoMeta[]>("/api/regions/sidos");
    if (res.success && Array.isArray(res.data)) {
      const sidos: string[] = [];
      const sidoMeta: Record<string, { display: string; short: string }> = {};
      for (const s of res.data) {
        sidos.push(s.sido);
        sidoMeta[s.sido] = { display: s.display, short: s.short };
      }
      set({ sidos, sidoMeta, loaded: true, loading: false });
    } else {
      set({ loading: false });
    }
  },
  loadSigungus: async (sido: string) => {
    if (!sido) return;
    const st = get();
    if (st.sigungusBySido[sido] || st.sigunguLoading[sido]) return;
    set((s) => ({ sigunguLoading: { ...s.sigunguLoading, [sido]: true } }));
    const res = await api.get<string[]>(`/api/regions/sigungus?sido=${encodeURIComponent(sido)}`);
    set((s) => ({
      sigungusBySido: {
        ...s.sigungusBySido,
        [sido]: res.success && Array.isArray(res.data) ? res.data : [],
      },
      sigunguLoading: { ...s.sigunguLoading, [sido]: false },
    }));
  },
}));

/** 시도 정식 표기(서버 메타의 display). 메타 미로드 시 key 그대로. */
export function sidoDisplay(sido: string): string {
  return useRegionStore.getState().sidoMeta[sido]?.display ?? sido;
}

/** 누적 pill 라벨 — "서울시 강남구" / "경기 분당구". */
export function formatRegionLabel(sido: string, sigungu: string): string {
  const short = useRegionStore.getState().sidoMeta[sido]?.short ?? sido;
  return `${short} ${sigungu}`;
}

/** p2-jobform-salary-addr 작업3: 우편번호 sido 원문(예 "서울특별시"/"서울")을 regionStore 키("서울")로 정규화.
 *  목록 지역필터(?region=키) 매칭을 위해 저장 region의 시도부를 키로 통일. 매칭 실패 시 원문 반환. */
export function normalizeSido(raw: string): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  const { sidos, sidoMeta } = useRegionStore.getState();
  // 1) 키 정확히 일치
  if (sidos.includes(t)) return t;
  // 2) display/short 일치 또는 prefix 양방향
  for (const key of sidos) {
    const meta = sidoMeta[key];
    if (meta && (meta.display === t || meta.short === t)) return key;
    if (t.startsWith(key) || key.startsWith(t)) return key;
    if (meta && (t.startsWith(meta.short) || meta.short.startsWith(t))) return key;
  }
  return t;
}

// --- 순수 문자열 헬퍼 (지역 데이터 아님) — region 단일 string ↔ {sido, sigungu} ---
export function composeRegion(sido: string, sigungu: string): string {
  const s = (sido ?? "").trim();
  const g = (sigungu ?? "").trim();
  if (!s) return "";
  return g ? `${s} ${g}` : s;
}

export function parseRegion(region: string | null | undefined): { sido: string; sigungu: string } {
  const t = (region ?? "").trim();
  if (!t) return { sido: "", sigungu: "" };
  const i = t.indexOf(" ");
  if (i < 0) return { sido: t, sigungu: "" };
  return { sido: t.slice(0, i).trim(), sigungu: t.slice(i + 1).trim() };
}

// --- 소비 hook (컴포넌트용; 미로드 시 빈 배열 → 로드되면 자동 리렌더) ---
export function useSidoList(): string[] {
  const sidos = useRegionStore((s) => s.sidos);
  const loaded = useRegionStore((s) => s.loaded);
  const init = useRegionStore((s) => s.init);
  useEffect(() => {
    if (!loaded) void init();
  }, [loaded, init]);
  return sidos;
}

export type SidoOption = { value: string; label: string };

// 시도 select/칩용 — value=키(저장·필터 호환), label=서버 display(표시명). sidoMeta 반응형.
export function useSidoOptions(): SidoOption[] {
  const sidos = useRegionStore((s) => s.sidos);
  const sidoMeta = useRegionStore((s) => s.sidoMeta);
  const loaded = useRegionStore((s) => s.loaded);
  const init = useRegionStore((s) => s.init);
  useEffect(() => {
    if (!loaded) void init();
  }, [loaded, init]);
  return sidos.map((s) => ({ value: s, label: sidoMeta[s]?.display ?? s }));
}

export function useSigunguList(sido: string): string[] {
  const map = useRegionStore((s) => s.sigungusBySido);
  const loadSigungus = useRegionStore((s) => s.loadSigungus);
  useEffect(() => {
    if (sido) void loadSigungus(sido);
  }, [sido, loadSigungus]);
  return sido ? map[sido] ?? [] : [];
}
