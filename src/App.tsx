import { useState, useRef, useCallback, useEffect } from 'react';
import Konva from 'konva';
import { v4 as uuidv4 } from 'uuid';

import Toolbar from './components/Toolbar';
import WhiteboardCanvas from './components/WhiteboardCanvas';
// Make sure paths are correct for your structure
import type { LineData, TextData, StrokeData, Tool, HistoryState } from './types';
import './App.css';

// Limit history stack size for performance
const MAX_HISTORY_SIZE = 50;

function App() {
  // --- State ---
  const [selectedTool, setSelectedTool] = useState<Tool>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [isToolbarVisible, setIsToolbarVisible] = useState<boolean>(true);
  const [selectedHandwritingFont, setSelectedHandwritingFont] = useState<string>('Arial, sans-serif');

  // Content state (Now use objects for history)
  const [currentState, setCurrentState] = useState<HistoryState>({ lines: [], texts: [] });
  const [tempStrokes, setTempStrokes] = useState<StrokeData[]>([]);

  // History state
  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);

  // State for selection & beautify trigger
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastHandwritingStrokes, setLastHandwritingStrokes] = useState<StrokeData[] | null>(null);

  // Zoom/Pan state
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // --- Refs ---
  const stageRef = useRef<Konva.Stage | null>(null);
  const isDrawing = useRef(false);
  const currentStrokeGroup = useRef<StrokeData[] | null>(null);
  // Ref to track if state update is due to undo/redo to prevent loop
  const isRestoringHistory = useRef(false);

  // --- History Management ---

  // Helper to update state AND push previous state to undo stack
  const updateStateWithHistory = useCallback((newState: Partial<HistoryState>) => {
    if (isRestoringHistory.current) { // Don't record history when restoring it
       isRestoringHistory.current = false; // Reset flag
       setCurrentState(prev => ({ ...prev, ...newState }));
       return;
    }

    // Add current state to undo stack BEFORE updating
    setUndoStack(prevStack => {
        const newStack = [{...currentState}, ...prevStack];
         // Limit stack size
        if (newStack.length > MAX_HISTORY_SIZE) {
           newStack.length = MAX_HISTORY_SIZE;
         }
        return newStack;
    });
    // Clear redo stack on new action
    setRedoStack([]);
    // Update current state
    setCurrentState(prev => ({ ...prev, ...newState }));
     // Clear temporary beautify cache on new action
     setLastHandwritingStrokes(null);
  }, [currentState]); // Dependency on current state is crucial

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return; // Nothing to undo

    const previousState = undoStack[0]; // Get the last saved state
    const newUndoStack = undoStack.slice(1); // Remove it from undo

    // Add current state to redo stack BEFORE reverting
    setRedoStack(prevRedo => [currentState, ...prevRedo]);

    isRestoringHistory.current = true; // Set flag
    setCurrentState(previousState); // Revert to previous state
    setUndoStack(newUndoStack); // Update undo stack
    setSelectedIds([]); // Clear selection on undo
  }, [undoStack, redoStack, currentState]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return; // Nothing to redo

    const nextState = redoStack[0]; // Get the state to restore
    const newRedoStack = redoStack.slice(1); // Remove it from redo

    // Add current state to undo stack BEFORE applying redo
    setUndoStack(prevUndo => [currentState, ...prevUndo]);

    isRestoringHistory.current = true; // Set flag
    setCurrentState(nextState); // Restore the "future" state
    setRedoStack(newRedoStack); // Update redo stack
    setSelectedIds([]); // Clear selection on redo
  }, [redoStack, undoStack, currentState]);


  // --- Other Handlers ---
  const handleClear = useCallback(() => {
    if (window.confirm("Are you sure? This cannot be undone easily (will clear history).")) {
      // Clear history along with state
      updateStateWithHistory({ lines: [], texts: [] }); // Record the clear action itself if desired, or reset stacks:
      // setCurrentState({ lines: [], texts: [] });
      // setUndoStack([]);
      // setRedoStack([]);
      // --- Lets record it:
       updateStateWithHistory({ lines: [], texts: [] });

      setSelectedIds([]);
      setTempStrokes([]);
      setLastHandwritingStrokes(null);
    }
  }, [updateStateWithHistory]); // Use history updating function

  const handleSave = useCallback(() => { /* ... save logic same as before ... */
    if (!stageRef.current) return; const stage = stageRef.current;
    const dataURL = stage.toDataURL({ mimeType: 'image/jpeg', quality: 0.9, pixelRatio: 2 });
    const link = document.createElement('a'); link.href = dataURL; link.download = 'inkflare-board.jpg';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }, [stageRef]);

  const handleSelectShape = useCallback((id: string | null) => { /* ... selection logic same ... */
    if (selectedTool !== 'select') { setSelectedIds([]); return; }
    if (id === null) { setSelectedIds([]); } else { setSelectedIds([id]); }
  }, [selectedTool]);

   // Use new function for setting lines/text state with history:
   const setLinesWithHistory = useCallback((newLines: LineData[] | ((prevLines: LineData[]) => LineData[])) => {
        const resolvedLines = typeof newLines === 'function' ? newLines(currentState.lines) : newLines;
        updateStateWithHistory({ lines: resolvedLines });
    }, [updateStateWithHistory, currentState.lines]);

    const setTextsWithHistory = useCallback((newTexts: TextData[] | ((prevTexts: TextData[]) => TextData[])) => {
        const resolvedTexts = typeof newTexts === 'function' ? newTexts(currentState.texts) : newTexts;
        updateStateWithHistory({ texts: resolvedTexts });
    }, [updateStateWithHistory, currentState.texts]);


  // Delete selected items using history
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

       // Handle Ctrl+Z for Undo
       if (event.ctrlKey && event.key.toLowerCase() === 'z') {
          event.preventDefault();
          handleUndo();
           return; // Stop further processing
       }

       // Handle Ctrl+Y or Ctrl+Shift+Z for Redo
       if (event.ctrlKey && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))) {
           event.preventDefault();
           handleRedo();
           return; // Stop further processing
       }

      // Handle Delete/Backspace for selected items
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIds.length > 0) {
        event.preventDefault();
         // Calculate the next state after deletion
         const nextLines = currentState.lines.filter(line => !selectedIds.includes(line.id));
         const nextTexts = currentState.texts.filter(text => !selectedIds.includes(text.id));
         // Update state using the history helper
        updateStateWithHistory({ lines: nextLines, texts: nextTexts });
        setSelectedIds([]); // Clear selection
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // Add handleUndo/handleRedo and currentState to dependency array for correct closure
  }, [selectedIds, updateStateWithHistory, handleUndo, handleRedo, currentState]);

  // --- Handwriting & Beautify Logic ---
  const handleRecognizeHandwriting = useCallback((strokes: StrokeData[]) => {
    if (!strokes || strokes.length === 0) return;
    console.log("Recognizing (Simulated):", strokes);
    let minX = Infinity, minY = Infinity;
    strokes.forEach(stroke => {
      for (let i = 0; i < stroke.points.length; i += 2) { minX = Math.min(minX, stroke.points[i]); minY = Math.min(minY, stroke.points[i + 1]); }
    });
    const placeholderText = `"Simulated" text.\nFont: ${selectedHandwritingFont.split(',')[0]}`;
    const newText: TextData = {
      id: uuidv4(), text: placeholderText,
      x: minX === Infinity ? 50 : minX, y: minY === Infinity ? 50 : minY,
      width: 200, fontSize: 20, fontFamily: selectedHandwritingFont, fill: selectedColor,
    };
    // Use history helper to add the text object
    setTextsWithHistory(prev => [...prev, newText]);
    // We don't need to manage tempStrokes/currentStrokeGroup here as they are drawing viz state
    setLastHandwritingStrokes(null); // Clear beautify cache after processing
  }, [selectedColor, selectedHandwritingFont, setTextsWithHistory]);

  // Called AFTER drawing is finished (mouse up) for Handwriting tool
  const cacheLastHandwriting = useCallback((strokes: StrokeData[]) => {
      if(strokes && strokes.length > 0){
          setLastHandwritingStrokes([...strokes]); // Store a copy
           // Automatically trigger recognition (or keep separate for button?)
           // For now, let's trigger it automatically *and* cache for button
           handleRecognizeHandwriting(strokes);
      }
       setTempStrokes([]);
       currentStrokeGroup.current = null;
  }, [handleRecognizeHandwriting]); // Need the recognizer

   // Handler for the dedicated Beautify button
  const handleBeautifyClick = useCallback(() => {
       if(lastHandwritingStrokes && lastHandwritingStrokes.length > 0){
          console.log("Beautifying cached strokes");
          handleRecognizeHandwriting(lastHandwritingStrokes); // Process the stored strokes
          setLastHandwritingStrokes(null); // Clear cache after beautifying
      } else {
           console.log("No recent handwriting strokes to beautify.");
           // Maybe show a user message?
       }
   }, [lastHandwritingStrokes, handleRecognizeHandwriting]);


    // --- Zoom/Pan --- (Handler is the same as before)
     const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => { /* ... same wheel logic ... */
         e.evt.preventDefault(); if (!stageRef.current) return;
        const stage = stageRef.current; const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition(); if (!pointer) return;
        const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
        const direction = e.evt.deltaY > 0 ? -1 : 1; const scaleBy = 1.05;
        let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        newScale = Math.max(0.1, Math.min(newScale, 10.0));
        const newPos = { x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale };
        setScale(newScale); setStagePos(newPos);
      }, []);

  // Determine if Undo/Redo is possible
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;
   const canBeautify = lastHandwritingStrokes !== null && lastHandwritingStrokes.length > 0;

  // --- Component Rendering ---
  return (
    <div className="AppContainer">
      <div className={`toolbar-wrapper ${isToolbarVisible ? '' : 'hidden'}`}>
        <Toolbar
          // Pass all props including Undo/Redo handlers and states
          selectedTool={selectedTool} setSelectedTool={setSelectedTool}
          selectedColor={selectedColor} setSelectedColor={setSelectedColor}
          strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
          backgroundColor={backgroundColor} setBackgroundColor={setBackgroundColor}
          selectedHandwritingFont={selectedHandwritingFont} setSelectedHandwritingFont={setSelectedHandwritingFont}
          handleClear={handleClear} handleSave={handleSave}
          canUndo={canUndo} handleUndo={handleUndo} // Pass undo state/handler
          canRedo={canRedo} handleRedo={handleRedo} // Pass redo state/handler
          canBeautify={canBeautify} handleBeautify={handleBeautifyClick} // Pass beautify state/handler
        />
      </div>
      {/* Toolbar Toggle */}
      <button onClick={() => setIsToolbarVisible(!isToolbarVisible)} className="toggle-toolbar-button"
              title={isToolbarVisible ? "Hide Toolbar" : "Show Toolbar"} style={{ left: isToolbarVisible ? '75px' : '15px' }}>
           {isToolbarVisible ? '<' : '>'}
      </button>
      {/* Branding */}
      <div className="top-left-branding" style={{ left: isToolbarVisible ? '75px' : '60px' }}> Inkflare Board </div>
      {/* Canvas */}
      <main className="main-content">
        <WhiteboardCanvas
          // Pass current state for rendering
          lines={currentState.lines}
          texts={currentState.texts}
          // Pass setters and required handlers that MODIFY state via history
          setLines={setLinesWithHistory}
          setTexts={setTextsWithHistory} // Needed for stroke eraser
          // Pass other props...
          selectedTool={selectedTool} selectedColor={selectedColor}
          strokeWidth={strokeWidth} backgroundColor={backgroundColor}
          stageRef={stageRef}
          tempStrokes={tempStrokes} setTempStrokes={setTempStrokes}
          isDrawing={isDrawing} currentStrokeGroup={currentStrokeGroup}
          handleSelectShape={handleSelectShape}
          handleRecognizeHandwriting={cacheLastHandwriting} // Use caching wrapper
          scale={scale} stagePos={stagePos} setStagePos={setStagePos}
          onWheel={handleWheel}
        />
      </main>
      {/* Zoom Indicator */}
      <div className="zoom-indicator"> {Math.round(scale * 100)}% </div>
    </div>
  );
}
export default App;