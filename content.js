// Tarini page helper. Injected on demand by the side panel; safe to inject many times.
(() => {
  if (window.__tarini) return;

  const ATTR = 'data-tarini-id';
  const MAX_ELEMENTS = 150;
  const INTERACTIVE = [
    'a[href]', 'button', 'input:not([type=hidden])', 'select', 'textarea', 'summary', 'label[for]',
    '[role=button]', '[role=link]', '[role=menuitem]', '[role=menuitemcheckbox]', '[role=menuitemradio]',
    '[role=tab]', '[role=checkbox]', '[role=radio]', '[role=option]', '[role=switch]', '[role=combobox]',
    '[role=textbox]', '[role=searchbox]', '[role=treeitem]', '[role=gridcell]',
    '[contenteditable=""]', '[contenteditable=true]', '[onclick]', '[tabindex]:not([tabindex="-1"])'
  ].join(',');
  const SENSITIVE_NAME = /pass(word|code)?|pwd|card|cc-?num|cvv|cvc|csc|iban|swift|account.?num|routing|sort.?code|\bpin\b|otp|one.?time|security.?code|ssn|id.?number|passport/i;

  let map = new Map();

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clean = (s, n = 90) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

  function isVisible(el) {
    const r = el.getBoundingClientRect();
    if (r.width < 3 || r.height < 3) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
  }
  const inView = r => r.bottom >= 0 && r.top <= innerHeight && r.right >= 0 && r.left <= innerWidth;

  function roleOf(el) {
    const role = el.getAttribute('role');
    if (role) return role;
    const t = el.tagName.toLowerCase();
    if (t === 'a') return 'link';
    if (t === 'input') {
      const ty = (el.type || 'text').toLowerCase();
      if (['button', 'submit', 'reset', 'image'].includes(ty)) return 'button';
      if (ty === 'checkbox' || ty === 'radio') return ty;
      return 'input';
    }
    if (t === 'select') return 'select';
    if (t === 'textarea') return 'textarea';
    if (el.isContentEditable) return 'editor';
    return t === 'button' || t === 'summary' ? 'button' : t;
  }

  function labelOf(el) {
    const aria = el.getAttribute('aria-label');
    if (aria) return clean(aria);
    const by = el.getAttribute('aria-labelledby');
    if (by) {
      const txt = by.split(/\s+/).map(id => document.getElementById(id)?.innerText || '').join(' ');
      if (clean(txt)) return clean(txt);
    }
    if (el.labels && el.labels[0]) return clean(el.labels[0].innerText);
    const ph = el.getAttribute('placeholder'); if (ph) return clean(ph);
    const title = el.getAttribute('title'); if (title) return clean(title);
    const alt = el.getAttribute('alt') || el.querySelector?.('img[alt]')?.getAttribute('alt'); if (alt) return clean(alt);
    if (el.tagName === 'INPUT' && ['button', 'submit', 'reset'].includes(el.type)) return clean(el.value);
    const name = el.getAttribute('name'); const text = clean(el.innerText || el.textContent);
    return text || (name ? clean(name) : '');
  }

  function isSensitiveEl(el) {
    if (!el) return false;
    const type = (el.getAttribute('type') || '').toLowerCase();
    if (type === 'password') return true;
    const ac = (el.getAttribute('autocomplete') || '').toLowerCase();
    if (/cc-|one-time-code|current-password|new-password/.test(ac)) return true;
    const hint = [el.name, el.id, el.getAttribute('aria-label'), el.getAttribute('placeholder'), el.labels && el.labels[0] ? el.labels[0].innerText : ''].join(' ');
    return (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && SENSITIVE_NAME.test(hint);
  }

  function collect(root, out) {
    root.querySelectorAll(INTERACTIVE).forEach(el => out.push(el));
    root.querySelectorAll('*').forEach(el => { if (el.shadowRoot && el.id !== 'tarini-bubble-host' && el.id !== 'tarini-dock-host') collect(el.shadowRoot, out); });
  }

  function describe(el, id, r) {
    const d = { id, role: roleOf(el), label: labelOf(el) };
    const t = el.tagName.toLowerCase();
    if (t === 'input') d.type = (el.type || 'text').toLowerCase();
    const sens = isSensitiveEl(el);
    if (sens) d.sensitive = true;
    if ('value' in el && t !== 'button' && t !== 'select' && !['checkbox', 'radio', 'button', 'submit'].includes(d.type || '')) {
      if (el.value) d.value = sens ? '(hidden)' : clean(el.value, 60);
    }
    if (t === 'select') d.value = clean(el.options[el.selectedIndex]?.text || '', 60);
    if (d.type === 'checkbox' || d.type === 'radio' || el.getAttribute('aria-checked')) d.checked = el.checked ?? el.getAttribute('aria-checked') === 'true';
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') d.disabled = true;
    if (t === 'a') { try { const u = new URL(el.href, location.href); d.href = (u.host === location.host ? '' : u.host) + u.pathname.slice(0, 40); } catch { /* ignore */ } }
    d.box = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
    return d;
  }

  function snapshot() {
    document.querySelectorAll('[' + ATTR + ']').forEach(e => e.removeAttribute(ATTR));
    map = new Map();
    const els = []; collect(document, els);
    const seen = new Set(); const items = []; let id = 1;
    for (const el of els) {
      if (seen.has(el) || !el.isConnected) continue;
      seen.add(el);
      if (!isVisible(el)) continue;
      const r = el.getBoundingClientRect();
      if (!inView(r)) continue;
      if (el.tagName === 'LABEL' && el.control && isVisible(el.control)) continue;
      map.set(id, el); el.setAttribute(ATTR, String(id));
      items.push(describe(el, id, r)); id++;
      if (items.length >= MAX_ELEMENTS) break;
    }
    const text = clean(document.body ? document.body.innerText : '', 2000);
    const doc = document.documentElement;
    return {
      app: (document.querySelector('.o_web_client, .o_action_manager, .o_main_navbar') ? 'odoo' : ''),
      url: location.href, title: document.title, scrollY: Math.round(scrollY),
      scrollMax: Math.max(0, doc.scrollHeight - innerHeight), viewport: [innerWidth, innerHeight],
      elements: items, text, truncated: els.length > items.length
    };
  }

  function get(id) {
    const el = map.get(Number(id));
    if (!el || !el.isConnected) throw new Error(`Element ${id} is no longer on the page. Use the newest element list.`);
    return el;
  }

  /* ---------- Overlays ---------- */
  function hideMarks() { document.getElementById('__tarini_marks')?.remove(); }
  function showMarks() {
    hideMarks();
    const layer = document.createElement('div');
    layer.id = '__tarini_marks';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483646';
    for (const [id, el] of map) {
      if (!el.isConnected) continue;
      const r = el.getBoundingClientRect();
      const b = document.createElement('div');
      b.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;outline:1.5px solid rgba(28,143,201,.9);border-radius:3px`;
      const t = document.createElement('span');
      t.textContent = String(id);
      t.style.cssText = 'position:absolute;left:-1px;top:-13px;background:#FFC24B;color:#2A1D00;font:700 10px/13px Arial,sans-serif;padding:0 3px;border-radius:3px';
      b.append(t); layer.append(b);
    }
    document.documentElement.append(layer);
    return true;
  }
  function clearHighlight() { document.getElementById('__tarini_hl')?.remove(); }
  function highlight(id, text) {
    clearHighlight();
    let el; try { el = get(id); } catch { return false; }
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    const r = el.getBoundingClientRect();
    const wrap = document.createElement('div');
    wrap.id = '__tarini_hl';
    wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    const ring = document.createElement('div');
    ring.style.cssText = `position:fixed;left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px;border:3px solid #FFC24B;border-radius:8px;box-shadow:0 0 0 4px rgba(255,194,75,.35),0 0 24px rgba(255,194,75,.6)`;
    ring.animate([{ boxShadow: '0 0 0 4px rgba(255,194,75,.35)' }, { boxShadow: '0 0 0 10px rgba(255,194,75,.05)' }], { duration: 1100, iterations: Infinity });
    const tag = document.createElement('div');
    tag.textContent = text || 'Tarini wants to use this';
    const below = r.top < 50;
    tag.style.cssText = `position:fixed;left:${Math.max(8, Math.min(r.left - 6, innerWidth - 320))}px;top:${below ? r.bottom + 12 : r.top - 40}px;max-width:310px;background:#1C1C1E;color:#fff;font:600 13px/1.3 Arial,sans-serif;padding:7px 11px;border-radius:9px;border:2px solid #FFC24B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis`;
    wrap.append(ring, tag);
    document.documentElement.append(wrap);
    return true;
  }

  /* ---------- Actions ---------- */
  function mouse(el, type, x, y) {
    const opts = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, view: window, button: 0 };
    const Ev = type.startsWith('pointer') ? PointerEvent : MouseEvent;
    el.dispatchEvent(new Ev(type, opts));
  }
  async function click(id) {
    const el = get(id);
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') throw new Error('That element is disabled right now.');
    clearHighlight();
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    await sleep(80);
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    mouse(el, 'pointerover', x, y); mouse(el, 'mouseover', x, y);
    mouse(el, 'pointerdown', x, y); mouse(el, 'mousedown', x, y);
    if (typeof el.focus === 'function') el.focus({ preventScroll: true });
    mouse(el, 'pointerup', x, y); mouse(el, 'mouseup', x, y);
    el.click();
    return 'Clicked.';
  }
  function setNativeValue(el, v) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) desc.set.call(el, v); else el.value = v;
  }
  function keyEvent(target, key, type) {
    const codes = { Enter: 13, Escape: 27, Tab: 9, ArrowDown: 40, ArrowUp: 38, Backspace: 8 };
    const ev = new KeyboardEvent(type, { key, code: key, keyCode: codes[key] || 0, which: codes[key] || 0, bubbles: true, cancelable: true, composed: true });
    return target.dispatchEvent(ev);
  }
  async function pressKey(key) {
    const target = document.activeElement || document.body;
    const allowed = keyEvent(target, key, 'keydown');
    if (key === 'Enter') keyEvent(target, key, 'keypress');
    keyEvent(target, key, 'keyup');
    if (key === 'Enter' && allowed && target.form && target.tagName === 'INPUT' && typeof target.form.requestSubmit === 'function') {
      const hasSubmit = target.form.querySelector('button:not([type=button]),input[type=submit]');
      if (hasSubmit) target.form.requestSubmit();
    }
    if (key === 'Tab') {
      const focusables = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(isVisible);
      const i = focusables.indexOf(target); if (i > -1 && focusables[i + 1]) focusables[i + 1].focus();
    }
    return `Pressed ${key}.`;
  }
  async function typeText(id, text, clearFirst = true, pressEnter = false) {
    const el = get(id);
    if (isSensitiveEl(el)) throw new Error('SENSITIVE_FIELD');
    if (el.disabled || el.readOnly) throw new Error('That field cannot be edited right now.');
    clearHighlight();
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    el.focus();
    if (el.isContentEditable) {
      if (clearFirst) { document.execCommand('selectAll', false); document.execCommand('delete', false); }
      document.execCommand('insertText', false, text);
    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      setNativeValue(el, clearFirst ? text : (el.value || '') + text);
      el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: text, inputType: 'insertText' }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else throw new Error('That element does not take typed text. Click it first, or choose a text field.');
    if (pressEnter) { await sleep(150); await pressKey('Enter'); }
    return 'Typed the text.';
  }
  async function selectOption(id, option) {
    const el = get(id);
    if (el.tagName !== 'SELECT') throw new Error('This is not a standard drop-down. Click it, then click the option you want.');
    const want = String(option).trim().toLowerCase();
    const opts = [...el.options];
    const match = opts.find(o => o.text.trim().toLowerCase() === want) || opts.find(o => o.value.toLowerCase() === want) || opts.find(o => o.text.toLowerCase().includes(want));
    if (!match) throw new Error(`No option matching "${option}". Options: ${opts.slice(0, 15).map(o => o.text.trim()).join(', ')}`);
    clearHighlight();
    el.value = match.value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return `Selected "${match.text.trim()}".`;
  }
  function scrollContainer() {
    let el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    while (el && el !== document.body && el !== document.documentElement) {
      const cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 20) return el;
      el = el.parentElement;
    }
    return null;
  }
  async function scrollPage(direction, amount = 1) {
    clearHighlight();
    const box = scrollContainer();
    const dy = (direction === 'up' ? -1 : 1) * Math.round((box ? box.clientHeight : innerHeight) * 0.8 * Math.max(0.3, Math.min(3, amount)));
    if (box) box.scrollBy({ top: dy, behavior: 'instant' }); else window.scrollBy({ top: dy, behavior: 'instant' });
    return `Scrolled ${direction}.`;
  }
  function dockVisible(v) {
    ['tarini-dock-host', 'tarini-bubble-host'].forEach(id => { const h = document.getElementById(id); if (h) h.style.visibility = v ? 'visible' : 'hidden'; });
    return true;
  }
  function isSensitive(id) { try { return isSensitiveEl(get(id)); } catch { return false; } }

  function readText() {
    const clone = document.body ? document.body.innerText : '';
    let text = String(clone || '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
    if (text.length > 40000) text = text.slice(0, 40000) + '\n[page text cut at 40000 characters]';
    return { title: document.title, url: location.href, text };
  }
  const api = { readText, dockVisible, snapshot, showMarks, hideMarks, highlight, clearHighlight, click, typeText, selectOption, pressKey, scrollPage, isSensitive };
  window.__tarini = {
    async call(name, args) {
      try { return { ok: true, value: await api[name](...(args || [])) }; }
      catch (e) { return { ok: false, error: e && e.message ? e.message : String(e) }; }
    }
  };
})();
