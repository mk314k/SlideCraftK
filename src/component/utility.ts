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

export function insertCode(cssOrJs:string){
  const codeText = (document.getElementById('code') as HTMLTextAreaElement).value;
  const codeElement = document.createElement(cssOrJs);
  codeElement.appendChild(document.createTextNode(codeText));
  document.head.appendChild(codeElement);
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
