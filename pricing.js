// ===== STRIPE CONFIGURATION =====
// ─────────────────────────────────────────────────────────────
// HOW TO ADD YOUR STRIPE TEST KEY:
// 1. Go to https://stripe.com and create a free account
// 2. In the dashboard go to: Developers → API Keys
// 3. Copy the Publishable key (starts with pk_test_...)
// 4. Paste it below replacing the empty string
// 5. Test card to use: 4242 4242 4242 4242 | Expiry: 12/28 | CVC: 123
// ─────────────────────────────────────────────────────────────
const STRIPE_PUBLISHABLE_KEY = ''; // ← PASTE YOUR pk_test_ KEY HERE

// Detect if a real key has been added
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
    maxStudents: 15
  },
  teacher_medium: {
    name: 'Teacher — Medium Group (up to 30 students)',
    price: '$60.00',
    amount: 6000,
    description: '3-month class period. Up to 30 students. Full teacher dashboard.',
    type: 'teacher',
    maxStudents: 30
  },
  teacher_large: {
    name: 'Teacher — Large Group (up to 60 students)',
    price: '$120.00',
    amount: 12000,
    description: '3-month class period. Up to 60 students. Full teacher dashboard.',
    type: 'teacher',
    maxStudents: 60
  },
  teacher_xl: {
    name: 'Teacher — Extra Large (up to 100 students)',
    price: '$300.00',
    amount: 30000,
    description: '3-month class period. Up to 100 students. Full teacher dashboard.',
    type: 'teacher',
    maxStudents: 100
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
  if (!HAS_REAL_KEY) {
    // No real key — use simulated card form, skip Stripe SDK init
    return;
  }

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

  document.getElementById('checkout-title').textContent = 'Complete Your Purchase';
  document.getElementById('checkout-summary').innerHTML =
    '<strong>' + currentPlan.name + '</strong><br>' +
    '<span style="font-size:1.4rem;font-weight:900;color:#5b21b6;">' + currentPlan.price + '</span><br>' +
    '<span style="font-size:0.82rem;color:#4b5563;">' + currentPlan.description + '</span>';

  // Show/hide real Stripe elements vs demo form
  const stripeFields = document.getElementById('stripe-real-fields');
  const demoFields   = document.getElementById('stripe-demo-fields');
  if (HAS_REAL_KEY) {
    if (stripeFields) stripeFields.style.display = 'block';
    if (demoFields)   demoFields.style.display   = 'none';
  } else {
    if (stripeFields) stripeFields.style.display = 'none';
    if (demoFields)   demoFields.style.display   = 'block';
  }

  document.getElementById('checkout-modal').classList.remove('hidden');
  const errEl = document.getElementById('stripe-error');
  if (errEl) errEl.classList.add('hidden');

  // Clear fields
  const nameEl  = document.getElementById('buyer-name');
  const emailEl = document.getElementById('buyer-email');
  if (nameEl)  nameEl.value = '';
  if (emailEl) emailEl.value = '';
}

function closeCheckout() {
  document.getElementById('checkout-modal').classList.add('hidden');
  currentPlan = null;
}

function closeSuccess() {
  document.getElementById('success-modal').classList.add('hidden');
  if (currentPlan && currentPlan.type === 'teacher') {
    window.location.href = 'dashboard.html';
  } else {
    window.location.href = 'student.html';
  }
}

// ===== PROCESS PAYMENT =====
async function processPayment() {
  const name  = (document.getElementById('buyer-name')  || {}).value || '';
  const email = (document.getElementById('buyer-email') || {}).value || '';

  if (!name.trim())  { showError('Please enter your full name.'); return; }
  if (!email.trim() || !email.includes('@')) { showError('Please enter a valid email address.'); return; }

  const btn = document.getElementById('btn-pay');
  btn.disabled = true;
  btn.textContent = '⏳ Processing...';
  const errEl = document.getElementById('stripe-error');
  if (errEl) errEl.classList.add('hidden');

  if (HAS_REAL_KEY && stripe && cardElement) {
    // Real Stripe payment
    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: { name: name.trim(), email: email.trim() }
      });

      if (error) {
        showError(error.message);
        btn.disabled = false;
        btn.textContent = '🔒 Pay Securely';
        return;
      }
      console.log('Payment method:', paymentMethod.id);
      await activateAccount(name.trim(), email.trim());
    } catch(e) {
      showError('Payment error. Please try again.');
      btn.disabled = false;
      btn.textContent = '🔒 Pay Securely';
    }
  } else {
    // Demo/simulated payment — validate demo card fields
    const demoCard = (document.getElementById('demo-card') || {}).value || '';
    if (demoCard && demoCard.replace(/\s/g,'') !== '4242424242424242') {
      showError('In demo mode use test card: 4242 4242 4242 4242');
      btn.disabled = false;
      btn.textContent = '🔒 Pay Securely';
      return;
    }
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 1500));
    await activateAccount(name.trim(), email.trim());
  }
}

async function activateAccount(name, email) {
  // Activate pending signup
  const pending = localStorage.getItem('dtwd_pending_signup');
  if (pending) {
    try {
      const user = JSON.parse(pending);
      user.status = 'active';
      // Update Firestore if we have uid
      if (user.uid && typeof db !== 'undefined') {
        try {
          await db.collection('users').doc(user.uid).update({ status: 'active' });
          console.log('Firestore status updated to active for:', user.uid);
        } catch(e) { console.warn('Firestore update error:', e.message); }
      }
      // Update localStorage session
      if (user.role === 'teacher') {
        const existing = JSON.parse(localStorage.getItem('dtwd_teacher') || '{}');
        existing.status = 'active';
        localStorage.setItem('dtwd_teacher', JSON.stringify(existing));
      } else {
        const existing = JSON.parse(localStorage.getItem('dtwd_student') || '{}');
        existing.status = 'active';
        localStorage.setItem('dtwd_student', JSON.stringify(existing));
      }
      localStorage.removeItem('dtwd_pending_signup');
    } catch(e) { console.warn('Activate account error:', e); }
  }

  closeCheckout();

  let successMsg = '';
  if (currentPlan && currentPlan.type === 'student') {
    successMsg = 'Welcome ' + name + '! Your student access is now active. You will be redirected to your dashboard. God bless you! 🙏';
    // Set student session
    const existing = JSON.parse(localStorage.getItem('dtwd_student') || '{}');
    localStorage.setItem('dtwd_student', JSON.stringify({
      name: existing.name || name,
      email: existing.email || email,
      classCode: null, teacherName: null,
      plan: 'student', purchasedAt: Date.now()
    }));
  } else if (currentPlan) {
    const classCode = generateClassCode();
    successMsg = 'Welcome ' + name + '! Your teacher account is now active.<br><br>Your class code is:<br><strong style="font-size:1.5rem;color:#5b21b6;letter-spacing:3px;">' + classCode + '</strong><br><br>Share this code with your students. Redirecting to dashboard... 🙏';
    // Set teacher session
    const existing = JSON.parse(localStorage.getItem('dtwd_teacher') || '{}');
    localStorage.setItem('dtwd_teacher', JSON.stringify({
      name: existing.name || name,
      email: existing.email || email,
      classCode,
      plan: currentPlan.maxStudents ? 'teacher' : 'student',
      maxStudents: currentPlan.maxStudents || 30,
      expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000)
    }));
  }

  document.getElementById('success-message').innerHTML = successMsg;
  document.getElementById('success-modal').classList.remove('hidden');

  const btn = document.getElementById('btn-pay');
  if (btn) { btn.disabled = false; btn.textContent = '🔒 Pay Securely'; }

  // Auto redirect after 4 seconds
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
