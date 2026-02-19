import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Paintbrush,
  Undo,
  Redo,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
};

const COLORS = [
  "#ffffff",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#a78bfa",
];

export default function RichTextEditor({ value, onChange, disabled }: Props) {
  const isProgrammaticChange = useRef(false);

  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: "Write down your ideas...",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      if (isProgrammaticChange.current) return;
      onChange(editor.getHTML());
    },

    editorProps: {
      attributes: {
        class:
          "min-h-[340px] p-4 focus:outline-none text-white/90 leading-6 " +
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold " +
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 " +
          "[&_blockquote]:border-l-4 [&_blockquote]:border-white/20 [&_blockquote]:pl-4 [&_blockquote]:text-white/70 " +
          "[&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded",
      },
    },
  });

  // when note changes (selected note changed), update editor content
  useEffect(() => {
    if (!editor) return;

    const next = value || "";
    const current = editor.getHTML();

    if (current === next) return;

    isProgrammaticChange.current = true;

    editor.commands.setContent(next, { emitUpdate: false });

    // wait for ALL transactions to finish
    setTimeout(() => {
      isProgrammaticChange.current = false;
    }, 0);
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  const Btn = ({
    onClick,
    active,
    children,
    disabled: btnDisabled,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={onClick}
      disabled={btnDisabled}
      className={cn(
        "h-9 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10",
        active && "bg-white/12 border-white/20",
      )}
    >
      {children}
    </Button>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 border-b border-white/10 bg-white/4">
        <Btn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </Btn>

        <Btn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </Btn>

        <Btn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          disabled={disabled}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Btn>

        <div className="w-px h-8 bg-white/10 mx-1" />

        <Btn
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
          disabled={disabled}
        >
          <Heading1 className="h-4 w-4" />
        </Btn>

        <Btn
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          disabled={disabled}
        >
          <Heading2 className="h-4 w-4" />
        </Btn>

        <Btn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </Btn>

        <Btn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </Btn>

        <Btn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          disabled={disabled}
        >
          <Quote className="h-4 w-4" />
        </Btn>

        <Btn
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          disabled={disabled}
        >
          <Code className="h-4 w-4" />
        </Btn>

        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* Color chips */}
        <div className="flex items-center gap-2 px-2">
          <Paintbrush className="h-4 w-4 text-white/60" />
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().setColor(c).run()}
              className="h-5 w-5 rounded-full border border-white/10 hover:scale-105 transition"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <Btn
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Btn>
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
