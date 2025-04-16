import React from "react";
import { useDeck } from "./context/DeckContext";
import { SlideTransitionType } from "./frame";

interface ToolsProps {
    handleAddElement: (elemType:string, info?:string)=>void
}

const ShapeToolIcon: React.FC<{ name: string }> = ({ name }) => {
    const svgProps = {
        width: 20,
        height: 20,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    };

    switch (name) {
        case 'rect':
            return (
                <svg {...svgProps}>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                </svg>
            );
        case 'circle':
            return (
                <svg {...svgProps}>
                    <circle cx="12" cy="12" r="8.5" />
                </svg>
            );
        case 'diamond':
            return (
                <svg {...svgProps}>
                    <polygon points="12,2.5 21.5,12 12,21.5 2.5,12" />
                </svg>
            );
        case 'triangle':
            return (
                <svg {...svgProps}>
                    <polygon points="12,3.5 21,20 3,20" />
                </svg>
            );
        case 'hexagon':
            return (
                <svg {...svgProps}>
                    <polygon points="7,3.5 17,3.5 22,12 17,20.5 7,20.5 2,12" />
                </svg>
            );
        case 'parallelogram':
            return (
                <svg {...svgProps}>
                    <polygon points="6.5,5 21.5,5 17.5,19 2.5,19" />
                </svg>
            );
        case 'database':
            return (
                <svg {...svgProps}>
                    <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
                    <path d="M4.5,5.5 v13 c0,1.66 3.36,3 7.5,3 s7.5,-1.34 7.5,-3 v-13" />
                    <path d="M4.5,12 c0,1.66 3.36,3 7.5,3 s7.5,-1.34 7.5,-3" />
                </svg>
            );
        case 'server':
            return (
                <svg {...svgProps}>
                    <rect x="3" y="3.5" width="18" height="5" rx="1" />
                    <circle cx="6.5" cy="6" r="0.8" fill="currentColor" />
                    <rect x="3" y="9.5" width="18" height="5" rx="1" />
                    <circle cx="6.5" cy="12" r="0.8" fill="currentColor" />
                    <rect x="3" y="15.5" width="18" height="5" rx="1" />
                    <circle cx="6.5" cy="18" r="0.8" fill="currentColor" />
                </svg>
            );
        case 'cloud':
            return (
                <svg {...svgProps}>
                    <path d="M6.5,19 h11 a4.5,4.5 0 0 0 0.8,-8.92 a5.5,5.5 0 0 0 -10.6,-1.58 a4,4 0 0 0 -1.2,10.5 z" />
                </svg>
            );
        case 'queue':
            return (
                <svg {...svgProps}>
                    <path d="M5,6 h14 a2.5,6 0 0 1 0,12 h-14 a2.5,6 0 0 1 0,-12 z" />
                    <ellipse cx="19" cy="12" rx="2.5" ry="6" />
                </svg>
            );
        case 'arrow':
            return (
                <svg {...svgProps}>
                    <line x1="3" y1="12" x2="19" y2="12" />
                    <polyline points="14,7 20,12 14,17" />
                </svg>
            );
        case 'line':
            return (
                <svg {...svgProps}>
                    <line x1="3" y1="12" x2="21" y2="12" />
                </svg>
            );
        default:
            return null;
    }
};

export const Tools:React.FC<ToolsProps> = ({handleAddElement}) => {
    const { currentSlide, setSlideBackground, setSlideTransition, setSlideTransitionDuration } = useDeck();

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

    const contentTools = [
        {name:'button', icon:'smart_button', label:'Add Button'},
        {name:'textarea', icon:'notes', label:'Add Text Area'},
        {name:'markdown', icon:'article', label:'Add Markdown Block'},
        {name:'callout', icon:'lightbulb', label:'Add Callout Card'},
        {name:'quote', icon:'format_quote', label:'Add Quote Block'},
        {name:'stat', icon:'Leaderboard', fallbackIcon:'equalizer', label:'Add Metric / KPI Card'},
        {name:'badge', icon:'label', label:'Add Tag Badge'},
        {name:'chart', icon:'bar_chart', label:'Add Bar Chart'},
        {name:'table', icon:'table_chart', label:'Add Data Table'},
        {name:'latex', icon:'functions', label:'Add LaTeX Math'},
        {name:'code', icon:'code', label:'Add Code Block'},
    ];

    const archShapeTools = [
        {name:'rect', label:'Add Rectangle'},
        {name:'circle', label:'Add Circle'},
        {name:'diamond', label:'Add Decision Diamond'},
        {name:'triangle', label:'Add Triangle'},
        {name:'hexagon', label:'Add Microservice Hexagon'},
        {name:'parallelogram', label:'Add I/O Parallelogram'},
        {name:'database', label:'Add Database Cylinder'},
        {name:'server', label:'Add Server / Compute Rack'},
        {name:'cloud', label:'Add Cloud Node'},
        {name:'queue', label:'Add Message Queue / Bus'},
        {name:'arrow', label:'Add Arrow Connector'},
        {name:'line', label:'Add Line Connector'},
    ];

    return (
      <div className="toolbar">
        <span>Content Blocks</span>
        <div className="toolset toolset-grid">
            {contentTools.map(
                (tool)=>(
                    <label
                        key={tool.name}
                        className="tool"
                        data-tooltip={tool.label}
                        title={tool.label}
                        aria-label={tool.label}
                        onClick={()=>{handleAddElement(tool.name)}}
                    >
                        <i className="material-icons">{tool.fallbackIcon ?? tool.icon}</i>
                    </label>
                )
            )}
            <label className="tool" data-tooltip="Upload Image" title="Upload Image" aria-label="Upload Image">
                <i className="material-icons">image</i>
                <input type="file" accept="image/*" onChange={handleAddImage} style={{ position: 'absolute', left: '-9999px' }} />
            </label>
        </div>

        <span>Architecture &amp; Shapes</span>
        <div className="toolset toolset-grid">
            {archShapeTools.map(
                (tool)=>(
                    <label
                        key={tool.name}
                        className="tool"
                        data-tooltip={tool.label}
                        title={tool.label}
                        aria-label={tool.label}
                        onClick={()=>{handleAddElement(tool.name)}}
                    >
                        <ShapeToolIcon name={tool.name} />
                    </label>
                )
            )}
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
            <label className="inspector-field" style={{ width: '100%' }} data-tooltip="Slide Transition Duration (seconds)">
                <span>Duration (s)</span>
                <input
                    type="number"
                    min={0.1}
                    max={3.0}
                    step={0.05}
                    value={currentSlide.transitionDuration ?? 0.35}
                    onChange={(e) => {
                        const val = Math.min(3.0, Math.max(0.1, parseFloat(e.target.value) || 0.35));
                        setSlideTransitionDuration(val);
                    }}
                />
            </label>
        </div>
      </div>
    );
};
