import './App.css';
import React, { useState, useRef, useEffect } from 'react';
import { KComponents } from './component/component';
import { defaultFileName, KSlideSet, SLIDE_WIDTH, SLIDE_HEIGHT } from './frame';
import { downloadFile, handleFullScreen, applySlideCustomCode } from './component/utility';
import { Tools } from './tools';
import { DeckProvider, useDeck, SlideTemplateType } from './context/DeckContext';

const SlideSet: React.FC = () => {
  const { state, setFrameId, addSlide, addTemplateSlide, deleteSlide, duplicateSlide, moveSlide } = useDeck();

  return (
    <div className="slideset">
      {state.slides.map((slide, i) => (
        <div
          key={`${i}ss`}
          className={`mini-card${state.curFrame === i ? ' mini-card-active' : ''}`}
          onClick={() => setFrameId(i)}
        >
          <div className="mini-thumb-viewport">
            <div
              className="mini-thumb-canvas"
              style={{
                background: slide.background,
                width: `${SLIDE_WIDTH}px`,
                height: `${SLIDE_HEIGHT}px`,
              }}
            >
              {slide.elements.map((el) => (
                <div
                  key={el.id}
                  className="mini-thumb-element"
                  style={{
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                    background: el.style['background'] ?? 'var(--background)',
                    color: el.style['color'] ?? '#111827',
                  }}
                >
                  {el.name === 'image' ? (
                    <img src={el.inner} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{el.name === 'latex' ? '∑ Math' : el.inner.slice(0, 24)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mini-card-footer">
            <span className="mini-card-label">{i + 1}</span>
            <div className="mini-card-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="mini-action-btn"
                title="Move Left"
                disabled={i === 0}
                onClick={() => moveSlide(i, i - 1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="mini-action-btn"
                title="Duplicate Slide"
                onClick={() => duplicateSlide(i)}
              >
                ⧉
              </button>
              <button
                type="button"
                className="mini-action-btn"
                title="Delete Slide"
                disabled={state.slides.length <= 1}
                onClick={() => deleteSlide(i)}
              >
                ×
              </button>
              <button
                type="button"
                className="mini-action-btn"
                title="Move Right"
                disabled={i === state.slides.length - 1}
                onClick={() => moveSlide(i, i + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      ))}
      <button className="mini" onClick={addSlide}>
        + Blank
      </button>
      <select
        className="template-select"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) {
            addTemplateSlide(e.target.value as SlideTemplateType);
            e.target.value = '';
          }
        }}
      >
        <option value="" disabled>
          + Template…
        </option>
        <option value="title">Title Slide</option>
        <option value="two-column">Two-Column</option>
        <option value="math-proof">Math Proof</option>
        <option value="interactive">Interactive Demo</option>
      </select>
    </div>
  );
};

const SlideView: React.FC = () => {
  const { state, currentSlide, setFrameId, setActiveEID, setPresenting } = useDeck();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const isFs = Boolean(document.fullscreenElement);
      setPresenting(isFs);
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
  }, [setPresenting]);

  useEffect(() => {
    if (!state.presenting) return;
    const handlePresentKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        if (state.curFrame < state.slides.length - 1) {
          setFrameId(state.curFrame + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (state.curFrame > 0) {
          setFrameId(state.curFrame - 1);
        }
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen();
        }
        setPresenting(false);
      }
    };
    window.addEventListener('keydown', handlePresentKeyDown);
    return () => window.removeEventListener('keydown', handlePresentKeyDown);
  }, [state.presenting, state.curFrame, state.slides.length, setFrameId, setPresenting]);

  useEffect(() => {
    applySlideCustomCode(state.curFrame, currentSlide.customCss, currentSlide.customJs);
  }, [state.curFrame, currentSlide.customCss, currentSlide.customJs]);

  return (
    <div
      id="presentation-stage"
      ref={stageRef}
      className={`slide-stage${state.presenting ? ' slide-stage-presenting' : ''}`}
      onClick={() => {
        if (state.presenting) {
          if (state.curFrame < state.slides.length - 1) {
            setFrameId(state.curFrame + 1);
          }
        } else {
          setActiveEID(null);
        }
      }}
    >
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
          if (state.presenting) return;
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
    currentSlide,
    setDeckTitle,
    setSlideNotes,
    addElement,
    duplicateActiveElement,
    copyActiveElement,
    pasteClipboardElement,
    undo,
    redo,
    canUndo,
    canRedo,
    saveDeck,
    loadDeck,
  } = useDeck();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

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
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (key === 'y') {
        event.preventDefault();
        redo();
      } else if (key === 'd') {
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
  }, [state.editingMode, duplicateActiveElement, copyActiveElement, pasteClipboardElement, undo, redo]);

  const handleAddElement = (elemType: string, info?: string) => {
    if (KComponents.has(elemType)) {
      addElement(elemType, info);
    }
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const baseName = file.name.replace(/\.scs$/i, '');
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          loadDeck(content);
          if (baseName) {
            setDeckTitle(baseName);
          }
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
        <input
          type="text"
          className="deck-title-input"
          value={state.title}
          placeholder="Presentation title"
          onChange={(e) => setDeckTitle(e.target.value)}
        />
        <button onClick={undo} disabled={!canUndo} title="Undo (Cmd/Ctrl+Z)">
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo} title="Redo (Cmd/Ctrl+Shift+Z)">
          Redo
        </button>
        <button
          onClick={() =>
            downloadFile(
              (state.title.trim() || defaultFileName) + '.scs',
              saveDeck()
            )
          }
        >
          Save
        </button>
        <input type="file" accept=".scs,application/json" onChange={handleLoad} />
        <button onClick={() => setShowNotes((v) => !v)} title="Toggle Speaker Notes">
          Notes
        </button>
        <button onClick={handleFullScreen}>Presentation</button>
        {loadError && (
          <span className="load-error" role="alert" onClick={() => setLoadError(null)}>
            {loadError}
          </span>
        )}
      </div>
      {showNotes && (
        <div className="speaker-notes-panel">
          <div className="speaker-notes-header">
            <span>Speaker Notes — Slide {state.curFrame + 1}</span>
            <button type="button" onClick={() => setShowNotes(false)}>
              ×
            </button>
          </div>
          <textarea
            className="speaker-notes-textarea"
            placeholder="Add speaker notes for this slide..."
            value={currentSlide.notes}
            onChange={(e) => setSlideNotes(e.target.value)}
          />
        </div>
      )}
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
