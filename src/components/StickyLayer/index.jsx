import React, { useContext, useRef, useState, useCallback } from "react";
import boardContext from "../../store/board-context";
import { TOOL_ITEMS, STICKY_COLORS } from "../../constants";
import classes from "./index.module.css";

function StickyNote({ sticky, onUpdate, onDelete, zoom, panOffset }) {
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const dragStart = useRef(null);
  const noteRef = useRef(null);

  const screenX = sticky.x * zoom + panOffset.x;
  const screenY = sticky.y * zoom + panOffset.y;
  const scaledW = sticky.width * zoom;
  const scaledH = sticky.height * zoom;

  const handleMouseDown = (e) => {
    if (editing) return;
    e.stopPropagation();
    setDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      stickyX: sticky.x,
      stickyY: sticky.y,
    };

    const handleMove = (moveE) => {
      if (!dragStart.current) return;
      const dx = (moveE.clientX - dragStart.current.mouseX) / zoom;
      const dy = (moveE.clientY - dragStart.current.mouseY) / zoom;
      onUpdate(sticky.id, {
        x: dragStart.current.stickyX + dx,
        y: dragStart.current.stickyY + dy,
      });
    };

    const handleUp = () => {
      setDragging(false);
      dragStart.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setEditing(true);
  };

  const handleBlur = () => {
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") setEditing(false);
    e.stopPropagation(); // don't trigger undo/redo
  };

  return (
    <div
      ref={noteRef}
      className={`${classes.sticky} ${dragging ? classes.stickyDragging : ""} ${editing ? classes.stickyEditing : ""}`}
      style={{
        left: screenX,
        top: screenY,
        width: scaledW,
        minHeight: scaledH,
        backgroundColor: sticky.color,
        transform: `rotate(${sticky.rotation || 0}deg)`,
        fontSize: `${13 * zoom}px`,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Header bar */}
      <div
        className={classes.stickyHeader}
        style={{ backgroundColor: darken(sticky.color, 15) }}
      >
        <div className={classes.stickyDots}>
          <span /><span /><span />
        </div>
        <button
          className={classes.stickyDelete}
          onClick={(e) => { e.stopPropagation(); onDelete(sticky.id); }}
          title="Delete sticky"
        >
          ×
        </button>
      </div>

      {/* Content area */}
      {editing ? (
        <textarea
          autoFocus
          className={classes.stickyTextarea}
          value={sticky.text}
          onChange={(e) => onUpdate(sticky.id, { text: e.target.value })}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{ fontSize: `${13 * zoom}px` }}
        />
      ) : (
        <div
          className={classes.stickyContent}
          style={{ fontSize: `${13 * zoom}px` }}
        >
          {sticky.text || (
            <span className={classes.stickyPlaceholder}>
              Double-click to edit...
            </span>
          )}
        </div>
      )}

      {/* Color picker strip */}
      <div className={classes.stickyColorStrip}>
        {STICKY_COLORS.map((c) => (
          <div
            key={c}
            className={`${classes.stickyColorDot} ${sticky.color === c ? classes.stickyColorDotActive : ""}`}
            style={{ backgroundColor: c }}
            onClick={(e) => { e.stopPropagation(); onUpdate(sticky.id, { color: c }); }}
          />
        ))}
      </div>
    </div>
  );
}

// Darken a hex color by amount (0-100)
function darken(hex, amount) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

// The overlay layer that holds all sticky notes
function StickyLayer() {
  const {
    stickies,
    addSticky,
    updateSticky,
    deleteSticky,
    activeToolItem,
    zoom,
    panOffset,
    toCanvasCoords,
  } = useContext(boardContext);

  const layerRef = useRef(null);
  const [colorIndex, setColorIndex] = useState(0);

  const handleLayerClick = useCallback((e) => {
    if (activeToolItem !== TOOL_ITEMS.STICKY) return;
    // Don't place if clicking on an existing sticky
    if (e.target !== layerRef.current) return;

    const { x, y } = toCanvasCoords(e.clientX, e.clientY);
    const color = STICKY_COLORS[colorIndex % STICKY_COLORS.length];
    addSticky(x - 100, y - 80, color);
    setColorIndex((i) => i + 1);
  }, [activeToolItem, addSticky, colorIndex, toCanvasCoords]);

  return (
    <div
      ref={layerRef}
      className={`${classes.stickyLayer} ${activeToolItem === TOOL_ITEMS.STICKY ? classes.stickyLayerActive : ""}`}
      onClick={handleLayerClick}
    >
      {stickies.map((sticky) => (
        <StickyNote
          key={sticky.id}
          sticky={sticky}
          onUpdate={updateSticky}
          onDelete={deleteSticky}
          zoom={zoom}
          panOffset={panOffset}
        />
      ))}
    </div>
  );
}

export default StickyLayer;