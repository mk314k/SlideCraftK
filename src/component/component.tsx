import useKElemHook from "./hook";
import { handleEditText } from "./utility";
import { KSlideSet } from "../frame";
import React, { useCallback } from "react";

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
    const { style, handleMouseDown } = useKElemHook(eid);

    const handleDelete = useCallback(() => {
        console.log("handleDelete called");
        if (!KSlideSet.editingMode){
            KSlideSet.slides[KSlideSet.curFrame].del(eid);
            const elem = document.getElementById(`${eid}div`);
            if (elem) {
                elem.className = 'hidden';
            }
        }
    }, [eid]);

    const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        console.log("onkeydown called");
        switch (event.key) {
            case 'Delete':
            case 'Backspace':
            case 'Escape':
                handleDelete();
                break;
            default:
                break;
        }
    }, [handleDelete]);
    // const view = document.getElementById('slide');
    const posx = style.x;
    const posy = style.y;
    // if (view){
    //     const vrect = view.getBoundingClientRect();
    //     posx = posx*100/vrect.width;
    //     posy = posy*100/vrect.height;
    // }

    return (
        <div
            id={`${eid}div`}
            key={eid}
            className='element-container'
            style={{
                position: 'absolute',
                left: `${posx}px`,
                top: `${posy}px`,
                width: style.width,
                height: style.height,
                background: 'var(--background)' ,
                cursor: style.cursor,
                ...KSlideSet.slides[KSlideSet.curFrame].get(eid).style
            }}
            onMouseDown={e => handleMouseDown(e)}
            onClick={(e)=>{KSlideSet.activeEID = eid; console.log(KSlideSet.activeEID);e.stopPropagation()}}
            onKeyDown={onKeyDown}
            tabIndex={0}
        >
            {childNode}
        </div>
    );
};

const createKElementComponent = (Component: React.ElementType, mode?:string) => {
    return ({ eid, info }: KElementProps) => {
        console.log(`rendering ${Component}`);
        const content = info ?? KSlideSet.slides[KSlideSet.curFrame].get(eid).inner;
        if (Component === 'textarea') {
            return (
                <KElement eid={eid} childNode={
                    <textarea
                        id={`${eid}`}
                        className='element'
                        defaultValue={content}
                        onDoubleClick={() => { handleEditText(eid, false) }}
                    />
                } />
            );
        }
        return (
            <KElement eid={eid} childNode={
                <Component
                    id={`${eid}`}
                    className='element'
                    onDoubleClick={() => { handleEditText(eid, mode === 'latex') }}
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            } />
        );
    };
};

export const KButton = createKElementComponent('button');

export const KLatex = createKElementComponent('p', 'latex');

export const KTextArea = createKElementComponent('textarea');

export const KImage = ({ eid, info }: KElementProps) => {
    console.log("rendering KImage");
    const imageSrc = info ?? KSlideSet.slides[KSlideSet.curFrame].get(eid).inner;
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
