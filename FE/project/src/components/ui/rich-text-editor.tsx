import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter lesson content...',
  disabled = false,
  className = '',
}) => {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],

        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['clean'],
      ],
    }),
    []
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'indent',
    'color',
    'background',
    'align',
    'blockquote',
    'code-block',
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
      />
      <style>{`
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: -webkit-calc(var(--radius) - 2px);
          border-top-left-radius: calc(var(--radius) - 2px);
          border-top-right-radius: -webkit-calc(var(--radius) - 2px);
          border-top-right-radius: calc(var(--radius) - 2px);
          border: 1px solid hsl(var(--input));
          background-color: hsl(var(--muted) / 0.5);
          border-bottom: none;
        }
        
        .rich-text-editor .ql-container {
          min-height: 300px;
          font-size: 0.875rem; /* text-sm to match inputs usually, or 1rem */
          border-bottom-left-radius: -webkit-calc(var(--radius) - 2px);
          border-bottom-left-radius: calc(var(--radius) - 2px);
          border-bottom-right-radius: -webkit-calc(var(--radius) - 2px);
          border-bottom-right-radius: calc(var(--radius) - 2px);
          border: 1px solid hsl(var(--input));
          background-color: hsl(var(--background));
        }

        .rich-text-editor .ql-editor {
          min-height: 300px;
          color: hsl(var(--foreground));
        }

        .rich-text-editor .ql-editor.ql-blank::before {
          font-style: normal;
          color: hsl(var(--muted-foreground));
        }

        /* Focus state simulation - targeting container when authorized if possible, 
           but Quill makes it hard to style wrapper based on focus without JS. 
           We can stick to basic border for now. */
      `}</style>
    </div>
  );
};
