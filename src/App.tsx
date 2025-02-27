import './App.css';
import React, { useState, useRef, useEffect } from 'react';
import { KComponents } from './component/component';
import { defaultFileName, KSlideSet, SLIDE_WIDTH, SLIDE_HEIGHT } from './frame';
import { downloadFile, handleFullScreen, applySlideCustomCode } from './component/utility';
import { Tools } from './tools';
import { DeckProvider, useDeck } from './context/DeckContext';

const SlideSet: React.FC = () => {
  const { state, setFrameId, addSlide } = useDeck();

  return (
    <div className="slideset">
      {state.slides.map((_, i) => (
        <button
          className="mini"
          id={`${i}ss`}
          key={`${i}ss`}
          onClick={() => setFrameId(i)}
        >
          Frame {i}
        </button>
      ))}
      <button className="mini" onClick={addSlide}>
        Add
      </button>
    </div>
  );
};

const SlideView: React.FC = () => {
  const { state, currentSlide, setActiveEID } = useDeck();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const nextScale = Math.min(rect.width / SLIDE_WIDTH, rect.height / SLIDE_HEIGHT);
        setScale(nextScale);
        KSlideSet.scale = nextScale;
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    document.addEventListener('fullscreenchange', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      document.removeEventListener('fullscreenchange', updateScale);
    };
  }, []);

  useEffect(() => {
    applySlideCustomCode(state.curFrame, currentSlide.customCss, currentSlide.customJs);
  }, [state.curFrame, currentSlide.customCss, currentSlide.customJs]);

  return (
    <div ref={stageRef} className="slide-stage" onClick={() => setActiveEID(null)}>
      <div
        id={`slide${state.curFrame}`}
        style={{
          background: currentSlide.background,
          width: `${SLIDE_WIDTH}px`,
          height: `${SLIDE_HEIGHT}px`,
          transform: `scale(${scale})`,
        }}
        className="slideview"
        onClick={(e) => {
          e.stopPropagation();
          setActiveEID(null);
        }}
      >
        {currentSlide.elements.map((elemData) => {
          const Comp = KComponents.get(elemData.name);
          if (!Comp) return null;
          return (
            <Comp
              key={`${state.curFrame}-${elemData.id}`}
              eid={elemData.id}
              info={elemData.inner}
            />
          );
        })}
        {state.guides.map((g, idx) => (
          <div
            key={`${g.axis}-${g.position}-${idx}`}
            className={`alignment-guide alignment-guide-${g.axis}`}
            style={
              g.axis === 'vertical'
                ? { left: `${g.position}px` }
                : { top: `${g.position}px` }
            }
          />
        ))}
      </div>
    </div>
  );
};

const EditorWorkspace: React.FC = () => {
  const {
    state,
    addElement,
    duplicateActiveElement,
    copyActiveElement,
    pasteClipboardElement,
    saveDeck,
    loadDeck,
  } = useDeck();
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (state.editingMode) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod) return;
      const key = event.key.toLowerCase();
      if (key === 'd') {
        event.preventDefault();
        duplicateActiveElement();
      } else if (key === 'c') {
        event.preventDefault();
        copyActiveElement();
      } else if (key === 'v') {
        event.preventDefault();
        pasteClipboardElement();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [state.editingMode, duplicateActiveElement, copyActiveElement, pasteClipboardElement]);

  const handleAddElement = (elemType: string, info?: string) => {
    if (KComponents.has(elemType)) {
      addElement(elemType, info);
    }
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          loadDeck(content);
          setLoadError(null);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load .scs file.';
          console.error(message);
          setLoadError(message);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }
  };

  return (
    <div className="app-container">
      <Tools handleAddElement={handleAddElement} />
      <SlideView />
      <SlideSet />
      <div className="top-sect">
        <button onClick={() => downloadFile(defaultFileName + '.scs', saveDeck())}>
          Save
        </button>
        <input type="file" accept=".scs,application/json" onChange={handleLoad} />
        <button onClick={handleFullScreen}>Presentation</button>
        {loadError && (
          <span className="load-error" role="alert" onClick={() => setLoadError(null)}>
            {loadError}
          </span>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DeckProvider>
      <EditorWorkspace />
    </DeckProvider>
  );
};

export default App;
