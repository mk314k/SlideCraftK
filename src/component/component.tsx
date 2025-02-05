import useKElemHook, { ResizeDirection } from "./hook";
import { tex2mml } from "./utility";
import { KSlideSet } from "../frame";
import { useDeck } from "../context/DeckContext";
import { KatexRenderer } from "../katexComponent";
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

const KElement: React.FC<KElementContainerProps> = ({ eid, childNode }) => {
    console.log("rendering KElement");
    const { style, handleMouseDown, handleResizeStart, handleRotateStart } = useKElemHook(eid);
    const { state, currentSlide, updateElement, deleteElement, setActiveEID } = useDeck();
    const elemStyle = currentSlide.elements.find((el) => el.id === eid)?.style ?? KSlideSet.slides[KSlideSet.curFrame].get(eid).style;

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
    const isActive = state.activeEID === eid;

    return (
        <div
            id={`${eid}div`}
            key={eid}
            className={`element-container${isActive ? ' active-element' : ''}`}
            style={{
                position: 'absolute',
                left: `${posx}px`,
                top: `${posy}px`,
                width: style.width,
                height: style.height,
                transform: style.rotation ? `rotate(${style.rotation}deg)` : undefined,
                background: 'var(--background)' ,
                cursor: style.cursor,
                ...elemStyle
            }}
            onMouseDown={e => { setActiveEID(eid); handleMouseDown(e); }}
            onClick={(e)=>{setActiveEID(eid); e.stopPropagation()}}
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
            setDraftText(content);
            setIsEditing(true);
            setEditingMode(true);
        };

        const commitEdit = () => {
            const nextInner = mode === 'latex' ? tex2mml(draftText) : draftText;
            updateElement(eid, (el) => {
                el.inner = nextInner;
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

export const KComponents: Map<string, React.FC<KElementProps>> = new Map([
    ["button", KButton],
    ["latex", KLatex],
    ["textarea", KTextArea],
    ["image", KImage]
]);

export default KComponents;
