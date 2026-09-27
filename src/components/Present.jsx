import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../utils/supabaseClient';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export default function Present({ id }) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState('');
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [flash, setFlash] = useState(false);

  const canvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: row, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !row) {
        setStatus('error');
        setErrorMsg('Presentation not found.');
        return;
      }
      const { data: pub } = supabase.storage.from('presentations').getPublicUrl(row.file_path);
      try {
        const pdf = await pdfjsLib.getDocument(pub.publicUrl).promise;
        if (cancelled) return;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setStatus('ready');
      } catch (e) {
        setStatus('error');
        setErrorMsg('Could not load the PDF file.');
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  const renderPage = useCallback(async (num) => {
    const pdf = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch (e) { /* ignore */ }
    }
    const page = await pdf.getPage(num);
    const viewportBase = page.getViewport({ scale: 1 });
    const scale = Math.min(window.innerWidth / viewportBase.width, window.innerHeight / viewportBase.height) * (window.devicePixelRatio || 1);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    const task = page.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = task;
    try { await task.promise; } catch (e) { /* cancelled render, ignore */ }
  }, []);

  useEffect(() => {
    if (status === 'ready') renderPage(pageNum);
  }, [status, pageNum, renderPage]);

  useEffect(() => {
    const onResize = () => { if (status === 'ready') renderPage(pageNum); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [status, pageNum, renderPage]);

  const showFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 900);
  };

  const goNext = useCallback(() => {
    setPageNum(p => Math.min(p + 1, numPages || p));
    showFlash();
  }, [numPages]);

  const goPrev = useCallback(() => {
    setPageNum(p => Math.max(p - 1, 1));
    showFlash();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goNext(); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  const handleClick = (e) => {
    const x = e.clientX / window.innerWidth;
    if (x < 0.5) goPrev(); else goNext();
  };

  if (status === 'error') {
    return <div className="present-stage present-error">{errorMsg}</div>;
  }

  return (
    <div className="present-stage" onClick={handleClick}>
      {status === 'loading' && <div className="present-loading">Loading…</div>}
      <canvas ref={canvasRef} className="present-canvas" />
      {flash && <div className="present-flash">{pageNum} / {numPages}</div>}
    </div>
  );
}
