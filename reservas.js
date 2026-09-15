(function(){

  window.addEventListener('error', (e) => {
    const root = document.getElementById('root');
    if (root && !root.querySelector('.app')) {
      root.innerHTML = '<div class="loading">Error: ' + esc(e.message || 'desconocido') +
        (e.filename ? ' (' + esc(e.filename.split('/').pop()) + ':' + e.lineno + ')' : '') + '</div>';
    }
  });

  function esc(s){
    const d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
  }

  // ============================================================
  // Misma configuración de Firebase que ya usás (Firestore + Auth)
  // ============================================================
  const firebaseConfig = {
    apiKey: "AIzaSyDzsb5cpToF5yLbkt5Vp-771vUm4Tubhi8",
    authDomain: "makiicamii-881b4.firebaseapp.com",
    projectId: "makiicamii-881b4",
    storageBucket: "makiicamii-881b4.firebasestorage.app",
    messagingSenderId: "944023294637",
    appId: "1:944023294637:web:b3352a8b60e37b966aec24"
  };

  if (typeof firebase === 'undefined') {
    document.getElementById('root').innerHTML =
      '<div class="loading">No se pudo cargar Firebase (revisá tu conexión a internet o si algo está bloqueando gstatic.com). Abrí la consola (F12) para más detalle.</div>';
    console.error('firebase SDK no está definido — los <script> de Firebase no se cargaron.');
    return;
  }

  let db, auth, apptsCol;
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    apptsCol = db.collection('appointments');
  } catch (e) {
    console.error(e);
    document.getElementById('root').innerHTML =
      '<div class="loading">Error iniciando Firebase: ' + (e && e.message ? e.message : e) + '</div>';
    return;
  }

  // ============================================================
  // EDITÁ ACÁ los datos para la transferencia de la seña (30%)
  // ============================================================
  const DEPOSIT_INFO = {
    percent: 30,
    bankName: 'PEGAR_AQUI',
    accountType: 'PEGAR_AQUI',
    accountNumber: 'PEGAR_AQUI',
    rut: 'PEGAR_AQUI',
    accountHolder: 'PEGAR_AQUI',
    email: 'PEGAR_AQUI',
    instructions: 'Una vez que transfieras, mandanos el comprobante a @makiicamii por Instagram o WhatsApp para confirmar tu turno.'
  };

  const STYLE_LABELS = { blackwork: 'Blackwork', botanica: 'Botánica', tribal: 'Tribal', otro: 'Otro / no estoy seguro' };
  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAY_NAMES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

  function pad(n){ return n < 10 ? '0'+n : ''+n; }
  function dateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
  function todayKey(){ const t = new Date(); return dateKey(t.getFullYear(), t.getMonth(), t.getDate()); }

  let state = {
    loading: true,
    appointments: {},        // dateKey -> {status, reason?, client?}
    cursor: (() => { const t = new Date(); return { y: t.getFullYear(), m: t.getMonth() }; })(),
    adminMode: false,
    showGate: false,
    pwError: '',
    selectedDate: null,      // fecha clickeada
    bookingSent: false,
    bookingDraft: { name:'', contact:'', style:'blackwork', zone:'', size:'', budget:'', reference:'', notes:'' },
    bookingError: '',
    adminNote: '',
  };

  function toast(msg){
    const el = document.getElementById('rs-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2400);
  }

  // ============================================================
  // Datos en tiempo real desde Firestore
  // ============================================================
  apptsCol.onSnapshot((snap) => {
    const next = {};
    snap.forEach(doc => { next[doc.id] = doc.data(); });
    state.appointments = next;
    state.loading = false;
    render();
  }, (err) => {
    console.error(err);
    state.loading = false;
    toast('No se pudo conectar con la base de datos.');
    render();
  });

  auth.onAuthStateChanged((user) => {
    state.adminMode = !!user;
    render();
  });

  // ============================================================
  // Calendario
  // ============================================================
  function calendarHtml(){
    const { y, m } = state.cursor;
    const first = new Date(y, m, 1);
    const startOffset = (first.getDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = todayKey();

    let cells = '';
    for (let i = 0; i < startOffset; i++) cells += `<div class="cal-cell empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++){
      const key = dateKey(y, m, d);
      const appt = state.appointments[key];
      const isPast = key < today;
      let cls = 'cal-cell';
      let label = '';
      if (key === today) cls += ' today';
      if (isPast) cls += ' past';
      else if (appt && appt.status === 'blocked') { cls += ' blocked'; label = 'No disp.'; }
      else if (appt && appt.status === 'pending') { cls += ' pending'; label = 'Pendiente'; }
      else if (appt && appt.status === 'confirmed') { cls += ' confirmed'; label = 'Reservado'; }
      else { cls += ' free'; }
      cells += `<button class="${cls}" data-date="${key}" ${isPast ? 'disabled' : ''}>
        <span class="cal-num">${d}</span>
        ${label ? `<span class="cal-label">${label}</span>` : ''}
      </button>`;
    }

    return `
      <div class="cal-header">
        <button class="cal-nav" id="cal-prev">‹</button>
        <div class="cal-title">${MONTH_NAMES[m]} ${y}</div>
        <button class="cal-nav" id="cal-next">›</button>
      </div>
      <div class="cal-weekdays">${DAY_NAMES.map(d => `<div>${d}</div>`).join('')}</div>
      <div class="cal-grid">${cells}</div>
      <div class="cal-legend">
        <span><i class="dot free"></i> Libre</span>
        <span><i class="dot pending"></i> Pendiente de seña</span>
        <span><i class="dot confirmed"></i> Reservado</span>
        <span><i class="dot blocked"></i> No disponible</span>
      </div>`;
  }

  function depositBoxHtml(){
    return `
      <div class="deposit-box">
        <div class="deposit-title">Transferí el ${DEPOSIT_INFO.percent}% para confirmar</div>
        <div class="deposit-row"><span>Banco</span><span>${esc(DEPOSIT_INFO.bankName)}</span></div>
        <div class="deposit-row"><span>Tipo de cuenta</span><span>${esc(DEPOSIT_INFO.accountType)}</span></div>
        <div class="deposit-row"><span>N° de cuenta</span><span>${esc(DEPOSIT_INFO.accountNumber)}</span></div>
        <div class="deposit-row"><span>RUT</span><span>${esc(DEPOSIT_INFO.rut)}</span></div>
        <div class="deposit-row"><span>Titular</span><span>${esc(DEPOSIT_INFO.accountHolder)}</span></div>
        <div class="deposit-row"><span>Email</span><span>${esc(DEPOSIT_INFO.email)}</span></div>
        <p class="rs-p small">${esc(DEPOSIT_INFO.instructions)}</p>
      </div>`;
  }

  // ============================================================
  // Formulario de reserva (cliente)
  // ============================================================
  function bookingModalHtml(){
    if (!state.selectedDate || state.adminMode) return '';
    const appt = state.appointments[state.selectedDate];
    if (appt) return ''; // ya ocupado, no debería llegar acá

    if (state.bookingSent){
      return `
        <div class="rs-modal-overlay" id="rs-overlay">
          <div class="rs-modal">
            <h3>¡Listo! Solicitud enviada</h3>
            <p class="rs-p">Tu turno para el <strong>${esc(state.selectedDate)}</strong> quedó como <strong>pendiente de seña</strong>.</p>
            ${depositBoxHtml()}
            <button class="btn" id="rs-close">Entendido</button>
          </div>
        </div>`;
    }

    const f = state.bookingDraft;
    return `
      <div class="rs-modal-overlay" id="rs-overlay">
        <div class="rs-modal">
          <h3>Reservar ${esc(state.selectedDate)}</h3>
          <div class="rs-form">
            <div class="field"><label>Nombre</label><input id="bf-name" value="${esc(f.name)}" /></div>
            <div class="field"><label>Contacto (WhatsApp / Instagram / email)</label><input id="bf-contact" value="${esc(f.contact)}" /></div>
            <div class="field">
              <label>Estilo</label>
              <select id="bf-style">
                ${Object.entries(STYLE_LABELS).map(([k,v]) => `<option value="${k}" ${f.style===k?'selected':''}>${v}</option>`).join('')}
              </select>
            </div>
            <div class="field"><label>Zona del cuerpo</label><input id="bf-zone" value="${esc(f.zone)}" placeholder="ej: antebrazo" /></div>
            <div class="field"><label>Tamaño aproximado</label><input id="bf-size" value="${esc(f.size)}" placeholder="ej: 10x15 cm" /></div>
            <div class="field"><label>Presupuesto aproximado</label><input id="bf-budget" value="${esc(f.budget)}" placeholder="ej: $80.000" /></div>
            <div class="field full"><label>Referencia (descripción o link a una imagen)</label><input id="bf-reference" value="${esc(f.reference)}" /></div>
            <div class="field full"><label>Notas adicionales</label><textarea id="bf-notes">${esc(f.notes)}</textarea></div>
          </div>
          ${state.bookingError ? `<div class="error-text">${esc(state.bookingError)}</div>` : ''}
          <div class="rs-actions">
            <button class="btn" id="bf-submit">Enviar solicitud</button>
            <button class="btn ghost" id="rs-close">Cancelar</button>
          </div>
        </div>
      </div>`;
  }

  // ============================================================
  // Panel de admin por día (Makii)
  // ============================================================
  function adminDayModalHtml(){
    if (!state.selectedDate || !state.adminMode) return '';
    const key = state.selectedDate;
    const appt = state.appointments[key];

    let body = '';
    if (!appt){
      body = `
        <p class="rs-p">Este día está libre.</p>
        <div class="field full"><label>Motivo (opcional)</label><input id="ad-reason" placeholder="ej: vacaciones, personal" /></div>
        <div class="rs-actions"><button class="btn" id="ad-block">Marcar como no disponible</button></div>`;
    } else if (appt.status === 'blocked'){
      body = `
        <p class="rs-p">Marcado como <strong>no disponible</strong>${appt.reason ? ': ' + esc(appt.reason) : ''}.</p>
        <div class="rs-actions"><button class="btn ghost" id="ad-unblock">Liberar día</button></div>`;
    } else {
      const c = appt.client || {};
      body = `
        <div class="client-details">
          <div><strong>${esc(c.name)}</strong> — ${esc(c.contact)}</div>
          <div>${STYLE_LABELS[c.style] || esc(c.style)} · ${esc(c.zone)} · ${esc(c.size)}</div>
          ${c.budget ? `<div>Presupuesto: ${esc(c.budget)}</div>` : ''}
          ${c.reference ? `<div>Referencia: ${esc(c.reference)}</div>` : ''}
          ${c.notes ? `<div>Notas: ${esc(c.notes)}</div>` : ''}
          <div class="status-badge ${appt.status}">${appt.status === 'pending' ? 'Pendiente de seña' : 'Reservado / seña confirmada'}</div>
        </div>
        <div class="rs-actions">
          ${appt.status === 'pending' ? `<button class="btn" id="ad-confirm">Confirmar seña recibida</button>` : ''}
          <button class="btn ghost" id="ad-cancel">Cancelar reserva</button>
        </div>`;
    }

    return `
      <div class="rs-modal-overlay" id="rs-overlay">
        <div class="rs-modal">
          <h3>${esc(key)}</h3>
          ${body}
          <button class="btn ghost rs-close-secondary" id="rs-close">Cerrar</button>
        </div>
      </div>`;
  }

  function gateModalHtml(){
    if (!state.showGate) return '';
    return `
      <div class="rs-modal-overlay" id="gate-overlay">
        <div class="rs-modal">
          <h3>Modo estudio</h3>
          <p class="rs-p">Acceso para Makiicamii, con tu cuenta de Firebase.</p>
          <div class="field"><label>Email</label><input type="email" id="pw-email" autofocus /></div>
          <div class="field"><label>Contraseña</label><input type="password" id="pw-input" /></div>
          ${state.pwError ? `<div class="error-text">${esc(state.pwError)}</div>` : ''}
          <div class="rs-actions">
            <button class="btn" id="pw-enter">Entrar</button>
            <button class="btn ghost" id="pw-cancel">Cancelar</button>
          </div>
        </div>
      </div>`;
  }

  // ============================================================
  // Render principal
  // ============================================================
  function render(){
    const root = document.getElementById('root');
    if (state.loading){
      root.innerHTML = `<div class="loading">Cargando calendario…</div>`;
      return;
    }

    root.innerHTML = `
      <div class="app">
        <div class="bg-tribal-img"></div>
        <nav class="top">
          <div class="brand">Makiicamii</div>
          <div class="nav-links">
            <a href="index.html">Portafolio</a>
            ${state.adminMode
              ? `<button id="exit-admin" class="linklike">Salir del modo estudio</button>`
              : `<button id="open-gate" class="linklike">Modo estudio</button>`}
          </div>
        </nav>

        <section class="rs-hero">
          <div class="reveal reveal-2">
            <h1>Reservá tu turno</h1>
            <p class="rs-p">${state.adminMode
              ? 'Estás en modo estudio: hacé clic en cualquier día para gestionarlo.'
              : `Elegí un día libre. Para confirmar tu turno se abona el ${DEPOSIT_INFO.percent}% por transferencia.`}</p>
          </div>
          ${!state.adminMode ? `<div class="reveal reveal-3 deposit-wrap">
            ${depositBoxHtml()}
            <svg class="corner tl" viewBox="0 0 26 26"><path d="M2 26 C 2 12 12 2 26 2"/></svg>
            <svg class="corner tr" viewBox="0 0 26 26"><path d="M2 26 C 2 12 12 2 26 2"/></svg>
            <svg class="corner bl" viewBox="0 0 26 26"><path d="M2 26 C 2 12 12 2 26 2"/></svg>
            <svg class="corner br" viewBox="0 0 26 26"><path d="M2 26 C 2 12 12 2 26 2"/></svg>
          </div>` : ''}
        </section>

        <section class="cal-wrap">
          ${calendarHtml()}
        </section>

        <footer>
          <div>© ${new Date().getFullYear()} Makiicamii</div>
        </footer>
      </div>
      ${bookingModalHtml()}
      ${adminDayModalHtml()}
      ${gateModalHtml()}
      <div class="toast" id="rs-toast"></div>`;

    attachEvents();
  }

  function attachEvents(){
    const root = document.getElementById('root');

    const prev = document.getElementById('cal-prev');
    const next = document.getElementById('cal-next');
    if (prev) prev.addEventListener('click', () => {
      state.cursor.m -= 1;
      if (state.cursor.m < 0){ state.cursor.m = 11; state.cursor.y -= 1; }
      render();
    });
    if (next) next.addEventListener('click', () => {
      state.cursor.m += 1;
      if (state.cursor.m > 11){ state.cursor.m = 0; state.cursor.y += 1; }
      render();
    });

    root.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const key = cell.dataset.date;
        const appt = state.appointments[key];
        if (!state.adminMode && appt) {
          toast('Ese día ya no está disponible.');
          return;
        }
        state.selectedDate = key;
        state.bookingSent = false;
        state.bookingError = '';
        state.bookingDraft = { name:'', contact:'', style:'blackwork', zone:'', size:'', budget:'', reference:'', notes:'' };
        render();
      });
    });

    const openGate = document.getElementById('open-gate');
    if (openGate) openGate.addEventListener('click', () => { state.showGate = true; state.pwError=''; render(); });
    const exitAdmin = document.getElementById('exit-admin');
    if (exitAdmin) exitAdmin.addEventListener('click', () => { auth.signOut(); render(); });

    const gateOverlay = document.getElementById('gate-overlay');
    if (gateOverlay) gateOverlay.addEventListener('click', (e) => { if (e.target === gateOverlay){ state.showGate=false; render(); } });
    const pwCancel = document.getElementById('pw-cancel');
    if (pwCancel) pwCancel.addEventListener('click', () => { state.showGate=false; state.pwError=''; render(); });
    const pwEnter = document.getElementById('pw-enter');
    if (pwEnter){
      const pwEmail = document.getElementById('pw-email');
      const pwInput = document.getElementById('pw-input');
      const tryEnter = async () => {
        const email = (pwEmail.value||'').trim(), pass = (pwInput.value||'').trim();
        if (!email || !pass){ state.pwError = 'Completá email y contraseña.'; render(); return; }
        try { await auth.signInWithEmailAndPassword(email, pass); state.showGate = false; state.pwError=''; }
        catch(e){ state.pwError = 'Email o contraseña incorrectos.'; }
        render();
      };
      pwEnter.addEventListener('click', tryEnter);
      pwInput.addEventListener('keydown', (e) => { if (e.key==='Enter') tryEnter(); });
      pwInput.focus();
    }

    const rsOverlay = document.getElementById('rs-overlay');
    if (rsOverlay) rsOverlay.addEventListener('click', (e) => { if (e.target === rsOverlay){ state.selectedDate = null; render(); } });
    const rsClose = document.getElementById('rs-close');
    if (rsClose) rsClose.addEventListener('click', () => { state.selectedDate = null; render(); });

    // --- formulario de reserva (cliente) ---
    const bfSubmit = document.getElementById('bf-submit');
    if (bfSubmit){
      ['name','contact','zone','size','budget','reference'].forEach(id => {
        const el = document.getElementById('bf-'+id);
        if (el) el.addEventListener('input', () => { state.bookingDraft[id] = el.value; });
      });
      const notes = document.getElementById('bf-notes');
      if (notes) notes.addEventListener('input', () => { state.bookingDraft.notes = notes.value; });
      const styleSel = document.getElementById('bf-style');
      if (styleSel) styleSel.addEventListener('change', () => { state.bookingDraft.style = styleSel.value; });

      bfSubmit.addEventListener('click', async () => {
        const f = state.bookingDraft;
        if (!f.name.trim() || !f.contact.trim()){
          state.bookingError = 'Completá al menos tu nombre y contacto.';
          render();
          return;
        }
        try {
          await apptsCol.doc(state.selectedDate).set({
            status: 'pending',
            client: { ...f },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
          state.bookingSent = true;
          state.bookingError = '';
          render();
        } catch(e){
          console.error(e);
          state.bookingError = 'No se pudo enviar la solicitud. Probá de nuevo.';
          render();
        }
      });
    }

    // --- panel admin por día ---
    const adBlock = document.getElementById('ad-block');
    if (adBlock) adBlock.addEventListener('click', async () => {
      const reason = (document.getElementById('ad-reason').value || '').trim();
      try {
        await apptsCol.doc(state.selectedDate).set({ status: 'blocked', reason });
        toast('Día marcado como no disponible.');
        state.selectedDate = null;
        render();
      } catch(e){ console.error(e); toast('No se pudo guardar.'); }
    });
    const adUnblock = document.getElementById('ad-unblock');
    if (adUnblock) adUnblock.addEventListener('click', async () => {
      try {
        await apptsCol.doc(state.selectedDate).delete();
        toast('Día liberado.');
        state.selectedDate = null;
        render();
      } catch(e){ console.error(e); toast('No se pudo guardar.'); }
    });
    const adConfirm = document.getElementById('ad-confirm');
    if (adConfirm) adConfirm.addEventListener('click', async () => {
      try {
        await apptsCol.doc(state.selectedDate).update({ status: 'confirmed' });
        toast('Reserva confirmada.');
        state.selectedDate = null;
        render();
      } catch(e){ console.error(e); toast('No se pudo guardar.'); }
    });
    const adCancel = document.getElementById('ad-cancel');
    if (adCancel) adCancel.addEventListener('click', async () => {
      try {
        await apptsCol.doc(state.selectedDate).delete();
        toast('Reserva cancelada, día liberado.');
        state.selectedDate = null;
        render();
      } catch(e){ console.error(e); toast('No se pudo guardar.'); }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.selectedDate){ state.selectedDate = null; render(); }
  });

  render();
})();
