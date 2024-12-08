import { KSlideSet } from "../frame";

interface KWindow extends Window {
  MathJax?: {
    typeset: () => void;
    tex2mml: (tex:string) => string;
  };
}

export const tex2mml = (tex:string) => {
  let res = tex;
  if (typeof window !== 'undefined') {
    res = (window as KWindow).MathJax?.tex2mml(res) ?? tex;
  }
  return res;
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
