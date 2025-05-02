import React from 'react';
// Use type import from shared types file
import type { Tool, ToolbarProps } from '../types'; // Correct path for types
import './Toolbar.css';

// Font styles (Ensure fonts are loaded!)
const FONT_STYLES: { name: string; family: string }[] = [
    { name: 'Default', family: 'Arial, sans-serif' },
    { name: 'Print', family: '"Comic Sans MS", cursive, sans-serif' },
    { name: 'Cursive', family: '"Dancing Script", cursive' },
    { name: 'Mono', family: '"Courier New", monospace'},
];

const PRESET_COLORS = [ '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#78716c', '#ffffff', '#dee2e6'];

// Toolbar Component using the imported ToolbarProps
const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool, setSelectedTool, selectedColor, setSelectedColor,
  strokeWidth, setStrokeWidth, backgroundColor, setBackgroundColor,
  selectedHandwritingFont, setSelectedHandwritingFont,
  handleClear, handleSave,
  canUndo, handleUndo, canRedo, handleRedo, // Undo/Redo props
  canBeautify, handleBeautify // Use the prop passed down
}) => {

  const handleColorClick = (color: string) => {
    setSelectedColor(color);
    if (selectedTool !== 'pen' && selectedTool !== 'handwriting') setSelectedTool('pen');
  };

  return (
    <div className="toolbar-container-vertical">
      {/* Top Tools Section */}
      <div className='tool-section'>
        {/* Select Tool */}
        <button className={`tool-button ${selectedTool === 'select' ? 'active' : ''}`} onClick={() => setSelectedTool('select')} title="Select / Move (V)">
           {/* SVG for Select */}
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.89a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 28.196 28.196 0 0 0 18.407-9.59.75.75 0 0 0 0-.819A28.197 28.197 0 0 0 3.478 2.404Z" /></svg>
        </button>
        {/* Pen Tool */}
        <button className={`tool-button ${selectedTool === 'pen' ? 'active' : ''}`} onClick={() => setSelectedTool('pen')} title="Pen (P)">
           {/* SVG for Pen */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
        </button>
        {/* Pixel Eraser */}
         <button className={`tool-button ${selectedTool === 'eraser' ? 'active' : ''}`} onClick={() => setSelectedTool('eraser')} title="Pixel Eraser (E)">
           {/* SVG for Eraser */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M12.962 2.069a.75.75 0 0 1 .943-.054l6 4.5a.75.75 0 0 1 .054.943l-6 8a.75.75 0 0 1-.996.054L3 7.557V17.25a.75.75 0 0 1-1.5 0V6.75a.75.75 0 0 1 .64-.741l9.132-3.217a.75.75 0 0 1 .74.03Zm1.173 1.067L6.07 7.229l6.374 4.781L18.93 8.94l-4.795-3.737Z" clipRule="evenodd" /><path d="M1.5 18.75a.75.75 0 0 0 0 1.5h15a.75.75 0 0 0 0-1.5h-15Z" /><path d="M22.5 18.75a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Z" /></svg>
        </button>
        {/* Stroke Eraser Tool */}
        <button className={`tool-button ${selectedTool === 'stroke-eraser' ? 'active' : ''}`} onClick={() => setSelectedTool('stroke-eraser')} title="Stroke Eraser (Delete Line)">
             {/* SVG for Stroke Eraser */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M3.75 3a.75.75 0 0 0-.75.75v16.5a.75.75 0 0 0 .75.75h16.5a.75.75 0 0 0 .75-.75V12.491a.75.75 0 0 0-.067-.31l-5.25-7.5a.75.75 0 0 0-.6-.381h-4.749L4.067 3.31a.75.75 0 0 0-.317-.31ZM9.71 4.5h3.937l4.043 5.775h-3.94l-4.04-5.775ZM5.25 4.938l3.838 5.48V19.5H5.25V4.937Z"/><path stroke="#555" strokeWidth="1.5" strokeLinecap='round' strokeLinejoin='round' d="M14 15 l 6 6 m 0 -6 l -6 6" /></svg>
        </button>
         {/* Handwriting Tool */}
         <button className={`tool-button ${selectedTool === 'handwriting' ? 'active' : ''}`} onClick={() => setSelectedTool('handwriting')} title="Handwriting Pen (H)">
            {/* SVG for Handwriting */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z"/><path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z"/></svg>
         </button>
         {/* Beautify Button */}
         <button className="tool-button" onClick={handleBeautify} title="Enhance Last Writing" disabled={!canBeautify}>
            ✨ {/* Or use a proper SVG icon */}
        </button>
      </div>
      {/* Stroke Width */}
      {(selectedTool === 'pen' || selectedTool === 'eraser' || selectedTool === 'handwriting') && (
           <div className='tool-section stroke-width-control' title={`Line width: ${strokeWidth}px`}><label htmlFor="toolbarStrokeWidth">📏</label><input type="range" id="toolbarStrokeWidth" min="1" max="50" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="stroke-slider-vertical"/></div> )}
      {/* Color Palette */}
      {(selectedTool === 'pen' || selectedTool === 'handwriting') && (
            <div className='tool-section color-palette'>{PRESET_COLORS.map(color => <button key={color} className={`color-swatch ${selectedColor === color ? 'active' : ''}`} style={{ backgroundColor: color }} onClick={() => handleColorClick(color)} title={color}/>)}<input type="color" value={selectedColor} onChange={(e) => handleColorClick(e.target.value)} className="color-picker-input" title="Custom Color"/></div> )}
      {/* Font Selector */}
      {selectedTool === 'handwriting' && (
          <div className="tool-section font-selector"><label htmlFor='fontStyleSelect' title="Select Font Style">🔤</label><select id='fontStyleSelect' title="Font Style" value={selectedHandwritingFont} onChange={(e) => setSelectedHandwritingFont(e.target.value)}>{FONT_STYLES.map(font => <option key={font.family} value={font.family} style={{ fontFamily: font.family }}>{font.name}</option>)}</select></div> )}
      {/* Background Color */}
       <div className='tool-section background-control'><label htmlFor="bgColorPicker" title="Background Color">🎨</label><input id="bgColorPicker" title="Change Background Color" type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="bg-color-input"/></div>
      {/* Bottom Tools */}
      <div className='tool-section tool-section-bottom'>
         <button className="tool-button" onClick={handleUndo} title="Undo (Ctrl+Z)" disabled={!canUndo}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M9.53 2.47a.75.75 0 0 1 0 1.06L4.81 8.25H15a6.75 6.75 0 0 1 0 13.5H9.75a.75.75 0 0 1 0-1.5H15a5.25 5.25 0 1 0 0-10.5H4.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg></button>
         <button className="tool-button" onClick={handleRedo} title="Redo (Ctrl+Y)" disabled={!canRedo}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M14.47 2.47a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 1 1-1.06-1.06l4.72-4.72H9a6.75 6.75 0 0 1 0-13.5h5.25a.75.75 0 0 1 0 1.5H9a5.25 5.25 0 1 0 0 10.5h10.19l-4.72-4.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg></button>
         <button className="tool-button tool-button-save" onClick={handleSave} title="Save as Image">💾</button>
         <button className="tool-button tool-button-danger" onClick={handleClear} title="Clear All">🗑️</button>
       </div>
    </div>
  );
};
export default Toolbar;