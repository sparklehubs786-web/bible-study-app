// ===== STRIPE CONFIGURATION =====
const STRIPE_PUBLISHABLE_KEY = ''; // ← PASTE YOUR pk_test_ KEY HERE

const HAS_REAL_KEY = STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_') || STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_');

// ===== PLAN DETAILS =====
const PLANS = {
  student: {
    name: 'Student Access',
    price: '$7.00',
    amount: 700,
    description: 'Full app access forever. Works on any device.',
    type: 'student'
  },
  teacher_small: {
    name: 'Teacher — Small Group (up to 15 students)',
    price: '$30.00',
    amount: 3000,
    description: '3-month class period. Up to 15 students. Full teacher dashboard.',
    type: 'teacher',
    maxStudents: 15,
    planKey: 'small'
  },
  teacher_medium: {
    name: 'Teacher — Medium Group (up to 30 students)',
    price: '$60.00',
    amount: 6000,
    description: '3-month class period. Up to 30 students. Full teacher dashboard.',
    type: 'teacher',
    maxStudents: 30,
    planKey: 'medium'
  },
  teacher_large: {
    name: 'Teacher — Large Group (up to 60 students)',
    price: '$120.00',
    amount: 12000,
    description: '3-month class period. Up to 60 students. Full teacher dashboard.',
    type: 'teacher',
    maxStudents: 60,
    planKey: 'large'
  },
  teacher_xl: {
    name: 'Teacher — Extra Large (up to 100 students)',
    price: '$300.00',
    amount: 30000,
    description: '3-month class period. Up to 100 students. Full teacher dashboard.',
    type: 'teacher',
    maxStudents: 100,
    planKey: 'xl'
  }
};

let stripe = null;
let cardElement = null;
let expiryElement = null;
let cvcElement = null;
let currentPlan = null;

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  showTestBanner();
  initStripe();
  handleUrlParams();
});

function showTestBanner() {
  const banner = document.createElement('div');
  if (HAS_REAL_KEY) {
    banner.style.cssText = 'background:#dcfce7;border-bottom:2px solid #16a34a;padding:10px 20px;text-align:center;font-size:0.82rem;font-weight:700;color:#15803d;position:sticky;top:0;z-index:9999;';
    banner.innerHTML = '✅ LIVE MODE — Real payments enabled via Stripe';
  } else {
    banner.style.cssText = 'background:#fef3c7;border-bottom:2px solid #d97706;padding:10px 20px;text-align:center;font-size:0.82rem;font-weight:700;color:#92400e;position:sticky;top:0;z-index:9999;';
    banner.innerHTML = '🔧 DEMO MODE — Payments simulated. Add your Stripe key to enable real payments. Test card: <strong>4242 4242 4242 4242</strong>';
  }
  document.body.prepend(banner);
}

function initStripe() {
  if (!HAS_REAL_KEY) return;
  try {
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    const elements = stripe.elements();
    const style = {
      base: {
        fontSize: '15px', color: '#1f2937',
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        '::placeholder': { color: '#9ca3af' }
      },
      invalid: { color: '#dc2626' }
    };
    cardElement   = elements.create('cardNumber', { style });
    expiryElement = elements.create('cardExpiry', { style });
    cvcElement    = elements.create('cardCvc', { style });
    cardElement.mount('#stripe-card-element');
    expiryElement.mount('#stripe-expiry-element');
    cvcElement.mount('#stripe-cvc-element');
  } catch(e) {
    console.warn('Stripe init failed:', e.message);
  }
}

function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const plan   = params.get('plan');
  const email  = params.get('email');
  const name   = params.get('name');

  if (plan) {
    const planKey = plan === 'student' ? 'student' : 'teacher_' + plan;
    if (PLANS[planKey]) {
      setTimeout(() => {
        checkout(planKey);
        if (email) { const el = document.getElementById('buyer-email'); if(el) el.value = decodeURIComponent(email); }
        if (name)  { const el = document.getElementById('buyer-name');  if(el) el.value = decodeURIComponent(name); }
      }, 500);
    }
  }
}

// ===== OPEN CHECKOUT =====
function checkout(planId) {
  currentPlan = PLANS[planId];
  if (!currentPlan) return;

  const titleEl   = document.getElementById('checkout-title');
  const summaryEl = document.getElementById('checkout-summary');
  if (titleEl)   titleEl.textContent = 'Complete Your Purchase';
  if (summaryEl) summaryEl.innerHTML =
    '<strong>' + currentPlan.name + '</strong><br>' +
    '<span style="font-size:1.4rem;font-weight:900;color:#5b21b6;">' + currentPlan.price + '</span><br>' +
    '<span style="font-size:0.82rem;color:#4b5563;">' + currentPlan.description + '</span>';

  const stripeFields = document.getElementById('stripe-real-fields');
  const demoFields   = document.getElementById('stripe-demo-fields');
  if (HAS_REAL_KEY) {
    if (stripeFields) stripeFields.style.display = 'block';
    if (demoFields)   demoFields.style.display   = 'none';
  } else {
    if (stripeFields) stripeFields.style.display = 'none';
    if (demoFields)   demoFields.style.display   = 'block';
  }

  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.remove('hidden');

  const errEl = document.getElementById('stripe-error');
  if (errEl) errEl.classList.add('hidden');

  const nameEl  = document.getElementById('buyer-name');
  const emailEl = document.getElementById('buyer-email');
  if (nameEl  && !nameEl.value)  nameEl.value  = '';
  if (emailEl && !emailEl.value) emailEl.value = '';
}

function closeCheckout() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.add('hidden');
}

function closeSuccess() {
  const modal = document.getElementById('success-modal');
  if (modal) modal.classList.add('hidden');
  if (currentPlan && currentPlan.type === 'teacher') {
    window.location.href = 'dashboard.html';
  } else {
    window.location.href = 'student.html';
  }
}

// ===== PROCESS PAYMENT =====
async function processPayment() {
  const nameEl  = document.getElementById('buyer-name');
  const emailEl = document.getElementById('buyer-email');
  const name  = nameEl  ? nameEl.value.trim()  : '';
  const email = emailEl ? emailEl.value.trim() : '';

  if (!name)  { showError('Please enter your full name.'); return; }
  if (!email || !email.includes('@')) { showError('Please enter a valid email address.'); return; }

  const btn = document.getElementById('btn-pay');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Processing...'; }

  const errEl = document.getElementById('stripe-error');
  if (errEl) errEl.classList.add('hidden');

  if (HAS_REAL_KEY && stripe && cardElement) {
    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: { name, email }
      });
      if (error) {
        showError(error.message);
        if (btn) { btn.disabled = false; btn.textContent = '🔒 Pay Securely'; }
        return;
      }
      console.log('Payment method:', paymentMethod.id);
      await activateAccount(name, email);
    } catch(e) {
      showError('Payment error. Please try again.');
      if (btn) { btn.disabled = false; btn.textContent = '🔒 Pay Securely'; }
    }
  } else {
    // Demo mode
    const demoCard = document.getElementById('demo-card');
    if (demoCard && demoCard.value && demoCard.value.replace(/\s/g,'') !== '4242424242424242') {
      showError('In demo mode use test card: 4242 4242 4242 4242');
      if (btn) { btn.disabled = false; btn.textContent = '🔒 Pay Securely'; }
      return;
    }
    await new Promise(r => setTimeout(r, 1500));
    await activateAccount(name, email);
  }
}

// ===== ACTIVATE ACCOUNT — sets status:'active' in Firestore AND localStorage =====
async function activateAccount(name, email) {
  let classCode = null;

  // ─── Get pending signup data ───
  const pending = localStorage.getItem('dtwd_pending_signup');
  let pendingData = null;
  if (pending) {
    try { pendingData = JSON.parse(pending); } catch(e) {}
  }

  const isTeacher = currentPlan && currentPlan.type === 'teacher';

  // ─── Update Firestore status to 'active' ───
  try {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    const uid = (pendingData && pendingData.uid) || (user && user.uid);

    if (uid && typeof db !== 'undefined') {
      const updateData = { status: 'active' };
      if (isTeacher && !pendingData?.classCode) {
        classCode = generateClassCode();
        updateData.classCode = classCode;
      } else if (pendingData && pendingData.classCode) {
        classCode = pendingData.classCode;
      }
      await db.collection('users').doc(uid).update(updateData);
      console.log('✅ Firestore status updated to active for uid:', uid);
    }
  } catch(e) {
    console.warn('Firestore update error (non-fatal):', e.message);
  }

  // ─── Update localStorage ───
  if (isTeacher) {
    const existing = JSON.parse(localStorage.getItem('dtwd_teacher') || '{}');
    if (!classCode) classCode = existing.classCode || generateClassCode();
    localStorage.setItem('dtwd_teacher', JSON.stringify({
      name:        existing.name  || name,
      email:       existing.email || email,
      uid:         existing.uid   || (pendingData && pendingData.uid) || '',
      classCode,
      plan:        currentPlan.planKey || existing.plan || 'medium',
      maxStudents: currentPlan.maxStudents || 30,
      status:      'active',
      expiresAt:   Date.now() + (90 * 24 * 60 * 60 * 1000)
    }));
  } else {
    const existing = JSON.parse(localStorage.getItem('dtwd_student') || '{}');
    localStorage.setItem('dtwd_student', JSON.stringify({
      name:         existing.name  || name,
      email:        existing.email || email,
      uid:          existing.uid   || (pendingData && pendingData.uid) || '',
      classCode:    existing.classCode    || null,
      teacherName:  existing.teacherName  || null,
      plan:         'student',
      status:       'active',
      purchasedAt:  Date.now()
    }));
  }

  // ─── Remove pending signup flag ───
  localStorage.removeItem('dtwd_pending_signup');

  closeCheckout();

  // ─── Show success message ───
  let successMsg = '';
  if (isTeacher) {
    successMsg = 'Welcome ' + name + '! Your teacher account is now active.<br><br>Your class code is:<br><strong style="font-size:1.5rem;color:#5b21b6;letter-spacing:3px;">' + classCode + '</strong><br><br>Share this code with your students. Redirecting to dashboard... 🙏';
  } else {
    successMsg = 'Welcome ' + name + '! Your student access is now active. Redirecting to your dashboard. God bless you! 🙏';
  }

  const successMsgEl = document.getElementById('success-message');
  const successModal = document.getElementById('success-modal');
  if (successMsgEl) successMsgEl.innerHTML = successMsg;
  if (successModal) successModal.classList.remove('hidden');

  const btn = document.getElementById('btn-pay');
  if (btn) { btn.disabled = false; btn.textContent = '🔒 Pay Securely'; }

  setTimeout(() => closeSuccess(), 4000);
}

function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'DTWD-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function showError(msg) {
  const el = document.getElementById('stripe-error');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
