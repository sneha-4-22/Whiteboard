import React, { useContext, useState } from "react";
import classes from "./index.module.css";
import cx from "classnames";
import {
  FaSlash, FaRegCircle, FaArrowRight, FaPaintBrush,
  FaEraser, FaUndoAlt, FaRedoAlt, FaFont, FaDownload,
  FaMousePointer, FaStickyNote, FaSearchPlus, FaSearchMinus,
  FaExpand,
} from "react-icons/fa";
import { LuRectangleHorizontal } from "react-icons/lu";
import { TOOL_ITEMS, MOCK_USERS } from "../../constants";
import boardContext from "../../store/board-context";

const Toolbar = () => {
  const {
    activeToolItem,
    changeToolHandler,
    undo, redo,
    zoom,
    zoomBoard,
    resetView,
  } = useContext(boardContext);

  const handleDownloadClick = () => {
    const canvas = document.getElementById("canvas");
    const data = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = data;
    anchor.download = "whiteboard.png";
    anchor.click();
  };

  const tools = [
    { id: TOOL_ITEMS.SELECT, icon: <FaMousePointer />, label: "Select & Move (V)" },
    { id: TOOL_ITEMS.BRUSH, icon: <FaPaintBrush />, label: "Brush (B)" },
    { id: TOOL_ITEMS.LINE, icon: <FaSlash />, label: "Line (L)" },
    { id: TOOL_ITEMS.RECTANGLE, icon: <LuRectangleHorizontal />, label: "Rectangle (R)" },
    { id: TOOL_ITEMS.CIRCLE, icon: <FaRegCircle />, label: "Circle (C)" },
    { id: TOOL_ITEMS.ARROW, icon: <FaArrowRight />, label: "Arrow (A)" },
    { id: TOOL_ITEMS.TEXT, icon: <FaFont />, label: "Text (T)" },
    { id: TOOL_ITEMS.ERASER, icon: <FaEraser />, label: "Eraser (E)" },
    { id: TOOL_ITEMS.STICKY, icon: <FaStickyNote />, label: "Sticky Note (S)" },
  ];

  return (
    <>
      {/* Main toolbar */}
      <div className={classes.container}>
        {/* Brand */}
        <div className={classes.brand}>
          <span className={classes.brandIcon}>◈</span>
          <span className={classes.brandName}>Sketchboard</span>
        </div>

        <div className={classes.divider} />

        {/* Drawing tools */}
        <div className={classes.toolGroup}>
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={cx(classes.toolItem, {
                [classes.active]: activeToolItem === tool.id,
              })}
              onClick={() => changeToolHandler(tool.id)}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <div className={classes.divider} />

        {/* History */}
        <div className={classes.toolGroup}>
          <button className={classes.toolItem} onClick={undo} title="Undo (Ctrl+Z)">
            <FaUndoAlt />
          </button>
          <button className={classes.toolItem} onClick={redo} title="Redo (Ctrl+Y)">
            <FaRedoAlt />
          </button>
        </div>

        <div className={classes.divider} />

        {/* Export */}
        <button className={cx(classes.toolItem, classes.exportBtn)} onClick={handleDownloadClick} title="Download as PNG">
          <FaDownload />
          <span className={classes.exportLabel}>Export</span>
        </button>

        <div className={classes.divider} />

        {/* Collaborator avatars (mock) */}
        <div className={classes.avatars}>
          {MOCK_USERS.map((user) => (
            <div
              key={user.id}
              className={classes.avatar}
              style={{ backgroundColor: user.color }}
              title={`${user.name} is online`}
            >
              {user.avatar}
              <span className={classes.onlineDot} />
            </div>
          ))}
        </div>
      </div>

      {/* Zoom controls (bottom-right) */}
      <div className={classes.zoomControls}>
        <button
          className={classes.zoomBtn}
          onClick={() => zoomBoard(-0.15, window.innerWidth / 2, window.innerHeight / 2)}
          title="Zoom out"
        >
          <FaSearchMinus />
        </button>
        <span className={classes.zoomLevel}>{Math.round(zoom * 100)}%</span>
        <button
          className={classes.zoomBtn}
          onClick={() => zoomBoard(0.15, window.innerWidth / 2, window.innerHeight / 2)}
          title="Zoom in"
        >
          <FaSearchPlus />
        </button>
        <div className={classes.zoomDivider} />
        <button className={classes.zoomBtn} onClick={resetView} title="Reset view">
          <FaExpand />
        </button>
      </div>

      {/* Active tool indicator */}
      {activeToolItem === TOOL_ITEMS.STICKY && (
        <div className={classes.toolHint}>
          🗒️ Click anywhere on the canvas to place a sticky note
        </div>
      )}
      {activeToolItem === TOOL_ITEMS.SELECT && (
        <div className={classes.toolHint}>
          🖱️ Click to select · Drag to move · Alt+Drag to pan
        </div>
      )}
    </>
  );
};

export default Toolbar;