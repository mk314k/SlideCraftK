import useKElemHook, { ResizeDirection } from "./hook";
import { renderMarkdownToHtml } from "./utility";
import { KSlideSet } from "../frame";
import { useDeck } from "../context/DeckContext";
import { KatexRenderer, renderKatexWithStatus } from "../katexComponent";
import React, { useState, useCallback } from "react";

const RESIZE_DIRECTIONS: ResizeDirection[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export interface KElementContainerProps {
    eid: number;
    childNode: React.ReactNode;
}

export interface KElementProps {
    eid: number;
    info?: string;
}

const SHAPE_TYPES = new Set(['rect', 'circle', 'arrow', 'line', 'diamond', 'triangle']);

const ELEMENT_TYPE_LABELS: Record<string, string> = {
    button: 'Button (double-click to edit)',
    textarea: 'Text Area',
    markdown: 'Markdown Block (double-click to edit)',
    callout: 'Callout Card (double-click to edit)',
    table: 'Data Table (double-click to edit)',
    latex: 'LaTeX Equation (double-click to edit)',
    code: 'Code Block (double-click to edit)',
    rect: 'Rectangle Shape',
    circle: 'Circle Shape',
    diamond: 'Diamond Shape',
    triangle: 'Triangle Shape',
    arrow: 'Arrow Connector',
    line: 'Line Connector',
    image: 'Image Element',
};

const KElement: React.FC<KElementContainerProps> = ({ eid, childNode }) => {
    console.log("rendering KElement");
    const { style, handleMouseDown, handleResizeStart, handleRotateStart } = useKElemHook(eid);
    const { state, currentSlide, updateElement, deleteElement, setActiveEID } = useDeck();
    const elemState = currentSlide.elements.find((el) => el.id === eid);
    const elemType = elemState?.name ?? KSlideSet.slides[KSlideSet.curFrame].get(eid).name;
    const isShape = SHAPE_TYPES.has(elemType);
    const rawStyle = elemState?.style ?? KSlideSet.slides[KSlideSet.curFrame].get(eid).style;
    const containerStyle: Record<string, string | undefined> = { ...rawStyle };
    if (isShape || elemType === 'image') {
        delete containerStyle.background;
        delete containerStyle.strokeWidth;
        delete containerStyle.strokeDasharray;
    }
    const defaultBg = isShape || elemType === 'image' || elemType === 'latex'
        ? 'transparent'
        : 'var(--surface)';
    const elemStep = elemState?.step ?? 0;
    const elemAnim = elemState?.animation ?? 'fade-in';
    const isHiddenFragment = state.presenting && elemStep > state.presentStep;
    const elemBadgeLabel = ELEMENT_TYPE_LABELS[elemType] ?? elemType;

    const handleDelete = useCallback(() => {
        console.log("handleDelete called");
        if (!state.editingMode && !KSlideSet.editingMode) {
            deleteElement(eid);
        }
    }, [eid, state.editingMode, deleteElement]);

    const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        console.log("onkeydown called");
        if (state.editingMode || KSlideSet.editingMode) {
            return;
        }
        const step = event.shiftKey ? 10 : 1;
        switch (event.key) {
            case 'Delete':
            case 'Backspace':
            case 'Escape':
                handleDelete();
                break;
            case 'ArrowUp':
                event.preventDefault();
                updateElement(eid, (el) => { el.y -= step; });
                break;
            case 'ArrowDown':
                event.preventDefault();
                updateElement(eid, (el) => { el.y += step; });
                break;
            case 'ArrowLeft':
                event.preventDefault();
                updateElement(eid, (el) => { el.x -= step; });
                break;
            case 'ArrowRight':
                event.preventDefault();
                updateElement(eid, (el) => { el.x += step; });
                break;
            default:
                break;
        }
    }, [eid, handleDelete, state.editingMode, updateElement]);

    const posx = style.x;
    const posy = style.y;
    const isActive = !state.presenting && state.activeEID === eid;

    return (
        <div
            id={`${eid}div`}
            key={eid}
            data-elem-label={!state.presenting ? `${elemBadgeLabel} (#${eid})` : undefined}
            className={`element-container elem-anim-${elemAnim}${isActive ? ' active-element' : ''}${isHiddenFragment ? ' fragment-hidden' : ' fragment-visible'}`}
            style={{
                position: 'absolute',
                left: `${posx}px`,
                top: `${posy}px`,
                width: style.width,
                height: style.height,
                transform: style.rotation ? `rotate(${style.rotation}deg)` : undefined,
                background: defaultBg,
                cursor: state.presenting ? 'default' : style.cursor,
                ...containerStyle
            }}
            onMouseDown={e => { if (!state.presenting) { setActiveEID(eid); handleMouseDown(e); } }}
            onClick={(e)=>{ if (!state.presenting) { setActiveEID(eid); e.stopPropagation(); } }}
            onKeyDown={onKeyDown}
            tabIndex={0}
        >
            {childNode}
            {isActive && !state.editingMode && (
                <>
                    <div
                        className="rotate-handle"
                        title="Rotate (hold Shift for 15° steps)"
                        onMouseDown={handleRotateStart}
                    />
                    {RESIZE_DIRECTIONS.map((dir) => (
                        <div
                            key={dir}
                            className={`resize-handle resize-handle-${dir}`}
                            onMouseDown={(e) => handleResizeStart(dir, e)}
                        />
                    ))}
                </>
            )}
        </div>
    );
};

const createKElementComponent = (Component: React.ElementType, mode?: string) => {
    return ({ eid, info }: KElementProps) => {
        const { currentSlide, updateElement, setEditingMode } = useDeck();
        const elemState = currentSlide.elements.find((el) => el.id === eid);
        const content = elemState?.inner ?? info ?? KSlideSet.slides[KSlideSet.curFrame].get(eid).inner;
        const [isEditing, setIsEditing] = useState(false);
        const [draftText, setDraftText] = useState(content);

        const startEditing = () => {
            const initialDraft = mode === 'latex' && content === 'latex'
                ? 'E = mc^2'
                : content;
            setDraftText(initialDraft);
            setIsEditing(true);
            setEditingMode(true);
        };

        const commitEdit = () => {
            updateElement(eid, (el) => {
                el.inner = draftText;
            });
            setIsEditing(false);
            setEditingMode(false);
        };

        const cancelEdit = () => {
            setDraftText(content);
            setIsEditing(false);
            setEditingMode(false);
        };

        if (Component === 'textarea') {
            return (
                <KElement eid={eid} childNode={
                    <textarea
                        id={`${eid}`}
                        className='element'
                        value={content}
                        onFocus={() => setEditingMode(true)}
                        onBlur={() => setEditingMode(false)}
                        onChange={(e) => {
                            const val = e.target.value;
                            updateElement(eid, (el) => {
                                el.inner = val;
                            });
                        }}
                    />
                } />
            );
        }

        return (
            <KElement eid={eid} childNode={
                isEditing ? (
                    mode === 'latex' ? (
                        <div className="latex-edit-wrapper">
                            <input
                                id={`${eid}`}
                                type="text"
                                className="latex-input"
                                value={draftText}
                                autoFocus
                                onChange={(e) => setDraftText(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'Enter') {
                                        commitEdit();
                                    } else if (e.key === 'Escape') {
                                        cancelEdit();
                                    }
                                }}
                            />
                            <div
                                className="latex-live-preview"
                                dangerouslySetInnerHTML={{ __html: renderKatexWithStatus(draftText).html }}
                            />
                            {renderKatexWithStatus(draftText).error && (
                                <div className="latex-error-badge">
                                    {renderKatexWithStatus(draftText).error}
                                </div>
                            )}
                        </div>
                    ) : (
                        <input
                            id={`${eid}`}
                            type="text"
                            className="element"
                            value={draftText}
                            autoFocus
                            onChange={(e) => setDraftText(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                    commitEdit();
                                } else if (e.key === 'Escape') {
                                    cancelEdit();
                                }
                            }}
                        />
                    )
                ) : mode === 'latex' ? (
                    <KatexRenderer
                        id={`${eid}`}
                        latex={content}
                        onDoubleClick={startEditing}
                    />
                ) : (
                    <Component
                        id={`${eid}`}
                        className='element'
                        onDoubleClick={startEditing}
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                )
            } />
        );
    };
};

export const KButton = createKElementComponent('button');

export const KLatex = createKElementComponent('p', 'latex');

export const KTextArea = createKElementComponent('textarea');

export const KCodeBlock = ({ eid, info }: KElementProps) => {
    const { currentSlide, updateElement, setEditingMode } = useDeck();
    const elemState = currentSlide.elements.find((el) => el.id === eid);
    const content = elemState?.inner ?? info ?? 'function greet(name: string) {\n  return `Hello, ${name}!`;\n}';
    const [isEditing, setIsEditing] = useState(false);
    const [draftCode, setDraftCode] = useState(content);

    const startEditing = () => {
        setDraftCode(content);
        setIsEditing(true);
        setEditingMode(true);
    };

    const commitEdit = () => {
        updateElement(eid, (el) => {
            el.inner = draftCode;
        });
        setIsEditing(false);
        setEditingMode(false);
    };

    return (
        <KElement eid={eid} childNode={
            isEditing ? (
                <textarea
                    id={`${eid}`}
                    className="element code-block-editor"
                    value={draftCode}
                    autoFocus
                    onChange={(e) => setDraftCode(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Escape') {
                            commitEdit();
                        }
                    }}
                />
            ) : (
                <pre
                    id={`${eid}`}
                    className="element code-block-view"
                    onDoubleClick={startEditing}
                >
                    <code>{content}</code>
                </pre>
            )
        } />
    );
};

export const KMarkdown = ({ eid, info }: KElementProps) => {
    const { currentSlide, updateElement, setEditingMode } = useDeck();
    const elemState = currentSlide.elements.find((el) => el.id === eid);
    const content = elemState?.inner ?? info ?? '## Slide Heading\n- First key point\n- Second `inline` point';
    const [isEditing, setIsEditing] = useState(false);
    const [draftMd, setDraftMd] = useState(content);

    const startEditing = () => {
        setDraftMd(content);
        setIsEditing(true);
        setEditingMode(true);
    };

    const commitEdit = () => {
        updateElement(eid, (el) => {
            el.inner = draftMd;
        });
        setIsEditing(false);
        setEditingMode(false);
    };

    return (
        <KElement eid={eid} childNode={
            isEditing ? (
                <textarea
                    id={`${eid}`}
                    className="element markdown-editor"
                    value={draftMd}
                    autoFocus
                    onChange={(e) => setDraftMd(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Escape') {
                            commitEdit();
                        }
                    }}
                />
            ) : (
                <div
                    id={`${eid}`}
                    className="element markdown-view"
                    onDoubleClick={startEditing}
                    dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }}
                />
            )
        } />
    );
};

export const KImage = ({ eid, info }: KElementProps) => {
    console.log("rendering KImage");
    const { currentSlide } = useDeck();
    const elemState = currentSlide.elements.find((el) => el.id === eid);
    const imageSrc = elemState?.inner ?? info ?? KSlideSet.slides[KSlideSet.curFrame].get(eid).inner;
    return (
        <KElement eid={eid} childNode={
            <img
                id={`${eid}`}
                className='element'
                src={imageSrc}
                alt={`slide-element-${eid}`}
                draggable="false"
            />
        } />
    );
};

const createShapeComponent = (shapeType: 'rect' | 'circle' | 'arrow' | 'line' | 'diamond' | 'triangle') => {
    return ({ eid }: KElementProps) => {
        const { currentSlide } = useDeck();
        const elemState = currentSlide.elements.find((el) => el.id === eid);
        const strokeColor = elemState?.style['color'] ?? '#7c3f23';
        const fillColor = elemState?.style['background'] ?? 'rgba(184, 93, 56, 0.14)';
        const strokeWidth = parseFloat(elemState?.style['strokeWidth'] ?? '4') || 4;
        const strokeDasharray = elemState?.style['strokeDasharray'] ?? 'none';

        return (
            <KElement eid={eid} childNode={
                <svg
                    id={`${eid}`}
                    className="element shape-svg"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    {shapeType === 'rect' && (
                        <rect
                            x="4"
                            y="4"
                            width="92"
                            height="92"
                            rx="8"
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray === 'none' ? undefined : strokeDasharray}
                        />
                    )}
                    {shapeType === 'circle' && (
                        <ellipse
                            cx="50"
                            cy="50"
                            rx="46"
                            ry="46"
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray === 'none' ? undefined : strokeDasharray}
                        />
                    )}
                    {shapeType === 'diamond' && (
                        <polygon
                            points="50,4 96,50 50,96 4,50"
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray === 'none' ? undefined : strokeDasharray}
                        />
                    )}
                    {shapeType === 'triangle' && (
                        <polygon
                            points="50,6 96,94 4,94"
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray === 'none' ? undefined : strokeDasharray}
                        />
                    )}
                    {shapeType === 'line' && (
                        <line
                            x1="6"
                            y1="50"
                            x2="94"
                            y2="50"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray === 'none' ? undefined : strokeDasharray}
                            strokeLinecap="round"
                        />
                    )}
                    {shapeType === 'arrow' && (
                        <>
                            <line
                                x1="6"
                                y1="50"
                                x2="82"
                                y2="50"
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDasharray === 'none' ? undefined : strokeDasharray}
                                strokeLinecap="round"
                            />
                            <polygon points="96,50 76,36 76,64" fill={strokeColor} />
                        </>
                    )}
                </svg>
            } />
        );
    };
};

export const KShapeRect = createShapeComponent('rect');
export const KShapeCircle = createShapeComponent('circle');
export const KShapeDiamond = createShapeComponent('diamond');
export const KShapeTriangle = createShapeComponent('triangle');
export const KShapeArrow = createShapeComponent('arrow');
export const KShapeLine = createShapeComponent('line');

export const KCallout = ({ eid, info }: KElementProps) => {
    const { currentSlide, updateElement, setEditingMode } = useDeck();
    const elemState = currentSlide.elements.find((el) => el.id === eid);
    const content = elemState?.inner ?? info ?? 'Key takeaway or theorem note';
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(content);

    const startEditing = () => {
        setDraft(content);
        setIsEditing(true);
        setEditingMode(true);
    };

    const commitEdit = () => {
        updateElement(eid, (el) => {
            el.inner = draft;
        });
        setIsEditing(false);
        setEditingMode(false);
    };

    return (
        <KElement eid={eid} childNode={
            isEditing ? (
                <textarea
                    id={`${eid}`}
                    className="element callout-editor"
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Escape') {
                            commitEdit();
                        }
                    }}
                />
            ) : (
                <div
                    id={`${eid}`}
                    className="element callout-view"
                    onDoubleClick={startEditing}
                >
                    <i className="material-icons callout-icon">lightbulb</i>
                    <div className="callout-text">{content}</div>
                </div>
            )
        } />
    );
};

export const KTable = ({ eid, info }: KElementProps) => {
    const { currentSlide, updateElement, setEditingMode } = useDeck();
    const elemState = currentSlide.elements.find((el) => el.id === eid);
    const defaultCsv = 'Metric | Baseline | Proposed\nLatency | 42 ms | 11 ms\nThroughput | 1.2k/s | 4.8k/s';
    const content = elemState?.inner ?? info ?? defaultCsv;
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(content);

    const startEditing = () => {
        setDraft(content);
        setIsEditing(true);
        setEditingMode(true);
    };

    const commitEdit = () => {
        updateElement(eid, (el) => {
            el.inner = draft;
        });
        setIsEditing(false);
        setEditingMode(false);
    };

    const rows = content
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => r.split('|').map((c) => c.trim()));

    return (
        <KElement eid={eid} childNode={
            isEditing ? (
                <textarea
                    id={`${eid}`}
                    className="element table-editor"
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Escape') {
                            commitEdit();
                        }
                    }}
                />
            ) : (
                <div id={`${eid}`} className="element table-view-wrapper" onDoubleClick={startEditing}>
                    <table className="slide-table">
                        {rows.length > 0 && (
                            <thead>
                                <tr>
                                    {rows[0].map((cell, idx) => (
                                        <th key={idx}>{cell}</th>
                                    ))}
                                </tr>
                            </thead>
                        )}
                        {rows.length > 1 && (
                            <tbody>
                                {rows.slice(1).map((row, rIdx) => (
                                    <tr key={rIdx}>
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx}>{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        )}
                    </table>
                </div>
            )
        } />
    );
};

export const KComponents: Map<string, React.FC<KElementProps>> = new Map([
    ["button", KButton],
    ["latex", KLatex],
    ["textarea", KTextArea],
    ["code", KCodeBlock],
    ["markdown", KMarkdown],
    ["callout", KCallout],
    ["table", KTable],
    ["rect", KShapeRect],
    ["circle", KShapeCircle],
    ["diamond", KShapeDiamond],
    ["triangle", KShapeTriangle],
    ["arrow", KShapeArrow],
    ["line", KShapeLine],
    ["image", KImage]
]);

export default KComponents;
