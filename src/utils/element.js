import { ARROW_LENGTH, TOOL_ITEMS } from "../constants";
import getStroke from "perfect-freehand";
import rough from "roughjs/bin/rough";
import { getArrowHeadsCoordinates, isPointCloseToLine, getElementBounds, isPointInBounds } from "./math";

const gen = rough.generator();

export const createElement = (id, x1, y1, x2, y2, { type, stroke, fill, size }) => {
  const element = { id, x1, y1, x2, y2, type, fill, stroke, size };
  let options = { seed: id + 1, fillStyle: "solid" };
  if (stroke) options.stroke = stroke;
  if (fill) options.fill = fill;
  if (size) options.strokeWidth = size;

  switch (type) {
    case TOOL_ITEMS.BRUSH: {
      return {
        id,
        points: [{ x: x1, y: y1 }],
        path: new Path2D(getSvgPathFromStroke(getStroke([{ x: x1, y: y1 }]))),
        type,
        stroke,
      };
    }
    case TOOL_ITEMS.LINE:
      element.roughEle = gen.line(x1, y1, x2, y2, options);
      return element;
    case TOOL_ITEMS.RECTANGLE:
      element.roughEle = gen.rectangle(x1, y1, x2 - x1, y2 - y1, options);
      return element;
    case TOOL_ITEMS.CIRCLE: {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const width = x2 - x1, height = y2 - y1;
      element.roughEle = gen.ellipse(cx, cy, width, height, options);
      return element;
    }
    case TOOL_ITEMS.ARROW: {
      const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(x1, y1, x2, y2, ARROW_LENGTH);
      const points = [[x1, y1], [x2, y2], [x3, y3], [x2, y2], [x4, y4]];
      element.roughEle = gen.linearPath(points, options);
      return element;
    }
    case TOOL_ITEMS.TEXT:
      element.text = "";
      return element;
    default:
      throw new Error("Type not recognized: " + type);
  }
};

// Move an element by dx, dy — returns a new element
export const moveElement = (element, dx, dy) => {
  const moved = {
    ...element,
    x1: element.x1 + dx,
    y1: element.y1 + dy,
  };

  if (element.type === TOOL_ITEMS.BRUSH) {
    moved.points = element.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
    moved.path = new Path2D(getSvgPathFromStroke(getStroke(moved.points)));
    return moved;
  }

  moved.x2 = element.x2 + dx;
  moved.y2 = element.y2 + dy;

  // Rebuild the roughEle
  const options = {
    seed: element.id + 1,
    fillStyle: "solid",
    ...(element.stroke ? { stroke: element.stroke } : {}),
    ...(element.fill ? { fill: element.fill } : {}),
    ...(element.size ? { strokeWidth: element.size } : {}),
  };

  switch (element.type) {
    case TOOL_ITEMS.LINE:
      moved.roughEle = gen.line(moved.x1, moved.y1, moved.x2, moved.y2, options);
      break;
    case TOOL_ITEMS.RECTANGLE:
      moved.roughEle = gen.rectangle(moved.x1, moved.y1, moved.x2 - moved.x1, moved.y2 - moved.y1, options);
      break;
    case TOOL_ITEMS.CIRCLE: {
      const cx = (moved.x1 + moved.x2) / 2, cy = (moved.y1 + moved.y2) / 2;
      moved.roughEle = gen.ellipse(cx, cy, moved.x2 - moved.x1, moved.y2 - moved.y1, options);
      break;
    }
    case TOOL_ITEMS.ARROW: {
      const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(moved.x1, moved.y1, moved.x2, moved.y2, ARROW_LENGTH);
      moved.roughEle = gen.linearPath([[moved.x1, moved.y1], [moved.x2, moved.y2], [x3, y3], [moved.x2, moved.y2], [x4, y4]], options);
      break;
    }
    default:
      break;
  }

  return moved;
};

export const isPointNearElement = (element, pointX, pointY) => {
  const { x1, y1, x2, y2, type } = element;
  const context = document.getElementById("canvas").getContext("2d");
  switch (type) {
    case TOOL_ITEMS.LINE:
    case TOOL_ITEMS.ARROW:
      return isPointCloseToLine(x1, y1, x2, y2, pointX, pointY);
    case TOOL_ITEMS.RECTANGLE:
    case TOOL_ITEMS.CIRCLE:
      return (
        isPointCloseToLine(x1, y1, x2, y1, pointX, pointY) ||
        isPointCloseToLine(x2, y1, x2, y2, pointX, pointY) ||
        isPointCloseToLine(x2, y2, x1, y2, pointX, pointY) ||
        isPointCloseToLine(x1, y2, x1, y1, pointX, pointY)
      );
    case TOOL_ITEMS.BRUSH:
      return context.isPointInPath(element.path, pointX, pointY);
    case TOOL_ITEMS.TEXT: {
      context.font = `${element.size}px Caveat`;
      const textWidth = context.measureText(element.text).width;
      const textHeight = parseInt(element.size);
      return isPointInBounds({ x: x1, y: y1, width: textWidth, height: textHeight }, pointX, pointY);
    }
    default:
      return false;
  }
};

export const getElementAtPosition = (elements, x, y) => {
  // Iterate in reverse so topmost element is selected first
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    const bounds = getElementBounds(el);
    if (isPointInBounds(bounds, x, y)) return el;
  }
  return null;
};

export const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  d.push("Z");
  return d.join(" ");
};