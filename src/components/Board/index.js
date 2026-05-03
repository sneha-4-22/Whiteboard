import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import { getElementBounds } from "../../utils/math";
import { getResizeHandles, getHandleAtPoint } from "../../utils/element";
import classes from "./index.module.css";
import {
  FaAngleDoubleUp,
  FaAngleDoubleDown,
  FaAngleUp,
  FaAngleDown,
  FaTrash,
} from "react-icons/fa";

const HANDLE_CURSORS = {
  nw: "nw-resize",
  n:  "n-resize",
  ne: "ne-resize",
  e:  "e-resize",
  se: "se-resize",
  s:  "s-resize",
  sw: "sw-resize",
  w:  "w-resize",
};

function Board() {
  const canvasRef = useRef();
  const textAreaRef = useRef();

  const [hoveredHandle, setHoveredHandle] = useState(null);

  const {
    elements,
    toolActionType,
    selectedElementId,
    resizeHandle,
    zoom,
    panOffset,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    zoomBoard,
    undo,
    redo,
    deleteElement,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    changeToolHandler,
  } = useContext(boardContext);

  const { toolboxState } = useContext(toolboxContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "TEXTAREA" || tag === "INPUT";

      if (e.ctrlKey && e.key === "z") { undo(); return; }
      if (e.ctrlKey && e.key === "y") { redo(); return; }

      if (!isTyping) {
        if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId !== null) {
          deleteElement(selectedElementId);
          return;
        }
        const toolMap = {
          v: TOOL_ITEMS.SELECT,
          b: TOOL_ITEMS.BRUSH,
          l: TOOL_ITEMS.LINE,
          r: TOOL_ITEMS.RECTANGLE,
          c: TOOL_ITEMS.CIRCLE,
          a: TOOL_ITEMS.ARROW,
          t: TOOL_ITEMS.TEXT,
          e: TOOL_ITEMS.ERASER,
          s: TOOL_ITEMS.STICKY,
        };
        if (toolMap[e.key.toLowerCase()]) {
          changeToolHandler(toolMap[e.key.toLowerCase()]);
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [undo, redo, selectedElementId, deleteElement, changeToolHandler]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const handleWheel = (e) => {
      e.preventDefault();
      zoomBoard(e.deltaY > 0 ? -0.08 : 0.08, e.clientX, e.clientY);
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [zoomBoard]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e) => boardMouseDownHandler(e, toolboxState);
    const onMove = (e) => boardMouseMoveHandler(e);
    const onUp   = (e) => boardMouseUpHandler(e);

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onUp);
    };
  }, [boardMouseDownHandler, boardMouseMoveHandler, boardMouseUpHandler, toolboxState]);

 useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onHover = (e) => {
      if (selectedElementId === null) {
        setHoveredHandle(null);
        return;
      }
      const canvasX = (e.clientX - panOffset.x) / zoom;
      const canvasY = (e.clientY - panOffset.y) / zoom;
      const selectedEl = elements.find((el) => el.id === selectedElementId);
      if (!selectedEl) { setHoveredHandle(null); return; }
      const handle = getHandleAtPoint(selectedEl, canvasX, canvasY, zoom);
      setHoveredHandle(handle);
    };

    canvas.addEventListener("mousemove", onHover);
    return () => canvas.removeEventListener("mousemove", onHover);
  }, [selectedElementId, elements, zoom, panOffset]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.strokeStyle = "#e5e7eb";
    context.lineWidth = 0.5;
    const gridSize = 30 * zoom;
    const offsetX = panOffset.x % gridSize;
    const offsetY = panOffset.y % gridSize;
    for (let x = offsetX; x < canvas.width; x += gridSize) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, canvas.height); context.stroke();
    }
    for (let y = offsetY; y < canvas.height; y += gridSize) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke();
    }
    context.restore();

    context.save();
    context.translate(panOffset.x, panOffset.y);
    context.scale(zoom, zoom);

    const roughCanvas = rough.canvas(canvas);

    elements.forEach((element) => {
      context.save();
      switch (element.type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          roughCanvas.draw(element.roughEle);
          break;
        case TOOL_ITEMS.BRUSH:
          context.fillStyle = element.stroke;
          context.fill(element.path);
          break;
        case TOOL_ITEMS.TEXT:
          context.textBaseline = "top";
          context.font = `${element.size}px Caveat`;
          context.fillStyle = element.stroke;
          context.fillText(element.text, element.x1, element.y1);
          break;
        default:
          break;
      }
      context.restore();

      if (element.id === selectedElementId) {
        const bounds = getElementBounds(element);
        if (bounds) {
          context.save();

          // Dashed selection rectangle
          context.strokeStyle = "#6366f1";
          context.lineWidth = 2 / zoom;
          context.setLineDash([6 / zoom, 3 / zoom]);
          context.strokeRect(
            bounds.x - 4,
            bounds.y - 4,
            bounds.width + 8,
            bounds.height + 8
          );

          // Resize handles (skip for brush strokes)
          if (element.type !== TOOL_ITEMS.BRUSH) {
            const handles = getResizeHandles({
              x: bounds.x - 4,
              y: bounds.y - 4,
              width: bounds.width + 8,
              height: bounds.height + 8,
            });

            const hs = 8 / zoom; // handle size

            context.setLineDash([]);
            Object.entries(handles).forEach(([name, { x: hx, y: hy }]) => {
              context.fillStyle = "#ffffff";
              context.strokeStyle = "#6366f1";
              context.lineWidth = 1.5 / zoom;
              context.beginPath();
              context.rect(hx - hs / 2, hy - hs / 2, hs, hs);
              context.fill();
              context.stroke();
            });
          } else {
            // Just corner dots for brush (no resize)
            context.fillStyle = "#6366f1";
            const hs = 6 / zoom;
            [
              [bounds.x - 4, bounds.y - 4],
              [bounds.x + bounds.width + 4, bounds.y - 4],
              [bounds.x - 4, bounds.y + bounds.height + 4],
              [bounds.x + bounds.width + 4, bounds.y + bounds.height + 4],
            ].forEach(([hx, hy]) => {
              context.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
            });
          }

          context.restore();
        }
      }
    });

    context.restore();
  }, [elements, selectedElementId, zoom, panOffset]);

  useEffect(() => {
    if (toolActionType === TOOL_ACTION_TYPES.WRITING) {
      setTimeout(() => textAreaRef.current?.focus(), 0);
    }
  }, [toolActionType]);

  const getCursor = () => {
    if (toolActionType === TOOL_ACTION_TYPES.PANNING) return "grabbing";
    if (toolActionType === TOOL_ACTION_TYPES.MOVING)  return "move";
    if (toolActionType === TOOL_ACTION_TYPES.RESIZING)
      return HANDLE_CURSORS[resizeHandle] || "crosshair";
    if (hoveredHandle) return HANDLE_CURSORS[hoveredHandle];
    return "crosshair";
  };

  return (
    <>
    
      {toolActionType === TOOL_ACTION_TYPES.WRITING && elements.length > 0 && (
        <textarea
          ref={textAreaRef}
          className={classes.textElementBox}
          style={{
            top:      elements[elements.length - 1].y1 * zoom + panOffset.y,
            left:     elements[elements.length - 1].x1 * zoom + panOffset.x,
            fontSize: `${elements[elements.length - 1]?.size * zoom}px`,
            color:    elements[elements.length - 1]?.stroke,
          }}
          onBlur={(e) => textAreaBlurHandler(e.target.value)}
        />
      )}

     
      {selectedElementId !== null && (
        <div className={classes.layerControls}>
          <span className={classes.layerLabel}>Layer</span>
          <div className={classes.layerDivider} />
          <button className={classes.layerBtn} onClick={() => bringToFront(selectedElementId)} title="Bring to Front">
            <FaAngleDoubleUp />
          </button>
          <button className={classes.layerBtn} onClick={() => bringForward(selectedElementId)} title="Bring Forward">
            <FaAngleUp />
          </button>
          <button className={classes.layerBtn} onClick={() => sendBackward(selectedElementId)} title="Send Backward">
            <FaAngleDown />
          </button>
          <button className={classes.layerBtn} onClick={() => sendToBack(selectedElementId)} title="Send to Back">
            <FaAngleDoubleDown />
          </button>
          <div className={classes.layerDivider} />
          <button
            className={`${classes.layerBtn} ${classes.deleteBtn}`}
            onClick={() => deleteElement(selectedElementId)}
            title="Delete element (Del)"
          >
            <FaTrash />
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        id="canvas"
        className={classes.canvas}
        style={{ cursor: getCursor() }}
      />
    </>
  );
}

export default Board;