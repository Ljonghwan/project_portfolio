"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layout, Menu, Dropdown, Avatar, Space, Typography, Spin } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
  LogoutOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { ADMIN_ACCOUNT_TEXT } from "@/lib/labels";
import { useAdmin } from "@/lib/useAdmin";

const { Header, Sider, Content } = Layout;

// superOnly 항목은 운영자에게 **렌더 자체를 하지 않는다**. 다만 이는 UX 일 뿐이고,
// 실제 방어는 서버 requireSuperAdmin 의 403 이다(URL 직접 입력도 API 에서 막힌다).
const NAV = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "대시보드" },
  { key: "/members", icon: <TeamOutlined />, label: "회원관리" },
  { key: "/usage", icon: <ThunderboltOutlined />, label: "AI 사용량 관제" },
  { key: "/errors", icon: <WarningOutlined />, label: "오류 관제" },
  { key: "/legal", icon: <FileTextOutlined />, label: "약관 관리" },
  {
    key: "/admins",
    icon: <SafetyCertificateOutlined />,
    label: ADMIN_ACCOUNT_TEXT.title,
    superOnly: true,
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, loading, logout } = useAdmin();
  const [pwOpen, setPwOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!admin) return null; // useAdmin 이 /login 으로 보냄

  const userMenu: MenuProps["items"] = [
    {
      key: "password",
      icon: <KeyOutlined />,
      label: ADMIN_ACCOUNT_TEXT.changeMyPassword,
      onClick: () => setPwOpen(true),
    },
    { key: "logout", icon: <LogoutOutlined />, label: "로그아웃", onClick: () => void logout() },
  ];
  const nav = NAV.filter((n) => !n.superOnly || admin.role === "super");
  // /members/{id} 같은 하위 경로도 상위 메뉴가 선택되게.
  const selected = nav.find((n) => pathname.startsWith(n.key))?.key ?? "/dashboard";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 좁은 화면(lg 미만)에서는 Sider 를 폭 0 으로 접는다 — 안 접으면 375px 에서 콘텐츠가
          ~155px 로 눌려 통계 카드 라벨이 글자 단위로 세로 줄바꿈된다(QA LOW).
          collapsedWidth={0} 이면 antd 가 다시 펼칠 제로폭 트리거를 자동으로 붙여준다. */}
      <Sider
        theme="light"
        width={216}
        breakpoint="lg"
        collapsedWidth={0}
        // 트리거 기본 위치(top:64)는 Content 시작점이라 페이지 제목을 가린다 → Header 밴드로 올린다.
        zeroWidthTriggerStyle={{ top: 12 }}
        style={{ borderRight: "1px solid #eef1f5" }}
      >
        <div style={{ padding: "18px 20px", fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em" }}>
          Candour <span style={{ color: "#2F6BFF" }}>Admin</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selected]}
          style={{ borderInlineEnd: 0 }}
          items={nav.map((n) => ({
            key: n.key,
            icon: n.icon,
            label: <Link href={n.key}>{n.label}</Link>,
          }))}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            borderBottom: "1px solid #eef1f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingInline: 20,
          }}
        >
          <Dropdown menu={{ items: userMenu }}>
            <Space style={{ cursor: "pointer" }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <Typography.Text>{admin.name}</Typography.Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24, background: "#f7f9fc" }}>{children}</Content>
      </Layout>
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </Layout>
  );
}
