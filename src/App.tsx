import { useState, useRef, useCallback } from 'react';
import Konva from 'konva';
import Toolbar from './components/Toolbar';
import WhiteboardCanvas from './components/WhiteboardCanvas';
import type { LineData } from './components/WhiteboardCanvas'; // Import the interface
import './App.css'; // Keep or modify for App specific styles

function App() {
  // State for whiteboard settings
  const [selectedTool, setSelectedTool] = useState<string>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(5); // Default stroke width

  // State to store the lines drawn on the canvas
  const [lines, setLines] = useState<LineData[]>([]);

  // Refs for accessing the Konva stage and tracking drawing state
  const stageRef = useRef<Konva.Stage>(null);
  const isDrawing = useRef(false);

  // --- Handler Functions ---

  const handleClear = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the entire canvas?")) {
       setLines([]); // Simply clear the lines array
        // Optionally, clear the stage directly if visual artifacts remain,
        // but updating state should cause Konva to redraw cleanly.
        // stageRef.current?.getLayers()[0]?.destroyChildren();
        // stageRef.current?.draw();
    }
  }, []);

  const handleSave = useCallback(() => {
     if (!stageRef.current) return;

      // Simple image saving logic (same as the HTML/JS example)
      const stage = stageRef.current;

      // Temporarily set background for saving - Ensure it fits DPR
      const layer = stage.getLayers()[0]; // Assuming one main layer
      // const originalFill = layer.getAttr('fillStyle');
      layer.getContext().globalCompositeOperation = 'destination-over';
      layer.getContext().fillStyle = '#ffffff'; // White background
      layer.getContext().fillRect(0, 0, stage.width() / window.devicePixelRatio , stage.height() / window.devicePixelRatio ); // Adjust for scale? Konva might handle this better
      layer.getContext().globalCompositeOperation = 'source-over';
      layer.getCanvas()._canvas.style.backgroundColor = 'white' // Alternate BG approach?

      // Konva has a built-in toDataURL which handles scaling
       const dataURL = stage.toDataURL({ pixelRatio: 2 }); // Save at 2x resolution

      // Reset background potentially? (Less critical if static)
      // layer.getContext().fillStyle = originalFill; // If you need to restore dynamic BG

        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'inkflare-whiteboard.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
         console.log("Board saved as image!");

  }, [stageRef]);


  return (
    <div className="AppContainer"> {/* Optional container for potential overall styles */}
      <Toolbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        handleClear={handleClear}
        handleSave={handleSave}
      />
      <WhiteboardCanvas
        selectedTool={selectedTool}
        selectedColor={selectedColor}
        strokeWidth={strokeWidth}
        stageRef={stageRef}
        lines={lines}
        setLines={setLines}
        isDrawing={isDrawing} // Pass down the drawing state ref
      />
    </div>
  );
}

export default App;