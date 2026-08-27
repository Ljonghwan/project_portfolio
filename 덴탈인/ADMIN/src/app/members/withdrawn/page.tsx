"use client";

// msg-g4 단위A-2: 탈퇴 회원관리 기획서 복원.
// 동작 추가: ①체크박스 다중 선택 + 대량 하드삭제(POST bulk-delete, super, 2-step confirm + reason, AuditLog)
//   ②행 클릭 시 상세 Drawer(가입일/유형/이메일/이름/탈퇴일/사유). 기존 단건 하드삭제도 유지.
import { useCallback, useEffect, useState } from "react";
import { App, Button, Card, DatePicker, Descriptions, Drawer, Input, Modal, Result, Select, Space, Table, Tag } from "antd";
import type { TablePaginationConfig } from "antd";
import AdminShell from "@/components/AdminShell";
import { useAdmin } from "@/lib/useAdmin";
import { api, apiFetch } from "@/lib/api";
import { formatPhone } from "@/lib/format";
import { codeLabel, useCodes } from "@/lib/codes";
import dayjs, { Dayjs } from "dayjs";

interface WithdrawnMemberItem {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  userType: "personal" | "corp";
  status: string;
  statusReason: string | null;
  withdrawReason: string | null; // 고객사 피드백 6: 탈퇴 사유 코드
  withdrawReasonText: string | null; // 기타 직접입력
  createdAt: string;
  deletedAt: string | null;
}

// 탈퇴 사유 = 코드 라벨 + 기타 직접입력 결합 표시
function withdrawReasonText(r: WithdrawnMemberItem): string {
  const label = r.withdrawReason ? codeLabel("withdrawReason", r.withdrawReason) : "";
  const txt = (r.withdrawReasonText || "").trim();
  if (label && txt) return `${label} — ${txt}`;
  return label || txt || "-";
}

const USER_TYPE_OPTS = [
  { value: "all", label: "전체" },
  { value: "personal", label: "개인" },
  { value: "corp", label: "기업" },
];

export default function MembersWithdrawnPage() {
  const { message, modal } = App.useApp();
  useCodes(); // 탈퇴 사유 코드 라벨
  const { admin, loading: authLoading } = useAdmin();
  const [items, setItems] = useState<WithdrawnMemberItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState("all");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  // C1: "초기화" — 필터 전체 리셋 + 페이지1 + 필터영역 remount.
  const [resetKey, setResetKey] = useState(0);
  const resetFilters = () => {
  setUserType("all"); setQ(""); setRange(null); setPage(1);
  setQInput("");
    setResetKey((k) => k + 1);
  };

  const [hardDeleteTarget, setHardDeleteTarget] = useState<WithdrawnMemberItem | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 기획: 체크박스 다중 선택 + 대량삭제
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkReason, setBulkReason] = useState("");
  // 기획: 상세 Drawer
  const [detailRow, setDetailRow] = useState<WithdrawnMemberItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (userType !== "all") params.set("userType", userType);
    if (q) params.set("q", q);
    if (range?.[0]) params.set("deletedFrom", range[0].startOf("day").toISOString());
    if (range?.[1]) params.set("deletedTo", range[1].endOf("day").toISOString());

    const res = await api.get<{ items: WithdrawnMemberItem[]; total: number }>(
      `/api/admin/members/withdrawn?${params.toString()}`
    );
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      message.error(res.message || "탈퇴 회원 목록을 불러올 수 없습니다.");
    }
  }, [page, pageSize, userType, q, range, message]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  function openHardDelete(row: WithdrawnMemberItem) {
    setHardDeleteTarget(row);
    setReason("");
  }

  async function submitHardDelete() {
    if (!hardDeleteTarget) return;
    if (!reason.trim()) { message.error("하드 삭제 사유를 입력하세요."); return; }
    const confirmed = await new Promise<boolean>((resolve) => {
      modal.confirm({
        title: "하드 삭제 (복구 불가)",
        content: `${hardDeleteTarget.name} (${hardDeleteTarget.email}) 의 모든 데이터를 영구 삭제합니다. 이 작업은 복구할 수 없습니다.`,
        okText: "영구 삭제", okType: "danger", cancelText: "취소",
        onOk: () => resolve(true), onCancel: () => resolve(false),
      });
    });
    if (!confirmed) return;
    setSubmitting(true);
    const res = await apiFetch(`/api/admin/members/withdrawn/${hardDeleteTarget.id}`, {
      method: "DELETE", body: JSON.stringify({ reason: reason.trim() }),
    });
    setSubmitting(false);
    if (!res.success) { message.error(res.message || "하드 삭제 실패"); return; }
    message.success("탈퇴 회원이 영구 삭제되었습니다.");
    setHardDeleteTarget(null);
    setSelectedRowKeys((keys) => keys.filter((k) => k !== hardDeleteTarget.id));
    load();
  }

  async function submitBulkDelete() {
    if (selectedRowKeys.length === 0) return;
    if (!bulkReason.trim()) { message.error("대량 삭제 사유를 입력하세요."); return; }
    const confirmed = await new Promise<boolean>((resolve) => {
      modal.confirm({
        title: "선택 회원 대량 하드 삭제 (복구 불가)",
        content: `선택한 ${selectedRowKeys.length}명의 탈퇴 회원 데이터를 영구 삭제합니다. 이 작업은 복구할 수 없습니다.`,
        okText: "영구 삭제", okType: "danger", cancelText: "취소",
        onOk: () => resolve(true), onCancel: () => resolve(false),
      });
    });
    if (!confirmed) return;
    setSubmitting(true);
    const res = await apiFetch<{ deletedCount: number; skipped: number[] }>(
      `/api/admin/members/withdrawn/bulk-delete`,
      { method: "POST", body: JSON.stringify({ ids: selectedRowKeys, reason: bulkReason.trim() }) }
    );
    setSubmitting(false);
    if (!res.success) { message.error(res.message || "대량 삭제 실패"); return; }
    message.success(`${res.data?.deletedCount ?? 0}명 영구 삭제되었습니다.`);
    setBulkOpen(false);
    setBulkReason("");
    setSelectedRowKeys([]);
    load();
  }

  if (authLoading || !admin) return null;

  // qa-admin-full-1 HIGH: 탈퇴회원 PII 목록은 super 전용 — staff는 페이지 자체 차단(서버 가드와 이중 방어).
  if (admin.role !== "super") {
    return (
      <AdminShell>
        <Card title="탈퇴 회원" data-testid="members-withdrawn-page">
          <Result status="403" title="접근 권한이 없습니다" subTitle="탈퇴 회원(개인정보) 관리는 슈퍼관리자만 접근할 수 있습니다." />
        </Card>
      </AdminShell>
    );
  }

  const userTypeTag = (v: "personal" | "corp") => (
    <Tag color={v === "personal" ? "blue" : "geekblue"}>{v === "personal" ? "개인" : "기업"}</Tag>
  );

  return (
    <AdminShell>
      <Card title="탈퇴 회원" data-testid="members-withdrawn-page">
        <Space key={resetKey} wrap className="admin-filter" style={{ marginBottom: 16 }}>
          <Input
            placeholder="이메일/이름/휴대폰 검색"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onPressEnter={() => { setQ(qInput.trim()); setPage(1); }}
            style={{ width: 280 }}
            allowClear
            data-testid="members-withdrawn-search"
          />
          <Select value={userType} options={USER_TYPE_OPTS} onChange={(v) => { setUserType(v); setPage(1); }} style={{ width: 120 }} data-testid="members-withdrawn-usertype" />
          <DatePicker.RangePicker
            value={range as never}
            onChange={(v) => { setRange((v as [Dayjs | null, Dayjs | null] | null) ?? null); setPage(1); }}
            placeholder={["탈퇴 시작일", "종료일"]}
            data-testid="members-withdrawn-range"
          />
          <Button onClick={resetFilters}>초기화</Button>
          {/* 기획: 선택 대량 하드삭제 */}
          <Button
            danger
            disabled={selectedRowKeys.length === 0}
            onClick={() => { setBulkReason(""); setBulkOpen(true); }}
            data-testid="members-withdrawn-bulk-delete"
          >
            선택 영구삭제 ({selectedRowKeys.length})
          </Button>
        </Space>

        <Table<WithdrawnMemberItem>
          rowKey="id"
          loading={loading}
          dataSource={items}
          rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys as number[]) }}
          onRow={(r) => ({ onClick: () => setDetailRow(r), style: { cursor: "pointer" } })}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
          onChange={(p: TablePaginationConfig) => { setPage(p.current || 1); setPageSize(p.pageSize || 20); }}
          columns={[
            { title: "NO", width: 64, render: (_v, _r: WithdrawnMemberItem, index: number) => (page - 1) * pageSize + index + 1 },
            { title: "가입일시", dataIndex: "createdAt", width: 130, render: (v: string) => dayjs(v).format("YYYY-MM-DD") },
            { title: "회원 유형", dataIndex: "userType", width: 110, render: userTypeTag },
            { title: "이메일 ID", dataIndex: "email", ellipsis: true },
            { title: "이름", dataIndex: "name", width: 110 },
            { title: "휴대폰", dataIndex: "phone", width: 150, render: (v: string | null) => (v ? formatPhone(v) : "-") },
            { title: "탈퇴 사유", key: "withdrawReason", ellipsis: true, render: (_, r) => withdrawReasonText(r) },
            { title: "탈퇴일시", dataIndex: "deletedAt", width: 170, render: (v: string | null) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-") },
            {
              title: "관리", key: "actions", width: 110, fixed: "right",
              render: (_, r) => (
                <Button
                  size="small"
                  danger
                  onClick={(e) => { e.stopPropagation(); openHardDelete(r); }}
                  data-testid={`members-withdrawn-hard-${r.id}`}
                >
                  하드 삭제
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* 단건 하드삭제 */}
      <Modal
        title="탈퇴 회원 하드 삭제"
        open={!!hardDeleteTarget}
        onCancel={() => setHardDeleteTarget(null)}
        onOk={submitHardDelete}
        confirmLoading={submitting}
        okText="영구 삭제"
        okButtonProps={{ danger: true }}
        cancelText="취소"
        destroyOnHidden
      >
        <p><strong>{hardDeleteTarget?.name}</strong> ({hardDeleteTarget?.email}) 회원의 모든 데이터를 영구 삭제합니다.</p>
        <p style={{ color: "#E11D48", marginBottom: 12 }}>⚠️ 복구할 수 없습니다. 개인정보보호법에 따른 보관 기간이 지난 경우에만 처리하세요.</p>
        <Input.TextArea rows={3} placeholder="하드 삭제 사유 (필수, 최대 500자)" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} data-testid="members-withdrawn-hard-reason" />
      </Modal>

      {/* 대량 하드삭제 */}
      <Modal
        title="선택 회원 대량 영구삭제"
        open={bulkOpen}
        onCancel={() => setBulkOpen(false)}
        onOk={submitBulkDelete}
        confirmLoading={submitting}
        okText="영구 삭제"
        okButtonProps={{ danger: true }}
        cancelText="취소"
        destroyOnHidden
      >
        <p>선택한 <strong>{selectedRowKeys.length}명</strong>의 탈퇴 회원 데이터를 영구 삭제합니다.</p>
        <p style={{ color: "#E11D48", marginBottom: 12 }}>⚠️ 복구할 수 없습니다. 보관 기간이 지난 회원만 처리하세요. (탈퇴 상태가 아닌 회원은 자동 제외됩니다.)</p>
        <Input.TextArea rows={3} placeholder="대량 삭제 사유 (필수, 최대 500자)" value={bulkReason} maxLength={500} onChange={(e) => setBulkReason(e.target.value)} data-testid="members-withdrawn-bulk-reason" />
      </Modal>

      {/* 상세 Drawer */}
      <Drawer
        title="탈퇴 회원 상세"
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        size={420}
        data-testid="members-withdrawn-detail"
      >
        {detailRow && (
          <Descriptions column={1} bordered size="small">
            {/* BUG-D1: 테이블 NO(일련번호)와 일치 — DB id 대신 행 순번 */}
            <Descriptions.Item label="NO">{items.findIndex((i) => i.id === detailRow.id) + 1 + (page - 1) * pageSize}</Descriptions.Item>
            <Descriptions.Item label="회원 유형">{userTypeTag(detailRow.userType)}</Descriptions.Item>
            <Descriptions.Item label="이메일 ID">{detailRow.email}</Descriptions.Item>
            <Descriptions.Item label="이름">{detailRow.name}</Descriptions.Item>
            <Descriptions.Item label="휴대폰">{detailRow.phone ? formatPhone(detailRow.phone) : "-"}</Descriptions.Item>
            <Descriptions.Item label="가입일시">{dayjs(detailRow.createdAt).format("YYYY-MM-DD HH:mm")}</Descriptions.Item>
            <Descriptions.Item label="탈퇴일시">{detailRow.deletedAt ? dayjs(detailRow.deletedAt).format("YYYY-MM-DD HH:mm") : "-"}</Descriptions.Item>
            <Descriptions.Item label="탈퇴 사유">{withdrawReasonText(detailRow)}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </AdminShell>
  );
}
