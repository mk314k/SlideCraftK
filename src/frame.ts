import React from "react";
import { StyleVarList } from "statebinderk";

export const defaultSV = {x:0, y:0, width:100, height:100};
export type SV = typeof defaultSV;
export const defaultFileName = 'untitled';

export interface StyleMap {
    [key:string]:string;
}

export interface SerializedElement {
    id?: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    inner: string;
    style?: StyleMap;
}

export interface SerializedSlide {
    background?: string;
    elemProp: SerializedElement[];
}

export type SerializedDeck = SerializedSlide[];

export class KElementData {
    public name:string;
    public constructor(
        elemType:string,
        public x:number =defaultSV.x,
        public y:number =defaultSV.y,
        public width:number =defaultSV.width,
        public height:number =defaultSV.height,
        public inner = '',
        public style:StyleMap = {}
    ){
        this.name = elemType;
        if (this.inner === ''){
            this.inner = elemType;
        }
    }
}


export class KSlide {
    public elemList:React.ReactNode[] = [];
    public elemProp:Map<number, KElementData> = new Map();
    public background = 'azure';
    
    public elements(){
        return this.elemList.filter((element) => element !== null);
    }

    public numElement():number{
        return this.elemList.length;
    }

    public push(elemType:string, elem:React.ReactNode, info = ''){
        this.set(this.numElement(), elemType, info);
        this.elemList.push(elem);
    }
    public set(eid:number, elemType:string, info = ''){
        this.elemProp.set(eid, new KElementData(elemType, defaultSV.x, defaultSV.y, defaultSV.width, defaultSV.height, info));
    }
    public get(eid:number):KElementData{
        return this.elemProp.get(eid)?? new KElementData('none');
    }
    public del(eid:number){
        this.elemProp.delete(eid);
        this.elemList[eid] = null;
    }

}

export class KSlideSet {
    public static slides:KSlide[] = [new KSlide()];
    public static curFrame = 0;
    public static editingMode = false;
    public static view = {x:0, y:0};
    public static activeEID:number|null = null;
    public static slideBG = new StyleVarList([{id:`slide0`, state:'azure'}],'background');

    public static numElement(frame = KSlideSet.curFrame){
        return KSlideSet.slides[frame].numElement();
    }

    public static getE(s:number, e:number){
        return KSlideSet.slides[s].elemList[e]
    }

    public static load(data: string): void {
        let parsedData: unknown;
        try {
            parsedData = JSON.parse(data);
        } catch {
            throw new Error('Invalid .scs file: malformed JSON.');
        }

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            throw new Error('Invalid .scs file: expected a non-empty array of slides.');
        }

        const loadedSlides = parsedData.map((rawSlide: unknown, slideIdx: number) => {
            if (!rawSlide || typeof rawSlide !== 'object') {
                throw new Error(`Invalid .scs file: slide ${slideIdx} is not an object.`);
            }
            const slideData = rawSlide as Partial<SerializedSlide>;
            if (!Array.isArray(slideData.elemProp)) {
                throw new Error(`Invalid .scs file: slide ${slideIdx} is missing elemProp array.`);
            }

            const slide = new KSlide();
            slide.background = typeof slideData.background === 'string' && slideData.background.trim() !== ''
                ? slideData.background
                : 'azure';

            slideData.elemProp.forEach((rawElem: unknown, index: number) => {
                if (!rawElem || typeof rawElem !== 'object') {
                    return;
                }
                const elemPropData = rawElem as Partial<SerializedElement>;
                const name = typeof elemPropData.name === 'string' ? elemPropData.name : 'button';
                const x = typeof elemPropData.x === 'number' && Number.isFinite(elemPropData.x) ? elemPropData.x : defaultSV.x;
                const y = typeof elemPropData.y === 'number' && Number.isFinite(elemPropData.y) ? elemPropData.y : defaultSV.y;
                const width = typeof elemPropData.width === 'number' && Number.isFinite(elemPropData.width) ? elemPropData.width : defaultSV.width;
                const height = typeof elemPropData.height === 'number' && Number.isFinite(elemPropData.height) ? elemPropData.height : defaultSV.height;
                const inner = typeof elemPropData.inner === 'string' ? elemPropData.inner : '';
                const style: StyleMap = elemPropData.style && typeof elemPropData.style === 'object'
                    ? { ...elemPropData.style }
                    : {};
                const eid = typeof elemPropData.id === 'number' && Number.isInteger(elemPropData.id) && elemPropData.id >= 0
                    ? elemPropData.id
                    : index;
                slide.elemProp.set(eid, new KElementData(name, x, y, width, height, inner, style));
            });
            return slide;
        });

        KSlideSet.slides = loadedSlides;
        KSlideSet.curFrame = 0;
        KSlideSet.activeEID = null;
        KSlideSet.slideBG = new StyleVarList(
            KSlideSet.slides.map((slide, index) => ({
                id: `slide${index}`,
                state: slide.background
            })),
            'background'
        );
    }

    public static save(): string {
        // Serialize slides to JSON string
        const data: SerializedDeck = this.slides.map((slide: KSlide, slideIndex: number) => {
            const elemPropArray: SerializedElement[] = [];
            slide.elemProp.forEach((elemProp: KElementData, eid: number) => {
                elemPropArray.push({
                    id: eid,
                    name: elemProp.name,
                    x: elemProp.x,
                    y: elemProp.y,
                    width: elemProp.width,
                    height: elemProp.height,
                    inner: elemProp.inner,
                    style: { ...elemProp.style }
                });
            });
            let background = slide.background;
            try {
                background = KSlideSet.slideBG.current(slideIndex) ?? slide.background;
            } catch {
                background = slide.background;
            }
            return { background, elemProp: elemPropArray };
        });
        return JSON.stringify(data);
    }
}
