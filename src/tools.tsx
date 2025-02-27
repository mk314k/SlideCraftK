import React from "react";
import { applySlideCustomCode } from "./component/utility";
import { useDeck } from "./context/DeckContext";

interface ToolsProps {
    handleAddElement: (elemType:string, info?:string)=>void
}

export const Tools:React.FC<ToolsProps> = ({handleAddElement}) => {
    console.log("rendering tools");
    const { state, currentSlide, updateElementStyle, setSlideBackground, setSlideCustomCode } = useDeck();

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

    const getElementZ = (zRaw?: string) => {
        const parsed = parseInt(zRaw ?? '1', 10);
        return Number.isFinite(parsed) ? parsed : 1;
    };

    const handleZIndexStep = (delta: number) => {
        if (state.activeEID != null && activeElem) {
            const nextZ = Math.max(0, getElementZ(activeElem.style['zIndex']) + delta);
            handleStyleChange('zIndex', String(nextZ));
        }
    };

    const handleBringToFront = () => {
        if (state.activeEID != null && activeElem) {
            const maxZ = currentSlide.elements.reduce(
                (acc, el) => Math.max(acc, getElementZ(el.style['zIndex'])),
                1
            );
            handleStyleChange('zIndex', String(maxZ + 1));
        }
    };

    const handleSendToBack = () => {
        if (state.activeEID != null && activeElem) {
            handleStyleChange('zIndex', '0');
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
        {name:'markdown', icon:'article'},
        {name:'latex', icon:'functions'},
        {name:'code', icon:'code'},
        {name:'rect', icon:'check_box_outline_blank'},
        {name:'circle', icon:'radio_button_unchecked'},
        {name:'arrow', icon:'trending_flat'},
        {name:'line', icon:'horizontal_rule'}
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
                <select
                    id="font-family"
                    value={activeElem?.style['fontFamily'] ?? 'Arial'}
                    disabled={!activeElem}
                    onChange={(e)=>{handleStyleChange('fontFamily', e.target.value)}}
                >
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
            <label
                className={`tool${activeElem?.style['fontWeight'] === 'bold' ? ' tool-active' : ''}`}
                onClick={handleBold}
            >
                <i className="material-icons">format_bold</i>
            </label>
            <label
                className={`tool${activeElem?.style['fontStyle'] === 'italic' ? ' tool-active' : ''}`}
                onClick={handleItalic}
            >
                <i className="material-icons">format_italic</i>
            </label>
            <label className="tool">
                <i className="material-icons">format_color_text</i>
                <input
                    type="color"
                    id="text-color"
                    value={activeElem?.style['color']?.startsWith('#') ? activeElem.style['color'] : '#000000'}
                    disabled={!activeElem}
                    onChange={(e)=>{handleStyleChange('color', e.target.value)}}
                />
            </label>
            <label className="tool">
                <i className="material-icons">format_color_fill</i>
                <input
                    type="color"
                    id="element-bg-color"
                    value={activeElem?.style['background']?.startsWith('#') ? activeElem.style['background'] : '#e6ccc4'}
                    disabled={!activeElem}
                    onChange={(e)=>{handleStyleChange('background', e.target.value)}}
                />
            </label>
            <label className="tool" title="Bring Forward" onClick={() => handleZIndexStep(1)}>
                <i className="material-icons">flip_to_front</i>
            </label>
            <label className="tool" title="Send Backward" onClick={() => handleZIndexStep(-1)}>
                <i className="material-icons">flip_to_back</i>
            </label>
            <label className="tool" title="Bring to Front" onClick={handleBringToFront}>
                <i className="material-icons">vertical_align_top</i>
            </label>
            <label className="tool" title="Send to Back" onClick={handleSendToBack}>
                <i className="material-icons">vertical_align_bottom</i>
            </label>
        </div>
        <span>Slide Formatting</span>
        <div className="toolset">
            <label className="tool">
                <i className="material-icons">palette</i>
                <input
                    type="color"
                    id="slide-bg-color"
                    value={currentSlide.background.startsWith('#') ? currentSlide.background : '#f0ffff'}
                    onChange={(e)=>{setSlideBackground(e.target.value)}}
                />
            </label>
        </div>
        <span>Add CSS/JS</span>
        <div className='toolset'>
            <textarea
                name="code"
                id="code"
                cols={20}
                rows={20}
                defaultValue={currentSlide.customJs || currentSlide.customCss}
                key={`code-slide-${state.curFrame}`}
            />
            <label
                className="tool"
                onClick={() => {
                    const val = (document.getElementById('code') as HTMLTextAreaElement | null)?.value ?? '';
                    setSlideCustomCode('style', val);
                    applySlideCustomCode(state.curFrame, val, '');
                }}
            >
                CSS
            </label>
            <label
                className="tool"
                onClick={() => {
                    const val = (document.getElementById('code') as HTMLTextAreaElement | null)?.value ?? '';
                    setSlideCustomCode('script', val);
                    applySlideCustomCode(state.curFrame, currentSlide.customCss, val);
                }}
            >
                JS
            </label>
        </div>
      </div>
    )
  }
