import { insertCode } from "./component/utility";
import { KSlideSet } from "./frame"

interface ToolsProps {
    handleAddElement: (elemType:string, info?:string)=>void
}


const handleStyleChange = (styName:string, value:string) =>{
    if (KSlideSet.activeEID != null){
        const elemP = KSlideSet.slides[KSlideSet.curFrame].elemProp.get(KSlideSet.activeEID);
        const elem = document.getElementById(`${KSlideSet.activeEID}div`);
        if (elemP && elem){
            elemP.style[styName] = value;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (elem.style as any)[styName] = value;   
        }
    }
}

const handleFontSize = (change: number) => {
    if (KSlideSet.activeEID != null){
        const elem = document.getElementById(`${KSlideSet.activeEID}div`);
        if (elem) {
            const fontSize = window.getComputedStyle(elem).fontSize;
            const newFontSize = parseFloat(fontSize) + change;
            handleStyleChange('fontSize', `${newFontSize}px`);
        }
    }
}

const handleBold = () => {
    if (KSlideSet.activeEID != null){
        const elemP = KSlideSet.slides[KSlideSet.curFrame].elemProp.get(KSlideSet.activeEID);
        if (elemP) {
            const fontWeight = elemP.style['fontWeight'];
            if (fontWeight === 'bold') {
                handleStyleChange('fontWeight', 'normal');
            } else {
                handleStyleChange('fontWeight', 'bold');
            }
        }
    }
}

const handleItalic = () => {
    if (KSlideSet.activeEID != null){
        const elemP = KSlideSet.slides[KSlideSet.curFrame].elemProp.get(KSlideSet.activeEID);
        if (elemP) {
            const fontStyle = elemP.style['fontStyle'];
            if (fontStyle === 'italic') {
                handleStyleChange('fontStyle', 'normal');
            } else {
                handleStyleChange('fontStyle', 'italic');
            }
        }
    }
}
// const handleZIndexChange = () =>{

// }

export const Tools:React.FC<ToolsProps> = ({handleAddElement}) => {
    console.log("rendering tools");
  
    const handleAddImage = (event: React.ChangeEvent<HTMLInputElement>) => {
      console.log("handleAdd Image called");
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const imageDataUrl = reader.result as string; 
          console.log(imageDataUrl);
          handleAddElement('image', imageDataUrl);
        };
        reader.readAsDataURL(file);
      }
    };
    const elementTools = [
        {name:'button', icon:'crop_16_9'},
        {name:'textarea', icon:'edit_note'},
        {name:'latex', icon:'functions'}
    ]
  
    return (
      <div className="toolbar">
        <span>Add Elements</span>
        <div className="toolset">
            {elementTools.map(
                (tool)=>(
                    <label className="tool" onClick={()=>{handleAddElement(tool.name)}}>
                        <i className="material-icons">{tool.icon}</i>
                    </label>
                )
            )}
            <label className="tool">
                <i className="material-icons">image</i>
                <input type="file" accept="image/*" onChange={handleAddImage} style={{ position: 'absolute', left: '-9999px' }} />
            </label>
        </div>
        <span>Element Formatting</span>
        <div className="toolset">
            <div className="tool">
                <i className="material-icons">text_fields</i>
                <select id="font-family" onChange={(e)=>{handleStyleChange('fontFamily', e.target.value)}}>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                </select>
            </div>
            <label className="tool" onClick={()=>{handleFontSize(5)}}>
                <i className="material-icons">text_increase</i>
            </label>
            <label className="tool" onClick={()=>{handleFontSize(-5)}}>
                <i className="material-icons">text_decrease</i>
            </label>
            <label className="tool" onClick={handleBold}>
                <i className="material-icons">format_bold</i>
            </label>
            <label className="tool" onClick={handleItalic}>
                <i className="material-icons">format_italic</i>
            </label>
            {/* <div>
                <label htmlFor="z-index">Z-Index:</label>
                <input type="number" id="z-index" onChange={handleZIndexChange} />
            </div> */}
            <label className="tool">
                <i className="material-icons">format_color_text</i>
                <input type="color" id="text-color" onChange={(e)=>{handleStyleChange('color', e.target.value)}} />
            </label>
            <label className="tool">
                <i className="material-icons">format_color_fill</i>
                <input type="color" id="background-color" onChange={(e)=>{handleStyleChange('background', e.target.value)}} />
            </label>
        </div>
        <span>Slide Formatting</span>
        <div className="toolset">
            <label className="tool">
                <i className="material-icons">palette</i>
                <input type="color" id="background-color" onChange={(e)=>{KSlideSet.slideBG.transition(KSlideSet.curFrame, e.target.value)}} />
            </label>
        </div>
        <span>Add CSS/JS</span>
        <div className='toolset'>
            <textarea name="code" id="code" cols={20} rows={30}></textarea>
            <label className="tool" onClick={()=>{insertCode('style')}}>CSS</label>
            <label className="tool" onClick={()=>{insertCode('script')}}>JS</label>
        </div>
        {/* <span>{KSlideSet.activeEID}</span> */}
      </div>
    )
  }