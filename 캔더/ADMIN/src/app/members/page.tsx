"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Card, Input, Table, Typography } from "antd";
import AdminShell from "@/components/AdminShell";
import { api, fmtInt, fmtUsd, qs } from "@/lib/api";
import { fmtDate } from "@/lib/labels";

type Member = {
  id: string;
  displayName: string;
  createdAt: string;
  headline: string | null;
  linkCount: string;
  assetCount: string;
  conversationCount: string;
  tokens: string;
  costUsd: string;
};

export default function MembersPage() {
  const [rows, setRows] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.get<{ members: Member[]; total: number }>(
          `/api/admin/members${qs({ page, size, q })}`,
        );
        if (!alive) return;
        setRows(r.members);
        setTotal(r.total);
        setErr(null);
      } catch (e) {
        // 안 잡으면 unhandled rejection → ErrorReporter 가 오류 원장에 중복 기록한다(카드#010).
        // 빈 표는 "회원이 없다"로 읽히므로 실패는 반드시 화면에 밝힌다.
        if (alive) setErr(e instanceof Error ? e.message : "불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [page, size, q]);

  return (
    <AdminShell>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        회원관리
      </Typography.Title>
      {err && (
        <Alert
          type="error"
          showIcon
          closable
          style={{ marginBottom: 12 }}
          title="회원 목록을 불러오지 못했습니다"
          description={err}
          onClose={() => setErr(null)}
        />
      )}
      <Card size="small">
        <Input.Search
          placeholder="이름으로 검색"
          allowClear
          style={{ maxWidth: 280, marginBottom: 12 }}
          onSearch={(v) => {
            setPage(1);
            setQ(v.trim());
          }}
        />
        <Table<Member>
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={rows}
          pagination={{
            current: page,
            pageSize: size,
            total,
            showSizeChanger: true,
            onChange: (p, s) => {
              setPage(p);
              setSize(s);
            },
          }}
          columns={[
            {
              title: "회원",
              dataIndex: "displayName",
              // 이름은 가입 시 빈 문자열이라(카드#019 2) 그대로 두면 클릭할 글자가 없는 링크가 된다.
              render: (v: string, r) => <Link href={`/members/${r.id}`}>{v || "이름 미입력"}</Link>,
            },
            { title: "소개", dataIndex: "headline", ellipsis: true },
            { title: "가입일", dataIndex: "createdAt", render: (v: string) => fmtDate(v) },
            { title: "링크", dataIndex: "linkCount", align: "right", render: fmtInt },
            { title: "자료", dataIndex: "assetCount", align: "right", render: fmtInt },
            { title: "대화", dataIndex: "conversationCount", align: "right", render: fmtInt },
            { title: "토큰", dataIndex: "tokens", align: "right", render: fmtInt },
            { title: "누적 비용", dataIndex: "costUsd", align: "right", render: fmtUsd },
          ]}
        />
      </Card>
    </AdminShell>
  );
}
