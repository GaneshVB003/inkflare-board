// src/types.ts
import Konva from 'konva';
import React from 'react';

// ... (Keep Tool, LineData, StrokeData, TextData definitions from previous correct version) ...
export type Tool = 'select' | 'pen' | 'eraser' | 'stroke-eraser' | 'handwriting';
export interface LineData { id: string; tool: 'pen' | 'eraser'; points: number[]; color: string; strokeWidth: number; }
export interface StrokeData { id: string; points: number[]; }
export interface TextData { id: string; text: string; x: number; y: number; width: number; fontSize: number; fontFamily: string; fill: string; }

// NEW: Structure for storing history states
export interface HistoryState {
    lines: LineData[];
    texts: TextData[];
}

// --- Adjusted WhiteboardCanvasProps ---
export interface WhiteboardCanvasProps {
  selectedTool: Tool; selectedColor: string; strokeWidth: number; backgroundColor: string;
  stageRef: React.RefObject<Konva.Stage | null>;
  lines: LineData[]; setLines: React.Dispatch<React.SetStateAction<LineData[]>>; // Needed for erasing
  texts: TextData[]; setTexts: React.Dispatch<React.SetStateAction<TextData[]>>; // Needed for erasing
  tempStrokes: StrokeData[]; setTempStrokes: React.Dispatch<React.SetStateAction<StrokeData[]>>;
  isDrawing: React.MutableRefObject<boolean>;
  currentStrokeGroup: React.MutableRefObject<StrokeData[] | null>;
  handleSelectShape: (id: string | null) => void;
  handleRecognizeHandwriting: (strokes: StrokeData[]) => void; // Passed FROM App
  scale: number; stagePos: {x: number; y: number};
  setStagePos: React.Dispatch<React.SetStateAction<{x: number; y: number}>>;
  onWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
}

// --- Adjusted Toolbar Props ---
export interface ToolbarProps {
  selectedTool: Tool; setSelectedTool: (tool: Tool) => void;
  selectedColor: string; setSelectedColor: (color: string) => void;
  strokeWidth: number; setStrokeWidth: (width: number) => void;
  backgroundColor: string; setBackgroundColor: (color: string) => void;
  selectedHandwritingFont: string; setSelectedHandwritingFont: (fontFamily: string) => void;
  handleClear: () => void; handleSave: () => void;
  // --- NEW Props ---
  canUndo: boolean; handleUndo: () => void;
  canRedo: boolean; handleRedo: () => void;
  canBeautify: boolean; handleBeautify: () => void; // Trigger for beautify button
}