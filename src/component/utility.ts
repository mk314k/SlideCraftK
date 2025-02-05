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
