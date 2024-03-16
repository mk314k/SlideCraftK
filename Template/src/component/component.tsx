import useKElemHook from "./hook";
import { handleEditText } from "./utility";
import { KSlideSet } from "../frame";
import { useEffect } from "react";

export interface KElementProps {
    eid:number,
    childNode: React.ReactNode,
    // styleVal?: {
    //     x:number,
    //     y:number,
    //     width: number,
    //     height:number
    // }
}


export const KElement:React.FC<KElementProps> = ({
    eid,
    childNode
}) => {
    console.log("KElement");
    const {style, handleMouseDown} = useKElemHook(eid);
    useEffect(()=>{
        const elem = document.getElementById(`${eid}`);
        if (elem){
            elem.innerHTML = KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].inner;
        }
    }, [eid])

    return (
        <div
            key={eid}
            className='element-container'
            style={{
                position: 'absolute',
                left: style.x,
                top: style.y,
                width: style.width,
                height: style.height,
                cursor: style.cursor
            }}
            onMouseDown={e => handleMouseDown(e)}
        >
            {childNode}
        </div>
    )
}

export const Kbutton:React.FC<{ id: number }> = ({id}) => {
    return (
        <KElement eid={id} childNode={
            <button
                id={`${id}`}
                className='element'
                onDoubleClick={() => {handleEditText(id)}}
            ></button>
        } />
    )
}

export const KLatex:React.FC<{ id: number }> = ({id}) => {
    return (
        <KElement eid={id} childNode={
            <p
                id={`${id}`}
                className='element'
                onDoubleClick={() => handleEditText(id, true)}
            ></p>
        } />
    )
}
export const KTextArea:React.FC<{ id: number}> = ({id}) => {
    return (
        <KElement eid={id} childNode={
            <textarea
                id={`${id}`}
                className='element'
            ></textarea>
        } />
    )
}

export const KImage:React.FC<{ id: number, imgUrl:string }> = ({id, imgUrl}) => {
    return (
        <KElement eid={id} childNode={
            <img
                id={`${id}`}
                className='element'
                src={imgUrl}
                draggable="false"
            ></img>
        } />
    )
}


export default Kbutton;