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
          KSlideSet.slides[KSlideSet.curFrame].elemProp[id].inner = innerData;
          parentElement?.replaceChild(element, textInput);
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

export function toggleFullscreen() {
  const elem = document.getElementById("slide");

  if (!document.fullscreenElement ) {
    if (elem?.requestFullscreen) {
      elem.requestFullscreen();
    }
    // document.addEventListener(onkeydown)
    console.log("fullscrenn");
  }
}

export function mod(a:number, b:number):number {
  return ((a % b) + b) % b;
}
