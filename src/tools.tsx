import React from "react";
import { insertCode } from "./component/utility";
import { useDeck } from "./context/DeckContext";

interface ToolsProps {
    handleAddElement: (elemType:string, info?:string)=>void
}

export const Tools:React.FC<ToolsProps> = ({handleAddElement}) => {
    console.log("rendering tools");
    const { state, currentSlide, updateElementStyle, setSlideBackground } = useDeck();

    const activeElem = state.activeEID != null
        ? currentSlide.elements.find((el) => el.id === state.activeEID)
        : undefined;

    const handleStyleChange = (styName: string, value: string) => {
        if (state.activeEID != null) {
            updateElementStyle(state.activeEID, styName, value);
        }
    };

    const handleFontSize = (change: number) => {
        if (state.activeEID != null && activeElem) {
            const currentRaw = activeElem.style['fontSize'] ?? '16px';
            const parsed = parseFloat(currentRaw);
            const baseSize = Number.isFinite(parsed) ? parsed : 16;
            const newFontSize = Math.max(8, baseSize + change);
            handleStyleChange('fontSize', `${newFontSize}px`);
        }
    };

    const handleBold = () => {
        if (state.activeEID != null && activeElem) {
            const fontWeight = activeElem.style['fontWeight'];
            handleStyleChange('fontWeight', fontWeight === 'bold' ? 'normal' : 'bold');
        }
    };

    const handleItalic = () => {
        if (state.activeEID != null && activeElem) {
            const fontStyle = activeElem.style['fontStyle'];
            handleStyleChange('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic');
        }
    };

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
        event.target.value = '';
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
                    <label key={tool.name} className="tool" onClick={()=>{handleAddElement(tool.name)}}>
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
            <label className="tool">
                <i className="material-icons">format_color_text</i>
                <input type="color" id="text-color" onChange={(e)=>{handleStyleChange('color', e.target.value)}} />
            </label>
            <label className="tool">
                <i className="material-icons">format_color_fill</i>
                <input type="color" id="element-bg-color" onChange={(e)=>{handleStyleChange('background', e.target.value)}} />
            </label>
        </div>
        <span>Slide Formatting</span>
        <div className="toolset">
            <label className="tool">
                <i className="material-icons">palette</i>
                <input type="color" id="slide-bg-color" onChange={(e)=>{setSlideBackground(e.target.value)}} />
            </label>
        </div>
        <span>Add CSS/JS</span>
        <div className='toolset'>
            <textarea name="code" id="code" cols={20} rows={20}></textarea>
            <label className="tool" onClick={()=>{insertCode('style')}}>CSS</label>
            <label className="tool" onClick={()=>{insertCode('script')}}>JS</label>
        </div>
      </div>
    )
  }
