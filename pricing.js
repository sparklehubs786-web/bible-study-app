// ===== STRIPE CONFIGURATION =====
const STRIPE_PUBLISHABLE_KEY = ''; // ← PASTE YOUR pk_test_ KEY HERE
const HAS_REAL_KEY = STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_') || STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_');

const PLANS = {
  student:        { name:'Student Access', price:'$7.00', amount:700, description:'Full app access forever.', type:'student', planKey:'student' },
  teacher_small:  { name:'Teacher — Small Group (up to 15)',  price:'$30.00',  amount:3000,  description:'3-month period. Up to 15 students.', type:'teacher', maxStudents:15,  planKey:'small'  },
  teacher_medium: { name:'Teacher — Medium Group (up to 30)', price:'$60.00',  amount:6000,  description:'3-month period. Up to 30 students.', type:'teacher', maxStudents:30,  planKey:'medium' },
  teacher_large:  { name:'Teacher — Large Group (up to 60)',  price:'$120.00', amount:12000, description:'3-month period. Up to 60 students.', type:'teacher', maxStudents:60,  planKey:'large'  },
  teacher_xl:     { name:'Teacher — Extra Large (up to 100)', price:'$300.00', amount:30000, description:'3-month period. Up to 100 students.', type:'teacher', maxStudents:100, planKey:'xl'     }
};

let stripe=null,cardElement=null,expiryElement=null,cvcElement=null,currentPlan=null;

window.addEventListener('DOMContentLoaded',()=>{
  showTestBanner();initStripe();handleUrlParams();
});

function showTestBanner(){
  const banner=document.createElement('div');
  if(HAS_REAL_KEY){banner.style.cssText='background:#dcfce7;border-bottom:2px solid #16a34a;padding:10px 20px;text-align:center;font-size:0.82rem;font-weight:700;color:#15803d;position:sticky;top:0;z-index:9999;';banner.innerHTML='✅ LIVE MODE — Real payments enabled via Stripe';}
  else{banner.style.cssText='background:#fef3c7;border-bottom:2px solid #d97706;padding:10px 20px;text-align:center;font-size:0.82rem;font-weight:700;color:#92400e;position:sticky;top:0;z-index:9999;';banner.innerHTML='🔧 DEMO MODE — Add your Stripe key for real payments. Test card: <strong>4242 4242 4242 4242</strong>';}
  document.body.prepend(banner);
}

function initStripe(){
  if(!HAS_REAL_KEY)return;
  try{
    stripe=Stripe(STRIPE_PUBLISHABLE_KEY);
    const elements=stripe.elements();
    const style={base:{fontSize:'15px',color:'#1f2937',fontFamily:'-apple-system,sans-serif','::placeholder':{color:'#9ca3af'}},invalid:{color:'#dc2626'}};
    cardElement=elements.create('cardNumber',{style});cardElement.mount('#stripe-card-element');
    expiryElement=elements.create('cardExpiry',{style});expiryElement.mount('#stripe-expiry-element');
    cvcElement=elements.create('cardCvc',{style});cvcElement.mount('#stripe-cvc-element');
  }catch(e){console.warn('Stripe init:',e.message);}
}

function handleUrlParams(){
  const params=new URLSearchParams(window.location.search);
  const plan=params.get('plan'),email=params.get('email'),name=params.get('name');
  if(plan){
    const planKey=plan==='student'?'student':'teacher_'+plan;
    if(PLANS[planKey]){
      setTimeout(()=>{
        checkout(planKey);
        const emailEl=document.getElementById('buyer-email');if(emailEl&&email)emailEl.value=decodeURIComponent(email);
        const nameEl=document.getElementById('buyer-name');if(nameEl&&name)nameEl.value=decodeURIComponent(name);
      },500);
    }
  }
}

function checkout(planId){
  currentPlan=PLANS[planId];if(!currentPlan)return;
  const titleEl=document.getElementById('checkout-title');const sumEl=document.getElementById('checkout-summary');
  if(titleEl)titleEl.textContent='Complete Your Purchase';
  if(sumEl)sumEl.innerHTML='<strong>'+currentPlan.name+'</strong><br><span style="font-size:1.4rem;font-weight:900;color:#5b21b6;">'+currentPlan.price+'</span><br><span style="font-size:0.82rem;color:#4b5563;">'+currentPlan.description+'</span>';
  const sf=document.getElementById('stripe-real-fields');const df=document.getElementById('stripe-demo-fields');
  if(HAS_REAL_KEY){if(sf)sf.style.display='block';if(df)df.style.display='none';}
  else{if(sf)sf.style.display='none';if(df)df.style.display='block';}
  const modal=document.getElementById('checkout-modal');if(modal)modal.classList.remove('hidden');
  const errEl=document.getElementById('stripe-error');if(errEl)errEl.classList.add('hidden');
}

function closeCheckout(){const modal=document.getElementById('checkout-modal');if(modal)modal.classList.add('hidden');}

function closeSuccess(){
  const modal=document.getElementById('success-modal');if(modal)modal.classList.add('hidden');
  if(currentPlan&&currentPlan.type==='teacher'){
    window.location.replace('dashboard.html');
  } else {
    window.location.replace('student.html');
  }
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

// ===== ACTIVATE ACCOUNT — Updates BOTH Firestore AND localStorage =====
async function activateAccount(name, email) {
  const isTeacher = currentPlan && currentPlan.type === 'teacher';

  // ── Get uid from all possible sources ──
  let uid = null;
  let pending = null;
  try { pending = JSON.parse(localStorage.getItem('dtwd_pending_signup') || 'null'); } catch(e) {}
  uid = (pending && pending.uid) || null;
  if (!uid) { try { const u = auth.currentUser; if (u) uid = u.uid; } catch(e) {} }
  if (!uid) {
    try {
      const key = isTeacher ? 'dtwd_teacher' : 'dtwd_student';
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      uid = saved.uid || null;
    } catch(e) {}
  }
  console.log('activateAccount → uid:', uid, '| isTeacher:', isTeacher, '| plan:', currentPlan.planKey);

  // ── Get or generate class code for teacher ──
  let classCode = null;
  if (isTeacher) {
    try { classCode = JSON.parse(localStorage.getItem('dtwd_teacher') || '{}').classCode; } catch(e) {}
    if (!classCode && pending) classCode = pending.classCode;
    if (!classCode) classCode = generateClassCode();
  }

  const expiresAt = Date.now() + (90 * 24 * 60 * 60 * 1000);

  // ── STEP 1: Write active status to localStorage IMMEDIATELY ──
  if (isTeacher) {
    const ex = JSON.parse(localStorage.getItem('dtwd_teacher') || '{}');
    const rec = {
      uid:         uid || ex.uid || '',
      name:        ex.name || name,
      email:       ex.email || email,
      classCode:   classCode,
      plan:        currentPlan.planKey || ex.plan || 'medium',
      maxStudents: currentPlan.maxStudents || 30,
      status:      'active',
      expiresAt:   expiresAt
    };
    localStorage.setItem('dtwd_teacher', JSON.stringify(rec));
    console.log('✅ localStorage dtwd_teacher → active, classCode:', classCode);
  } else {
    const ex = JSON.parse(localStorage.getItem('dtwd_student') || '{}');
    const rec = {
      uid:         uid || ex.uid || '',
      name:        ex.name || name,
      email:       ex.email || email,
      classCode:   ex.classCode || null,
      teacherName: ex.teacherName || null,
      plan:        'student',
      status:      'active',
      purchasedAt: Date.now()
    };
    localStorage.setItem('dtwd_student', JSON.stringify(rec));
    console.log('✅ localStorage dtwd_student → active');
  }

  // ── STEP 2: Remove pending flag ──
  localStorage.removeItem('dtwd_pending_signup');

  // ── STEP 3: Write to Firestore (set+merge — works even if doc doesn't exist) ──
  if (uid) {
    const payload = { status: 'active', name };
    if (isTeacher) {
      Object.assign(payload, {
        role: 'teacher',
        classCode, plan: currentPlan.planKey,
        maxStudents: currentPlan.maxStudents, expiresAt
      });
    } else {
      Object.assign(payload, { role: 'student', purchasedAt: Date.now() });
    }
    try {
      await db.collection('users').doc(uid).set(payload, { merge: true });
      console.log('✅ Firestore → active for uid:', uid);
    } catch(e) {
      console.warn('Firestore write failed (non-fatal, localStorage is set):', e.message);
    }
  }

  closeCheckout();

  // ── STEP 4: Show success ──
  const msg = isTeacher
    ? 'Welcome ' + name + '! Your teacher account is now active.<br><br>'
      + 'Your class code is:<br>'
      + '<strong style="font-size:1.5rem;color:#5b21b6;letter-spacing:3px;">' + classCode + '</strong><br><br>'
      + 'Share this code with your students.<br>Redirecting to dashboard... 🙏'
    : 'Welcome ' + name + '! Your student access is now active.<br>Redirecting to your dashboard. God bless you! 🙏';

  const smEl  = document.getElementById('success-message');
  const smMod = document.getElementById('success-modal');
  if (smEl)  smEl.innerHTML = msg;
  if (smMod) smMod.classList.remove('hidden');

  const btn = document.getElementById('btn-pay');
  if (btn) { btn.disabled = false; btn.textContent = '🔒 Pay Securely'; }

  // ── STEP 5: Redirect after 3 seconds ──
  // Redirect after success message
  setTimeout(() => {
    closeSuccess();
  }, 3000);
}

function generateClassCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code='DTWD-';for(let i=0;i<6;i++)code+=chars[Math.floor(Math.random()*chars.length)];return code;}
function showPricingError(msg){const el=document.getElementById('stripe-error');if(el){el.textContent=msg;el.classList.remove('hidden');}}
