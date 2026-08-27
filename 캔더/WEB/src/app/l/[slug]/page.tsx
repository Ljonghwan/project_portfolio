import type { Metadata } from "next";
import ogImage from "../../opengraph-image.png";
import { LinkSessionClient } from "./LinkSessionClient";

// 서버 컴포넌트 전용 API base(카드#020 B). `lib/api.ts` 의 API_BASE 는 **브라우저 기준**이라
// prod 미설정 시 상대경로("")가 되어 SSR fetch 에서 동작하지 않는다.
// ⚠️ `NEXT_PUBLIC_` 접두를 붙이지 않는다 — 번들에 인라인될 값이 아니라 런타임 서버 env 다.
const API_INTERNAL =
  process.env.API_INTERNAL_BASE || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

// 미리보기 이미지의 대체 텍스트. 이미지가 루트와 같은 브랜드 카드라 문구도 같아야 한다 —
// ⚠️ `src/app/opengraph-image.alt.txt` 와 **함께** 고칠 것(.txt 는 import 할 수 없어 값을 나눠 갖는다).
const OG_ALT = "Candour · 당신의 이력서가 스스로 답합니다 — 지원자의 자료로만 답하는 채용 특화 AI";

// 제출용 사설 링크의 미리보기(카카오·슬랙 등)에 지원자 이름을 싣는다.
// 🔒 `robots: noindex` 는 **이름 유무와 무관하게 항상** — 실명이 검색에 색인되면 안 된다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const base: Metadata = { robots: { index: false, follow: false } };

  let name = "";
  try {
    const res = await fetch(`${API_INTERNAL}/api/links/${encodeURIComponent(slug)}/meta`, {
      next: { revalidate: 60 },
    });
    // 404(없는 링크)·410(비활성)·서버 down 은 전부 조용히 폴백한다 — 미리보기 문구 하나 때문에
    // 페이지가 죽으면 안 된다. 화면 자체의 상태 UI 는 클라이언트가 그대로 그린다.
    if (res.ok) name = String((await res.json())?.data?.displayName ?? "").trim();
  } catch {
    // 위와 같은 이유로 삼킨다.
  }

  // 이름 미입력(가입 직후) 계정이면 루트 기본 메타를 그대로 쓴다 — 빈 값을 "지원자" 로 채우면
  // "지원자 지원자 · Candour" 같은 문장이 된다.
  if (!name) return base;

  const title = `${name} 지원자 · Candour`;
  const description = `${name} 지원자의 자료로만 답하는 AI에게 직접 물어보세요. 사실만, 중립적으로 답합니다.`;
  return {
    ...base,
    title,
    description,
    // url 은 상대경로 — layout.tsx 의 metadataBase 가 절대화한다.
    openGraph: {
      title,
      description,
      siteName: "Candour",
      locale: "ko_KR",
      type: "website",
      url: `/l/${slug}`,
      // ⚠️ **openGraph 를 정의하면 루트의 og:image 까지 통째로 대체된다**(실측 — 이 블록을 지우면
      //    이미지는 상속되지만 og:title 이 루트 문구로 돌아간다). Next 의 opengraph-image 파일
      //    컨벤션은 그 파일이 있는 세그먼트에만 붙기 때문이다. 여기서 이미지를 다시 지정하지 않으면
      //    카카오·슬랙 미리보기가 이미지 없는 카드로 뜬다.
      //    URL 을 손으로 적지 않고 **루트와 같은 PNG 를 정적 import** 해 Next 가 만든 경로·크기를
      //    그대로 쓴다 — 파일을 복사하지 않으므로 이중 관리가 생기지 않는다(이미지를 바꾸면 함께 따라온다).
      images: [{ url: ogImage.src, width: ogImage.width, height: ogImage.height, alt: OG_ALT }],
    },
  };
}

export default async function LinkSessionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <LinkSessionClient slug={slug} />;
}
