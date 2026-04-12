// ===== STRIPE CONFIGURATION =====
const STRIPE_PUBLISHABLE_KEY = ''; // ← PASTE YOUR pk_test_ KEY HERE
const HAS_REAL_KEY = STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_') || STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_');

const PLANS = {
  student:        { name:'Student Access', price:'$7.00', amount:700, description:'Full app access forever.', type:'student', planKey:'student' },
  teacher_small:  { name:'Teacher — Small Group (up to 15)',  price:'$30.00',  amount:3000,  description:'3-month period. Up to 15 students.', type:'teacher', maxStudents:15,  planKey:'small'  },
  teacher_medium: { name:'Teacher — Medium Group (up to 30)', price:'$60.00',  amount:6000,  description:'3-month period. Up to 30 students.', type:'teacher', maxStudents:30,  planKey:'medium' },
  teacher_large:  { name:'Teacher — Large Group (up to 60)',  price:'$120.00', amount:12000, description:'3-month period. Up to 60 students.', type:'teacher', maxStudents:60,  planKey:'large'  },
  teacher_xl:     { name:'Teacher — Extra Large (up to 100)', price:'$300.00', amount:30000, description:'3-month period. Up to 100 students.',type:'teacher', maxStudents:100, planKey:'xl'     }
};

let stripe = null, cardElement = null, expiryElement = null, cvcElement = null, currentPlan = null;

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
    banner.innerHTML = '🔧 DEMO MODE — Add your Stripe key for real payments. Test card: <strong>4242 4242 4242 4242</strong>';
  }
  document.body.prepend(banner);
}

function initStripe() {
  if (!HAS_REAL_KEY) return;
  try {
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    const elements = stripe.elements();
    const style = { base:{ fontSize:'15px',color:'#1f2937',fontFamily:'-apple-system,sans-serif','::placeholder':{color:'#9ca3af'} }, invalid:{color:'#dc2626'} };
    cardElement   = elements.create('cardNumber', {style}); cardElement.mount('#stripe-card-element');
    expiryElement = elements.create('cardExpiry', {style}); expiryElement.mount('#stripe-expiry-element');
    cvcElement    = elements.create('cardCvc',    {style}); cvcElement.mount('#stripe-cvc-element');
  } catch(e) { console.warn('Stripe init failed:', e.message); }
}

function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const plan = params.get('plan'), email = params.get('email'), name = params.get('name');
  if (plan) {
    const planKey = plan==='student' ? 'student' : 'teacher_'+plan;
    if (PLANS[planKey]) {
      setTimeout(() => {
        checkout(planKey);
        const emailEl=document.getElementById('buyer-email'); if(emailEl&&email)emailEl.value=decodeURIComponent(email);
        const nameEl=document.getElementById('buyer-name');   if(nameEl&&name)nameEl.value=decodeURIComponent(name);
      }, 500);
    }
  }
}

function checkout(planId) {
  currentPlan = PLANS[planId];
  if (!currentPlan) return;
  const titleEl=document.getElementById('checkout-title');
  const sumEl=document.getElementById('checkout-summary');
  if (titleEl) titleEl.textContent='Complete Your Purchase';
  if (sumEl) sumEl.innerHTML='<strong>'+currentPlan.name+'</strong><br><span style="font-size:1.4rem;font-weight:900;color:#5b21b6;">'+currentPlan.price+'</span><br><span style="font-size:0.82rem;color:#4b5563;">'+currentPlan.description+'</span>';
  const sf=document.getElementById('stripe-real-fields');const df=document.getElementById('stripe-demo-fields');
  if(HAS_REAL_KEY){if(sf)sf.style.display='block';if(df)df.style.display='none';}
  else{if(sf)sf.style.display='none';if(df)df.style.display='block';}
  const modal=document.getElementById('checkout-modal');if(modal)modal.classList.remove('hidden');
  const errEl=document.getElementById('stripe-error');if(errEl)errEl.classList.add('hidden');
}

function closeCheckout(){const modal=document.getElementById('checkout-modal');if(modal)modal.classList.add('hidden');}

function closeSuccess(){
  const modal=document.getElementById('success-modal');if(modal)modal.classList.add('hidden');
  if(currentPlan&&currentPlan.type==='teacher') window.location.href='dashboard.html';
  else window.location.href='student.html';
}

async function processPayment(){
  const nameEl=document.getElementById('buyer-name');const emailEl=document.getElementById('buyer-email');
  const name=(nameEl?nameEl.value:'').trim();const email=(emailEl?emailEl.value:'').trim();
  if(!name){showPricingError('Please enter your full name.');return;}
  if(!email||!email.includes('@')){showPricingError('Please enter a valid email address.');return;}
  const btn=document.getElementById('btn-pay');
  if(btn){btn.disabled=true;btn.textContent='⏳ Processing...';}
  const errEl=document.getElementById('stripe-error');if(errEl)errEl.classList.add('hidden');
  if(HAS_REAL_KEY&&stripe&&cardElement){
    try{
      const{paymentMethod,error}=await stripe.createPaymentMethod({type:'card',card:cardElement,billing_details:{name,email}});
      if(error){showPricingError(error.message);if(btn){btn.disabled=false;btn.textContent='🔒 Pay Securely';}return;}
      await activateAccount(name,email);
    }catch(e){showPricingError('Payment error. Please try again.');if(btn){btn.disabled=false;btn.textContent='🔒 Pay Securely';}}
  }else{
    const demoCard=document.getElementById('demo-card');
    if(demoCard&&demoCard.value&&demoCard.value.replace(/\s/g,'')!=='4242424242424242'){
      showPricingError('In demo mode use test card: 4242 4242 4242 4242');
      if(btn){btn.disabled=false;btn.textContent='🔒 Pay Securely';}return;
    }
    await new Promise(r=>setTimeout(r,1500));
    await activateAccount(name,email);
  }
}

// ===== ACTIVATE ACCOUNT — FIXED =====
// Uses set({merge:true}) instead of update() so it works even if doc doesn't exist yet.
// Writes status:'active' to BOTH Firestore and localStorage before redirecting.
async function activateAccount(name, email) {
  const isTeacher = currentPlan && currentPlan.type==='teacher';
  let classCode = null;
  let uid = null;

  // Get uid from pending signup or from current Firebase auth user
  const pendingRaw = localStorage.getItem('dtwd_pending_signup');
  let pending = null;
  if (pendingRaw) { try { pending=JSON.parse(pendingRaw); } catch(e){} }

  uid = (pending && pending.uid) || null;
  if (!uid) {
    try { const u=auth.currentUser; if(u) uid=u.uid; } catch(e){}
  }

  // ── FIX: Also try to get uid from saved localStorage profile ──
  if (!uid) {
    try {
      if (isTeacher) {
        const t = JSON.parse(localStorage.getItem('dtwd_teacher')||'{}');
        uid = t.uid || null;
      } else {
        const s = JSON.parse(localStorage.getItem('dtwd_student')||'{}');
        uid = s.uid || null;
      }
    } catch(e){}
  }

  // Get existing class code
  if (isTeacher) {
    const savedTeacher = localStorage.getItem('dtwd_teacher');
    if (savedTeacher) {
      try { const t=JSON.parse(savedTeacher); classCode=t.classCode||null; } catch(e){}
    }
    if (!classCode && pending) classCode = pending.classCode||null;
    if (!classCode) classCode = generateClassCode();
  }

  const expiresAt = Date.now() + (90*24*60*60*1000);

  // ── STEP 1: Update localStorage FIRST (instant, no network) ──
  if (isTeacher) {
    const existing = JSON.parse(localStorage.getItem('dtwd_teacher') || '{}');
    const updated = {
      uid:         uid || existing.uid || '',
      name:        existing.name  || name,
      email:       existing.email || email,
      classCode:   classCode,
      plan:        currentPlan.planKey || existing.plan || 'medium',
      maxStudents: currentPlan.maxStudents || 30,
      status:      'active',   // ← KEY
      expiresAt:   expiresAt
    };
    localStorage.setItem('dtwd_teacher', JSON.stringify(updated));
    console.log('✅ localStorage dtwd_teacher → active');
  } else {
    const existing = JSON.parse(localStorage.getItem('dtwd_student') || '{}');
    const updated = {
      uid:         uid || existing.uid || '',
      name:        existing.name  || name,
      email:       existing.email || email,
      classCode:   existing.classCode   || null,
      teacherName: existing.teacherName || null,
      plan:        'student',
      status:      'active',   // ← KEY
      purchasedAt: Date.now()
    };
    localStorage.setItem('dtwd_student', JSON.stringify(updated));
    console.log('✅ localStorage dtwd_student → active');
  }

  // ── STEP 2: Remove pending flag ──
  localStorage.removeItem('dtwd_pending_signup');
  console.log('✅ Removed dtwd_pending_signup');

  // ── STEP 3: Update Firestore (use set+merge so it works even if doc missing) ──
  if (uid) {
    try {
      const updatePayload = { status: 'active', name };
      if (isTeacher) {
        updatePayload.classCode   = classCode;
        updatePayload.plan        = currentPlan.planKey;
        updatePayload.maxStudents = currentPlan.maxStudents;
        updatePayload.expiresAt   = expiresAt;
        updatePayload.role        = 'teacher';
      } else {
        updatePayload.role        = 'student';
        updatePayload.purchasedAt = Date.now();
      }
      // ── FIX: use set({merge:true}) instead of update() ──
      // update() throws if document doesn't exist; set+merge works either way
      await db.collection('users').doc(uid).set(updatePayload, { merge: true });
      console.log('✅ Firestore → active for uid:', uid);
    } catch(e) {
      // Non-fatal — localStorage already has status:active
      console.warn('Firestore update error (non-fatal):', e.message);
    }
  }

  closeCheckout();

  // ── STEP 4: Show success message ──
  let successMsg = '';
  if (isTeacher) {
    successMsg = 'Welcome ' + name + '! Your teacher account is now active.<br><br>Your class code is:<br><strong style="font-size:1.5rem;color:#5b21b6;letter-spacing:3px;">' + classCode + '</strong><br><br>Share this code with your students. Redirecting to dashboard... 🙏';
  } else {
    successMsg = 'Welcome ' + name + '! Your student access is now active. Redirecting to your dashboard. God bless you! 🙏';
  }

  const successMsgEl=document.getElementById('success-message');
  const successModal=document.getElementById('success-modal');
  if(successMsgEl)successMsgEl.innerHTML=successMsg;
  if(successModal)successModal.classList.remove('hidden');

  const btn=document.getElementById('btn-pay');
  if(btn){btn.disabled=false;btn.textContent='🔒 Pay Securely';}

  setTimeout(()=>closeSuccess(), 4000);
}

function generateClassCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code='DTWD-';
  for(let i=0;i<6;i++)code+=chars[Math.floor(Math.random()*chars.length)];return code;
}
function showPricingError(msg){const el=document.getElementById('stripe-error');if(el){el.textContent=msg;el.classList.remove('hidden');}}
