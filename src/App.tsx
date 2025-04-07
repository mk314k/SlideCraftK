import './App.css';
import React, { useState, useRef, useEffect } from 'react';
import { KComponents } from './component/component';
import { defaultFileName, KSlideSet, SLIDE_WIDTH, SLIDE_HEIGHT } from './frame';
import { downloadFile, handleFullScreen, applySlideCustomCode, renderMarkdownToHtml } from './component/utility';
import { KatexRenderer } from './katexComponent';
import { Tools } from './tools';
import { DeckProvider, useDeck, SlideTemplateType, ExampleDeckId } from './context/DeckContext';

const SlideSet: React.FC<{ onOpenDev: (slideIndex: number, tab: DevTabType) => void }> = ({ onOpenDev }) => {
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
            {(slide.customCss.trim() !== '' || slide.customJs.trim() !== '') && (
              <div className="mini-thumb-badges" onClick={(e) => e.stopPropagation()}>
                {slide.customCss.trim() !== '' && (
                  <button
                    type="button"
                    className="slide-Attachment-chip css-chip"
                    data-tooltip="Edit Slide Custom CSS"
                    title="Edit Slide Custom CSS"
                    onClick={() => onOpenDev(i, 'style')}
                  >
                    <i className="material-icons">star</i>
                    <span>CSS</span>
                  </button>
                )}
                {slide.customJs.trim() !== '' && (
                  <button
                    type="button"
                    className="slide-Attachment-chip code-chip"
                    data-tooltip="Edit Slide Custom Code"
                    title="Edit Slide Custom Code"
                    onClick={() => onOpenDev(i, 'code')}
                  >
                    <i className="material-icons">code</i>
                    <span>Code</span>
                  </button>
                )}
              </div>
            )}
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

const SlideView: React.FC<{
  zoomFactor: number;
  inspectorOpen: boolean;
  onOpenDevTab: (tab: DevTabType) => void;
}> = ({ zoomFactor, inspectorOpen, onOpenDevTab }) => {
  const { state, currentSlide, advancePresentation, retreatPresentation, setActiveEID, setPresenting } = useDeck();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [laserEnabled, setLaserEnabled] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const updateScale = () => {
      const isFs = Boolean(document.fullscreenElement);
      setPresenting(isFs);
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const pad = isFs ? 0 : 24;
        const availW = Math.max(100, rect.width - pad);
        const availH = Math.max(100, rect.height - pad);
        const nextFit = Math.min(availW / SLIDE_WIDTH, availH / SLIDE_HEIGHT);
        setFitScale(nextFit);
      }
    };
    updateScale();
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updateScale())
      : null;
    if (observer && stageRef.current) {
      observer.observe(stageRef.current);
    }
    window.addEventListener('resize', updateScale);
    document.addEventListener('fullscreenchange', updateScale);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateScale);
      document.removeEventListener('fullscreenchange', updateScale);
    };
  }, [setPresenting, inspectorOpen]);

  const effectiveScale = state.presenting ? fitScale : fitScale * zoomFactor;
  useEffect(() => {
    KSlideSet.scale = effectiveScale;
  }, [effectiveScale]);

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
      className={`slide-stage${inspectorOpen ? ' slide-stage-with-inspector' : ''}${state.presenting ? ' slide-stage-presenting' : ''}${state.presenting && laserEnabled ? ' laser-cursor-hidden' : ''}`}
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
          transform: `scale(${effectiveScale})`,
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
      {!state.presenting && (currentSlide.customCss.trim() !== '' || currentSlide.customJs.trim() !== '') && (
        <div className="stage-dev-badges" onClick={(e) => e.stopPropagation()}>
          {currentSlide.customCss.trim() !== '' && (
            <button
              type="button"
              className="slide-Attachment-chip css-chip stage-chip"
              data-tooltip="Click to edit custom CSS attached to this slide"
              onClick={() => onOpenDevTab('style')}
            >
              <i className="material-icons">star</i>
              <span>CSS</span>
            </button>
          )}
          {currentSlide.customJs.trim() !== '' && (
            <button
              type="button"
              className="slide-Attachment-chip code-chip stage-chip"
              data-tooltip="Click to edit custom Code attached to this slide"
              onClick={() => onOpenDevTab('code')}
            >
              <i className="material-icons">code</i>
              <span>Code</span>
            </button>
          )}
        </div>
      )}
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

const RightInspector: React.FC<{ isOpen: boolean; onToggle: () => void }> = ({ isOpen, onToggle }) => {
  const { state, currentSlide, updateElement, updateElementStyle, deleteElement, duplicateActiveElement } = useDeck();

  const activeElem = state.activeEID != null
    ? currentSlide.elements.find((el) => el.id === state.activeEID)
    : undefined;

  const isShape = activeElem && (activeElem.name === 'rect' || activeElem.name === 'circle' || activeElem.name === 'diamond' || activeElem.name === 'triangle' || activeElem.name === 'arrow' || activeElem.name === 'line');

        return (
            <aside className={`right-inspector-drawer${isOpen ? ' open' : ' collapsed'}`}>
              <button
                type="button"
                className="inspector-edge-tab"
                onClick={onToggle}
                title={isOpen ? 'Collapse Inspector' : 'Expand Inspector'}
                aria-label={isOpen ? 'Collapse Inspector' : 'Expand Inspector'}
              >
                <i className="material-icons">{isOpen ? 'chevron_right' : 'chevron_left'}</i>
              </button>
              {isOpen && (
                <div className="right-inspector-content">
                  <div className="right-inspector-header">
                    <span>Element Inspector</span>
                  </div>
                  {!activeElem ? (
                    <div className="right-inspector-empty">
                      <p>No element selected.</p>
                      <p>Click any element on the slide to inspect its position, size, rotation, and layer properties.</p>
                    </div>
                  ) : (
                    <div className="right-inspector-body">
                      <div className="inspector-badge">
                        <span>Type: <strong>{activeElem.name}</strong></span>
                        <span>ID: #{activeElem.id}</span>
                      </div>
                      <div className="inspector-align-bar">
                        <button
                          type="button"
                          title="Center Horizontally on Slide"
                          onClick={() =>
                            updateElement(activeElem.id, (el) => {
                              el.x = Math.round((SLIDE_WIDTH - el.width) / 2);
                            })
                          }
                        >
                          Center X
                        </button>
                        <button
                          type="button"
                          title="Center Vertically on Slide"
                          onClick={() =>
                            updateElement(activeElem.id, (el) => {
                              el.y = Math.round((SLIDE_HEIGHT - el.height) / 2);
                            })
                          }
                        >
                          Center Y
                        </button>
                      </div>
              <div className="inspector-grid">
                <label className="inspector-field">
                  <span>X</span>
                  <input
                    type="number"
                    value={activeElem.x}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      updateElement(activeElem.id, (el) => { el.x = val; });
                    }}
                  />
                </label>
                <label className="inspector-field">
                  <span>Y</span>
                  <input
                    type="number"
                    value={activeElem.y}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      updateElement(activeElem.id, (el) => { el.y = val; });
                    }}
                  />
                </label>
                <label className="inspector-field">
                  <span>W</span>
                  <input
                    type="number"
                    min={24}
                    value={activeElem.width}
                    onChange={(e) => {
                      const val = Math.max(24, parseInt(e.target.value, 10) || 24);
                      updateElement(activeElem.id, (el) => { el.width = val; });
                    }}
                  />
                </label>
                <label className="inspector-field">
                  <span>H</span>
                  <input
                    type="number"
                    min={24}
                    value={activeElem.height}
                    onChange={(e) => {
                      const val = Math.max(24, parseInt(e.target.value, 10) || 24);
                      updateElement(activeElem.id, (el) => { el.height = val; });
                    }}
                  />
                </label>
                <label className="inspector-field">
                  <span>Rot°</span>
                  <input
                    type="number"
                    value={activeElem.rotation ?? 0}
                    onChange={(e) => {
                      const val = ((parseInt(e.target.value, 10) || 0) % 360 + 360) % 360;
                      updateElement(activeElem.id, (el) => { el.rotation = val; });
                    }}
                  />
                </label>
                <label className="inspector-field">
                  <span>Opac</span>
                  <input
                    type="number"
                    min={0.1}
                    max={1}
                    step={0.1}
                    value={parseFloat(activeElem.style['opacity'] ?? '1') || 1}
                    onChange={(e) => {
                      const val = Math.min(1, Math.max(0.1, parseFloat(e.target.value) || 1));
                      updateElementStyle(activeElem.id, 'opacity', String(val));
                    }}
                  />
                </label>
                {!isShape && (
                  <label className="inspector-field">
                    <span>Rad</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={parseInt(activeElem.style['borderRadius'] ?? '12', 10) || 0}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        updateElementStyle(activeElem.id, 'borderRadius', `${val}px`);
                      }}
                    />
                  </label>
                )}
                <label className="inspector-field">
                  <span>Step</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={activeElem.step ?? 0}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      updateElement(activeElem.id, (el) => { el.step = val; });
                    }}
                  />
                </label>
              </div>
              <div className="inspector-actions">
                <button type="button" onClick={duplicateActiveElement}>
                  Duplicate
                </button>
                <button type="button" onClick={() => deleteElement(activeElem.id)}>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export type DevTabType = 'style' | 'code';

const DeveloperModal: React.FC<{
  isOpen: boolean;
  activeTab: DevTabType;
  setActiveTab: (tab: DevTabType) => void;
  onClose: () => void;
}> = ({ isOpen, activeTab, setActiveTab, onClose }) => {
  const { state, currentSlide, setSlideCustomCode } = useDeck();
  const [cssDraft, setCssDraft] = useState(currentSlide.customCss);
  const [codeDraft, setCodeDraft] = useState(currentSlide.customJs);
  const [runStatus, setRunStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    setCssDraft(currentSlide.customCss);
    setCodeDraft(currentSlide.customJs);
    setRunStatus(null);
  }, [state.curFrame, currentSlide.customCss, currentSlide.customJs, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    setSlideCustomCode('style', cssDraft);
    setSlideCustomCode('script', codeDraft);
    const res = applySlideCustomCode(state.curFrame, cssDraft, codeDraft);
    if (res.error) {
      setRunStatus({ type: 'err', msg: res.error });
    } else {
      setRunStatus({ type: 'ok', msg: 'Applied scoped CSS & Code to Slide ' + (state.curFrame + 1) });
    }
  };

  const handleClearCurrent = () => {
    if (activeTab === 'style') {
      setCssDraft('');
      setSlideCustomCode('style', '');
      applySlideCustomCode(state.curFrame, '', codeDraft);
    } else {
      setCodeDraft('');
      setSlideCustomCode('script', '');
      applySlideCustomCode(state.curFrame, cssDraft, '');
    }
    setRunStatus({ type: 'ok', msg: `Cleared custom ${activeTab === 'style' ? 'CSS' : 'Code'} on this slide.` });
  };

  const insertSnippet = (snippet: string) => {
    if (activeTab === 'style') {
      setCssDraft((prev) => (prev ? `${prev}\n${snippet}` : snippet));
    } else {
      setCodeDraft((prev) => (prev ? `${prev}\n${snippet}` : snippet));
    }
  };

  return (
    <div className="shortcuts-backdrop" onClick={onClose}>
      <div className="developer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="developer-modal-header">
          <div>
            <h3>Slide {state.curFrame + 1} — Developer Studio</h3>
            <p className="developer-subtitle">
              Scoped strictly to <code>#slide{state.curFrame}</code>. Global browser/network APIs are blocked for safety.
            </p>
          </div>
          <button type="button" onClick={onClose} title="Close Developer Studio">
            ×
          </button>
        </div>

        <div className="developer-tabs">
          <button
            type="button"
            className={`dev-tab-btn${activeTab === 'style' ? ' active' : ''}`}
            onClick={() => setActiveTab('style')}
          >
            <i className="material-icons" style={{ fontSize: '16px' }}>auto_awesome</i>
            Custom CSS {cssDraft.trim() ? '•' : ''}
          </button>
          <button
            type="button"
            className={`dev-tab-btn${activeTab === 'code' ? ' active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            <i className="material-icons" style={{ fontSize: '16px' }}>code</i>
            Slide Code {codeDraft.trim() ? '•' : ''}
          </button>
        </div>

        <div className="developer-workspace">
          <div className="developer-editor-col">
            {activeTab === 'style' ? (
              <textarea
                className="developer-textarea"
                placeholder={`/* Rules are automatically scoped to #slide${state.curFrame} */\nbutton {\n  box-shadow: 0 6px 18px rgba(184, 93, 56, 0.25);\n}`}
                value={cssDraft}
                onChange={(e) => setCssDraft(e.target.value)}
              />
            ) : (
              <textarea
                className="developer-textarea"
                placeholder={`// Available API: slide.onClick(id, fn), slide.setText(id, text), slide.setStyle(id, prop, val), StateVar, StyleVar, MultiStyleVar\nslide.onClick(0, () => {\n  slide.setStyle(0, "background", "#d97757");\n});`}
                value={codeDraft}
                onChange={(e) => setCodeDraft(e.target.value)}
              />
            )}
            {runStatus && (
              <div className={`developer-status ${runStatus.type}`}>
                {runStatus.msg}
              </div>
            )}
            <div className="developer-footer-actions">
              <button type="button" onClick={handleClearCurrent}>
                Clear {activeTab === 'style' ? 'CSS' : 'Code'}
              </button>
              <button type="button" className="present-primary-btn" onClick={handleApply}>
                Apply &amp; Run on Slide
              </button>
            </div>
          </div>

          <div className="developer-helper-col">
            <span className="developer-helper-title">Elements on Slide {state.curFrame + 1}</span>
            <div className="developer-elem-list">
              {currentSlide.elements.length === 0 && (
                <span className="tool-empty-hint">No elements on this slide yet.</span>
              )}
              {currentSlide.elements.map((el) => (
                <div key={el.id} className="developer-elem-chip">
                  <span>
                    <strong>#{el.id}</strong> ({el.name})
                  </span>
                  <button
                    type="button"
                    className="mini-action-btn"
                    title="Insert snippet for this element"
                    onClick={() => {
                      if (activeTab === 'style') {
                        insertSnippet(`#${el.id}div {\n  transform: scale(1.02);\n}`);
                      } else {
                        insertSnippet(
                          `slide.onClick(${el.id}, () => {\n  slide.setStyle(${el.id}, "background", "#d97757");\n});`
                        );
                      }
                    }}
                  >
                    + Insert
                  </button>
                </div>
              ))}
            </div>
            <span className="developer-helper-title">Quick Snippets</span>
            <div className="developer-snippets">
              {activeTab === 'style' ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(`button:hover {\n  transform: translateY(-2px);\n}`)
                    }
                  >
                    + Hover Lift Effect
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(`.katex {\n  color: #b85d38;\n}`)
                    }
                  >
                    + Highlight Math Color
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(
                        `let count = 0;\nslide.onClick(0, () => {\n  count += 1;\n  slide.setText(0, "Count: " + count);\n});`
                      )
                    }
                  >
                    + Click Counter
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(
                        `const color = slide.styleVar("#efe4d6", 0, "background");\nslide.onClick(0, () => color.transition("#d97757"));`
                      )
                    }
                  >
                    + StateBinder StyleVar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditorWorkspace: React.FC = () => {
  const {
    state,
    currentSlide,
    setDeckTitle,
    setFrameId,
    setSlideNotes,
    addElement,
    loadExampleDeck,
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
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [devTab, setDevTab] = useState<DevTabType>('code');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [zoomFactor, setZoomFactor] = useState(1);

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
      <SlideView
        zoomFactor={zoomFactor}
        inspectorOpen={inspectorOpen}
        onOpenDevTab={(tab) => {
          setDevTab(tab);
          setDevModalOpen(true);
        }}
      />
      <SlideSet
        onOpenDev={(slideIdx, tab) => {
          setFrameId(slideIdx);
          setDevTab(tab);
          setDevModalOpen(true);
        }}
      />
      <RightInspector isOpen={inspectorOpen} onToggle={() => setInspectorOpen((v) => !v)} />
      <div className="top-sect">
        <div className="top-sect-group">
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
        </div>
        <div className="top-sect-group">
          <button
            type="button"
            onClick={() => setZoomFactor((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
            title="Zoom Out"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setZoomFactor(1)}
            title="Reset Zoom to Fit"
          >
            {Math.round(zoomFactor * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoomFactor((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
            title="Zoom In"
          >
            +
          </button>
        </div>
        <div className="top-sect-group">
          <select
            className="examples-select"
            defaultValue=""
            data-tooltip="Load a pre-built example presentation"
            title="Load Example Presentation"
            onChange={(e) => {
              if (e.target.value) {
                loadExampleDeck(e.target.value as ExampleDeckId);
                e.target.value = '';
              }
            }}
          >
            <option value="" disabled>
              Examples…
            </option>
            <option value="showcase">Full Feature Showcase (4 slides)</option>
            <option value="calculus">Calculus & Fourier Series (3 slides)</option>
            <option value="algorithms">Algorithms & Flowcharts (2 slides)</option>
            <option value="statebinder">Interactive StateBinder Lab (2 slides)</option>
          </select>
          <button
            data-tooltip="Download .scs presentation file"
            onClick={() =>
              downloadFile(
                (state.title.trim() || defaultFileName) + '.scs',
                saveDeck()
              )
            }
          >
            Save
          </button>
          <label className="file-upload-btn" data-tooltip="Open a saved .scs file" title="Open .scs file">
            Open
            <input type="file" accept=".scs,application/json" onChange={handleLoad} style={{ display: 'none' }} />
          </label>
          <button onClick={() => setShowNotes((v) => !v)} data-tooltip="Toggle Speaker Notes" title="Toggle Speaker Notes">
            Notes
          </button>
          <button
            className={devModalOpen ? 'tool-active' : ''}
            onClick={() => {
              setDevTab(currentSlide.customCss.trim() && !currentSlide.customJs.trim() ? 'style' : 'code');
              setDevModalOpen(true);
            }}
            data-tooltip="Attach Scoped Slide CSS or Interactive Code"
            title="Developer Studio (Scoped CSS & Code)"
          >
            Developer
          </button>
          <button onClick={() => window.print()} data-tooltip="Print or Export to PDF" title="Export Deck to PDF via Print">
            PDF
          </button>
          <button onClick={() => setShowShortcuts(true)} data-tooltip="Keyboard Shortcuts (?)" title="Keyboard Shortcuts (?)">
            ?
          </button>
          <button className="present-primary-btn" data-tooltip="Enter Fullscreen Presentation" onClick={handleFullScreen}>
            Present
          </button>
        </div>
        {loadError && (
          <span className="load-error" role="alert" onClick={() => setLoadError(null)}>
            {loadError}
          </span>
        )}
      </div>
      <DeveloperModal
        isOpen={devModalOpen}
        activeTab={devTab}
        setActiveTab={setDevTab}
        onClose={() => setDevModalOpen(false)}
      />
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
            {slide.elements.map((el) => {
              const isShape = el.name === 'rect' || el.name === 'circle' || el.name === 'diamond' || el.name === 'triangle' || el.name === 'arrow' || el.name === 'line';
              const printStyle = { ...el.style };
              if (isShape || el.name === 'image') {
                delete printStyle.background;
                delete printStyle.strokeWidth;
                delete printStyle.strokeDasharray;
              }
              return (
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
                  background: isShape || el.name === 'image' || el.name === 'latex' ? 'transparent' : 'var(--surface)',
                  ...printStyle,
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
              );
            })}
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
