import React from "react";

export const defaultSV = {x:0, y:0, width:100, height:100};
export type SV = typeof defaultSV;
export const defaultFileName = 'untitled';

export class KElementData {
    public name:string;
    public constructor(
        elemType:string,
        public x:number =defaultSV.x,
        public y:number =defaultSV.y,
        public width:number =defaultSV.width,
        public height:number =defaultSV.height,
        public inner = ''
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
    
    public elements(){
        return this.elemList.filter((element) => element !== null);
    }

    public numElement():number{
        return this.elemList.length;
    }

    public push(elemType:string, elem:React.ReactNode){
        this.set(this.numElement(), elemType);
        this.elemList.push(elem);
    }
    public set(eid:number, elemType:string){
        this.elemProp.set(eid , new KElementData(elemType));
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

    public static numElement(frame = KSlideSet.curFrame){
        return KSlideSet.slides[frame].numElement();
    }

    public static getE(s:number, e:number){
        return KSlideSet.slides[s].elemList[e]
    }

    public static load(data: string): void {
        // Parse the data string and update slides and everything inside
        const parsedData = JSON.parse(data);
        // Assuming data is an array of slides
        KSlideSet.slides = parsedData.map((slideData: KSlide) => {
            const slide = new KSlide();
            slideData.elemProp.forEach((elemPropData: KElementData, index: number) => {
                const { name, x, y, width, height, inner } = elemPropData;
                slide.elemProp.set(index, new KElementData(name, x, y, width, height, inner));
            });
            return slide;
        });
    }

    public static save(): string {
        // Serialize slides to JSON string
        const data = this.slides.map((slide: KSlide) => {
            const elemPropArray: KElementData[] = [];
            slide.elemProp.forEach((elemProp: KElementData) => {
                elemPropArray.push({
                    name: elemProp.name,
                    x: elemProp.x,
                    y: elemProp.y,
                    width: elemProp.width,
                    height: elemProp.height,
                    inner: elemProp.inner
                });
            });
            return { elemProp: elemPropArray };
        });
        return JSON.stringify(data);
    }
}
