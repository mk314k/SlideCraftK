import { KSlideSet } from "../frame";


interface KWindow extends Window {
  MathJax?: {
    typeset: () => void;
    tex2mml: (tex:string) => string;
  };
}


const tex2mml = (tex:string) => {
    let res = tex;
    if (window !== undefined){
      res = (window as KWindow).MathJax?.tex2mml(res)??'';
    }
    return res;
  }

export const handleEditText = (id: number, ltx = false) => {
    console.log("editing");
    KSlideSet.editingMode = true;
    const element = document.getElementById(`${id}`);
    if (element) {
      const parentElement = element.parentElement;
      const textInput = document.createElement('input');
      
      // Set initial input value to button's text
      textInput.value = element.innerText;
  
      // Set input styles
      textInput.style.width = `${element.clientWidth}px`;
      textInput.style.height = `${element.clientHeight}px`;
      textInput.style.zIndex = '2';
  
      const handleClick = (e:MouseEvent) => {
        if (!textInput.contains(e.target as Node)) {
          const innerData = ltx ? tex2mml(textInput.value) : textInput.value;
          element.innerHTML = innerData;
          KSlideSet.slides[KSlideSet.curFrame].get(id).inner = innerData;
          parentElement?.replaceChild(element, textInput);
          KSlideSet.editingMode = false;
          document.removeEventListener('click', handleClick);
        }
      }
  
      // Handle click outside of input to update button text
      document.addEventListener('click', handleClick);
  
      // Replace button with input
      parentElement?.replaceChild(textInput, element);
  
      // Set focus to input
      textInput.focus();
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


// const calculateShift = (udim:number, vdim:number, pos:number):string => {
//   return `${pos*vdim/udim}`
// }

export function handleFullScreen() {
  const view = document.getElementById("slide");
  // const urect = (view as HTMLElement).getBoundingClientRect();
  // const handleFullScreenExit = ()=> {
  //   if (view){
  //     const vrect = view?.getBoundingClientRect();
  //     view.childNodes.forEach((child)=>{
  //       if (child instanceof HTMLElement){
  //         console.log(child.style.left, urect, vrect);
  //         child.style.left = calculateShift(
  //           urect?.width, vrect.width, Number(child.style.left)
  //         );
  //         child.style.top = calculateShift(
  //           urect.height, vrect.height, Number(child.style.top)
  //         );
  //         console.log(child.style.left);
  //       }
  //     })
  //   }
  // }

  if (!document.fullscreenElement ) {
    if (view?.requestFullscreen) {
      view.requestFullscreen();
      // document.addEventListener('fullscreenchange', handleFullScreenExit);
    }
    console.log("fullscrenn");
  }
}

export function mod(a:number, b:number):number {
  return ((a % b) + b) % b;
}
