import React, { useEffect, useRef } from 'react';
import { Stage, Layer, Line, Text, Rect } from 'react-konva';
import Konva from 'konva';
import { v4 as uuidv4 } from 'uuid';
// Use correct path to import types
import type { LineData, TextData, StrokeData, Tool, WhiteboardCanvasProps } from '../types';

// Define HWR timeout delay
const HWR_TIMEOUT_MS = 1000; // milliseconds

// Component Definition
const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  // Destructure all props defined in types.ts -> WhiteboardCanvasProps
  selectedTool, selectedColor, strokeWidth, backgroundColor,
  stageRef, lines, setLines, texts, setTexts, // Added setTexts back
  tempStrokes, setTempStrokes,
  isDrawing, currentStrokeGroup,
  handleSelectShape, // Use ID based handler name
  scale, stagePos, setStagePos, onWheel, handleRecognizeHandwriting
}) => {

    const isDraggingStage = useRef(false);
    const hwrTimeoutRef = useRef<number | null>(null); // Use number | null for browser env

    // --- Event Handlers ---
    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (hwrTimeoutRef.current !== null) window.clearTimeout(hwrTimeoutRef.current); // Use window. for browser env

        const isPanTrigger = (e.evt instanceof MouseEvent && e.evt.button === 2) || e.evt.altKey;
        if (isPanTrigger && stageRef.current && (e.target === stageRef.current || e.target.hasName('background-rect'))) {
            isDraggingStage.current = true; stageRef.current.container().style.cursor = 'grabbing';
            e.evt.preventDefault(); return;
        }
        if (selectedTool === 'stroke-eraser') {
            isDrawing.current = true; eraseLinesUnderPointer(e); e.evt.preventDefault(); return;
        }
        if (selectedTool === 'select') { e.evt.preventDefault(); return; } // Select handled on click

        isDrawing.current = true;
        const stage = e.target.getStage(); if (!stage) return;
        const pos = stage.getPointerPosition(); if (!pos) return;
        const currentId = uuidv4();

        if (selectedTool === 'handwriting') {
             const newStroke: StrokeData = { id: currentId, points: [pos.x, pos.y] };
             currentStrokeGroup.current = [newStroke];
             setTempStrokes(currentStrokeGroup.current);
        } else if (selectedTool === 'pen' || selectedTool === 'eraser') {
            const toolType = selectedTool as 'pen' | 'eraser';
            setLines((prevLines: LineData[]) => [ // Explicitly type prevLines
                ...prevLines,
                { id: currentId, tool: toolType, points: [pos.x, pos.y], color: selectedColor, strokeWidth: strokeWidth, },
            ]);
        }
        e.evt.preventDefault();
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
          if (isDraggingStage.current) { e.evt.preventDefault(); return; }
          if (selectedTool === 'stroke-eraser' && isDrawing.current) {
             eraseLinesUnderPointer(e); e.evt.preventDefault(); return;
          }
          if (!isDrawing.current || selectedTool === 'select') return;

        const stage = e.target.getStage(); if (!stage) return;
        const point = stage.getPointerPosition(); if (!point) return;

        if (selectedTool === 'handwriting') {
            if (currentStrokeGroup.current?.length) {
                const lastStroke = currentStrokeGroup.current[currentStrokeGroup.current.length - 1];
                lastStroke.points = lastStroke.points.concat([point.x, point.y]);
                setTempStrokes([...currentStrokeGroup.current]);
            }
        } else if (selectedTool === 'pen' || selectedTool === 'eraser') {
             setLines((prevLines: LineData[]) => { // Explicitly type prevLines
                 const lastLineIndex = prevLines.length - 1;
                 if (lastLineIndex < 0 || prevLines[lastLineIndex].tool !== selectedTool) return prevLines;
                 const lastLine = { ...prevLines[lastLineIndex] };
                 lastLine.points = lastLine.points.concat([point.x, point.y]);
                 const newLines = [...prevLines]; newLines[lastLineIndex] = lastLine; return newLines;
             });
        }
        e.evt.preventDefault();
    };

    const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
         if (isDraggingStage.current) {
             isDraggingStage.current = false;
             if(stageRef.current) stageRef.current.container().style.cursor = 'default';
             e.evt.preventDefault(); return;
          }
         if (isDrawing.current) {
              isDrawing.current = false;
               if (selectedTool === 'handwriting' && currentStrokeGroup.current) {
                   const strokesToRecognize = [...currentStrokeGroup.current];
                   if (hwrTimeoutRef.current !== null) window.clearTimeout(hwrTimeoutRef.current);
                   hwrTimeoutRef.current = window.setTimeout(() => { // Use window.setTimeout
                         handleRecognizeHandwriting(strokesToRecognize); // Calls App's cache+recognize handler
                         currentStrokeGroup.current = null; hwrTimeoutRef.current = null;
                   }, HWR_TIMEOUT_MS);
               } else {
                   currentStrokeGroup.current = null; setTempStrokes([]); // Clear temps on non-HWR mouseup
               }
         }
         e.evt.preventDefault();
    };

   // Stroke Eraser Helper
   const eraseLinesUnderPointer = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        const stage = e.target.getStage(); if(!stage) return;
        const pos = stage.getPointerPosition(); if(!pos) return;
        const shape = stage.getIntersection(pos);
        if (shape?.attrs.id) {
            const idToDelete: string = shape.attrs.id;
            // Call the state setters received from App directly
            setLines((prevLines: LineData[]) => prevLines.filter((line: LineData) => line.id !== idToDelete));
            setTexts((prevTexts: TextData[]) => prevTexts.filter((text: TextData) => text.id !== idToDelete));
             // Deselect if deleted? handleSelectShape(null); // Maybe handled by App on state change
        }
    };

    // --- Side Effects ---
    useEffect(() => { return () => { if (hwrTimeoutRef.current !== null) window.clearTimeout(hwrTimeoutRef.current); }},[]); // Use window.

    useEffect(() => { // Cursor Style
         const stageContainer = stageRef.current?.container(); if (!stageContainer) return;
         if(isDraggingStage.current) { stageContainer.style.cursor = 'grabbing'; return;}
         let cursor = 'default';
         switch (selectedTool) { /* ... case statements same as before ... */
             case 'pen': case 'handwriting': cursor = 'crosshair'; break;
             case 'eraser': cursor = 'cell'; break;
             case 'stroke-eraser': cursor = 'not-allowed'; break;
             case 'select': cursor = 'default'; break;
         } stageContainer.style.cursor = cursor;
    }, [selectedTool, stageRef]);

  // --- Rendering ---
  return (
    <Stage ref={stageRef} width={window.innerWidth} height={window.innerHeight}
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}
      onWheel={onWheel} draggable={selectedTool === 'select'}
      onDragStart={(e) => { if (e.target === stageRef.current) { isDraggingStage.current = true; stageRef.current?.container().style.setProperty('cursor','grabbing'); }}}
      onDragEnd={(e) => { isDraggingStage.current = false; setStagePos(e.target.position()); stageRef.current?.container().style.setProperty('cursor','default');}}
      scaleX={scale} scaleY={scale} x={stagePos.x} y={stagePos.y}
      onContextMenu={(e) => e.evt.preventDefault()}
      onClick={(e) => { if (e.target === e.target.getStage() && selectedTool === 'select') handleSelectShape(null); }}>
      <Layer>
        <Rect x={-10000} y={-10000} width={20000} height={20000} fill={backgroundColor} listening={false} name="background-rect"/>
        {/* Render lines */}
        {lines.map((line: LineData) => ( // Add type
           <Line key={line.id} id={line.id} points={line.points} stroke={line.color} strokeWidth={line.strokeWidth}
                 tension={0.5} lineCap="round" lineJoin="round"
                 globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                 onClick={() => handleSelectShape(line.id)} onTap={() => handleSelectShape(line.id)}
                 onMouseEnter={(e) => { if (selectedTool === 'select') e.target.getStage()?.container().style.setProperty('cursor', 'pointer'); }}
                 onMouseLeave={(e) => { if (selectedTool === 'select') e.target.getStage()?.container().style.setProperty('cursor', 'default');}} /> ))}
        {/* Render temp handwriting */}
        {tempStrokes.map((stroke: StrokeData, index: number) => ( // Add types
             <Line key={`temp-${stroke.id}-${index}`} points={stroke.points} stroke={selectedColor} strokeWidth={strokeWidth}
                   tension={0.5} lineCap="round" lineJoin="round" globalCompositeOperation='source-over' listening={false}/> ))}
        {/* Render texts */}
        {texts.map((text: TextData) => ( // Add type
             <Text key={text.id} id={text.id} x={text.x} y={text.y} text={text.text}
                   fontSize={text.fontSize} fontFamily={text.fontFamily} fill={text.fill} width={text.width}
                   draggable={selectedTool === 'select'}
                   onClick={() => handleSelectShape(text.id)} onTap={() => handleSelectShape(text.id)}
                   onMouseEnter={(e) => { if (selectedTool === 'select') e.target.getStage()?.container().style.setProperty('cursor', 'pointer'); }}
                   onMouseLeave={(e) => { if (selectedTool === 'select') e.target.getStage()?.container().style.setProperty('cursor', 'default');}}
                   onDragEnd={(e) => { // Update text position state in App.tsx
                        const newPos = e.target.position();
                         setTexts(prevTexts => prevTexts.map(t => t.id === text.id ? { ...t, x: newPos.x, y: newPos.y } : t ));
                    }} /> ))}
      </Layer>
    </Stage>
  );
};
export default WhiteboardCanvas; // Ensure default export