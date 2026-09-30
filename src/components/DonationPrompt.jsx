import React, { useState, useEffect } from 'react';
import { X, HeartHandshake } from 'lucide-react';

const STORAGE_KEY = 'perfectflow_donation_last_shown';
const INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // every few days per device

export default function DonationPrompt() {
  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      const due = !last || Date.now() - Number(last) > INTERVAL_MS;
      if (!due) return;
      const t = setTimeout(() => {
        setOpen(true);
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      }, 4000);
      return () => clearTimeout(t);
    } catch (e) { /* localStorage unavailable — skip silently */ }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowBubble(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {showBubble && !open && (
        <div className="donation-bubble" onClick={() => { setOpen(true); setShowBubble(false); }}>
          <button
            className="donation-bubble-close"
            onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}
            title="Dismiss"
          >
            <X size={12} />
          </button>
          Want to help?
        </div>
      )}

      <button className="donation-fab" onClick={() => { setOpen(true); setShowBubble(false); }} title="Support Perfect Flow">
        <HeartHandshake size={22} />
      </button>

      {open && (
        <div className="modal" onClick={() => setOpen(false)}>
          <div className="modal-content donation-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-icon donation-close" onClick={() => setOpen(false)} title="Close">
              <X size={18} />
            </button>
            <h2>Support Perfect Flow</h2>
            <img src="/gcash-qr.jpeg" alt="GCash QR code" className="donation-qr" />
            <p className="donation-message">
              I am an independent developer who wants to help bring better flow to every church activity —
              and all of it is for good, and for the glory of the LORD (YHWH). Any support goes directly
              toward developing this software further, and I'm always open to suggestions.
            </p>
            <button className="btn-secondary btn-block" onClick={() => setOpen(false)}>Maybe Later</button>
          </div>
        </div>
      )}
    </>
  );
}
