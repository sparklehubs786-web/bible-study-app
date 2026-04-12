// ===== TEACHER DASHBOARD — REAL FIREBASE =====
let currentTeacher = null;
let currentStudentId = null;
let selectedGrade = null;
let gradeStyle = 'letter';
let currentSubmissionId = null;
let allStudents = [];
let allSubmissions = [];

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  showLoading(true);

  // Add spin animation style
  if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }

  auth.onAuthStateChanged(async user => {
    if (!user) { window.location.replace('auth.html'); return; }

    // Don't require email verification for teacher — they verified to create account
    // Load from localStorage FIRST (instant)
    const savedTeacher = localStorage.getItem('dtwd_teacher');
    if (savedTeacher) {
      try {
        currentTeacher = JSON.parse(savedTeacher);
        currentTeacher.uid = user.uid;
        currentTeacher.email = user.email;
        showLoading(false);
        await showDashboard();
        // Update from Firestore in background silently
        updateFromFirestore(user.uid);
        return;
      } catch(e) { console.warn('localStorage parse error:', e); }
    }

    // No localStorage — try Firestore
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (!doc.exists) {
        // No profile anywhere — create minimal teacher profile
        currentTeacher = {
          uid: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          classCode: genCode(),
          plan: 'medium',
          maxStudents: 30,
          expiresAt: Date.now() + (90*24*60*60*1000)
        };
        localStorage.setItem('dtwd_teacher', JSON.stringify(currentTeacher));
        showLoading(false);
        await showDashboard();
        return;
      }

      const data = doc.data();

      // If Firestore says student, check localStorage to see if mismatch
      if (data.role === 'student') {
        // Could be wrong — check if there's a teacher session in localStorage
        if (savedTeacher) {
          const t = JSON.parse(savedTeacher);
          if (t.email === user.email) {
            // Trust localStorage over Firestore role
            currentTeacher = t;
            currentTeacher.uid = user.uid;
            showLoading(false);
            await showDashboard();
            return;
          }
        }
        window.location.replace('student.html');
        return;
      }

      currentTeacher = {
        uid:        user.uid,
        name:       data.name || user.displayName || user.email.split('@')[0],
        email:      user.email,
        classCode:  data.classCode || genCode(),
        plan:       data.plan || 'medium',
        maxStudents: {small:15,medium:30,large:60,xl:100}[data.plan] || 30,
        expiresAt:  data.expiresAt || (Date.now()+(90*24*60*60*1000))
      };
      if (!data.classCode) {
        db.collection('users').doc(user.uid).update({ classCode: currentTeacher.classCode }).catch(()=>{});
      }
      localStorage.setItem('dtwd_teacher', JSON.stringify(currentTeacher));
      showLoading(false);
      await showDashboard();

    } catch(fsErr) {
      console.warn('Firestore unavailable:', fsErr.message);
      // Create minimal session from auth data
      currentTeacher = {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        classCode: genCode(),
        plan: 'medium',
        maxStudents: 30,
        expiresAt: Date.now() + (90*24*60*60*1000)
      };
      localStorage.setItem('dtwd_teacher', JSON.stringify(currentTeacher));
      showLoading(false);
      await showDashboard();
    }
  });
});

// Update data from Firestore in background without blocking UI
async function updateFromFirestore(uid) {
  try {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists && doc.data().role === 'teacher') {
      const data = doc.data();
      currentTeacher.name       = data.name || currentTeacher.name;
      currentTeacher.classCode  = data.classCode || currentTeacher.classCode;
      currentTeacher.plan       = data.plan || currentTeacher.plan;
      currentTeacher.maxStudents = {small:15,medium:30,large:60,xl:100}[data.plan] || 30;
      currentTeacher.expiresAt  = data.expiresAt || currentTeacher.expiresAt;
      localStorage.setItem('dtwd_teacher', JSON.stringify(currentTeacher));
      // Refresh header silently
      const nameEl = document.getElementById('teacher-name');
      const codeEl = document.getElementById('class-code-badge');
      if (nameEl) nameEl.textContent = currentTeacher.name;
      if (codeEl) codeEl.textContent = 'Class Code: ' + currentTeacher.classCode;
    }
  } catch(e) { /* silent fail */ }
}

// ===== LOADING =====
function showLoading(on) {
  let el = document.getElementById('loading-overlay');
  if (!el && on) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.style.cssText = 'position:fixed;inset:0;background:linear-gradient(160deg,#1e1b4b,#5b21b6);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;color:#fff;font-family:inherit;gap:16px;';
    el.innerHTML = '<div style="font-size:3rem;">🙏</div><div style="font-size:1rem;font-weight:700;">Loading Teacher Dashboard...</div><div style="width:40px;height:40px;border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;"></div>';
    document.body.appendChild(el);
  }
  if (el) el.style.display = on ? 'flex' : 'none';
}

function showErrorPage(msg) {
  document.body.innerHTML = '<div style="min-height:100vh;background:linear-gradient(160deg,#1e1b4b,#5b21b6);display:flex;align-items:center;justify-content:center;padding:20px;font-family:sans-serif;"><div style="background:#fff;border-radius:20px;padding:32px;max-width:420px;width:100%;text-align:center;"><div style="font-size:2.5rem;margin-bottom:12px;">⚠️</div><p style="color:#4b5563;margin-bottom:20px;line-height:1.6;">'+msg+'</p><button onclick="location.reload()" style="padding:12px 24px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;margin-right:8px;">Try Again</button><button onclick="auth.signOut().then(()=>window.location.replace(\'auth.html\'))" style="padding:12px 24px;background:#f3f4f6;color:#374151;border:none;border-radius:10px;font-weight:600;cursor:pointer;">Logout</button></div></div>';
}

// ===== SHOW DASHBOARD =====
async function showDashboard() {
  document.querySelectorAll('.screen').forEach(s => { s.style.display='none'; s.classList.remove('active'); });
  const dash = document.getElementById('screen-dashboard');
  if (dash) { dash.style.display='block'; dash.classList.add('active'); }

  document.getElementById('teacher-name').textContent    = currentTeacher.name || 'Teacher';
  document.getElementById('class-code-badge').textContent = 'Class Code: ' + (currentTeacher.classCode || '...');

  await loadStudentsAndSubmissions();
  updateStats();
  renderStudentList(allStudents);
}

// ===== LOAD DATA =====
async function loadStudentsAndSubmissions() {
  allStudents = [];
  allSubmissions = [];
  if (!currentTeacher.classCode) return;

  try {
    // Load students
    const snap = await db.collection('users')
      .where('classCode', '==', currentTeacher.classCode)
      .where('role', '==', 'student')
      .get();
    allStudents = snap.docs.map(d => ({ id:d.id, ...d.data(), submissions:[] }));
  } catch(e) { console.warn('Load students error:', e.message); }

  try {
    // Load submissions
    const snap = await db.collection('submissions')
      .where('classCode', '==', currentTeacher.classCode)
      .get();
    allSubmissions = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    allStudents.forEach(s => {
      s.submissions = allSubmissions.filter(sub => sub.studentUid === s.uid || sub.studentUid === s.id);
    });
  } catch(e) { console.warn('Load submissions error:', e.message); }
}

// ===== STATS =====
function updateStats() {
  const daysLeft = currentTeacher.expiresAt
    ? Math.max(0, Math.ceil((currentTeacher.expiresAt - Date.now()) / (24*60*60*1000)))
    : 90;
  document.getElementById('stat-students').textContent   = allStudents.length;
  document.getElementById('stat-submissions').textContent = allSubmissions.length;
  document.getElementById('stat-graded').textContent     = allSubmissions.filter(s=>s.status==='graded').length;
  document.getElementById('stat-days').textContent       = daysLeft;
}

// ===== STUDENT LIST =====
function renderStudentList(students) {
  const container = document.getElementById('student-list');
  container.innerHTML = '';
  if (!students.length) {
    container.innerHTML = '<div style="text-align:center;color:#9ca3af;padding:30px 16px;font-size:.88rem;">No students have joined your class yet.<br><br>Share your class code with students:<br><strong style="font-size:1.1rem;color:#7c3aed;letter-spacing:2px;">'+(currentTeacher.classCode||'—')+'</strong></div>';
    return;
  }
  students.forEach(student => {
    const totalSubs   = student.submissions.length;
    const gradedSubs  = student.submissions.filter(s=>s.status==='graded').length;
    const pendingSubs = totalSubs - gradedSubs;
    let badges = '';
    if (pendingSubs>0) badges += '<span class="badge badge-submitted">'+pendingSubs+' pending</span>';
    if (gradedSubs>0)  badges += '<span class="badge badge-graded">'+gradedSubs+' graded</span>';
    if (!totalSubs)    badges += '<span class="badge badge-pending">no submissions</span>';
    const el = document.createElement('div');
    el.className = 'student-item' + (currentStudentId===student.id?' active':'');
    el.onclick = (e) => selectStudent(student.id, el);
    el.innerHTML = '<div class="student-item-name">'+(student.name||student.email||'Student')+'</div><div class="student-item-sub">'+(student.email||'')+'</div><div class="student-item-badges">'+badges+'</div>';
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
  let subsHtml = '';
  if (!student.submissions.length) {
    subsHtml = '<div style="text-align:center;color:#9ca3af;padding:20px;font-size:.88rem;">No submissions yet from this student.</div>';
  } else {
    subsHtml = '<div class="submissions-list">' + student.submissions.map(sub => renderSubCard(sub, student)).join('') + '</div>';
  }
  dc.innerHTML =
    '<div class="detail-student-header"><div class="detail-avatar">'+initials+'</div><div><div class="detail-student-name">'+(student.name||'Student')+'</div><div class="detail-student-email">'+(student.email||'')+'</div></div></div>' +
    subsHtml;
}

function renderSubCard(sub, student) {
  const date = new Date(sub.submittedAt||Date.now()).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  let answersHtml = '';
  if (sub.answers) {
    Object.entries(sub.answers).forEach(([lid,qa]) => {
      if (typeof qa === 'object') {
        Object.entries(qa).slice(0,2).forEach(([idx,ans]) => {
          if (ans) answersHtml += '<div class="answer-item"><div class="answer-q">Q'+(parseInt(idx)+1)+':</div><div class="answer-a">'+ans+'</div></div>';
        });
      }
    });
  }
  const gradeHtml = sub.status==='graded'
    ? '<div class="grade-display"><span class="grade-value">Grade: '+sub.grade+'</span>'+(sub.comment?'<span class="grade-comment-text"> "'+sub.comment+'"</span>':'')+'</div>'
    : '';
  const actionHtml = sub.status==='submitted'
    ? '<button class="btn-grade" onclick="openGradeModal(\''+sub.id+'\',\''+student.id+'\',\''+sub.chapterTitle+'\')">✏️ Grade</button>'
    : '<button class="btn-regrade" onclick="openGradeModal(\''+sub.id+'\',\''+student.id+'\',\''+sub.chapterTitle+'\')">✏️ Edit Grade</button>';
  return '<div class="submission-card"><div class="submission-header"><div><div class="submission-title">'+(sub.chapterTitle||'Chapter')+'</div><div class="submission-date">Submitted '+date+'</div></div><span style="font-size:.72rem;font-weight:700;padding:4px 10px;border-radius:20px;background:'+(sub.status==='graded'?'#dcfce7':'#dbeafe')+';color:#1f2937;">'+(sub.status==='graded'?'✅ Graded':'📬 Pending')+'</span></div><div class="submission-answers">'+answersHtml+'</div>'+gradeHtml+'<div class="submission-actions">'+actionHtml+'</div></div>';
}

// ===== GRADE MODAL =====
function openGradeModal(submissionId, studentId, context) {
  currentSubmissionId=submissionId; currentStudentId=studentId; selectedGrade=null;
  document.getElementById('grade-context').textContent=context||'';
  document.getElementById('grade-comment').value='';
  document.getElementById('grade-selected').classList.add('hidden');
  document.getElementById('grade-modal').classList.remove('hidden');
  document.querySelectorAll('.grade-opt').forEach(b=>b.classList.remove('selected'));
  const sub=allSubmissions.find(s=>s.id===submissionId);
  if(sub&&sub.grade){selectedGrade=sub.grade;document.getElementById('grade-comment').value=sub.comment||'';showGradeSelected();setGradeStyle(sub.gradeStyle||'letter');}
  else setGradeStyle('letter');
}
function closeGradeModal(){document.getElementById('grade-modal').classList.add('hidden');currentSubmissionId=null;}
function setGradeStyle(style){gradeStyle=style;document.getElementById('letter-grades').classList.toggle('hidden',style!=='letter');document.getElementById('ministry-grades').classList.toggle('hidden',style!=='ministry');document.getElementById('btn-letter').classList.toggle('active',style==='letter');document.getElementById('btn-ministry').classList.toggle('active',style==='ministry');selectedGrade=null;document.getElementById('grade-selected').classList.add('hidden');document.querySelectorAll('.grade-opt').forEach(b=>b.classList.remove('selected'));}
function selectGrade(grade){selectedGrade=grade;document.querySelectorAll('.grade-opt').forEach(b=>{b.classList.toggle('selected',b.textContent.trim()===grade||b.textContent.includes(grade));});showGradeSelected();}
function showGradeSelected(){const el=document.getElementById('grade-selected');if(selectedGrade){el.textContent='Selected: '+selectedGrade;el.classList.remove('hidden');}}

async function submitGrade() {
  if(!selectedGrade){alert('Please select a grade first.');return;}
  const comment=document.getElementById('grade-comment').value.trim();
  const sub=allSubmissions.find(s=>s.id===currentSubmissionId);
  if(!sub)return;
  const update={status:'graded',grade:selectedGrade,gradeStyle,comment,gradedAt:Date.now()};
  try{
    await db.collection('submissions').doc(currentSubmissionId).update(update);
    await db.collection('feedback').add({
      studentUid:sub.studentUid,teacherUid:currentTeacher.uid,
      chapterId:sub.chapterId,chapterTitle:sub.chapterTitle,
      grade:selectedGrade,gradeStyle,comment,gradedAt:Date.now()
    });
    Object.assign(sub,update);
    const student=allStudents.find(s=>s.id===currentStudentId);
    if(student)student.submissions=allSubmissions.filter(s=>s.studentUid===student.uid||s.studentUid===student.id);
  }catch(e){console.error('Grade save error:',e.message);alert('Error saving grade: '+e.message);return;}
  closeGradeModal();updateStats();renderStudentList(allStudents);selectStudent(currentStudentId,null);
}

// ===== AUTH =====
function loginWithGoogle(){window.location.replace('auth.html');}
function logout(){auth.signOut().then(()=>{localStorage.removeItem('dtwd_teacher');window.location.replace('auth.html');});}
function genCode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='DTWD-';for(let i=0;i<6;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
