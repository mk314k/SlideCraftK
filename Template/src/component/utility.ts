
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
          element.innerHTML = ltx ? tex2mml(textInput.value) : textInput.value;
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
