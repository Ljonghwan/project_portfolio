import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import { useEffect, useRef } from 'react';
import { Button, Space, Tooltip, Divider, Upload } from 'antd';
import {
    BoldOutlined, ItalicOutlined, UnderlineOutlined, StrikethroughOutlined,
    OrderedListOutlined, UnorderedListOutlined, AlignLeftOutlined,
    AlignCenterOutlined, AlignRightOutlined, PictureOutlined,
    UndoOutlined, RedoOutlined,
} from '@ant-design/icons';

const MenuBar = ({ editor }) => {
    if (!editor) return null;

    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                editor.chain().focus().setImage({ src: reader.result }).run();
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    const btnStyle = (isActive) => ({
        color: isActive ? '#6c00fe' : undefined,
        borderColor: isActive ? '#6c00fe' : undefined,
    });

    return (
        <div style={{ borderBottom: '1px solid #d9d9d9', padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Space size={2}>
                <Tooltip title="실행취소">
                    <Button size="small" icon={<UndoOutlined />} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
                </Tooltip>
                <Tooltip title="다시실행">
                    <Button size="small" icon={<RedoOutlined />} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
                </Tooltip>
            </Space>
            <Divider type="vertical" style={{ height: 24, margin: '0 4px' }} />
            <Space size={2}>
                <Tooltip title="굵게">
                    <Button size="small" icon={<BoldOutlined />} style={btnStyle(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} />
                </Tooltip>
                <Tooltip title="기울임">
                    <Button size="small" icon={<ItalicOutlined />} style={btnStyle(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} />
                </Tooltip>
                <Tooltip title="밑줄">
                    <Button size="small" icon={<UnderlineOutlined />} style={btnStyle(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()} />
                </Tooltip>
                <Tooltip title="취소선">
                    <Button size="small" icon={<StrikethroughOutlined />} style={btnStyle(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()} />
                </Tooltip>
            </Space>
            <Divider type="vertical" style={{ height: 24, margin: '0 4px' }} />
            <Space size={2}>
                <Tooltip title="제목1">
                    <Button size="small" style={btnStyle(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</Button>
                </Tooltip>
                <Tooltip title="제목2">
                    <Button size="small" style={btnStyle(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Button>
                </Tooltip>
                <Tooltip title="제목3">
                    <Button size="small" style={btnStyle(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Button>
                </Tooltip>
            </Space>
            <Divider type="vertical" style={{ height: 24, margin: '0 4px' }} />
            <Space size={2}>
                <Tooltip title="번호목록">
                    <Button size="small" icon={<OrderedListOutlined />} style={btnStyle(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
                </Tooltip>
                <Tooltip title="글머리기호">
                    <Button size="small" icon={<UnorderedListOutlined />} style={btnStyle(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} />
                </Tooltip>
            </Space>
            <Divider type="vertical" style={{ height: 24, margin: '0 4px' }} />
            <Space size={2}>
                <Tooltip title="왼쪽정렬">
                    <Button size="small" icon={<AlignLeftOutlined />} style={btnStyle(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()} />
                </Tooltip>
                <Tooltip title="가운데정렬">
                    <Button size="small" icon={<AlignCenterOutlined />} style={btnStyle(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
                </Tooltip>
                <Tooltip title="오른쪽정렬">
                    <Button size="small" icon={<AlignRightOutlined />} style={btnStyle(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()} />
                </Tooltip>
            </Space>
            <Divider type="vertical" style={{ height: 24, margin: '0 4px' }} />
            <Tooltip title="이미지 삽입">
                <Button size="small" icon={<PictureOutlined />} onClick={handleImageUpload} />
            </Tooltip>
        </div>
    );
};

export default function TiptapEditor({ value, onChange, placeholder, style }) {
    const isUpdatingRef = useRef(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({ inline: false, allowBase64: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Underline,
            TextStyle,
            Color,
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            if (!isUpdatingRef.current) {
                onChange?.(editor.getHTML());
            }
        },
    });

    useEffect(() => {
        if (editor && value !== undefined && value !== editor.getHTML()) {
            isUpdatingRef.current = true;
            editor.commands.setContent(value || '', false);
            isUpdatingRef.current = false;
        }
    }, [value, editor]);

    return (
        <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden', ...style }}>
            <MenuBar editor={editor} />
            <EditorContent
                editor={editor}
                style={{ padding: '12px 16px', minHeight: 400, cursor: 'text' }}
            />
            <style>{`
                .tiptap { outline: none; min-height: 380px; }
                .tiptap p { margin: 0 0 0.5em; }
                .tiptap h1, .tiptap h2, .tiptap h3 { margin: 0.5em 0; }
                .tiptap img { max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0; }
                .tiptap ul, .tiptap ol { padding-left: 24px; }
                .tiptap blockquote { border-left: 3px solid #d9d9d9; padding-left: 12px; color: #666; }
            `}</style>
        </div>
    );
}
