// ===== TEACHER DASHBOARD =====
// Firebase config loaded from firebase-config.js

let currentTeacher = null;
let currentStudentId = null;
let selectedGrade = null;
let gradeStyle = 'letter';
let currentSubmissionId = null;
let allStudents = [];

// ===== DEMO DATA (replace with Firebase in production) =====
const DEMO_DATA = {
  teacher: { name: 'Teacher Demo', email: 'teacher@demo.com', classCode: 'DTWD-ABC123', plan: 'medium', maxStudents: 30, expiresAt: Date.now() + (75 * 24 * 60 * 60 * 1000) },
  students: [
    {
      id: 'student1', name: 'Mary Johnson', email: 'mary@demo.com', joinedAt: Date.now() - (5 * 24 * 60 * 60 * 1000),
      submissions: [
        { id: 'sub1', chapterId: 1, chapterTitle: "Chapter 1: Christ's Ministry", lessonNum: 1, lessonTitle: "Jesus Began His Ministry", submittedAt: Date.now() - (3 * 24 * 60 * 60 * 1000), status: 'graded', grade: 'A', gradeStyle: 'letter', comment: 'Excellent work Mary! Your answers show deep understanding of the scripture.', answers: { 0: 'The event took place in the synagogue in Nazareth.', 1: 'The man had a spirit of an unclean devil inside him.', 2: 'The unclean spirit said "Let us alone, what have we to do with thee?"' } },
        { id: 'sub2', chapterId: 1, chapterTitle: "Chapter 1: Christ's Ministry", lessonNum: 2, lessonTitle: "Christ Laid His Hands on Everyone", submittedAt: Date.now() - (1 * 24 * 60 * 60 * 1000), status: 'submitted', grade: null, comment: '', answers: { 0: 'The people had sicknesses, diseases and were possessed with devils.', 1: 'Jesus healed by laying hands on everyone and by casting out devils with a word.' } }
      ]
    },
    {
      id: 'student2', name: 'John Smith', email: 'john@demo.com', joinedAt: Date.now() - (4 * 24 * 60 * 60 * 1000),
      submissions: [
        { id: 'sub3', chapterId: 1, chapterTitle: "Chapter 1: Christ's Ministry", lessonNum: 1, lessonTitle: "Jesus Began His Ministry", submittedAt: Date.now() - (2 * 24 * 60 * 60 * 1000), status: 'graded', grade: 'Excellent', gradeStyle: 'ministry', comment: 'Great insight John! Keep pressing forward in your study.', answers: { 0: 'Nazareth synagogue', 1: 'A spirit of an unclean devil' } }
      ]
    },
    {
      id: 'student3', name: 'Sarah Williams', email: 'sarah@demo.com', joinedAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
      submissions: []
    },
    {
      id: 'student4', name: 'David Brown', email: 'david@demo.com', joinedAt: Date.now() - (1 * 24 * 60 * 60 * 1000),
      submissions: [
        { id: 'sub4', chapterId: 2, chapterTitle: "Chapter 2: Be Thou Clean", lessonNum: 3, lessonTitle: "I Will; Be Thou Clean", submittedAt: Date.now() - (12 * 60 * 60 * 1000), status: 'submitted', grade: null, comment: '', answers: { 0: 'The man had leprosy.', 1: 'He saw Jesus.', 2: 'He fell on his face before Jesus.' } }
      ]
    },
    {
      id: 'student5', name: 'Ruth Garcia', email: 'ruth@demo.com', joinedAt: Date.now() - (3 * 24 * 60 * 60 * 1000),
      submissions: [
        { id: 'sub5', chapterId: 1, chapterTitle: "Chapter 1: Christ's Ministry", lessonNum: 1, lessonTitle: "Jesus Began His Ministry", submittedAt: Date.now() - (4 * 24 * 60 * 60 * 1000), status: 'graded', grade: 'B', gradeStyle: 'letter', comment: 'Good work Ruth! Review question 3 again.', answers: { 0: 'The synagogue.', 1: 'Unclean spirit.' } }
      ]
    }
  ]
};

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  // Check if teacher is already logged in (from localStorage demo)
  const saved = localStorage.getItem('dtwd_teacher');
  if (saved) {
    currentTeacher = JSON.parse(saved);
    showDashboard();
  }
});

// ===== LOGIN =====
function loginWithGoogle() {
  // In production: use Firebase Google Auth
  // For demo: auto-login with demo teacher
  currentTeacher = DEMO_DATA.teacher;
  localStorage.setItem('dtwd_teacher', JSON.stringify(currentTeacher));
  showDashboard();
}

function logout() {
  localStorage.removeItem('dtwd_teacher');
  currentTeacher = null;
  document.getElementById('screen-dashboard').classList.remove('active');
  document.getElementById('screen-login').classList.add('active');
}

// ===== SHOW DASHBOARD =====
function showDashboard() {
  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('screen-dashboard').classList.add('active');

  // Set teacher info
  document.getElementById('teacher-name').textContent = currentTeacher.name;
  document.getElementById('class-code-badge').textContent = 'Class Code: ' + currentTeacher.classCode;

  // Load data
  allStudents = DEMO_DATA.students;
  updateStats();
  renderStudentList(allStudents);
}

// ===== STATS =====
function updateStats() {
  const totalStudents = allStudents.length;
  const totalSubmissions = allStudents.reduce((a, s) => a + s.submissions.length, 0);
  const totalGraded = allStudents.reduce((a, s) => a + s.submissions.filter(sub => sub.status === 'graded').length, 0);

  const daysLeft = currentTeacher.expiresAt
    ? Math.max(0, Math.ceil((currentTeacher.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : 90;

  document.getElementById('stat-students').textContent = totalStudents;
  document.getElementById('stat-submissions').textContent = totalSubmissions;
  document.getElementById('stat-graded').textContent = totalGraded;
  document.getElementById('stat-days').textContent = daysLeft;
}

// ===== STUDENT LIST =====
function renderStudentList(students) {
  const container = document.getElementById('student-list');
  container.innerHTML = '';

  if (students.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#9ca3af;padding:30px;font-size:0.88rem;">No students found</div>';
    return;
  }

  students.forEach(student => {
    const totalSubs = student.submissions.length;
    const gradedSubs = student.submissions.filter(s => s.status === 'graded').length;
    const pendingSubs = totalSubs - gradedSubs;

    const el = document.createElement('div');
    el.className = 'student-item' + (currentStudentId === student.id ? ' active' : '');
    el.onclick = () => selectStudent(student.id);

    let badges = '';
    if (pendingSubs > 0) badges += '<span class="badge badge-submitted">' + pendingSubs + ' pending</span>';
    if (gradedSubs > 0) badges += '<span class="badge badge-graded">' + gradedSubs + ' graded</span>';
    if (totalSubs === 0) badges += '<span class="badge badge-pending">no submissions</span>';

    el.innerHTML =
      '<div class="student-item-name">' + student.name + '</div>' +
      '<div class="student-item-sub">' + student.email + '</div>' +
      '<div class="student-item-badges">' + badges + '</div>';

    container.appendChild(el);
  });
}

function filterStudents(query) {
  const q = query.toLowerCase();
  const filtered = allStudents.filter(s =>
    s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  );
  renderStudentList(filtered);
}

// ===== SELECT STUDENT =====
function selectStudent(studentId) {
  currentStudentId = studentId;
  const student = allStudents.find(s => s.id === studentId);
  if (!student) return;

  // Update active state
  document.querySelectorAll('.student-item').forEach(el => el.classList.remove('active'));
  event.currentTarget.classList.add('active');

  // Show detail
  document.getElementById('detail-empty').classList.add('hidden');
  const detailContent = document.getElementById('detail-content');
  detailContent.classList.remove('hidden');

  const joinDate = new Date(student.joinedAt).toLocaleDateString();
  const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  let submissionsHtml = '';
  if (student.submissions.length === 0) {
    submissionsHtml = '<div style="text-align:center;color:#9ca3af;padding:30px;font-size:0.9rem;">This student has not submitted any chapters yet.</div>';
  } else {
    submissionsHtml = '<div class="submissions-list">' +
      student.submissions.map(sub => renderSubmissionCard(sub, student)).join('') +
      '</div>';
  }

  detailContent.innerHTML =
    '<div class="detail-student-header">' +
    '<div class="detail-avatar">' + initials + '</div>' +
    '<div>' +
    '<div class="detail-student-name">' + student.name + '</div>' +
    '<div class="detail-student-email">' + student.email + ' • Joined ' + joinDate + '</div>' +
    '</div>' +
    '</div>' +
    submissionsHtml;
}

function renderSubmissionCard(sub, student) {
  const date = new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const answersHtml = Object.entries(sub.answers).slice(0, 3).map(([idx, answer]) =>
    '<div class="answer-item">' +
    '<div class="answer-q">Q' + (parseInt(idx) + 1) + ':</div>' +
    '<div class="answer-a">' + answer + '</div>' +
    '</div>'
  ).join('') + (Object.keys(sub.answers).length > 3 ? '<div style="font-size:0.78rem;color:#9ca3af;padding:4px 0;">+ ' + (Object.keys(sub.answers).length - 3) + ' more answers...</div>' : '');

  const gradeHtml = sub.status === 'graded'
    ? '<div class="grade-display"><span class="grade-value">Grade: ' + sub.grade + '</span>' + (sub.comment ? '<span class="grade-comment-text">"' + sub.comment + '"</span>' : '') + '</div>'
    : '';

  const actionHtml = sub.status === 'submitted'
    ? '<button class="btn-grade" onclick="openGradeModal(\'' + sub.id + '\', \'' + student.id + '\', \'' + sub.chapterTitle + ' — Lesson ' + sub.lessonNum + '\')">✏️ Grade This Submission</button>'
    : '<button class="btn-regrade" onclick="openGradeModal(\'' + sub.id + '\', \'' + student.id + '\', \'' + sub.chapterTitle + ' — Lesson ' + sub.lessonNum + '\')">✏️ Edit Grade</button>';

  const statusColor = sub.status === 'graded' ? '#dcfce7' : '#dbeafe';
  const statusText = sub.status === 'graded' ? '✅ Graded' : '📬 Awaiting Grade';

  return '<div class="submission-card">' +
    '<div class="submission-header">' +
    '<div><div class="submission-title">' + sub.chapterTitle + '</div><div class="submission-date">Lesson ' + sub.lessonNum + ': ' + sub.lessonTitle + ' • Submitted ' + date + '</div></div>' +
    '<span style="font-size:0.72rem;font-weight:700;padding:4px 10px;border-radius:20px;background:' + statusColor + ';color:#1f2937;">' + statusText + '</span>' +
    '</div>' +
    '<div class="submission-answers">' + answersHtml + '</div>' +
    gradeHtml +
    '<div class="submission-actions">' + actionHtml + '</div>' +
    '</div>';
}

// ===== GRADE MODAL =====
function openGradeModal(submissionId, studentId, context) {
  currentSubmissionId = submissionId;
  currentStudentId = studentId;
  selectedGrade = null;

  document.getElementById('grade-context').textContent = context;
  document.getElementById('grade-comment').value = '';
  document.getElementById('grade-selected').classList.add('hidden');
  document.getElementById('grade-modal').classList.remove('hidden');

  // Reset selections
  document.querySelectorAll('.grade-opt').forEach(b => b.classList.remove('selected'));

  // Pre-fill if already graded
  const student = allStudents.find(s => s.id === studentId);
  if (student) {
    const sub = student.submissions.find(s => s.id === submissionId);
    if (sub && sub.grade) {
      selectedGrade = sub.grade;
      document.getElementById('grade-comment').value = sub.comment || '';
      showGradeSelected();
      if (sub.gradeStyle === 'ministry') setGradeStyle('ministry');
      else setGradeStyle('letter');
    }
  }
}

function closeGradeModal() {
  document.getElementById('grade-modal').classList.add('hidden');
  currentSubmissionId = null;
}

function setGradeStyle(style) {
  gradeStyle = style;
  document.getElementById('letter-grades').classList.toggle('hidden', style !== 'letter');
  document.getElementById('ministry-grades').classList.toggle('hidden', style !== 'ministry');
  document.getElementById('btn-letter').classList.toggle('active', style === 'letter');
  document.getElementById('btn-ministry').classList.toggle('active', style === 'ministry');
  selectedGrade = null;
  document.getElementById('grade-selected').classList.add('hidden');
  document.querySelectorAll('.grade-opt').forEach(b => b.classList.remove('selected'));
}

function selectGrade(grade) {
  selectedGrade = grade;
  document.querySelectorAll('.grade-opt').forEach(b => {
    b.classList.toggle('selected', b.textContent.trim() === grade || b.textContent.includes(grade));
  });
  showGradeSelected();
}

function showGradeSelected() {
  const el = document.getElementById('grade-selected');
  if (selectedGrade) {
    el.textContent = 'Selected: ' + selectedGrade;
    el.classList.remove('hidden');
  }
}

function submitGrade() {
  if (!selectedGrade) {
    alert('Please select a grade first.');
    return;
  }

  const comment = document.getElementById('grade-comment').value.trim();
  const student = allStudents.find(s => s.id === currentStudentId);
  if (!student) return;

  const sub = student.submissions.find(s => s.id === currentSubmissionId);
  if (!sub) return;

  // Update submission
  sub.status = 'graded';
  sub.grade = selectedGrade;
  sub.gradeStyle = gradeStyle;
  sub.comment = comment;
  sub.gradedAt = Date.now();

  // In production: save to Firebase
  // firebase.database().ref('submissions/' + currentSubmissionId).update({ grade: selectedGrade, comment, status: 'graded' });

  closeGradeModal();
  updateStats();
  renderStudentList(allStudents);
  selectStudent(currentStudentId);
}
