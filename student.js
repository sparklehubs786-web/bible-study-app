// ===== STUDENT DASHBOARD =====

let currentStudent = null;
let studentClass = null;
let currentSubmitChapterId = null;

// ===== DEMO DATA =====
const DEMO_STUDENT = {
  id: 'stu1',
  name: 'Student Demo',
  email: 'student@demo.com',
  classCode: 'DTWD-ABC123',
  teacherName: 'Teacher Demo',
  plan: 'student',
  purchasedAt: Date.now() - (7 * 24 * 60 * 60 * 1000),
  classExpiresAt: Date.now() + (60 * 24 * 60 * 60 * 1000)
};

const DEMO_FEEDBACK = [
  {
    id: 'fb1', chapterId: 1, chapterTitle: "Chapter 1: Christ's Ministry",
    lessonNum: 1, gradedAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
    grade: 'A', gradeStyle: 'letter',
    comment: 'Excellent work! Your answers show deep understanding of the scriptures. Keep pressing forward in your study. God bless you!'
  },
  {
    id: 'fb2', chapterId: 1, chapterTitle: "Chapter 1: Christ's Ministry",
    lessonNum: 2, gradedAt: Date.now() - (1 * 24 * 60 * 60 * 1000),
    grade: 'Excellent', gradeStyle: 'ministry',
    comment: 'Beautiful insight on how Christ laid His hands on everyone. Your sketch page was very creative!'
  }
];

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('dtwd_student');
  if (saved) {
    currentStudent = JSON.parse(saved);
    showDashboard();
  }
});

// ===== LOGIN =====
function loginGoogle() {
  // In production: Firebase Google Auth
  currentStudent = DEMO_STUDENT;
  localStorage.setItem('dtwd_student', JSON.stringify(currentStudent));

  // Check if student has a class
  if (currentStudent.classCode) {
    showDashboard();
  } else {
    showSetup();
  }
}

function loginEmail() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value.trim();
  if (!email || !pass) { alert('Please enter your email and password.'); return; }

  // Demo: accept any credentials
  currentStudent = { ...DEMO_STUDENT, email };
  localStorage.setItem('dtwd_student', JSON.stringify(currentStudent));

  if (currentStudent.classCode) showDashboard();
  else showSetup();
}

function logout() {
  localStorage.removeItem('dtwd_student');
  currentStudent = null;
  document.getElementById('screen-dashboard').classList.remove('active');
  document.getElementById('screen-login').classList.add('active');
}

// ===== SETUP =====
function showSetup() {
  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('screen-setup').classList.add('active');
}

function showJoinClass() {
  document.getElementById('join-class-form').classList.remove('hidden');
}

function skipClass() {
  showDashboard();
}

function joinClass() {
  const code = document.getElementById('class-code-input').value.trim().toUpperCase();
  if (!code || code.length < 6) { alert('Please enter a valid class code.'); return; }
  currentStudent.classCode = code;
  localStorage.setItem('dtwd_student', JSON.stringify(currentStudent));
  alert('✅ Successfully joined class with code: ' + code + '\n\nYour teacher can now see your submissions!');
  showDashboard();
}

// ===== SHOW DASHBOARD =====
function showDashboard() {
  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('screen-setup').classList.remove('active');
  document.getElementById('screen-dashboard').classList.add('active');

  // Set name badge
  const nameEl = document.getElementById('student-name-badge');
  nameEl.textContent = '👤 ' + currentStudent.name;

  // Welcome
  document.getElementById('welcome-name').textContent = 'Welcome, ' + currentStudent.name + '! 🙏';
  document.getElementById('welcome-class').textContent = currentStudent.classCode
    ? '📚 Class: ' + currentStudent.classCode + (currentStudent.teacherName ? ' — Teacher: ' + currentStudent.teacherName : '')
    : '📖 Studying independently';

  loadUserData();
  updateWelcomeStats();
  renderProgressTab();
  renderSubmissionsTab();
  renderFeedbackTab();
  renderClassTab();
}

// ===== LOCAL STORAGE =====
let userData = {};
function loadUserData() {
  try {
    const saved = localStorage.getItem('dtwd_userdata');
    if (saved) userData = JSON.parse(saved);
  } catch(e) { userData = {}; }
}

function getUserKey(key) { return userData[key] || ''; }

// ===== STATS =====
function updateWelcomeStats() {
  // Count completed lessons (prayer_after = lesson fully done)
  let completedLessons = 0;
  let submittedChapters = 0;
  let gradedChapters = 0;

  APP_DATA.lessons.forEach(lesson => {
    if (getUserKey('complete_prayer_' + lesson.id + '_after') === 'true') completedLessons++;
  });

  const submissions = getSubmissions();
  submittedChapters = submissions.length;
  gradedChapters = DEMO_FEEDBACK.length;

  document.getElementById('ws-completed').textContent = completedLessons;
  document.getElementById('ws-submitted').textContent = submittedChapters;
  document.getElementById('ws-graded').textContent = gradedChapters;
}

// ===== PROGRESS TAB =====
function renderProgressTab() {
  const container = document.getElementById('progress-list');
  container.innerHTML = '';

  APP_DATA.chapters.forEach(ch => {
    const lessons = ch.lessons.map(lid => APP_DATA.lessons.find(l => l.id === lid)).filter(Boolean);
    const totalPages = lessons.length * 8; // approx pages per lesson
    let donePages = 0;

    const pageTypes = ['prayer_before', 'scripture', 'key_terms', 'treasure_chest', 'questions', 'sketch', 'greater_works', 'prayer_after'];
    lessons.forEach(lesson => {
      pageTypes.forEach(type => {
        const key = type === 'prayer_before' ? 'complete_prayer_' + lesson.id + '_before'
          : type === 'prayer_after' ? 'complete_prayer_' + lesson.id + '_after'
          : type === 'scripture' ? 'complete_scripture_' + lesson.id
          : type === 'key_terms' ? 'complete_keyterms_' + lesson.id
          : type === 'treasure_chest' ? 'complete_treasure_' + lesson.id
          : type === 'questions' ? 'complete_questions_' + lesson.id
          : type === 'sketch' ? 'complete_sketch_' + lesson.id
          : type === 'greater_works' ? 'complete_gw_' + lesson.id
          : null;
        if (key && getUserKey(key) === 'true') donePages++;
      });
    });

    const pct = totalPages > 0 ? Math.round((donePages / totalPages) * 100) : 0;
    const isDone = pct === 100;

    // Lesson dots
    const lessonDots = lessons.map(lesson => {
      const lessonDone = getUserKey('complete_prayer_' + lesson.id + '_after') === 'true';
      const lessonStarted = getUserKey('complete_scripture_' + lesson.id) === 'true';
      const cls = lessonDone ? 'done' : lessonStarted ? 'partial' : 'empty';
      return '<div class="lesson-dot ' + cls + '" title="Lesson ' + lesson.number + ': ' + lesson.title + '">' +
        lesson.number + '</div>';
    }).join('');

    const el = document.createElement('div');
    el.className = 'progress-chapter';
    el.innerHTML =
      '<div class="progress-chapter-header">' +
      '<div class="progress-chapter-title">Chapter ' + ch.id + ': ' + ch.title + '</div>' +
      '<div class="progress-pct' + (isDone ? ' done' : '') + '">' + pct + '%' + (isDone ? ' ✅' : '') + '</div>' +
      '</div>' +
      '<div class="progress-bar-bg"><div class="progress-bar-fill' + (isDone ? ' done' : '') + '" style="width:' + pct + '%"></div></div>' +
      '<div class="progress-lessons">' + lessonDots + '</div>';

    container.appendChild(el);
  });
}

// ===== SUBMISSIONS TAB =====
function getSubmissions() {
  try {
    const saved = localStorage.getItem('dtwd_submissions');
    return saved ? JSON.parse(saved) : [];
  } catch(e) { return []; }
}

function saveSubmissions(subs) {
  localStorage.setItem('dtwd_submissions', JSON.stringify(subs));
}

function renderSubmissionsTab() {
  const container = document.getElementById('submit-list');
  container.innerHTML = '';
  const submissions = getSubmissions();

  APP_DATA.chapters.forEach(ch => {
    const lessons = ch.lessons.map(lid => APP_DATA.lessons.find(l => l.id === lid)).filter(Boolean);
    const allDone = lessons.every(lesson => getUserKey('complete_prayer_' + lesson.id + '_after') === 'true');
    const anyDone = lessons.some(lesson => getUserKey('complete_prayer_' + lesson.id + '_after') === 'true');
    const alreadySubmitted = submissions.some(s => s.chapterId === ch.id);

    let btnClass = 'btn-submit';
    let btnText = '📬 Submit to Teacher';
    let statusText = lessons.filter(l => getUserKey('complete_prayer_' + l.id + '_after') === 'true').length + '/' + lessons.length + ' lessons completed';

    if (!currentStudent.classCode) {
      btnClass = 'btn-submit not-ready';
      btnText = '🔗 Join a Class First';
    } else if (alreadySubmitted) {
      btnClass = 'btn-submit submitted';
      btnText = '✅ Submitted';
    } else if (!anyDone) {
      btnClass = 'btn-submit not-ready';
      btnText = '🔒 Complete Lessons First';
    }

    const el = document.createElement('div');
    el.className = 'submit-item';
    el.innerHTML =
      '<div class="submit-item-info">' +
      '<div class="submit-item-title">Chapter ' + ch.id + ': ' + ch.title + '</div>' +
      '<div class="submit-item-sub">' + statusText + (alreadySubmitted ? ' • ✅ Submitted to teacher' : '') + '</div>' +
      '</div>' +
      '<button class="' + btnClass + '" onclick="openSubmitModal(' + ch.id + ')">' + btnText + '</button>';

    container.appendChild(el);
  });
}

function openSubmitModal(chapterId) {
  const submissions = getSubmissions();
  if (submissions.some(s => s.chapterId === chapterId)) return;
  if (!currentStudent.classCode) { alert('Please join a class first to submit your work.'); return; }

  const chapter = APP_DATA.chapters.find(c => c.id === chapterId);
  const lessons = chapter.lessons.map(lid => APP_DATA.lessons.find(l => l.id === lid)).filter(Boolean);
  const completedCount = lessons.filter(l => getUserKey('complete_prayer_' + l.id + '_after') === 'true').length;

  currentSubmitChapterId = chapterId;

  document.getElementById('submit-modal-chapter').textContent = 'Chapter ' + chapter.id + ': ' + chapter.title;
  document.getElementById('submit-summary').innerHTML =
    '<strong>What will be submitted:</strong><br>' +
    '✅ ' + completedCount + ' of ' + lessons.length + ' lessons completed<br>' +
    '📝 All your answers and notes<br>' +
    '🎨 Your sketch pages<br>' +
    '💎 Your treasure chest notes<br>' +
    '📖 Your personal application<br><br>' +
    '<strong>Sending to:</strong> ' + (currentStudent.teacherName || 'Your Teacher') + ' (Class: ' + currentStudent.classCode + ')';

  document.getElementById('submit-modal').classList.remove('hidden');
}

function finalSubmit() {
  if (!currentSubmitChapterId) return;

  const chapter = APP_DATA.chapters.find(c => c.id === currentSubmitChapterId);
  const message = document.getElementById('submit-message').value.trim();
  const lessons  = chapter.lessons.map(lid => APP_DATA.lessons.find(l => l.id === lid)).filter(Boolean);

  // Build submission data
  const submission = {
    id: 'sub_' + Date.now(),
    chapterId: currentSubmitChapterId,
    chapterTitle: 'Chapter ' + chapter.id + ': ' + chapter.title,
    studentId: currentStudent.id,
    studentName: currentStudent.name,
    classCode: currentStudent.classCode,
    message,
    submittedAt: Date.now(),
    status: 'submitted',
    answers: {},
    treasureNotes: {},
    personalApp: getUserKey('personal_' + chapter.id)
  };

  // Collect all answers
  lessons.forEach(lesson => {
    const qKey = 'questions_' + lesson.id;
    try { submission.answers[lesson.id] = JSON.parse(getUserKey(qKey) || '{}'); } catch(e) {}
    const tKey = 'treasure_' + lesson.id;
    try { submission.treasureNotes[lesson.id] = JSON.parse(getUserKey(tKey) || '{}'); } catch(e) {}
  });

  // Save locally
  const submissions = getSubmissions();
  submissions.push(submission);
  saveSubmissions(submissions);

  // In production: save to Firebase
  // firebase.database().ref('submissions/' + submission.id).set(submission)

  closeModal('submit-modal');

  document.getElementById('success-msg').innerHTML =
    'Chapter ' + chapter.id + ' has been submitted to your teacher!<br><br>' +
    'Your teacher will review your work and provide feedback soon. 🙏';
  document.getElementById('success-modal').classList.remove('hidden');

  // Refresh tabs
  renderSubmissionsTab();
  updateWelcomeStats();
}

// ===== FEEDBACK TAB =====
function renderFeedbackTab() {
  const container = document.getElementById('feedback-list');
  container.innerHTML = '';

  if (DEMO_FEEDBACK.length === 0) {
    container.innerHTML =
      '<div class="feedback-empty"><div>📬</div>No feedback yet. Submit a chapter to your teacher to receive grades and comments.</div>';
    return;
  }

  DEMO_FEEDBACK.forEach(fb => {
    const date = new Date(fb.gradedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const el = document.createElement('div');
    el.className = 'feedback-card';
    el.innerHTML =
      '<div class="feedback-header">' +
      '<div class="feedback-chapter">' + fb.chapterTitle + ' — Lesson ' + fb.lessonNum + '</div>' +
      '<div class="feedback-date">Graded ' + date + '</div>' +
      '</div>' +
      '<div class="grade-badge">📊 Grade: ' + fb.grade + '</div>' +
      '<div class="feedback-comment">"' + fb.comment + '"</div>';
    container.appendChild(el);
  });
}

// ===== CLASS TAB =====
function renderClassTab() {
  const container = document.getElementById('class-info');

  if (!currentStudent.classCode) {
    container.innerHTML =
      '<div class="no-class-box"><div>🏫</div>' +
      '<p>You are not enrolled in a class yet.</p>' +
      '<button class="btn-login" style="margin-top:12px;width:auto;padding:10px 24px;" onclick="promptJoinClass()">+ Join a Class</button>' +
      '</div>';
    return;
  }

  const expiry = currentStudent.classExpiresAt
    ? new Date(currentStudent.classExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'N/A';
  const daysLeft = currentStudent.classExpiresAt
    ? Math.max(0, Math.ceil((currentStudent.classExpiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : '—';

  container.innerHTML =
    '<div class="class-code-big">' + currentStudent.classCode + '</div>' +
    '<div class="class-info-row"><span class="class-info-label">Teacher</span><span class="class-info-val">' + (currentStudent.teacherName || 'Your Teacher') + '</span></div>' +
    '<div class="class-info-row"><span class="class-info-label">Status</span><span class="class-info-val" style="color:#16a34a;">✅ Active</span></div>' +
    '<div class="class-info-row"><span class="class-info-label">Class Expires</span><span class="class-info-val">' + expiry + '</span></div>' +
    '<div class="class-info-row"><span class="class-info-label">Days Remaining</span><span class="class-info-val">' + daysLeft + ' days</span></div>' +
    '<div class="class-info-row"><span class="class-info-label">Your Plan</span><span class="class-info-val">Student Access — $7 one time</span></div>';
}

function promptJoinClass() {
  const code = prompt('Enter your class code from your teacher:');
  if (code && code.trim().length > 4) {
    currentStudent.classCode = code.trim().toUpperCase();
    localStorage.setItem('dtwd_student', JSON.stringify(currentStudent));
    renderClassTab();
    renderSubmissionsTab();
    updateWelcomeStats();
    alert('✅ Joined class: ' + currentStudent.classCode);
  }
}

// ===== NAVIGATION =====
function goToApp() { window.location.href = 'index.html'; }

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('tab-content-' + tab).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}
