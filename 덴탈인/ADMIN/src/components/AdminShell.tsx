"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layout, Menu, Dropdown, Avatar, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import AdminLogo from "./AdminLogo";
import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";
import { useAdmin, hasMenuPermission, type AdminMenuKey } from "@/lib/useAdmin";

const { Header, Sider, Content } = Layout;

// msg-g4 D6: 각 메뉴 항목에 권한 키(perm) 부여. D5 그룹 재배치로 한 그룹에 여러 도메인이 섞여 있어
// 그룹이 아닌 "항목별"로 권한 필터링한다. perm 미지정 항목(대시보드/내 비밀번호)은 항상 노출.
type Child = { key: string; label: string; href: string; perm?: AdminMenuKey };
type Group = { key: string; icon: React.ReactNode; label: string; children: Child[] };

const GROUPS: Group[] = [
  {
    key: "members",
    icon: <TeamOutlined />,
    label: "회원관리",
    children: [
      { key: "/members/personal", label: "개인회원", href: "/members/personal", perm: "members" },
      { key: "/members/corp", label: "기업회원", href: "/members/corp", perm: "members" },
      { key: "/members/license", label: "면허/사업자 인증", href: "/members/license", perm: "members" },
      { key: "/members/withdrawn", label: "탈퇴 회원", href: "/members/withdrawn", perm: "members" },
    ],
  },
  {
    key: "contents",
    icon: <FileTextOutlined />,
    label: "콘텐츠관리",
    children: [
      { key: "/contents/jobs", label: "채용공고", href: "/contents/jobs", perm: "contents" },
      { key: "/contents/community", label: "커뮤니티", href: "/contents/community", perm: "contents" },
      { key: "/contents/community/comments", label: "댓글관리", href: "/contents/community/comments", perm: "contents" },
    ],
  },
  {
    key: "contents-reports",
    icon: <AppstoreOutlined />,
    label: "신고관리",
    children: [
      { key: "/contents/reports/jobs", label: "채용공고 신고", href: "/contents/reports/jobs", perm: "reports" },
      { key: "/contents/reports/community", label: "커뮤니티 신고", href: "/contents/reports/community", perm: "reports" },
    ],
  },
  {
    // D5: 운영관리 = 1:1문의(support 권한)·메인배너·공지사항(ops 권한)
    key: "ops",
    icon: <CustomerServiceOutlined />,
    label: "운영관리",
    children: [
      { key: "/support/qnas", label: "1:1 문의", href: "/support/qnas", perm: "support" },
      { key: "/ops/banner", label: "메인 배너", href: "/ops/banner", perm: "ops" },
      { key: "/ops/notice", label: "공지사항", href: "/ops/notice", perm: "ops" },
    ],
  },
  {
    // D5: 설정 = FAQ·FAQ분류(ops 권한)·관리자계정(super)·약관·감사로그(settings 권한)·관리자비밀번호(항상)
    key: "settings",
    icon: <SettingOutlined />,
    label: "설정",
    children: [
      { key: "/ops/faq", label: "FAQ", href: "/ops/faq", perm: "ops" },
      { key: "/settings/faq-categories", label: "FAQ 분류관리", href: "/settings/faq-categories", perm: "ops" },
      { key: "/settings/admins", label: "관리자 계정", href: "/settings/admins" }, // super 전용(SUPER_ONLY_KEYS)
      { key: "/settings/terms", label: "약관 관리", href: "/settings/terms", perm: "settings" },
      { key: "/settings/password", label: "관리자 비밀번호", href: "/settings/password" }, // 본인 비번 — 항상
      // A-1 F: 감사 로그(/settings/audits)는 사이드메뉴 미노출(라우트/페이지는 유지, URL 직접 접근만 가능).
    ],
  },
];

// qa-admin-full-1 HIGH: super 전용 메뉴(탈퇴회원 PII·관리자계정).
const SUPER_ONLY_KEYS = new Set(["/members/withdrawn", "/settings/admins"]);

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, logout } = useAdmin();
  const [collapsed, setCollapsed] = useState(false);

  if (!admin) return null;

  const isSuper = admin.role === "super";

  function childVisible(c: Child): boolean {
    if (isSuper) return true;
    if (SUPER_ONLY_KEYS.has(c.key)) return false;
    if (!c.perm) return true; // 권한 무관(본인 비밀번호 등)
    return hasMenuPermission(admin, c.perm);
  }

  const items: MenuProps["items"] = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: <Link href="/dashboard">대시보드</Link> },
    ...GROUPS.map((g) => {
      const visibleChildren = g.children.filter(childVisible);
      if (visibleChildren.length === 0) return null;
      return {
        key: g.key,
        icon: g.icon,
        label: g.label,
        children: visibleChildren.map((c) => ({
          key: c.key,
          label: <Link href={c.href}>{c.label}</Link>,
        })),
      };
    }).filter(Boolean),
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={232}
        // G2 A1: 사이드바 스크롤 고정(본문만 스크롤). 메뉴 길면 사이더 자체 스크롤.
        style={{ position: "sticky", top: 0, height: "100vh", overflow: "auto", insetInlineStart: 0 }}
      >
        {/* 로고 = 공통 AdminLogo(로그인 화면과 동일 컴포넌트 재사용). collapsed면 배지만. */}
        <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AdminLogo variant="dark" collapsed={collapsed} />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={["members", "contents", "contents-reports", "ops", "settings"]}
          items={items}
        />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "flex-end", borderBottom: "1px solid #EEF1F4", position: "sticky", top: 0, zIndex: 10 }}>
          <Dropdown
            menu={{
              items: [
                { key: "logout", icon: <LogoutOutlined />, label: "로그아웃", onClick: logout },
              ],
            }}
          >
            <Space style={{ cursor: "pointer" }}>
              <Avatar icon={<UserOutlined />} size="small" />
              <Typography.Text>{admin.name}</Typography.Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
