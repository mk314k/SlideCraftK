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

const SHAPE_TYPES = new Set([
    'rect',
    'circle',
    'arrow',
    'line',
    'diamond',
    'triangle',
    'database',
    'cloud',
    'server',
    'hexagon',
    'parallelogram',
    'queue',
]);

const ELEMENT_TYPE_LABELS: Record<string, string> = {
    button: 'Button (double-click to edit)',
    textarea: 'Text Area',
    markdown: 'Markdown Block (double-click to edit)',
    callout: 'Callout Card (double-click to edit)',
    quote: 'Quote Block (double-click to edit)',
    stat: 'Metric Card (double-click to edit)',
    badge: 'Badge Pill (double-click to edit)',
    chart: 'Bar Chart (double-click to edit)',
    table: 'Data Table (double-click to edit)',
    latex: 'LaTeX Equation (double-click to edit)',
    code: 'Code Block (double-click to edit)',
    rect: 'Rectangle Shape',
    circle: 'Circle Shape',
    diamond: 'Decision Diamond',
    triangle: 'Triangle Shape',
    database: 'Database Cylinder',
    cloud: 'Cloud Node',
    server: 'Server / Compute Node',
    hexagon: 'Microservice Hexagon',
    parallelogram: 'I/O Data Parallelogram',
    queue: 'Message Queue / Pipe',
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
    const elemAnimDuration = elemState?.animDuration ?? 0.45;
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
                '--anim-duration': `${elemAnimDuration}s`,
                ...containerStyle
            } as React.CSSProperties}
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

type ArchShapeType =
    | 'rect'
    | 'circle'
    | 'arrow'
    | 'line'
    | 'diamond'
    | 'triangle'
    | 'database'
    | 'cloud'
    | 'server'
    | 'hexagon'
    | 'parallelogram'
    | 'queue';

const createShapeComponent = (shapeType: ArchShapeType) => {
    return ({ eid }: KElementProps) => {
        const { currentSlide } = useDeck();
        const elemState = currentSlide.elements.find((el) => el.id === eid);
        const strokeColor = elemState?.style['color'] ?? '#7c3f23';
        const fillColor = elemState?.style['background'] ?? 'rgba(184, 93, 56, 0.14)';
        const strokeWidth = parseFloat(elemState?.style['strokeWidth'] ?? '4') || 4;
        const strokeDasharray = elemState?.style['strokeDasharray'] ?? 'none';
        const dashProp = strokeDasharray === 'none' ? undefined : strokeDasharray;

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
                            strokeDasharray={dashProp}
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
                            strokeDasharray={dashProp}
                        />
                    )}
                    {shapeType === 'diamond' && (
                        <polygon
                            points="50,4 96,50 50,96 4,50"
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashProp}
                        />
                    )}
                    {shapeType === 'triangle' && (
                        <polygon
                            points="50,6 96,94 4,94"
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashProp}
                        />
                    )}
                    {shapeType === 'hexagon' && (
                        <polygon
                            points="25,6 75,6 96,50 75,94 25,94 4,50"
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashProp}
                        />
                    )}
                    {shapeType === 'parallelogram' && (
                        <polygon
                            points="20,8 96,8 80,92 4,92"
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashProp}
                        />
                    )}
                    {shapeType === 'database' && (
                        <>
                            <path
                                d="M 8,18 L 8,82 A 42,13 0 0 0 92,82 L 92,18"
                                fill={fillColor}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeDasharray={dashProp}
                            />
                            <ellipse
                                cx="50"
                                cy="18"
                                rx="42"
                                ry="13"
                                fill={fillColor}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeDasharray={dashProp}
                            />
                            <path
                                d="M 8,42 A 42,13 0 0 0 92,42"
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth={strokeWidth * 0.75}
                                strokeDasharray={dashProp}
                            />
                        </>
                    )}
                    {shapeType === 'queue' && (
                        <>
                            <path
                                d="M 18,8 L 82,8 A 12,42 0 0 0 82,92 L 18,92 A 12,42 0 0 1 18,8 Z"
                                fill={fillColor}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeDasharray={dashProp}
                            />
                            <ellipse
                                cx="82"
                                cy="50"
                                rx="12"
                                ry="42"
                                fill={fillColor}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeDasharray={dashProp}
                            />
                        </>
                    )}
                    {shapeType === 'cloud' && (
                        <path
                            d="M 26,78 L 76,78 A 18,18 0 0 0 80,43 A 22,22 0 0 0 38,32 A 18,18 0 0 0 14,50 A 16,16 0 0 0 26,78 Z"
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashProp}
                            strokeLinejoin="round"
                        />
                    )}
                    {shapeType === 'server' && (
                        <>
                            <rect x="6" y="6" width="88" height="26" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={dashProp} />
                            <circle cx="18" cy="19" r="3.5" fill={strokeColor} />
                            <circle cx="28" cy="19" r="3.5" fill={strokeColor} />
                            <rect x="6" y="37" width="88" height="26" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={dashProp} />
                            <circle cx="18" cy="50" r="3.5" fill={strokeColor} />
                            <circle cx="28" cy="50" r="3.5" fill={strokeColor} />
                            <rect x="6" y="68" width="88" height="26" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={dashProp} />
                            <circle cx="18" cy="81" r="3.5" fill={strokeColor} />
                            <circle cx="28" cy="81" r="3.5" fill={strokeColor} />
                        </>
                    )}
                    {shapeType === 'line' && (
                        <line
                            x1="6"
                            y1="50"
                            x2="94"
                            y2="50"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashProp}
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
                                strokeDasharray={dashProp}
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
export const KShapeDatabase = createShapeComponent('database');
export const KShapeCloud = createShapeComponent('cloud');
export const KShapeServer = createShapeComponent('server');
export const KShapeHexagon = createShapeComponent('hexagon');
export const KShapeParallelogram = createShapeComponent('parallelogram');
export const KShapeQueue = createShapeComponent('queue');
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

export const KQuote = ({ eid, info }: KElementProps) => {
    const { currentSlide, updateElement, setEditingMode } = useDeck();
    const elemState = currentSlide.elements.find((el) => el.id === eid);
    const content = elemState?.inner ?? info ?? 'Simplicity is prerequisite for reliability.\n— Edsger W. Dijkstra';
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

    const lines = content.split('\n');
    const quoteBody = lines[0] ?? '';
    const authorLine = lines.slice(1).join(' ');

    return (
        <KElement eid={eid} childNode={
            isEditing ? (
                <textarea
                    id={`${eid}`}
                    className="element quote-editor"
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
                <blockquote id={`${eid}`} className="element quote-view" onDoubleClick={startEditing}>
                    <p className="quote-text">“{quoteBody}”</p>
                    {authorLine && <footer className="quote-author">{authorLine}</footer>}
                </blockquote>
            )
        } />
    );
};

export const KStatCard = ({ eid, info }: KElementProps) => {
    const { currentSlide, updateElement, setEditingMode } = useDeck();
    const elemState = currentSlide.elements.find((el) => el.id === eid);
    const content = elemState?.inner ?? info ?? '99.4%\nModel Accuracy';
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

    const [statValue, ...rest] = content.split('\n');
    const statLabel = rest.join(' ');

    return (
        <KElement eid={eid} childNode={
            isEditing ? (
                <textarea
                    id={`${eid}`}
                    className="element stat-editor"
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
                <div id={`${eid}`} className="element stat-view" onDoubleClick={startEditing}>
                    <span className="stat-number">{statValue}</span>
                    {statLabel && <span className="stat-caption">{statLabel}</span>}
                </div>
            )
        } />
    );
};

export const KBadge = createKElementComponent('span');

export const KBarChart = ({ eid, info }: KElementProps) => {
    const { currentSlide, updateElement, setEditingMode } = useDeck();
    const elemState = currentSlide.elements.find((el) => el.id === eid);
    const defaultChart = 'Q1: 45\nQ2: 72\nQ3: 64\nQ4: 92';
    const content = elemState?.inner ?? info ?? defaultChart;
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

    const bars = content
        .split('\n')
        .map((line) => {
            const [label, rawVal] = line.split(':');
            const val = parseFloat((rawVal ?? '0').trim());
            return {
                label: (label ?? '').trim(),
                value: Number.isFinite(val) ? Math.max(0, val) : 0,
            };
        })
        .filter((b) => b.label !== '');

    const maxVal = Math.max(1, ...bars.map((b) => b.value));
    const barColor = elemState?.style['color'] ?? '#b85d38';

    return (
        <KElement eid={eid} childNode={
            isEditing ? (
                <textarea
                    id={`${eid}`}
                    className="element chart-editor"
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
                <div id={`${eid}`} className="element chart-view" onDoubleClick={startEditing}>
                    {bars.map((bar, idx) => (
                        <div key={idx} className="chart-bar-col">
                            <span className="chart-bar-val">{bar.value}</span>
                            <div className="chart-bar-track">
                                <div
                                    className="chart-bar-fill"
                                    style={{
                                        height: `${Math.round((bar.value / maxVal) * 100)}%`,
                                        background: barColor,
                                    }}
                                />
                            </div>
                            <span className="chart-bar-label">{bar.label}</span>
                        </div>
                    ))}
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
    ["quote", KQuote],
    ["stat", KStatCard],
    ["badge", KBadge],
    ["chart", KBarChart],
    ["table", KTable],
    ["rect", KShapeRect],
    ["circle", KShapeCircle],
    ["diamond", KShapeDiamond],
    ["triangle", KShapeTriangle],
    ["database", KShapeDatabase],
    ["cloud", KShapeCloud],
    ["server", KShapeServer],
    ["hexagon", KShapeHexagon],
    ["parallelogram", KShapeParallelogram],
    ["queue", KShapeQueue],
    ["arrow", KShapeArrow],
    ["line", KShapeLine],
    ["image", KImage]
]);

export default KComponents;
