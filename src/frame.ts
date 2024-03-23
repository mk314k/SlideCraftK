import { Component } from "@builder.io/qwik";

export const defaultSV = {x:0, y:0, width:100, height:100};
export type SV = typeof defaultSV;

export class KElementData {
    public readonly name:string;
    public constructor(
        elemType:string,
        public x:number =defaultSV.x,
        public y:number =defaultSV.y,
        public width:number =defaultSV.width,
        public height:number =defaultSV.height,
        public inner = ''
    ){
        this.name = elemType;
        this.inner = inner !== '' ? inner : elemType;
    }
}


export class KSlide {
    public elemList:Component[] = [];
    public elemProp:Map<number, KElementData>= new Map();

    public pushProp(eid:number, elemType:string){
        this.elemProp.set(eid, new KElementData(elemType))
    }
}

export class KSlideSet {
    public static slides:KSlide[] = [new KSlide()];
    public static curFrame = 0;

    public static numElement(frame = KSlideSet.curFrame){
        return KSlideSet.slides[frame].elemList.length;
    }

    public static getE(s:number, e:number){
        return KSlideSet.slides[s].elemList[e]
    }

    public static load(data: string) {

        const parsedData = JSON.parse(data);

        KSlideSet.slides = [];
   
        parsedData.forEach((slideData: KSlide) => {
          const slide = new KSlide();
          const elemPropMap = new Map<number, KElementData>();

          for (const [eid, elemPropData] of Object.entries(slideData.elemProp)) {
            elemPropMap.set(Number(eid), new KElementData(
                elemPropData.name, 
                elemPropData.x, 
                elemPropData.y, 
                elemPropData.width, 
                elemPropData.height, 
                elemPropData.inner
            ));
          }
    
          slide.elemProp = elemPropMap;
          KSlideSet.slides.push(slide);
        });
      }
    
      public static save(): string {

        const data = KSlideSet.slides.map((slide: KSlide) => {
          const elemPropArray = Array.from(slide.elemProp.values()).map((elemProp: KElementData) => ({
            name: elemProp.name,
            x: elemProp.x,
            y: elemProp.y,
            width: elemProp.width,
            height: elemProp.height,
            inner: elemProp.inner
          }));
          return {
            elemProp: elemPropArray
          };
        });
        return JSON.stringify(data);
      }
}
