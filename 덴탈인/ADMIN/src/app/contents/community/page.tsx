"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  App,
  Table,
  Tag,
  Select,
  Space,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Drawer,
  Descriptions,
  Tabs,
  Image,
  DatePicker,
} from "antd";
import type { TablePaginationConfig } from "antd";
import type { Dayjs } from "dayjs";
import AdminShell from "@/components/AdminShell";
import { useAdmin } from "@/lib/useAdmin";
import { api, apiFetch } from "@/lib/api";
import { codeLabel, codeOptions, useCodes } from "@/lib/codes";
import { formatPhone } from "@/lib/format";

type SidoEntry = { sido: string; display: string; short: string };

type BoardType = "review" | "talk" | "urgent";
// p2-6: board 라벨은 서버 /api/codes(postBoard) 소비.

type AuthorView = {
  id: number;
  alias?: string;
  name?: string;
  emailMasked: string | null;
  userType: string;
  status: string;
} | null;

interface BasePost {
  boardType: BoardType;
  id: number;
  title: string;
  viewCount: number;
  commentCount: number;
  reportCount?: number;
  isDeleted: boolean;
  isHiddenByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  author: AuthorView;
}

interface ReviewItem extends BasePost {
  hospitalName: string;
  region: string;
  jobType: string;
  rating: number;
  ratingAvg: number | null;
  ratingWorkload: number | null;
  ratingAtmosphere: number | null;
  ratingWelfare: number | null;
  ratingSalary: number | null;
  likeCount: number;
}
interface TalkItem extends BasePost {
  category: string;
  likeCount: number;
}
interface UrgentItem extends BasePost {
  hospitalName: string;
  region: string;
  jobTypes: string[];
  workTypes: string[];
  headcount: number;
  contactPhone: string;
  bookmarkCount: number;
  expiredAt: string | null;
}

type AnyPost = ReviewItem | TalkItem | UrgentItem;

const STATUS_OPTS = [
  { value: "visible", label: "공개" },
  { value: "hidden", label: "운영자 비공개" },
  { value: "deleted", label: "삭제됨" },
  { value: "all", label: "전체" },
];

function statusTag(p: BasePost) {
  if (p.isDeleted) return <Tag color="default">삭제됨</Tag>;
  if (p.isHiddenByAdmin) return <Tag color="orange">운영자 비공개</Tag>;
  return <Tag color="green">공개중</Tag>;
}

export default function CommunityPage() {
  const { message } = App.useApp();
  useCodes();
  const { admin, loading: authLoading } = useAdmin();
  const [boardType, setBoardType] = useState<BoardType>("review");
  const [items, setItems] = useState<AnyPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("visible");
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  // msg-g4 단위B 후기 필터(기획): 등록일/지역(시도)/직종
  const [createdRange, setCreatedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [sido, setSido] = useState("");
  const [jobType, setJobType] = useState("");
  const [sidos, setSidos] = useState<SidoEntry[]>([]);
  // 급구 전용 필터: 채용기간(expiredAt 범위) + 근무형태
  const [expiredRange, setExpiredRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [workType, setWorkType] = useState("");
  // 그룹3: 정렬(추천수·조회수·댓글수 오름/내림). null이면 기본(최신순).
  const [sortBy, setSortBy] = useState<"likeCount" | "viewCount" | "commentCount" | null>(null);
  const [sortDir, setSortDir] = useState<"ascend" | "descend" | null>(null);
  // C1: "초기화" — 필터 전체 리셋 + 페이지1 + 필터영역 remount.
  const [resetKey, setResetKey] = useState(0);
  const resetFilters = () => {
  setStatus("visible"); setKeyword(""); setSearchInput(""); setCreatedRange(null); setSido(""); setJobType(""); setExpiredRange(null); setWorkType(""); setSortBy(null); setSortDir(null); setPage(1);
    setResetKey((k) => k + 1);
  };

  const [detailId, setDetailId] = useState<number | null>(null);
  const [hideTarget, setHideTarget] = useState<{ id: number; isHiddenByAdmin: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("status", status);
    if (keyword) params.set("keyword", keyword);
    // 등록일은 전 보드 공통, 지역/직종은 후기 전용(서버 review 핸들러).
    if (createdRange?.[0]) params.set("createdFrom", createdRange[0].format("YYYY-MM-DD"));
    if (createdRange?.[1]) params.set("createdTo", createdRange[1].format("YYYY-MM-DD"));
    if (boardType === "review") {
      if (sido) params.set("sido", sido);
      if (jobType) params.set("jobType", jobType);
    } else if (boardType === "urgent") {
      if (sido) params.set("sido", sido); // 서버 urgent는 region/sido 둘 다 수용
      if (jobType) params.set("jobType", jobType);
      if (workType) params.set("workType", workType);
      if (expiredRange?.[0]) params.set("expiredFrom", expiredRange[0].format("YYYY-MM-DD"));
      if (expiredRange?.[1]) params.set("expiredTo", expiredRange[1].format("YYYY-MM-DD"));
    }
    // 그룹3: 정렬(추천/조회/댓글 오름·내림). AntD sortOrder → 서버 sortDir(asc/desc).
    if (sortBy && sortDir) {
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir === "ascend" ? "asc" : "desc");
    }
    const res = await api.get<{ items: AnyPost[]; total: number }>(
      `/api/admin/posts/${boardType}?${params.toString()}`
    );
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      message.error(res.message || "목록을 불러올 수 없습니다.");
    }
  }, [boardType, page, pageSize, status, keyword, createdRange, sido, jobType, workType, expiredRange, sortBy, sortDir, message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  useEffect(() => {
    api.get<SidoEntry[]>("/api/regions/sidos").then((res) => { if (res.success && Array.isArray(res.data)) setSidos(res.data); });
  }, []);

  // 보드 전환 시 페이지/검색/필터 초기화
  useEffect(() => {
    setPage(1);
    setKeyword("");
    setSearchInput("");
    setStatus("visible");
    setCreatedRange(null);
    setSido("");
    setJobType("");
    setExpiredRange(null);
    setWorkType("");
    setSortBy(null);
    setSortDir(null);
  }, [boardType]);

  const columns = useMemo(() => {
    const base = [
      { title: "ID", dataIndex: "id", width: 70 },
      {
        title: "제목",
        dataIndex: "title",
        render: (v: string, r: AnyPost) => (
          <a onClick={() => setDetailId(r.id)} data-testid={`admin-community-row-${r.id}`}>
            {v}
          </a>
        ),
      },
    ];
    if (boardType === "review") {
      const r3 = (v: number | null) => (v != null ? `${v}★` : "-");
      base.push(
        { title: "병원", dataIndex: "hospitalName", width: 130, ellipsis: true } as never,
        { title: "병원위치", dataIndex: "region", width: 100 } as never,
        // 나의 업무(직종) — 회원 직종 도메인(reviewJobLabelOverride 9키).
        { title: "나의 업무", key: "jobType", width: 100, render: (_: unknown, r: AnyPost) => codeLabel("reviewJobLabelOverride", (r as ReviewItem).jobType) } as never,
        // { title: "평점", key: "ratingAvg", width: 64, render: (_: unknown, r: AnyPost) => { const x = (r as ReviewItem).ratingAvg ?? (r as ReviewItem).rating; return x != null ? `${x}★` : "-"; } } as never,
        // G2 A3: 4축 평점(front 순서 급여수준→분위기→업무강도→직원복지)을 한 컬럼에 줄바꿈 표시.
        {
          title: "세부 평점", key: "ratings4", width: 120,
          render: (_: unknown, r: AnyPost) => {
            const rv = r as ReviewItem;
            return (
              <div style={{ fontSize: 12, lineHeight: 1.6, whiteSpace: "nowrap" }}>
                급여수준 {r3(rv.ratingSalary)}<br />
                분위기 {r3(rv.ratingAtmosphere)}<br />
                업무강도 {r3(rv.ratingWorkload)}<br />
                직원복지 {r3(rv.ratingWelfare)}
              </div>
            );
          },
        } as never,
        // 추천 컬럼은 공통 블록으로 이동(작성자 뒤, 정렬 지원).
      );
    } else if (boardType === "talk") {
      base.push(
        { title: "카테고리", dataIndex: "category", width: 140, render: (v: string) => codeLabel("talkCategory", v) } as never,
      );
    } else if (boardType === "urgent") {
      base.push(
        { title: "병원", dataIndex: "hospitalName", width: 130, ellipsis: true } as never,
        { title: "근무지역", dataIndex: "region", width: 130 } as never,
        // 업무(직종) — urgentJobType 도메인 다중. 라벨 join.
        { title: "업무", key: "jobTypes", width: 140, render: (_: unknown, r: AnyPost) => ((r as UrgentItem).jobTypes || []).map((k) => codeLabel("urgentJobType", k)).join(", ") || "-" } as never,
        { title: "마감일", dataIndex: "expiredAt", width: 110, render: (v: string | null) => (v ? new Date(v).toLocaleDateString("ko-KR") : "-") } as never,
      );
    }
    // 그룹3: 작성자 → (추천) → 조회수 → 댓글수 순 + 추천/조회/댓글 정렬(서버). 추천은 review/talk만.
    const sortOrderOf = (key: "likeCount" | "viewCount" | "commentCount") => (sortBy === key ? sortDir : null);
    base.push(
      {
        title: "작성자",
        key: "author",
        width: 180,
        ellipsis: true,
        render: (_: unknown, r: AnyPost) => {
          if (!r.author) return "-";
          const label = r.author.alias || r.author.name || `#${r.author.id}`;
          return `${label} (${r.author.emailMasked || "-"})`;
        },
      } as never,
    );
    if (boardType !== "urgent") {
      base.push(
        {
          title: "추천",
          key: "likeCount",
          width: 90,
          sorter: true,
          sortOrder: sortOrderOf("likeCount"),
          render: (_: unknown, r: AnyPost) => (r as ReviewItem | TalkItem).likeCount,
        } as never,
      );
    }
    base.push(
      {
        title: "조회수",
        key: "viewCount",
        width: 90,
        sorter: true,
        sortOrder: sortOrderOf("viewCount"),
        render: (_: unknown, r: AnyPost) => r.viewCount,
      } as never,
      {
        title: "댓글수",
        key: "commentCount",
        width: 90,
        sorter: true,
        sortOrder: sortOrderOf("commentCount"),
        render: (_: unknown, r: AnyPost) => r.commentCount,
      } as never,
      {
        title: "상태",
        key: "status",
        width: 130,
        render: (_: unknown, r: AnyPost) => statusTag(r),
      } as never,
      {
        title: "작성일",
        dataIndex: "createdAt",
        width: 140,
        render: (v: string) => new Date(v).toLocaleString("ko-KR"),
      } as never,
      {
        title: "처리",
        key: "actions",
        width: 140,
        render: (_: unknown, r: AnyPost) => (
          <Space wrap>
            {!r.isDeleted && (
              <Button
                size="small"
                onClick={() => setHideTarget({ id: r.id, isHiddenByAdmin: r.isHiddenByAdmin })}
                data-testid={`admin-community-hide-${r.id}`}
              >
                {r.isHiddenByAdmin ? "복원" : "비공개"}
              </Button>
            )}
            {!r.isDeleted && (
              <Button
                size="small"
                danger
                onClick={() => setDeleteTarget({ id: r.id })}
                data-testid={`admin-community-delete-${r.id}`}
              >
                삭제
              </Button>
            )}
          </Space>
        ),
      } as never,
    );
    return base;
  }, [boardType, sortBy, sortDir]);

  if (authLoading || !admin) return null;

  return (
    <AdminShell>
      <Card title="커뮤니티 관리" data-testid="admin-community-page">
        <Tabs
          activeKey={boardType}
          onChange={(k) => setBoardType(k as BoardType)}
          items={[
            { key: "review", label: codeLabel("postBoard", "review") },
            { key: "talk", label: codeLabel("postBoard", "talk") },
            { key: "urgent", label: codeLabel("postBoard", "urgent") },
          ]}
        />

        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <Select
            value={status}
            options={STATUS_OPTS}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            style={{ width: 160 }}
            data-testid="admin-community-status-filter"
          />
          <Input
            placeholder={boardType === "review" ? "병원명/이름/아이디" : boardType === "urgent" ? "병원명/공고제목" : "제목/이름/아이디"}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={() => {
              setKeyword(searchInput.trim());
              setPage(1);
            }}
            allowClear
            style={{ width: 240 }}
            data-testid="admin-community-search"
          />
          {/* 등록일 — 전 보드 공통(기획) */}
          <DatePicker.RangePicker
            value={createdRange as [Dayjs, Dayjs] | null}
            onChange={(v) => { setCreatedRange(v as [Dayjs | null, Dayjs | null] | null); setPage(1); }}
            placeholder={["등록일 시작", "등록일 끝"]}
            data-testid="admin-community-created-range"
          />
          {/* 후기 전용: 지역(시도) + 직종 */}
          {boardType === "review" && (
            <>
              <Select
                value={sido}
                onChange={(v) => { setSido(v); setPage(1); }}
                style={{ width: 130 }}
                data-testid="admin-community-sido"
                options={[{ value: "", label: "지역(시도) 전체" }, ...sidos.map((s) => ({ value: s.sido, label: s.display }))]}
              />
              <Select
                value={jobType}
                onChange={(v) => { setJobType(v); setPage(1); }}
                style={{ width: 150 }}
                showSearch
                optionFilterProp="label"
                data-testid="admin-community-jobtype"
                options={[{ value: "", label: "직종 전체" }, ...codeOptions("reviewJobLabelOverride")]}
              />
            </>
          )}
          {/* 급구 전용: 채용기간 + 근무지역 + 업무 + 근무형태 */}
          {boardType === "urgent" && (
            <>
              <DatePicker.RangePicker
                value={expiredRange as [Dayjs, Dayjs] | null}
                onChange={(v) => { setExpiredRange(v as [Dayjs | null, Dayjs | null] | null); setPage(1); }}
                placeholder={["채용기간 시작", "마감"]}
                data-testid="admin-community-expired-range"
              />
              <Select
                value={sido}
                onChange={(v) => { setSido(v); setPage(1); }}
                style={{ width: 130 }}
                data-testid="admin-community-urgent-sido"
                options={[{ value: "", label: "근무지역(시도) 전체" }, ...sidos.map((s) => ({ value: s.sido, label: s.display }))]}
              />
              <Select
                value={jobType}
                onChange={(v) => { setJobType(v); setPage(1); }}
                style={{ width: 150 }}
                showSearch
                optionFilterProp="label"
                data-testid="admin-community-urgent-jobtype"
                options={[{ value: "", label: "업무 전체" }, ...codeOptions("urgentJobType")]}
              />
              <Select
                value={workType}
                onChange={(v) => { setWorkType(v); setPage(1); }}
                style={{ width: 130 }}
                data-testid="admin-community-urgent-worktype"
                options={[{ value: "", label: "근무형태 전체" }, ...codeOptions("urgentWorkType")]}
              />
            </>
          )}
          <Button onClick={resetFilters}>초기화</Button>
        </Space>

        <Table<AnyPost>
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
          }}
          onChange={(p: TablePaginationConfig, _f, sorter) => {
            setPage(p.current || 1);
            setPageSize(p.pageSize || 20);
            // 그룹3: 정렬 변경 — 추천/조회/댓글 컬럼 sorter. 해제 시 기본(최신순).
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            const key = (s?.columnKey ?? s?.field) as string | undefined;
            if (s?.order && (key === "likeCount" || key === "viewCount" || key === "commentCount")) {
              setSortBy(key);
              setSortDir(s.order);
            } else {
              setSortBy(null);
              setSortDir(null);
            }
          }}
          columns={columns}
        />
      </Card>

      <PostDetailDrawer
        boardType={boardType}
        postId={detailId}
        onClose={() => setDetailId(null)}
      />

      <HideStatusModal
        boardType={boardType}
        target={hideTarget}
        onClose={() => setHideTarget(null)}
        onDone={() => {
          setHideTarget(null);
          load();
        }}
      />

      <DeletePostModal
        boardType={boardType}
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDone={() => {
          setDeleteTarget(null);
          load();
        }}
      />
    </AdminShell>
  );
}

// ─── 상세 Drawer ─────────────────────────────────────
interface DetailReview extends BasePost {
  content: string;
  hospitalName: string;
  region: string;
  jobType: string;
  rating: number;
  ratingAvg: number | null;
  ratingSalary: number | null;
  ratingAtmosphere: number | null;
  ratingWorkload: number | null;
  ratingWelfare: number | null;
  staffCount: number | null;
  doctorCount: number | null;
  careerType: string | null;
  salaryType: string | null;
  likeCount: number;
  dislikeCount: number;
}
interface DetailTalk extends BasePost {
  content: string;
  category: string;
  images: string[];
  likeCount: number;
  dislikeCount: number;
}
interface DetailUrgent extends BasePost {
  content: string;
  hospitalName: string;
  region: string;
  address: string | null;
  addressDetail: string | null;
  jobTypes: string[];
  workTypes: string[];
  headcount: number;
  salaryType: string;
  salaryText: string | null;
  workHours: string | null;
  contactPhone: string;
  images: string[];
  expiredAt: string | null;
  bookmarkCount: number;
}
type AnyDetail = DetailReview | DetailTalk | DetailUrgent;

interface DetailComment {
  id: number;
  parentId: number | null;
  content: string;
  isDeleted: boolean;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
  author: AuthorView;
}

function PostDetailDrawer({
  boardType,
  postId,
  onClose,
}: {
  boardType: BoardType;
  postId: number | null;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [data, setData] = useState<AnyDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<DetailComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [delCommentTarget, setDelCommentTarget] = useState<DetailComment | null>(null);
  const [delForm] = Form.useForm<{ reason: string }>();
  const [deleting, setDeleting] = useState(false);
  const open = postId != null;

  // 상세 Drawer에서 댓글 강제 삭제(기획) — 댓글관리 페이지와 동일 API(`DELETE /api/admin/comments/:id` + reason, audit 기록).
  async function submitDeleteComment() {
    if (!delCommentTarget) return;
    let values: { reason: string };
    try {
      values = await delForm.validateFields();
    } catch {
      return;
    }
    setDeleting(true);
    const res = await apiFetch(`/api/admin/comments/${delCommentTarget.id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason: values.reason }),
    });
    setDeleting(false);
    if (!res.success) {
      message.error(res.message || "삭제에 실패했습니다.");
      return;
    }
    // 즉시 갱신: soft-delete 렌더(마스킹)와 일치 + commentCount -1.
    const deletedId = delCommentTarget.id;
    setComments((prev) => prev.map((c) => (c.id === deletedId ? { ...c, isDeleted: true, content: "삭제된 댓글입니다." } : c)));
    setData((prev) => (prev ? { ...prev, commentCount: Math.max(0, prev.commentCount - 1) } : prev));
    setDelCommentTarget(null);
    delForm.resetFields();
    message.success("댓글을 삭제했습니다.");
  }

  useEffect(() => {
    if (!open || postId == null) {
      setData(null);
      setComments([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setCommentsLoading(true);
      // 상세 + 댓글 목록 병렬 fetch(기획 상세보기 = 본문 + 댓글 목록).
      const [res, cRes] = await Promise.all([
        api.get<AnyDetail>(`/api/admin/posts/${boardType}/${postId}`),
        api.get<{ items: DetailComment[]; total: number }>(`/api/admin/posts/${boardType}/${postId}/comments?pageSize=200`),
      ]);
      if (cancelled) return;
      setLoading(false);
      setCommentsLoading(false);
      if (res.success && res.data) setData(res.data);
      else message.error(res.message || "상세를 불러올 수 없습니다.");
      setComments(cRes.success && cRes.data ? cRes.data.items : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, boardType, postId, message]);

  return (
    <Drawer
      title={data ? `${codeLabel("postBoard", boardType)} #${data.id}` : "상세"}
      open={open}
      onClose={onClose}
      size="large"
      destroyOnHidden
    >
      {loading && <div>불러오는 중…</div>}
      {data && (
        <>
          <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="제목">{data.title}</Descriptions.Item>
            {"hospitalName" in data && (
              <Descriptions.Item label="병원">{data.hospitalName}</Descriptions.Item>
            )}
            {"region" in data && data.region && (
              <Descriptions.Item label="지역">{data.region}</Descriptions.Item>
            )}
            {"category" in data && (
              <Descriptions.Item label="카테고리">{codeLabel("talkCategory", data.category as string)}</Descriptions.Item>
            )}
            {"jobType" in data && (
              <Descriptions.Item label="직종">{codeLabel("reviewJobLabelOverride", data.jobType as string)}</Descriptions.Item>
            )}
            {/* A-1 D: 상세에 4축 평점 모두 노출(front 순서·라벨). 평균 + 급여수준/분위기/업무강도/직원복지. */}
            {"ratingAvg" in data && (
              <Descriptions.Item label="평점(평균)">
                {(data as DetailReview).ratingAvg ?? (data as DetailReview).rating ?? "-"}★
              </Descriptions.Item>
            )}
            {"ratingSalary" in data && (
              <Descriptions.Item label="급여수준">{(data as DetailReview).ratingSalary != null ? `${(data as DetailReview).ratingSalary}★` : "-"}</Descriptions.Item>
            )}
            {"ratingAtmosphere" in data && (
              <Descriptions.Item label="분위기">{(data as DetailReview).ratingAtmosphere != null ? `${(data as DetailReview).ratingAtmosphere}★` : "-"}</Descriptions.Item>
            )}
            {"ratingWorkload" in data && (
              <Descriptions.Item label="업무강도">{(data as DetailReview).ratingWorkload != null ? `${(data as DetailReview).ratingWorkload}★` : "-"}</Descriptions.Item>
            )}
            {"ratingWelfare" in data && (
              <Descriptions.Item label="직원복지">{(data as DetailReview).ratingWelfare != null ? `${(data as DetailReview).ratingWelfare}★` : "-"}</Descriptions.Item>
            )}
            {/* 기획 후기 상세: 작성자 본인 정보(직원수·원장수 / 근무년차 / 급여) */}
            {"staffCount" in data && ((data as DetailReview).staffCount != null || (data as DetailReview).doctorCount != null) && (
              <Descriptions.Item label="직원수/원장수">
                직원 {(data as DetailReview).staffCount ?? "-"}명 · 원장 {(data as DetailReview).doctorCount ?? "-"}명
              </Descriptions.Item>
            )}
            {"careerType" in data && (data as DetailReview).careerType && (
              <Descriptions.Item label="근무 년차">{codeLabel("reviewCareerType", (data as DetailReview).careerType as string)}</Descriptions.Item>
            )}
            {"salaryType" in data && (data as DetailReview).salaryType && boardType === "review" && (
              <Descriptions.Item label="급여">{codeLabel("reviewSalaryType", (data as DetailReview).salaryType as string)}</Descriptions.Item>
            )}
            {"headcount" in data && (
              <Descriptions.Item label="모집 인원">{data.headcount}명</Descriptions.Item>
            )}
            {"contactPhone" in data && (
              <Descriptions.Item label="연락처">{formatPhone(data.contactPhone)}</Descriptions.Item>
            )}
            {"expiredAt" in data && data.expiredAt && (
              <Descriptions.Item label="마감일">
                {new Date(data.expiredAt).toLocaleString("ko-KR")}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="상태">{statusTag(data)}</Descriptions.Item>
            <Descriptions.Item label="조회/댓글">
              {data.viewCount} / {data.commentCount}
            </Descriptions.Item>
            {/* 기획 상세보기: 추천/비추천 (수다방·후기) 또는 북마크(급구) */}
            {("likeCount" in data) && (
              <Descriptions.Item label="추천/비추천">
                추천 {(data as DetailReview | DetailTalk).likeCount} · 비추천 {(data as DetailReview | DetailTalk).dislikeCount}
              </Descriptions.Item>
            )}
            {"bookmarkCount" in data && (
              <Descriptions.Item label="북마크">{(data as DetailUrgent).bookmarkCount}</Descriptions.Item>
            )}
            <Descriptions.Item label="신고 건수">{data.reportCount ?? 0}건</Descriptions.Item>
            <Descriptions.Item label="작성자">
              {data.author
                ? `${data.author.alias || data.author.name || `#${data.author.id}`} (${data.author.emailMasked || "-"})`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="작성일">
              {new Date(data.createdAt).toLocaleString("ko-KR")}
            </Descriptions.Item>
          </Descriptions>
          {/* 그룹3: 본문 "내용" 타이틀(댓글 타이틀과 동일 폰트). */}
          <div style={{ fontWeight: 600, margin: "16px 0 8px" }}>내용</div>
          <div style={{ whiteSpace: "pre-wrap", padding: 12, background: "#fafafa", borderRadius: 6 }}>
            {data.content}
          </div>
          {"images" in data && Array.isArray(data.images) && data.images.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Image.PreviewGroup>
                <Space wrap>
                  {data.images.map((src, i) => (
                    <Image key={i} src={src} width={120} />
                  ))}
                </Space>
              </Image.PreviewGroup>
            </div>
          )}

          {/* 기획 상세보기: 댓글 목록(작성자/내용/추천수/작성일, 대댓글 1단계 들여쓰기, 삭제 표시) */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>댓글 {data.commentCount}</div>
            {commentsLoading ? (
              <div style={{ color: "#999", fontSize: 13 }}>불러오는 중…</div>
            ) : comments.length === 0 ? (
              <div style={{ color: "#999", fontSize: 13, padding: "12px 0" }}>등록된 댓글이 없습니다.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "8px 12px",
                      background: c.isDeleted ? "#f0f0f0" : "#fafafa",
                      borderRadius: 6,
                      marginLeft: c.parentId != null ? 24 : 0,
                      borderLeft: c.parentId != null ? "2px solid #d9d9d9" : undefined,
                      opacity: c.isDeleted ? 0.6 : 1,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      {c.parentId != null && <span>↳</span>}
                      <b style={{ color: "#333" }}>{c.author?.alias || c.author?.name || `#${c.author?.id ?? "-"}`}</b>
                      <span>
                        {c.author?.emailMasked ? ` (${c.author.emailMasked})` : ""}
                        {" · "}
                        {new Date(c.createdAt).toLocaleString("ko-KR")}
                        {" · 추천 "}{c.likeCount}{" · 비추천 "}{c.dislikeCount}
                      </span>
                      {!c.isDeleted && (
                        <Button
                          type="link"
                          danger
                          size="small"
                          style={{ marginLeft: "auto", padding: 0, height: "auto", fontSize: 12 }}
                          data-testid={`admin-community-comment-delete-${c.id}`}
                          onClick={() => {
                            delForm.resetFields();
                            setDelCommentTarget(c);
                          }}
                        >
                          삭제
                        </Button>
                      )}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{c.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <Modal
        title="댓글 삭제"
        open={delCommentTarget != null}
        onCancel={() => { setDelCommentTarget(null); delForm.resetFields(); }}
        onOk={submitDeleteComment}
        confirmLoading={deleting}
        okText="삭제"
        okButtonProps={{ danger: true }}
        cancelText="취소"
        destroyOnHidden
      >
        <p style={{ color: "#666", fontSize: 13 }}>삭제 시 작성자에게 사유가 기록되며, 댓글은 &quot;삭제된 댓글입니다.&quot;로 표시됩니다.</p>
        <Form form={delForm} layout="vertical">
          <Form.Item
            name="reason"
            label="삭제 사유"
            rules={[{ required: true, message: "삭제 사유를 입력하세요." }, { max: 500, message: "500자 이내로 입력하세요." }]}
          >
            <Input.TextArea rows={3} placeholder="삭제 사유" data-testid="admin-community-comment-delete-reason" />
          </Form.Item>
        </Form>
      </Modal>
    </Drawer>
  );
}

// ─── 비공개/복원 모달 ─────────────────────────────────────
function HideStatusModal({
  boardType,
  target,
  onClose,
  onDone,
}: {
  boardType: BoardType;
  target: { id: number; isHiddenByAdmin: boolean } | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const open = !!target;
  const willHide = target ? !target.isHiddenByAdmin : false;

  async function submit() {
    if (!target) return;
    const values = await form.validateFields();
    setLoading(true);
    const res = await api.patch(`/api/admin/posts/${boardType}/${target.id}/status`, {
      isHiddenByAdmin: willHide,
      reason: values.reason || undefined,
    });
    setLoading(false);
    if (res.success) {
      message.success(willHide ? "비공개 처리했습니다." : "공개로 복원했습니다.");
      form.resetFields();
      onDone();
    } else {
      message.error(res.message || "처리에 실패했습니다.");
    }
  }

  return (
    <Modal
      open={open}
      title={willHide ? "운영자 비공개 처리" : "공개 복원"}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={submit}
      okText="확인"
      cancelText="취소"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="reason" label="사유 (선택, 감사 로그)" rules={[{ max: 500 }]}>
          <Input.TextArea
            rows={3}
            maxLength={500}
            placeholder="처리 사유를 입력하세요"
            data-testid="admin-community-hide-reason"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─── 삭제 모달 ─────────────────────────────────────
function DeletePostModal({
  boardType,
  target,
  onClose,
  onDone,
}: {
  boardType: BoardType;
  target: { id: number } | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const open = !!target;

  async function submit() {
    if (!target) return;
    const values = await form.validateFields();
    setLoading(true);
    const res = await apiFetch(`/api/admin/posts/${boardType}/${target.id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason: values.reason }),
    });
    setLoading(false);
    if (res.success) {
      message.success("삭제했습니다.");
      form.resetFields();
      onDone();
    } else {
      message.error(res.message || "삭제에 실패했습니다.");
    }
  }

  return (
    <Modal
      open={open}
      title="게시글 삭제"
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={submit}
      okText="삭제"
      okButtonProps={{ danger: true }}
      cancelText="취소"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="reason"
          label="삭제 사유 (필수, 감사 로그)"
          rules={[{ required: true, message: "삭제 사유를 입력하세요." }, { max: 500 }]}
        >
          <Input.TextArea
            rows={3}
            maxLength={500}
            placeholder="삭제 사유를 입력하세요"
            data-testid="admin-community-delete-reason"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
