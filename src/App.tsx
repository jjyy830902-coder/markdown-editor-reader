import React, { useState, useRef, useEffect } from 'react';
import { VisualEditor } from './components/VisualEditor';
import { SourceEditor } from './components/SourceEditor';
import { MarkdownPreview } from './components/MarkdownPreview';
import { Reader } from './components/Reader';
import { FileText, Columns, Code2, Download, Copy, Check, Upload, BookOpen, Edit3, Settings, Moon, Sun, Type, Maximize, Minimize, MoreVertical } from 'lucide-react';
import { cn } from './lib/utils';

const INITIAL_MARKDOWN = `# 歡迎使用 Markdown 專業編輯器

這是一個支援 **所見即所得 (WYSIWYG)**、**雙欄預覽** 與 **原始碼編輯** 的強大工具。

## 功能特色

- 👁️ **視覺模式**：像使用 Word 或 Notion 一樣直接編輯，無需記憶語法。
- ✂️ **分隔模式**：左側編寫原始碼，右側即時預覽。
- 📝 **原始碼模式**：純粹的 Markdown 寫作體驗。
- 📖 **專業閱讀器**：自動目錄、平滑捲動。
- 💾 **自動存檔**：內容自動儲存於瀏覽器。
- 🌙 **深色模式**：保護您的眼睛。
- 🔤 **自訂字體**：調整大小與字型。
- 🧮 **進階語法**：支援數學公式與圖表。

### 數學公式範例

這是一個行內公式 $E=mc^2$。

這是一個區塊公式：

$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

### 圖表範例

\`\`\`mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
\`\`\`

### 支援豐富的 Markdown 語法

1. **粗體**、*斜體*、~~刪除線~~
2. [連結](https://github.com)
3. 程式碼區塊高亮：

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
greet('World');
\`\`\`

> 這是一個引言區塊。設計簡潔，閱讀舒適。

| 模式 | 適合對象 | 特色 |
| :--- | :--- | :--- |
| 視覺 | 一般使用者 | 所見即所得，直覺操作 |
| 分隔 | 開發者/作者 | 即時預覽，精準控制 |
| 原始碼 | 重度 Markdown 玩家 | 專注寫作，無干擾 |

- [x] 支援任務列表
- [ ] 支援更多擴充功能
`;

type EditorMode = 'visual' | 'split' | 'source';
type MainTab = 'editor' | 'reader';

// Custom hook for localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export default function App() {
  const [markdown, setMarkdown] = useLocalStorage<string>('markdown-content', INITIAL_MARKDOWN);
  const [mode, setMode] = useState<EditorMode>('visual');
  const [mainTab, setMainTab] = useState<MainTab>('editor');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('dark-mode', false);
  const [fontSize, setFontSize] = useLocalStorage<string>('font-size', 'prose-base');
  const [fontFamily, setFontFamily] = useLocalStorage<string>('font-family', 'font-sans');
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Responsive mode handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && mode === 'split') {
        setMode('visual');
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Check on initial load
    
    return () => window.removeEventListener('resize', handleResize);
  }, [mode]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setMarkdown(content);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Calculate word count and reading time
  const wordCount = markdown.trim().split(/\s+/).filter(w => w.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#121212] flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#333333] sticky top-0 z-50 no-print transition-colors duration-300">
        <div className={cn(
          "mx-auto px-4 h-16 flex items-center justify-between transition-all duration-300",
          mode === 'split' ? "max-w-none w-full" : "max-w-7xl"
        )}>
          <div className="flex items-center gap-2 md:gap-6">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-lg">
              <FileText className="w-6 h-6 shrink-0" />
              <span className="hidden sm:inline">MD Editor Pro</span>
            </div>
            
            {/* Main Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-[#121212] p-1 rounded-lg border border-transparent dark:border-[#333333]">
              <button
                onClick={() => setMainTab('editor')}
                className={cn(
                  "flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  mainTab === 'editor' ? "bg-white dark:bg-[#2d2d2d] text-blue-600 dark:text-white shadow-sm border border-transparent dark:border-[#333333]" : "text-gray-500 dark:text-[#a0a0a0] hover:text-gray-700 dark:hover:text-[#e0e0e0]"
                )}
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">編輯器</span>
                <span className="sm:hidden">編輯</span>
              </button>
              <button
                onClick={() => setMainTab('reader')}
                className={cn(
                  "flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  mainTab === 'reader' ? "bg-white dark:bg-[#2d2d2d] text-blue-600 dark:text-white shadow-sm border border-transparent dark:border-[#333333]" : "text-gray-500 dark:text-[#a0a0a0] hover:text-gray-700 dark:hover:text-[#e0e0e0]"
                )}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">閱讀器</span>
                <span className="sm:hidden">閱讀</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher (Only in Editor Tab) */}
          {mainTab === 'editor' && (
            <div className="hidden md:flex bg-gray-100 dark:bg-[#121212] p-1 rounded-lg border border-transparent dark:border-[#333333]">
              <button
                onClick={() => setMode('visual')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  mode === 'visual' ? "bg-white dark:bg-[#2d2d2d] text-gray-900 dark:text-white shadow-sm border border-transparent dark:border-[#333333]" : "text-gray-500 dark:text-[#a0a0a0] hover:text-gray-700 dark:hover:text-[#e0e0e0]"
                )}
              >
                <FileText className="w-4 h-4" />
                視覺
              </button>
              <button
                onClick={() => setMode('split')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  mode === 'split' ? "bg-white dark:bg-[#2d2d2d] text-gray-900 dark:text-white shadow-sm border border-transparent dark:border-[#333333]" : "text-gray-500 dark:text-[#a0a0a0] hover:text-gray-700 dark:hover:text-[#e0e0e0]"
                )}
              >
                <Columns className="w-4 h-4" />
                分隔
              </button>
              <button
                onClick={() => setMode('source')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  mode === 'source' ? "bg-white dark:bg-[#2d2d2d] text-gray-900 dark:text-white shadow-sm border border-transparent dark:border-[#333333]" : "text-gray-500 dark:text-[#a0a0a0] hover:text-gray-700 dark:hover:text-[#e0e0e0]"
                )}
              >
                <Code2 className="w-4 h-4" />
                原始碼
              </button>
            </div>
          )}

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <input
              type="file"
              accept=".md,.txt,text/markdown,text/plain"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-[#e0e0e0] hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-md transition-colors"
            >
              <Upload className="w-4 h-4" />
              上傳
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-[#e0e0e0] hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-md transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? '已複製' : '複製'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              下載
            </button>

            <div className="relative ml-2 border-l border-gray-200 dark:border-[#333333] pl-2 flex items-center gap-1">
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-600 dark:text-[#e0e0e0] hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-md transition-colors"
                title={isFullscreen ? "退出全螢幕" : "全螢幕"}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 dark:text-[#e0e0e0] hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-md transition-colors" 
                title="設定"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1e1e1e] rounded-lg shadow-lg border border-gray-200 dark:border-[#333333] p-4 z-50">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">外觀設定</h3>
                  
                  <div className="space-y-4">
                    {/* Theme Toggle */}
                    <div>
                      <span className="text-sm text-gray-700 dark:text-[#a0a0a0] block mb-2">外觀模式</span>
                      <div className="flex bg-gray-100 dark:bg-[#121212] rounded-md p-1 border border-transparent dark:border-[#333333]">
                        <button
                          onClick={() => setIsDarkMode(false)}
                          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm rounded transition-colors ${!isDarkMode ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-200 dark:hover:bg-[#2d2d2d]'}`}
                        >
                          <Sun className="w-4 h-4" />
                          淺色
                        </button>
                        <button
                          onClick={() => setIsDarkMode(true)}
                          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm rounded transition-colors ${isDarkMode ? 'dark:bg-[#2d2d2d] shadow-sm text-blue-600 dark:text-white border border-transparent dark:border-[#333333]' : 'text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-200 dark:hover:bg-[#2d2d2d]'}`}
                        >
                          <Moon className="w-4 h-4" />
                          深色
                        </button>
                      </div>
                    </div>

                    {/* Font Size */}
                    <div>
                      <span className="text-sm text-gray-700 dark:text-[#a0a0a0] block mb-2">字體大小</span>
                      <div className="flex bg-gray-100 dark:bg-[#121212] rounded-md p-1 border border-transparent dark:border-[#333333]">
                        {['prose-sm', 'prose-base', 'prose-lg', 'prose-xl'].map((size, index) => (
                          <button
                            key={size}
                            onClick={() => setFontSize(size)}
                            className={`flex-1 py-1 text-sm rounded transition-colors ${fontSize === size ? 'bg-white dark:bg-[#2d2d2d] shadow-sm text-blue-600 dark:text-white border border-transparent dark:border-[#333333]' : 'text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-200 dark:hover:bg-[#2d2d2d]'}`}
                          >
                            {['小', '中', '大', '特大'][index]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Family */}
                    <div>
                      <span className="text-sm text-gray-700 dark:text-[#a0a0a0] block mb-2">字體風格</span>
                      <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-[#121212] rounded-md p-1 border border-transparent dark:border-[#333333]">
                        {[
                          { id: 'font-sans', label: '預設無襯線' },
                          { id: 'font-serif', label: '預設襯線' },
                          { id: 'font-mono', label: '預設等寬' },
                          { id: 'font-noto-sans', label: '思源黑體' },
                          { id: 'font-noto-serif', label: '思源宋體' },
                          { id: 'font-lxgw', label: '霞鶩文楷' },
                          { id: 'font-biaokai', label: '標楷體' }
                        ].map((font) => (
                          <button
                            key={font.id}
                            onClick={() => setFontFamily(font.id)}
                            className={`py-1.5 text-sm rounded transition-colors ${fontFamily === font.id ? 'bg-white dark:bg-[#2d2d2d] shadow-sm text-blue-600 dark:text-white border border-transparent dark:border-[#333333]' : 'text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-200 dark:hover:bg-[#2d2d2d]'}`}
                          >
                            {font.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-600 dark:text-[#e0e0e0] hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-md transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 dark:border-[#333333] bg-white dark:bg-[#1e1e1e] p-4 space-y-4">
            {mainTab === 'editor' && (
              <div className="flex bg-gray-100 dark:bg-[#121212] p-1 rounded-lg border border-transparent dark:border-[#333333]">
                <button
                  onClick={() => { setMode('visual'); setShowMobileMenu(false); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    mode === 'visual' ? "bg-white dark:bg-[#2d2d2d] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-[#a0a0a0]"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  視覺
                </button>
                <button
                  onClick={() => { setMode('source'); setShowMobileMenu(false); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    mode === 'source' ? "bg-white dark:bg-[#2d2d2d] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-[#a0a0a0]"
                  )}
                >
                  <Code2 className="w-4 h-4" />
                  原始碼
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { handleUploadClick(); setShowMobileMenu(false); }}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-[#e0e0e0] bg-gray-100 dark:bg-[#2d2d2d] rounded-md"
              >
                <Upload className="w-4 h-4" />
                上傳
              </button>
              <button
                onClick={() => { handleDownload(); setShowMobileMenu(false); }}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md"
              >
                <Download className="w-4 h-4" />
                下載
              </button>
              <button
                onClick={() => { handleCopy(); setShowMobileMenu(false); }}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-[#e0e0e0] bg-gray-100 dark:bg-[#2d2d2d] rounded-md col-span-2"
              >
                {copied ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? '已複製' : '複製全部內容'}
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-[#333333] pt-4">
              <span className="text-sm text-gray-700 dark:text-[#a0a0a0] block mb-2">外觀模式</span>
              <div className="flex bg-gray-100 dark:bg-[#121212] rounded-md p-1">
                <button
                  onClick={() => setIsDarkMode(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded ${!isDarkMode ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 dark:text-[#a0a0a0]'}`}
                >
                  <Sun className="w-4 h-4" />
                  淺色
                </button>
                <button
                  onClick={() => setIsDarkMode(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded ${isDarkMode ? 'dark:bg-[#2d2d2d] shadow-sm text-blue-400' : 'text-gray-600 dark:text-[#a0a0a0]'}`}
                >
                  <Moon className="w-4 h-4" />
                  深色
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className={cn(
        "flex-grow flex flex-col p-2 md:p-4 mx-auto w-full h-[calc(100vh-4rem-2.5rem)] transition-all duration-300",
        mode === 'split' ? "max-w-none" : "max-w-7xl"
      )}>
        {mainTab === 'editor' ? (
          <>
            {mode === 'visual' && (
              <div className="flex-grow w-full max-w-4xl mx-auto h-full">
                <VisualEditor 
                  content={markdown} 
                  onChange={setMarkdown} 
                  className="h-full shadow-sm"
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                />
              </div>
            )}

            {mode === 'split' && (
              <div className="flex-grow flex flex-col md:flex-row gap-2 md:gap-4 h-full">
                <div className="w-full md:w-1/2 h-1/2 md:h-full border border-gray-200 dark:border-[#333333] rounded-lg overflow-hidden shadow-sm">
                  <SourceEditor 
                    content={markdown} 
                    onChange={setMarkdown} 
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                  />
                </div>
                <div className="w-full md:w-1/2 h-1/2 md:h-full border border-gray-200 dark:border-[#333333] rounded-lg overflow-y-auto bg-white dark:bg-[#121212] p-4 md:p-8 shadow-sm">
                  <MarkdownPreview 
                    content={markdown} 
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                  />
                </div>
              </div>
            )}

            {mode === 'source' && (
              <div className="flex-grow w-full max-w-4xl mx-auto h-full border border-gray-200 dark:border-[#333333] rounded-lg overflow-hidden shadow-sm">
                <SourceEditor 
                  content={markdown} 
                  onChange={setMarkdown} 
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-grow w-full h-full">
            <Reader 
              content={markdown} 
              fontSize={fontSize}
              fontFamily={fontFamily}
            />
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-[#333333] px-4 py-2 text-xs text-gray-500 dark:text-[#a0a0a0] flex justify-between items-center no-print transition-colors duration-300">
        <div className="flex items-center gap-4">
          <span>{wordCount} 字</span>
          <span>預估閱讀時間：{readingTime} 分鐘</span>
        </div>
        <div>
          {mainTab === 'editor' ? '編輯模式' : '閱讀模式'}
        </div>
      </footer>
    </div>
  );
}
