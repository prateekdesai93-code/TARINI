// Tarini on-page helper: select text or Alt+click anything, and the Tarini face appears right there.
(() => {
  if (window.__tariniBubble || window.top !== window) return;
  window.__tariniBubble = true;

  let enabled = true, theme = 'dark', voice = true;
  const loadSettings = () => chrome.storage.local.get('settings').then(g => {
    const s = g.settings || {};
    enabled = s.bubble !== false; theme = s.theme === 'light' ? 'light' : 'dark'; voice = s.voice !== false;
    if (host) host.dataset.theme = theme;
  }).catch(() => {});
  loadSettings();
  chrome.storage.onChanged.addListener((c, area) => { if (area === 'local' && c.settings) loadSettings(); });

  /* ---------- fonts (from the extension, with unique names) ---------- */
  try {
    [['TariniDisplay', 'fonts/gabarito-latin-600-normal.woff2', '600'], ['TariniDisplay', 'fonts/gabarito-latin-700-normal.woff2', '700'], ['TariniText', 'fonts/atkinson-hyperlegible-latin-400-normal.woff2', '400']]
      .forEach(([fam, file, w]) => { const f = new FontFace(fam, `url(${chrome.runtime.getURL(file)})`, { weight: w }); f.load().then(ff => document.fonts.add(ff)).catch(() => {}); });
  } catch { /* fonts are optional */ }

  /* ---------- shadow UI ---------- */
  const host = document.createElement('div');
  host.id = 'tarini-bubble-host';
  host.dataset.theme = theme;
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host{--bg:#0B0B0C;--bg2:#1A1A1D;--line:rgba(255,255,255,.1);--text:#F5F5F3;--muted:#8F8F97;--sun:#FFC23D;--ink:#2A1D00;--sky:#6CD2FF;--coral:#FF8F7E}
    :host([data-theme=light]){--bg:#FFFFFF;--bg2:#F1F1F0;--line:rgba(0,0,0,.1);--text:#0A0A0B;--muted:#67676F;--sky:#1C8FC9;--coral:#D9493A}
    *{box-sizing:border-box}
    .orb{position:fixed;width:38px;height:38px;border-radius:50%;border:0;padding:0;cursor:pointer;pointer-events:auto;background:radial-gradient(circle at 34% 28%,#FFE6A6 0,var(--sun) 52%,#E39A12 100%);box-shadow:0 6px 18px rgba(0,0,0,.35);animation:pop .22s cubic-bezier(.2,1.5,.4,1)}
    .orb::before,.orb::after{content:"";position:absolute;top:33%;width:5px;height:8px;border-radius:3px;background:var(--ink)}
    .orb::before{left:31%}.orb::after{right:31%}
    .orb:hover{transform:scale(1.08)}
    @keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
    .card{position:fixed;width:340px;max-width:calc(100vw - 16px);max-height:min(70vh,560px);display:flex;flex-direction:column;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:22px;box-shadow:0 30px 70px -20px rgba(0,0,0,.6);pointer-events:auto;font:400 14.5px/1.5 TariniText,system-ui,-apple-system,'Segoe UI',sans-serif;animation:rise .2s ease-out}
    @keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .head{display:flex;align-items:center;gap:9px;padding:12px 12px 6px 14px}
    .face{width:24px;height:24px;border-radius:50%;background:var(--sun);position:relative;flex:none}
    .face::before,.face::after{content:"";position:absolute;top:30%;width:3.5px;height:6px;border-radius:2px;background:var(--ink)}
    .face::before{left:30%}.face::after{right:30%}
    .face.busy::before,.face.busy::after{animation:look 1.2s ease-in-out infinite}
    @keyframes look{0%,100%{transform:translateX(-2px)}50%{transform:translateX(2px)}}
    .name{font:700 15.5px TariniDisplay,system-ui,sans-serif;margin-right:auto}
    .x{width:30px;height:30px;border-radius:9px;border:0;background:none;color:var(--muted);font:600 18px/1 system-ui;cursor:pointer}
    .x:hover{background:var(--bg2);color:var(--text)}
    .about{margin:0 14px 10px;font-size:13px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .about b{color:var(--text);font-weight:600}
    .acts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:0 12px}
    .act{border:1px solid var(--line);background:var(--bg2);color:var(--text);border-radius:14px;padding:9px 4px;font:600 13px/1.2 TariniDisplay,system-ui,sans-serif;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px}
    .act:hover{border-color:var(--sun)}
    .act svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;color:var(--sun)}
    .act.do{background:var(--sun);color:var(--ink);border-color:transparent}
    .act.do svg{color:var(--ink)}
    .askrow{display:flex;gap:6px;padding:10px 12px 12px}
    .askrow input{flex:1;min-width:0;border:1px solid var(--line);background:var(--bg2);color:var(--text);border-radius:999px;padding:9px 13px;font:14.5px TariniText,system-ui,sans-serif;outline:none}
    .askrow input:focus{border-color:var(--muted)}
    .askrow input::placeholder{color:var(--muted)}
    .go{width:36px;height:36px;border-radius:50%;border:0;background:var(--sun);color:var(--ink);cursor:pointer;display:grid;place-items:center;flex:none}
    .go svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
    .out{overflow:auto;padding:2px 14px 12px;border-top:1px solid var(--line);margin-top:2px}
    .out:empty{display:none}
    .say{margin:10px 0 8px;font-size:15px}
    ol{margin:0 0 8px;padding-left:22px}
    li{margin:3px 0}
    li::marker{color:var(--sun);font-family:TariniDisplay,system-ui;font-weight:600}
    .draft{white-space:pre-wrap;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:9px;margin:0 0 8px;font-size:13.5px}
    .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .small{border:1px solid var(--line);background:var(--bg2);color:var(--text);border-radius:999px;padding:5px 11px;font:600 12.5px TariniDisplay,system-ui,sans-serif;cursor:pointer;text-decoration:none}
    .small:hover{border-color:var(--sky)}
    .err{color:var(--coral);margin:10px 0}
    .dots{display:flex;gap:5px;padding:12px 0}
    .dots i{width:7px;height:7px;border-radius:50%;background:var(--sun);animation:bob 1s infinite}
    .dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
    @keyframes bob{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-4px);opacity:1}}
    .badge{position:fixed;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;background:var(--sun);color:var(--ink);font:700 13px/24px TariniDisplay,system-ui,sans-serif;text-align:center;box-shadow:0 0 0 3px rgba(255,194,75,.35),0 3px 10px rgba(0,0,0,.4)}
    .ring{position:fixed;border:2.5px solid var(--sun);border-radius:8px;box-shadow:0 0 0 4px rgba(255,194,75,.25)}
    .pick{position:fixed;border:2px dashed var(--sky);border-radius:6px;background:rgba(108,210,255,.08)}
    .hint{font-size:12px;color:var(--muted);padding:0 14px 10px;margin-top:-4px}
    @media (prefers-reduced-motion:reduce){*{animation:none!important}}
  </style><div id="layer"></div>`;
  const layer = root.getElementById('layer');
  const attach = () => { if (!host.isConnected) document.documentElement.appendChild(host); };

  const ICON = {
    explain: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    howto: '<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    doit: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>',
    go: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  /* ---------- state ---------- */
  let orb = null, card = null, pickBox = null, target = null, markers = [], raf = 0;

  function clearMarkers() { markers.forEach(m => m.node.remove()); markers = []; cancelAnimationFrame(raf); raf = 0; }
  function clearPick() { if (pickBox) { pickBox.remove(); pickBox = null; } }
  function hideOrb() { if (orb) { orb.remove(); orb = null; } }
  function closeAll() { hideOrb(); if (card) { card.remove(); card = null; } clearMarkers(); clearPick(); target = null; if (window.speechSynthesis) speechSynthesis.cancel(); }

  function describe(elm) {
    if (!elm) return '';
    const t = elm.tagName.toLowerCase();
    const label = (elm.getAttribute('aria-label') || elm.getAttribute('title') || elm.getAttribute('placeholder') || elm.innerText || elm.value || elm.alt || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const role = elm.getAttribute('role') || (t === 'a' ? 'link' : t === 'button' ? 'button' : t === 'input' ? `${elm.type || 'text'} field` : t === 'select' ? 'drop-down' : t === 'img' ? 'image' : t === 'td' || t === 'th' ? 'table cell' : 'element');
    return label ? `the ${role} "${label}"` : `a ${role}`;
  }
  function meaningful(elm) {
    return elm.closest('a,button,input,select,textarea,label,[role=button],[role=link],[role=menuitem],[role=tab],[role=row],td,th,li,img') || elm;
  }

  function placeNear(node, rect, w, h) {
    const vw = innerWidth, vh = innerHeight, gap = 10;
    let left = Math.min(Math.max(8, rect.left), vw - w - 8);
    let top = rect.bottom + gap;
    if (top + h > vh - 8) top = Math.max(8, rect.top - h - gap);
    node.style.left = `${left}px`; node.style.top = `${top}px`;
  }

  function showOrbAt(rect, info) {
    attach(); hideOrb();
    orb = el('button', 'orb');
    orb.setAttribute('aria-label', 'Ask Tarini about this');
    orb.title = 'Ask Tarini about this';
    orb.style.left = `${Math.min(rect.right + 6, innerWidth - 46)}px`;
    orb.style.top = `${Math.max(6, rect.top - 44)}px`;
    orb.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
    orb.addEventListener('click', e => { e.stopPropagation(); hideOrb(); openCard(rect, info); });
    layer.append(orb);
  }

  function openCard(rect, info) {
    attach();
    if (card) card.remove();
    clearMarkers();
    target = info;
    card = el('div', 'card');
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Tarini');
    const head = el('div', 'head'); const face = el('span', 'face'); head.append(face, el('span', 'name', 'Tarini'));
    const x = el('button', 'x', '\u00D7'); x.setAttribute('aria-label', 'Close'); x.addEventListener('click', closeAll); head.append(x);
    const about = el('p', 'about'); about.append('About: '); about.append(el('b', '', info.selection ? `"${info.selection.slice(0, 70)}${info.selection.length > 70 ? '\u2026' : ''}"` : (info.context || 'this page')));
    const acts = el('div', 'acts');
    const mk = (key, label, cls) => { const b = el('button', `act ${cls || ''}`); b.innerHTML = ICON[key]; b.append(label); return b; };
    const bExplain = mk('explain', 'Explain'), bHow = mk('howto', 'How do I\u2026'), bDo = mk('doit', 'Do it for me', 'do');
    acts.append(bExplain, bHow, bDo);
    const row = el('div', 'askrow'); const input = el('input'); input.placeholder = 'Or ask anything about this'; input.setAttribute('aria-label', 'Ask Tarini');
    const go = el('button', 'go'); go.innerHTML = ICON.go; go.setAttribute('aria-label', 'Ask'); row.append(input, go);
    const out = el('div', 'out');
    const hint = el('p', 'hint', 'Tip: hold Alt and click anything on a page to ask about it.');
    card.append(head, about, acts, row, hint, out);
    layer.append(card);
    placeNear(card, rect, Math.min(340, innerWidth - 16), 250);
    ['mousedown', 'mouseup', 'click', 'keydown', 'keyup', 'keypress'].forEach(ev => card.addEventListener(ev, e => e.stopPropagation()));

    const run = (mode, question) => ask(mode, question, out, face, hint);
    bExplain.addEventListener('click', () => run('explain', input.value.trim()));
    bHow.addEventListener('click', () => {
      if (!input.value.trim() && !info.selection && !info.element) { input.placeholder = 'How do I what? Type it here'; input.focus(); return; }
      run('howto', input.value.trim());
    });
    bDo.addEventListener('click', () => doIt(input, out));
    go.addEventListener('click', () => { if (input.value.trim()) run('ask', input.value.trim()); else input.focus(); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && input.value.trim()) run('ask', input.value.trim()); if (e.key === 'Escape') closeAll(); });
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  }

  function ask(mode, question, out, face, hint) {
    out.replaceChildren(); clearMarkers();
    const dots = el('div', 'dots'); dots.append(el('i'), el('i'), el('i')); out.append(dots);
    face.classList.add('busy'); if (hint) hint.remove();
    chrome.runtime.sendMessage({ type: 'tarini-ask', mode, question, context: target ? target.context : '', selection: target ? target.selection : '' }, res => {
      face.classList.remove('busy'); dots.remove();
      if (chrome.runtime.lastError || !res) { out.append(el('p', 'err', 'Tarini could not answer. Reload the page and try again.')); return; }
      if (!res.ok) { out.append(el('p', 'err', res.error)); return; }
      if (res.say) out.append(el('p', 'say', res.say));
      if (res.steps && res.steps.length) {
        const ol = el('ol'); res.steps.forEach(s => ol.append(el('li', '', s.text))); out.append(ol);
        showStepMarkers(res.steps);
      }
      if (res.draft) {
        out.append(el('div', 'draft', res.draft));
        const copy = el('button', 'small', 'Copy text');
        copy.addEventListener('click', () => navigator.clipboard.writeText(res.draft).then(() => { copy.textContent = 'Copied'; }).catch(() => {}));
        out.append(copy);
      }
      const row = el('div', 'row');
      (res.sources || []).forEach(s => { const a = el('a', 'small'); a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; try { a.textContent = new URL(s.url).hostname.replace(/^www\./, ''); } catch { a.textContent = s.title; } row.append(a); });
      const again = el('button', 'small', 'Read aloud'); again.addEventListener('click', () => speak(res.say, true)); row.append(again);
      out.append(row);
      speak(res.say);
    });
  }

  function doIt(input, out) {
    const task = input.value.trim();
    if (!task) { input.placeholder = 'What should I do? For example: fill this form'; input.focus(); return; }
    const context = target ? `${target.context}${target.selection ? `. Selected text: "${target.selection.slice(0, 500)}"` : ''}` : '';
    out.replaceChildren(el('p', 'say', 'Opening Tarini beside this page to do it step by step. You approve each step.'));
    chrome.runtime.sendMessage({ type: 'tarini-doit', task, context }, res => {
      if (chrome.runtime.lastError || !res || !res.opened) {
        out.replaceChildren(el('p', 'say', 'Click the yellow Tarini icon in the toolbar to start. Your task is waiting there.'));
      } else setTimeout(closeAll, 900);
    });
  }

  function showStepMarkers(steps) {
    clearMarkers();
    steps.forEach((s, i) => {
      if (s.element_id == null) return;
      const elm = document.querySelector(`[data-tarini-id="${s.element_id}"]`);
      if (!elm) return;
      const ring = el('div', 'ring'), badge = el('div', 'badge', String(i + 1));
      layer.append(ring, badge);
      markers.push({ node: ring, elm, kind: 'ring' }, { node: badge, elm, kind: 'badge' });
    });
    if (!markers.length) return;
    const first = markers[0].elm; const r0 = first.getBoundingClientRect();
    if (r0.top < 0 || r0.bottom > innerHeight) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const tick = () => {
      markers.forEach(m => {
        const r = m.elm.getBoundingClientRect();
        if (m.kind === 'ring') Object.assign(m.node.style, { left: `${r.left - 4}px`, top: `${r.top - 4}px`, width: `${r.width + 8}px`, height: `${r.height + 8}px` });
        else Object.assign(m.node.style, { left: `${r.left}px`, top: `${r.top}px` });
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
  }

  function speak(text, force) {
    if (!text || !window.speechSynthesis || (!voice && !force)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.slice(0, 600));
    const lang = (navigator.language || 'en-US').toLowerCase(), base = lang.split('-')[0];
    const bad = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|junior|organ|princess|ralph|trinoids|whisper|wobble|zarvox|superstar|fred|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley)\b/i;
    const score = v => { const vl = (v.lang || '').toLowerCase(); if (!vl.startsWith(base) || bad.test(v.name)) return -1; return (/natural|neural/i.test(v.name) ? 100 : /premium/i.test(v.name) ? 95 : /enhanced/i.test(v.name) ? 85 : /online/i.test(v.name) ? 80 : /^google/i.test(v.name) ? 70 : 20) + (vl.replace('_', '-') === lang ? 10 : 0); };
    const best = speechSynthesis.getVoices().map(v => [score(v), v]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0])[0];
    if (best) { u.voice = best[1]; u.lang = best[1].lang; }
    speechSynthesis.speak(u);
  }

  /* ---------- triggers ---------- */
  const inOurUI = e => e.composedPath && e.composedPath().includes(host);
  const isEditable = n => n && n.closest && n.closest('input,textarea,[contenteditable=""],[contenteditable="true"]');

  // Alt+click anything
  document.addEventListener('mousedown', e => { if (enabled && e.altKey && e.button === 0 && !inOurUI(e)) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('click', e => {
    if (!enabled || !e.altKey || e.button !== 0 || inOurUI(e)) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const elm = meaningful(e.target);
    const rect = elm.getBoundingClientRect();
    closeAll(); attach();
    pickBox = el('div', 'pick');
    Object.assign(pickBox.style, { left: `${rect.left - 3}px`, top: `${rect.top - 3}px`, width: `${rect.width + 6}px`, height: `${rect.height + 6}px` });
    layer.append(pickBox);
    openCard(rect, { context: describe(elm), selection: '', element: true });
  }, true);

  // Select text, then the face appears
  document.addEventListener('mouseup', e => {
    if (!enabled || e.altKey || inOurUI(e) || e.button !== 0) return;
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (text.length < 2 || !sel.rangeCount || isEditable(sel.anchorNode && sel.anchorNode.parentElement)) { hideOrb(); return; }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      if (!r || (!r.width && !r.height)) return;
      const anchor = sel.anchorNode && sel.anchorNode.parentElement ? meaningful(sel.anchorNode.parentElement) : null;
      showOrbAt(r, { context: anchor ? describe(anchor) : 'selected text', selection: text.slice(0, 3000), element: false });
    }, 10);
  }, true);
  document.addEventListener('mousedown', e => { if (!inOurUI(e) && orb && !e.altKey) hideOrb(); }, true);
  window.addEventListener('scroll', () => hideOrb(), { passive: true });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && (card || orb)) closeAll(); }, true);

  // Keyboard shortcut from the extension (Alt+T by default): ask about the whole page
  chrome.runtime.onMessage.addListener(msg => {
    if (msg && msg.type === 'tarini-open-ask') {
      closeAll();
      const sel = window.getSelection(); const text = sel ? sel.toString().trim() : '';
      const rect = { left: innerWidth - 360, right: innerWidth - 20, top: innerHeight - 330, bottom: innerHeight - 320 };
      openCard(rect, { context: text ? 'selected text' : `this page ("${document.title.slice(0, 60)}")`, selection: text.slice(0, 3000), element: false });
    }
  });
})();
