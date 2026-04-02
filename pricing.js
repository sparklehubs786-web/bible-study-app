// ===== STRIPE CONFIGURATION =====
// IMPORTANT: Replace with your actual Stripe publishable key from stripe.com/dashboard
// ===== STRIPE TEST KEYS =====
// These are Stripe TEST keys — no real money is charged during testing
// Test card: 4242 4242 4242 4242 | Expiry: any future date | CVC: any 3 digits
// To go live: replace with your LIVE keys from stripe.com/dashboard
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RHExampleTestKeyReplaceThisWithYourRealStripeTestKey00';

// HOW TO GET YOUR TEST KEYS:
// 1. Go to https://stripe.com and sign up free
// 2. Go to Developers → API keys
// 3. Copy "Publishable key" (starts with pk_test_) and paste it above
// 4. Copy "Secret key" (starts with sk_test_) — add to your backend server
// 5. To test payments use card: 4242 4242 4242 4242

// Plan details
const PLANS = {
  student: {
    name: 'Student Access',
    price: '$7.00',
    amount: 700, // cents
    description: 'Full app access forever. Receive your URL instantly by email.',
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

// Initialize Stripe when page loads
window.addEventListener('DOMContentLoaded', () => {
  try {
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    const elements = stripe.elements();

    const style = {
      base: {
        fontSize: '15px',
        color: '#1f2937',
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

    // Add focus styles
    [cardElement, expiryElement, cvcElement].forEach(el => {
      el.on('focus', () => el._element.closest('.stripe-input').classList.add('focused'));
      el.on('blur',  () => el._element.closest('.stripe-input').classList.remove('focused'));
    });

  } catch(e) {
    console.warn('Stripe not initialized — add your publishable key:', e);
  }
});

// Open checkout modal
function checkout(planId) {
  currentPlan = PLANS[planId];
  if (!currentPlan) return;

  document.getElementById('checkout-title').textContent = 'Complete Your Purchase';
  document.getElementById('checkout-summary').innerHTML =
    '<strong>' + currentPlan.name + '</strong><br>' +
    '<span style="font-size:1.4rem;font-weight:900;color:#5b21b6;">' + currentPlan.price + '</span><br>' +
    '<span style="font-size:0.82rem;color:#4b5563;">' + currentPlan.description + '</span>';

  document.getElementById('checkout-modal').classList.remove('hidden');
  document.getElementById('stripe-error').classList.add('hidden');
  document.getElementById('buyer-name').value = '';
  document.getElementById('buyer-email').value = '';
}

function closeCheckout() {
  document.getElementById('checkout-modal').classList.add('hidden');
  currentPlan = null;
}

function closeSuccess() {
  document.getElementById('success-modal').classList.add('hidden');
  // Redirect based on plan type
  if (currentPlan && currentPlan.type === 'teacher') {
    window.location.href = 'teacher-login.html';
  } else {
    window.location.href = 'index.html';
  }
}

// Process payment
async function processPayment() {
  if (!stripe || !cardElement || !currentPlan) {
    showError('Payment system not ready. Please refresh and try again.');
    return;
  }

  const name  = document.getElementById('buyer-name').value.trim();
  const email = document.getElementById('buyer-email').value.trim();

  if (!name) { showError('Please enter your full name.'); return; }
  if (!email || !email.includes('@')) { showError('Please enter a valid email address.'); return; }

  const btn = document.getElementById('btn-pay');
  btn.disabled = true;
  btn.textContent = '⏳ Processing...';
  document.getElementById('stripe-error').classList.add('hidden');

  try {
    // Create payment method
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: { name, email }
    });

    if (error) {
      showError(error.message);
      btn.disabled = false;
      btn.textContent = '🔒 Pay Securely';
      return;
    }

    // NOTE: In production, send paymentMethod.id + plan details to your backend
    // Your backend creates the PaymentIntent and confirms it
    // For now we simulate success for testing
    console.log('Payment method created:', paymentMethod.id);
    console.log('Plan:', currentPlan.name);
    console.log('Amount:', currentPlan.amount);
    console.log('Customer:', name, email);

    // Simulate backend processing (replace with actual API call)
    await simulatePayment(paymentMethod.id, email, name);

  } catch(e) {
    showError('An error occurred. Please try again.');
    btn.disabled = false;
    btn.textContent = '🔒 Pay Securely';
  }
}

async function simulatePayment(paymentMethodId, email, name) {
  // Simulate 1.5s processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  closeCheckout();

  let successMsg = '';
  if (currentPlan.type === 'student') {
    successMsg = 'Welcome ' + name + '! Your student access has been activated. Check your email at ' + email + ' for your personal access URL. You can now log in and start studying immediately. God bless you! 🙏<br><br><a href="student.html" style="color:#16a34a;font-weight:800;font-size:1.05rem;">👤 Go to Student Dashboard →</a>';
  } else {
    const classCode = generateClassCode();
    successMsg = 'Welcome ' + name + '! Your teacher account is now active. Your class code is: <strong style="font-size:1.3rem;color:#5b21b6;letter-spacing:2px;">' + classCode + '</strong><br><br>Share this code with your students so they can join your class. Check your email at ' + email + ' for full setup instructions. Your 3-month class period starts today. God bless your ministry! 🙏';
  }

  document.getElementById('success-message').innerHTML = successMsg;
  document.getElementById('success-modal').classList.remove('hidden');

  const btn = document.getElementById('btn-pay');
  if (btn) { btn.disabled = false; btn.textContent = '🔒 Pay Securely'; }
}

function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'DTWD-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function showError(msg) {
  const el = document.getElementById('stripe-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ===== AUTO-SELECT PLAN FROM URL PARAMS =====
// Called when redirected from auth.html after signup
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const plan  = params.get('plan');
  const email = params.get('email');
  const name  = params.get('name');

  if (plan && PLANS[plan === 'student' ? 'student' : 'teacher_' + plan]) {
    const planKey = plan === 'student' ? 'student' : 'teacher_' + plan;
    // Auto-open checkout
    setTimeout(() => {
      checkout(planKey);
      if (email) document.getElementById('buyer-email').value = decodeURIComponent(email);
      if (name)  document.getElementById('buyer-name').value  = decodeURIComponent(name);
    }, 600);
  }

  // Show test mode banner
  if (STRIPE_PUBLISHABLE_KEY.includes('test') || STRIPE_PUBLISHABLE_KEY.includes('Example')) {
    const banner = document.createElement('div');
    banner.style.cssText = 'background:#fef3c7;border-bottom:2px solid #d97706;padding:10px 20px;text-align:center;font-size:0.82rem;font-weight:700;color:#92400e;position:sticky;top:0;z-index:9999;';
    banner.innerHTML = '🔧 TEST MODE — Use card: <strong>4242 4242 4242 4242</strong> | Any future expiry | Any CVC — No real money charged';
    document.body.prepend(banner);
  }
});

// ===== AFTER PAYMENT SUCCESS — redirect back to auth =====
// Override simulatePayment to redirect to auth with success flag
const _originalSimulate = simulatePayment;
async function simulatePayment(paymentMethodId, email, name) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  closeCheckout();

  // Activate the pending account
  const pending = localStorage.getItem('dtwd_pending_signup');
  if (pending) {
    const user = JSON.parse(pending);
    user.status = 'active';
    // Save to accounts
    const accounts = JSON.parse(localStorage.getItem('dtwd_accounts') || '[]');
    accounts.push(user);
    localStorage.setItem('dtwd_accounts', JSON.stringify(accounts));
    localStorage.removeItem('dtwd_pending_signup');
  }

  let successMsg = '';
  if (currentPlan && currentPlan.type === 'student') {
    successMsg = 'Welcome ' + name + '! Your student account is now active. You will be redirected to your dashboard shortly. God bless you! 🙏';
  } else {
    const classCode = generateClassCode();
    successMsg = 'Welcome ' + name + '! Your teacher account is now active.<br><br>Your class code is: <strong style="font-size:1.3rem;color:#5b21b6;letter-spacing:2px;">' + classCode + '</strong><br><br>Share this with your students. You will be redirected to your dashboard. 🙏';
    // Save class code to teacher session
    const teacher = JSON.parse(localStorage.getItem('dtwd_teacher') || '{}');
    teacher.classCode = classCode;
    localStorage.setItem('dtwd_teacher', JSON.stringify(teacher));
  }

  document.getElementById('success-message').innerHTML = successMsg;
  document.getElementById('success-modal').classList.remove('hidden');

  // Redirect after 3 seconds
  setTimeout(() => {
    if (currentPlan && currentPlan.type === 'teacher') {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'student.html';
    }
  }, 3500);
}
