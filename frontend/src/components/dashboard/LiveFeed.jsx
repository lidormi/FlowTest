import React, { useState, useEffect, useRef } from 'react';

export default function LiveFeed({ events }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  if (!events.length) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: 20, marginBottom: 6 }}>📡</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Waiting for live events...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
      {events.map((e, i) => (
        <LiveEvent key={i} event={e} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function LiveEvent({ event }) {
  const isAlert = event.type === 'alert';
  const colors = { completed: 'var(--green)', dropped: 'var(--red)', active: 'var(--blue)' };
  const statusColor = colors[event.data?.status] || 'var(--text2)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 8px', borderRadius: 6,
      background: isAlert ? 'rgba(239,68,68,0.06)' : 'var(--bg3)',
      border: `1px solid ${isAlert ? 'rgba(239,68,68,0.15)' : 'var(--border)'}`,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: isAlert ? 'var(--red)' : statusColor,
        boxShadow: `0 0 6px ${isAlert ? 'var(--red)' : statusColor}`
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {isAlert ? (
          <span style={{ fontSize: 11, color: 'var(--red)' }}>
            🚨 {event.data?.title}
          </span>
        ) : (
          <span style={{ fontSize: 11 }}>
            <span style={{ color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 10 }}>{event.data?.id?.slice(0, 14)}</span>
            {' '}<span style={{ color: statusColor }}>{event.data?.page}</span>
            {' '}<span style={{ color: 'var(--text3)', fontSize: 10 }}>{event.data?.country}</span>
          </span>
        )}
      </div>
      <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)', flexShrink: 0 }}>
        {new Date(event.time).toLocaleTimeString()}
      </span>
    </div>
  );
}
