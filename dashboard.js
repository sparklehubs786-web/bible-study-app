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

  if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }

  // ── FIX: Increase timeout to 15s and don't show hard error — try localStorage first ──
  const authTimeout = setTimeout(() => {
    console.warn('Auth timeout after 15s — trying localStorage fallback');
    tryLocalStorageFallback();
  }, 15000);

  auth.onAuthStateChanged(async user => {
    clearTimeout(authTimeout);

    if (!user) {
      showLoading(false);
      window.location.replace('auth.html');
      return;
    }

    console.log('Auth fired for:', user.email);

    // ─── STEP 1: Check localStorage FIRST (instant, no network needed) ───
    const savedTeacher = localStorage.getItem('dtwd_teacher');
    if (savedTeacher) {
      try {
        const parsed = JSON.parse(savedTeacher);
        if (parsed.email === user.email) {
          if (parsed.status === 'pending_payment') {
            showLoading(false);
            window.location.href = 'pricing.html?plan=' + (parsed.plan || 'medium') +
              '&email=' + encodeURIComponent(user.email) +
              '&name=' + encodeURIComponent(parsed.name || '');
            return;
          }
          // ── FIX: status 'active' — show dashboard immediately from localStorage ──
          currentTeacher = parsed;
          currentTeacher.uid = user.uid;
          currentTeacher.email = user.email;
          showLoading(false);
          await showDashboard();
          updateFromFirestore(user.uid); // background sync — non-blocking
          return;
        }
      } catch(e) { console.warn('localStorage parse error:', e); }
    }

    // ─── STEP 2: No localStorage — try Firestore ───
    try {
      const snap = await Promise.race([
        db.collection('users').doc(user.uid).get(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 8000))
      ]);

      if (!snap.exists) {
        // New user hitting dashboard directly — create a session and show
        currentTeacher = {
          uid:user.uid, name:user.displayName||user.email.split('@')[0], email:user.email,
          classCode:genCode(), plan:'medium', maxStudents:30, status:'active',
          expiresAt:Date.now()+(90*24*60*60*1000)
        };
        localStorage.setItem('dtwd_teacher', JSON.stringify(currentTeacher));
        showLoading(false);
        await showDashboard();
        return;
      }

      const data = snap.data();
      console.log('Firestore role:', data.role, 'status:', data.status);

      if (data.role === 'student') {
        showLoading(false);
        window.location.replace('student.html');
        return;
      }

      if (data.status === 'pending_payment') {
        showLoading(false);
        window.location.href = 'pricing.html?plan=' + (data.plan||'medium') +
          '&email=' + encodeURIComponent(user.email) +
          '&name=' + encodeURIComponent(data.name||'');
        return;
      }

      currentTeacher = {
        uid: user.uid,
        name: data.name || user.displayName || user.email.split('@')[0],
        email: user.email,
        classCode: data.classCode || genCode(),
        plan: data.plan || 'medium',
        maxStudents: {small:15,medium:30,large:60,xl:100}[data.plan] || 30,
        status: data.status || 'active',
        expiresAt: data.expiresAt || (Date.now()+90*24*60*60*1000)
      };
      if (!data.classCode) db.collection('users').doc(user.uid).set({classCode:currentTeacher.classCode},{merge:true}).catch(()=>{});
      localStorage.setItem('dtwd_teacher', JSON.stringify(currentTeacher));
      showLoading(false);
      await showDashboard();

    } catch(fsErr) {
      console.warn('Firestore error/timeout:', fsErr.message);
      // ── FIX: Create minimal session instead of showing error page ──
      // The teacher is authenticated — give them a working session
      currentTeacher = {
        uid:user.uid, name:user.displayName||user.email.split('@')[0], email:user.email,
        classCode:genCode(), plan:'medium', maxStudents:30, status:'active',
        expiresAt:Date.now()+(90*24*60*60*1000)
      };
      localStorage.setItem('dtwd_teacher', JSON.stringify(currentTeacher));
      showLoading(false);
      await showDashboard();
    }
  });
});

// ── FIX: Fallback when auth never fires (rare edge case on slow connections) ──
function tryLocalStorageFallback() {
  const savedTeacher = localStorage.getItem('dtwd_teacher');
  if (savedTeacher) {
    try {
      const parsed = JSON.parse(savedTeacher);
      if (parsed.status === 'active' && parsed.name) {
        console.log('Using localStorage fallback for teacher:', parsed.email);
        currentTeacher = parsed;
        showLoading(false);
        showDashboard();
        return;
      }
    } catch(e) {}
  }
  // No usable localStorage — show error
  showLoading(false);
  showErrorPage('Loading timed out. Please refresh the page or check your internet connection.');
}

async function updateFromFirestore(uid) {
  try {
    const doc = await Promise.race([
      db.collection('users').doc(uid).get(),
      new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),5000))
    ]);
    if (doc.exists && doc.data().role==='teacher') {
      const data = doc.data();
      if (data.status==='pending_payment') {
        window.location.href = 'pricing.html?plan='+(data.plan||'medium')+'&email='+encodeURIComponent(data.email||'')+'&name='+encodeURIComponent(data.name||'');
        return;
      }
      currentTeacher.name        = data.name||currentTeacher.name;
      currentTeacher.classCode   = data.classCode||currentTeacher.classCode;
      currentTeacher.plan        = data.plan||currentTeacher.plan;
      currentTeacher.maxStudents = {small:15,medium:30,large:60,xl:100}[data.plan]||30;
      currentTeacher.expiresAt   = data.expiresAt||currentTeacher.expiresAt;
      currentTeacher.status      = data.status||'active';
      localStorage.setItem('dtwd_teacher', JSON.stringify(currentTeacher));
      const nameEl=document.getElementById('teacher-name');
      const codeEl=document.getElementById('class-code-badge');
      if (nameEl) nameEl.textContent=currentTeacher.name;
      if (codeEl) codeEl.textContent='Class Code: '+currentTeacher.classCode;
    }
  } catch(e) {}
}

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
  showLoading(false);
  document.body.innerHTML = '<div style="min-height:100vh;background:linear-gradient(160deg,#1e1b4b,#5b21b6);display:flex;align-items:center;justify-content:center;padding:20px;font-family:sans-serif;"><div style="background:#fff;border-radius:20px;padding:32px;max-width:420px;width:100%;text-align:center;"><div style="font-size:2.5rem;margin-bottom:12px;">⚠️</div><p style="color:#4b5563;margin-bottom:20px;line-height:1.6;">'+msg+'</p><button onclick="location.reload()" style="padding:12px 24px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;margin-right:8px;">Try Again</button><button onclick="auth.signOut().then(()=>window.location.replace(\'auth.html\'))" style="padding:12px 24px;background:#f3f4f6;color:#374151;border:none;border-radius:10px;font-weight:600;cursor:pointer;">Logout</button></div></div>';
}

async function showDashboard() {
  document.querySelectorAll('.screen').forEach(s=>{s.style.display='none';s.classList.remove('active');});
  const dash = document.getElementById('screen-dashboard');
  if (!dash) {
    showErrorPage('Dashboard element not found. Make sure dashboard.html has an element with id="screen-dashboard".');
    return;
  }
  dash.style.display = 'block';
  dash.classList.add('active');
  const nameEl=document.getElementById('teacher-name');
  const codeEl=document.getElementById('class-code-badge');
  if (nameEl) nameEl.textContent=currentTeacher.name||'Teacher';
  if (codeEl) codeEl.textContent='Class Code: '+(currentTeacher.classCode||'...');
  await loadStudentsAndSubmissions();
  updateStats();
  renderStudentList(allStudents);
}

async function loadStudentsAndSubmissions() {
  allStudents=[]; allSubmissions=[];
  if (!currentTeacher.classCode) return;
  try {
    const snap = await Promise.race([
      db.collection('users').where('classCode','==',currentTeacher.classCode).where('role','==','student').get(),
      new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),5000))
    ]);
    allStudents = snap.docs.map(d=>({id:d.id,...d.data(),submissions:[]}));
  } catch(e){console.warn('Load students error:',e.message);}
  try {
    const snap = await Promise.race([
      db.collection('submissions').where('classCode','==',currentTeacher.classCode).get(),
      new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),5000))
    ]);
    allSubmissions = snap.docs.map(d=>({id:d.id,...d.data()}));
    allStudents.forEach(s=>{s.submissions=allSubmissions.filter(sub=>sub.studentUid===s.uid||sub.studentUid===s.id);});
  } catch(e){console.warn('Load submissions error:',e.message);}
}

function updateStats() {
  const daysLeft=currentTeacher.expiresAt?Math.max(0,Math.ceil((currentTeacher.expiresAt-Date.now())/(24*60*60*1000))):90;
  const s1=document.getElementById('stat-students');
  const s2=document.getElementById('stat-submissions');
  const s3=document.getElementById('stat-graded');
  const s4=document.getElementById('stat-days');
  if(s1)s1.textContent=allStudents.length;
  if(s2)s2.textContent=allSubmissions.length;
  if(s3)s3.textContent=allSubmissions.filter(s=>s.status==='graded').length;
  if(s4)s4.textContent=daysLeft;
}

function renderStudentList(students) {
  const container=document.getElementById('student-list');
  if(!container)return;
  container.innerHTML='';
  if(!students.length){
    container.innerHTML='<div style="text-align:center;color:#9ca3af;padding:30px 16px;font-size:.88rem;">No students yet.<br><br>Share your class code:<br><strong style="font-size:1.1rem;color:#7c3aed;letter-spacing:2px;">'+(currentTeacher.classCode||'—')+'</strong></div>';
    return;
  }
  students.forEach(student=>{
    const totalSubs=student.submissions.length;
    const gradedSubs=student.submissions.filter(s=>s.status==='graded').length;
    const pendingSubs=totalSubs-gradedSubs;
    let badges='';
    if(pendingSubs>0)badges+='<span class="badge badge-submitted">'+pendingSubs+' pending</span>';
    if(gradedSubs>0)badges+='<span class="badge badge-graded">'+gradedSubs+' graded</span>';
    if(!totalSubs)badges+='<span class="badge badge-pending">no submissions</span>';
    const el=document.createElement('div');
    el.className='student-item'+(currentStudentId===student.id?' active':'');
    el.onclick=()=>selectStudent(student.id,el);
    el.innerHTML='<div class="student-item-name">'+(student.name||student.email||'Student')+'</div><div class="student-item-sub">'+(student.email||'')+'</div><div class="student-item-badges">'+badges+'</div>';
    container.appendChild(el);
  });
}

function filterStudents(q){
  renderStudentList(allStudents.filter(s=>(s.name||'').toLowerCase().includes(q.toLowerCase())||(s.email||'').toLowerCase().includes(q.toLowerCase())));
}

function selectStudent(studentId,clickedEl){
  currentStudentId=studentId;
  document.querySelectorAll('.student-item').forEach(el=>el.classList.remove('active'));
  if(clickedEl)clickedEl.classList.add('active');
  const student=allStudents.find(s=>s.id===studentId);
  if(!student)return;
  const emptyEl=document.getElementById('detail-empty');
  const dc=document.getElementById('detail-content');
  if(emptyEl)emptyEl.classList.add('hidden');
  if(!dc)return;
  dc.classList.remove('hidden');
  const initials=(student.name||student.email||'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  let subsHtml=student.submissions.length
    ?'<div class="submissions-list">'+student.submissions.map(sub=>renderSubCard(sub,student)).join('')+'</div>'
    :'<div style="text-align:center;color:#9ca3af;padding:20px;font-size:.88rem;">No submissions yet.</div>';
  dc.innerHTML='<div class="detail-student-header"><div class="detail-avatar">'+initials+'</div><div><div class="detail-student-name">'+(student.name||'Student')+'</div><div class="detail-student-email">'+(student.email||'')+'</div></div></div>'+subsHtml;
}

function renderSubCard(sub,student){
  const date=new Date(sub.submittedAt||Date.now()).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  let answersHtml='';
  if(sub.answers){Object.entries(sub.answers).forEach(([lid,qa])=>{if(typeof qa==='object'){Object.entries(qa).slice(0,2).forEach(([idx,ans])=>{if(ans)answersHtml+='<div class="answer-item"><div class="answer-q">Q'+(parseInt(idx)+1)+':</div><div class="answer-a">'+ans+'</div></div>';});}}); }
  const gradeHtml=sub.status==='graded'?'<div class="grade-display"><span class="grade-value">Grade: '+sub.grade+'</span>'+(sub.comment?'<span class="grade-comment-text"> "'+sub.comment+'"</span>':'')+'</div>':'';
  const actionHtml=sub.status==='submitted'?'<button class="btn-grade" onclick="openGradeModal(\''+sub.id+'\',\''+student.id+'\',\''+sub.chapterTitle+'\')">✏️ Grade</button>':'<button class="btn-regrade" onclick="openGradeModal(\''+sub.id+'\',\''+student.id+'\',\''+sub.chapterTitle+'\')">✏️ Edit Grade</button>';
  return '<div class="submission-card"><div class="submission-header"><div><div class="submission-title">'+(sub.chapterTitle||'Chapter')+'</div><div class="submission-date">Submitted '+date+'</div></div><span style="font-size:.72rem;font-weight:700;padding:4px 10px;border-radius:20px;background:'+(sub.status==='graded'?'#dcfce7':'#dbeafe')+';color:#1f2937;">'+(sub.status==='graded'?'✅ Graded':'📬 Pending')+'</span></div><div class="submission-answers">'+answersHtml+'</div>'+gradeHtml+'<div class="submission-actions">'+actionHtml+'</div></div>';
}

function openGradeModal(submissionId,studentId,context){
  currentSubmissionId=submissionId;currentStudentId=studentId;selectedGrade=null;
  const ctxEl=document.getElementById('grade-context');if(ctxEl)ctxEl.textContent=context||'';
  const commentEl=document.getElementById('grade-comment');if(commentEl)commentEl.value='';
  const selEl=document.getElementById('grade-selected');if(selEl)selEl.classList.add('hidden');
  const modalEl=document.getElementById('grade-modal');if(modalEl)modalEl.classList.remove('hidden');
  document.querySelectorAll('.grade-opt').forEach(b=>b.classList.remove('selected'));
  const sub=allSubmissions.find(s=>s.id===submissionId);
  if(sub&&sub.grade){selectedGrade=sub.grade;if(commentEl)commentEl.value=sub.comment||'';showGradeSelected();setGradeStyle(sub.gradeStyle||'letter');}
  else setGradeStyle('letter');
}
function closeGradeModal(){const el=document.getElementById('grade-modal');if(el)el.classList.add('hidden');currentSubmissionId=null;}
function setGradeStyle(style){
  gradeStyle=style;
  const lg=document.getElementById('letter-grades');const mg=document.getElementById('ministry-grades');
  const bl=document.getElementById('btn-letter');const bm=document.getElementById('btn-ministry');
  if(lg)lg.classList.toggle('hidden',style!=='letter');if(mg)mg.classList.toggle('hidden',style!=='ministry');
  if(bl)bl.classList.toggle('active',style==='letter');if(bm)bm.classList.toggle('active',style==='ministry');
  selectedGrade=null;const sel=document.getElementById('grade-selected');if(sel)sel.classList.add('hidden');
  document.querySelectorAll('.grade-opt').forEach(b=>b.classList.remove('selected'));
}
function selectGrade(grade){selectedGrade=grade;document.querySelectorAll('.grade-opt').forEach(b=>b.classList.toggle('selected',b.textContent.trim()===grade||b.textContent.includes(grade)));showGradeSelected();}
function showGradeSelected(){const el=document.getElementById('grade-selected');if(selectedGrade&&el){el.textContent='Selected: '+selectedGrade;el.classList.remove('hidden');}}

async function submitGrade(){
  if(!selectedGrade){alert('Please select a grade first.');return;}
  const commentEl=document.getElementById('grade-comment');
  const comment=commentEl?commentEl.value.trim():'';
  const sub=allSubmissions.find(s=>s.id===currentSubmissionId);if(!sub)return;
  const update={status:'graded',grade:selectedGrade,gradeStyle,comment,gradedAt:Date.now()};
  try{
    await db.collection('submissions').doc(currentSubmissionId).update(update);
    await db.collection('feedback').add({studentUid:sub.studentUid,teacherUid:currentTeacher.uid,chapterId:sub.chapterId,chapterTitle:sub.chapterTitle,grade:selectedGrade,gradeStyle,comment,gradedAt:Date.now()});
    Object.assign(sub,update);
    const student=allStudents.find(s=>s.id===currentStudentId);
    if(student)student.submissions=allSubmissions.filter(s=>s.studentUid===student.uid||s.studentUid===student.id);
  }catch(e){console.error('Grade save error:',e.message);alert('Error saving grade: '+e.message);return;}
  closeGradeModal();updateStats();renderStudentList(allStudents);selectStudent(currentStudentId,null);
}

function logout(){auth.signOut().then(()=>{localStorage.removeItem('dtwd_teacher');window.location.replace('auth.html');});}
function genCode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='DTWD-';for(let i=0;i<6;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
