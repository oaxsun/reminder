console.log('ANCHR v36-calendar-compact-colors');
const APP_VERSION = 'v36-calendar-compact-colors';
const SUPABASE_URL = 'https://qjicwqpjxsqynoudwylk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rl7m3zQsatLJL2Lb3yHPOg_nnCr712U';
const PAYMENTS_TABLE = 'payments';
const PAYMENT_HISTORY_TABLE = 'payment_history';
console.info(`ANCHR ${APP_VERSION} conectado a ${SUPABASE_URL}`);

const today = new Date();
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

let currentUser = null;
let payments = [];
let activeFilter = 'all';
let activeView = 'dashboard';
let calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedCalendarDate = toInputDate(today);
let authMode = 'login';
let initialLoadDone = false;
let paymentsLoadTimer = null;
let lastLoadedUserId = null;

const els = {
  authScreen: document.querySelector('#authScreen'),
  authForm: document.querySelector('#authForm'),
  authTitle: document.querySelector('#authTitle'),
  authCopy: document.querySelector('#authCopy'),
  authEmail: document.querySelector('#authEmail'),
  authPassword: document.querySelector('#authPassword'),
  authConfirmPassword: document.querySelector('#authConfirmPassword'),
  confirmPasswordField: document.querySelector('#confirmPasswordField'),
  rememberMe: document.querySelector('#rememberMe'),
  authSubmit: document.querySelector('#authSubmit'),
  authMessage: document.querySelector('#authMessage'),
  toggleAuthMode: document.querySelector('#toggleAuthMode'),
  googleLoginBtn: document.querySelector('#googleLoginBtn'),
  appShell: document.querySelector('#appShell'),
  sidebar: document.querySelector('#sidebar'),
  mobileTabbar: document.querySelector('#mobileTabbar'),
  topbarTitle: document.querySelector('.topbar h2'),
  topbarCopy: document.querySelector('.topbar p'),
  dashboardView: document.querySelector('#dashboardView'),
  calendarView: document.querySelector('#calendarView'),
  historyView: document.querySelector('#historyView'),
  moreView: document.querySelector('#moreView'),
  desktopNav: document.querySelector('#desktopNav'),
  calendarNewPaymentBtn: document.querySelector('#calendarNewPaymentBtn'),
  calendarTodayBtn: document.querySelector('#calendarTodayBtn'),
  prevMonthBtn: document.querySelector('#prevMonthBtn'),
  nextMonthBtn: document.querySelector('#nextMonthBtn'),
  calendarMonthLabel: document.querySelector('#calendarMonthLabel'),
  calendarGrid: document.querySelector('#calendarGrid'),
  nextPaymentCard: document.querySelector('#nextPaymentCard'),
  selectedDayTitle: document.querySelector('#selectedDayTitle'),
  selectedDayCount: document.querySelector('#selectedDayCount'),
  selectedDayPayments: document.querySelector('#selectedDayPayments'),
  upcomingPayments: document.querySelector('#upcomingPayments'),
  logoutBtn: document.querySelector('#logoutBtn'),
  userAvatar: document.querySelector('#userAvatar'),
  userName: document.querySelector('#userName'),
  table: document.querySelector('#paymentsTable'),
  empty: document.querySelector('#emptyState'),
  totalMonth: document.querySelector('#totalMonth'),
  totalPaid: document.querySelector('#totalPaid'),
  totalPending: document.querySelector('#totalPending'),
  totalOverdue: document.querySelector('#totalOverdue'),
  totalCount: document.querySelector('#totalCount'),
  paidCount: document.querySelector('#paidCount'),
  pendingCount: document.querySelector('#pendingCount'),
  overdueCount: document.querySelector('#overdueCount'),
  modal: document.querySelector('#paymentModal'),
  form: document.querySelector('#paymentForm'),
  modalTitle: document.querySelector('#modalTitle'),
  paymentId: document.querySelector('#paymentId'),
  paymentName: document.querySelector('#paymentName'),
  paymentCategory: document.querySelector('#paymentCategory'),
  paymentFrequency: document.querySelector('#paymentFrequency'),
  paymentIcon: document.querySelector('#paymentIcon'),
  paymentIconColor: document.querySelector('#paymentIconColor'),
  iconColorPicker: document.querySelector('#iconColorPicker'),
  iconPicker: document.querySelector('#iconPicker'),
  iconPickerTrigger: document.querySelector('#iconPickerTrigger'),
  paymentIconPreview: document.querySelector('#paymentIconPreview'),
  paymentIconLabel: document.querySelector('#paymentIconLabel'),
  deletePaymentBtn: document.querySelector('#deletePaymentBtn'),
  paymentAmountType: document.querySelector('#paymentAmountType'),
  paymentAmount: document.querySelector('#paymentAmount'),
  paymentAmountField: document.querySelector('#paymentAmountField'),
  paymentDueDay: document.querySelector('#paymentDueDay'),
  paymentLastPaid: document.querySelector('#paymentLastPaid'),
  statusFilter: document.querySelector('#statusFilter'),
  payModal: document.querySelector('#payModal'),
  payForm: document.querySelector('#payForm'),
  payId: document.querySelector('#payId'),
  payAmount: document.querySelector('#payAmount'),
  payDescription: document.querySelector('#payDescription'),
  toast: document.querySelector('#toast')
};

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  initAuth();
});
function bindEvents() {
  document.querySelector('#openModalBtn').addEventListener('click', () => openModal());
  els.calendarNewPaymentBtn?.addEventListener('click', () => openModal());
  els.calendarTodayBtn?.addEventListener('click', () => { calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1); selectedCalendarDate = toInputDate(today); renderCalendar(); });
  els.prevMonthBtn?.addEventListener('click', () => { calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1); selectedCalendarDate = toInputDate(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1)); renderCalendar(); });
  els.nextMonthBtn?.addEventListener('click', () => { calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1); selectedCalendarDate = toInputDate(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1)); renderCalendar(); });
  els.logoutBtn.addEventListener('click', logout);
  document.querySelector('#moreLogoutBtn')?.addEventListener('click', logout);
  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => setActiveView(button.dataset.view));
  });
  els.toggleAuthMode.addEventListener('click', toggleAuthMode);
  els.googleLoginBtn.addEventListener('click', loginWithGoogle);
  els.authForm.addEventListener('submit', handleAuthSubmit);
  els.iconColorPicker.addEventListener('click', event => {
    const dot = event.target.closest('[data-color]');
    if (!dot) return;
    setSelectedColor(dot.dataset.color);
  });
  els.iconPickerTrigger.addEventListener('click', event => {
    event.stopPropagation();
    const isHidden = els.iconPicker.classList.toggle('hidden');
    els.iconPickerTrigger.setAttribute('aria-expanded', String(!isHidden));
  });
  els.iconPicker.addEventListener('click', event => {
    const choice = event.target.closest('[data-icon]');
    if (!choice) return;
    setSelectedIcon(choice.dataset.icon);
    els.iconPicker.classList.add('hidden');
    els.iconPickerTrigger.setAttribute('aria-expanded', 'false');
  });
  els.deletePaymentBtn.addEventListener('click', () => {
    const id = els.paymentId.value;
    if (!id) return;
    deletePayment(id);
  });
  document.querySelectorAll('[data-close="payment"]').forEach(el => el.addEventListener('click', closeModal));
  document.querySelectorAll('[data-close="pay"]').forEach(el => el.addEventListener('click', closePayModal));

  els.statusFilter.addEventListener('change', event => {
    activeFilter = event.target.value;
    render();
  });

  els.paymentCategory.addEventListener('change', () => {
    setSelectedIcon(getDefaultIcon(els.paymentCategory.value));
    setSelectedColor(getDefaultColor(els.paymentCategory.value));
    els.paymentAmountType.value = getDefaultAmountType(els.paymentCategory.value);
    syncAmountField();
  });

  els.paymentAmountType.addEventListener('change', syncAmountField);

  document.addEventListener('click', event => {
    if (!event.target.closest('.menu-wrap')) {
      document.querySelectorAll('.row-menu').forEach(menu => {
        menu.classList.add('hidden');
        menu.removeAttribute('style');
      });
    }
    if (!event.target.closest('.picker-wrap')) {
      els.iconPicker.classList.add('hidden');
      els.iconPickerTrigger.setAttribute('aria-expanded', 'false');
    }
  });

  els.form.addEventListener('submit', async event => {
    event.preventDefault();
    const id = els.paymentId.value || crypto.randomUUID();
    const existing = payments.find(payment => payment.id === id);
    const payment = {
      id,
      name: els.paymentName.value.trim(),
      category: els.paymentCategory.value,
      frequency: els.paymentFrequency.value,
      icon: els.paymentIcon.value,
      iconColor: els.paymentIconColor.value,
      amountType: els.paymentAmountType.value,
      amount: els.paymentAmountType.value === 'fixed' ? Number(els.paymentAmount.value || 0) : 0,
      dueDay: Number(els.paymentDueDay.value),
      lastPaid: els.paymentLastPaid.value,
      lastPaidAmount: existing?.lastPaidAmount || null,
      paidPeriod: existing?.paidPeriod || '',
      history: existing?.history || []
    };

    const saved = await savePayment(payment, Boolean(existing));
    if (!saved) return;
    closeModal();
    await loadPayments('after-save');
  });

  els.payForm.addEventListener('submit', async event => {
    event.preventDefault();
    await registerPayment(els.payId.value, Number(els.payAmount.value));
    closePayModal();
  });
}

async function initAuth() {
  validateSupabaseConfig();

  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.info(`ANCHR ${APP_VERSION}: auth event`, event, session?.user?.id || 'sin usuario');
    currentUser = session?.user || null;
    updateAuthUI();

    if (currentUser) {
      window.setTimeout(() => loadPayments(`auth-${event}`), 0);
    } else {
      initialLoadDone = false;
      lastLoadedUserId = null;
      payments = [];
      render();
    }
  });

  await restoreSessionAndLoad('init');

  window.addEventListener('pageshow', () => forceLoadPayments('pageshow'));
  window.addEventListener('focus', () => forceLoadPayments('focus'));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) forceLoadPayments('visible');
  });
}

async function forceLoadPayments(source = 'forced') {
  await restoreSessionAndLoad(source);
}

function startInitialLoadRetries(source = 'retry') {
  let attempts = 0;
  clearInterval(paymentsLoadTimer);
  paymentsLoadTimer = setInterval(async () => {
    attempts += 1;
    if (!currentUser) {
      clearInterval(paymentsLoadTimer);
      return;
    }
    await loadPayments(`${source}-retry-${attempts}`);
    if (payments.length > 0 || attempts >= 8) {
      clearInterval(paymentsLoadTimer);
    }
  }, 700);
}

async function restoreSessionAndLoad(source = 'manual') {
  try {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) console.warn('No se pudo leer la sesión:', sessionError);

    let user = sessionData.session?.user || null;

    if (!user) {
      const { data: userData, error: userError } = await supabaseClient.auth.getUser();
      if (userError) console.warn('No se pudo leer el usuario:', userError);
      user = userData.user || null;
    }

    currentUser = user;
    updateAuthUI();

    if (currentUser) {
      console.info(`ANCHR ${APP_VERSION}: sesión restaurada (${source})`, currentUser.id);
      await loadPayments(source);
      initialLoadDone = true;
      lastLoadedUserId = currentUser.id;
    } else {
      console.info(`ANCHR ${APP_VERSION}: sin sesión (${source})`);
    }
  } catch (error) {
    console.error('No se pudo restaurar la sesión:', error);
  }
}

function validateSupabaseConfig() {
  if (SUPABASE_URL.includes('PEGA_AQUI') || SUPABASE_ANON_KEY.includes('PEGA_AQUI')) {
    els.authMessage.textContent = 'Configura SUPABASE_URL y SUPABASE_ANON_KEY en app.js antes de publicar.';
  }
}

function updateAuthUI() {
  const loggedIn = Boolean(currentUser);
  els.authScreen?.classList.toggle('hidden', loggedIn);
  els.appShell?.classList.toggle('hidden', !loggedIn);
  els.sidebar?.classList.toggle('hidden', !loggedIn);
  els.mobileTabbar?.classList.toggle('hidden', !loggedIn);
  document.body.classList.toggle('is-authenticated', loggedIn);

  if (currentUser) {
    const email = currentUser.email || 'usuario';
    if (els.userName) els.userName.textContent = email.split('@')[0];
    if (els.userAvatar) els.userAvatar.textContent = email.charAt(0).toUpperCase();
  }
}

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  const isRegister = authMode === 'register';
  els.authTitle.textContent = isRegister ? 'Crear cuenta' : 'Iniciar sesión';
  els.authCopy.textContent = isRegister ? 'Guarda tus pagos y consúltalos desde cualquier dispositivo.' : 'Entra para sincronizar tus pagos en todos tus dispositivos.';
  els.authSubmit.textContent = isRegister ? 'Crear cuenta' : 'Iniciar sesión';
  els.toggleAuthMode.textContent = isRegister ? 'Ya tengo cuenta' : 'Crear cuenta nueva';
  els.confirmPasswordField.classList.toggle('hidden', !isRegister);
  els.authConfirmPassword.required = isRegister;
  els.authConfirmPassword.value = '';
  els.authPassword.setAttribute('autocomplete', isRegister ? 'new-password' : 'current-password');
  els.authMessage.textContent = '';
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  els.authMessage.textContent = '';
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;

  if (authMode === 'register') {
    const confirmPassword = els.authConfirmPassword.value;
    if (password !== confirmPassword) {
      els.authMessage.textContent = 'Las contraseñas no coinciden.';
      return;
    }
    if (password.length < 6) {
      els.authMessage.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
  }

  els.authSubmit.disabled = true;
  els.authSubmit.textContent = authMode === 'register' ? 'Creando cuenta...' : 'Entrando...';

  const remember = els.rememberMe ? els.rememberMe.checked : true;
  localStorage.setItem('anchr_remember_session', remember ? '1' : '0');
  const payload = { email, password };
  const response = authMode === 'register'
    ? await supabaseClient.auth.signUp(payload)
    : await supabaseClient.auth.signInWithPassword(payload);

  els.authSubmit.disabled = false;
  els.authSubmit.textContent = authMode === 'register' ? 'Crear cuenta' : 'Iniciar sesión';

  if (response.error) {
    els.authMessage.textContent = response.error.message;
    return;
  }

  if (authMode === 'register' && !response.data.session) {
    els.authMessage.textContent = 'Cuenta creada. Revisa tu correo para confirmar el registro.';
  }
}

async function loginWithGoogle() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error) els.authMessage.textContent = error.message;
}

async function logout() {
  await supabaseClient.auth.signOut();
}

function normalizePayment(payment) {
  return {
    amountType: 'variable',
    lastPaidAmount: null,
    history: [],
    icon: getDefaultIcon(payment.category),
    iconColor: getDefaultColor(payment.category),
    paidPeriod: '',
    ...payment
  };
}

function fromDb(row) {
  return normalizePayment({
    id: row.id,
    name: row.name,
    category: row.category,
    frequency: row.frequency,
    amountType: row.amount_type,
    amount: Number(row.amount || 0),
    dueDay: Number(row.due_day || 1),
    icon: row.icon,
    iconColor: row.icon_color,
    lastPaid: row.last_paid,
    lastPaidAmount: row.last_paid_amount === null ? null : Number(row.last_paid_amount),
    paidPeriod: row.paid_period || '',
    history: row.payment_history || []
  });
}

function toDb(payment) {
  return {
    id: payment.id,
    user_id: currentUser.id,
    name: payment.name,
    category: payment.category,
    frequency: payment.frequency,
    amount_type: payment.amountType,
    amount: payment.amount,
    due_day: payment.dueDay,
    icon: payment.icon,
    icon_color: payment.iconColor,
    last_paid: payment.lastPaid || null,
    last_paid_amount: payment.lastPaidAmount,
    paid_period: payment.paidPeriod || ''
  };
}

async function loadPayments(source = 'manual') {
  console.info(`ANCHR ${APP_VERSION}: loadPayments iniciado (${source})`);
  try {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) console.warn('ANCHR sesión no disponible antes de cargar pagos:', sessionError);

    const session = sessionData?.session || null;
    const user = session?.user || currentUser || null;

    if (!user || !session?.access_token) {
      payments = [];
      render();
      console.info(`ANCHR ${APP_VERSION}: no hay sesión válida para cargar pagos (${source})`);
      return;
    }

    currentUser = user;
    updateAuthUI();
    console.info(`ANCHR ${APP_VERSION}: consultando pagos REST (${source})`, currentUser.id);

    const url = `${SUPABASE_URL}/rest/v1/${PAYMENTS_TABLE}?select=*&user_id=eq.${encodeURIComponent(currentUser.id)}&order=created_at.asc`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const text = await response.text();
    let data = [];
    try {
      data = text ? JSON.parse(text) : [];
    } catch (parseError) {
      console.error('ANCHR respuesta no JSON al cargar pagos:', text);
      throw parseError;
    }

    if (!response.ok) {
      console.error('ANCHR error REST cargando pagos:', response.status, data);
      showToast(data?.message || 'No se pudieron cargar los pagos');
      return;
    }

    payments = Array.isArray(data) ? data.map(fromDb) : [];
    console.info(`ANCHR ${APP_VERSION}: pagos cargados REST (${source})`, payments.length, payments.map(item => item.name));
    render();
  } catch (error) {
    console.error('Error cargando pagos:', error);
    showToast('No se pudieron cargar los pagos');
  }
}

async function savePayment(payment) {
  if (!currentUser) {
    showToast('Inicia sesión para guardar');
    return false;
  }

  const { error } = await supabaseClient
    .from(PAYMENTS_TABLE)
    .upsert(toDb(payment), { onConflict: 'id' });

  if (error) {
    const message = error.message || 'No se pudo guardar';
    showToast(message);
    console.error('Error guardando pago:', error);
    return false;
  }

  showToast('Pago guardado');
  return true;
}

function render() {
  const enriched = payments.map(payment => ({
    ...normalizePayment(payment),
    isPaid: isPaid(payment),
    isOverdue: isOverdue(payment),
    dueDate: getDueDate(payment)
  }));

  const visible = enriched.filter(payment => {
    if (activeFilter === 'paid') return payment.isPaid;
    if (activeFilter === 'pending') return !payment.isPaid;
    if (activeFilter === 'overdue') return !payment.isPaid && payment.isOverdue;
    return true;
  }).sort(sortPayments);

  els.table.innerHTML = visible.map(rowTemplate).join('');
  els.empty.classList.toggle('hidden', payments.length > 0);
  renderSummary(enriched);
  if (activeView === 'calendar') renderCalendar();
}

function setActiveView(view) {
  activeView = view || 'dashboard';
  const titles = {
    dashboard: ['Dashboard', 'Hola, aquí tienes el resumen de tus pagos.'],
    calendar: ['Calendario', 'Visualiza tus pagos y fechas de vencimiento.'],
    history: ['Historial', 'Consulta tus pagos registrados.'],
    more: ['Más', 'Configuración y opciones de ANCHR.']
  };
  const [title, copy] = titles[activeView] || titles.dashboard;
  if (els.topbarTitle) els.topbarTitle.textContent = title;
  if (els.topbarCopy) els.topbarCopy.textContent = copy;

  ['dashboard', 'calendar', 'history', 'more'].forEach(name => {
    const screen = els[`${name}View`];
    screen?.classList.toggle('hidden', name !== activeView);
  });

  document.querySelectorAll('[data-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.view === activeView);
  });

  if (activeView === 'calendar') renderCalendar();
}


function sortPayments(a, b) {
  const group = payment => {
    if (!payment.isPaid && payment.isOverdue) return 0;
    if (!payment.isPaid) return 1;
    return 2;
  };

  const groupDiff = group(a) - group(b);
  if (groupDiff !== 0) return groupDiff;

  if (a.isPaid && b.isPaid) {
    const aPaid = a.lastPaid ? inputDate(a.lastPaid).getTime() : 0;
    const bPaid = b.lastPaid ? inputDate(b.lastPaid).getTime() : 0;
    if (bPaid !== aPaid) return bPaid - aPaid;
    return a.name.localeCompare(b.name, 'es');
  }

  const dueDiff = a.dueDate - b.dueDate;
  if (dueDiff !== 0) return dueDiff;
  return a.name.localeCompare(b.name, 'es');
}


function getEnrichedPayments() {
  return payments.map(payment => ({
    ...normalizePayment(payment),
    isPaid: isPaid(payment),
    isOverdue: isOverdue(payment),
    dueDate: getDueDate(payment)
  })).sort(sortPayments);
}

function renderCalendar() {
  if (!els.calendarGrid) return;
  const items = getEnrichedPayments();
  const pendingItems = items.filter(item => !item.isPaid);
  const upcoming = pendingItems
    .filter(item => item.dueDate >= startOfToday())
    .sort((a, b) => a.dueDate - b.dueDate);
  const next = upcoming[0] || pendingItems.sort((a, b) => a.dueDate - b.dueDate)[0] || null;
  renderNextPayment(next);
  renderCalendarGrid(items);
  renderSelectedDay(items);
  renderUpcomingPayments(upcoming.length ? upcoming : pendingItems);
}

function renderNextPayment(payment) {
  if (!els.nextPaymentCard) return;
  if (!payment) {
    els.nextPaymentCard.innerHTML = `<div><span class="eyebrow">Próximo pago</span><h3>No hay pagos pendientes</h3><p>Agrega un pago para verlo en tu calendario.</p></div>`;
    return;
  }
  const dueInfo = getDueInfo(payment);
  els.nextPaymentCard.innerHTML = `
    <div class="next-payment-icon ${payment.iconColor || getDefaultColor(payment.category)}">${getIconSvg(payment.icon || getDefaultIcon(payment.category))}</div>
    <div class="next-payment-main"><span class="eyebrow">Próximo pago</span><h3>${escapeHtml(payment.name)}</h3><p>${escapeHtml(payment.category)}</p></div>
    <div class="next-payment-date"><span>Vence</span><strong>${dueInfo.label}</strong><p>${formatDate(payment.dueDate)}</p></div>`;
}

function renderCalendarGrid(items) {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const label = calendarCursor.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  if (els.calendarMonthLabel) els.calendarMonthLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  const first = new Date(year, month, 1);
  const firstDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const weeks = [];
  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  dayNames.forEach(day => weeks.push(`<div class="calendar-weekday">${day}</div>`));
  for (let i = 0; i < 42; i++) {
    const offset = i - firstDay + 1;
    const date = new Date(year, month, offset);
    const inMonth = offset >= 1 && offset <= daysInMonth;
    const labelDay = inMonth ? offset : (offset < 1 ? prevDays + offset : offset - daysInMonth);
    const key = toInputDate(date);
    const dayItems = items.filter(item => toInputDate(item.dueDate) === key);
    const isSelected = key === selectedCalendarDate;
    const isToday = key === toInputDate(today);
    const dots = dayItems.slice(0, 3).map(item => `<span class="calendar-dot ${item.iconColor || getDefaultColor(item.category)}">${getIconSvg(item.icon || getDefaultIcon(item.category))}</span>`).join('');
    weeks.push(`<button type="button" class="calendar-day ${inMonth ? '' : 'muted'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" data-date="${key}"><span>${labelDay}</span><div>${dots}</div></button>`);
  }
  els.calendarGrid.innerHTML = weeks.join('');
  els.calendarGrid.querySelectorAll('[data-date]').forEach(button => {
    button.addEventListener('click', () => { selectedCalendarDate = button.dataset.date; renderCalendar(); });
  });
}

function renderSelectedDay(items) {
  const selected = inputDate(selectedCalendarDate);
  const dayItems = items.filter(item => toInputDate(item.dueDate) === selectedCalendarDate);
  if (els.selectedDayTitle) els.selectedDayTitle.textContent = `Pagos del ${selected.getDate()} de ${selected.toLocaleDateString('es-MX', { month: 'long' })}`;
  if (els.selectedDayCount) els.selectedDayCount.textContent = String(dayItems.length);
  if (!els.selectedDayPayments) return;
  if (!dayItems.length) {
    els.selectedDayPayments.innerHTML = `<p class="empty-copy">No hay pagos para este día.</p>`;
    return;
  }
  els.selectedDayPayments.innerHTML = dayItems.map(calendarPaymentCard).join('');
}

function renderUpcomingPayments(items) {
  if (!els.upcomingPayments) return;
  const list = items.slice(0, 8);
  if (!list.length) {
    els.upcomingPayments.innerHTML = `<p class="empty-copy">No hay próximos pagos.</p>`;
    return;
  }
  els.upcomingPayments.innerHTML = list.map(payment => {
    const dueInfo = getDueInfo(payment);
    const statusClass = payment.isPaid ? 'paid' : (payment.isOverdue ? 'overdue' : 'pending');
    const statusLabel = payment.isPaid ? 'Pagado' : (payment.isOverdue ? 'Vencido' : 'Pendiente');
    return `<div class="upcoming-item">
      <div class="pay-cell"><div class="service-icon ${payment.iconColor || getDefaultColor(payment.category)}">${getIconSvg(payment.icon || getDefaultIcon(payment.category))}</div><div><div class="payment-name">${escapeHtml(payment.name)}</div><div class="subtext">${escapeHtml(payment.category)}</div></div></div>
      <div class="upcoming-date"><strong>${formatShortDate(payment.dueDate)}</strong><em class="due-label ${dueInfo.className}">${dueInfo.label}</em></div>
      <span class="badge ${statusClass}"><span class="status-dot"></span>${statusLabel}</span>
      <strong class="upcoming-amount">${payment.amountType === 'variable' ? 'Variable' : money(payment.amount)}</strong>
    </div>`;
  }).join('');
}

function calendarPaymentCard(payment) {
  const statusClass = payment.isPaid ? 'paid' : (payment.isOverdue ? 'overdue' : 'pending');
  const statusLabel = payment.isPaid ? 'Pagado' : (payment.isOverdue ? 'Vencido' : 'Pendiente');
  return `<article class="calendar-payment-card">
    <div class="pay-cell"><div class="service-icon ${payment.iconColor || getDefaultColor(payment.category)}">${getIconSvg(payment.icon || getDefaultIcon(payment.category))}</div><div><div class="payment-name">${escapeHtml(payment.name)}</div><div class="subtext">${escapeHtml(payment.category)}</div></div></div>
    <span class="badge ${statusClass}"><span class="status-dot"></span>${statusLabel}</span>
    <p>${payment.amountType === 'variable' ? 'Monto variable' : money(payment.amount)}</p>
    <button type="button" class="secondary-btn" onclick="editPayment('${payment.id}')">Ver detalles</button>
  </article>`;
}

function formatShortDate(date) {
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function renderSummary(items) {
  const total = sum(items.map(item => item.amount));
  const paidItems = items.filter(item => item.isPaid);
  const pendingItems = items.filter(item => !item.isPaid);
  const overdueItems = items.filter(item => !item.isPaid && item.isOverdue);

  els.totalMonth.textContent = money(total);
  els.totalPaid.textContent = money(sum(paidItems.map(getDisplayPaidAmount)));
  els.totalPending.textContent = money(sum(pendingItems.map(item => item.amount)));
  els.totalOverdue.textContent = money(sum(overdueItems.map(item => item.amount)));
  els.totalCount.textContent = plural(items.length, 'pago', 'pagos');
  els.paidCount.textContent = plural(paidItems.length, 'pago', 'pagos');
  els.pendingCount.textContent = plural(pendingItems.length, 'pago', 'pagos');
  els.overdueCount.textContent = plural(overdueItems.length, 'pago', 'pagos');
}

function rowTemplate(payment) {
  const frequencyLabel = { monthly: 'Mensual', bimonthly: 'Bimestral', quarterly: 'Trimestral', yearly: 'Anual' }[payment.frequency];
  const dueInfo = getDueInfo(payment);
  const statusClass = payment.isPaid ? 'paid' : (payment.isOverdue ? 'overdue' : 'pending');
  const statusLabel = payment.isPaid ? 'Pagado' : (payment.isOverdue ? 'Vencido' : 'Pendiente');
  const amountLabel = payment.amountType === 'variable' ? 'Al pagar' : 'Fijo';
  const amountCell = payment.amountType === 'variable' ? 'Variable' : money(payment.amount);
  const icon = getIconSvg(payment.icon || getDefaultIcon(payment.category));

  return `
    <tr class="${payment.isPaid ? 'row-paid' : ''}">
      <td>
        <div class="pay-cell">
          <div class="service-icon ${payment.iconColor || getDefaultColor(payment.category)}">${icon}</div>
          <div><div class="payment-name">${escapeHtml(payment.name)}</div><div class="subtext">${escapeHtml(payment.category)}</div></div>
        </div>
      </td>
      <td>${frequencyLabel}</td>
      <td>${amountCell}<span class="amount-type">${amountLabel}</span></td>
      <td><div>Día ${payment.dueDay}</div><em class="due-label ${dueInfo.className}">${dueInfo.label}</em></td>
      <td>${payment.lastPaid ? formatDate(inputDate(payment.lastPaid)) : 'Sin registro'}</td>
      <td><button class="badge ${statusClass}" onclick="togglePaid('${payment.id}')" title="Cambiar estado"><span class="status-dot"></span>${statusLabel}</button></td>
      <td class="edit-cell">
        <div class="menu-wrap">
          <button class="icon-btn" onclick="toggleMenu(event, '${payment.id}')" aria-label="Opciones de edición">•••</button>
          <div class="row-menu hidden" id="menu-${payment.id}">
            <button onclick="editPayment('${payment.id}')">Editar pago</button>
          </div>
        </div>
      </td>
    </tr>`;
}

async function togglePaid(id) {
  const payment = payments.find(item => item.id === id);
  if (!payment) return;

  if (isPaid(payment)) {
    const updated = { ...payment, paidPeriod: '' };
    await savePayment(updated);
    await loadPayments('after-save');
    return;
  }

  if ((payment.amountType || 'fixed') === 'variable') {
    openPayModal(payment);
    return;
  }

  await registerPayment(id, payment.amount);
}

async function registerPayment(id, amount) {
  const payment = payments.find(item => item.id === id);
  if (!payment) return;
  const paidDate = toInputDate(new Date());
  const period = getCurrentPeriodKey(payment.frequency);
  const updated = { ...payment, lastPaid: paidDate, lastPaidAmount: amount, paidPeriod: period };

  const { error: updateError } = await supabaseClient
    .from(PAYMENTS_TABLE)
    .update(toDb(updated))
    .eq('id', id);

  if (updateError) {
    showToast('No se pudo registrar el pago');
    console.error(updateError);
    return;
  }

  const { error: historyError } = await supabaseClient
    .from(PAYMENT_HISTORY_TABLE)
    .insert({ user_id: currentUser.id, payment_id: id, amount, period, paid_at: paidDate });

  if (historyError) console.error(historyError);
  await loadPayments('after-save');
  showToast('Pago registrado');
}

function openPayModal(payment) {
  els.payId.value = payment.id;
  els.payAmount.value = payment.lastPaidAmount || payment.amount || '';
  els.payDescription.textContent = `${payment.name} tiene monto variable. Ingresa el monto pagado este periodo.`;
  els.payModal.classList.remove('hidden');
  setTimeout(() => els.payAmount.focus(), 40);
}

function closePayModal() {
  els.payModal.classList.add('hidden');
  els.payForm.reset();
}

function getDueInfo(payment) {
  if (isPaid(payment)) return { label: 'pagado', className: 'paid' };

  const diffDays = Math.round((getDueDate(payment) - startOfToday()) / 86400000);
  if (diffDays < 0) return { label: `venció hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'}`, className: 'danger' };
  if (diffDays === 0) return { label: 'vence hoy', className: 'danger' };
  if (diffDays <= 3) return { label: `en ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`, className: 'danger' };
  if (diffDays <= 7) return { label: `en ${diffDays} días`, className: 'warning' };
  if (diffDays <= 14) return { label: `en ${diffDays} días`, className: 'caution' };
  return { label: `en ${diffDays} días`, className: 'safe' };
}

function isPaid(payment) {
  return payment.paidPeriod === getCurrentPeriodKey(payment.frequency);
}

function isOverdue(payment) {
  return getDueDate(payment) < startOfToday();
}

function getDueDate(payment) {
  const now = new Date();
  const thisPeriodDue = new Date(now.getFullYear(), now.getMonth(), clampDueDay(payment.dueDay, now.getFullYear(), now.getMonth()));

  if (payment.frequency === 'monthly' || !payment.lastPaid) return thisPeriodDue;

  const step = { bimonthly: 2, quarterly: 3, yearly: 12 }[payment.frequency] || 1;
  const lastPaid = inputDate(payment.lastPaid);
  const next = new Date(lastPaid.getFullYear(), lastPaid.getMonth() + step, 1);
  next.setDate(clampDueDay(payment.dueDay, next.getFullYear(), next.getMonth()));
  return next;
}

function getCurrentPeriodKey(frequency = 'monthly') {
  const year = today.getFullYear();
  const month = today.getMonth();
  if (frequency === 'bimonthly') return `${year}-B${Math.floor(month / 2) + 1}`;
  if (frequency === 'quarterly') return `${year}-Q${Math.floor(month / 3) + 1}`;
  if (frequency === 'yearly') return `${year}`;
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function editPayment(id) {
  const payment = payments.find(item => item.id === id);
  if (!payment) return;
  openModal(payment);
}

async function deletePayment(id) {
  const payment = payments.find(item => item.id === id);
  if (!payment) return;
  if (!confirm(`¿Eliminar ${payment.name}?`)) return;
  const { error } = await supabaseClient.from(PAYMENTS_TABLE).delete().eq('id', id);
  if (error) { showToast('No se pudo eliminar'); console.error(error); return; }
  closeModal();
  await loadPayments('after-save');
}

function toggleMenu(event, id) {
  event?.stopPropagation?.();
  const trigger = event?.currentTarget;
  const currentMenu = document.querySelector(`#menu-${id}`);
  if (!currentMenu || !trigger) return;

  const willOpen = currentMenu.classList.contains('hidden');

  document.querySelectorAll('.row-menu').forEach(menu => {
    menu.classList.add('hidden');
    menu.classList.remove('open-up', 'floating-row-menu');
    menu.removeAttribute('style');
  });

  if (!willOpen) return;

  // Move the menu to <body> before positioning it. This prevents the table,
  // row, and scroll containers from clipping it or creating horizontal scroll.
  if (currentMenu.parentElement !== document.body) {
    document.body.appendChild(currentMenu);
  }

  currentMenu.classList.add('floating-row-menu');
  currentMenu.classList.remove('hidden');
  currentMenu.style.visibility = 'hidden';
  currentMenu.style.left = '0px';
  currentMenu.style.top = '0px';

  const buttonRect = trigger.getBoundingClientRect();
  const menuRect = currentMenu.getBoundingClientRect();
  const margin = 12;

  const preferredLeft = buttonRect.right - menuRect.width;
  const left = Math.min(
    window.innerWidth - menuRect.width - margin,
    Math.max(margin, preferredLeft)
  );

  const spaceBelow = window.innerHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;
  let top = buttonRect.bottom + 8;

  if (spaceBelow < menuRect.height + margin && spaceAbove > spaceBelow) {
    top = buttonRect.top - menuRect.height - 8;
  }

  top = Math.min(
    window.innerHeight - menuRect.height - margin,
    Math.max(margin, top)
  );

  currentMenu.style.left = `${Math.round(left)}px`;
  currentMenu.style.top = `${Math.round(top)}px`;
  currentMenu.style.visibility = 'visible';
}

function openModal(payment = null) {
  document.querySelectorAll('.row-menu').forEach(menu => { menu.classList.add('hidden'); menu.removeAttribute('style'); });
  els.modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  els.modalTitle.textContent = payment ? 'Editar pago' : 'Nuevo pago';
  els.paymentId.value = payment?.id || '';
  els.paymentName.value = payment?.name || '';
  els.paymentCategory.value = payment?.category || 'Tarjeta';
  els.paymentFrequency.value = payment?.frequency || 'monthly';
  setSelectedIcon(payment?.icon || getDefaultIcon(payment?.category || 'Tarjeta'));
  setSelectedColor(payment?.iconColor || getDefaultColor(payment?.category || 'Tarjeta'));
  els.paymentAmountType.value = payment?.amountType || getDefaultAmountType(els.paymentCategory.value);
  els.paymentAmount.value = payment?.amount || '';
  syncAmountField();
  els.paymentDueDay.value = payment?.dueDay || '';
  els.paymentLastPaid.value = payment?.lastPaid || '';
  els.deletePaymentBtn.classList.toggle('hidden', !payment);
}

function closeModal() {
  els.modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  els.form.reset();
  syncAmountField();
}


function getDefaultAmountType(category) {
  return ['Suscripción', 'Renta', 'Seguro', 'Préstamo'].includes(category) ? 'fixed' : 'variable';
}

function syncAmountField() {
  const isFixed = els.paymentAmountType.value === 'fixed';
  if (!els.paymentAmountField) return;
  els.paymentAmountField.classList.toggle('hidden', !isFixed);
  els.paymentAmount.required = isFixed;
  if (!isFixed) els.paymentAmount.value = '';
}

function getDisplayPaidAmount(payment) {
  return payment.lastPaidAmount || payment.amount;
}

function setSelectedColor(color) {
  els.paymentIconColor.value = color;
  document.querySelectorAll('.color-dot').forEach(dot => dot.classList.toggle('selected', dot.dataset.color === color));
}

function setSelectedIcon(icon) {
  els.paymentIcon.value = icon;
  document.querySelectorAll('.icon-choice').forEach(choice => choice.classList.toggle('selected', choice.dataset.icon === icon));
  if (els.paymentIconPreview) els.paymentIconPreview.innerHTML = getIconSvg(icon);
  if (els.paymentIconLabel) els.paymentIconLabel.textContent = getIconName(icon);
}


function getIconName(icon) {
  const names = {
    'credit-card': 'Tarjeta',
    bolt: 'Luz',
    drop: 'Agua',
    wifi: 'Internet',
    play: 'Streaming',
    house: 'Renta',
    heart: 'Seguro',
    bank: 'Banco',
    phone: 'Teléfono',
    gas: 'Gas',
    car: 'Auto',
    cart: 'Compras',
    health: 'Salud',
    education: 'Educación',
    game: 'Entretenimiento',
    sparkle: 'Otro'
  };
  return names[icon] || 'Otro';
}

function getDefaultIcon(category) {
  return {
    Tarjeta: 'credit-card',
    Servicio: 'bolt',
    Suscripción: 'play',
    Renta: 'house',
    Seguro: 'heart',
    Préstamo: 'bank',
    Otro: 'sparkle'
  }[category] || 'sparkle';
}

function getDefaultColor(category) {
  return {
    Tarjeta: 'blue',
    Servicio: 'green',
    Suscripción: 'purple',
    Renta: 'blue',
    Seguro: 'red',
    Préstamo: 'orange',
    Otro: 'slate'
  }[category] || 'slate';
}

function getIconSvg(icon) {
  const icons = {
    'credit-card': '<svg viewBox="0 0 24 24"><path d="M4 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2ZM2 11h20M6 15h5"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z"/></svg>',
    drop: '<svg viewBox="0 0 24 24"><path d="M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12Z"/></svg>',
    wifi: '<svg viewBox="0 0 24 24"><path d="M5 12.5a11 11 0 0 1 14 0M8 15.5a6.5 6.5 0 0 1 8 0M11 18.5a2 2 0 0 1 2 0M12 20h.01"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5Z"/></svg>',
    house: '<svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7M5 10v10h14V10M9 20v-6h6v6"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-8-4.7-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.3-8 11-8 11Z"/></svg>',
    bank: '<svg viewBox="0 0 24 24"><path d="M4 18h16M6 18V9M10 18V9M14 18V9M18 18V9M3 9l9-5 9 5H3Z"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM10 18h4"/></svg>',
    gas: '<svg viewBox="0 0 24 24"><path d="M12 3s5 4.6 5 9a5 5 0 0 1-10 0c0-2.1 1.2-3.8 2.7-5.4C10.2 9 12 10 12 12.5c1.5-1 2.4-2.7 2.4-4.4C14.4 5.9 12 3 12 3Z"/></svg>',
    car: '<svg viewBox="0 0 24 24"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21"/></svg>',
    cart: '<svg viewBox="0 0 24 24"><path d="M4 5h2l2 11h10l2-8H7M10 20h.01M18 20h.01"/></svg>',
    health: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10ZM12 9v6M9 12h6"/></svg>',
    education: '<svg viewBox="0 0 24 24"><path d="m3 8 9-4 9 4-9 4-9-4ZM6 10v5c0 2 3 4 6 4s6-2 6-4v-5"/></svg>',
    game: '<svg viewBox="0 0 24 24"><path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2ZM10 9v6l5-3-5-3Z"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>'
  };
  return icons[icon] || icons.sparkle;
}

function categoryClass(category) {
  return String(category).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function money(value) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(date).replace('.', '');
}

function plural(count, singular, pluralText) {
  return `${count} ${count === 1 ? singular : pluralText}`;
}

function sum(values) {
  return values.reduce((acc, value) => acc + (Number(value) || 0), 0);
}

function clampDueDay(day, year, month) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(Number(day), lastDay);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function inputDate(value) {
  return new Date(value + 'T00:00:00');
}

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function makeSeed(name, category, frequency, amountType, amount, dueDay, lastPaidMonthsOffset, paidCurrentPeriod, lastPaidAmount = null, icon = null, iconColor = null) {
  const lastPaid = new Date(today.getFullYear(), today.getMonth() + lastPaidMonthsOffset, Math.min(dueDay, 28));
  return {
    id: crypto.randomUUID(),
    name,
    category,
    frequency,
    amountType,
    amount,
    dueDay,
    icon: icon || getDefaultIcon(category),
    iconColor: iconColor || getDefaultColor(category),
    lastPaid: toInputDate(lastPaid),
    lastPaidAmount,
    paidPeriod: paidCurrentPeriod ? getCurrentPeriodKey(frequency) : '',
    history: paidCurrentPeriod ? [{ date: toInputDate(lastPaid), amount: lastPaidAmount || amount, period: getCurrentPeriodKey(frequency) }] : []
  };
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.add('hidden'), 1800);
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

window.togglePaid = togglePaid;
window.editPayment = editPayment;
window.deletePayment = deletePayment;
window.toggleMenu = toggleMenu;
