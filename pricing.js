// ===== STRIPE CONFIGURATION =====
// IMPORTANT: Replace with your actual Stripe publishable key from stripe.com/dashboard
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51QusvZP4hTfH1U7GvbT8ITnyB2ttEEmlKpSIqgv3fc7nPS3pQ5BbQ0dn50PnTGWhgYIGr3z6CgZ4A2KA2oUhjAYP00HJ5K4TFa';

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
    successMsg = 'Welcome ' + name + '! Your student access has been activated. Check your email at ' + email + ' for your personal access URL. You can now log in and start studying immediately. God bless you! 🙏';
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
