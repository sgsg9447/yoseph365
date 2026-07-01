"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type Editor,
  type NodeViewProps,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { TextStyle, Color, FontSize } from "@tiptap/extension-text-style";
import {
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  parseFontSize,
  stepFontSize,
} from "@/lib/richtext/font-size";
import { nextWidthPercent } from "@/lib/richtext/image-size";
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
import { createImageUploadTarget } from "@/lib/storage/actions";

/** DataTransfer/ClipboardData에서 이미지 파일만 추린다. */
function imageFilesFrom(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  return Array.from(dt.files).filter((f) => f.type.startsWith("image/"));
}

/**
 * 본문 이미지에 크기(%)·정렬 속성을 추가한 Image 확장.
 * - width: 컨테이너 대비 % (style="width: N%") — 렌더/새니타이저와 정책 일치.
 * - align: data-align="left|center|right" — CSS(.rich-content img[data-align])로 정렬.
 * 에디터에서는 NodeView로 모서리 드래그 리사이즈 + 정렬 툴바를 제공한다.
 */
const RichImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const m = /^(\d{1,3})%$/.exec(el.style.width || "");
          return m ? Number(m[1]) : null;
        },
        renderHTML: (attrs) =>
          attrs.width ? { style: `width: ${attrs.width}%` } : {},
      },
      align: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-align"),
        renderHTML: (attrs) => (attrs.align ? { "data-align": attrs.align } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

type ImgAlign = "left" | "center" | "right";
const IMG_ALIGNS: { value: ImgAlign; label: string; Icon: typeof AlignLeft }[] = [
  { value: "left", label: "왼쪽 정렬", Icon: AlignLeft },
  { value: "center", label: "가운데 정렬", Icon: AlignCenter },
  { value: "right", label: "오른쪽 정렬", Icon: AlignRight },
];

// 이미지 NodeView — 선택 시 네 모서리 드래그로 크기 조절, 상단 정렬 툴바. 드래그 중엔
// 로컬 상태로 부드럽게 미리보고, 놓을 때 한 번만 width 속성에 반영(undo 1스텝).
function ImageNodeView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const width = (node.attrs.width as number | null) ?? null;
  const align = ((node.attrs.align as string | null) ?? "left") as ImgAlign;
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragPct, setDragPct] = useState<number | null>(null);
  const shownWidth = dragPct ?? width;

  function beginResize(dir: 1 | -1, e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const img = imgRef.current;
    if (!img) return;
    const containerPx = editor.view.dom.clientWidth || img.getBoundingClientRect().width;
    const startPx = img.getBoundingClientRect().width;
    const startX = e.clientX;
    let last = width ?? nextWidthPercent(startPx, 0, containerPx);
    const onMove = (ev: PointerEvent) => {
      last = nextWidthPercent(startPx, (ev.clientX - startX) * dir, containerPx);
      setDragPct(last);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDragPct(null);
      updateAttributes({ width: last });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const handle = (extra: CSSProperties): CSSProperties => ({
    position: "absolute",
    width: 14,
    height: 14,
    background: "#fff",
    border: "2px solid var(--color-primary)",
    borderRadius: 3,
    touchAction: "none",
    zIndex: 2,
    ...extra,
  });

  return (
    <NodeViewWrapper
      as="div"
      style={{
        display: "block",
        width: shownWidth ? `${shownWidth}%` : "fit-content",
        maxWidth: "100%",
        margin: `0.6em ${align === "right" ? "0" : "auto"} 0.6em ${align === "left" ? "0" : "auto"}`,
        position: "relative",
        lineHeight: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={node.attrs.src as string}
        alt={(node.attrs.alt as string) ?? ""}
        draggable={false}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          borderRadius: "var(--radius-md)",
          outline: selected ? "2px solid var(--color-primary)" : "none",
        }}
      />
      {selected && (
        <>
          <div
            contentEditable={false}
            style={{
              position: "absolute",
              top: 6,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 2,
              padding: 3,
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 1px 6px rgba(0,0,0,0.18)",
              zIndex: 3,
            }}
          >
            {IMG_ALIGNS.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                title={label}
                aria-label={label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => updateAttributes({ align: value })}
                style={{
                  display: "inline-flex",
                  width: 28,
                  height: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: align === value ? "var(--color-primary-soft)" : "transparent",
                  color: align === value ? "var(--color-primary)" : "var(--color-body-strong)",
                }}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
          <span style={handle({ top: -7, left: -7, cursor: "nwse-resize" })} onPointerDown={(e) => beginResize(-1, e)} />
          <span style={handle({ top: -7, right: -7, cursor: "nesw-resize" })} onPointerDown={(e) => beginResize(1, e)} />
          <span style={handle({ bottom: -7, left: -7, cursor: "nesw-resize" })} onPointerDown={(e) => beginResize(-1, e)} />
          <span style={handle({ bottom: -7, right: -7, cursor: "nwse-resize" })} onPointerDown={(e) => beginResize(1, e)} />
        </>
      )}
    </NodeViewWrapper>
  );
}

/** 리치 텍스트 에디터(Tiptap). 공지 본문·상담 답변 공용. HTML 문자열을 value/onChange로 주고받는다. */
export function RichEditor({
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
      RichImage,
      TextStyle,
      Color,
      FontSize,
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
      <SizeControls editor={editor} />
      <Divider />
      <ColorControls editor={editor} />
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

// 글자 크기 — [기본] [−] 숫자 [+] 스테퍼. '기본'은 크기 해제(본문 기본 크기 상속).
function SizeControls({ editor }: { editor: Editor }) {
  const sizeAttr = editor.getAttributes("textStyle").fontSize as string | undefined;
  const current = parseFontSize(sizeAttr);
  const apply = (delta: number) =>
    editor.chain().focus().setFontSize(`${stepFontSize(current, delta)}px`).run();
  return (
    <>
      <Btn
        title="기본 크기"
        active={!sizeAttr}
        onClick={() => editor.chain().focus().unsetFontSize().run()}
      >
        기본
      </Btn>
      <Btn title="글자 작게" disabled={current <= MIN_FONT_SIZE} onClick={() => apply(-1)}>
        −
      </Btn>
      <span
        className="inline-flex h-8 min-w-8 items-center justify-center px-1 text-[13px] font-semibold tabular-nums text-body-strong"
        aria-label={`현재 글자 크기 ${current}`}
      >
        {current}
      </span>
      <Btn title="글자 크게" disabled={current >= MAX_FONT_SIZE} onClick={() => apply(1)}>
        +
      </Btn>
    </>
  );
}

// 글자 색상 — 프리셋 팔레트. '기본'은 색 해제(기본 글자색 상속).
const FONT_COLORS: { name: string; hex: string }[] = [
  { name: "검정", hex: "#1a1a18" },
  { name: "회색", hex: "#6b7280" },
  { name: "빨강", hex: "#e02424" },
  { name: "주황", hex: "#ea580c" },
  { name: "노랑", hex: "#ca8a04" },
  { name: "초록", hex: "#16803c" },
  { name: "청록", hex: "#0d9488" },
  { name: "파랑", hex: "#2563eb" },
  { name: "남색", hex: "#1e3a8a" },
  { name: "보라", hex: "#7c3aed" },
  { name: "자홍", hex: "#c026d3" },
  { name: "분홍", hex: "#db2777" },
];

function ColorControls({ editor }: { editor: Editor }) {
  const current = editor.getAttributes("textStyle").color as string | undefined;
  return (
    <>
      <Btn title="기본 색" active={!current} onClick={() => editor.chain().focus().unsetColor().run()}>
        기본색
      </Btn>
      {FONT_COLORS.map((c) => (
        <button
          key={c.hex}
          type="button"
          title={`${c.name} 글자색`}
          aria-label={`${c.name} 글자색`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setColor(c.hex).run()}
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-md",
            current === c.hex ? "ring-2 ring-primary" : "hover:bg-hairline-soft",
          ].join(" ")}
        >
          <span
            className="h-4 w-4 rounded-full border border-hairline"
            style={{ backgroundColor: c.hex }}
          />
        </button>
      ))}
      <label
        title="더 많은 색 직접 선택"
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[13px] font-semibold text-body-strong hover:bg-hairline-soft"
      >
        더많은색
        <input
          type="color"
          aria-label="글자색 직접 선택"
          defaultValue="#000000"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="h-4 w-4 cursor-pointer rounded border border-hairline p-0"
        />
      </label>
    </>
  );
}
