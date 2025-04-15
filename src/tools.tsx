import React from "react";
import { useDeck } from "./context/DeckContext";
import { SlideTransitionType } from "./frame";

interface ToolsProps {
    handleAddElement: (elemType:string, info?:string)=>void
}

export const Tools:React.FC<ToolsProps> = ({handleAddElement}) => {
    const { currentSlide, setSlideBackground, setSlideTransition } = useDeck();

    const handleAddImage = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const imageDataUrl = reader.result as string; 
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
        {name:'quote', icon:'format_quote', label:'Add Quote Block'},
        {name:'stat', icon:'analytics', label:'Add Metric / KPI Card'},
        {name:'badge', icon:'label', label:'Add Tag Badge'},
        {name:'chart', icon:'bar_chart', label:'Add Bar Chart'},
        {name:'table', icon:'table_chart', label:'Add Data Table'},
        {name:'latex', icon:'functions', label:'Add LaTeX Math'},
        {name:'code', icon:'code', label:'Add Code Block'},
        {name:'rect', icon:'check_box_outline_blank', label:'Add Rectangle'},
        {name:'circle', icon:'radio_button_unchecked', label:'Add Circle'},
        {name:'diamond', icon:'crop_rotate', label:'Add Diamond'},
        {name:'triangle', icon:'change_history', label:'Add Triangle'},
        {name:'arrow', icon:'trending_flat', label:'Add Arrow'},
        {name:'line', icon:'horizontal_rule', label:'Add Line'}
    ];

    return (
      <div className="toolbar">
        <span>Elements</span>
        <div className="toolset toolset-grid">
            {elementTools.map(
                (tool)=>(
                    <label
                        key={tool.name}
                        className="tool"
                        data-tooltip={tool.label}
                        title={tool.label}
                        aria-label={tool.label}
                        onClick={()=>{handleAddElement(tool.name)}}
                    >
                        <i className="material-icons">{tool.icon}</i>
                    </label>
                )
            )}
            <label className="tool" data-tooltip="Upload Image" title="Upload Image" aria-label="Upload Image">
                <i className="material-icons">image</i>
                <input type="file" accept="image/*" onChange={handleAddImage} style={{ position: 'absolute', left: '-9999px' }} />
            </label>
        </div>

        <span>Slide Background</span>
        <div className="toolset">
            <label className="tool" data-tooltip="Custom Slide Background Color" title="Custom Slide Color">
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
                        data-tooltip={preset.label}
                        title={preset.label}
                        style={{ background: preset.value }}
                        onClick={() => setSlideBackground(preset.value)}
                    />
                ))}
            </div>
        </div>

        <span>Slide Transition</span>
        <div className="toolset">
            <div className="tool tool-full" data-tooltip="Slide Transition Effect">
                <i className="material-icons" title="Slide Transition">slideshow</i>
                <select
                    value={currentSlide.transition ?? 'fade'}
                    onChange={(e) => setSlideTransition(e.target.value as SlideTransitionType)}
                >
                    <option value="none">None</option>
                    <option value="fade">Cross Fade</option>
                    <option value="slide">Slide Left</option>
                    <option value="rise">Rise Up</option>
                    <option value="zoom">Zoom Scale</option>
                    <option value="flip">3D Flip</option>
                </select>
            </div>
        </div>
      </div>
    );
};
