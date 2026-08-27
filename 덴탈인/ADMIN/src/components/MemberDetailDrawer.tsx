"use client";

import { useEffect, useState } from "react";
import { App, Drawer, Descriptions, Tag, Space, Button, Modal, Form, Input, Select, Spin, Image as AntImage } from "antd";
import { api, apiFetch } from "@/lib/api";
import { codeLabel, useCodes } from "@/lib/codes";
import { formatPhone, formatBizNo } from "@/lib/format";

type UserStatus = "active" | "suspended" | "deleted";
type LicenseStatus = "none" | "pending" | "verified" | "rejected";

interface MemberDetail {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  phoneVerified: boolean;
  profileImageUrl: string | null; // 그룹2
  userType: "personal" | "corp";
  snsProvider: "kakao" | "naver" | "google" | null;
  marketingAgree: boolean;
  status: UserStatus;
  statusReason: string | null;
  statusChangedAt: string | null;
  statusChangedBy: number | null;
  licenseStatus: LicenseStatus;
  licenseReason: string | null;
  deletedAt: string | null;
  createdAt: string;
  personalProfile: null | {
    jobType: string;
    gender: string | null;
    age: number | null;
    birthYear: number | null; // 그룹2: 만 나이 계산용
    sido: string | null;
    sigungu: string | null;
    careerYears: number;
    careerMonths: number;
    salaryMin: number | null; // 그룹2: 희망연봉
    salaryMax: number | null;
    salaryNegotiable: boolean;
    desiredAreas: { sido: string; sigungu: string }[] | null; // 그룹2: 근무희망지역
    licenseNo: string | null;
    licenseImageUrl: string | null;
  };
  corpProfile: null | {
    hospitalName: string;
    hospitalAddress: string | null;
    businessNo: string;
    businessLicenseImageUrl: string | null;
  };
}

interface Props {
  open: boolean;
  memberId: number | null;
  onClose: () => void;
  onChanged: () => void;
}

const STATUS_COLOR: Record<UserStatus, string> = {
  active: "green",
  suspended: "orange",
  deleted: "red",
};
const STATUS_LABEL: Record<UserStatus, string> = {
  active: "정상",
  suspended: "정지",
  deleted: "탈퇴",
};

const LICENSE_COLOR: Record<LicenseStatus, string> = {
  none: "default",
  pending: "blue",
  verified: "green",
  rejected: "red",
};
const LICENSE_LABEL: Record<LicenseStatus, string> = {
  none: "미신청",
  pending: "대기",
  verified: "승인",
  rejected: "반려",
};

// p2-6: 직종 라벨은 서버 /api/codes(jobType) 소비.

// 그룹2: 만 나이(출생연도 기준). birthYear 없으면 레거시 age fallback.
function ageText(birthYear: number | null, age: number | null): string {
  if (birthYear && birthYear > 1900) return `만 ${new Date().getFullYear() - birthYear}세`;
  return age != null ? `${age}세` : "-";
}
// 그룹2: 희망연봉(만원). 협의면 "면접 후 결정".
function salaryText(min: number | null, max: number | null, negotiable: boolean): string {
  if (negotiable) return "면접 후 결정";
  if (min == null && max == null) return "-";
  const fmt = (n: number) => `${n.toLocaleString()}만원`;
  if (min != null && max != null) return `${fmt(min)} ~ ${fmt(max)}`;
  return fmt((min ?? max) as number);
}
// 그룹2: 근무희망지역(시도+시군구) join.
function desiredAreasText(areas: { sido: string; sigungu: string }[] | null): string {
  if (!areas || areas.length === 0) return "-";
  return areas.map((a) => [a.sido, a.sigungu].filter(Boolean).join(" ")).join(", ");
}

export default function MemberDetailDrawer({ open, memberId, onClose, onChanged }: Props) {
  useCodes();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [statusModal, setStatusModal] = useState(false);
  const [licenseModal, setLicenseModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    if (!open || !memberId) return;
    setLoading(true);
    setDetail(null);
    (async () => {
      const res = await api.get<MemberDetail>(`/api/admin/members/${memberId}`);
      if (res.success && res.data) setDetail(res.data);
      else message.error(res.message || "회원 정보를 불러올 수 없습니다.");
      setLoading(false);
    })();
  }, [open, memberId, message]);

  function refresh() {
    if (!memberId) return;
    setLoading(true);
    (async () => {
      const res = await api.get<MemberDetail>(`/api/admin/members/${memberId}`);
      if (res.success && res.data) setDetail(res.data);
      setLoading(false);
    })();
    onChanged();
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        size="large"
        title={detail ? `회원 상세 #${detail.id}` : "회원 상세"}
        destroyOnHidden
        extra={
          detail && detail.status !== "deleted" ? (
            <Space>
              <Button onClick={() => setStatusModal(true)} data-testid="member-status-btn">
                {detail.status === "active" ? "정지하기" : "활성화"}
              </Button>
              <Button onClick={() => setLicenseModal(true)} data-testid="member-license-btn">
                면허/사업자 처리
              </Button>
              <Button danger onClick={() => setDeleteModal(true)} data-testid="member-delete-btn">
                강제 탈퇴
              </Button>
            </Space>
          ) : null
        }
      >
        {loading || !detail ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Spin />
          </div>
        ) : (
          <>
            {/* 그룹2: 회원 프로필 사진. BUG-1: 미등록 시 이니셜 아바타 플레이스홀더(엑박 방지). */}
            <div style={{ marginBottom: 16 }}>
              {detail.profileImageUrl ? (
                <AntImage src={detail.profileImageUrl} alt="프로필 사진" width={88} height={88} style={{ objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                <div
                  aria-label="프로필 사진 미등록"
                  style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg,#CFEFEA,#A8E5DA)", display: "grid", placeItems: "center", color: "#0B7C70", fontSize: 32, fontWeight: 800 }}
                >
                  {(detail.name || "?").slice(0, 1)}
                </div>
              )}
            </div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="회원 유형">{detail.userType === "personal" ? "개인" : "기업"}</Descriptions.Item>
              <Descriptions.Item label="이름">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="이메일">{detail.email}</Descriptions.Item>
              <Descriptions.Item label="휴대폰">
                {detail.phone ? formatPhone(detail.phone) : "-"} {detail.phoneVerified && <Tag color="green">인증완료</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="SNS">{detail.snsProvider || "이메일가입"}</Descriptions.Item>
              <Descriptions.Item label="마케팅 동의">{detail.marketingAgree ? "동의" : "미동의"}</Descriptions.Item>
              <Descriptions.Item label="등록일">{new Date(detail.createdAt).toLocaleString("ko-KR")}</Descriptions.Item>
              <Descriptions.Item label="회원 상태">
                <Tag color={STATUS_COLOR[detail.status]}>{STATUS_LABEL[detail.status]}</Tag>
                {detail.statusReason && <span style={{ marginLeft: 8, color: "#888" }}>{detail.statusReason}</span>}
                {detail.statusChangedAt && (
                  <span style={{ marginLeft: 8, color: "#888", fontSize: 12 }}>
                    ({new Date(detail.statusChangedAt).toLocaleString("ko-KR")})
                  </span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="면허/사업자">
                <Tag color={LICENSE_COLOR[detail.licenseStatus]}>{LICENSE_LABEL[detail.licenseStatus]}</Tag>
                {detail.licenseReason && <span style={{ marginLeft: 8, color: "#888" }}>{detail.licenseReason}</span>}
              </Descriptions.Item>
              {detail.deletedAt && (
                <Descriptions.Item label="탈퇴 처리일">{new Date(detail.deletedAt).toLocaleString("ko-KR")}</Descriptions.Item>
              )}
            </Descriptions>

            {detail.personalProfile && (
              <>
                <h4 style={{ marginTop: 24 }}>개인 프로필</h4>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="직종">{codeLabel("reviewJobLabelOverride", detail.personalProfile.jobType)}</Descriptions.Item>{/* msg-g3: 회원 직종 student 포함 → reviewJobLabelOverride(9키). 채용 jobType 8셋과 분리. */}
                  <Descriptions.Item label="성별/나이">
                    {detail.personalProfile.gender === "male" ? "남" : detail.personalProfile.gender === "female" ? "여" : "-"} / {ageText(detail.personalProfile.birthYear, detail.personalProfile.age)}
                  </Descriptions.Item>
                  <Descriptions.Item label="주소(거주지)">{[detail.personalProfile.sido, detail.personalProfile.sigungu].filter(Boolean).join(" ") || "-"}</Descriptions.Item>
                  <Descriptions.Item label="경력">{detail.personalProfile.careerYears}년 {detail.personalProfile.careerMonths}개월</Descriptions.Item>
                  <Descriptions.Item label="희망연봉">{salaryText(detail.personalProfile.salaryMin, detail.personalProfile.salaryMax, detail.personalProfile.salaryNegotiable)}</Descriptions.Item>
                  <Descriptions.Item label="근무희망지역">{desiredAreasText(detail.personalProfile.desiredAreas)}</Descriptions.Item>
                  <Descriptions.Item label="면허번호">{detail.personalProfile.licenseNo || "-"}</Descriptions.Item>
                  {detail.personalProfile.licenseImageUrl && (
                    <Descriptions.Item label="면허증">
                      <AntImage src={detail.personalProfile.licenseImageUrl} alt="면허증" width={160} />
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}

            {detail.corpProfile && (
              <>
                <h4 style={{ marginTop: 24 }}>기업 프로필</h4>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="병원명">{detail.corpProfile.hospitalName}</Descriptions.Item>
                  <Descriptions.Item label="주소">{detail.corpProfile.hospitalAddress || "-"}</Descriptions.Item>
                  <Descriptions.Item label="사업자번호">{formatBizNo(detail.corpProfile.businessNo)}</Descriptions.Item>
                  {detail.corpProfile.businessLicenseImageUrl && (
                    <Descriptions.Item label="사업자등록증">
                      <AntImage src={detail.corpProfile.businessLicenseImageUrl} alt="사업자등록증" width={160} />
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}
          </>
        )}
      </Drawer>

      {detail && (
        <>
          <StatusModal
            open={statusModal}
            onClose={() => setStatusModal(false)}
            memberId={detail.id}
            currentStatus={detail.status}
            onDone={() => {
              setStatusModal(false);
              refresh();
            }}
          />
          <LicenseModal
            open={licenseModal}
            onClose={() => setLicenseModal(false)}
            memberId={detail.id}
            currentStatus={detail.licenseStatus}
            onDone={() => {
              setLicenseModal(false);
              refresh();
            }}
          />
          <DeleteModal
            open={deleteModal}
            onClose={() => setDeleteModal(false)}
            memberId={detail.id}
            onDone={() => {
              setDeleteModal(false);
              onChanged();
              onClose();
            }}
          />
        </>
      )}
    </>
  );
}

interface StatusModalProps {
  open: boolean;
  memberId: number;
  currentStatus: UserStatus;
  onClose: () => void;
  onDone: () => void;
}
function StatusModal({ open, memberId, currentStatus, onClose, onDone }: StatusModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const nextStatus: UserStatus = currentStatus === "active" ? "suspended" : "active";

  async function submit() {
    const values = await form.validateFields();
    setLoading(true);
    const res = await api.patch(`/api/admin/members/${memberId}/status`, {
      status: nextStatus,
      reason: values.reason,
    });
    setLoading(false);
    if (res.success) {
      message.success(nextStatus === "suspended" ? "정지 처리되었습니다." : "활성화되었습니다.");
      form.resetFields();
      onDone();
    } else {
      message.error(res.message || "처리에 실패했습니다.");
    }
  }

  return (
    <Modal
      open={open}
      title={nextStatus === "suspended" ? "회원 정지" : "회원 활성화"}
      onCancel={onClose}
      onOk={submit}
      okText="확인"
      cancelText="취소"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="reason"
          label="사유"
          rules={[{ max: 500, message: "500자 이내로 입력하세요." }]}
        >
          <Input.TextArea rows={3} placeholder="처리 사유 (선택)" data-testid="member-status-reason" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

interface LicenseModalProps {
  open: boolean;
  memberId: number;
  currentStatus: LicenseStatus;
  onClose: () => void;
  onDone: () => void;
}
function LicenseModal({ open, memberId, currentStatus, onClose, onDone }: LicenseModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  // BUG-1(admin QA): 반려 선택 시 사유 필수(서버 refine과 동일 규칙).
  const watchedStatus = Form.useWatch("licenseStatus", form);
  const reasonRequired = watchedStatus === "rejected";

  async function submit() {
    const values = await form.validateFields();
    setLoading(true);
    const res = await api.patch(`/api/admin/members/${memberId}/license`, {
      licenseStatus: values.licenseStatus,
      reason: values.reason,
    });
    setLoading(false);
    if (res.success) {
      message.success("처리되었습니다.");
      form.resetFields();
      onDone();
    } else {
      message.error(res.message || "처리에 실패했습니다.");
    }
  }

  return (
    <Modal
      open={open}
      title="면허/사업자 인증 처리"
      onCancel={onClose}
      onOk={submit}
      okText="저장"
      cancelText="취소"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ licenseStatus: currentStatus }} preserve={false}>
        <Form.Item
          name="licenseStatus"
          label="상태"
          rules={[{ required: true, message: "상태를 선택하세요." }]}
        >
          <Select
            options={[
              { value: "verified", label: "승인" },
              { value: "rejected", label: "반려" },
              { value: "pending", label: "대기로 변경" },
              { value: "none", label: "초기화" },
            ]}
            data-testid="member-license-select"
          />
        </Form.Item>
        <Form.Item
          name="reason"
          label={reasonRequired ? "반려 사유" : "사유"}
          rules={
            reasonRequired
              ? [{ required: true, message: "반려 사유를 입력하세요." }, { max: 500 }]
              : [{ max: 500 }]
          }
        >
          <Input.TextArea
            rows={3}
            placeholder={reasonRequired ? "사용자에게 노출되는 반려 사유 (필수)" : "처리 사유 (선택)"}
            data-testid="member-license-reason"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

interface DeleteModalProps {
  open: boolean;
  memberId: number;
  onClose: () => void;
  onDone: () => void;
}
function DeleteModal({ open, memberId, onClose, onDone }: DeleteModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  async function submit() {
    const values = await form.validateFields();
    setLoading(true);
    const res = await apiFetch(`/api/admin/members/${memberId}`, {
      method: "DELETE",
      body: JSON.stringify({ reason: values.reason }),
    });
    setLoading(false);
    if (res.success) {
      message.success("탈퇴 처리되었습니다.");
      form.resetFields();
      onDone();
    } else {
      message.error(res.message || "처리에 실패했습니다.");
    }
  }

  return (
    <Modal
      open={open}
      title="회원 강제 탈퇴"
      onCancel={onClose}
      onOk={submit}
      okText="탈퇴 처리"
      cancelText="취소"
      okButtonProps={{ danger: true }}
      confirmLoading={loading}
      destroyOnHidden
    >
      <p style={{ color: "#888", marginBottom: 16 }}>
        탈퇴 처리 시 회원의 게시글/지원 내역은 익명 처리되며, 30일 후 영구 삭제됩니다.
      </p>
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="reason"
          label="탈퇴 사유"
          rules={[{ required: true, message: "탈퇴 사유를 입력하세요." }, { max: 500 }]}
        >
          <Input.TextArea rows={3} placeholder="필수 입력" data-testid="member-delete-reason" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
