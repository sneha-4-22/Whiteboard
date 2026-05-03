import { ELEMENT_ERASE_THRESHOLD } from "../constants";

export const isPointCloseToLine = (x1, y1, x2, y2, pointX, pointY) => {
  const distToStart = distanceBetweenPoints(x1, y1, pointX, pointY);
  const distToEnd = distanceBetweenPoints(x2, y2, pointX, pointY);
  const distLine = distanceBetweenPoints(x1, y1, x2, y2);
  return Math.abs(distToStart + distToEnd - distLine) < ELEMENT_ERASE_THRESHOLD;
};

export const isNearPoint = (x, y, x1, y1) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5;
};

export const getArrowHeadsCoordinates = (x1, y1, x2, y2, arrowLength) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const x3 = x2 - arrowLength * Math.cos(angle - Math.PI / 6);
  const y3 = y2 - arrowLength * Math.sin(angle - Math.PI / 6);
  const x4 = x2 - arrowLength * Math.cos(angle + Math.PI / 6);
  const y4 = y2 - arrowLength * Math.sin(angle + Math.PI / 6);
  return { x3, y3, x4, y4 };
};

export const midPointBtw = (p1, p2) => {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2,
  };
};

const distanceBetweenPoints = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

export const getElementBounds = (element) => {
  switch (element.type) {
    case "LINE":
    case "ARROW":
      return {
        x: Math.min(element.x1, element.x2) - 10,
        y: Math.min(element.y1, element.y2) - 10,
        width: Math.abs(element.x2 - element.x1) + 20,
        height: Math.abs(element.y2 - element.y1) + 20,
      };
    case "RECTANGLE":
    case "CIRCLE":
      return {
        x: Math.min(element.x1, element.x2),
        y: Math.min(element.y1, element.y2),
        width: Math.abs(element.x2 - element.x1),
        height: Math.abs(element.y2 - element.y1),
      };
    case "BRUSH":
      if (!element.points || element.points.length === 0) return null;
      const xs = element.points.map((p) => p.x);
      const ys = element.points.map((p) => p.y);
      return {
        x: Math.min(...xs) - 10,
        y: Math.min(...ys) - 10,
        width: Math.max(...xs) - Math.min(...xs) + 20,
        height: Math.max(...ys) - Math.min(...ys) + 20,
      };
    case "TEXT":
      return {
        x: element.x1 - 5,
        y: element.y1 - 5,
        width: (element.text?.length || 1) * (element.size * 0.6) + 10,
        height: element.size + 10,
      };
    default:
      return null;
  }
};

export const isPointInBounds = (bounds, x, y) => {
  if (!bounds) return false;
  return (
    x >= bounds.x &&
    x <= bounds.x + bounds.width &&
    y >= bounds.y &&
    y <= bounds.y + bounds.height
  );
};