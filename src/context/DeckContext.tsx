import React, { createContext, useContext, useState, useCallback } from 'react';
import { produce } from 'immer';
import { KElementData, KSlide, KSlideSet, StyleMap, defaultSV } from '../frame';

export interface SlideElementState {
    id: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    inner: string;
    style: StyleMap;
}

export interface SlideState {
    background: string;
    elements: SlideElementState[];
    nextEid: number;
}

export interface AlignmentGuide {
    axis: 'vertical' | 'horizontal';
    position: number;
}

export interface DeckState {
    slides: SlideState[];
    curFrame: number;
    activeEID: number | null;
    editingMode: boolean;
    guides: AlignmentGuide[];
    clipboard: Omit<SlideElementState, 'id'> | null;
}

export interface DeckContextValue {
    state: DeckState;
    currentSlide: SlideState;
    setFrameId: (frameId: number) => void;
    addSlide: () => void;
    setSlideBackground: (color: string, frameId?: number) => void;
    addElement: (elemType: string, info?: string) => void;
    updateElement: (eid: number, updater: (elem: SlideElementState) => void) => void;
    updateElementStyle: (eid: number, prop: string, value: string) => void;
    deleteElement: (eid: number) => void;
    duplicateActiveElement: () => void;
    copyActiveElement: () => void;
    pasteClipboardElement: () => void;
    setActiveEID: (eid: number | null) => void;
    setEditingMode: (editing: boolean) => void;
    setGuides: (guides: AlignmentGuide[]) => void;
    saveDeck: () => string;
    loadDeck: (rawJson: string) => void;
}

function syncFromKSlideSet(): DeckState {
    const slides: SlideState[] = KSlideSet.slides.map((slide) => {
        const entries = slide.elements();
        const maxId = entries.length > 0 ? Math.max(...entries.map(([id]) => id)) : -1;
        return {
            background: slide.background,
            elements: entries.map(([id, data]) => ({
                id,
                name: data.name,
                x: data.x,
                y: data.y,
                width: data.width,
                height: data.height,
                rotation: data.rotation ?? 0,
                inner: data.inner,
                style: { ...data.style },
            })),
            nextEid: maxId + 1,
        };
    });
    return {
        slides: slides.length > 0 ? slides : [{ background: 'azure', elements: [], nextEid: 0 }],
        curFrame: KSlideSet.curFrame,
        activeEID: KSlideSet.activeEID,
        editingMode: KSlideSet.editingMode,
        guides: [],
        clipboard: null,
    };
}

function syncToKSlideSet(deck: DeckState): void {
    KSlideSet.curFrame = deck.curFrame;
    KSlideSet.activeEID = deck.activeEID;
    KSlideSet.editingMode = deck.editingMode;
    KSlideSet.slides = deck.slides.map((s) => {
        const kSlide = new KSlide();
        kSlide.background = s.background;
        s.elements.forEach((el) => {
            kSlide.elemProp.set(
                el.id,
                new KElementData(el.name, el.x, el.y, el.width, el.height, el.inner, { ...el.style }, el.rotation)
            );
        });
        return kSlide;
    });
}

const DeckContext = createContext<DeckContextValue | null>(null);

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<DeckState>(() => syncFromKSlideSet());

    const updateDeck = useCallback((recipe: (draft: DeckState) => void) => {
        setState((prev) => {
            const next = produce(prev, recipe);
            syncToKSlideSet(next);
            return next;
        });
    }, []);

    const setFrameId = useCallback((frameId: number) => {
        updateDeck((draft) => {
            if (frameId >= 0 && frameId < draft.slides.length) {
                draft.curFrame = frameId;
                draft.activeEID = null;
                draft.editingMode = false;
            }
        });
    }, [updateDeck]);

    const addSlide = useCallback(() => {
        updateDeck((draft) => {
            const newIdx = draft.slides.length;
            draft.slides.push({ background: 'azure', elements: [], nextEid: 0 });
            draft.curFrame = newIdx;
            draft.activeEID = null;
        });
    }, [updateDeck]);

    const setSlideBackground = useCallback((color: string, frameId?: number) => {
        updateDeck((draft) => {
            const target = frameId ?? draft.curFrame;
            if (draft.slides[target]) {
                draft.slides[target].background = color;
            }
        });
    }, [updateDeck]);

    const addElement = useCallback((elemType: string, info?: string) => {
        updateDeck((draft) => {
            const slide = draft.slides[draft.curFrame];
            if (!slide) return;
            const eid = slide.nextEid;
            const defaultInner = elemType === 'latex'
                ? '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}'
                : elemType === 'code'
                ? 'function greet(name: string) {\n  return `Hello, ${name}!`;\n}'
                : elemType;
            const inner = info && info !== '' ? info : defaultInner;
            slide.elements.push({
                id: eid,
                name: elemType,
                x: defaultSV.x,
                y: defaultSV.y,
                width: defaultSV.width,
                height: defaultSV.height,
                rotation: 0,
                inner,
                style: {},
            });
            slide.nextEid = eid + 1;
            draft.activeEID = eid;
        });
    }, [updateDeck]);

    const updateElement = useCallback((eid: number, updater: (elem: SlideElementState) => void) => {
        updateDeck((draft) => {
            const slide = draft.slides[draft.curFrame];
            if (!slide) return;
            const target = slide.elements.find((el) => el.id === eid);
            if (target) {
                updater(target);
            }
        });
    }, [updateDeck]);

    const updateElementStyle = useCallback((eid: number, prop: string, value: string) => {
        updateDeck((draft) => {
            const slide = draft.slides[draft.curFrame];
            if (!slide) return;
            const target = slide.elements.find((el) => el.id === eid);
            if (target) {
                target.style[prop] = value;
            }
        });
    }, [updateDeck]);

    const deleteElement = useCallback((eid: number) => {
        updateDeck((draft) => {
            const slide = draft.slides[draft.curFrame];
            if (!slide) return;
            slide.elements = slide.elements.filter((el) => el.id !== eid);
            if (draft.activeEID === eid) {
                draft.activeEID = null;
            }
        });
    }, [updateDeck]);

    const duplicateActiveElement = useCallback(() => {
        updateDeck((draft) => {
            if (draft.activeEID == null) return;
            const slide = draft.slides[draft.curFrame];
            if (!slide) return;
            const source = slide.elements.find((el) => el.id === draft.activeEID);
            if (!source) return;
            const newId = slide.nextEid;
            slide.elements.push({
                id: newId,
                name: source.name,
                x: source.x + 24,
                y: source.y + 24,
                width: source.width,
                height: source.height,
                rotation: source.rotation,
                inner: source.inner,
                style: { ...source.style },
            });
            slide.nextEid = newId + 1;
            draft.activeEID = newId;
        });
    }, [updateDeck]);

    const copyActiveElement = useCallback(() => {
        updateDeck((draft) => {
            if (draft.activeEID == null) return;
            const slide = draft.slides[draft.curFrame];
            if (!slide) return;
            const source = slide.elements.find((el) => el.id === draft.activeEID);
            if (!source) return;
            draft.clipboard = {
                name: source.name,
                x: source.x,
                y: source.y,
                width: source.width,
                height: source.height,
                rotation: source.rotation,
                inner: source.inner,
                style: { ...source.style },
            };
        });
    }, [updateDeck]);

    const pasteClipboardElement = useCallback(() => {
        updateDeck((draft) => {
            if (!draft.clipboard) return;
            const slide = draft.slides[draft.curFrame];
            if (!slide) return;
            const newId = slide.nextEid;
            slide.elements.push({
                id: newId,
                name: draft.clipboard.name,
                x: draft.clipboard.x + 24,
                y: draft.clipboard.y + 24,
                width: draft.clipboard.width,
                height: draft.clipboard.height,
                rotation: draft.clipboard.rotation,
                inner: draft.clipboard.inner,
                style: { ...draft.clipboard.style },
            });
            slide.nextEid = newId + 1;
            draft.activeEID = newId;
        });
    }, [updateDeck]);

    const setActiveEID = useCallback((eid: number | null) => {
        updateDeck((draft) => {
            draft.activeEID = eid;
        });
    }, [updateDeck]);

    const setEditingMode = useCallback((editing: boolean) => {
        updateDeck((draft) => {
            draft.editingMode = editing;
        });
    }, [updateDeck]);

    const setGuides = useCallback((guides: AlignmentGuide[]) => {
        setState((prev) => ({
            ...prev,
            guides,
        }));
    }, []);

    const saveDeck = useCallback(() => {
        syncToKSlideSet(state);
        return KSlideSet.save();
    }, [state]);

    const loadDeck = useCallback((rawJson: string) => {
        KSlideSet.load(rawJson);
        setState(syncFromKSlideSet());
    }, []);

    const currentSlide = state.slides[state.curFrame] ?? state.slides[0];

    return (
        <DeckContext.Provider
            value={{
                state,
                currentSlide,
                setFrameId,
                addSlide,
                setSlideBackground,
                addElement,
                updateElement,
                updateElementStyle,
                deleteElement,
                duplicateActiveElement,
                copyActiveElement,
                pasteClipboardElement,
                setActiveEID,
                setEditingMode,
                setGuides,
                saveDeck,
                loadDeck,
            }}
        >
            {children}
        </DeckContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useDeck(): DeckContextValue {
    const ctx = useContext(DeckContext);
    if (!ctx) {
        throw new Error('useDeck must be used within a DeckProvider');
    }
    return ctx;
}
