import React, { useCallback, useReducer } from "react";
import boardContext from "./board-context";
import { BOARD_ACTIONS, TOOL_ACTION_TYPES, TOOL_ITEMS } from "../constants";
import {
  createElement,
  getSvgPathFromStroke,
  isPointNearElement,
  getElementAtPosition,
  moveElement,
} from "../utils/element";
import getStroke from "perfect-freehand";

const boardReducer = (state, action) => {
  switch (action.type) {
    case BOARD_ACTIONS.CHANGE_TOOL: {
      return {
        ...state,
        activeToolItem: action.payload.tool,
        selectedElementId: null,
        toolActionType: TOOL_ACTION_TYPES.NONE,
      };
    }

    case BOARD_ACTIONS.CHANGE_ACTION_TYPE:
      return {
        ...state,
        toolActionType: action.payload.actionType,
      };

    case BOARD_ACTIONS.DRAW_DOWN: {
      const { clientX, clientY, stroke, fill, size } = action.payload;
      const newElement = createElement(
        state.elements.length,
        clientX, clientY, clientX, clientY,
        { type: state.activeToolItem, stroke, fill, size }
      );
      return {
        ...state,
        toolActionType:
          state.activeToolItem === TOOL_ITEMS.TEXT
            ? TOOL_ACTION_TYPES.WRITING
            : TOOL_ACTION_TYPES.DRAWING,
        elements: [...state.elements, newElement],
      };
    }

    case BOARD_ACTIONS.DRAW_MOVE: {
      const { clientX, clientY } = action.payload;
      const newElements = [...state.elements];
      const index = state.elements.length - 1;
      const { type } = newElements[index];

      switch (type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW: {
          const { x1, y1, stroke, fill, size } = newElements[index];
          newElements[index] = createElement(index, x1, y1, clientX, clientY, {
            type: state.activeToolItem, stroke, fill, size,
          });
          return { ...state, elements: newElements };
        }
        case TOOL_ITEMS.BRUSH:
          newElements[index].points = [...newElements[index].points, { x: clientX, y: clientY }];
          newElements[index].path = new Path2D(
            getSvgPathFromStroke(getStroke(newElements[index].points))
          );
          return { ...state, elements: newElements };
        default:
          return state;
      }
    }

    case BOARD_ACTIONS.DRAW_UP: {
      const elementsCopy = [...state.elements];
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(elementsCopy);
      return { ...state, history: newHistory, index: state.index + 1 };
    }

    case BOARD_ACTIONS.ERASE: {
      const { clientX, clientY } = action.payload;
      let newElements = state.elements.filter(
        (element) => !isPointNearElement(element, clientX, clientY)
      );
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      return { ...state, elements: newElements, history: newHistory, index: state.index + 1 };
    }

    case BOARD_ACTIONS.CHANGE_TEXT: {
      const index = state.elements.length - 1;
      const newElements = [...state.elements];
      newElements[index].text = action.payload.text;
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      return {
        ...state,
        toolActionType: TOOL_ACTION_TYPES.NONE,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
      };
    }

    // ── SELECT & MOVE ──────────────────────────────────────────────────────────
    case BOARD_ACTIONS.SELECT_ELEMENT: {
      return {
        ...state,
        selectedElementId: action.payload.id,
        moveStart: action.payload.moveStart,
        toolActionType:
          action.payload.id !== null
            ? TOOL_ACTION_TYPES.SELECTING
            : TOOL_ACTION_TYPES.NONE,
      };
    }

    case BOARD_ACTIONS.MOVE_ELEMENT: {
      const { clientX, clientY } = action.payload;
      if (state.selectedElementId === null || !state.moveStart) return state;

      const dx = clientX - state.moveStart.x;
      const dy = clientY - state.moveStart.y;

      const newElements = state.elements.map((el) =>
        el.id === state.selectedElementId ? moveElement(el, dx, dy) : el
      );

      return {
        ...state,
        elements: newElements,
        moveStart: { x: clientX, y: clientY },
        toolActionType: TOOL_ACTION_TYPES.MOVING,
      };
    }

    case BOARD_ACTIONS.MOVE_UP: {
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push([...state.elements]);
      return {
        ...state,
        history: newHistory,
        index: state.index + 1,
        toolActionType: TOOL_ACTION_TYPES.SELECTING,
        moveStart: null,
      };
    }

    // ── STICKY NOTES ──────────────────────────────────────────────────────────
    case BOARD_ACTIONS.ADD_STICKY: {
      const { x, y, color } = action.payload;
      const newSticky = {
        id: `sticky-${Date.now()}`,
        type: "STICKY",
        x,
        y,
        width: 200,
        height: 160,
        color,
        text: "",
        isEditing: false,
      };
      const newStickies = [...state.stickies, newSticky];
      return { ...state, stickies: newStickies };
    }

    case BOARD_ACTIONS.UPDATE_STICKY: {
      const { id, updates } = action.payload;
      const newStickies = state.stickies.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      return { ...state, stickies: newStickies };
    }

    case BOARD_ACTIONS.DELETE_STICKY: {
      const newStickies = state.stickies.filter((s) => s.id !== action.payload.id);
      return { ...state, stickies: newStickies };
    }

    // ── ZOOM & PAN ────────────────────────────────────────────────────────────
    case BOARD_ACTIONS.SET_ZOOM: {
      return { ...state, zoom: Math.min(Math.max(action.payload.zoom, 0.2), 5) };
    }

    case BOARD_ACTIONS.PAN_START: {
      return {
        ...state,
        toolActionType: TOOL_ACTION_TYPES.PANNING,
        panStart: { x: action.payload.x, y: action.payload.y },
      };
    }

    case BOARD_ACTIONS.PAN_MOVE: {
      if (!state.panStart) return state;
      const dx = action.payload.x - state.panStart.x;
      const dy = action.payload.y - state.panStart.y;
      return {
        ...state,
        panOffset: {
          x: state.panOffset.x + dx,
          y: state.panOffset.y + dy,
        },
        panStart: { x: action.payload.x, y: action.payload.y },
      };
    }

    case BOARD_ACTIONS.PAN_END: {
      return {
        ...state,
        toolActionType: TOOL_ACTION_TYPES.NONE,
        panStart: null,
      };
    }

    case BOARD_ACTIONS.SET_PAN: {
      return { ...state, panOffset: action.payload };
    }

    // ── UNDO / REDO ───────────────────────────────────────────────────────────
    case BOARD_ACTIONS.UNDO: {
      if (state.index <= 0) return state;
      return {
        ...state,
        elements: state.history[state.index - 1],
        index: state.index - 1,
        selectedElementId: null,
      };
    }

    case BOARD_ACTIONS.REDO: {
      if (state.index >= state.history.length - 1) return state;
      return {
        ...state,
        elements: state.history[state.index + 1],
        index: state.index + 1,
      };
    }

    default:
      return state;
  }
};

const initialBoardState = {
  activeToolItem: TOOL_ITEMS.BRUSH,
  toolActionType: TOOL_ACTION_TYPES.NONE,
  elements: [],
  history: [[]],
  index: 0,
  selectedElementId: null,
  moveStart: null,
  stickies: [],
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  panStart: null,
};

const BoardProvider = ({ children }) => {
  const [boardState, dispatchBoardAction] = useReducer(boardReducer, initialBoardState);

  const changeToolHandler = (tool) => {
    dispatchBoardAction({ type: BOARD_ACTIONS.CHANGE_TOOL, payload: { tool } });
  };

  // Convert screen coords → canvas coords (accounting for zoom + pan)
  const toCanvasCoords = (clientX, clientY) => {
    return {
      x: (clientX - boardState.panOffset.x) / boardState.zoom,
      y: (clientY - boardState.panOffset.y) / boardState.zoom,
    };
  };

  const boardMouseDownHandler = (event, toolboxState) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;

    const { clientX, clientY } = event;
    const { x, y } = toCanvasCoords(clientX, clientY);

    // Middle mouse or Space+drag = pan
    if (event.button === 1 || (event.button === 0 && event.altKey)) {
      dispatchBoardAction({ type: BOARD_ACTIONS.PAN_START, payload: { x: clientX, y: clientY } });
      return;
    }

    if (boardState.activeToolItem === TOOL_ITEMS.ERASER) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
        payload: { actionType: TOOL_ACTION_TYPES.ERASING },
      });
      return;
    }

    if (boardState.activeToolItem === TOOL_ITEMS.SELECT) {
      const found = getElementAtPosition(boardState.elements, x, y);
      dispatchBoardAction({
        type: BOARD_ACTIONS.SELECT_ELEMENT,
        payload: {
          id: found ? found.id : null,
          moveStart: found ? { x, y } : null,
        },
      });
      return;
    }

    if (boardState.activeToolItem === TOOL_ITEMS.STICKY) {
      // Sticky notes are handled via StickyLayer — we dispatch from Toolbar double-click
      return;
    }

    dispatchBoardAction({
      type: BOARD_ACTIONS.DRAW_DOWN,
      payload: {
        clientX: x,
        clientY: y,
        stroke: toolboxState[boardState.activeToolItem]?.stroke,
        fill: toolboxState[boardState.activeToolItem]?.fill,
        size: toolboxState[boardState.activeToolItem]?.size,
      },
    });
  };

  const boardMouseMoveHandler = (event) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    const { clientX, clientY } = event;
    const { x, y } = toCanvasCoords(clientX, clientY);

    if (boardState.toolActionType === TOOL_ACTION_TYPES.PANNING) {
      dispatchBoardAction({ type: BOARD_ACTIONS.PAN_MOVE, payload: { x: clientX, y: clientY } });
      return;
    }

    if (
      boardState.toolActionType === TOOL_ACTION_TYPES.SELECTING ||
      boardState.toolActionType === TOOL_ACTION_TYPES.MOVING
    ) {
      if (boardState.selectedElementId !== null) {
        dispatchBoardAction({
          type: BOARD_ACTIONS.MOVE_ELEMENT,
          payload: { clientX: x, clientY: y },
        });
      }
      return;
    }

    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatchBoardAction({ type: BOARD_ACTIONS.DRAW_MOVE, payload: { clientX: x, clientY: y } });
    } else if (boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
      dispatchBoardAction({ type: BOARD_ACTIONS.ERASE, payload: { clientX: x, clientY: y } });
    }
  };

  const boardMouseUpHandler = () => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;

    if (boardState.toolActionType === TOOL_ACTION_TYPES.PANNING) {
      dispatchBoardAction({ type: BOARD_ACTIONS.PAN_END });
      return;
    }

    if (
      boardState.toolActionType === TOOL_ACTION_TYPES.MOVING ||
      boardState.toolActionType === TOOL_ACTION_TYPES.SELECTING
    ) {
      if (boardState.selectedElementId !== null) {
        dispatchBoardAction({ type: BOARD_ACTIONS.MOVE_UP });
      }
      return;
    }

    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatchBoardAction({ type: BOARD_ACTIONS.DRAW_UP });
    }

    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: { actionType: TOOL_ACTION_TYPES.NONE },
    });
  };

  const textAreaBlurHandler = (text) => {
    dispatchBoardAction({ type: BOARD_ACTIONS.CHANGE_TEXT, payload: { text } });
  };

  const addStickyHandler = (x, y, color) => {
    dispatchBoardAction({ type: BOARD_ACTIONS.ADD_STICKY, payload: { x, y, color } });
  };

  const updateStickyHandler = (id, updates) => {
    dispatchBoardAction({ type: BOARD_ACTIONS.UPDATE_STICKY, payload: { id, updates } });
  };

  const deleteStickyHandler = (id) => {
    dispatchBoardAction({ type: BOARD_ACTIONS.DELETE_STICKY, payload: { id } });
  };

  const zoomHandler = (delta, centerX, centerY) => {
    const newZoom = Math.min(Math.max(boardState.zoom + delta, 0.2), 5);
    // Zoom toward cursor
    const scale = newZoom / boardState.zoom;
    const newPanX = centerX - scale * (centerX - boardState.panOffset.x);
    const newPanY = centerY - scale * (centerY - boardState.panOffset.y);
    dispatchBoardAction({ type: BOARD_ACTIONS.SET_ZOOM, payload: { zoom: newZoom } });
    dispatchBoardAction({ type: BOARD_ACTIONS.SET_PAN, payload: { x: newPanX, y: newPanY } });
  };

  const resetViewHandler = () => {
    dispatchBoardAction({ type: BOARD_ACTIONS.SET_ZOOM, payload: { zoom: 1 } });
    dispatchBoardAction({ type: BOARD_ACTIONS.SET_PAN, payload: { x: 0, y: 0 } });
  };

  const boardUndoHandler = useCallback(() => {
    dispatchBoardAction({ type: BOARD_ACTIONS.UNDO });
  }, []);

  const boardRedoHandler = useCallback(() => {
    dispatchBoardAction({ type: BOARD_ACTIONS.REDO });
  }, []);

  const boardContextValue = {
    activeToolItem: boardState.activeToolItem,
    elements: boardState.elements,
    toolActionType: boardState.toolActionType,
    selectedElementId: boardState.selectedElementId,
    stickies: boardState.stickies,
    zoom: boardState.zoom,
    panOffset: boardState.panOffset,
    changeToolHandler,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    addSticky: addStickyHandler,
    updateSticky: updateStickyHandler,
    deleteSticky: deleteStickyHandler,
    zoomBoard: zoomHandler,
    resetView: resetViewHandler,
    undo: boardUndoHandler,
    redo: boardRedoHandler,
    toCanvasCoords,
  };

  return (
    <boardContext.Provider value={boardContextValue}>
      {children}
    </boardContext.Provider>
  );
};

export default BoardProvider;