import React, { useState, useEffect, useMemo } from 'react';
import GithubSlugger from 'github-slugger';
import { MarkdownPreview } from './MarkdownPreview';
import { Menu } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReaderProps {
  content: string;
  fontSize?: string;
  fontFamily?: string;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function Reader({ content, fontSize, fontFamily }: ReaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeId, setActiveId] = useState<string>('');

  const headings = useMemo(() => {
    const slugger = new GithubSlugger();
    const regex = /^(#{1,3})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(regex));
    
    return matches.map((match) => {
      const level = match[1].length;
      const text = match[2].trim();
      // Remove markdown links or formatting from text for the slug
      const cleanText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_~`]/g, '');
      const id = slugger.slug(cleanText);
      return { id, text: cleanText, level };
    });
  }, [content]);

  useEffect(() => {
    // Wait a bit for the markdown to render
    const timeoutId = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          // Find all intersecting entries
          const visibleEntries = entries.filter((entry) => entry.isIntersecting);
          if (visibleEntries.length > 0) {
            // Sort by top position to get the topmost visible heading
            visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            setActiveId(visibleEntries[0].target.id);
          }
        },
        { rootMargin: '0px 0px -80% 0px', threshold: [0, 1] }
      );

      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.observe(element);
        }
      });

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [headings, content]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveId(id);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-[#121212] overflow-hidden rounded-lg border border-gray-200 dark:border-[#333333] shadow-sm transition-colors duration-300">
      {/* Sidebar */}
      <div 
        className={cn(
          "flex-shrink-0 border-r border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#1e1e1e] transition-all duration-300 overflow-y-auto no-print",
          isSidebarOpen ? "w-64" : "w-0 border-r-0"
        )}
      >
        <div className="p-4 w-64">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 px-2">目錄</h3>
          <nav className="space-y-1">
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={() => scrollToHeading(heading.id)}
                className={cn(
                  "block w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors truncate",
                  activeId === heading.id 
                    ? "bg-blue-100 text-blue-700 dark:bg-[#2d2d2d] dark:text-white font-medium" 
                    : "text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-200 dark:hover:bg-[#2d2d2d] hover:text-gray-900 dark:hover:text-[#e0e0e0]",
                  heading.level === 2 && "ml-3 w-[calc(100%-0.75rem)]",
                  heading.level === 3 && "ml-6 w-[calc(100%-1.5rem)]"
                )}
                title={heading.text}
              >
                {heading.text}
              </button>
            ))}
            {headings.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-[#a0a0a0] px-2">尚無標題</p>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0 overflow-hidden relative">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 p-2 bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#333333] rounded-md shadow-sm text-gray-600 dark:text-[#e0e0e0] hover:bg-gray-50 dark:hover:bg-[#2d2d2d] z-10 no-print transition-colors"
          title={isSidebarOpen ? "收合目錄" : "展開目錄"}
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex-grow overflow-y-auto px-8 py-12 scroll-smooth" id="reader-scroll-container">
          <div className="max-w-3xl mx-auto pt-4">
            <MarkdownPreview content={content} fontSize={fontSize} fontFamily={fontFamily} />
          </div>
        </div>
      </div>
    </div>
  );
}
