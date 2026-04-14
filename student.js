// ===== STUDENT DASHBOARD =====
let currentStudent = null;
let currentSubmitChapterId = null;

// Returns true if student has paid
function hasPaid(d) {
  if (!d) return false;
  if (d.status === 'active') return true;
  if (d.status === 'pending_payment') return false;
  return true; // no status = legacy account, assume paid
}

window.addEventListener('DOMContentLoaded', () => {
  showLoading(true);

  const authTimeout = setTimeout(() => {
    showLoading(false);
    showError('Loading timed out. Please <a href="signin.html">sign in again</a>.');
  }, 10000);

  auth.onAuthStateChanged(async user => {
    clearTimeout(authTimeout);
    if (!user) { showLoading(false); window.location.replace('signin.html'); return; }
    // Google users are auto-verified; only block email/password users who haven't verified
    if (!user.emailVerified && user.providerData[0]?.providerId === 'password') {
      showLoading(false); showVerifyPrompt(user); return;
    }

    // ── Load from localStorage first (instant) ──
    const saved = localStorage.getItem('dtwd_student');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email === user.email || !parsed.email) {
          parsed.uid = user.uid;
          if (hasPaid(parsed)) {
            // Active — show dashboard immediately
            currentStudent = parsed;
            showLoading(false);
            showDashboard();
            syncFromFirestore(user); // update in background
            return;
          }
          // pending_payment in localStorage — but check Firestore first
          // (payment may have been completed from another device)
          currentStudent = parsed;
        }
      } catch(e) { console.warn('localStorage parse:', e); }
    }

    // ── Always sync from Firestore to get latest status ──
    await syncFromFirestore(user);
  });
});

async function syncFromFirestore(user) {
  try {
    const doc = await Promise.race([
      db.collection('users').doc(user.uid).get(),
      new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 6000))
    ]);

    if (doc.exists) {
      const data = doc.data();
      if (data.role === 'teacher') { window.location.replace('dashboard.html'); return; }

      const student = {
        uid:            user.uid,
        name:           data.name || user.displayName || user.email.split('@')[0],
        email:          user.email,
        classCode:      data.classCode || null,
        teacherName:    data.teacherName || null,
        plan:           'student',
        status:         data.status || 'active',
        purchasedAt:    data.purchasedAt || Date.now(),
        classExpiresAt: data.classExpiresAt || null
      };
      localStorage.setItem('dtwd_student', JSON.stringify(student));
      currentStudent = student;

      if (!hasPaid(student)) {
        showLoading(false);
        showPaymentGate();
        return;
      }

      // If dashboard already showing, just refresh stats
      const dash = document.getElementById('screen-dashboard');
      if (dash && dash.classList.contains('active')) {
        updateWelcomeStats(); renderClassTab(); return;
      }
      showLoading(false);
      showDashboard();

    } else {
      // No Firestore profile — create one and allow access
      const student = {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        classCode: null, teacherName: null,
        plan: 'student', status: 'active', purchasedAt: Date.now()
      };
      try { await db.collection('users').doc(user.uid).set({ ...student, role: 'student', createdAt: Date.now() }); } catch(e2) {}
      localStorage.setItem('dtwd_student', JSON.stringify(student));
      currentStudent = student;
      showLoading(false);
      showDashboard();
    }

  } catch(fsErr) {
    console.warn('Firestore unavailable:', fsErr.message);
    if (currentStudent && hasPaid(currentStudent)) {
      // Already showing or active from localStorage — do nothing
      const dash = document.getElementById('screen-dashboard');
      if (!dash || !dash.classList.contains('active')) {
        showLoading(false);
        showDashboard();
      }
    } else if (currentStudent) {
      // pending in localStorage AND Firestore unreachable — show payment gate
      showLoading(false);
      showPaymentGate();
    } else {
      // No info at all — create minimal session
      currentStudent = {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        classCode: null, teacherName: null,
        plan: 'student', status: 'active', purchasedAt: Date.now()
      };
      localStorage.setItem('dtwd_student', JSON.stringify(currentStudent));
      showLoading(false);
      showDashboard();
    }
  }
}

// ── Loading overlay ──
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
  document.body.innerHTML = '<div style="min-height:100vh;background:linear-gradient(160deg,#1e1b4b,#5b21b6);display:flex;align-items:center;justify-content:center;padding:20px;font-family:sans-serif;"><div style="background:#fff;border-radius:20px;padding:32px;max-width:400px;width:100%;text-align:center;"><div style="font-size:2.5rem;margin-bottom:12px;">⚠️</div><p style="color:#4b5563;margin-bottom:20px;line-height:1.6;">' + msg + '</p><button onclick="location.reload()" style="padding:12px 24px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;">Try Again</button></div></div>';
}

function showVerifyPrompt(user) {
  document.body.innerHTML = '<div style="min-height:100vh;background:linear-gradient(160deg,#1e1b4b,#5b21b6);display:flex;align-items:center;justify-content:center;padding:20px;font-family:sans-serif;"><div style="background:#fff;border-radius:20px;padding:32px 28px;max-width:400px;width:100%;text-align:center;"><div style="font-size:3rem;margin-bottom:12px;">📧</div><h2 style="font-size:1.3rem;font-weight:900;color:#5b21b6;margin-bottom:10px;">Verify Your Email</h2><p style="font-size:.88rem;color:#4b5563;margin-bottom:20px;line-height:1.6;">We sent a verification email to <strong>' + user.email + '</strong>.<br><br>Check your <strong>inbox AND spam folder</strong>, then click the link.</p><button onclick="resendVerify()" style="width:100%;padding:12px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer;margin-bottom:10px;">📧 Resend Verification Email</button><button onclick="auth.signOut().then(function(){window.location.replace(\'signin.html\');})" style="width:100%;padding:12px;background:#f3f4f6;color:#374151;border:none;border-radius:10px;font-size:.9rem;font-weight:600;cursor:pointer;">← Back to Login</button></div></div>';
}
async function resendVerify() {
  try { const u = auth.currentUser; if (u) { await u.sendEmailVerification(); alert('✅ Verification email resent! Check your inbox and spam.'); } } catch(e) { alert('Error: ' + e.message); }
}

// ── Payment Gate — shows as overlay ON TOP of dashboard ──
// Students can see the dashboard but everything is blurred/locked until they pay
function showPaymentGate() {
  showLoading(false);
  // Show dashboard first (blurred) so they can see what they'll unlock
  showDashboard();
  // Then show the payment overlay on top
  const email = encodeURIComponent(currentStudent?.email || '');
  const name  = encodeURIComponent(currentStudent?.name  || '');
  const overlay = document.createElement('div');
  overlay.id = 'payment-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:8888;display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit;';
  overlay.innerHTML = `
    <div style="position:absolute;inset:0;background:rgba(30,27,75,0.75);backdrop-filter:blur(6px);"></div>
    <div style="position:relative;background:#fff;border-radius:24px;padding:36px 28px;max-width:400px;width:100%;text-align:center;box-shadow:0 32px 80px rgba(0,0,0,.5);">
      <div style="font-size:3.5rem;margin-bottom:10px;">🔒</div>
      <h2 style="font-size:1.4rem;font-weight:900;color:#5b21b6;margin-bottom:8px;">Unlock Full Access</h2>
      <p style="font-size:.88rem;color:#4b5563;margin-bottom:6px;line-height:1.7;">
        Welcome, <strong>${currentStudent.name||'Student'}!</strong> Your account is ready.<br>
        Complete your <strong>$7 one-time payment</strong> to unlock everything.
      </p>
      <div style="background:#f3f4f6;border-radius:12px;padding:12px 16px;margin:14px 0;font-size:.82rem;color:#4b5563;line-height:1.8;">
        ✅ All 12 Chapters &amp; 32 Lessons<br>
        ✅ Highlights, Annotations &amp; Drawing<br>
        ✅ Submit Work to Teacher<br>
        ✅ Gateway to Heaven Board Game<br>
        ✅ Lifetime Access — One Time Only
      </div>
      <button onclick="goToPay()"
        style="width:100%;padding:14px;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:none;border-radius:12px;font-size:1.05rem;font-weight:800;cursor:pointer;margin-bottom:10px;box-shadow:0 4px 16px rgba(124,58,237,.4);">
        💳 Pay $7 — Unlock Everything
      </button>
      <button onclick="auth.signOut().then(function(){localStorage.removeItem('dtwd_student');window.location.replace('signin.html');})"
        style="width:100%;padding:11px;background:#f3f4f6;color:#374151;border:none;border-radius:12px;font-size:.9rem;font-weight:600;cursor:pointer;">
        ← Sign Out
      </button>
      <p style="font-size:.72rem;color:#9ca3af;margin-top:10px;">🔒 Secure payment · No subscription · Pay once, use forever</p>
    </div>`;
  document.body.appendChild(overlay);
}

function goToPay() {
  const email = encodeURIComponent(currentStudent?.email || '');
  const name  = encodeURIComponent(currentStudent?.name  || '');
  window.location.href = 'pricing.html?plan=student&email=' + email + '&name=' + name;
}

// ── Show Dashboard ──
function showDashboard() {
  // Remove payment overlay if it exists (after successful payment)
  const overlay = document.getElementById('payment-overlay');
  if (overlay) overlay.remove();
  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => { s.style.display = 'none'; s.classList.remove('active'); });
  const dash = document.getElementById('screen-dashboard');
  if (!dash) { showError('Dashboard not found. Please check student.html.'); return; }
  dash.style.display = 'block';
  dash.classList.add('active');

  const nb  = document.getElementById('student-name-badge');
  const wn  = document.getElementById('welcome-name');
  const wc  = document.getElementById('welcome-class');
  if (nb)  nb.textContent  = '👤 ' + (currentStudent.name || 'Student');
  if (wn)  wn.textContent  = 'Welcome, ' + (currentStudent.name || 'Student') + '! 🙏';
  if (wc)  wc.textContent  = currentStudent.classCode
    ? '📚 Class: ' + currentStudent.classCode + (currentStudent.teacherName ? ' — Teacher: ' + currentStudent.teacherName : '')
    : '📖 No class yet — go to My Class tab to join one';

  loadUserData(); updateWelcomeStats(); renderProgressTab(); renderSubmissionsTab(); renderFeedbackTab(); renderClassTab();
}

let userData = {};
function loadUserData() { try { const s = localStorage.getItem('dtwd_userdata'); if (s) userData = JSON.parse(s); } catch(e) { userData = {}; } }
function getUserKey(k) { return userData[k] || ''; }
function setUserData(k, v) { userData[k] = v; try { localStorage.setItem('dtwd_userdata', JSON.stringify(userData)); } catch(e) {} }

function updateWelcomeStats() {
  let done = 0;
  if (typeof APP_DATA !== 'undefined' && APP_DATA.lessons) {
    APP_DATA.lessons.forEach(l => { if (getUserKey('complete_prayer_' + l.id + '_after') === 'true') done++; });
  }
  const subs = getSubmissions();
  const wsC = document.getElementById('ws-completed');
  const wsS = document.getElementById('ws-submitted');
  const wsG = document.getElementById('ws-graded');
  if (wsC) wsC.textContent = done;
  if (wsS) wsS.textContent = subs.length;
  if (wsG) {
    if (currentStudent.uid) {
      db.collection('feedback').where('studentUid', '==', currentStudent.uid).get()
        .then(snap => { wsG.textContent = snap.size; }).catch(() => { wsG.textContent = 0; });
    } else wsG.textContent = 0;
  }
}

function renderProgressTab() {
  const container = document.getElementById('progress-list');
  if (!container || typeof APP_DATA === 'undefined') return;
  container.innerHTML = '';
  APP_DATA.chapters.forEach(ch => {
    const lessons = ch.lessons.map(lid => APP_DATA.lessons.find(l => l.id === lid)).filter(Boolean);
    const types = ['prayer_before','scripture','key_terms','treasure_chest','questions','sketch','greater_works','prayer_after'];
    let dp = 0, tp = lessons.length * types.length;
    lessons.forEach(lesson => { types.forEach(type => {
      const key = type === 'prayer_before' ? 'complete_prayer_' + lesson.id + '_before'
        : type === 'prayer_after'  ? 'complete_prayer_' + lesson.id + '_after'
        : type === 'scripture'     ? 'complete_scripture_' + lesson.id
        : type === 'key_terms'     ? 'complete_keyterms_'  + lesson.id
        : type === 'treasure_chest'? 'complete_treasure_'  + lesson.id
        : type === 'questions'     ? 'complete_questions_' + lesson.id
        : type === 'sketch'        ? 'complete_sketch_'    + lesson.id
        :                            'complete_gw_'        + lesson.id;
      if (getUserKey(key) === 'true') dp++;
    }); });
    const pct = tp > 0 ? Math.round((dp / tp) * 100) : 0, isDone = pct === 100;
    const dots = lessons.map(l =>
      '<div class="lesson-dot ' + (getUserKey('complete_prayer_' + l.id + '_after') === 'true' ? 'done' : getUserKey('complete_scripture_' + l.id) === 'true' ? 'partial' : 'empty') + '" title="Lesson ' + l.number + '">' + l.number + '</div>'
    ).join('');
    const el = document.createElement('div'); el.className = 'progress-chapter';
    el.innerHTML = '<div class="progress-chapter-header"><div class="progress-chapter-title">Chapter ' + ch.id + ': ' + ch.title + '</div><div class="progress-pct' + (isDone ? ' done' : '') + '">' + pct + '%' + (isDone ? ' ✅' : '') + '</div></div><div class="progress-bar-bg"><div class="progress-bar-fill' + (isDone ? ' done' : '') + '" style="width:' + pct + '%"></div></div><div class="progress-lessons">' + dots + '</div>';
    container.appendChild(el);
  });
}

function getSubmissions() { try { return JSON.parse(localStorage.getItem('dtwd_submissions') || '[]'); } catch(e) { return []; } }
function saveSubmissions(s) { localStorage.setItem('dtwd_submissions', JSON.stringify(s)); }

function renderSubmissionsTab() {
  const container = document.getElementById('submit-list');
  if (!container || typeof APP_DATA === 'undefined') return;
  container.innerHTML = '';
  const subs = getSubmissions();
  APP_DATA.chapters.forEach(ch => {
    const lessons = ch.lessons.map(lid => APP_DATA.lessons.find(l => l.id === lid)).filter(Boolean);
    const anyDone = lessons.some(l => getUserKey('complete_prayer_' + l.id + '_after') === 'true');
    const submitted = subs.some(s => s.chapterId === ch.id);
    let btnClass = 'btn-submit', btnText = '📬 Submit to Teacher';
    const statusText = lessons.filter(l => getUserKey('complete_prayer_' + l.id + '_after') === 'true').length + '/' + lessons.length + ' lessons completed';
    if (!currentStudent.classCode) { btnClass = 'btn-submit not-ready'; btnText = '🔗 Join a Class First'; }
    else if (submitted)            { btnClass = 'btn-submit submitted';  btnText = '✅ Submitted'; }
    else if (!anyDone)             { btnClass = 'btn-submit not-ready';  btnText = '🔒 Complete Lessons First'; }
    const el = document.createElement('div'); el.className = 'submit-item';
    el.innerHTML = '<div class="submit-item-info"><div class="submit-item-title">Chapter ' + ch.id + ': ' + ch.title + '</div><div class="submit-item-sub">' + statusText + (submitted ? ' • ✅ Submitted' : '') + '</div></div><button class="' + btnClass + '" onclick="openSubmitModal(' + ch.id + ')">' + btnText + '</button>';
    container.appendChild(el);
  });
}

function openSubmitModal(chapterId) {
  const subs = getSubmissions();
  if (subs.some(s => s.chapterId === chapterId)) return;
  if (!currentStudent.classCode) { alert('Please join a class first.'); return; }
  if (typeof APP_DATA === 'undefined') return;
  const ch = APP_DATA.chapters.find(c => c.id === chapterId); if (!ch) return;
  const lessons = ch.lessons.map(lid => APP_DATA.lessons.find(l => l.id === lid)).filter(Boolean);
  const done = lessons.filter(l => getUserKey('complete_prayer_' + l.id + '_after') === 'true').length;
  currentSubmitChapterId = chapterId;
  const chEl = document.getElementById('submit-modal-chapter');
  const sumEl = document.getElementById('submit-summary');
  if (chEl) chEl.textContent = 'Chapter ' + ch.id + ': ' + ch.title;
  if (sumEl) sumEl.innerHTML = '<strong>What will be submitted:</strong><br>✅ ' + done + ' of ' + lessons.length + ' lessons completed<br>📝 All answers and notes<br>🎨 Sketch pages<br>💎 Treasure chest notes<br><br><strong>Sending to:</strong> ' + (currentStudent.teacherName || 'Your Teacher') + ' (Class: ' + currentStudent.classCode + ')';
  const modal = document.getElementById('submit-modal'); if (modal) modal.classList.remove('hidden');
}

async function finalSubmit() {
  if (!currentSubmitChapterId || typeof APP_DATA === 'undefined') return;
  const ch = APP_DATA.chapters.find(c => c.id === currentSubmitChapterId); if (!ch) return;
  const msgEl = document.getElementById('submit-message');
  const message = msgEl ? msgEl.value.trim() : '';
  const lessons = ch.lessons.map(lid => APP_DATA.lessons.find(l => l.id === lid)).filter(Boolean);
  let answers = {}, treasureNotes = {};
  lessons.forEach(lesson => {
    try { answers[lesson.id]      = JSON.parse(getUserKey('questions_' + lesson.id) || '{}'); } catch(e) {}
    try { treasureNotes[lesson.id] = JSON.parse(getUserKey('treasure_'  + lesson.id) || '{}'); } catch(e) {}
  });
  const submission = {
    studentUid: currentStudent.uid, studentName: currentStudent.name,
    studentEmail: currentStudent.email, classCode: currentStudent.classCode,
    chapterId: currentSubmitChapterId,
    chapterTitle: 'Chapter ' + ch.id + ': ' + ch.title,
    message, answers, treasureNotes,
    personalApp: getUserKey('personal_' + currentSubmitChapterId),
    submittedAt: Date.now(), status: 'submitted'
  };
  try { await db.collection('submissions').add(submission); console.log('✅ Submission saved to Firestore'); }
  catch(e) { console.warn('Firestore submission failed:', e.message); }
  const subs = getSubmissions(); subs.push({ ...submission, id: 'sub_' + Date.now() }); saveSubmissions(subs);
  closeModal('submit-modal');
  const sm = document.getElementById('success-msg');
  const smModal = document.getElementById('success-modal');
  if (sm) sm.innerHTML = 'Chapter ' + ch.id + ' submitted to your teacher! 🙏<br><br>Your teacher will review and send feedback soon.';
  if (smModal) smModal.classList.remove('hidden');
  renderSubmissionsTab(); updateWelcomeStats();
}

async function renderFeedbackTab() {
  const container = document.getElementById('feedback-list'); if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:20px;color:#9ca3af;font-size:.88rem;">Loading feedback...</div>';
  try {
    if (!currentStudent.uid) throw new Error('no uid');
    const snap = await db.collection('feedback').where('studentUid', '==', currentStudent.uid).get();
    container.innerHTML = '';
    if (snap.empty) { container.innerHTML = '<div class="feedback-empty"><div>📬</div>No feedback yet. Submit a chapter to receive grades.</div>'; return; }
    snap.forEach(doc => {
      const fb = doc.data();
      const date = new Date(fb.gradedAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
      const el = document.createElement('div'); el.className = 'feedback-card';
      el.innerHTML = '<div class="feedback-header"><div class="feedback-chapter">' + fb.chapterTitle + '</div><div class="feedback-date">Graded ' + date + '</div></div><div class="grade-badge">📊 Grade: ' + fb.grade + '</div><div class="feedback-comment">"' + (fb.comment || 'No comment') + '"</div>';
      container.appendChild(el);
    });
  } catch(e) { container.innerHTML = '<div class="feedback-empty"><div>📬</div>No feedback yet. Submit a chapter to receive grades.</div>'; }
}

function renderClassTab() {
  const container = document.getElementById('class-info'); if (!container) return;
  if (!currentStudent.classCode) {
    container.innerHTML = '<div class="no-class-box"><div>🏫</div><p>Not enrolled in a class yet.</p><button style="margin-top:12px;padding:10px 24px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;" onclick="promptJoinClass()">+ Join a Class</button></div>';
    return;
  }
  const expiry = currentStudent.classExpiresAt
    ? new Date(currentStudent.classExpiresAt).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
    : 'Active';
  container.innerHTML = '<div class="class-code-big">' + currentStudent.classCode + '</div><div class="class-info-row"><span class="class-info-label">Teacher</span><span class="class-info-val">' + (currentStudent.teacherName || 'Your Teacher') + '</span></div><div class="class-info-row"><span class="class-info-label">Status</span><span class="class-info-val" style="color:#16a34a;">✅ Active</span></div><div class="class-info-row"><span class="class-info-label">Class Expires</span><span class="class-info-val">' + expiry + '</span></div><div class="class-info-row"><span class="class-info-label">Your Plan</span><span class="class-info-val">Student Access — $7 one time</span></div>';
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
    renderClassTab(); renderSubmissionsTab();
  } catch(e) { alert('Error: ' + e.message); }
}

function goToApp()    { window.location.href = 'index.html'; }
function logout()     { auth.signOut().then(() => { localStorage.removeItem('dtwd_student'); window.location.replace('signin.html'); }); }
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const tb = document.getElementById('tab-' + tab); const tc = document.getElementById('tab-content-' + tab);
  if (tb) tb.classList.add('active'); if (tc) tc.classList.add('active');
  if (tab === 'feedback') renderFeedbackTab();
}
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.add('hidden'); }
