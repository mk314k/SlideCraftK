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

const activeSlideCleanups: Array<() => void> = [];

export function cleanupSlideRuntime() {
  while (activeSlideCleanups.length > 0) {
    const fn = activeSlideCleanups.pop();
    try {
      fn?.();
    } catch {
      // ignore cleanup errors
    }
  }
}

export function scopeCssToSlide(frameId: number, rawCss: string): string {
  const scopePrefix = `#slide${frameId}`;
  const sanitized = rawCss
    .replace(/<\/?style[^>]*>/gi, '')
    .replace(/@import\b[^;]*;?/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/javascript\s*:/gi, '');

  return sanitized.replace(/(^|\})\s*([^{}@]+)\{/g, (match, brace, selectorGroup: string) => {
    const trimmed = selectorGroup.trim();
    if (!trimmed) return match;
    const scopedSelectors = trimmed
      .split(',')
      .map((sel) => {
        const s = sel.trim();
        if (!s) return '';
        if (s === ':root' || s === 'body' || s === 'html' || s === '#slide') {
          return scopePrefix;
        }
        if (s.startsWith(scopePrefix)) {
          return s;
        }
        return `${scopePrefix} ${s}`;
      })
      .filter(Boolean)
      .join(', ');
    return `${brace} ${scopedSelectors} {`;
  });
}

export interface ScopedSlideController {
  el: (id: number | string) => HTMLElement | null;
  box: (id: number | string) => HTMLElement | null;
  setText: (id: number | string, text: string) => void;
  setStyle: (id: number | string, prop: string, value: string) => void;
  onClick: (id: number | string, handler: (ev: MouseEvent) => void) => void;
  stateVar: <T>(initial: T, id: number | string, updater: (el: HTMLElement, state: T) => void) => StateVar<T>;
  styleVar: <T>(initial: T, id: number | string, prop: string) => StyleVar<T>;
}

const FORBIDDEN_CODE_PATTERNS = /\b(fetch|XMLHttpRequest|WebSocket|Worker|SharedWorker|importScripts|localStorage|sessionStorage|indexedDB|cookie|eval|Function|parent|top|frames|opener)\b/;

export function createScopedSlideController(frameId: number): ScopedSlideController {
  const getSlideRoot = () => document.getElementById(`slide${frameId}`);

  const resolveInner = (id: number | string): HTMLElement | null => {
    const root = getSlideRoot();
    if (!root) return null;
    const cleanId = String(id).replace(/^#/, '');
    const candidate = document.getElementById(cleanId);
    return candidate && root.contains(candidate) ? candidate : null;
  };

  const resolveBox = (id: number | string): HTMLElement | null => {
    const root = getSlideRoot();
    if (!root) return null;
    const cleanId = String(id).replace(/^#/, '').replace(/div$/, '');
    const candidate = document.getElementById(`${cleanId}div`);
    return candidate && root.contains(candidate) ? candidate : null;
  };

  const ctrl: ScopedSlideController = {
    el: resolveInner,
    box: resolveBox,
    setText(id: number | string, text: string) {
      const target = resolveInner(id);
      if (target) {
        target.textContent = String(text);
      }
    },
    setStyle(id: number | string, prop: string, value: string) {
      const target = resolveBox(id) ?? resolveInner(id);
      if (target && !(prop in Object.prototype)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target.style as any)[prop] = value;
      }
    },
    onClick(id: number | string, handler: (ev: MouseEvent) => void) {
      const target = resolveBox(id) ?? resolveInner(id);
      if (target && typeof handler === 'function') {
        const wrapped = (ev: MouseEvent) => {
          ev.stopPropagation();
          handler(ev);
        };
        target.addEventListener('click', wrapped);
        activeSlideCleanups.push(() => target.removeEventListener('click', wrapped));
      }
    },
    stateVar<T>(initial: T, id: number | string, updater: (el: HTMLElement, state: T) => void) {
      const cleanId = String(id).replace(/^#/, '');
      return new StateVar<T>(initial, cleanId, (el, st) => {
        const root = getSlideRoot();
        if (root && root.contains(el)) {
          updater(el, st);
        }
      });
    },
    styleVar<T>(initial: T, id: number | string, prop: string) {
      const cleanId = String(id).replace(/^#/, '');
      const normalizedId = cleanId.endsWith('div') ? cleanId : `${cleanId}div`;
      return new StyleVar<T>(initial, normalizedId, prop);
    },
  };
  return Object.freeze(ctrl);
}

export function applySlideCustomCode(
  frameId: number,
  customCss: string,
  customJs: string
): { error: string | null } {
  if (typeof document === 'undefined') return { error: null };

  cleanupSlideRuntime();

  const styleId = `slidecraftk-custom-style-${frameId}`;
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (customCss.trim() !== '') {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = scopeCssToSlide(frameId, customCss);
  } else if (styleEl) {
    styleEl.remove();
  }

  if (customJs.trim() !== '') {
    if (FORBIDDEN_CODE_PATTERNS.test(customJs)) {
      return {
        error: 'Blocked restricted API: Slide code is sandboxed to the current slide (`slide.*` and `StateBinder`).',
      };
    }
    try {
      const slideCtrl = createScopedSlideController(frameId);
      const safeBinder = Object.freeze({
        StateVar,
        StyleVar,
        MultiStateVar,
        MultiStyleVar,
        StateVarList,
        StyleVarList,
      });
      const runner = new Function(
        'slide',
        'StateBinder',
        'StateVar',
        'StyleVar',
        'MultiStateVar',
        'MultiStyleVar',
        'window',
        'document',
        'globalThis',
        '"use strict";\n' + customJs
      );
      runner(
        slideCtrl,
        safeBinder,
        StateVar,
        StyleVar,
        MultiStateVar,
        MultiStyleVar,
        undefined,
        undefined,
        undefined
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Slide code execution error';
      console.error('Slide code error:', msg);
      return { error: msg };
    }
  }
  return { error: null };
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
  const stage = document.getElementById('presentation-stage') ?? document.getElementById(`slide${KSlideSet.curFrame}`);
  if (!document.fullscreenElement) {
    if (stage?.requestFullscreen) {
      stage.requestFullscreen();
    }
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

export function mod(a:number, b:number):number {
  return ((a % b) + b) % b;
}
