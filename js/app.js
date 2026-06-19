console.log('Korah v5.2-premium-plan-modal');
const APP_VERSION = 'v5.2-premium-plan-modal';
const SUPABASE_URL = 'https://qjicwqpjxsqynoudwylk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rl7m3zQsatLJL2Lb3yHPOg_nnCr712U';
const PAYMENTS_TABLE = 'payments';
const PAYMENT_HISTORY_TABLE = 'payment_history';
console.info(`Korah ${APP_VERSION} conectado a ${SUPABASE_URL}`);

const today = new Date();
let IS_PREMIUM = false;
const CURRENT_MONTH_KEY = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
const PREVIOUS_MONTH_KEY = getRelativeMonthKey(CURRENT_MONTH_KEY, -1);
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
let paymentHistory = [];
let activeFilter = 'all';
let activeView = 'dashboard';
let calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedCalendarDate = toInputDate(today);
let authMode = 'login';
let initialLoadDone = false;
let paymentsLoadTimer = null;
let lastLoadedUserId = null;
let selectedHistoryMonth = '';
let selectedReportMonth = '';
let compareMonthA = '';
let compareMonthB = '';
let isLoadingPayments = false;

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
  historyTable: document.querySelector('#historyTable'),
  historyEmpty: document.querySelector('#historyEmpty'),
  historyCount: document.querySelector('#historyCount'),
  historyRangeLabel: document.querySelector('#historyRangeLabel'),
  historyMonthSelect: document.querySelector('#historyMonthSelect'),
  reportsView: document.querySelector('#reportsView'),
  premiumView: document.querySelector('#premiumView'),
  accountView: document.querySelector('#accountView'),
  accountBtn: document.querySelector('#accountBtn'),
  accountAvatar: document.querySelector('#accountAvatar'),
  accountEmail: document.querySelector('#accountEmail'),
  accountPlan: document.querySelector('#accountPlan'),
  accountPlanTitle: document.querySelector('#accountPlanTitle'),
  accountPlanCopy: document.querySelector('#accountPlanCopy'),
  changePasswordBtn: document.querySelector('#changePasswordBtn'),
  resetAccountDataBtn: document.querySelector('#resetAccountDataBtn'),
  accountLogoutBtn: document.querySelector('#accountLogoutBtn'),
  reportMonthSelect: document.querySelector('#reportMonthSelect'),
  reportMonthDisplay: document.querySelector('#reportMonthDisplay'),
  compareMonthA: document.querySelector('#compareMonthA'),
  compareMonthB: document.querySelector('#compareMonthB'),
  reportTotalMonth: document.querySelector('#reportTotalMonth'),
  reportTotalDelta: document.querySelector('#reportTotalDelta'),
  reportAverageMonth: document.querySelector('#reportAverageMonth'),
  reportExpensiveMonth: document.querySelector('#reportExpensiveMonth'),
  reportExpensiveAmount: document.querySelector('#reportExpensiveAmount'),
  reportCheapMonth: document.querySelector('#reportCheapMonth'),
  reportCheapAmount: document.querySelector('#reportCheapAmount'),
  categoryDonut: document.querySelector('#categoryDonut'),
  categoryLegend: document.querySelector('#categoryLegend'),
  trendChart: document.querySelector('#trendChart'),
  compareList: document.querySelector('#compareList'),
  exportPdfBtn: document.querySelector('#exportPdfBtn'),
  exportExcelBtn: document.querySelector('#exportExcelBtn'),
  moreView: document.querySelector('#moreView'),
  desktopNav: document.querySelector('#desktopNav'),
  calendarNewPaymentBtn: document.querySelector('#calendarNewPaymentBtn'),
  calendarTodayBtn: document.querySelector('#calendarTodayBtn'),
  calendarMonthSelect: document.querySelector('#calendarMonthSelect'),
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
  toast: document.querySelector('#toast'),
  premiumPlanModal: document.querySelector('#premiumPlanModal'),
  premiumPlanPrice: document.querySelector('#premiumPlanPrice'),
  premiumPlanPeriod: document.querySelector('#premiumPlanPeriod'),
  choosePremiumPlanBtn: document.querySelector('#choosePremiumPlanBtn')
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
  els.calendarMonthSelect?.addEventListener('change', () => {
    const [year, month] = els.calendarMonthSelect.value.split('-').map(Number);
    if (!Number.isNaN(year) && !Number.isNaN(month)) {
      calendarCursor = new Date(year, month - 1, 1);
      selectedCalendarDate = toInputDate(new Date(year, month - 1, 1));
      renderCalendar();
    }
  });
  els.logoutBtn.addEventListener('click', logout);
  document.querySelector('#moreLogoutBtn')?.addEventListener('click', logout);
  els.accountLogoutBtn?.addEventListener('click', logout);
  els.accountBtn?.addEventListener('click', () => setActiveView('account'));
  els.changePasswordBtn?.addEventListener('click', changePassword);
  els.resetAccountDataBtn?.addEventListener('click', resetAccountData);
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

  els.historyMonthSelect?.addEventListener('change', event => {
    selectedHistoryMonth = event.target.value;
    if (els.historyRangeLabel) els.historyRangeLabel.textContent = formatHistoryMonth(selectedHistoryMonth);
    renderHistory();
  });

  els.reportMonthSelect?.addEventListener('change', event => {
    if (!IS_PREMIUM && event.target.value !== CURRENT_MONTH_KEY) {
      event.target.value = CURRENT_MONTH_KEY;
      selectedReportMonth = CURRENT_MONTH_KEY;
      showToast('Seleccionar otros meses está disponible en Premium');
      return;
    }
    selectedReportMonth = event.target.value;
    renderReports();
  });
  els.compareMonthA?.addEventListener('change', event => {
    if (!IS_PREMIUM) { event.target.value = CURRENT_MONTH_KEY; showToast('Comparativas personalizadas están disponibles en Premium'); return; }
    compareMonthA = event.target.value; renderReports();
  });
  els.compareMonthB?.addEventListener('change', event => {
    if (!IS_PREMIUM) { event.target.value = PREVIOUS_MONTH_KEY; showToast('Comparativas personalizadas están disponibles en Premium'); return; }
    compareMonthB = event.target.value; renderReports();
  });
  els.exportPdfBtn?.addEventListener('click', exportReportPdf);
  els.exportExcelBtn?.addEventListener('click', exportReportExcel);

  document.querySelectorAll('[data-close="premium-plan"]').forEach(el => el.addEventListener('click', closePremiumPlanModal));
  document.querySelectorAll('[data-billing]').forEach(el => el.addEventListener('click', () => setPremiumBilling(el.dataset.billing)));
  els.choosePremiumPlanBtn?.addEventListener('click', choosePremiumPlan);

  els.paymentCategory.addEventListener('change', () => {
    setSelectedIcon(getDefaultIcon(els.paymentCategory.value));
    setSelectedColor(getDefaultColor(els.paymentCategory.value));
    els.paymentAmountType.value = getDefaultAmountType(els.paymentCategory.value);
    syncAmountField();
  });

  els.paymentAmountType.addEventListener('change', syncAmountField);

  document.addEventListener('click', event => {
    if (!event.target.closest('.menu-wrap') && !event.target.closest('.history-more-wrap')) {
      document.querySelectorAll('.row-menu, .history-row-menu').forEach(menu => {
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
    console.info(`Korah ${APP_VERSION}: auth event`, event, session?.user?.id || 'sin usuario');
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
      console.info(`Korah ${APP_VERSION}: sesión restaurada (${source})`, currentUser.id);
      await loadPayments(source);
      initialLoadDone = true;
      lastLoadedUserId = currentUser.id;
    } else {
      console.info(`Korah ${APP_VERSION}: sin sesión (${source})`);
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

function updatePremiumAccess() {
  const email = (currentUser?.email || '').toLowerCase();
  IS_PREMIUM = email.endsWith('@oaxsun.tech');
  document.body.classList.toggle('is-premium-user', IS_PREMIUM);

  document.querySelectorAll('[data-premium-state]').forEach(el => {
    el.textContent = IS_PREMIUM ? 'Premium activo' : 'Free';
  });
  document.querySelectorAll('[data-premium-state-title]').forEach(el => {
    el.textContent = IS_PREMIUM ? 'Premium Empresarial' : 'Plan Gratuito';
  });
  document.querySelectorAll('[data-premium-cta]').forEach(el => {
    el.textContent = IS_PREMIUM ? 'Gestionar cuenta' : 'Actualizar a Premium';
  });
  document.querySelectorAll('[data-premium-note]').forEach(el => {
    el.textContent = IS_PREMIUM ? 'Tu cuenta @oaxsun.tech tiene Premium activo por defecto.' : 'Desde $49 MXN / mes';
  });

  document.querySelectorAll('.export-option small').forEach(el => {
    if (IS_PREMIUM) el.textContent = 'Disponible en tu plan';
  });
  updateAccountView();
  document.querySelectorAll('.export-option i, .premium-lock-dot').forEach(el => {
    el.style.display = IS_PREMIUM ? 'none' : '';
  });
}

function updateAuthUI() {
  const loggedIn = Boolean(currentUser);
  updatePremiumAccess();
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
  localStorage.setItem('korah_remember_session', remember ? '1' : '0');
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


function updateAccountView() {
  if (!currentUser) return;
  const email = currentUser.email || '';
  const isOaxsun = email.endsWith('@oaxsun.tech');
  const planLabel = IS_PREMIUM ? (isOaxsun ? 'Premium Empresarial' : 'Premium') : 'Free';
  if (els.accountEmail) els.accountEmail.textContent = email || 'Sin correo';
  if (els.accountPlan) els.accountPlan.textContent = planLabel;
  if (els.accountPlanTitle) els.accountPlanTitle.textContent = planLabel;
  if (els.accountPlanCopy) {
    els.accountPlanCopy.textContent = IS_PREMIUM
      ? 'Tu cuenta tiene acceso completo a reportes, comparativas y exportaciones.'
      : 'Actualiza a Premium para desbloquear análisis avanzados.';
  }
}

async function changePassword() {
  if (!currentUser || !currentUser.email) {
    showToast('No encontramos el correo de tu cuenta');
    return;
  }

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(currentUser.email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    if (error) throw error;
    showToast('Te enviamos un correo para restablecer tu contraseña');
  } catch (error) {
    console.error('Error enviando restablecimiento:', error);
    showToast('No se pudo enviar el correo de restablecimiento');
  }
}

async function resetAccountData() {
  if (!currentUser) return;
  const confirmation = prompt('Esto borrará todos tus pagos e historial. Escribe BORRAR para confirmar:');
  if (confirmation !== 'BORRAR') return;
  const { error: historyError } = await supabaseClient.from(PAYMENT_HISTORY_TABLE).delete().eq('user_id', currentUser.id);
  if (historyError) {
    console.error('Error borrando historial:', historyError);
    showToast('No se pudo borrar el historial');
    return;
  }
  const { error: paymentsError } = await supabaseClient.from(PAYMENTS_TABLE).delete().eq('user_id', currentUser.id);
  if (paymentsError) {
    console.error('Error borrando pagos:', paymentsError);
    showToast('No se pudieron borrar los pagos');
    return;
  }
  payments = [];
  paymentHistory = [];
  render();
  renderHistory();
  renderReports();
  showToast('Información borrada');
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
  console.info(`Korah ${APP_VERSION}: loadPayments iniciado (${source})`);
  isLoadingPayments = true;
  render();
  try {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) console.warn('Korah sesión no disponible antes de cargar pagos:', sessionError);

    const session = sessionData?.session || null;
    const user = session?.user || currentUser || null;

    if (!user || !session?.access_token) {
      payments = [];
      paymentHistory = [];
      isLoadingPayments = false;
      render();
      console.info(`Korah ${APP_VERSION}: no hay sesión válida para cargar pagos (${source})`);
      return;
    }

    currentUser = user;
    updateAuthUI();
    console.info(`Korah ${APP_VERSION}: consultando pagos REST (${source})`, currentUser.id);

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
      console.error('Korah respuesta no JSON al cargar pagos:', text);
      throw parseError;
    }

    if (!response.ok) {
      console.error('Korah error REST cargando pagos:', response.status, data);
      showToast(data?.message || 'No se pudieron cargar los pagos');
      return;
    }

    payments = Array.isArray(data) ? data.map(fromDb) : [];
    await loadPaymentHistory(session.access_token);
    isLoadingPayments = false;
    console.info(`Korah ${APP_VERSION}: pagos cargados REST (${source})`, payments.length, payments.map(item => item.name));
    render();
  } catch (error) {
    isLoadingPayments = false;
    console.error('Error cargando pagos:', error);
    showToast('No se pudieron cargar los pagos');
    render();
  }
}

async function loadPaymentHistory(accessToken) {
  if (!currentUser || !accessToken) {
    paymentHistory = [];
    return;
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/${PAYMENT_HISTORY_TABLE}?select=*&user_id=eq.${encodeURIComponent(currentUser.id)}&order=paid_at.desc&order=created_at.desc`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const text = await response.text();
    let data = [];
    try {
      data = text ? JSON.parse(text) : [];
    } catch (parseError) {
      console.error('Korah respuesta no JSON al cargar historial:', text);
      throw parseError;
    }

    if (!response.ok) {
      console.error('Korah error cargando historial:', response.status, data);
      paymentHistory = [];
      return;
    }

    paymentHistory = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error cargando historial:', error);
    paymentHistory = [];
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
    if (activeFilter === 'paid') return wasPaidInCurrentMonth(payment);
    if (activeFilter === 'pending') return isPendingCurrentMonth(payment);
    if (activeFilter === 'overdue') return isOverdueCurrentMonth(payment);
    return true;
  }).sort(sortPayments);

  if (isLoadingPayments) {
    els.table.innerHTML = renderDashboardSkeletonRows();
    els.empty.classList.add('hidden');
  } else {
    els.table.innerHTML = visible.map(rowTemplate).join('');
    els.empty.classList.toggle('hidden', payments.length > 0);
  }
  renderSummary(enriched);
  if (activeView === 'history') renderHistory();
  if (activeView === 'reports') renderReports();
  if (activeView === 'account') updateAccountView();
}


function setActiveView(view) {
  if (view === 'calendar') view = 'dashboard';
  activeView = view || 'dashboard';
  const titles = {
    dashboard: ['Dashboard', 'Hola, aquí tienes el resumen de tus pagos.'],
    history: ['Historial', 'Consulta tus pagos registrados.'],
    reports: ['Reportes', 'Analiza tus gastos y toma mejores decisiones.'],
    premium: ['Premium', 'Desbloquea todo el poder de tus finanzas.'],
    account: ['Cuenta', 'Administra tus preferencias y seguridad.'],
    more: ['Más', 'Configuración y opciones de Korah.']
  };
  const [title, copy] = titles[activeView] || titles.dashboard;
  if (els.topbarTitle) els.topbarTitle.textContent = title;
  if (els.topbarCopy) els.topbarCopy.textContent = copy;

  ['dashboard', 'history', 'reports', 'premium', 'account', 'more'].forEach(name => {
    const screen = els[`${name}View`];
    screen?.classList.toggle('hidden', name !== activeView);
  });

  document.querySelectorAll('[data-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.view === activeView);
  });

  if (activeView === 'history') renderHistory();
  if (activeView === 'reports') renderReports();
}


function getHistoryMonthKey(value) {
  const date = parseDateValue(value);
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getRelativeMonthKey(monthKey, offset) {
  const [year, month] = String(monthKey).split('-').map(Number);
  const date = new Date(year || today.getFullYear(), (month || today.getMonth() + 1) - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatHistoryMonth(key) {
  const [year, month] = String(key).split('-').map(Number);
  if (!year || !month) return 'Este mes';
  const label = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return inputDate(raw);
  const parsed = new Date(raw);
  return parsed;
}

function syncHistoryMonthSelector(rows) {
  if (!els.historyMonthSelect) {
    const currentLabel = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(today);
    if (els.historyRangeLabel) els.historyRangeLabel.textContent = currentLabel.charAt(0).toUpperCase() + currentLabel.slice(1);
    return;
  }

  const keys = Array.from(new Set(rows.map(item => item.monthKey).filter(Boolean))).sort().reverse();
  const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  if (!keys.length) {
    selectedHistoryMonth = currentKey;
    els.historyMonthSelect.innerHTML = `<option value="${currentKey}">${escapeHtml(formatHistoryMonth(currentKey))}</option>`;
    els.historyMonthSelect.value = currentKey;
    return;
  }

  if (!selectedHistoryMonth || !keys.includes(selectedHistoryMonth)) selectedHistoryMonth = keys[0];
  const options = keys.map(key => `<option value="${key}">${escapeHtml(formatHistoryMonth(key))}</option>`).join('');
  if (els.historyMonthSelect.innerHTML !== options) els.historyMonthSelect.innerHTML = options;
  els.historyMonthSelect.value = selectedHistoryMonth;
}

function renderHistory() {
  if (!els.historyTable) return;

  if (isLoadingPayments) {
    els.historyEmpty?.classList.add('hidden');
    els.historyTable.innerHTML = renderHistorySkeletonRows();
    if (els.historyCount) els.historyCount.textContent = 'Cargando pagos...';
    return;
  }

  const frequencyLabels = { monthly: 'Mensual', bimonthly: 'Bimestral', quarterly: 'Trimestral', yearly: 'Anual' };
  const allRows = [...paymentHistory]
    .map(item => ({ ...item, monthKey: getHistoryMonthKey(item.paid_at || item.created_at) }))
    .filter(item => item.monthKey)
    .sort((a, b) => {
      const aDate = parseDateValue(a.paid_at || a.created_at);
      const bDate = parseDateValue(b.paid_at || b.created_at);
      const dateDiff = (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
      if (dateDiff !== 0) return dateDiff;
      return String(b.created_at || '').localeCompare(String(a.created_at || ''));
    });

  syncHistoryMonthSelector(allRows);
  const rows = selectedHistoryMonth ? allRows.filter(item => item.monthKey === selectedHistoryMonth) : allRows;

  if (!rows.length) {
    els.historyTable.innerHTML = '';
    els.historyEmpty?.classList.remove('hidden');
    if (els.historyCount) els.historyCount.textContent = 'Mostrando 0 pagos';
    return;
  }

  els.historyEmpty?.classList.add('hidden');
  els.historyTable.innerHTML = rows.map(item => {
    const payment = payments.find(payment => payment.id === item.payment_id) || {};
    const paidDate = parseDateValue(item.paid_at || item.created_at) || today;
    const icon = getIconSvg(payment.icon || getDefaultIcon(payment.category || 'Otro'));
    const color = payment.iconColor || getDefaultColor(payment.category || 'Otro');
    const category = payment.category || item.category || 'Pago';
    const frequency = frequencyLabels[payment.frequency] || '—';
    const amount = money(Number(item.amount || 0));
    const dateMain = formatDate(paidDate);
    const weekday = new Intl.DateTimeFormat('es-MX', { weekday: 'long' }).format(paidDate);
    const subcopy = payment.amountType === 'variable' ? 'Monto variable' : 'Monto fijo';

    const historyId = item.id || '';
    const canDelete = Boolean(historyId);
    return `
      <tr>
        <td>
          <div class="history-concept">
            <div class="service-icon ${color}">${icon}</div>
            <div><strong>${escapeHtml(payment.name || item.name || 'Pago eliminado')}</strong><span class="history-mobile-date">${escapeHtml(dateMain)} · ${escapeHtml(capitalize(weekday))}</span><span class="history-desktop-subcopy">${escapeHtml(subcopy)}</span></div>
          </div>
        </td>
        <td><div class="history-date"><strong>${dateMain}</strong><span>${escapeHtml(capitalize(weekday))}</span></div></td>
        <td><span class="category-pill ${categoryClass(category)}">${escapeHtml(category)}</span></td>
        <td><span class="frequency-pill">${escapeHtml(frequency)}</span></td>
        <td><div class="history-mobile-money"><strong class="history-amount">${amount}</strong><span>${escapeHtml(frequency)}</span></div></td>
        <td class="history-more">
          <div class="history-more-wrap">
            <button class="icon-btn" type="button" onclick="toggleHistoryMenu(event, '${historyId}')" aria-label="Opciones de historial">•••</button>
            <div class="history-row-menu hidden" id="history-menu-${historyId}">
              <button class="danger" type="button" ${canDelete ? `onclick="deleteHistoryRecord('${historyId}')"` : 'disabled'}>Eliminar pago</button>
            </div>
          </div>
        </td>
      </tr>`;
  }).join('');

  if (els.historyCount) els.historyCount.textContent = `Mostrando 1 a ${rows.length} de ${allRows.length} pagos`;
}



function buildHistoryRows() {
  return [...paymentHistory]
    .map(item => {
      const payment = payments.find(payment => payment.id === item.payment_id) || {};
      const paidDate = parseDateValue(item.paid_at || item.created_at);
      if (!paidDate || Number.isNaN(paidDate.getTime())) return null;
      const category = payment.category || item.category || 'Otros';
      const frequency = payment.frequency || item.frequency || 'monthly';
      return {
        ...item,
        payment,
        name: payment.name || item.name || 'Pago eliminado',
        category,
        frequency,
        amount: Number(item.amount || 0),
        date: paidDate,
        monthKey: getHistoryMonthKey(paidDate)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.date - a.date);
}

function getAvailableReportMonths(rows) {
  const keys = Array.from(new Set(rows.map(item => item.monthKey).filter(Boolean))).sort().reverse();
  const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  return keys.length ? keys : [currentKey];
}

function buildContinuousMonthKeys(rows) {
  const currentKey = CURRENT_MONTH_KEY;
  const dataKeys = rows.map(item => item.monthKey).filter(Boolean).sort();
  const firstKey = dataKeys[0] || currentKey;
  const keys = [];
  let cursor = firstKey;
  let safety = 0;
  while (cursor <= currentKey && safety < 180) {
    keys.push(cursor);
    cursor = getRelativeMonthKey(cursor, 1);
    safety += 1;
  }
  return keys.sort().reverse();
}

function syncReportSelectors(rows) {
  const keys = buildContinuousMonthKeys(rows);
  if (!IS_PREMIUM) {
    selectedReportMonth = CURRENT_MONTH_KEY;
    compareMonthA = CURRENT_MONTH_KEY;
    compareMonthB = PREVIOUS_MONTH_KEY;
  } else {
    if (!selectedReportMonth || !keys.includes(selectedReportMonth)) selectedReportMonth = CURRENT_MONTH_KEY;
    if (!compareMonthA || !keys.includes(compareMonthA)) compareMonthA = selectedReportMonth;
    const fallbackB = keys.find(key => key !== compareMonthA) || getRelativeMonthKey(compareMonthA, -1);
    if (!compareMonthB || compareMonthB === compareMonthA || !keys.includes(compareMonthB)) compareMonthB = fallbackB;
  }

  const fullKeys = Array.from(new Set([...keys, CURRENT_MONTH_KEY, PREVIOUS_MONTH_KEY])).sort().reverse();
  const options = fullKeys.map(key => `<option value="${key}">${escapeHtml(formatHistoryMonth(key))}</option>`).join('');
  if (els.reportMonthSelect && els.reportMonthSelect.innerHTML !== options) els.reportMonthSelect.innerHTML = options;
  if (els.compareMonthA && els.compareMonthA.innerHTML !== options) els.compareMonthA.innerHTML = options;
  if (els.compareMonthB && els.compareMonthB.innerHTML !== options) els.compareMonthB.innerHTML = options;

  if (els.reportMonthDisplay) els.reportMonthDisplay.textContent = formatHistoryMonth(selectedReportMonth);
  if (els.reportMonthSelect) {
    els.reportMonthSelect.value = selectedReportMonth;
    els.reportMonthSelect.disabled = !IS_PREMIUM;
    els.reportMonthSelect.title = IS_PREMIUM ? 'Seleccionar mes' : 'Premium permite consultar cualquier mes';
  }
  if (els.compareMonthA) { els.compareMonthA.value = compareMonthA; els.compareMonthA.disabled = !IS_PREMIUM; }
  if (els.compareMonthB) { els.compareMonthB.value = compareMonthB; els.compareMonthB.disabled = !IS_PREMIUM; }
}

function groupSum(rows, keyFn) {
  const map = new Map();
  rows.forEach(row => {
    const key = keyFn(row) || 'Otros';
    map.set(key, (map.get(key) || 0) + Number(row.amount || 0));
  });
  return Array.from(map.entries()).map(([key, amount]) => ({ key, amount })).sort((a, b) => b.amount - a.amount);
}

function getCategoryColor(index) {
  return ['#6D38F5', '#2f80ed', '#22c55e', '#ff9f2d', '#f45b7f', '#94a3b8', '#06b6d4', '#a855f7'][index % 8];
}

function renderReports() {
  if (!els.reportsView) return;
  const rows = buildHistoryRows();
  syncReportSelectors(rows);
  const selectedRows = rows.filter(row => row.monthKey === selectedReportMonth);
  const selectedTotal = sum(selectedRows.map(row => row.amount));
  const byMonth = groupSum(rows, row => row.monthKey).sort((a, b) => a.key.localeCompare(b.key));
  const monthsWithData = byMonth.filter(item => item.amount > 0);
  const average = monthsWithData.length ? sum(monthsWithData.map(item => item.amount)) / monthsWithData.length : 0;
  const sortedMonths = [...monthsWithData].sort((a, b) => b.amount - a.amount);
  const expensive = sortedMonths[0];
  const cheap = sortedMonths[sortedMonths.length - 1];

  if (els.reportTotalMonth) els.reportTotalMonth.textContent = money(selectedTotal);
  if (els.reportTotalDelta) els.reportTotalDelta.textContent = IS_PREMIUM ? formatHistoryMonth(selectedReportMonth) : 'Free: solo mes actual';
  if (els.reportAverageMonth) els.reportAverageMonth.textContent = money(average);
  if (els.reportExpensiveMonth) els.reportExpensiveMonth.textContent = expensive ? formatHistoryMonth(expensive.key).replace(' de ', ' ') : '—';
  if (els.reportExpensiveAmount) els.reportExpensiveAmount.textContent = money(expensive?.amount || 0);
  if (els.reportCheapMonth) els.reportCheapMonth.textContent = cheap ? formatHistoryMonth(cheap.key).replace(' de ', ' ') : '—';
  if (els.reportCheapAmount) els.reportCheapAmount.textContent = money(cheap?.amount || 0);

  renderCategoryReport(selectedRows, selectedTotal);
  renderTrendReport(byMonth);
  renderCompareReport(rows);
}

function renderCategoryReport(rows, total) {
  if (!els.categoryDonut || !els.categoryLegend) return;
  const categories = groupSum(rows, row => row.category);
  if (!categories.length || total <= 0) {
    els.categoryDonut.style.background = '#f3edff';
    els.categoryDonut.innerHTML = `<span>Total<br><strong>${money(0)}</strong></span>`;
    els.categoryLegend.innerHTML = `<p class="empty-copy">No hay datos para este mes.</p>`;
    return;
  }
  let start = 0;
  const segments = categories.map((cat, index) => {
    const pct = (cat.amount / total) * 100;
    const end = start + pct;
    const segment = `${getCategoryColor(index)} ${start}% ${end}%`;
    start = end;
    return segment;
  });
  els.categoryDonut.style.background = `conic-gradient(${segments.join(', ')})`;
  els.categoryDonut.innerHTML = `<span>Total<br><strong>${money(total)}</strong></span>`;
  els.categoryLegend.innerHTML = categories.map((cat, index) => {
    const pct = total ? Math.round((cat.amount / total) * 100) : 0;
    return `<div class="legend-row"><span><i style="background:${getCategoryColor(index)}"></i>${escapeHtml(cat.key)}</span><strong>${money(cat.amount)}</strong><em>${pct}%</em></div>`;
  }).join('');
}

function renderTrendReport(byMonth) {
  if (!els.trendChart) return;
  const keys = getAvailableReportMonths(buildHistoryRows()).slice(0, 6).reverse();
  const data = keys.map(key => ({ key, amount: byMonth.find(item => item.key === key)?.amount || 0 }));
  const max = Math.max(...data.map(item => item.amount), 1);
  const width = 520;
  const height = 230;
  const pad = 36;
  const step = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 1;
  const points = data.map((item, index) => {
    const x = pad + index * step;
    const y = height - pad - (item.amount / max) * (height - pad * 2);
    return { ...item, x, y };
  });
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const area = `${pad},${height - pad} ${polyline} ${width - pad},${height - pad}`;
  els.trendChart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolución mensual">
    <defs><linearGradient id="korahTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6D38F5" stop-opacity=".25"/><stop offset="100%" stop-color="#6D38F5" stop-opacity="0"/></linearGradient></defs>
    <g class="trend-grid"><line x1="${pad}" y1="${pad}" x2="${width-pad}" y2="${pad}"/><line x1="${pad}" y1="${height/2}" x2="${width-pad}" y2="${height/2}"/><line x1="${pad}" y1="${height-pad}" x2="${width-pad}" y2="${height-pad}"/></g>
    <polygon points="${area}" fill="url(#korahTrend)"/>
    <polyline points="${polyline}" fill="none" stroke="#6D38F5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#6D38F5"/>`).join('')}
    ${points.map(p => `<text x="${p.x}" y="${height-10}" text-anchor="middle">${formatHistoryMonth(p.key).slice(0,3)}</text>`).join('')}
  </svg>`;
}

function renderCompareReport(rows) {
  if (!els.compareList) return;
  const aRows = rows.filter(row => row.monthKey === compareMonthA);
  const bRows = rows.filter(row => row.monthKey === compareMonthB);
  const title = document.querySelector('#compareTitle');
  const subtitle = document.querySelector('#compareSubtitle');
  if (title) title.textContent = `Comparativa: ${formatHistoryMonth(compareMonthA).replace(' de ', ' ')} vs ${formatHistoryMonth(compareMonthB).replace(' de ', ' ')}`;
  if (subtitle) subtitle.textContent = IS_PREMIUM ? 'Compara cualquier mes desde que comenzaste a usar Korah.' : 'Solo puedes comparar el mes actual con el anterior.';
  const aCats = groupSum(aRows, row => row.category);
  const bCats = groupSum(bRows, row => row.category);
  const categories = Array.from(new Set([...aCats.map(i => i.key), ...bCats.map(i => i.key)])).slice(0, 6);
  if (!categories.length) {
    els.compareList.innerHTML = `<p class="empty-copy">No hay datos suficientes para comparar.</p>`;
    return;
  }
  els.compareList.innerHTML = categories.map((category, index) => {
    const a = aCats.find(item => item.key === category)?.amount || 0;
    const b = bCats.find(item => item.key === category)?.amount || 0;
    const diff = b ? ((a - b) / b) * 100 : (a ? 100 : 0);
    const positive = diff >= 0;
    return `<div class="compare-row"><span><i style="background:${getCategoryColor(index)}"></i>${escapeHtml(category)}</span><strong>${money(a)}</strong><em>vs ${money(b)}</em><b class="${positive ? 'up' : 'down'}">${positive ? '↑' : '↓'} ${Math.abs(diff).toFixed(1)}%</b></div>`;
  }).join('');
}


function getReportRowsForExport() {
  const rows = buildHistoryRows().filter(row => row.monthKey === selectedReportMonth);
  return rows.map(row => ({
    concepto: row.name,
    fecha: formatDate(row.date),
    categoria: row.category,
    frecuencia: ({ monthly: 'Mensual', bimonthly: 'Bimestral', quarterly: 'Trimestral', yearly: 'Anual' }[row.frequency] || row.frequency),
    monto: Number(row.amount || 0)
  }));
}

function requirePremiumForExport() {
  if (IS_PREMIUM) return true;
  showToast('Exportar reportes está disponible en Premium');
  setActiveView('premium');
  return false;
}

function exportReportExcel() {
  if (!requirePremiumForExport()) return;
  const rows = getReportRowsForExport();
  const monthLabel = formatHistoryMonth(selectedReportMonth);
  const header = ['Concepto', 'Fecha de pago', 'Categoría', 'Frecuencia', 'Monto'];
  const htmlRows = [header, ...rows.map(r => [r.concepto, r.fecha, r.categoria, r.frecuencia, r.monto])]
    .map(cols => `<tr>${cols.map(col => `<td>${escapeHtml(col)}</td>`).join('')}</tr>`).join('');
  const html = `<html><head><meta charset="utf-8"></head><body><h2>Korah - Reporte ${escapeHtml(monthLabel)}</h2><table border="1">${htmlRows}</table></body></html>`;
  downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' }), `korah-reporte-${selectedReportMonth}.xls`);
  showToast('Reporte Excel descargado');
}

function hexToRgb(hex) {
  const clean = String(hex || '#6D38F5').replace('#', '');
  const value = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean;
  const int = parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function pdfMoney(value) {
  return money(Number(value || 0)).replace('MXN', '').trim();
}


async function loadImageAsDataUrl(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 256;
        canvas.height = img.naturalHeight || 256;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function makeReportCategoryCanvas(cats, total) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 620;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 38px Inter, Arial, sans-serif';
  ctx.fillText('Gastos por categoría', 40, 62);

  const cx = 310;
  const cy = 330;
  const outer = 160;
  const inner = 88;
  if (!cats.length || !total) {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = outer - inner;
    ctx.beginPath();
    ctx.arc(cx, cy, (outer + inner) / 2, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    let angle = -Math.PI / 2;
    cats.slice(0, 7).forEach((cat, idx) => {
      const slice = (cat.amount / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.fillStyle = getCategoryColor(idx);
      ctx.arc(cx, cy, outer, angle, angle + slice);
      ctx.closePath();
      ctx.fill();
      angle += slice;
    });
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.fillStyle = '#64748b';
  ctx.font = '700 28px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Total', cx, cy - 12);
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 42px Inter, Arial, sans-serif';
  ctx.fillText(pdfMoney(total), cx, cy + 34);
  ctx.textAlign = 'left';

  const legendX = 570;
  let y = 145;
  cats.slice(0, 7).forEach((cat, idx) => {
    const pct = total ? Math.round((cat.amount / total) * 100) : 0;
    ctx.fillStyle = getCategoryColor(idx);
    ctx.beginPath();
    ctx.arc(legendX, y - 7, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 26px Inter, Arial, sans-serif';
    ctx.fillText(String(cat.key).slice(0, 24), legendX + 26, y);
    ctx.textAlign = 'right';
    ctx.font = '800 26px Inter, Arial, sans-serif';
    ctx.fillText(pdfMoney(cat.amount), 1040, y);
    ctx.fillStyle = '#64748b';
    ctx.font = '700 24px Inter, Arial, sans-serif';
    ctx.fillText(`${pct}%`, 1135, y);
    ctx.textAlign = 'left';
    y += 66;
  });
  return canvas.toDataURL('image/png');
}

function makeReportTrendCanvas(trendData) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 620;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 38px Inter, Arial, sans-serif';
  ctx.fillText('Evolución mensual', 40, 62);

  const left = 110;
  const top = 110;
  const width = 980;
  const height = 380;
  const max = Math.max(...trendData.map(item => item.amount), 1);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    const y = top + (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + width, y);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '22px Inter, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(pdfMoney(max * (1 - i / 4)), left - 18, y + 8);
  }
  const pts = trendData.map((item, i) => ({
    x: left + (trendData.length <= 1 ? 0 : (width / (trendData.length - 1)) * i),
    y: top + height - (item.amount / max) * height,
    ...item
  }));
  if (pts.length > 1) {
    const grad = ctx.createLinearGradient(0, top, 0, top + height);
    grad.addColorStop(0, 'rgba(109,56,245,.28)');
    grad.addColorStop(1, 'rgba(109,56,245,0)');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, top + height);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, top + height);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#6D38F5';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
  }
  pts.forEach(p => {
    ctx.fillStyle = '#6D38F5';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 22px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pdfMoney(p.amount), p.x, p.y - 18);
    ctx.fillStyle = '#64748b';
    ctx.font = '22px Inter, Arial, sans-serif';
    ctx.fillText(formatHistoryMonth(p.key).slice(0, 3), p.x, top + height + 42);
  });
  ctx.textAlign = 'left';
  return canvas.toDataURL('image/png');
}

async function exportReportPdf() {
  if (!requirePremiumForExport()) return;
  const rows = getReportRowsForExport();
  const allRows = buildHistoryRows();
  const monthLabel = formatHistoryMonth(selectedReportMonth);
  const total = sum(rows.map(r => r.monto));
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    const text = [`Korah - Reporte ${monthLabel}`, `Total: ${money(total)}`, '', ...rows.map(r => `${r.fecha} | ${r.concepto} | ${r.categoria} | ${r.frecuencia} | ${money(r.monto)}`)].join('\n');
    downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8;' }), `korah-reporte-${selectedReportMonth}.txt`);
    showToast('Reporte descargado');
    return;
  }

  showToast('Generando PDF...');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const purple = [109, 56, 245];
  const ink = [15, 23, 42];
  const muted = [100, 116, 139];
  const line = [226, 232, 240];
  const bg = [248, 250, 252];
  const setText = (rgb = ink) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const card = (x, y, w, h, fill = [255,255,255], stroke = line) => {
    doc.setFillColor(...fill);
    doc.setDrawColor(...stroke);
    doc.roundedRect(x, y, w, h, 4, 4, 'FD');
  };
  const footer = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setText([148, 163, 184]);
    doc.text('Generado por Korah', margin, pageH - 8);
    doc.text(String(doc.internal.getNumberOfPages()), pageW - margin, pageH - 8, { align: 'right' });
  };
  const newPage = () => {
    footer();
    doc.addPage();
    doc.setFillColor(...bg);
    doc.rect(0, 0, pageW, pageH, 'F');
  };

  doc.setFillColor(...bg);
  doc.rect(0, 0, pageW, pageH, 'F');
  const logo = await loadImageAsDataUrl('assets/korah-logo-mark.png');
  if (logo) doc.addImage(logo, 'PNG', margin, 13, 12, 12);
  else { doc.setFillColor(...purple); doc.roundedRect(margin, 13, 12, 12, 3, 3, 'F'); }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  setText(ink);
  doc.text('Korah', margin + 16, 22);
  doc.setFontSize(15);
  doc.text(`Reporte financiero`, margin, 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setText(muted);
  doc.text(monthLabel, margin, 45);
  doc.text(new Date().toLocaleDateString('es-MX'), pageW - margin, 22, { align: 'right' });
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 51, pageW - margin, 51);

  const byMonth = groupSum(allRows, row => row.monthKey).sort((a, b) => a.key.localeCompare(b.key));
  const monthsWithData = byMonth.filter(item => item.amount > 0);
  const average = monthsWithData.length ? sum(monthsWithData.map(item => item.amount)) / monthsWithData.length : 0;
  const sortedMonths = [...monthsWithData].sort((a, b) => b.amount - a.amount);
  const expensive = sortedMonths[0];
  const cheap = sortedMonths[sortedMonths.length - 1];
  const cards = [
    ['Gasto total', pdfMoney(total), monthLabel],
    ['Promedio mensual', pdfMoney(average), 'Últimos meses'],
    ['Mes más alto', expensive ? formatHistoryMonth(expensive.key).replace(' de ', ' ') : '—', expensive ? pdfMoney(expensive.amount) : '$0'],
    ['Mes más bajo', cheap ? formatHistoryMonth(cheap.key).replace(' de ', ' ') : '—', cheap ? pdfMoney(cheap.amount) : '$0'],
  ];
  let y = 60;
  const gap = 5;
  const cardW = (pageW - margin * 2 - gap) / 2;
  cards.forEach((item, i) => {
    const x = margin + (i % 2) * (cardW + gap);
    const yy = y + Math.floor(i / 2) * 29;
    card(x, yy, cardW, 23);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setText(muted); doc.text(item[0], x + 6, yy + 7);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); setText(ink); doc.text(String(item[1]).slice(0, 20), x + 6, yy + 15);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); setText(muted); doc.text(String(item[2]).slice(0, 28), x + 6, yy + 20.5);
  });

  y = 124;
  const cats = groupSum(rows, r => r.categoria || 'Otros');
  const categoryImage = makeReportCategoryCanvas(cats, total);
  const trendKeys = getAvailableReportMonths(allRows).slice(0, 6).reverse();
  const trendData = trendKeys.map(key => ({ key, amount: byMonth.find(i => i.key === key)?.amount || 0 }));
  const trendImage = makeReportTrendCanvas(trendData);
  card(margin, y, pageW - margin * 2, 70);
  doc.addImage(categoryImage, 'PNG', margin + 3, y + 3, pageW - margin * 2 - 6, 64);

  y += 82;
  card(margin, y, pageW - margin * 2, 70);
  doc.addImage(trendImage, 'PNG', margin + 3, y + 3, pageW - margin * 2 - 6, 64);

  newPage();
  y = 18;
  card(margin, y, pageW - margin * 2, 58);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); setText(ink);
  doc.text(`Comparativa: ${formatHistoryMonth(compareMonthA).replace(' de ', ' ')} vs ${formatHistoryMonth(compareMonthB).replace(' de ', ' ')}`, margin + 6, y + 12);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setText(muted);
  doc.text('Variación por categoría respecto al mes comparado.', margin + 6, y + 19);
  const aRows = allRows.filter(row => row.monthKey === compareMonthA);
  const bRows = allRows.filter(row => row.monthKey === compareMonthB);
  const aCats = groupSum(aRows, row => row.category);
  const bCats = groupSum(bRows, row => row.category);
  const compareCats = Array.from(new Set([...aCats.map(i => i.key), ...bCats.map(i => i.key)])).slice(0, 6);
  let rowY = y + 30;
  compareCats.forEach((category, idx) => {
    const a = aCats.find(item => item.key === category)?.amount || 0;
    const b = bCats.find(item => item.key === category)?.amount || 0;
    const diff = b ? ((a - b) / b) * 100 : (a ? 100 : 0);
    const x = margin + 6 + (idx % 2) * ((pageW - margin * 2 - 18) / 2 + 6);
    const yy = rowY + Math.floor(idx / 2) * 12;
    doc.setFillColor(250, 250, 255); doc.setDrawColor(238, 232, 255); doc.roundedRect(x, yy, (pageW - margin * 2 - 18) / 2, 9, 2, 2, 'FD');
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); setText(ink); doc.text(String(category).slice(0, 18), x + 3, yy + 6);
    doc.setFont('helvetica','bold'); doc.text(pdfMoney(a), x + 48, yy + 6);
    setText(diff >= 0 ? [220, 38, 38] : [22, 163, 74]); doc.text(`${diff >= 0 ? '+' : '-'}${Math.abs(diff).toFixed(1)}%`, x + ((pageW - margin * 2 - 18) / 2) - 4, yy + 6, { align:'right' });
  });

  y = 90;
  doc.setFont('helvetica','bold'); doc.setFontSize(14); setText(ink); doc.text('Pagos del mes', margin, y);
  y += 8;
  const header = ['Concepto', 'Fecha', 'Categoría', 'Frecuencia', 'Monto'];
  const widths = [62, 30, 34, 28, 28];
  doc.setFillColor(243, 246, 251); doc.roundedRect(margin, y, pageW - margin*2, 9, 2, 2, 'F');
  let x = margin + 3;
  doc.setFontSize(7.5); setText(muted);
  header.forEach((h, i) => { doc.text(h, x, y + 6); x += widths[i]; });
  y += 11;
  rows.forEach((row, idx) => {
    if (y > pageH - 22) { newPage(); y = 18; }
    x = margin + 3;
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); setText(ink);
    [row.concepto, row.fecha, row.categoria, row.frecuencia, pdfMoney(row.monto)].forEach((v, i) => {
      doc.text(String(v).slice(0, i === 0 ? 34 : 17), x, y + 4);
      x += widths[i];
    });
    doc.setDrawColor(235, 240, 246); doc.line(margin, y + 7, pageW - margin, y + 7);
    y += 8;
  });
  footer();
  doc.save(`korah-reporte-${selectedReportMonth}.pdf`);
  showToast('Reporte PDF descargado');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function renderDashboardSkeletonRows() {
  return Array.from({ length: 6 }).map(() => `
    <tr class="history-skeleton-row">
      <td><div class="pay-cell"><div class="skeleton skeleton-icon"></div><div><span class="skeleton skeleton-line wide"></span><span class="skeleton skeleton-line small"></span></div></div></td>
      <td><span class="skeleton skeleton-line small"></span></td>
      <td><span class="skeleton skeleton-line"></span></td>
      <td><span class="skeleton skeleton-line"></span></td>
      <td><span class="skeleton skeleton-line"></span></td>
      <td><span class="skeleton skeleton-pill"></span></td>
      <td></td>
    </tr>`).join('');
}

function renderHistorySkeletonRows() {
  return Array.from({ length: 5 }).map(() => `
    <tr class="history-skeleton-row">
      <td><div class="history-concept"><div class="skeleton skeleton-icon"></div><div><span class="skeleton skeleton-line wide"></span><span class="skeleton skeleton-line small"></span></div></div></td>
      <td><span class="skeleton skeleton-line"></span><span class="skeleton skeleton-line small"></span></td>
      <td><span class="skeleton skeleton-pill"></span></td>
      <td><span class="skeleton skeleton-pill"></span></td>
      <td><span class="skeleton skeleton-line"></span></td>
      <td></td>
    </tr>`).join('');
}

function toggleHistoryMenu(event, id) {
  event?.stopPropagation?.();
  if (!id) return;
  const trigger = event?.currentTarget;
  const menu = document.querySelector(`#history-menu-${id}`);
  if (!trigger || !menu) return;
  const willOpen = menu.classList.contains('hidden');
  document.querySelectorAll('.history-row-menu, .row-menu').forEach(item => {
    item.classList.add('hidden');
    item.removeAttribute('style');
  });
  if (!willOpen) return;
  if (menu.parentElement !== document.body) document.body.appendChild(menu);
  menu.classList.remove('hidden');
  menu.style.visibility = 'hidden';
  menu.style.left = '0px';
  menu.style.top = '0px';
  const buttonRect = trigger.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const margin = 12;
  const left = Math.min(window.innerWidth - menuRect.width - margin, Math.max(margin, buttonRect.right - menuRect.width));
  const spaceBelow = window.innerHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;
  let top = buttonRect.bottom + 8;
  if (spaceBelow < menuRect.height + margin && spaceAbove > spaceBelow) top = buttonRect.top - menuRect.height - 8;
  top = Math.min(window.innerHeight - menuRect.height - margin, Math.max(margin, top));
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
  menu.style.visibility = 'visible';
}

async function deleteHistoryRecord(id) {
  if (!id) return;
  if (!confirm('¿Eliminar este pago del historial?')) return;
  const { error } = await supabaseClient.from(PAYMENT_HISTORY_TABLE).delete().eq('id', id);
  if (error) {
    console.error('Error eliminando historial:', error);
    showToast('No se pudo eliminar del historial');
    return;
  }
  paymentHistory = paymentHistory.filter(item => item.id !== id);
  document.querySelectorAll('.history-row-menu').forEach(menu => menu.classList.add('hidden'));
  renderHistory();
  showToast('Pago eliminado del historial');
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
  const category = escapeHtml(payment.category || 'Pago');
  els.nextPaymentCard.innerHTML = `
    <div class="next-payment-icon ${payment.iconColor || getDefaultColor(payment.category)}">${getIconSvg(payment.icon || getDefaultIcon(payment.category))}</div>
    <div class="next-payment-main">
      <span class="eyebrow">Próximo pago</span>
      <h3>${escapeHtml(payment.name)}</h3>
      <div class="next-payment-meta">
        <span><svg viewBox="0 0 24 24"><path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM4 9h16M8 3v4M16 3v4"/></svg>${formatDate(payment.dueDate)}</span>
        <span>${compactMoney(payment)}</span>
        <span class="soft-pill">${category}</span>
      </div>
    </div>
    <div class="next-payment-date"><span>Vence en</span><strong>${dueInfo.label}</strong><button type="button" class="primary-btn" onclick="editPayment('${payment.id}')">Ver detalle</button></div>`;
}


function syncCalendarMonthSelect() {
  if (!els.calendarMonthSelect) return;
  const currentValue = `${calendarCursor.getFullYear()}-${String(calendarCursor.getMonth() + 1).padStart(2, '0')}`;
  const options = [];
  for (let offset = -12; offset <= 12; offset++) {
    const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    options.push(`<option value="${value}" ${value === currentValue ? 'selected' : ''}>${label.charAt(0).toUpperCase() + label.slice(1)}</option>`);
  }
  els.calendarMonthSelect.innerHTML = options.join('');
}

function compactMoney(payment) {
  return payment.amountType === 'variable' ? 'Variable' : money(payment.amount);
}

function renderCalendarGrid(items) {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const label = calendarCursor.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  if (els.calendarMonthLabel) els.calendarMonthLabel.textContent = 'Calendario';
  syncCalendarMonthSelect();
  const first = new Date(year, month, 1);
  const firstDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const weeks = [];
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
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
    const visibleItems = dayItems.slice(0, 2);
    const dots = visibleItems.map(item => `<span class="calendar-dot ${item.iconColor || getDefaultColor(item.category)}">${getIconSvg(item.icon || getDefaultIcon(item.category))}</span>`).join('') + (dayItems.length > 2 ? `<span class="calendar-more-dot">+${dayItems.length - 2}</span>` : '');
    weeks.push(`<button type="button" class="calendar-day ${inMonth ? '' : 'muted'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" data-date="${key}"><span>${labelDay}</span><div>${dots}</div></button>`);
  }
  els.calendarGrid.innerHTML = weeks.join('');
  renderCalendarLegend(items);
  els.calendarGrid.querySelectorAll('[data-date]').forEach(button => {
    button.addEventListener('click', () => { selectedCalendarDate = button.dataset.date; renderCalendar(); });
  });
}

function renderCalendarLegend(items) {
  const legend = document.getElementById('calendarLegend');
  if (!legend) return;
  const seen = new Map();
  items.forEach(item => {
    const category = item.category || 'Otros';
    if (!seen.has(category)) {
      seen.set(category, {
        label: category,
        icon: item.icon || getDefaultIcon(category),
        color: item.iconColor || getDefaultColor(category)
      });
    }
  });
  const values = Array.from(seen.values()).slice(0, 5);
  if (!values.length) {
    legend.innerHTML = '';
    return;
  }
  legend.innerHTML = values.map(item => `<span><i class="calendar-legend-icon ${item.color}">${getIconSvg(item.icon)}</i>${escapeHtml(item.label)}</span>`).join('');
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
  const list = items.slice(0, 5);
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
      <strong class="upcoming-amount">${compactMoney(payment)}</strong><span class="upcoming-arrow">›</span>
    </div>`;
  }).join('');
}

function calendarPaymentCard(payment) {
  const statusClass = payment.isPaid ? 'paid' : (payment.isOverdue ? 'overdue' : 'pending');
  const statusLabel = payment.isPaid ? 'Pagado' : (payment.isOverdue ? 'Vencido' : 'Pendiente');
  return `<article class="calendar-payment-card">
    <div class="calendar-payment-main">
      <div class="service-icon ${payment.iconColor || getDefaultColor(payment.category)}">${getIconSvg(payment.icon || getDefaultIcon(payment.category))}</div>
      <div><div class="payment-name">${escapeHtml(payment.name)}</div><div class="subtext">${escapeHtml(payment.category)}</div></div>
    </div>
    <div class="calendar-payment-side"><strong>${compactMoney(payment)}</strong><span class="badge ${statusClass}"><span class="status-dot"></span>${statusLabel}</span></div>
    <button type="button" class="icon-btn" onclick="editPayment('${payment.id}')" aria-label="Ver detalles">⋮</button>
  </article>`;
}

function formatShortDate(date) {
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function renderSummary(items) {
  // Dashboard totals are about the current calendar month, not about every
  // payment that is covered by a longer cycle. Example: if a bimonthly bill was
  // paid in May, it remains visually "Pagado" during June, but it should not
  // add $0 or an old amount to June's paid summary.
  const paidItems = items.filter(wasPaidInCurrentMonth);
  const pendingItems = items.filter(isPendingCurrentMonth);
  const overdueItems = items.filter(isOverdueCurrentMonth);

  const paidTotal = sum(paidItems.map(getDisplayPaidAmount));
  const pendingTotal = sum(pendingItems.map(getOpenMonthAmount));
  const overdueTotal = sum(overdueItems.map(getOpenMonthAmount));
  const total = paidTotal + pendingTotal;

  els.totalMonth.textContent = money(total);
  els.totalPaid.textContent = money(paidTotal);
  els.totalPending.textContent = money(pendingTotal);
  els.totalOverdue.textContent = money(overdueTotal);
  els.totalCount.textContent = plural(paidItems.length + pendingItems.length, 'pago', 'pagos');
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
  const normalized = normalizePayment(payment);
  const now = startOfToday();

  // First trust the stored paid period. This is important for non-monthly
  // cycles: if a bimonthly bill was paid in May, its paid period is May/June,
  // so June must still appear as paid and only become pending in July.
  if (normalized.paidPeriod && normalized.paidPeriod === getCurrentPeriodKey(normalized.frequency, now)) {
    return true;
  }

  if (!normalized.lastPaid) return false;

  const lastPaid = inputDate(normalized.lastPaid);

  if (normalized.frequency === 'monthly') {
    return lastPaid.getFullYear() === now.getFullYear() && lastPaid.getMonth() === now.getMonth();
  }

  const nextDue = getNextDueDateFromLastPaid(normalized);

  // For non-monthly payments, keep the bill as paid until the next due month
  // arrives. Example: paid in May + bimonthly => June stays paid; July becomes
  // pending.
  return isBeforeMonth(now, nextDue);
}

function isOverdue(payment) {
  return !isPaid(payment) && getDueDate(payment) < startOfToday();
}

function isSameMonth(a, b = new Date()) {
  return a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function wasPaidInCurrentMonth(payment) {
  if (!payment.lastPaid) return false;
  return isSameMonth(inputDate(payment.lastPaid), startOfToday());
}

function isDueInCurrentMonth(payment) {
  return isSameMonth(getDueDate(payment), startOfToday());
}

function isPendingCurrentMonth(payment) {
  return !isPaid(payment) && isDueInCurrentMonth(payment);
}

function isOverdueCurrentMonth(payment) {
  return isPendingCurrentMonth(payment) && isOverdue(payment);
}

function getOpenMonthAmount(payment) {
  // Variable bills do not have a reliable pending amount. They only affect the
  // month totals once the user registers the real paid amount.
  if ((payment.amountType || 'variable') === 'variable') return 0;
  return Number(payment.amount || 0);
}

function getDueDate(payment) {
  const normalized = normalizePayment(payment);
  const now = new Date();
  const thisMonthDue = new Date(now.getFullYear(), now.getMonth(), clampDueDay(normalized.dueDay, now.getFullYear(), now.getMonth()));

  if (!normalized.lastPaid) return thisMonthDue;

  if (normalized.frequency === 'monthly') {
    if (isPaid(normalized)) {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      next.setDate(clampDueDay(normalized.dueDay, next.getFullYear(), next.getMonth()));
      return next;
    }
    return thisMonthDue;
  }

  const nextDue = getNextDueDateFromLastPaid(normalized);

  // If the next due month has not arrived, keep the next due date in the
  // future. Once that month arrives, the payment becomes pending for that day.
  return nextDue;
}

function getNextDueDateFromLastPaid(payment) {
  const step = getFrequencyStep(payment.frequency);
  const lastPaid = inputDate(payment.lastPaid);
  const next = new Date(lastPaid.getFullYear(), lastPaid.getMonth() + step, 1);
  next.setDate(clampDueDay(payment.dueDay, next.getFullYear(), next.getMonth()));
  return next;
}

function getFrequencyStep(frequency = 'monthly') {
  return { monthly: 1, bimonthly: 2, quarterly: 3, yearly: 12 }[frequency] || 1;
}

function isBeforeMonth(a, b) {
  return a.getFullYear() < b.getFullYear() || (a.getFullYear() === b.getFullYear() && a.getMonth() < b.getMonth());
}

function getCurrentPeriodKey(frequency = 'monthly', date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
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

function capitalize(value) {
  if (!value) return '';
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
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
window.toggleHistoryMenu = toggleHistoryMenu;
window.deleteHistoryRecord = deleteHistoryRecord;
window.toggleMenu = toggleMenu;

function openPremiumPlanModal() {
  if (!els.premiumPlanModal) return;
  els.premiumPlanModal.classList.remove('hidden');
  els.premiumPlanModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setPremiumBilling('monthly');
}

function closePremiumPlanModal() {
  if (!els.premiumPlanModal) return;
  els.premiumPlanModal.classList.add('hidden');
  els.premiumPlanModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function setPremiumBilling(period) {
  const isAnnual = period === 'annual';
  document.querySelectorAll('[data-billing]').forEach(btn => btn.classList.toggle('active', btn.dataset.billing === period));
  if (els.premiumPlanPrice) els.premiumPlanPrice.textContent = isAnnual ? '$99' : '$19';
  if (els.premiumPlanPeriod) els.premiumPlanPeriod.textContent = isAnnual ? 'MXN / año' : 'MXN / mes';
  if (els.choosePremiumPlanBtn) els.choosePremiumPlanBtn.textContent = isAnnual ? 'Elegir Premium anual' : 'Elegir Premium mensual';
}

function choosePremiumPlan() {
  showToast('Pago Premium estará disponible próximamente.');
}

function handlePremiumCta() {
  if (IS_PREMIUM) {
    setActiveView('account');
  } else {
    openPremiumPlanModal();
  }
}
