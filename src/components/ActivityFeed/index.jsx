import React, { useEffect, useRef, useState } from "react";
import classes from "./index.module.css";

const MOCK_USERS = [
  { id: 1, name: "Suzzie", color: "#f97316", avatar: "S" },
  { id: 2, name: "Ananya", color: "#8b5cf6", avatar: "A" },
  { id: 3, name: "Manit", color: "#06b6d4", avatar: "M" },
];

function timeAgo(ts) {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

export default function ActivityFeed() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [unread, setUnread] = useState(0);
  const [, tick] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const evt = e.detail;
      setEvents((prev) => [evt, ...prev].slice(0, 10));
      if (!open) setUnread((u) => u + 1);
    };

    window.addEventListener("activity-event", handler);
    return () => window.removeEventListener("activity-event", handler);
  }, [open]);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    setUnread(0);
  };

  return (
    <div className={classes.root}>
      <button className={classes.toggleBtn} onClick={handleOpen}>
        <span className={classes.toggleIcon}>⚡</span>
        <span className={classes.toggleLabel}>Activity</span>
        {unread > 0 && (
          <span className={classes.badge}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className={classes.panel}>
          <div className={classes.panelHeader}>
            <span className={classes.panelTitle}>Live Activity</span>
            <div className={classes.liveDot} />
            <span className={classes.liveLabel}>LIVE</span>
          </div>

          <div className={classes.onlineStrip}>
            <span className={classes.onlineLabel}>Online now:</span>
            {MOCK_USERS.map((u) => (
              <div
                key={u.id}
                className={classes.onlineAvatar}
                style={{ backgroundColor: u.color }}
                title={u.name}
              >
                {u.avatar}
                <span
                  className={classes.onlinePulse}
                  style={{ borderColor: u.color }}
                />
              </div>
            ))}
          </div>

          <div className={classes.eventList} ref={listRef}>
            {events.map((evt, i) => (
              <div
                key={evt.id}
                className={`${classes.eventItem} ${
                  i === 0 ? classes.eventNew : ""
                }`}
              >
                <div
                  className={classes.eventAvatar}
                  style={{ backgroundColor: evt.user.color }}
                >
                  {evt.user.avatar}
                </div>

                <div className={classes.eventBody}>
                  <span className={classes.eventName}>{evt.user.name}</span>
                  <span className={classes.eventAction}>
                    {" "}{evt.action}
                  </span>
                </div>

                <span className={classes.eventTime}>
                  {timeAgo(evt.ts)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}