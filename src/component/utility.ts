import { KSlideSet } from "../frame";
import katex from "katex";
import {
  StateVar,
  StyleVar,
  MultiStateVar,
  MultiStyleVar,
  StateVarList,
  StyleVarList,
} from "statebinderk";

interface KWindow extends Window {
  StateBinder?: {
    StateVar: typeof StateVar;
    StyleVar: typeof StyleVar;
    MultiStateVar: typeof MultiStateVar;
    MultiStyleVar: typeof MultiStyleVar;
    StateVarList: typeof StateVarList;
    StyleVarList: typeof StyleVarList;
  };
  StateVar?: typeof StateVar;
  StyleVar?: typeof StyleVar;
  MultiStateVar?: typeof MultiStateVar;
  MultiStyleVar?: typeof MultiStyleVar;
  StateVarList?: typeof StateVarList;
  StyleVarList?: typeof StyleVarList;
}

export function registerSlideRuntime() {
  if (typeof window !== 'undefined') {
    const win = window as KWindow;
    win.StateBinder = {
      StateVar,
      StyleVar,
      MultiStateVar,
      MultiStyleVar,
      StateVarList,
      StyleVarList,
    };
    win.StateVar = StateVar;
    win.StyleVar = StyleVar;
    win.MultiStateVar = MultiStateVar;
    win.MultiStyleVar = MultiStyleVar;
    win.StateVarList = StateVarList;
    win.StyleVarList = StyleVarList;
  }
}

registerSlideRuntime();

export const tex2mml = (tex:string) => {
  try {
    return katex.renderToString(tex, {
      throwOnError: false,
      displayMode: true,
    });
  } catch {
    return tex;
  }
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatInlineMarkdown(line: string): string {
  return escapeHtml(line)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export function renderMarkdownToHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const htmlParts: string[] = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        htmlParts.push('<ul>');
        inList = true;
      }
      htmlParts.push(`<li>${formatInlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    if (inList) {
      htmlParts.push('</ul>');
      inList = false;
    }

    if (line.startsWith('### ')) {
      htmlParts.push(`<h3>${formatInlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      htmlParts.push(`<h2>${formatInlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      htmlParts.push(`<h1>${formatInlineMarkdown(line.slice(2))}</h1>`);
    } else if (line !== '') {
      htmlParts.push(`<p>${formatInlineMarkdown(line)}</p>`);
    }
  }

  if (inList) {
    htmlParts.push('</ul>');
  }

  return htmlParts.join('');
}

export function downloadFile(fileName:string, fileContent:string) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent));
  element.setAttribute('download', fileName);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function applySlideCustomCode(frameId: number, customCss: string, customJs: string) {
  if (typeof document === 'undefined') return;
  const styleId = `slidecraftk-custom-style-${frameId}`;
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (customCss.trim() !== '') {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = customCss;
  } else if (styleEl) {
    styleEl.remove();
  }

  if (customJs.trim() !== '') {
    try {
      const runner = new Function(customJs);
      runner();
    } catch (err) {
      console.error('Slide script error:', err);
    }
  }
}

export function insertCode(cssOrJs:string){
  const codeInput = document.getElementById('code') as HTMLTextAreaElement | null;
  if (!codeInput) return;
  const codeText = codeInput.value;
  const slide = KSlideSet.slides[KSlideSet.curFrame];
  if (slide) {
    if (cssOrJs === 'style') {
      slide.customCss = codeText;
      applySlideCustomCode(KSlideSet.curFrame, codeText, '');
    } else if (cssOrJs === 'script') {
      slide.customJs = codeText;
      applySlideCustomCode(KSlideSet.curFrame, slide.customCss, codeText);
    }
  }
}

export function handleFullScreen() {
  const view = document.getElementById(`slide${KSlideSet.curFrame}`);
  if (!document.fullscreenElement ) {
    if (view?.requestFullscreen) {
      view.requestFullscreen();
    }
    console.log("fullscrenn");
  }
}

export function mod(a:number, b:number):number {
  return ((a % b) + b) % b;
}
