// ===== STUDENT DASHBOARD — REAL FIREBASE =====
let currentStudent = null;
let currentSubmitChapterId = null;

window.addEventListener('DOMContentLoaded', () => {
  showLoading(true);

  auth.onAuthStateChanged(async user => {
    if (!user) { window.location.href = 'auth.html'; return; }
    if (!user.emailVerified) { showLoading(false); showVerifyPrompt(user); return; }

    // PRIMARY: Try localStorage first (instant, always works)
    const saved = localStorage.getItem('dtwd_student');
    if (saved) {
      try {
        currentStudent = JSON.parse(saved);
        currentStudent.uid = user.uid; // Always keep uid fresh

        // Payment gate check from localStorage
        if (currentStudent.status === 'pending_payment') {
          showLoading(false);
          showPaymentGate('student');
          return;
        }

        showLoading(false);
        showDashboard();
      } catch(e) { console.warn('localStorage parse error:', e); }
    }

    // SECONDARY: Try Firestore in background (update if available)
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists) {
        const data = doc.data();

        // If Firestore says teacher, redirect
        if (data.role === 'teacher') {
          window.location.href = 'dashboard.html';
          return;
        }

        // Payment gate check from Firestore
        if (data.status === 'pending_payment') {
          showLoading(false);
          showPaymentGate('student');
          return;
        }

        currentStudent = {
          uid:           user.uid,
          name:          data.name || user.displayName || user.email.split('@')[0],
          email:         user.email,
          classCode:     data.classCode || null,
          teacherName:   data.teacherName || null,
          plan:          'student',
          status:        data.status || 'active',
          purchasedAt:   data.purchasedAt || Date.now(),
          classExpiresAt: data.classExpiresAt || null
        };
        localStorage.setItem('dtwd_student', JSON.stringify(currentStudent));

        // Refresh dashboard silently if already showing
        const dashEl = document.getElementById('screen-dashboard');
        if (dashEl && dashEl.classList.contains('active')) {
          updateWelcomeStats();
          renderClassTab();
        } else if (!saved) {
          showLoading(false);
          showDashboard();
        }
      } else if (!saved) {
        // No profile anywhere — create one
        currentStudent = {
          uid: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          classCode: null,
          teacherName: null,
          plan: 'student',
          status: 'active',
          purchasedAt: Date.now()
        };
        try {
          await db.collection('users').doc(user.uid).set({
            ...currentStudent, role:'student', createdAt:Date.now()
          });
        } catch(e2){}
        localStorage.setItem('dtwd_student', JSON.stringify(currentStudent));
        showLoading(false);
        showDashboard();
      }
    } catch(fsErr) {
      console.warn('Firestore unavailable:', fsErr.message);
      if (!saved) {
        currentStudent = {
          uid: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          classCode: null,
          teacherName: null,
          plan: 'student',
          status: 'active',
          purchasedAt: Date.now()
        };
        localStorage.setItem('dtwd_student', JSON.stringify(currentStudent));
        showLoading(false);
        showDashboard();
      }
    }
  });
});

function showLoading(on) {
  let el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.style.cssText = 'position:fixed;inset:0;background:linear-gradient(160deg,#1e1b4b,#5b21b6);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;color:#fff;font-family:inherit;gap:16px;';
    el.innerHTML = '<div style="font-size:3rem;">🙏</div><div style="font-size:1rem;font-weight:700;">Loading your dashboard...</div><div style="width:40px;height:40px;border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;"></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
    document.body.appendChild(el);
  }
  el.style.display = on ? 'flex' : 'none';
}

function showError(msg) {
  document.body.innerHTML = '<div style="min-height:100vh;background:linear-gradient(160deg,#1e1b4b,#5b21b6);display:flex;align-items:center;justify-content:center;padding:20px;font-family:sans-serif;"><div style="background:#fff;border-radius:20px;padding:32px;max-width:400px;width:100%;text-align:center;"><div style="font-size:2.5rem;margin-bottom:12px;">⚠️</div><h2 style="color:#dc2626;margin-bottom:10px;">Error</h2><p style="color:#4b5563;margin-bottom:20px;">'+msg+'</p><button onclick="location.reload()" style="padding:12px 24px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer;">Try Again</button></div></div>';
}

function showVerifyPrompt(user) {
  document.body.innerHTML = '<div style="min-height:100vh;background:linear-gradient(160deg,#1e1b4b,#5b21b6);display:flex;align-items:center;justify-content:center;padding:20px;font-family:sans-serif;"><div style="background:#fff;border-radius:20px;padding:32px 28px;max-width:400px;width:100%;text-align:center;"><div style="font-size:3rem;margin-bottom:12px;">📧</div><h2 style="font-size:1.3rem;font-weight:900;color:#5b21b6;margin-bottom:10px;">Verify Your Email</h2><p style="font-size:.88rem;color:#4b5563;margin-bottom:20px;line-height:1.6;">We sent a verification email to <strong>' + user.email + '</strong>.<br><br>Please check your inbox and spam folder, then click the link to activate your account.</p><button onclick="resendVerify()" style="width:100%;padding:12px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer;margin-bottom:10px;">📧 Resend Verification Email</button><button onclick="auth.signOut().then(function(){window.location.href=\'auth.html\';})" style="width:100%;padding:12px;background:#f3f4f6;color:#374151;border:none;border-radius:10px;font-size:.9rem;font-weight:600;cursor:pointer;">← Back to Login</button></div></div>';
}

async function resendVerify() {
  try {
    const u = auth.currentUser;
    if (u) { await u.sendEmailVerification(); alert('✅ Verification email resent! Check your inbox.'); }
  } catch(e) { alert('Error: ' + e.message); }
}

// ===== PAYMENT GATE =====
function showPaymentGate(type) {
  showLoading(false);
  const price = type === 'teacher' ? '$30–$300' : '$7';
  const plan  = type === 'teacher' ? 'medium' : 'student';
  const email = (currentStudent && currentStudent.email) ? encodeURIComponent(currentStudent.email) : '';
  const name  = (currentStudent && currentStudent.name)  ? encodeURIComponent(currentStudent.name)  : '';

  document.body.innerHTML =
    '<div style="min-height:100vh;background:linear-gradient(160deg,#1e1b4b,#5b21b6);display:flex;align-items:center;justify-content:center;padding:20px;font-family:sans-serif;">' +
    '<div style="background:#fff;border-radius:20px;padding:36px 28px;max-width:420px;width:100%;text-align:center;">' +
    '<div style="font-size:3rem;margin-bottom:12px;">🔒</div>' +
    '<h2 style="font-size:1.3rem;font-weight:900;color:#5b21b6;margin-bottom:10px;">Complete Your Payment</h2>' +
    '<p style="font-size:.9rem;color:#4b5563;margin-bottom:6px;line-height:1.6;">Your account is created and verified!<br>Complete your ' + price + ' payment to unlock full access to your dashboard.</p>' +
    '<p style="font-size:.8rem;color:#9ca3af;margin-bottom:24px;">One-time payment for students. 3-month subscription for teachers.</p>' +
    '<button onclick="window.location.href=\'pricing.html?plan=' + plan + '&email=' + email + '&name=' + name + '\'" style="width:100%;padding:14px;background:#7c3aed;color:#fff;border:none;border-radius:12px;font-size:1rem;font-weight:800;cursor:pointer;margin-bottom:10px;">💳 Complete Payment — ' + price + '</button>' +
    '<button onclick="auth.signOut().then(function(){localStorage.removeItem(\'dtwd_student\');window.location.replace(\'auth.html\');})" style="width:100%;padding:12px;background:#f3f4f6;color:#374151;border:none;border-radius:12px;font-size:.9rem;font-weight:600;cursor:pointer;">← Sign Out</button>' +
    '</div></div>';
}

// ===== SHOW DASHBOARD =====
function showDashboard() {
  // Hide ALL other screens first
  document.querySelectorAll('.screen').forEach(s => {
    s.style.display = 'none';
    s.classList.remove('active');
  });

  const dash = document.getElementById('screen-dashboard');
  if (!dash) { showError('Dashboard element not found. Please check student.html.'); return; }
  dash.style.display = 'block';
  dash.classList.add('active');

  const nameBadge = document.getElementById('student-name-badge');
  const welcomeName = document.getElementById('welcome-name');
  const welcomeClass = document.getElementById('welcome-class');

  if (nameBadge)   nameBadge.textContent  = '👤 ' + (currentStudent.name || 'Student');
  if (welcomeName) welcomeName.textContent = 'Welcome, ' + (currentStudent.name || 'Student') + '! 🙏';
  if (welcomeClass) {
    welcomeClass.textContent = currentStudent.classCode
      ? '📚 Class: ' + currentStudent.classCode + (currentStudent.teacherName ? ' — Teacher: ' + currentStudent.teacherName : '')
      : '📖 No class yet — go to My Class tab to join one';
  }

  loadUserData();
  updateWelcomeStats();
  renderProgressTab();
  renderSubmissionsTab();
  renderFeedbackTab();
  renderClassTab();
}

let userData = {};
function loadUserData() {
  try { const s=localStorage.getItem('dtwd_userdata'); if(s) userData=JSON.parse(s); } catch(e){ userData={}; }
}
function getUserKey(k) { return userData[k]||''; }

function updateWelcomeStats() {
  let done = 0;
  if (typeof APP_DATA !== 'undefined' && APP_DATA.lessons) {
    APP_DATA.lessons.forEach(l => { if (getUserKey('complete_prayer_'+l.id+'_after')==='true') done++; });
  }
  const subs = getSubmissions();
  const wsCompleted = document.getElementById('ws-completed');
  const wsSubmitted = document.getElementById('ws-submitted');
  const wsGraded    = document.getElementById('ws-graded');
  if (wsCompleted) wsCompleted.textContent = done;
  if (wsSubmitted) wsSubmitted.textContent = subs.length;
  if (wsGraded) {
    if (currentStudent.uid) {
      db.collection('feedback').where('studentUid','==',currentStudent.uid).get()
        .then(snap => { wsGraded.textContent = snap.size; })
        .catch(()  => { wsGraded.textContent = 0; });
    } else {
      wsGraded.textContent = 0;
    }
  }
}

function renderProgressTab() {
  const container = document.getElementById('progress-list');
  if (!container || typeof APP_DATA === 'undefined') return;
  container.innerHTML = '';
  APP_DATA.chapters.forEach(ch => {
    const lessons = ch.lessons.map(lid => APP_DATA.lessons.find(l=>l.id===lid)).filter(Boolean);
    const types = ['prayer_before','scripture','key_terms','treasure_chest','questions','sketch','greater_works','prayer_after'];
    let dp=0, tp=lessons.length*types.length;
    lessons.forEach(lesson => {
      types.forEach(type => {
        const key = type==='prayer_before'?'complete_prayer_'+lesson.id+'_before':type==='prayer_after'?'complete_prayer_'+lesson.id+'_after':type==='scripture'?'complete_scripture_'+lesson.id:type==='key_terms'?'complete_keyterms_'+lesson.id:type==='treasure_chest'?'complete_treasure_'+lesson.id:type==='questions'?'complete_questions_'+lesson.id:type==='sketch'?'complete_sketch_'+lesson.id:'complete_gw_'+lesson.id;
        if (getUserKey(key)==='true') dp++;
      });
    });
    const pct = tp>0 ? Math.round((dp/tp)*100) : 0;
    const isDone = pct===100;
    const dots = lessons.map(l => {
      const d = getUserKey('complete_prayer_'+l.id+'_after')==='true';
      const s = getUserKey('complete_scripture_'+l.id)==='true';
      return '<div class="lesson-dot '+(d?'done':s?'partial':'empty')+'" title="Lesson '+l.number+'">'+l.number+'</div>';
    }).join('');
    const el = document.createElement('div');
    el.className = 'progress-chapter';
    el.innerHTML = '<div class="progress-chapter-header"><div class="progress-chapter-title">Chapter '+ch.id+': '+ch.title+'</div><div class="progress-pct'+(isDone?' done':'')+'">'+pct+'%'+(isDone?' ✅':'')+'</div></div><div class="progress-bar-bg"><div class="progress-bar-fill'+(isDone?' done':'')+'" style="width:'+pct+'%"></div></div><div class="progress-lessons">'+dots+'</div>';
    container.appendChild(el);
  });
}

function getSubmissions() { try { return JSON.parse(localStorage.getItem('dtwd_submissions')||'[]'); } catch(e){ return []; } }
function saveSubmissions(s) { localStorage.setItem('dtwd_submissions', JSON.stringify(s)); }

function renderSubmissionsTab() {
  const container = document.getElementById('submit-list');
  if (!container || typeof APP_DATA === 'undefined') return;
  container.innerHTML = '';
  const subs = getSubmissions();
  APP_DATA.chapters.forEach(ch => {
    const lessons = ch.lessons.map(lid => APP_DATA.lessons.find(l=>l.id===lid)).filter(Boolean);
    const anyDone = lessons.some(l => getUserKey('complete_prayer_'+l.id+'_after')==='true');
    const submitted = subs.some(s => s.chapterId===ch.id);
    let btnClass='btn-submit', btnText='📬 Submit to Teacher';
    const statusText = lessons.filter(l=>getUserKey('complete_prayer_'+l.id+'_after')==='true').length+'/'+lessons.length+' lessons completed';
    if (!currentStudent.classCode)  { btnClass='btn-submit not-ready'; btnText='🔗 Join a Class First'; }
    else if (submitted)             { btnClass='btn-submit submitted';  btnText='✅ Submitted'; }
    else if (!anyDone)              { btnClass='btn-submit not-ready';  btnText='🔒 Complete Lessons First'; }
    const el = document.createElement('div');
    el.className = 'submit-item';
    el.innerHTML = '<div class="submit-item-info"><div class="submit-item-title">Chapter '+ch.id+': '+ch.title+'</div><div class="submit-item-sub">'+statusText+(submitted?' • ✅ Submitted':'')+'</div></div><button class="'+btnClass+'" onclick="openSubmitModal('+ch.id+')">'+btnText+'</button>';
    container.appendChild(el);
  });
}

function openSubmitModal(chapterId) {
  const subs = getSubmissions();
  if (subs.some(s => s.chapterId===chapterId)) return;
  if (!currentStudent.classCode) { alert('Please join a class first to submit your work.'); return; }
  if (typeof APP_DATA === 'undefined') return;
  const ch = APP_DATA.chapters.find(c => c.id===chapterId);
  if (!ch) return;
  const lessons = ch.lessons.map(lid => APP_DATA.lessons.find(l=>l.id===lid)).filter(Boolean);
  const done = lessons.filter(l => getUserKey('complete_prayer_'+l.id+'_after')==='true').length;
  currentSubmitChapterId = chapterId;
  const chEl = document.getElementById('submit-modal-chapter');
  const sumEl = document.getElementById('submit-summary');
  if (chEl) chEl.textContent = 'Chapter '+ch.id+': '+ch.title;
  if (sumEl) sumEl.innerHTML = '<strong>What will be submitted:</strong><br>✅ '+done+' of '+lessons.length+' lessons completed<br>📝 All your answers and notes<br>🎨 Your sketch pages<br>💎 Treasure chest notes<br><br><strong>Sending to:</strong> '+(currentStudent.teacherName||'Your Teacher')+' (Class: '+currentStudent.classCode+')';
  const modal = document.getElementById('submit-modal');
  if (modal) modal.classList.remove('hidden');
}

async function finalSubmit() {
  if (!currentSubmitChapterId || typeof APP_DATA === 'undefined') return;
  const ch = APP_DATA.chapters.find(c => c.id===currentSubmitChapterId);
  if (!ch) return;
  const msgEl = document.getElementById('submit-message');
  const message = msgEl ? msgEl.value.trim() : '';
  const lessons = ch.lessons.map(lid => APP_DATA.lessons.find(l=>l.id===lid)).filter(Boolean);
  let answers={}, treasureNotes={};
  lessons.forEach(lesson => {
    try { answers[lesson.id] = JSON.parse(getUserKey('questions_'+lesson.id)||'{}'); } catch(e){}
    try { treasureNotes[lesson.id] = JSON.parse(getUserKey('treasure_'+lesson.id)||'{}'); } catch(e){}
  });
  const submission = {
    studentUid:    currentStudent.uid,
    studentName:   currentStudent.name,
    studentEmail:  currentStudent.email,
    classCode:     currentStudent.classCode,
    chapterId:     currentSubmitChapterId,
    chapterTitle:  'Chapter '+ch.id+': '+ch.title,
    message, answers, treasureNotes,
    personalApp:   getUserKey('personal_'+currentSubmitChapterId),
    submittedAt:   Date.now(),
    status:        'submitted'
  };
  try { await db.collection('submissions').add(submission); } catch(e){ console.warn('Firestore error:', e); }
  const subs = getSubmissions();
  subs.push({ ...submission, id:'sub_'+Date.now() });
  saveSubmissions(subs);
  closeModal('submit-modal');
  const successMsg = document.getElementById('success-msg');
  const successModal = document.getElementById('success-modal');
  if (successMsg) successMsg.innerHTML = 'Chapter '+ch.id+' submitted to your teacher! 🙏<br><br>Your teacher will review and send feedback soon.';
  if (successModal) successModal.classList.remove('hidden');
  renderSubmissionsTab();
  updateWelcomeStats();
}

async function renderFeedbackTab() {
  const container = document.getElementById('feedback-list');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:20px;color:#9ca3af;font-size:.88rem;">Loading feedback...</div>';
  try {
    if (!currentStudent.uid) throw new Error('no uid');
    const snap = await db.collection('feedback').where('studentUid','==',currentStudent.uid).get();
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = '<div class="feedback-empty"><div>📬</div>No feedback yet. Submit a chapter to your teacher to receive grades and comments.</div>';
      return;
    }
    snap.forEach(doc => {
      const fb = doc.data();
      const date = new Date(fb.gradedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
      const el = document.createElement('div');
      el.className = 'feedback-card';
      el.innerHTML = '<div class="feedback-header"><div class="feedback-chapter">'+fb.chapterTitle+'</div><div class="feedback-date">Graded '+date+'</div></div><div class="grade-badge">📊 Grade: '+fb.grade+'</div><div class="feedback-comment">"'+(fb.comment||'No comment')+'"</div>';
      container.appendChild(el);
    });
  } catch(e) {
    container.innerHTML = '<div class="feedback-empty"><div>📬</div>No feedback yet. Submit a chapter to your teacher to receive grades and comments.</div>';
  }
}

function renderClassTab() {
  const container = document.getElementById('class-info');
  if (!container) return;
  if (!currentStudent.classCode) {
    container.innerHTML = '<div class="no-class-box"><div>🏫</div><p>You are not enrolled in a class yet.</p><button class="btn-login" style="margin-top:12px;width:auto;padding:10px 24px;" onclick="promptJoinClass()">+ Join a Class</button></div>';
    return;
  }
  const expiry = currentStudent.classExpiresAt
    ? new Date(currentStudent.classExpiresAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})
    : 'Active';
  container.innerHTML =
    '<div class="class-code-big">'+currentStudent.classCode+'</div>' +
    '<div class="class-info-row"><span class="class-info-label">Teacher</span><span class="class-info-val">'+(currentStudent.teacherName||'Your Teacher')+'</span></div>' +
    '<div class="class-info-row"><span class="class-info-label">Status</span><span class="class-info-val" style="color:#16a34a;">✅ Active</span></div>' +
    '<div class="class-info-row"><span class="class-info-label">Class Expires</span><span class="class-info-val">'+expiry+'</span></div>' +
    '<div class="class-info-row"><span class="class-info-label">Your Plan</span><span class="class-info-val">Student Access — $7 one time</span></div>';
}

async function promptJoinClass() {
  const code = prompt('Enter your class code from your teacher (e.g. DTWD-ABC123):');
  if (!code || code.trim().length < 6) return;
  const c = code.trim().toUpperCase();
  try {
    if (currentStudent.uid) await db.collection('users').doc(currentStudent.uid).update({ classCode: c });
    currentStudent.classCode = c;
    localStorage.setItem('dtwd_student', JSON.stringify(currentStudent));
    alert('✅ Joined class: ' + c);
    renderClassTab();
    renderSubmissionsTab();
  } catch(e) { alert('Error: ' + e.message); }
}

function goToApp() { window.location.href = 'index.html'; }

function logout() {
  auth.signOut().then(() => {
    localStorage.removeItem('dtwd_student');
    window.location.href = 'auth.html';
  });
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const tabBtn = document.getElementById('tab-'+tab);
  const tabContent = document.getElementById('tab-content-'+tab);
  if (tabBtn) tabBtn.classList.add('active');
  if (tabContent) tabContent.classList.add('active');
  if (tab === 'feedback') renderFeedbackTab();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}
