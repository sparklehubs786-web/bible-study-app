// ===== TEACHER DASHBOARD — REAL FIREBASE =====
let currentTeacher = null;
let currentStudentId = null;
let selectedGrade = null;
let gradeStyle = 'letter';
let currentSubmissionId = null;
let allStudents = [];
let allSubmissions = [];

// ===== INIT — Firebase auth check =====
window.addEventListener('DOMContentLoaded', () => {
  showLoading(true);
  const loadTimeout = setTimeout(()=>{
    showLoading(false);
    showErrorPage('Connection timed out. Please <a href="auth.html">sign in again</a>.');
  }, 10000);

  auth.onAuthStateChanged(async user => {
    clearTimeout(loadTimeout);
    if (!user) { window.location.href = 'auth.html'; return; }
    if (!user.emailVerified) { window.location.href = 'auth.html'; return; }
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (!doc.exists) { window.location.href = 'auth.html'; return; }
      const data = doc.data();
      if (data.role !== 'teacher') { window.location.href = 'student.html'; return; }
      currentTeacher = {
        uid:        user.uid,
        name:       data.name || user.displayName || user.email.split('@')[0],
        email:      user.email,
        classCode:  data.classCode  || genCode(),
        plan:       data.plan       || 'medium',
        maxStudents:{small:15,medium:30,large:60,xl:100}[data.plan]||30,
        expiresAt:  data.expiresAt  || (Date.now()+(90*24*60*60*1000))
      };
      // Save class code back if new
      if (!data.classCode) {
        await db.collection('users').doc(user.uid).update({ classCode: currentTeacher.classCode });
      }
      showLoading(false);
      showDashboard();
    } catch(e) {
      showLoading(false);
      showErrorPage('Could not load your profile: ' + e.message);
    }
  });
});

function showLoading(on) {
  let el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.style.cssText = 'position:fixed;inset:0;background:linear-gradient(160deg,#1e1b4b,#5b21b6);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;color:#fff;font-family:inherit;gap:16px;';
    el.innerHTML = '<div style="font-size:3rem;">🙏</div><div style="font-size:1rem;font-weight:700;">Loading Teacher Dashboard...</div><div style="width:40px;height:40px;border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;"></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
    document.body.appendChild(el);
  }
  el.style.display = on ? 'flex' : 'none';
}

function showErrorPage(msg) {
  document.body.innerHTML = '<div style="min-height:100vh;background:linear-gradient(160deg,#1e1b4b,#5b21b6);display:flex;align-items:center;justify-content:center;padding:20px;font-family:sans-serif;"><div style="background:#fff;border-radius:20px;padding:32px;max-width:400px;width:100%;text-align:center;"><div style="font-size:2.5rem;margin-bottom:12px;">⚠️</div><p style="color:#4b5563;margin-bottom:20px;">'+msg+'</p><button onclick="location.reload()" style="padding:12px 24px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;margin-right:10px;">Try Again</button><button onclick="auth.signOut().then(()=>window.location.href=\'auth.html\')" style="padding:12px 24px;background:#f3f4f6;color:#374151;border:none;border-radius:10px;font-weight:600;cursor:pointer;">Logout</button></div></div>';
}

// ===== SHOW DASHBOARD =====
async function showDashboard() {
  document.getElementById('screen-login')    && (document.getElementById('screen-login').style.display    = 'none');
  document.getElementById('screen-dashboard').classList.add('active');
  document.getElementById('teacher-name').textContent    = currentTeacher.name;
  document.getElementById('class-code-badge').textContent = 'Class Code: ' + currentTeacher.classCode;
  await loadStudents();
  await loadSubmissions();
  updateStats();
  renderStudentList(allStudents);
}

// ===== LOAD STUDENTS from Firestore =====
async function loadStudents() {
  try {
    const snap = await db.collection('users')
      .where('classCode', '==', currentTeacher.classCode)
      .where('role', '==', 'student')
      .get();
    allStudents = snap.docs.map(d => ({
      id:    d.id,
      ...d.data(),
      submissions: []
    }));
  } catch(e) {
    console.error('Error loading students:', e);
    allStudents = [];
  }
}

// ===== LOAD SUBMISSIONS =====
async function loadSubmissions() {
  try {
    const snap = await db.collection('submissions')
      .where('classCode', '==', currentTeacher.classCode).get();
    allSubmissions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Attach submissions to students
    allStudents.forEach(student => {
      student.submissions = allSubmissions.filter(s => s.studentUid === student.uid);
    });
  } catch(e) {
    console.error('Error loading submissions:', e);
    allSubmissions = [];
  }
}

// ===== STATS =====
function updateStats() {
  const total  = allStudents.length;
  const subs   = allSubmissions.length;
  const graded = allSubmissions.filter(s => s.status === 'graded').length;
  const daysLeft = currentTeacher.expiresAt
    ? Math.max(0, Math.ceil((currentTeacher.expiresAt - Date.now()) / (24*60*60*1000)))
    : 90;
  document.getElementById('stat-students').textContent   = total;
  document.getElementById('stat-submissions').textContent = subs;
  document.getElementById('stat-graded').textContent     = graded;
  document.getElementById('stat-days').textContent       = daysLeft;
}

// ===== STUDENT LIST =====
function renderStudentList(students) {
  const container = document.getElementById('student-list');
  container.innerHTML = '';
  if (!students.length) {
    container.innerHTML = '<div style="text-align:center;color:#9ca3af;padding:30px;font-size:.88rem;">No students have joined your class yet.<br><br>Share your class code: <strong style="color:#7c3aed;">'+currentTeacher.classCode+'</strong></div>';
    return;
  }
  students.forEach(student => {
    const totalSubs   = student.submissions.length;
    const gradedSubs  = student.submissions.filter(s => s.status==='graded').length;
    const pendingSubs = totalSubs - gradedSubs;
    let badges = '';
    if (pendingSubs>0) badges += '<span class="badge badge-submitted">'+pendingSubs+' pending</span>';
    if (gradedSubs>0)  badges += '<span class="badge badge-graded">'+gradedSubs+' graded</span>';
    if (!totalSubs)    badges += '<span class="badge badge-pending">no submissions</span>';
    const el = document.createElement('div');
    el.className = 'student-item' + (currentStudentId===student.id?' active':'');
    el.onclick = () => selectStudent(student.id, el);
    el.innerHTML = '<div class="student-item-name">'+(student.name||student.email)+'</div><div class="student-item-sub">'+(student.email||'')+'</div><div class="student-item-badges">'+badges+'</div>';
    container.appendChild(el);
  });
}

function filterStudents(q) {
  const filtered = allStudents.filter(s => (s.name||'').toLowerCase().includes(q.toLowerCase()) || (s.email||'').toLowerCase().includes(q.toLowerCase()));
  renderStudentList(filtered);
}

// ===== SELECT STUDENT =====
function selectStudent(studentId, clickedEl) {
  currentStudentId = studentId;
  document.querySelectorAll('.student-item').forEach(el => el.classList.remove('active'));
  if (clickedEl) clickedEl.classList.add('active');
  const student = allStudents.find(s => s.id === studentId);
  if (!student) return;
  document.getElementById('detail-empty').classList.add('hidden');
  const dc = document.getElementById('detail-content');
  dc.classList.remove('hidden');
  const initials = (student.name||student.email||'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  const joinDate = student.joinedAt ? new Date(student.joinedAt).toLocaleDateString() : 'N/A';
  let subsHtml = '';
  if (!student.submissions.length) {
    subsHtml = '<div style="text-align:center;color:#9ca3af;padding:20px;font-size:.88rem;">This student has not submitted any chapters yet.</div>';
  } else {
    subsHtml = '<div class="submissions-list">' + student.submissions.map(sub => renderSubCard(sub, student)).join('') + '</div>';
  }
  dc.innerHTML =
    '<div class="detail-student-header"><div class="detail-avatar">'+initials+'</div><div><div class="detail-student-name">'+(student.name||'Student')+'</div><div class="detail-student-email">'+(student.email||'')+(joinDate!=='N/A'?' • Joined '+joinDate:'')+'</div></div></div>' +
    subsHtml;
}

function renderSubCard(sub, student) {
  const date = new Date(sub.submittedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const answersHtml = sub.answers
    ? Object.entries(sub.answers).flatMap(([lid,qa])=>Object.entries(qa).slice(0,2).map(([idx,ans])=>'<div class="answer-item"><div class="answer-q">Q'+(parseInt(idx)+1)+':</div><div class="answer-a">'+ans+'</div></div>')).slice(0,3).join('') + (Object.keys(sub.answers).length>0?'<div style="font-size:.75rem;color:#9ca3af;padding:4px 0;">See full submission for all answers</div>':'')
    : '';
  const gradeHtml = sub.status==='graded'
    ? '<div class="grade-display"><span class="grade-value">Grade: '+sub.grade+'</span>'+(sub.comment?'<span class="grade-comment-text">"'+sub.comment+'"</span>':'')+'</div>'
    : '';
  const actionHtml = sub.status==='submitted'
    ? '<button class="btn-grade" onclick="openGradeModal(\''+sub.id+'\',\''+student.id+'\',\''+sub.chapterTitle+'\')">✏️ Grade This Submission</button>'
    : '<button class="btn-regrade" onclick="openGradeModal(\''+sub.id+'\',\''+student.id+'\',\''+sub.chapterTitle+'\')">✏️ Edit Grade</button>';
  const statusColor = sub.status==='graded'?'#dcfce7':'#dbeafe';
  const statusText  = sub.status==='graded'?'✅ Graded':'📬 Awaiting Grade';
  return '<div class="submission-card"><div class="submission-header"><div><div class="submission-title">'+sub.chapterTitle+'</div><div class="submission-date">Submitted '+date+'</div></div><span style="font-size:.72rem;font-weight:700;padding:4px 10px;border-radius:20px;background:'+statusColor+';color:#1f2937;">'+statusText+'</span></div><div class="submission-answers">'+answersHtml+'</div>'+gradeHtml+'<div class="submission-actions">'+actionHtml+'</div></div>';
}

// ===== GRADE MODAL =====
function openGradeModal(submissionId, studentId, context) {
  currentSubmissionId = submissionId;
  currentStudentId    = studentId;
  selectedGrade       = null;
  document.getElementById('grade-context').textContent = context;
  document.getElementById('grade-comment').value = '';
  document.getElementById('grade-selected').classList.add('hidden');
  document.getElementById('grade-modal').classList.remove('hidden');
  document.querySelectorAll('.grade-opt').forEach(b => b.classList.remove('selected'));
  const student = allStudents.find(s => s.id===studentId);
  if (student) {
    const sub = allSubmissions.find(s => s.id===submissionId);
    if (sub && sub.grade) {
      selectedGrade = sub.grade;
      document.getElementById('grade-comment').value = sub.comment||'';
      showGradeSelected();
      setGradeStyle(sub.gradeStyle||'letter');
    }
  }
}

function closeGradeModal() { document.getElementById('grade-modal').classList.add('hidden'); currentSubmissionId=null; }

function setGradeStyle(style) {
  gradeStyle=style;
  document.getElementById('letter-grades').classList.toggle('hidden',style!=='letter');
  document.getElementById('ministry-grades').classList.toggle('hidden',style!=='ministry');
  document.getElementById('btn-letter').classList.toggle('active',style==='letter');
  document.getElementById('btn-ministry').classList.toggle('active',style==='ministry');
  selectedGrade=null;
  document.getElementById('grade-selected').classList.add('hidden');
  document.querySelectorAll('.grade-opt').forEach(b=>b.classList.remove('selected'));
}

function selectGrade(grade) {
  selectedGrade=grade;
  document.querySelectorAll('.grade-opt').forEach(b=>{b.classList.toggle('selected',b.textContent.trim()===grade||b.textContent.includes(grade));});
  showGradeSelected();
}
function showGradeSelected() { const el=document.getElementById('grade-selected');if(selectedGrade){el.textContent='Selected: '+selectedGrade;el.classList.remove('hidden');} }

async function submitGrade() {
  if (!selectedGrade) { alert('Please select a grade first.'); return; }
  const comment = document.getElementById('grade-comment').value.trim();
  const student = allStudents.find(s => s.id===currentStudentId);
  if (!student) return;
  const sub = allSubmissions.find(s => s.id===currentSubmissionId);
  if (!sub) return;
  const update = { status:'graded', grade:selectedGrade, gradeStyle, comment, gradedAt:Date.now() };
  try {
    // Update in Firestore
    await db.collection('submissions').doc(currentSubmissionId).update(update);
    // Save feedback for student to see in their dashboard
    await db.collection('feedback').add({
      studentUid:   sub.studentUid,
      teacherUid:   currentTeacher.uid,
      chapterId:    sub.chapterId,
      chapterTitle: sub.chapterTitle,
      grade:        selectedGrade,
      gradeStyle,
      comment,
      gradedAt:     Date.now()
    });
    // Update local
    Object.assign(sub, update);
    student.submissions = allSubmissions.filter(s => s.studentUid===student.uid);
  } catch(e) {
    console.error('Grade save error:', e);
    alert('Error saving grade: ' + e.message);
    return;
  }
  closeGradeModal();
  updateStats();
  renderStudentList(allStudents);
  selectStudent(currentStudentId, null);
}

// ===== AUTH =====
function loginWithGoogle() { window.location.href = 'auth.html'; }
function logout() { auth.signOut().then(() => { localStorage.removeItem('dtwd_teacher'); window.location.href = 'auth.html'; }); }
function genCode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='DTWD-';for(let i=0;i<6;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
