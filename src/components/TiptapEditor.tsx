import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface TiptapEditorProps {
  content: string;
  setContent: (content: string) => void;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, setContent }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose focus:outline-none",
      },
    },
    immediatelyRender: false, // Fix SSR warning
  });

  return <EditorContent editor={editor} />;
};

export default TiptapEditor;
