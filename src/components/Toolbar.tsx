import React from 'react';
import './Toolbar.css'; // We'll create this CSS file next

// Define the types for the props this component expects
interface ToolbarProps {
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  handleClear: () => void;
  handleSave: () => void; // Placeholder for future save logic
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  setSelectedTool,
  selectedColor,
  setSelectedColor,
  strokeWidth,
  setStrokeWidth,
  handleClear,
  handleSave
}) => {
  return (
    <div className="toolbar-container">
      {/* Tool Selection */}
      <button
        className={`tool-button ${selectedTool === 'pen' ? 'active' : ''}`}
        onClick={() => setSelectedTool('pen')}
        title="Pen"
      >
        ✏️
      </button>
      <button
        className={`tool-button ${selectedTool === 'eraser' ? 'active' : ''}`}
        onClick={() => setSelectedTool('eraser')}
        title="Eraser"
      >
        {/* Simple box represents eraser area - adjust as needed */}
         <span style={{display: 'inline-block', width: '1em', height: '1em', backgroundColor: 'lightgray', border: '1px solid gray'}}></span>
      </button>

      {/* Color Picker */}
      <input
        type="color"
        value={selectedColor}
        onChange={(e) => setSelectedColor(e.target.value)}
        className="color-input"
        title="Select Color"
      />

      {/* Stroke Width Slider */}
      <div className="stroke-width-container">
          <label htmlFor="strokeWidth">Width:</label>
          <input
            type="range"
            id="strokeWidth"
            min="1"
            max="50" // Max stroke width
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="stroke-slider"
          />
          <span className="stroke-value">{strokeWidth}</span>
      </div>

       {/* Clear Button */}
       <button
            className="tool-button tool-button-danger"
            onClick={handleClear}
            title="Clear All"
       >
            🗑️ Clear
       </button>

        {/* Save Button (Placeholder) */}
        <button
            className="tool-button tool-button-save"
            onClick={handleSave}
            title="Save as Image"
        >
            💾 Save
        </button>
    </div>
  );
};

export default Toolbar;