import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { produce } from 'immer';
import { KElementData, KSlide, KSlideSet, StyleMap, SlideTransitionType, ElementAnimationType, defaultSV, defaultFileName } from '../frame';

const STORAGE_KEY = 'slidecraftk.autosave.v1';

export interface SlideElementState {
    id: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    step: number;
    animation?: ElementAnimationType;
    inner: string;
    style: StyleMap;
}

export interface SlideState {
    background: string;
    transition: SlideTransitionType;
    customCss: string;
    customJs: string;
    notes: string;
    elements: SlideElementState[];
    nextEid: number;
}

export interface AlignmentGuide {
    axis: 'vertical' | 'horizontal';
    position: number;
}

export interface DeckState {
    title: string;
    slides: SlideState[];
    curFrame: number;
    presentStep: number;
    activeEID: number | null;
    editingMode: boolean;
    presenting: boolean;
    guides: AlignmentGuide[];
    clipboard: Omit<SlideElementState, 'id'> | null;
}

export type SlideTemplateType = 'title' | 'two-column' | 'math-proof' | 'interactive';
export type ExampleDeckId = 'showcase' | 'calculus' | 'algorithms' | 'statebinder';

export interface DeckContextValue {
    state: DeckState;
    currentSlide: SlideState;
    setDeckTitle: (title: string) => void;
    setFrameId: (frameId: number) => void;
    setPresenting: (presenting: boolean) => void;
    advancePresentation: () => void;
    retreatPresentation: () => void;
    addSlide: () => void;
    addTemplateSlide: (template: SlideTemplateType) => void;
    loadExampleDeck: (deckId?: ExampleDeckId) => void;
    deleteSlide: (frameId?: number) => void;
    duplicateSlide: (frameId?: number) => void;
    moveSlide: (fromIdx: number, toIdx: number) => void;
    setSlideBackground: (color: string, frameId?: number) => void;
    setSlideTransition: (transition: SlideTransitionType) => void;
    setSlideCustomCode: (kind: 'style' | 'script', code: string) => void;
    setSlideNotes: (notes: string) => void;
    addElement: (elemType: string, info?: string) => void;
    updateElement: (eid: number, updater: (elem: SlideElementState) => void) => void;
    updateElementStyle: (eid: number, prop: string, value: string) => void;
    deleteElement: (eid: number) => void;
    duplicateActiveElement: () => void;
    copyActiveElement: () => void;
    pasteClipboardElement: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    setActiveEID: (eid: number | null) => void;
    setEditingMode: (editing: boolean) => void;
    setGuides: (guides: AlignmentGuide[]) => void;
    saveDeck: () => string;
    loadDeck: (rawJson: string) => void;
}

function buildTemplateSlide(template: SlideTemplateType): SlideState {
    if (template === 'title') {
        return {
            background: '#faf6ef',
            transition: 'fade',
            customCss: '',
            customJs: '',
            notes: 'Welcome the audience and introduce the core problem statement.',
            nextEid: 2,
            elements: [
                {
                    id: 0,
                    name: 'markdown',
                    x: 200,
                    y: 210,
                    width: 880,
                    height: 160,
                    rotation: 0,
                    step: 0,
                    inner: '# Presentation Title\n### Subtitle & Author Name',
                    style: { background: 'transparent', fontSize: '28px' },
                },
                {
                    id: 1,
                    name: 'line',
                    x: 340,
                    y: 400,
                    width: 600,
                    height: 36,
                    rotation: 0,
                    step: 0,
                    inner: 'line',
                    style: { color: '#b85d38' },
                },
            ],
        };
    }
    if (template === 'two-column') {
        return {
            background: '#fbf8f3',
            transition: 'slide',
            customCss: '',
            customJs: '',
            notes: 'Contrast the trade-offs between the left and right approaches.',
            nextEid: 3,
            elements: [
                {
                    id: 0,
                    name: 'markdown',
                    x: 80,
                    y: 50,
                    width: 1120,
                    height: 90,
                    rotation: 0,
                    step: 0,
                    inner: '## Two-Column Comparison',
                    style: { background: 'transparent', fontSize: '24px' },
                },
                {
                    id: 1,
                    name: 'markdown',
                    x: 80,
                    y: 170,
                    width: 530,
                    height: 460,
                    rotation: 0,
                    step: 1,
                    inner: '### Left Column\n- Key concept A\n- Supporting detail\n- Summary metric',
                    style: { background: '#f2e8dc' },
                },
                {
                    id: 2,
                    name: 'markdown',
                    x: 670,
                    y: 170,
                    width: 530,
                    height: 460,
                    rotation: 0,
                    step: 2,
                    inner: '### Right Column\n- Key concept B\n- Implementation note\n- Next steps',
                    style: { background: '#ebe3d5' },
                },
            ],
        };
    }
    if (template === 'math-proof') {
        return {
            background: '#fdfaf4',
            transition: 'fade',
            customCss: '',
            customJs: '',
            notes: 'Walk through the polar coordinate Jacobian r dr dtheta step.',
            nextEid: 3,
            elements: [
                {
                    id: 0,
                    name: 'markdown',
                    x: 90,
                    y: 60,
                    width: 1100,
                    height: 100,
                    rotation: 0,
                    step: 0,
                    inner: '## Gaussian Integral Identity',
                    style: { background: 'transparent', fontSize: '24px' },
                },
                {
                    id: 1,
                    name: 'latex',
                    x: 180,
                    y: 200,
                    width: 920,
                    height: 200,
                    rotation: 0,
                    step: 1,
                    inner: '\\left(\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx\\right)^2 = \\int_{0}^{2\\pi}\\int_{0}^{\\infty} r e^{-r^2}\\,dr\\,d\\theta = \\pi',
                    style: { background: '#f5efe6', fontSize: '24px' },
                },
                {
                    id: 2,
                    name: 'markdown',
                    x: 180,
                    y: 440,
                    width: 920,
                    height: 160,
                    rotation: 0,
                    step: 2,
                    inner: '- Convert Cartesian product integral into polar coordinates `(r, \\theta)`\n- Evaluate radial substitution `u = r^2`',
                    style: { background: 'transparent', fontSize: '20px' },
                },
            ],
        };
    }
    if (template === 'interactive') {
        return {
            background: '#f8f4ec',
            transition: 'slide',
            customCss: '#2div { transition: transform 0.2s ease, background 0.2s ease; }',
            customJs: 'let count = 0;\nslide.onClick(2, () => {\n  count += 1;\n  slide.setText(2, "Clicked " + count + " times!");\n  slide.setStyle(2, "background", count % 2 ? "#d97757" : "#efe4d6");\n});',
            notes: 'Click the button on the slide or open Developer mode to inspect the scoped slide code.',
            nextEid: 3,
            elements: [
                {
                    id: 0,
                    name: 'markdown',
                    x: 90,
                    y: 60,
                    width: 1100,
                    height: 100,
                    rotation: 0,
                    step: 0,
                    inner: '## Interactive Slide Code (`slide.*` & `StateBinder`)',
                    style: { background: 'transparent', fontSize: '24px' },
                },
                {
                    id: 1,
                    name: 'code',
                    x: 90,
                    y: 190,
                    width: 680,
                    height: 360,
                    rotation: 0,
                    step: 0,
                    inner: 'let count = 0;\nslide.onClick(2, () => {\n  count += 1;\n  slide.setText(2, `Clicked ${count} times!`);\n  slide.setStyle(2, "background", count % 2 ? "#d97757" : "#efe4d6");\n});',
                    style: {},
                },
                {
                    id: 2,
                    name: 'button',
                    x: 830,
                    y: 290,
                    width: 320,
                    height: 140,
                    rotation: 0,
                    step: 0,
                    inner: 'Click Me! (#2)',
                    style: { background: '#efe4d6', fontSize: '20px', fontWeight: 'bold' },
                },
            ],
        };
    }
    return {
        background: '#f8f4ec',
        transition: 'slide',
        customCss: '',
        customJs: '',
        notes: '',
        nextEid: 0,
        elements: [],
    };
}

function buildExampleDeck(deckId: ExampleDeckId): { title: string; slides: SlideState[] } {
    if (deckId === 'calculus') {
        return {
            title: 'calculus-fourier-series',
            slides: [
                {
                    background: '#faf6ef',
                    transition: 'fade',
                    customCss: '',
                    customJs: '',
                    notes: 'Introduce the Gaussian integral and Fourier transform duality.',
                    nextEid: 4,
                    elements: [
                        {
                            id: 0,
                            name: 'markdown',
                            x: 100,
                            y: 70,
                            width: 1080,
                            height: 120,
                            rotation: 0,
                            step: 0,
                            inner: '# Calculus & Fourier Analysis\n### Classical Identities & Spectral Decomposition',
                            style: { background: 'transparent', fontSize: '26px' },
                        },
                        {
                            id: 1,
                            name: 'latex',
                            x: 140,
                            y: 230,
                            width: 1000,
                            height: 170,
                            rotation: 0,
                            step: 0,
                            inner: '\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x)\\, e^{-2\\pi i x \\xi}\\,dx',
                            style: { fontSize: '28px' },
                        },
                        {
                            id: 2,
                            name: 'callout',
                            x: 180,
                            y: 450,
                            width: 920,
                            height: 120,
                            rotation: 0,
                            step: 1,
                            inner: 'Plancherel Theorem: The Fourier transform preserves energy (L² norm) between time and frequency domains.',
                            style: { fontSize: '20px' },
                        },
                    ],
                },
                buildTemplateSlide('math-proof'),
                {
                    background: '#fbf8f3',
                    transition: 'slide',
                    customCss: '',
                    customJs: '',
                    notes: 'Compare convergence rates across function classes.',
                    nextEid: 3,
                    elements: [
                        {
                            id: 0,
                            name: 'markdown',
                            x: 100,
                            y: 60,
                            width: 1080,
                            height: 90,
                            rotation: 0,
                            step: 0,
                            inner: '## Fourier Coefficient Decay Rates',
                            style: { background: 'transparent', fontSize: '24px' },
                        },
                        {
                            id: 1,
                            name: 'latex',
                            x: 140,
                            y: 170,
                            width: 1000,
                            height: 140,
                            rotation: 0,
                            step: 0,
                            inner: 'c_n = \\frac{1}{2\\pi}\\int_{-\\pi}^{\\pi} f(x) e^{-inx}\\,dx, \\quad |c_n| = \\mathcal{O}(|n|^{-k})',
                            style: { fontSize: '24px' },
                        },
                        {
                            id: 2,
                            name: 'table',
                            x: 160,
                            y: 350,
                            width: 960,
                            height: 240,
                            rotation: 0,
                            step: 1,
                            inner: 'Regularity Class | Coefficient Decay | Gibbs Phenomenon\nStep Discontinuity | O(1 / n) | Yes (~9% overshoot)\nContinuous Piecewise | O(1 / n²) | No\nAnalytic Smooth | Exponential O(e^{-αn}) | No',
                            style: { fontSize: '18px' },
                        },
                    ],
                },
            ],
        };
    }

    if (deckId === 'algorithms') {
        return {
            title: 'algorithms-data-structures',
            slides: [
                {
                    background: '#faf6ef',
                    transition: 'fade',
                    customCss: '',
                    customJs: '',
                    notes: 'Flowchart of binary search decision tree.',
                    nextEid: 6,
                    elements: [
                        {
                            id: 0,
                            name: 'markdown',
                            x: 90,
                            y: 50,
                            width: 1100,
                            height: 90,
                            rotation: 0,
                            step: 0,
                            inner: '## Algorithm Pipeline & Decision Graph',
                            style: { background: 'transparent', fontSize: '24px' },
                        },
                        {
                            id: 1,
                            name: 'rect',
                            x: 100,
                            y: 230,
                            width: 240,
                            height: 130,
                            rotation: 0,
                            step: 0,
                            inner: 'rect',
                            style: { color: '#7c3f23', background: '#f2e8dc' },
                        },
                        {
                            id: 2,
                            name: 'arrow',
                            x: 360,
                            y: 265,
                            width: 120,
                            height: 60,
                            rotation: 0,
                            step: 0,
                            inner: 'arrow',
                            style: { color: '#b85d38' },
                        },
                        {
                            id: 3,
                            name: 'diamond',
                            x: 500,
                            y: 205,
                            width: 220,
                            height: 180,
                            rotation: 0,
                            step: 1,
                            inner: 'diamond',
                            style: { color: '#b85d38', background: '#efe4d6' },
                        },
                        {
                            id: 4,
                            name: 'arrow',
                            x: 740,
                            y: 265,
                            width: 120,
                            height: 60,
                            rotation: 0,
                            step: 1,
                            inner: 'arrow',
                            style: { color: '#b85d38' },
                        },
                        {
                            id: 5,
                            name: 'circle',
                            x: 880,
                            y: 220,
                            width: 160,
                            height: 160,
                            rotation: 0,
                            step: 2,
                            inner: 'circle',
                            style: { color: '#7c3f23', background: '#ebe3d5' },
                        },
                    ],
                },
                {
                    background: '#fbf8f3',
                    transition: 'slide',
                    customCss: '',
                    customJs: '',
                    notes: 'Compare time and space complexity alongside implementation.',
                    nextEid: 3,
                    elements: [
                        {
                            id: 0,
                            name: 'markdown',
                            x: 80,
                            y: 50,
                            width: 1120,
                            height: 80,
                            rotation: 0,
                            step: 0,
                            inner: '## Dijkstra Shortest Path — Complexity & Code',
                            style: { background: 'transparent', fontSize: '24px' },
                        },
                        {
                            id: 1,
                            name: 'code',
                            x: 80,
                            y: 160,
                            width: 560,
                            height: 440,
                            rotation: 0,
                            step: 0,
                            inner: 'function dijkstra(adj: Edge[][], src: number) {\n  const dist = Array(adj.length).fill(Infinity);\n  dist[src] = 0;\n  const pq = new MinHeap([[0, src]]);\n  while (!pq.isEmpty()) {\n    const [d, u] = pq.pop()!;\n    if (d > dist[u]) continue;\n    for (const { to, w } of adj[u]) {\n      if (dist[u] + w < dist[to]) {\n        dist[to] = dist[u] + w;\n        pq.push([dist[to], to]);\n      }\n    }\n  }\n  return dist;\n}',
                            style: {},
                        },
                        {
                            id: 2,
                            name: 'table',
                            x: 680,
                            y: 160,
                            width: 520,
                            height: 260,
                            rotation: 0,
                            step: 1,
                            inner: 'Heap Type | Extract-Min | Decrease-Key | Total Time\nBinary Heap | O(log V) | O(log V) | O((V + E) log V)\nFibonacci Heap | O(log V) | O(1) amort. | O(E + V log V)\nArray Scan | O(V) | O(1) | O(V²)',
                            style: { fontSize: '16px' },
                        },
                    ],
                },
            ],
        };
    }

    if (deckId === 'statebinder') {
        return {
            title: 'interactive-statebinder-lab',
            slides: [
                buildTemplateSlide('interactive'),
                {
                    background: '#faf6ef',
                    transition: 'fade',
                    customCss: '#2div, #3div { transition: background 0.25s ease; }',
                    customJs: 'const theme = new MultiStyleVar("#efe4d6");\ntheme.addBinding("2div", "background");\ntheme.addBinding("3div", "background");\nslide.onClick(2, () => theme.transition("#d97757"));\nslide.onClick(3, () => theme.transition("#efe4d6"));',
                    notes: 'MultiStyleVar binds a single state transition across multiple DOM elements at once.',
                    nextEid: 4,
                    elements: [
                        {
                            id: 0,
                            name: 'markdown',
                            x: 90,
                            y: 55,
                            width: 1100,
                            height: 90,
                            rotation: 0,
                            step: 0,
                            inner: '## Multi-Element Reactive Binding (`MultiStyleVar`)',
                            style: { background: 'transparent', fontSize: '24px' },
                        },
                        {
                            id: 1,
                            name: 'code',
                            x: 90,
                            y: 175,
                            width: 660,
                            height: 360,
                            rotation: 0,
                            step: 0,
                            inner: 'const theme = new MultiStyleVar("#efe4d6");\ntheme.addBinding("2div", "background");\ntheme.addBinding("3div", "background");\nslide.onClick(2, () => theme.transition("#d97757"));\nslide.onClick(3, () => theme.transition("#efe4d6"));',
                            style: {},
                        },
                        {
                            id: 2,
                            name: 'button',
                            x: 810,
                            y: 195,
                            width: 340,
                            height: 130,
                            rotation: 0,
                            step: 0,
                            inner: 'Apply Terracotta (#2)',
                            style: { background: '#efe4d6', fontSize: '20px', fontWeight: 'bold' },
                        },
                        {
                            id: 3,
                            name: 'button',
                            x: 810,
                            y: 375,
                            width: 340,
                            height: 130,
                            rotation: 0,
                            step: 0,
                            inner: 'Reset Cream (#3)',
                            style: { background: '#f2e8dc', fontSize: '20px', fontWeight: 'bold' },
                        },
                    ],
                },
            ],
        };
    }

    return {
        title: 'slidecraftk-showcase',
        slides: buildDefaultWelcomeSlides(),
    };
}

function buildDefaultWelcomeSlides(): SlideState[] {
    return [
        {
            background: '#faf6ef',
            transition: 'fade',
            customCss: '',
            customJs: '',
            notes: 'Slide 1: Overview of SlideCraftK — double-click any element to edit, drag handles to resize or rotate.',
            nextEid: 5,
            elements: [
                {
                    id: 0,
                    name: 'markdown',
                    x: 110,
                    y: 90,
                    width: 1060,
                    height: 150,
                    rotation: 0,
                    step: 0,
                    inner: '# SlideCraftK\n### Interactive Math, Diagrams & Live Code Presentations',
                    style: { background: 'transparent', fontSize: '28px', color: '#2c241d' },
                },
                {
                    id: 1,
                    name: 'line',
                    x: 110,
                    y: 250,
                    width: 680,
                    height: 28,
                    rotation: 0,
                    step: 0,
                    inner: 'line',
                    style: { color: '#b85d38' },
                },
                {
                    id: 2,
                    name: 'rect',
                    x: 110,
                    y: 320,
                    width: 310,
                    height: 220,
                    rotation: 0,
                    step: 0,
                    inner: 'rect',
                    style: { color: '#b85d38', background: '#f2e8dc' },
                },
                {
                    id: 3,
                    name: 'markdown',
                    x: 130,
                    y: 340,
                    width: 270,
                    height: 180,
                    rotation: 0,
                    step: 0,
                    inner: '### Features\n- **KaTeX** equations\n- **SVG** vector shapes\n- **StateBinder** live JS',
                    style: { background: 'transparent', fontSize: '18px' },
                },
                {
                    id: 4,
                    name: 'circle',
                    x: 860,
                    y: 310,
                    width: 230,
                    height: 230,
                    rotation: 0,
                    step: 0,
                    inner: 'circle',
                    style: { color: '#7c3f23', background: '#efe4d6' },
                },
            ],
        },
        buildTemplateSlide('math-proof'),
        buildTemplateSlide('two-column'),
        buildTemplateSlide('interactive'),
    ];
}

function syncFromKSlideSet(): DeckState {
    const slides: SlideState[] = KSlideSet.slides.map((slide) => {
        const entries = slide.elements();
        const maxId = entries.length > 0 ? Math.max(...entries.map(([id]) => id)) : -1;
        return {
            background: slide.background,
            transition: slide.transition ?? 'fade',
            customCss: slide.customCss ?? '',
            customJs: slide.customJs ?? '',
            notes: slide.notes ?? '',
            elements: entries.map(([id, data]) => ({
                id,
                name: data.name,
                x: data.x,
                y: data.y,
                width: data.width,
                height: data.height,
                rotation: data.rotation ?? 0,
                step: data.step ?? 0,
                animation: data.animation ?? 'fade-in',
                inner: data.inner,
                style: { ...data.style },
            })),
            nextEid: maxId + 1,
        };
    });
    const isInitialEmpty = slides.length === 1 && slides[0].elements.length === 0;
    return {
        title: defaultFileName,
        slides: isInitialEmpty ? buildDefaultWelcomeSlides() : slides,
        curFrame: KSlideSet.curFrame,
        presentStep: 0,
        activeEID: KSlideSet.activeEID,
        editingMode: KSlideSet.editingMode,
        presenting: false,
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
        kSlide.transition = s.transition;
        kSlide.customCss = s.customCss;
        kSlide.customJs = s.customJs;
        kSlide.notes = s.notes;
        s.elements.forEach((el) => {
            kSlide.elemProp.set(
                el.id,
                new KElementData(el.name, el.x, el.y, el.width, el.height, el.inner, { ...el.style }, el.rotation, el.step, el.animation ?? 'fade-in')
            );
        });
        return kSlide;
    });
}

const DeckContext = createContext<DeckContextValue | null>(null);

const MAX_HISTORY = 40;

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<DeckState>(() => {
        if (typeof window !== 'undefined') {
            try {
                const cached = window.localStorage.getItem(STORAGE_KEY);
                if (cached) {
                    KSlideSet.load(cached);
                }
            } catch {
                // ignore malformed or unavailable localStorage
            }
        }
        return syncFromKSlideSet();
    });
    const [past, setPast] = useState<SlideState[][]>([]);
    const [future, setFuture] = useState<SlideState[][]>([]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            syncToKSlideSet(state);
            window.localStorage.setItem(STORAGE_KEY, KSlideSet.save());
        } catch {
            // ignore storage quota errors
        }
    }, [state]);

    const updateDeck = useCallback((recipe: (draft: DeckState) => void, recordHistory = true) => {
        setState((prev) => {
            const next = produce(prev, recipe);
            if (recordHistory && prev.slides !== next.slides) {
                setPast((oldPast) => [...oldPast.slice(-(MAX_HISTORY - 1)), prev.slides]);
                setFuture([]);
            }
            syncToKSlideSet(next);
            return next;
        });
    }, []);

    const undo = useCallback(() => {
        setPast((oldPast) => {
            if (oldPast.length === 0) return oldPast;
            const previousSlides = oldPast[oldPast.length - 1];
            setState((prev) => {
                setFuture((oldFuture) => [prev.slides, ...oldFuture.slice(0, MAX_HISTORY - 1)]);
                const clampedFrame = Math.min(prev.curFrame, previousSlides.length - 1);
                const next: DeckState = {
                    ...prev,
                    slides: previousSlides,
                    curFrame: clampedFrame,
                    activeEID: null,
                };
                syncToKSlideSet(next);
                return next;
            });
            return oldPast.slice(0, -1);
        });
    }, []);

    const redo = useCallback(() => {
        setFuture((oldFuture) => {
            if (oldFuture.length === 0) return oldFuture;
            const nextSlides = oldFuture[0];
            setState((prev) => {
                setPast((oldPast) => [...oldPast.slice(-(MAX_HISTORY - 1)), prev.slides]);
                const clampedFrame = Math.min(prev.curFrame, nextSlides.length - 1);
                const next: DeckState = {
                    ...prev,
                    slides: nextSlides,
                    curFrame: clampedFrame,
                    activeEID: null,
                };
                syncToKSlideSet(next);
                return next;
            });
            return oldFuture.slice(1);
        });
    }, []);

    const setDeckTitle = useCallback((title: string) => {
        updateDeck((draft) => {
            draft.title = title;
        }, false);
    }, [updateDeck]);

    const setFrameId = useCallback((frameId: number) => {
        updateDeck((draft) => {
            if (frameId >= 0 && frameId < draft.slides.length) {
                draft.curFrame = frameId;
                draft.presentStep = 0;
                draft.activeEID = null;
                draft.editingMode = false;
            }
        }, false);
    }, [updateDeck]);

    const setPresenting = useCallback((presenting: boolean) => {
        updateDeck((draft) => {
            draft.presenting = presenting;
            draft.presentStep = 0;
            if (presenting) {
                draft.activeEID = null;
                draft.editingMode = false;
            }
        }, false);
    }, [updateDeck]);

    const advancePresentation = useCallback(() => {
        updateDeck((draft) => {
            const slide = draft.slides[draft.curFrame];
            if (!slide) return;
            const maxStep = slide.elements.reduce((acc, el) => Math.max(acc, el.step ?? 0), 0);
            if (draft.presentStep < maxStep) {
                draft.presentStep += 1;
            } else if (draft.curFrame < draft.slides.length - 1) {
                draft.curFrame += 1;
                draft.presentStep = 0;
            }
        }, false);
    }, [updateDeck]);

    const retreatPresentation = useCallback(() => {
        updateDeck((draft) => {
            if (draft.presentStep > 0) {
                draft.presentStep -= 1;
            } else if (draft.curFrame > 0) {
                draft.curFrame -= 1;
                const prevSlide = draft.slides[draft.curFrame];
                const maxStep = prevSlide
                    ? prevSlide.elements.reduce((acc, el) => Math.max(acc, el.step ?? 0), 0)
                    : 0;
                draft.presentStep = maxStep;
            }
        }, false);
    }, [updateDeck]);

    const addSlide = useCallback(() => {
        updateDeck((draft) => {
            const newIdx = draft.slides.length;
            draft.slides.push({ background: '#faf6ef', transition: 'fade', customCss: '', customJs: '', notes: '', elements: [], nextEid: 0 });
            draft.curFrame = newIdx;
            draft.activeEID = null;
        });
    }, [updateDeck]);

    const addTemplateSlide = useCallback((template: SlideTemplateType) => {
        updateDeck((draft) => {
            const newIdx = draft.slides.length;
            draft.slides.push(buildTemplateSlide(template));
            draft.curFrame = newIdx;
            draft.activeEID = null;
        });
    }, [updateDeck]);

    const loadExampleDeck = useCallback((deckId: ExampleDeckId = 'showcase') => {
        updateDeck((draft) => {
            const built = buildExampleDeck(deckId);
            draft.title = built.title;
            draft.slides = built.slides;
            draft.curFrame = 0;
            draft.presentStep = 0;
            draft.activeEID = null;
            draft.editingMode = false;
        });
    }, [updateDeck]);

    const deleteSlide = useCallback((frameId?: number) => {
        updateDeck((draft) => {
            if (draft.slides.length <= 1) return;
            const target = frameId ?? draft.curFrame;
            if (target < 0 || target >= draft.slides.length) return;
            draft.slides.splice(target, 1);
            if (draft.curFrame >= draft.slides.length) {
                draft.curFrame = draft.slides.length - 1;
            } else if (draft.curFrame > target) {
                draft.curFrame -= 1;
            }
            draft.activeEID = null;
        });
    }, [updateDeck]);

    const duplicateSlide = useCallback((frameId?: number) => {
        updateDeck((draft) => {
            const target = frameId ?? draft.curFrame;
            const source = draft.slides[target];
            if (!source) return;
            const cloned: SlideState = {
                background: source.background,
                transition: source.transition,
                customCss: source.customCss,
                customJs: source.customJs,
                notes: source.notes,
                nextEid: source.nextEid,
                elements: source.elements.map((el) => ({
                    ...el,
                    style: { ...el.style },
                })),
            };
            draft.slides.splice(target + 1, 0, cloned);
            draft.curFrame = target + 1;
            draft.activeEID = null;
        });
    }, [updateDeck]);

    const moveSlide = useCallback((fromIdx: number, toIdx: number) => {
        updateDeck((draft) => {
            if (
                fromIdx < 0 ||
                fromIdx >= draft.slides.length ||
                toIdx < 0 ||
                toIdx >= draft.slides.length ||
                fromIdx === toIdx
            ) {
                return;
            }
            const [moved] = draft.slides.splice(fromIdx, 1);
            draft.slides.splice(toIdx, 0, moved);
            draft.curFrame = toIdx;
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

    const setSlideTransition = useCallback((transition: SlideTransitionType) => {
        updateDeck((draft) => {
            const slide = draft.slides[draft.curFrame];
            if (slide) {
                slide.transition = transition;
            }
        });
    }, [updateDeck]);

    const setSlideCustomCode = useCallback((kind: 'style' | 'script', code: string) => {
        updateDeck((draft) => {
            const slide = draft.slides[draft.curFrame];
            if (!slide) return;
            if (kind === 'style') {
                slide.customCss = code;
            } else {
                slide.customJs = code;
            }
        });
    }, [updateDeck]);

    const setSlideNotes = useCallback((notes: string) => {
        updateDeck((draft) => {
            const slide = draft.slides[draft.curFrame];
            if (!slide) return;
            slide.notes = notes;
        }, false);
    }, [updateDeck]);

    const addElement = useCallback((elemType: string, info?: string) => {
        updateDeck((draft) => {
            const slide = draft.slides[draft.curFrame];
            if (!slide) return;
            const eid = slide.nextEid;
            const defaultInner = elemType === 'latex'
                ? 'E = mc^2'
                : elemType === 'code'
                ? 'function greet(name: string) {\n  return `Hello, ${name}!`;\n}'
                : elemType === 'markdown'
                ? '## Slide Heading\n- First key point\n- Second `inline` point'
                : elemType === 'callout'
                ? 'Key takeaway: highlight important theorems or notes here.'
                : elemType === 'quote'
                ? 'Simplicity is prerequisite for reliability.\n— Edsger W. Dijkstra'
                : elemType === 'stat'
                ? '99.4%\nModel Accuracy'
                : elemType === 'badge'
                ? 'NEW RELEASE'
                : elemType === 'chart'
                ? 'Q1: 45\nQ2: 72\nQ3: 64\nQ4: 92'
                : elemType === 'table'
                ? 'Metric | Baseline | Proposed\nLatency | 42 ms | 11 ms\nThroughput | 1.2k/s | 4.8k/s'
                : elemType;
            const inner = info && info !== '' ? info : defaultInner;
            const defaultWidth = elemType === 'table'
                ? 460
                : elemType === 'callout' || elemType === 'quote'
                ? 400
                : elemType === 'chart'
                ? 360
                : elemType === 'badge'
                ? 150
                : defaultSV.width;
            const defaultHeight = elemType === 'table'
                ? 180
                : elemType === 'chart'
                ? 220
                : elemType === 'callout' || elemType === 'quote'
                ? 120
                : elemType === 'badge'
                ? 48
                : defaultSV.height;
            const initialStyle: StyleMap = elemType === 'badge'
                ? { background: '#b85d38', color: '#fffdf9', borderRadius: '999px', fontWeight: 'bold', fontSize: '14px' }
                : {};
            slide.elements.push({
                id: eid,
                name: elemType,
                x: defaultSV.x,
                y: defaultSV.y,
                width: defaultWidth,
                height: defaultHeight,
                rotation: 0,
                step: 0,
                animation: 'fade-in',
                inner,
                style: initialStyle,
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
                step: source.step ?? 0,
                animation: source.animation ?? 'fade-in',
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
                step: source.step ?? 0,
                animation: source.animation ?? 'fade-in',
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
                step: draft.clipboard.step ?? 0,
                animation: draft.clipboard.animation ?? 'fade-in',
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
        }, false);
    }, [updateDeck]);

    const setEditingMode = useCallback((editing: boolean) => {
        updateDeck((draft) => {
            draft.editingMode = editing;
        }, false);
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
                setDeckTitle,
                setFrameId,
                setPresenting,
                advancePresentation,
                retreatPresentation,
                addSlide,
                addTemplateSlide,
                loadExampleDeck,
                deleteSlide,
                duplicateSlide,
                moveSlide,
                setSlideBackground,
                setSlideTransition,
                setSlideCustomCode,
                setSlideNotes,
                addElement,
                updateElement,
                updateElementStyle,
                deleteElement,
                duplicateActiveElement,
                copyActiveElement,
                pasteClipboardElement,
                undo,
                redo,
                canUndo: past.length > 0,
                canRedo: future.length > 0,
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
