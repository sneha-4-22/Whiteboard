import React, { useContext, useEffect, useRef } from "react";
import boardContext from "../../store/board-context";
import { TOOL_ITEMS } from "../../constants";
import classes from "./index.module.css";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function fire(canvas, type, clientX, clientY) {
  const evt = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    button: 0,
    buttons: type === "mousemove" ? 1 : 0,
  });
  canvas.dispatchEvent(evt);
}

function emitActivity(event) {
  window.dispatchEvent(new CustomEvent("activity-event", { detail: event }));
}

function animateDraw(canvas, setCursorPos, x0, y0, x1, y1, durationMs) {
  return new Promise((resolve) => {
    const start = performance.now();

    function frame(now) {
      const raw = Math.min((now - start) / durationMs, 1);
      const t = easeInOut(raw);

      const nx = x0 + (x1 - x0) * t;
      const ny = y0 + (y1 - y0) * t;

      setCursorPos(nx, ny);
      fire(canvas, "mousemove", nx, ny);

      if (raw < 1) requestAnimationFrame(frame);
      else resolve();
    }

    requestAnimationFrame(frame);
  });
}

export default function MockCursors() {
  const { changeToolHandler } = useContext(boardContext);

  const alive = useRef(true);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    alive.current = true;

    async function run() {
      const W = window.innerWidth;
      const H = window.innerHeight;

      let canvas = null;

      for (let i = 0; i < 20; i++) {
        canvas = document.getElementById("canvas");
        if (canvas) break;
        await sleep(200);
      }

      if (!canvas || !alive.current) return;

      await sleep(800);

      // ───── 1. Aryan draws rectangle ─────
      const rX1 = W * 0.5;
      const rY1 = H * 0.28;
      const rX2 = W * 0.68;
      const rY2 = H * 0.46;

      changeToolHandler(TOOL_ITEMS.RECTANGLE);

      fire(canvas, "mousedown", rX1, rY1);
      await animateDraw(canvas, () => {}, rX1, rY1, rX2, rY2, 900);
      fire(canvas, "mouseup", rX2, rY2);

      emitActivity({
        id: Date.now(),
        user: { name: "Aryan", avatar: "A", color: "#f97316" },
        action: "drew a rectangle",
        ts: Date.now(),
      });

      await sleep(700);

      // ───── 2. Priya draws brush stroke ─────
      const pts = [
        { x: W * 0.25, y: H * 0.6 },
        { x: W * 0.35, y: H * 0.55 },
        { x: W * 0.45, y: H * 0.6 },
      ];

      changeToolHandler(TOOL_ITEMS.BRUSH);

      fire(canvas, "mousedown", pts[0].x, pts[0].y);

      for (let i = 0; i < pts.length - 1; i++) {
        await animateDraw(
          canvas,
          () => {},
          pts[i].x,
          pts[i].y,
          pts[i + 1].x,
          pts[i + 1].y,
          250
        );
      }

      fire(canvas, "mouseup", pts.at(-1).x, pts.at(-1).y);

      emitActivity({
        id: Date.now(),
        user: { name: "Priya", avatar: "P", color: "#8b5cf6" },
        action: "sketched a path",
        ts: Date.now(),
      });
    }

    run();

    return () => {
      alive.current = false;
    };
  }, [changeToolHandler]);

  return <div className={classes.layer} aria-hidden="true" />;
}