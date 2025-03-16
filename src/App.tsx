import './App.css';
import React, { useState, useRef, useEffect } from 'react';
import { KComponents } from './component/component';
import { defaultFileName, KSlideSet, SLIDE_WIDTH, SLIDE_HEIGHT } from './frame';
import { downloadFile, handleFullScreen, applySlideCustomCode, renderMarkdownToHtml } from './component/utility';
import { KatexRenderer } from './katexComponent';
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
  const { state, currentSlide, advancePresentation, retreatPresentation, setActiveEID, setPresenting } = useDeck();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [laserEnabled, setLaserEnabled] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);

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
        advancePresentation();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        retreatPresentation();
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setLaserEnabled((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen();
        }
        setPresenting(false);
        setLaserEnabled(false);
      }
    };
    window.addEventListener('keydown', handlePresentKeyDown);
    return () => window.removeEventListener('keydown', handlePresentKeyDown);
  }, [state.presenting, advancePresentation, retreatPresentation, setPresenting]);

  useEffect(() => {
    applySlideCustomCode(state.curFrame, currentSlide.customCss, currentSlide.customJs);
  }, [state.curFrame, currentSlide.customCss, currentSlide.customJs]);

  return (
    <div
      id="presentation-stage"
      ref={stageRef}
      className={`slide-stage${state.presenting ? ' slide-stage-presenting' : ''}${state.presenting && laserEnabled ? ' laser-cursor-hidden' : ''}`}
      onMouseMove={(e) => {
        if (state.presenting && laserEnabled) {
          setLaserPos({ x: e.clientX, y: e.clientY });
        }
      }}
      onClick={() => {
        if (state.presenting) {
          advancePresentation();
        } else {
          setActiveEID(null);
        }
      }}
    >
      <div
        key={`slide-frame-${state.curFrame}`}
        id={`slide${state.curFrame}`}
        style={{
          background: currentSlide.background,
          width: `${SLIDE_WIDTH}px`,
          height: `${SLIDE_HEIGHT}px`,
          transform: `scale(${scale})`,
        }}
        className={`slideview slide-transition-${currentSlide.transition ?? 'fade'}`}
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
      {state.presenting && (
        <>
          <div className="present-hud">
            <span className="present-slide-counter">
              {state.curFrame + 1} / {state.slides.length}
            </span>
            <button
              type="button"
              className={`present-laser-btn${laserEnabled ? ' active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setLaserEnabled((v) => !v);
              }}
              title="Toggle Laser Pointer (L)"
            >
              Laser (L)
            </button>
          </div>
          <div className="present-progress-track">
            <div
              className="present-progress-bar"
              style={{
                width: `${((state.curFrame + 1) / Math.max(1, state.slides.length)) * 100}%`,
              }}
            />
          </div>
          {laserEnabled && laserPos && (
            <div
              className="laser-dot"
              style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
            />
          )}
        </>
      )}
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
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (state.editingMode) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault();
        setShowShortcuts((v) => !v);
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
        <button onClick={() => window.print()} title="Export Deck to PDF via Print">
          PDF
        </button>
        <button onClick={() => setShowShortcuts(true)} title="Keyboard Shortcuts (?)">
          ?
        </button>
        <button onClick={handleFullScreen}>Presentation</button>
        {loadError && (
          <span className="load-error" role="alert" onClick={() => setLoadError(null)}>
            {loadError}
          </span>
        )}
      </div>
      {showShortcuts && (
        <div className="shortcuts-backdrop" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-header">
              <h3>Keyboard Shortcuts</h3>
              <button type="button" onClick={() => setShowShortcuts(false)}>
                ×
              </button>
            </div>
            <ul className="shortcuts-list">
              <li><kbd>Delete</kbd> / <kbd>Backspace</kbd> <span>Delete selected element</span></li>
              <li><kbd>Cmd/Ctrl + Z</kbd> <span>Undo</span></li>
              <li><kbd>Cmd/Ctrl + Shift + Z</kbd> <span>Redo</span></li>
              <li><kbd>Cmd/Ctrl + D</kbd> <span>Duplicate selected element</span></li>
              <li><kbd>Cmd/Ctrl + C / V</kbd> <span>Copy / Paste element</span></li>
              <li><kbd>Arrow Keys</kbd> (<kbd>Shift</kbd> for 10px) <span>Nudge selected element</span></li>
              <li><kbd>Double Click</kbd> <span>Edit element text / LaTeX / Code</span></li>
              <li><kbd>→</kbd> / <kbd>Space</kbd> / <kbd>←</kbd> <span>Navigate slides in Presentation Mode</span></li>
              <li><kbd>L</kbd> <span>Toggle Laser Pointer in Presentation Mode</span></li>
              <li><kbd>?</kbd> <span>Toggle this shortcuts guide</span></li>
            </ul>
          </div>
        </div>
      )}
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
      <div className="print-deck-container" aria-hidden="true">
        {state.slides.map((slide, sIdx) => (
          <div
            key={`print-slide-${sIdx}`}
            className="print-slide-page"
            style={{
              background: slide.background,
              width: `${SLIDE_WIDTH}px`,
              height: `${SLIDE_HEIGHT}px`,
            }}
          >
            {slide.elements.map((el) => (
              <div
                key={`print-el-${sIdx}-${el.id}`}
                className="element-container"
                style={{
                  position: 'absolute',
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                  background: 'var(--background)',
                  ...el.style,
                }}
              >
                {el.name === 'image' ? (
                  <img src={el.inner} alt="" className="element" />
                ) : el.name === 'latex' ? (
                  <KatexRenderer latex={el.inner} />
                ) : el.name === 'code' ? (
                  <pre className="element code-block-view">
                    <code>{el.inner}</code>
                  </pre>
                ) : el.name === 'markdown' ? (
                  <div
                    className="element markdown-view"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(el.inner) }}
                  />
                ) : (
                  <div
                    className="element"
                    dangerouslySetInnerHTML={{ __html: el.inner }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
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
