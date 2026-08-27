"use client";

import AdminShell from "./AdminShell";
import { Card, Empty, Typography } from "antd";

export default function Placeholder({ title, desc }: { title: string; desc?: string }) {
  return (
    <AdminShell>
      <Typography.Title level={3} style={{ marginTop: 0 }}>{title}</Typography.Title>
      {desc && <Typography.Paragraph type="secondary">{desc}</Typography.Paragraph>}
      <Card>
        <Empty description="다음 스프린트에서 구현 예정" />
      </Card>
    </AdminShell>
  );
}
