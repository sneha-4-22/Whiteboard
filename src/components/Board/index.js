import { useContext, useEffect, useLayoutEffect, useRef } from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import { getElementBounds } from "../../utils/math";
import classes from "./index.module.css";
import {
  FaAngleDoubleUp,
  FaAngleDoubleDown,
  FaAngleUp,
  FaAngleDown,
  FaTrash,
} from "react-icons/fa";

function Board() {
  const canvasRef = useRef();
  const textAreaRef = useRef();

  const {
    elements,
    toolActionType,
    selectedElementId,
    zoom,
    panOffset,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    zoomBoard,
    undo,
    redo,
    // ── NEW ──
    deleteElement,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    changeToolHandler,
  } = useContext(boardContext);

  const { toolboxState } = useContext(toolboxContext);

  // ── Resize canvas on window resize ──────────────────────────────────────
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

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // Don't fire shortcuts while typing in a text field
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "TEXTAREA" || tag === "INPUT";

      if (e.ctrlKey && e.key === "z") { undo(); return; }
      if (e.ctrlKey && e.key === "y") { redo(); return; }

      if (!isTyping) {
        // Delete / Backspace — remove selected element
        if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId !== null) {
          deleteElement(selectedElementId);
          return;
        }

        // Tool shortcuts
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

  // ── Mouse wheel zoom ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const handleWheel = (e) => {
      e.preventDefault();
      zoomBoard(e.deltaY > 0 ? -0.08 : 0.08, e.clientX, e.clientY);
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [zoomBoard]);

  // ── Canvas mouse events ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e) => boardMouseDownHandler(e, toolboxState);
    const onMove = (e) => boardMouseMoveHandler(e);
    const onUp = (e) => boardMouseUpHandler(e);

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onUp);
    };
  }, [boardMouseDownHandler, boardMouseMoveHandler, boardMouseUpHandler, toolboxState]);

  // ── Render canvas ────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    context.save();
    context.strokeStyle = "#e5e7eb";
    context.lineWidth = 0.5;
    const gridSize = 30 * zoom;
    const offsetX = panOffset.x % gridSize;
    const offsetY = panOffset.y % gridSize;
    for (let x = offsetX; x < canvas.width; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }
    for (let y = offsetY; y < canvas.height; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }
    context.restore();

    // Elements
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

      // Selection highlight
      if (element.id === selectedElementId) {
        const bounds = getElementBounds(element);
        if (bounds) {
          context.save();
          context.strokeStyle = "#6366f1";
          context.lineWidth = 2 / zoom;
          context.setLineDash([6 / zoom, 3 / zoom]);
          context.strokeRect(
            bounds.x - 4,
            bounds.y - 4,
            bounds.width + 8,
            bounds.height + 8
          );
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
          context.restore();
        }
      }
    });

    context.restore();
  }, [elements, selectedElementId, zoom, panOffset]);

  // ── Focus textarea when writing ──────────────────────────────────────────
  useEffect(() => {
    if (toolActionType === TOOL_ACTION_TYPES.WRITING) {
      setTimeout(() => textAreaRef.current?.focus(), 0);
    }
  }, [toolActionType]);

  return (
    <>
      {/* Text input overlay */}
      {toolActionType === TOOL_ACTION_TYPES.WRITING && elements.length > 0 && (
        <textarea
          ref={textAreaRef}
          className={classes.textElementBox}
          style={{
            top: elements[elements.length - 1].y1 * zoom + panOffset.y,
            left: elements[elements.length - 1].x1 * zoom + panOffset.x,
            fontSize: `${elements[elements.length - 1]?.size * zoom}px`,
            color: elements[elements.length - 1]?.stroke,
          }}
          onBlur={(e) => textAreaBlurHandler(e.target.value)}
        />
      )}

      {/* ── Layer controls — appears when an element is selected ── */}
      {selectedElementId !== null && (
        <div className={classes.layerControls}>
          <span className={classes.layerLabel}>Layer</span>
          <div className={classes.layerDivider} />
          <button
            className={classes.layerBtn}
            onClick={() => bringToFront(selectedElementId)}
            title="Bring to Front"
          >
            <FaAngleDoubleUp />
          </button>
          <button
            className={classes.layerBtn}
            onClick={() => bringForward(selectedElementId)}
            title="Bring Forward"
          >
            <FaAngleUp />
          </button>
          <button
            className={classes.layerBtn}
            onClick={() => sendBackward(selectedElementId)}
            title="Send Backward"
          >
            <FaAngleDown />
          </button>
          <button
            className={classes.layerBtn}
            onClick={() => sendToBack(selectedElementId)}
            title="Send to Back"
          >
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
        style={{
          cursor:
            toolActionType === TOOL_ACTION_TYPES.PANNING
              ? "grabbing"
              : toolActionType === TOOL_ACTION_TYPES.MOVING
              ? "move"
              : "crosshair",
        }}
      />
    </>
  );
}

export default Board;