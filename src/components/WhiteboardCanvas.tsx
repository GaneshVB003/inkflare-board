import React, { useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import Konva from 'konva';

// Define the structure for storing line data
export interface LineData {
  tool: string;
  points: number[];
  color: string;
  strokeWidth: number;
}

// Define the types for the props this component expects
interface WhiteboardCanvasProps {
  selectedTool: string;
  selectedColor: string;
  strokeWidth: number;
  stageRef: React.RefObject<Konva.Stage | null> // Ref for Konva stage
  lines: LineData[]; // Array of lines drawn
  setLines: React.Dispatch<React.SetStateAction<LineData[]>>; // Function to update lines state
  isDrawing: React.MutableRefObject<boolean>; // Ref to track drawing state
}

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  selectedTool,
  selectedColor,
  strokeWidth,
  stageRef,
  lines,
  setLines,
  isDrawing, // Receive drawing state ref from parent
}) => {

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    isDrawing.current = true;
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Start a new line
    setLines(prevLines => [
      ...prevLines,
      {
        tool: selectedTool,
        points: [pos.x, pos.y],
        color: selectedColor,
        strokeWidth: strokeWidth,
      },
    ]);
     // Prevent default behavior (like text selection or page scroll on touch)
     e.evt.preventDefault();
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    setLines(prevLines => {
        const lastLineIndex = prevLines.length - 1;
        if (lastLineIndex < 0) return prevLines; // Should not happen if drawing started

        const lastLine = { ...prevLines[lastLineIndex] }; // Create a shallow copy
        lastLine.points = lastLine.points.concat([point.x, point.y]);

        // Create a new array with the updated last line
        const newLines = [...prevLines];
        newLines[lastLineIndex] = lastLine;
        return newLines;
    });
     // Prevent default behavior
     e.evt.preventDefault();
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    isDrawing.current = false;
    // Prevent default behavior
    e.evt.preventDefault();
  };

  // Effect to resize canvas dimensions based on window size
  useEffect(() => {
    const handleResize = () => {
      if (stageRef.current) {
        stageRef.current.width(window.innerWidth);
        stageRef.current.height(window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call initially

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [stageRef]); // Rerun effect if stageRef changes (shouldn't normally)

  return (
    <Stage
      width={window.innerWidth} // Take full window width initially
      height={window.innerHeight} // Take full window height initially
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown} // Bind touch events
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      ref={stageRef} // Attach the ref
      style={{ backgroundColor: 'white' }} // Basic background
    >
      <Layer>
        {lines.map((line, i) => (
          <Line
            key={i}
            points={line.points}
            stroke={line.color}
            strokeWidth={line.strokeWidth}
            tension={0.5} // Makes lines slightly smoother
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation={
              // Use 'destination-out' for eraser, 'source-over' for pen
              line.tool === 'eraser' ? 'destination-out' : 'source-over'
            }
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default WhiteboardCanvas;