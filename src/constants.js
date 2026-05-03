export const TOOL_ITEMS = {
  BRUSH: "BRUSH",
  LINE: "LINE",
  RECTANGLE: "RECTANGLE",
  CIRCLE: "CIRCLE",
  ARROW: "ARROW",
  ERASER: "ERASER",
  TEXT: "TEXT",
  SELECT: "SELECT",
  STICKY: "STICKY",
};

export const TOOL_ACTION_TYPES = {
  NONE: "NONE",
  DRAWING: "DRAWING",
  ERASING: "ERASING",
  WRITING: "WRITING",
  SELECTING: "SELECTING",
  MOVING: "MOVING",
  PANNING: "PANNING",
};

export const BOARD_ACTIONS = {
  CHANGE_TOOL: "CHANGE_TOOL",
  DRAW_DOWN: "DRAW_DOWN",
  DRAW_MOVE: "DRAW_MOVE",
  DRAW_UP: "DRAW_UP",
  ERASE: "ERASE",
  CHANGE_ACTION_TYPE: "CHANGE_ACTION_TYPE",
  CHANGE_TEXT: "CHANGE_TEXT",
  UNDO: "UNDO",
  REDO: "REDO",
  SELECT_ELEMENT: "SELECT_ELEMENT",
  MOVE_ELEMENT: "MOVE_ELEMENT",
  MOVE_UP: "MOVE_UP",
  ADD_STICKY: "ADD_STICKY",
  UPDATE_STICKY: "UPDATE_STICKY",
  DELETE_STICKY: "DELETE_STICKY",
  SET_ZOOM: "SET_ZOOM",
  SET_PAN: "SET_PAN",
  PAN_START: "PAN_START",
  PAN_MOVE: "PAN_MOVE",
  PAN_END: "PAN_END",
};

export const COLORS = {
  BLACK: "#000000",
  RED: "#ff0000",
  GREEN: "#00ff00",
  BLUE: "#0000ff",
  ORANGE: "#ffa500",
  YELLOW: "#ffff00",
  WHITE: "#ffffff",
};

export const STICKY_COLORS = [
  "#fef08a", // yellow
  "#bbf7d0", // green
  "#bfdbfe", // blue
  "#fecaca", // red
  "#e9d5ff", // purple
  "#fed7aa", // orange
];

export const TOOLBOX_ACTIONS = {
  CHANGE_STROKE: "CHANGE_STROKE",
  CHANGE_FILL: "CHANGE_FILL",
  CHANGE_SIZE: "CHANGE_SIZE",
};

export const FILL_TOOL_TYPES = [TOOL_ITEMS.RECTANGLE, TOOL_ITEMS.CIRCLE];
export const STROKE_TOOL_TYPES = [
  TOOL_ITEMS.BRUSH,
  TOOL_ITEMS.LINE,
  TOOL_ITEMS.ARROW,
  TOOL_ITEMS.RECTANGLE,
  TOOL_ITEMS.CIRCLE,
  TOOL_ITEMS.TEXT,
];
export const SIZE_TOOL_TYPES = [
  TOOL_ITEMS.LINE,
  TOOL_ITEMS.BRUSH, 
  TOOL_ITEMS.ARROW,
  TOOL_ITEMS.RECTANGLE,
  TOOL_ITEMS.CIRCLE,
  TOOL_ITEMS.TEXT,
];

export const ARROW_LENGTH = 20;
export const ELEMENT_ERASE_THRESHOLD = 10;

export const MOCK_USERS = [
  { id: 1, name: "Aryan", color: "#f97316", avatar: "A" },
  { id: 2, name: "Priya", color: "#8b5cf6", avatar: "P" },
  { id: 3, name: "Rahul", color: "#06b6d4", avatar: "R" },
];