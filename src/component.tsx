import useKElemHook from "./hook";
import { handleEditText } from "./utility";
import { KSlideSet } from "./frame";
import { Component, JSXOutput, component$ } from '@builder.io/qwik'

export interface KElementContainerProps {
    eid:number,
    childNode: JSXOutput
}
export interface KElementProps {
    eid:number,
    info?:string
}

export const KElement:Component<KElementContainerProps> = component$(({
    eid,
    childNode
}) => {
    console.log("rendering KElement");
    const {style, handleMouseDown} = useKElemHook(eid);
    // useEffect(()=>{
    //     console.log("KElement effect hook");
    //     const elem = document.getElementById(`${eid}`);
    //     if (elem){
    //         elem.innerHTML = KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].inner;
    //     }
    // }, [eid])

    const handleDelete = () => {
        console.log("handleDelete called");
        KSlideSet.slides[KSlideSet.curFrame].elemProp.delete(eid);
        const elem =document.getElementById(`${eid}div`);
        if (elem){
            elem.className = 'hidden';
        }
    }

    const onKeyDown = (event: KeyboardEvent) => {
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
    };

    return (
        <div
            id={`${eid}div`}
            key={eid}
            class='element-container'
            style={{
                position: 'absolute',
                left: style.x.value,
                top: style.y.value,
                width: style.width.value,
                height: style.height.value,
                cursor: style.cursor.value
            }}
            onMouseDown$={e => handleMouseDown(e)}
            onKeyDown$={onKeyDown}
            tabIndex={0}
        >
            {childNode}
        </div>
    )
})

export const KButton:Component<KElementProps> = component$(({eid}) => {
    console.log("rendering kbutton");
    return (
        <KElement eid={eid} childNode={
            <button
                id={`${eid}`}
                class='element'
                onDoubleClick$={() => {handleEditText(eid)}}
            ></button>
        } />
    )
})

export const KLatex:Component<KElementProps> = component$(({eid}) => {
    console.log("rendering klatex");
    return (
        <KElement eid={eid} childNode={
            <p
                id={`${eid}`}
                class='element'
                onDoubleClick$={() => handleEditText(eid, true)}
            ></p>
        } />
    )
})
export const KTextArea:Component<KElementProps> = component$(({eid}) => {
    console.log("rendering ktext");
    return (
        <KElement eid={eid} childNode={
            <textarea
                id={`${eid}`}
                class='element'
            ></textarea>
        } />
    )
})

export const KImage:Component<KElementProps> = component$(({eid, info}) => {
    console.log("rendering kimage");
    return (
        <KElement eid={eid} childNode={
            <img
                id={`${eid}`}
                class='element'
                src={info}
                draggable={false}
            ></img>
        } />
    )
})

export const KComponents: Map<string, Component<KElementProps>> = new Map([
    ["button", KButton],
    ["latex", KLatex],
    ["textarea", KTextArea],
    ["image", KImage]
]);

export default KComponents;