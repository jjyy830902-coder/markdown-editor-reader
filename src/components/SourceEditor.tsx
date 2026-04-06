import React from 'react';
import { cn } from '../lib/utils';

interface SourceEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  className?: string;
  fontSize?: string;
  fontFamily?: string;
}

export function SourceEditor({ content, onChange, className, fontSize = 'text-sm', fontFamily = 'font-mono' }: SourceEditorProps) {
  // Map prose font sizes to standard text sizes for the textarea
  const getFontSize = () => {
    switch (fontSize) {
      case 'prose-sm': return 'text-xs';
      case 'prose-lg': return 'text-base';
      case 'prose-xl': return 'text-lg';
      default: return 'text-sm';
    }
  };

  return (
    <textarea
      value={content}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full h-full p-6 leading-relaxed resize-none focus:outline-none bg-gray-50 text-gray-800 dark:bg-[#121212] dark:text-[#e0e0e0] transition-all duration-300",
        getFontSize(),
        fontFamily,
        className
      )}
      placeholder="在此輸入 Markdown 語法..."
      spellCheck={false}
    />
  );
}
