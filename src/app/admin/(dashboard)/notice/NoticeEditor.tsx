"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

/** 공지 본문 리치 에디터(Tiptap). HTML 문자열을 value/onChange로 주고받는다. */
export function NoticeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener", target: "_blank" } }),
    ],
    content: value,
    immediatelyRender: false, // Next SSR
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "rich-content min-h-[220px] px-3 py-2 outline-none",
      },
    },
  });

  return (
    <div className="rounded-button border border-hairline-strong bg-surface-card focus-within:border-2 focus-within:border-primary">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Btn({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={[
        "h-8 min-w-8 px-2 rounded-md text-[13px] font-semibold",
        active ? "bg-primary-soft text-primary" : "text-body-strong hover:bg-hairline-soft",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-hairline px-2 py-1.5">
      <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        굵게
      </Btn>
      <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        기울임
      </Btn>
      <Btn
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        제목
      </Btn>
      <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • 목록
      </Btn>
      <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. 목록
      </Btn>
      <Btn
        active={editor.isActive("link")}
        onClick={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("링크 URL", prev ?? "https://");
          if (url === null) return;
          if (url === "") editor.chain().focus().unsetLink().run();
          else editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        링크
      </Btn>
    </div>
  );
}
