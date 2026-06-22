"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import {
  ImageIcon,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Undo,
  Redo,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "@/components/icons";
import { validatePhotoFile, publicUrl } from "@/lib/storage/keys";
import { uploadToTarget } from "@/lib/storage/client";
import { createImageUploadTarget } from "./actions";

/** DataTransfer/ClipboardData에서 이미지 파일만 추린다. */
function imageFilesFrom(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  return Array.from(dt.files).filter((f) => f.type.startsWith("image/"));
}

/** 공지 본문 리치 에디터(Tiptap). HTML 문자열을 value/onChange로 주고받는다. */
export function NoticeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<Editor | null>(null);

  // 이미지 업로드 → 본문 삽입. 안정적인 참조만 쓰므로 editorProps 핸들러에서 재사용 가능.
  const uploadImage = useCallback(async (file: File) => {
    const editor = editorRef.current;
    if (!editor) return;
    const msg = validatePhotoFile(file);
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const t = await createImageUploadTarget(file.type);
      if (!t.ok) {
        setError(t.error);
        return;
      }
      await uploadToTarget(t.target, file);
      editor.chain().focus().setImage({ src: publicUrl(t.target.key) }).run();
    } catch {
      setError("이미지 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setUploading(false);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, HTMLAttributes: { rel: "noopener", target: "_blank" } },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
    ],
    content: value,
    immediatelyRender: false, // Next SSR
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "rich-content min-h-[220px] px-3 py-2 outline-none",
      },
      handlePaste: (_view, event) => {
        const files = imageFilesFrom(event.clipboardData);
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach(uploadImage);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = imageFilesFrom(event.dataTransfer);
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach(uploadImage);
        return true;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  return (
    <div className="rounded-button border border-hairline-strong bg-surface-card focus-within:border-2 focus-within:border-primary">
      {editor && <Toolbar editor={editor} uploading={uploading} onPickImage={uploadImage} />}
      <EditorContent editor={editor} />
      {error && <p className="px-3 pb-2 text-[13px] text-error">{error}</p>}
    </div>
  );
}

function Btn({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={[
        "inline-flex h-8 min-w-8 items-center justify-center px-2 rounded-md text-[13px] font-semibold disabled:opacity-40",
        active ? "bg-primary-soft text-primary" : "text-body-strong hover:bg-hairline-soft",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px self-center bg-hairline" aria-hidden />;
}

function Toolbar({
  editor,
  uploading,
  onPickImage,
}: {
  editor: Editor;
  uploading: boolean;
  onPickImage: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function editLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-hairline px-2 py-1.5">
      <Btn title="되돌리기" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo size={16} />
      </Btn>
      <Btn title="다시실행" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo size={16} />
      </Btn>
      <Divider />
      <Btn title="굵게" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={16} />
      </Btn>
      <Btn title="기울임" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={16} />
      </Btn>
      <Btn title="밑줄" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline size={16} />
      </Btn>
      <Btn title="취소선" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough size={16} />
      </Btn>
      <Divider />
      <Btn
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        제목
      </Btn>
      <Btn
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        소제목
      </Btn>
      <Divider />
      <Btn title="글머리 목록" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={16} />
      </Btn>
      <Btn title="번호 목록" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={16} />
      </Btn>
      <Divider />
      <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        인용
      </Btn>
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()}>구분선</Btn>
      <Divider />
      <Btn
        title="왼쪽 정렬"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft size={16} />
      </Btn>
      <Btn
        title="가운데 정렬"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter size={16} />
      </Btn>
      <Btn
        title="오른쪽 정렬"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight size={16} />
      </Btn>
      <Divider />
      <Btn active={editor.isActive("link")} onClick={editLink}>
        링크
      </Btn>
      <Btn disabled={uploading} onClick={() => fileRef.current?.click()}>
        <span className="inline-flex items-center gap-1">
          <ImageIcon size={14} />
          {uploading ? "올리는 중…" : "이미지"}
        </span>
      </Btn>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickImage(f);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
    </div>
  );
}
