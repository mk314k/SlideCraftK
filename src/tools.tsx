import { KSlideSet } from "./frame"

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
const handleFontSizeChange = (e:React.ChangeEvent<HTMLInputElement>) =>{
    const elem = document.getElementById(`${KSlideSet.activeEID}div`);
    if (elem){
        console.log(elem.style.fontSize);
        elem.style.fontSize = e.target.value+'em';
        console.log(elem.style.fontSize);
    }

}
const handleZIndexChange = () =>{

}

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
  
    return (
      <div className="toolbar">
        <span>Add Elements</span>
        <div>
            <button className="tool" onClick={()=>handleAddElement('button')}>
                Button
            </button>
            <button className="tool" onClick={()=>handleAddElement('textarea')}>
                TextArea
            </button>
            <button className="tool" onClick={()=>handleAddElement('latex')}>
                Latex
            </button>
            <label className="tool" style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#007bff', color: '#fff', borderRadius: '4px' }}>
                Image
                <input type="file" accept="image/*" onChange={handleAddImage} style={{ position: 'absolute', left: '-9999px' }} />
            </label>
        </div>
        <span>Formatting</span>
        <div>
            <div>
                <label htmlFor="font-family">Font Family:</label>
                <select id="font-family" onChange={handleFontFamilyChange}>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    {/* Add more font options here */}
                </select>
            </div>
            <div>
                <label htmlFor="font-size">Font Size:</label>
                <input type="number" id="font-size" onChange={(e)=>{handleStyleChange(e, handleFontSizeChange, 'font-size')}} />
            </div>
            <div>
                <label htmlFor="z-index">Z-Index:</label>
                <input type="number" id="z-index" onChange={handleZIndexChange} />
            </div>
            
        </div>
          
      </div>
    )
  }