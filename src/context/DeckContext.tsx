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
    inner: string;
    style: StyleMap;
}

export interface SlideState {
    background: string;
    elements: SlideElementState[];
    nextEid: number;
}

export interface DeckState {
    slides: SlideState[];
    curFrame: number;
    activeEID: number | null;
    editingMode: boolean;
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
    setActiveEID: (eid: number | null) => void;
    setEditingMode: (editing: boolean) => void;
    saveDeck: () => string;
    loadDeck: (rawJson: string) => void;
}

function syncFromKSlideSet(): DeckState {
    const slides: SlideState[] = KSlideSet.slides.map((slide, idx) => {
        const entries = slide.elements();
        const maxId = entries.length > 0 ? Math.max(...entries.map(([id]) => id)) : -1;
        let bg = slide.background;
        try {
            bg = KSlideSet.slideBG.current(idx) ?? slide.background;
        } catch {
            bg = slide.background;
        }
        return {
            background: bg,
            elements: entries.map(([id, data]) => ({
                id,
                name: data.name,
                x: data.x,
                y: data.y,
                width: data.width,
                height: data.height,
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
                new KElementData(el.name, el.x, el.y, el.width, el.height, el.inner, { ...el.style })
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
            try {
                KSlideSet.slideBG.addBinding(`slide${newIdx}`, 'azure');
            } catch {
                // ignore if binding already exists
            }
        });
    }, [updateDeck]);

    const setSlideBackground = useCallback((color: string, frameId?: number) => {
        updateDeck((draft) => {
            const target = frameId ?? draft.curFrame;
            if (draft.slides[target]) {
                draft.slides[target].background = color;
            }
            try {
                KSlideSet.slideBG.transition(target, color);
            } catch {
                // ignore if binding out of range
            }
        });
    }, [updateDeck]);

    const addElement = useCallback((elemType: string, info?: string) => {
        updateDeck((draft) => {
            const slide = draft.slides[draft.curFrame];
            if (!slide) return;
            const eid = slide.nextEid;
            const inner = info && info !== '' ? info : elemType;
            slide.elements.push({
                id: eid,
                name: elemType,
                x: defaultSV.x,
                y: defaultSV.y,
                width: defaultSV.width,
                height: defaultSV.height,
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
                setActiveEID,
                setEditingMode,
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
