import React from "react";
import { applySlideCustomCode } from "./component/utility";
import { useDeck } from "./context/DeckContext";
import { SlideTransitionType } from "./frame";

interface ToolsProps {
    handleAddElement: (elemType:string, info?:string)=>void
}

export const Tools:React.FC<ToolsProps> = ({handleAddElement}) => {
    console.log("rendering tools");
    const { state, currentSlide, updateElement, updateElementStyle, setSlideBackground, setSlideTransition, setSlideCustomCode } = useDeck();

    const activeElem = state.activeEID != null
        ? currentSlide.elements.find((el) => el.id === state.activeEID)
        : undefined;

    const elemType = activeElem?.name;
    const isTextType = elemType === 'button' || elemType === 'textarea' || elemType === 'markdown' || elemType === 'code' || elemType === 'callout' || elemType === 'table';
    const isLatexType = elemType === 'latex';
    const isShapeType = elemType === 'rect' || elemType === 'circle' || elemType === 'diamond' || elemType === 'triangle' || elemType === 'arrow' || elemType === 'line';
    const isFilledShape = elemType === 'rect' || elemType === 'circle' || elemType === 'diamond' || elemType === 'triangle';

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

    const handleUnderline = () => {
        if (state.activeEID != null && activeElem) {
            const textDec = activeElem.style['textDecoration'];
            handleStyleChange('textDecoration', textDec === 'underline' ? 'none' : 'underline');
        }
    };

    const handleTextAlign = (align: 'left' | 'center' | 'right') => {
        if (state.activeEID != null && activeElem) {
            handleStyleChange('textAlign', align);
            const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
            handleStyleChange('justifyContent', justify);
        }
    };

    const handleShadowToggle = () => {
        if (state.activeEID != null && activeElem) {
            const hasShadow = Boolean(activeElem.style['boxShadow'] && activeElem.style['boxShadow'] !== 'none');
            handleStyleChange(
                'boxShadow',
                hasShadow ? 'none' : '0 8px 20px rgba(60, 42, 26, 0.16)'
            );
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
        {name:'button', icon:'crop_16_9', label:'Add Button'},
        {name:'textarea', icon:'edit_note', label:'Add Text Area'},
        {name:'markdown', icon:'article', label:'Add Markdown Block'},
        {name:'callout', icon:'lightbulb', label:'Add Callout Card'},
        {name:'table', icon:'table_chart', label:'Add Data Table'},
        {name:'latex', icon:'functions', label:'Add LaTeX Math'},
        {name:'code', icon:'code', label:'Add Code Block'},
        {name:'rect', icon:'check_box_outline_blank', label:'Add Rectangle'},
        {name:'circle', icon:'radio_button_unchecked', label:'Add Circle'},
        {name:'diamond', icon:'crop_rotate', label:'Add Diamond'},
        {name:'triangle', icon:'change_history', label:'Add Triangle'},
        {name:'arrow', icon:'trending_flat', label:'Add Arrow'},
        {name:'line', icon:'horizontal_rule', label:'Add Line'}
    ]
  
    return (
      <div className="toolbar">
        <span>Add Elements</span>
        <div className="toolset">
            {elementTools.map(
                (tool)=>(
                    <label
                        key={tool.name}
                        className="tool"
                        title={tool.label}
                        aria-label={tool.label}
                        onClick={()=>{handleAddElement(tool.name)}}
                    >
                        <i className="material-icons">{tool.icon}</i>
                    </label>
                )
            )}
            <label className="tool" title="Upload Image" aria-label="Upload Image">
                <i className="material-icons">image</i>
                <input type="file" accept="image/*" onChange={handleAddImage} style={{ position: 'absolute', left: '-9999px' }} />
            </label>
        </div>
        <span>Element Formatting</span>
        <div className="toolset">
            {!activeElem && (
                <span className="tool-empty-hint">Select an element to format</span>
            )}
            {activeElem && isTextType && (
                <>
                    <div className="tool" title="Font Family">
                        <i className="material-icons">text_fields</i>
                        <select
                            id="font-family"
                            value={activeElem.style['fontFamily'] ?? 'Arial'}
                            onChange={(e)=>{handleStyleChange('fontFamily', e.target.value)}}
                        >
                            <option value="Arial">Arial</option>
                            <option value="Helvetica">Helvetica</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="monospace">Monospace</option>
                        </select>
                    </div>
                    <label
                        className={`tool${activeElem.style['fontWeight'] === 'bold' ? ' tool-active' : ''}`}
                        title="Toggle Bold"
                        aria-label="Toggle Bold"
                        onClick={handleBold}
                    >
                        <i className="material-icons">format_bold</i>
                    </label>
                    <label
                        className={`tool${activeElem.style['fontStyle'] === 'italic' ? ' tool-active' : ''}`}
                        title="Toggle Italic"
                        aria-label="Toggle Italic"
                        onClick={handleItalic}
                    >
                        <i className="material-icons">format_italic</i>
                    </label>
                    <label
                        className={`tool${activeElem.style['textDecoration'] === 'underline' ? ' tool-active' : ''}`}
                        title="Toggle Underline"
                        aria-label="Toggle Underline"
                        onClick={handleUnderline}
                    >
                        <i className="material-icons">format_underlined</i>
                    </label>
                    <label
                        className={`tool${activeElem.style['textAlign'] === 'left' ? ' tool-active' : ''}`}
                        title="Align Left"
                        aria-label="Align Left"
                        onClick={() => handleTextAlign('left')}
                    >
                        <i className="material-icons">format_align_left</i>
                    </label>
                    <label
                        className={`tool${(!activeElem.style['textAlign'] || activeElem.style['textAlign'] === 'center') ? ' tool-active' : ''}`}
                        title="Align Center"
                        aria-label="Align Center"
                        onClick={() => handleTextAlign('center')}
                    >
                        <i className="material-icons">format_align_center</i>
                    </label>
                    <label
                        className={`tool${activeElem.style['textAlign'] === 'right' ? ' tool-active' : ''}`}
                        title="Align Right"
                        aria-label="Align Right"
                        onClick={() => handleTextAlign('right')}
                    >
                        <i className="material-icons">format_align_right</i>
                    </label>
                    <label
                        className={`tool${activeElem.style['boxShadow'] && activeElem.style['boxShadow'] !== 'none' ? ' tool-active' : ''}`}
                        title="Toggle Card Drop Shadow"
                        aria-label="Toggle Drop Shadow"
                        onClick={handleShadowToggle}
                    >
                        <i className="material-icons">layers</i>
                    </label>
                </>
            )}
            {activeElem && (isTextType || isLatexType) && (
                <>
                    <label className="tool" title="Increase Size" aria-label="Increase Size" onClick={()=>{handleFontSize(4)}}>
                        <i className="material-icons">text_increase</i>
                    </label>
                    <label className="tool" title="Decrease Size" aria-label="Decrease Size" onClick={()=>{handleFontSize(-4)}}>
                        <i className="material-icons">text_decrease</i>
                    </label>
                    <label className="tool" title="Text Color" aria-label="Text Color">
                        <i className="material-icons">format_color_text</i>
                        <input
                            type="color"
                            id="text-color"
                            value={activeElem.style['color']?.startsWith('#') ? activeElem.style['color'] : '#2c241d'}
                            onChange={(e)=>{handleStyleChange('color', e.target.value)}}
                        />
                    </label>
                    <label className="tool" title="Background Color" aria-label="Background Color">
                        <i className="material-icons">format_color_fill</i>
                        <input
                            type="color"
                            id="element-bg-color"
                            value={activeElem.style['background']?.startsWith('#') ? activeElem.style['background'] : '#fbf8f3'}
                            onChange={(e)=>{handleStyleChange('background', e.target.value)}}
                        />
                    </label>
                </>
            )}
            {activeElem && isShapeType && (
                <>
                    <label className="tool" title="Line / Stroke Color" aria-label="Line Color">
                        <i className="material-icons">border_color</i>
                        <span className="tool-inline-label">Line</span>
                        <input
                            type="color"
                            id="shape-line-color"
                            value={activeElem.style['color']?.startsWith('#') ? activeElem.style['color'] : '#7c3f23'}
                            onChange={(e)=>{handleStyleChange('color', e.target.value)}}
                        />
                    </label>
                    {isFilledShape && (
                        <>
                            <label className="tool" title="Shape Fill Color" aria-label="Fill Color">
                                <i className="material-icons">format_color_fill</i>
                                <span className="tool-inline-label">Fill</span>
                                <input
                                    type="color"
                                    id="shape-fill-color"
                                    value={activeElem.style['background']?.startsWith('#') ? activeElem.style['background'] : '#f2e8dc'}
                                    onChange={(e)=>{handleStyleChange('background', e.target.value)}}
                                />
                            </label>
                            <label
                                className={`tool${activeElem.style['background'] === 'transparent' ? ' tool-active' : ''}`}
                                title="Toggle Transparent Fill (Outline Only)"
                                onClick={() =>
                                    handleStyleChange(
                                        'background',
                                        activeElem.style['background'] === 'transparent' ? '#f2e8dc' : 'transparent'
                                    )
                                }
                            >
                                <span className="tool-inline-label">No Fill</span>
                            </label>
                        </>
                    )}
                    <div className="tool" title="Stroke Width">
                        <span className="tool-inline-label">Width</span>
                        <input
                            type="number"
                            min={1}
                            max={16}
                            style={{ width: '44px' }}
                            value={parseFloat(activeElem.style['strokeWidth'] ?? '4') || 4}
                            onChange={(e) => {
                                const w = Math.max(1, Math.min(16, parseInt(e.target.value, 10) || 4));
                                handleStyleChange('strokeWidth', String(w));
                            }}
                        />
                    </div>
                    <div className="tool" title="Stroke Style">
                        <select
                            value={activeElem.style['strokeDasharray'] ?? 'none'}
                            onChange={(e) => handleStyleChange('strokeDasharray', e.target.value)}
                        >
                            <option value="none">Solid</option>
                            <option value="8,6">Dashed</option>
                            <option value="3,5">Dotted</option>
                        </select>
                    </div>
                </>
            )}
            {activeElem && (
                <>
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
                    <div className="tool">
                        <i className="material-icons" title="Animation Step (0 = always visible)">animation</i>
                        <input
                            type="number"
                            min={0}
                            max={20}
                            style={{ width: '48px' }}
                            value={activeElem.step ?? 0}
                            onChange={(e) => {
                                if (state.activeEID != null) {
                                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                    updateElement(state.activeEID, (el) => {
                                        el.step = val;
                                    });
                                }
                            }}
                        />
                    </div>
                </>
            )}
        </div>
        <span>Slide Formatting</span>
        <div className="toolset">
            <label className="tool" title="Custom Slide Color">
                <i className="material-icons">palette</i>
                <input
                    type="color"
                    id="slide-bg-color"
                    value={currentSlide.background.startsWith('#') ? currentSlide.background : '#faf6ef'}
                    onChange={(e)=>{setSlideBackground(e.target.value)}}
                />
            </label>
            <div className="slide-bg-swatches">
                {[
                    { label: 'Warm Cream', value: '#faf6ef' },
                    { label: 'Oatmeal', value: '#f2e8dc' },
                    { label: 'Sage Mist', value: '#eef3ec' },
                    { label: 'Soft Amber', value: '#fdf6e7' },
                    { label: 'Sunset Gradient', value: 'linear-gradient(135deg, #faf6ef 0%, #f2dfd0 100%)' },
                ].map((preset) => (
                    <button
                        key={preset.label}
                        type="button"
                        className="bg-swatch-btn"
                        title={preset.label}
                        style={{ background: preset.value }}
                        onClick={() => setSlideBackground(preset.value)}
                    />
                ))}
            </div>
            <div className="tool">
                <i className="material-icons" title="Slide Transition">slideshow</i>
                <select
                    value={currentSlide.transition ?? 'fade'}
                    onChange={(e) => setSlideTransition(e.target.value as SlideTransitionType)}
                >
                    <option value="none">None</option>
                    <option value="fade">Fade</option>
                    <option value="slide">Slide</option>
                </select>
            </div>
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
