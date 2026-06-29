"use client";

import React, { useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useRef(null);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: 'Start typing...',
      height: 400,
      enableDragAndDropFileToEditor: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_as_html' as const,
      uploader: {
        insertImageAsBase64URI: false,
      },
      buttons: [
        'source', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'superscript', 'subscript', '|',
        'ul', 'ol', '|',
        'outdent', 'indent', '|',
        'font', 'fontsize', 'brush', 'paragraph', '|',
        'table', 'link', '|',
        'align', 'undo', 'redo', '|',
        'hr', 'eraser', 'copyformat', '|',
        'fullsize', 'selectall', 'print', 'about'
      ],
    }),
    []
  );

  return (
    <div className="prose max-w-none text-black">
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={newContent => onChange(newContent)}
        onChange={newContent => {}}
      />
    </div>
  );
}
