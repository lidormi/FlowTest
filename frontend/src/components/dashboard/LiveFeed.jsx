import React, { useEffect, useRef } from 'react';
import styles from './LiveFeed.module.css';

export default function LiveFeed({ events }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  if (!events.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📡</div>
        <div className={styles.emptyText}>Waiting for live events...</div>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {events.map((e, i) => <LiveEvent key={i} event={e} />)}
      <div ref={bottomRef} />
    </div>
  );
}

function LiveEvent({ event }) {
  const isAlert = event.type === 'alert';
  const statusColors = { completed: 'var(--green)', dropped: 'var(--red)', active: 'var(--blue)' };
  const statusColor = statusColors[event.data?.status] || 'var(--text2)';
  const dotColor = isAlert ? 'var(--red)' : statusColor;

  return (
    <div className={`${styles.event} ${isAlert ? styles.eventAlert : ''}`}>
      <div
        className={styles.dot}
        style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
      />
      <div className={styles.eventBody}>
        {isAlert ? (
          <span className={styles.alertText}>🚨 {event.data?.title}</span>
        ) : (
          <span className={styles.sessionText}>
            <span className={styles.sessionId}>{event.data?.id?.slice(0, 14)}</span>
            {' '}<span style={{ color: statusColor }}>{event.data?.page}</span>
            {' '}<span className={styles.sessionCountry}>{event.data?.country}</span>
          </span>
        )}
      </div>
      <span className={styles.eventTime}>
        {new Date(event.time).toLocaleTimeString()}
      </span>
    </div>
  );
}
