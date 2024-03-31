import { insertCode } from "./component/utility";
import { KSlideSet } from "./frame"
import { globalVar } from 'statebinderk';

const slideBGColr = new globalVar('red');
slideBGColr.addBinding(
  'slide',
  (slide:HTMLElement, v:string)=>{
    slide.style.background = v;
  }
)

interface ToolsProps {
    handleAddElement: (elemType:string, info?:string)=>void
}
const handleStyleChange = (e:React.ChangeEvent<HTMLInputElement>, funct:CallableFunction, styName:string) => {
    if (KSlideSet.activeEID != null){
        const elemP = KSlideSet.slides[KSlideSet.curFrame].elemProp.get(KSlideSet.activeEID);
        if (elemP){
            elemP.style[styName] = e.target.value;
        }
    }
    funct(e);
}

const handleFontFamilyChange = () =>{

}
// const handleFontSizeChange = (e:React.ChangeEvent<HTMLInputElement>) =>{
//     const elem = document.getElementById(`${KSlideSet.activeEID}div`);
//     if (elem){
//         console.log(elem.style.fontSize);
//         elem.style.fontSize = e.target.value+'em';
//         console.log(elem.style.fontSize);
//     }
// }

const handleBgColorChange = () =>{

}
const handleTextColorChange = (e:React.ChangeEvent<HTMLInputElement>) =>{
    console.log(e.target.value)
    const elem = document.getElementById(`${KSlideSet.activeEID}div`);
    if (elem){
        elem.style.color = e.target.value;
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
          const imageDataUrl = reader.result as string; // Cast to string
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
                <select id="font-family" onChange={handleFontFamilyChange}>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                </select>
            </div>
            <label className="tool">
                <i className="material-icons">text_increase</i>
            </label>
            <label className="tool">
                <i className="material-icons">text_decrease</i>
            </label>
            <label className="tool">
                <i className="material-icons">format_bold</i>
            </label>
            <label className="tool">
                <i className="material-icons">format_italic</i>
            </label>
            {/* <div>
                <label htmlFor="z-index">Z-Index:</label>
                <input type="number" id="z-index" onChange={handleZIndexChange} />
            </div> */}
            <label className="tool">
                <i className="material-icons">format_color_text</i>
                <input type="color" id="text-color" onChange={(e)=>{handleStyleChange(e, handleTextColorChange, 'color')}} />
            </label>
            <label className="tool">
                <i className="material-icons">format_color_fill</i>
                <input type="color" id="background-color" onChange={(e)=>{handleStyleChange(e, handleBgColorChange, 'background-color')}} />
            </label>
        </div>
        <span>Slide Formatting</span>
        <div className="toolset">
            <label className="tool">
                <i className="material-icons">palette</i>
                <input type="color" id="background-color" onChange={(e)=>{slideBGColr.transition(e.target.value)}} />
            </label>
        </div>
        <span>Add CSS/JS</span>
        <div className='toolset'>
            <textarea name="code" id="code" cols={20} rows={30}></textarea>
            <label className="tool" onClick={()=>{insertCode('style')}}>CSS</label>
            <label className="tool" onClick={()=>{insertCode('script')}}>JS</label>
        </div>
      </div>
    )
  }