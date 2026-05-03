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

export default function MockCursors() {
  const { changeToolHandler } = useContext(boardContext);

  const alive = useRef(true);
  const done = useRef(false);

  // 👇 ONLY UI STATE (no logic change)
  const [cursors, setCursors] = useState([
    {
      name: "Aryan",
      color: "#f97316",
      x: 0,
      y: 0,
      active: false,
    },
    {
      name: "Priya",
      color: "#8b5cf6",
      x: 0,
      y: 0,
      active: false,
    },
  ]);

  const moveCursor = (index, x, y, active = true) => {
    setCursors((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], x, y, active };
      return copy;
    });
  };

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

      moveCursor(0, rX1, rY1, true);

      fire(canvas, "mousedown", rX1, rY1);
      await animateDraw(canvas, () => moveCursor(0, rX2, rY2, true), rX1, rY1, rX2, rY2, 900);
      fire(canvas, "mouseup", rX2, rY2);

      moveCursor(0, rX2, rY2, false);

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

      moveCursor(1, pts[0].x, pts[0].y, true);

      fire(canvas, "mousedown", pts[0].x, pts[0].y);

      for (let i = 0; i < pts.length - 1; i++) {
        await animateDraw(
          canvas,
          (x, y) => moveCursor(1, x, y, true),
          pts[i].x,
          pts[i].y,
          pts[i + 1].x,
          pts[i + 1].y,
          250
        );
      }

      fire(canvas, "mouseup", pts.at(-1).x, pts.at(-1).y);

      moveCursor(1, pts.at(-1).x, pts.at(-1).y, false);

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

  return (
    <div className={classes.layer} aria-hidden="true">
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 0.7; }
        }
      `}</style>

      {cursors.map((c, i) => (
        <div
          key={c.name}
          className={classes.cursor}
          style={{
            transform: `translate(${c.x}px, ${c.y}px)`,
          }}
        >
          
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: c.color,
              boxShadow: `0 0 12px ${c.color}`,
              animation: c.active ? "pulse 0.8s infinite" : "none",
            }}
          />

         
          <div
            className={classes.chip}
            style={{ background: c.color }}
          >
            {c.name} {c.active ? "✍️" : ""}
          </div>
        </div>
      ))}
    </div>
  );
}