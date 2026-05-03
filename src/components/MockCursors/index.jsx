import React, { useContext, useEffect, useRef, useState } from "react";
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

function animateMove(setCursorPos, x0, y0, x1, y1, durationMs) {
  return new Promise((resolve) => {
    const start = performance.now();

    function frame(now) {
      const raw = Math.min((now - start) / durationMs, 1);
      const t = easeInOut(raw);

      setCursorPos(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);

      if (raw < 1) requestAnimationFrame(frame);
      else resolve();
    }

    requestAnimationFrame(frame);
  });
}

export default function MockCursors() {
  const { changeToolHandler } = useContext(boardContext);

  const [aryan, setAryan] = useState({
    x: -200,
    y: -200,
    bubble: null,
    show: false,
    fade: false,
  });

  const [priya, setPriya] = useState({
    x: -200,
    y: -200,
    bubble: null,
    show: false,
    fade: false,
  });

  const alive = useRef(true);

  const updA = (p) => setAryan((s) => ({ ...s, ...p }));
  const updP = (p) => setPriya((s) => ({ ...s, ...p }));

  useEffect(() => {
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

      await sleep(1500);

      const rX1 = W * 0.5;
      const rY1 = H * 0.28;
      const rX2 = W * 0.68;
      const rY2 = H * 0.46;

      updA({ x: W * 0.1, y: H * 0.4, show: true });

      await animateMove((x, y) => updA({ x, y }), W * 0.1, H * 0.4, rX1, rY1, 900);

      changeToolHandler(TOOL_ITEMS.RECTANGLE);

      fire(canvas, "mousedown", rX1, rY1);
      await animateDraw(canvas, (x, y) => updA({ x, y }), rX1, rY1, rX2, rY2, 1000);
      fire(canvas, "mouseup", rX2, rY2);

      emitActivity({
        id: Date.now(),
        user: { name: "Aryan", avatar: "A", color: "#f97316" },
        action: "drew a rectangle",
        ts: Date.now(),
      });

      await sleep(800);

      updA({ show: false });

      const pts = [
        { x: W * 0.22, y: H * 0.62 },
        { x: W * 0.27, y: H * 0.57 },
        { x: W * 0.32, y: H * 0.63 },
        { x: W * 0.37, y: H * 0.56 },
      ];

      updP({ x: pts[0].x, y: pts[0].y, show: true });

      changeToolHandler(TOOL_ITEMS.BRUSH);

      fire(canvas, "mousedown", pts[0].x, pts[0].y);

      for (let i = 0; i < pts.length - 1; i++) {
        await animateDraw(
          canvas,
          (x, y) => updP({ x, y }),
          pts[i].x,
          pts[i].y,
          pts[i + 1].x,
          pts[i + 1].y,
          200
        );
      }

      fire(canvas, "mouseup", pts.at(-1).x, pts.at(-1).y);

      emitActivity({
        id: Date.now(),
        user: { name: "Priya", avatar: "P", color: "#8b5cf6" },
        action: "sketched a path",
        ts: Date.now(),
      });

      await sleep(800);

      updP({ show: false });
    }

    run();

    return () => {
      alive.current = false;
    };
  }, []);

  return <div className={classes.layer} aria-hidden="true" />;
}