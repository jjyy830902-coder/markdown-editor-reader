import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import mermaid from 'mermaid';
import { Check, Copy } from 'lucide-react';
import { cn } from '../lib/utils';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  fontSize?: string;
  fontFamily?: string;
}

const Mermaid = ({ code }: { code: string }) => {
  const [svg, setSvg] = useState('');
  const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        const { svg } = await mermaid.render(id.current, code);
        if (isMounted) {
          setSvg(svg);
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        if (isMounted) {
          setSvg(`<div class="text-red-500 p-4 border border-red-200 rounded">圖表渲染錯誤</div>`);
        }
      }
    };
    renderChart();
    return () => {
      isMounted = false;
    };
  }, [code]);

  return <div dangerouslySetInnerHTML={{ __html: svg }} className="flex justify-center my-8" />;
};

const CodeBlock = ({ children, className, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const isMermaid = match && match[1] === 'mermaid';

  if (isMermaid) {
    return <Mermaid code={String(children).replace(/\n$/, '')} />;
  }

  const handleCopy = () => {
    let text = '';
    const extractText = (children: any) => {
      React.Children.forEach(children, (child) => {
        if (typeof child === 'string') {
          text += child;
        } else if (React.isValidElement(child) && (child.props as any).children) {
          extractText((child.props as any).children);
        }
      });
    };
    extractText(children);

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 p-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10 no-print"
        title="複製程式碼"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
      <pre className={className} {...props}>
        {children}
      </pre>
    </div>
  );
};

export function MarkdownPreview({ content, className, fontSize = 'prose-base', fontFamily = 'font-sans' }: MarkdownPreviewProps) {
  return (
    <div className={cn(
      "prose dark:prose-invert max-w-none prose-pre:p-4 prose-pre:rounded-lg dark:prose-pre:border-[#333333] transition-all duration-300",
      fontSize,
      fontFamily,
      className
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeSlug, rehypeKatex]}
        components={{
          pre: CodeBlock
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
