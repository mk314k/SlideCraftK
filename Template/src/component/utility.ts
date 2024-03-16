import { KSlideSet } from "../frame";

export const defaultSV = {x:0, y:0, width:100, height:100};
export type SV = typeof defaultSV;
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