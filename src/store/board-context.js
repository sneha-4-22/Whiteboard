import { createContext } from "react";

const boardContext = createContext({
  activeToolItem: "",
  toolActionType: "",
  elements: [],
  history: [[]],
  index: 0,
  selectedElementId: null,
  stickies: [],
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  boardMouseDownHandler: () => {},
  changeToolHandler: () => {},
  boardMouseMoveHandler: () => {},
  boardMouseUpHandler: () => {},
  addSticky: () => {},
  updateSticky: () => {},
  deleteSticky: () => {},
  zoomBoard: () => {},
  resetView: () => {},
  undo: () => {},
  redo: () => {},
  toCanvasCoords: () => {},
  deleteElement: () => {},
  bringToFront: () => {},
  sendToBack: () => {},
  bringForward: () => {},
  sendBackward: () => {},
});

export default boardContext;