"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, DatePicker, Space, Tabs, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import AdminShell from "@/components/AdminShell";
import { api } from "@/lib/api";
import { DATE_FORMAT_KO, LEGAL_KIND_LABEL, LEGAL_KINDS, LEGAL_TEXT } from "@/lib/labels";

type Doc = {
  kind: string;
  bodyHtml: string;
  revisedAt: string | null;
  updatedAt: string | null;
};

// 툴바 — 서버 sanitizeRichHtml 이 허용하는 서식만 노출한다. 여기에 없는 버튼(표·이미지 등)을
// 늘리면 관리자가 쓴 서식이 저장 때 조용히 사라진다.
function Toolbar({ editor }: { editor: Editor }) {
  const btn = (label: string, active: boolean, onClick: () => void) => (
    <Button size="small" type={active ? "primary" : "default"} onClick={onClick}>
      {label}
    </Button>
  );
  return (
    <Space wrap size={4} style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
      {btn("제목1", editor.isActive("heading", { level: 1 }), () =>
        editor.chain().focus().toggleHeading({ level: 1 }).run(),
      )}
      {btn("제목2", editor.isActive("heading", { level: 2 }), () =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
      )}
      {btn("제목3", editor.isActive("heading", { level: 3 }), () =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
      )}
      {btn("본문", editor.isActive("paragraph"), () => editor.chain().focus().setParagraph().run())}
      {btn("굵게", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run())}
      {btn("기울임", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run())}
      {btn("글머리 목록", editor.isActive("bulletList"), () =>
        editor.chain().focus().toggleBulletList().run(),
      )}
      {btn("번호 목록", editor.isActive("orderedList"), () =>
        editor.chain().focus().toggleOrderedList().run(),
      )}
      {btn("인용", editor.isActive("blockquote"), () =>
        editor.chain().focus().toggleBlockquote().run(),
      )}
      {btn("구분선", false, () => editor.chain().focus().setHorizontalRule().run())}
      {btn("되돌리기", false, () => editor.chain().focus().undo().run())}
      {btn("다시실행", false, () => editor.chain().focus().redo().run())}
    </Space>
  );
}

export default function LegalPage() {
  const [kind, setKind] = useState<string>(LEGAL_KINDS[0]);
  const [revisedAt, setRevisedAt] = useState<Dayjs | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const editor = useEditor({
    // 🔒 제목은 1~3 만 — 서버 sanitizeRichHtml 이 h4~h6 을 discard 해서 저장 시 서식이 사라진다.
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    content: "",
    immediatelyRender: false, // Next SSR 에서 hydration 불일치 방지(tiptap 공식 권장)
  });

  // 탭이 바뀌거나 에디터가 준비되면 그 종류의 최신본을 불러온다.
  useEffect(() => {
    if (!editor) return;
    let alive = true;
    void (async () => {
      try {
        const d = await api.get<Doc>(`/api/admin/legal/${kind}`);
        if (!alive) return;
        editor.commands.setContent(d.bodyHtml || "", { emitUpdate: false });
        setRevisedAt(d.revisedAt ? dayjs(d.revisedAt) : null);
        setErr(null);
      } catch (e) {
        // 조회 실패를 안 잡으면 ErrorReporter 가 오류 원장을 자기 노이즈로 채운다(admin/CLAUDE.md).
        if (alive) setErr(e instanceof Error ? e.message : LEGAL_TEXT.loadFailed);
      }
      if (alive) setSaved(false);
    })();
    return () => {
      alive = false;
    };
  }, [kind, editor]);

  const save = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const d = await api.put<Doc>(`/api/admin/legal/${kind}`, {
        bodyHtml: editor.getHTML(),
        // 'YYYY-MM-DD' 는 **서버 계약**이다(화면 표시 포맷은 DATE_FORMAT_KO 로 따로 준다).
        revisedAt: revisedAt ? revisedAt.format("YYYY-MM-DD") : undefined,
      });
      // 서버가 정제한 결과를 그대로 되돌려 넣는다 — 걸러진 태그가 있으면 관리자가 즉시 본다.
      editor.commands.setContent(d.bodyHtml || "", { emitUpdate: false });
      setRevisedAt(d.revisedAt ? dayjs(d.revisedAt) : null);
      setErr(null);
      setSaved(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : LEGAL_TEXT.saveFailed);
      setSaved(false);
    }
    setSaving(false);
  }, [editor, kind, revisedAt]);

  return (
    <AdminShell>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        {LEGAL_TEXT.title}
      </Typography.Title>
      <Typography.Paragraph type="secondary">{LEGAL_TEXT.desc}</Typography.Paragraph>

      {err && <Alert type="error" title={err} showIcon style={{ marginBottom: 12 }} />}
      {saved && <Alert type="success" title={LEGAL_TEXT.saved} showIcon style={{ marginBottom: 12 }} />}

      <Tabs
        activeKey={kind}
        onChange={setKind}
        items={LEGAL_KINDS.map((k) => ({ key: k, label: LEGAL_KIND_LABEL[k] }))}
      />

      <Card
        size="small"
        styles={{ body: { padding: 0 } }}
        style={{ marginBottom: 16 }}
        className="tt-editor"
      >
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </Card>

      <Space align="center" wrap>
        <span>{LEGAL_TEXT.revisedAt}</span>
        <DatePicker
          value={revisedAt}
          onChange={setRevisedAt}
          // 화면에 개발자식 포맷(YYYY-MM-DD) 금지 — admin/CLAUDE.md.
          format={DATE_FORMAT_KO}
          style={{ width: 180 }}
        />
        <Typography.Text type="secondary">{LEGAL_TEXT.revisedHint}</Typography.Text>
        <Button type="primary" loading={saving} onClick={() => void save()}>
          {LEGAL_TEXT.save}
        </Button>
      </Space>
      <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
        {LEGAL_TEXT.sanitizeNote}
      </Typography.Paragraph>
    </AdminShell>
  );
}
