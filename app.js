// ===== STATE =====
let currentChapter = null;
let currentLesson = null;
let currentPageIndex = 0;
let lessonPages = [];
let annotationMode = null;
let sketchCanvas = null;
let sketchCtx = null;
let isDrawing = false;
let lastX = 0, lastY = 0;
let drawColor = '#000000';
let drawSize = 4;
let drawTool = 'pen';
let userData = {};
let speechSynth = window.speechSynthesis;
let isSpeaking = false;
let currentUtterance = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  renderChapterList();
  createAnnotationToolbar();
  createSaveIndicator();
});

function createSaveIndicator() {
  const el = document.createElement('div');
  el.className = 'save-indicator';
  el.id = 'save-indicator';
  el.textContent = '✓ Saved';
  document.body.appendChild(el);
}

function showSaved() {
  const el = document.getElementById('save-indicator');
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1500);
}

// ===== USER DATA (localStorage) =====
function loadUserData() {
  try {
    const saved = localStorage.getItem('dtwd_userdata');
    if (saved) userData = JSON.parse(saved);
  } catch(e) { userData = {}; }
}

function saveUserData() {
  try {
    localStorage.setItem('dtwd_userdata', JSON.stringify(userData));
    showSaved();
  } catch(e) {}
}

function getUserKey(key) { return userData[key] || ''; }

function setUserData(key, value) {
  userData[key] = value;
  saveUserData();
}

// ===== NAVIGATION =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  stopAudio();
}

function goHome() {
  showScreen('screen-home');
}

function goToSelectBook() {
  showScreen('screen-select-book');
}

function goToSelectLessonCurrent() {
  if (currentChapter !== null) goToSelectLesson(currentChapter);
}

function renderChapterList() {
  const container = document.getElementById('chapter-items');
  container.innerHTML = '';
  APP_DATA.chapters.forEach(ch => {
    const el = document.createElement('div');
    el.className = 'list-item';
    el.textContent = `Chapter ${ch.id}: ${ch.title}`;
    el.onclick = () => goToSelectLesson(ch.id);
    container.appendChild(el);
  });
}

function goToSelectLesson(chapterId, special) {
  currentChapter = chapterId;
  const screen = document.getElementById('screen-select-lesson');
  const titleEl = document.getElementById('lesson-screen-title');
  const itemsEl = document.getElementById('lesson-items');
  const chBtn = document.getElementById('nav-chapter-btn');
  itemsEl.innerHTML = '';

  if (special === 'pretest') {
    titleEl.textContent = 'Pre-Test';
    chBtn.textContent = 'Home';
    const item = document.createElement('div');
    item.className = 'list-item';
    item.textContent = 'Start Pre-Test';
    item.onclick = () => openTest('pre');
    itemsEl.appendChild(item);
  } else if (special === 'posttest') {
    titleEl.textContent = 'Post-Test';
    chBtn.textContent = 'Home';
    const item = document.createElement('div');
    item.className = 'list-item';
    item.textContent = 'Start Post-Test';
    item.onclick = () => openTest('post');
    itemsEl.appendChild(item);
  } else {
    const chapter = APP_DATA.chapters.find(c => c.id === chapterId);
    titleEl.textContent = `Chapter ${chapter.id}: ${chapter.title}`;
    chBtn.textContent = `Chapter ${chapter.id}`;

    chapter.lessons.forEach((lessonId, idx) => {
      const lesson = APP_DATA.lessons.find(l => l.id === lessonId);
      const el = document.createElement('div');
      el.className = 'list-item-sub';
      el.innerHTML = `<div>Lesson ${lesson.number}: ${lesson.title}</div><div class="sub-theme">Theme: ${lesson.theme}</div>`;
      el.onclick = () => openLessonIntro(lessonId);
      itemsEl.appendChild(el);
    });
  }
  showScreen('screen-select-lesson');
}

// ===== LESSON INTRO =====
function openLessonIntro(lessonId) {
  currentLesson = lessonId;
  const lesson = APP_DATA.lessons.find(l => l.id === lessonId);
  const chapter = APP_DATA.chapters.find(c => c.id === lesson.chapterId);

  document.getElementById('intro-chapter-title').textContent = chapter.title.toUpperCase();
  document.getElementById('intro-lesson-ref').textContent = `Lesson ${lesson.number}: ${lesson.passage}`;
  document.getElementById('intro-theme').textContent = `Memorize the Theme: ${lesson.theme}`;
  document.getElementById('nav-chapter-btn2').textContent = `Chapter ${chapter.id}`;
  document.getElementById('nav-lesson-btn2').textContent = `Lesson ${lesson.number}`;

  const img = document.getElementById('intro-image');
  if (lesson.image) {
    img.src = `images/${lesson.image}`;
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }

  showScreen('screen-lesson-intro');
}

function startLesson() {
  buildLessonPages();
  currentPageIndex = 0;
  renderPage();
  showScreen('screen-lesson-pages');
}

// ===== BUILD LESSON PAGES =====
function buildLessonPages() {
  const lesson = APP_DATA.lessons.find(l => l.id === currentLesson);
  const chapter = APP_DATA.chapters.find(c => c.id === lesson.chapterId);

  lessonPages = [];

  // 1. Pray Before
  lessonPages.push({ type: 'prayer_before', lesson });

  // 2. Scripture Page
  lessonPages.push({ type: 'scripture', lesson });

  // 3. Key Terms
  lessonPages.push({ type: 'key_terms', lesson });

  // 4. Treasure Chest
  lessonPages.push({ type: 'treasure_chest', lesson });

  // 5. Question Page
  lessonPages.push({ type: 'questions', lesson });

  // 6. Sketch Page
  lessonPages.push({ type: 'sketch', lesson });

  // If this is the last lesson of the chapter, add Review + Personal App
  const isLastLesson = chapter.lessons[chapter.lessons.length - 1] === lesson.id;
  if (isLastLesson) {
    lessonPages.push({ type: 'review', lesson, chapter });
    lessonPages.push({ type: 'personal_application', lesson, chapter });
  }

  // 7. Greater Works
  lessonPages.push({ type: 'greater_works', lesson });

  // 8. Pray After
  lessonPages.push({ type: 'prayer_after', lesson });

  // Update nav buttons
  document.getElementById('nav-cp').textContent = `Chapter ${chapter.id}`;
  document.getElementById('nav-ls').textContent = `Lesson ${lesson.number}`;
}

// ===== RENDER PAGE =====
function renderPage() {
  const page = lessonPages[currentPageIndex];
  const content = document.getElementById('page-content');
  content.innerHTML = '';
  stopAudio();

  const lesson = page.lesson;
  const chapter = page.chapter;

  switch(page.type) {
    case 'prayer_before':
      renderPrayerPage(content, `Pray before you read Lesson #${lesson.number}`, lesson);
      break;
    case 'scripture':
      renderScripturePage(content, lesson);
      break;
    case 'key_terms':
      renderKeyTermsPage(content, lesson);
      break;
    case 'treasure_chest':
      renderTreasureChestPage(content, lesson);
      break;
    case 'questions':
      renderQuestionsPage(content, lesson);
      break;
    case 'sketch':
      renderSketchPage(content, lesson);
      break;
    case 'review':
      renderReviewPage(content, lesson, chapter);
      break;
    case 'personal_application':
      renderPersonalAppPage(content, lesson, chapter);
      break;
    case 'greater_works':
      renderGreaterWorksPage(content, lesson);
      break;
    case 'prayer_after':
      renderPrayerPage(content, `Pray after you have completed Lesson #${lesson.number}`, lesson);
      break;
  }
}

// ===== PAGE RENDERERS =====

function pageHeader(lesson, title) {
  return `
    <div class="page-title">${title}</div>
    <div class="page-subtitle">Read: ${lesson.passage}</div>
    <div class="page-theme"><strong>Memorize the Theme:</strong> ${lesson.theme}</div>
  `;
}

function renderPrayerPage(container, text, lesson) {
  container.innerHTML = `
    <div class="prayer-page">
      <p class="prayer-text">${text}</p>
      <img src="images/color_4_18_19.jpg" class="prayer-img" alt="Pray" onerror="this.style.display='none'" />
    </div>
  `;
}

function renderScripturePage(container, lesson) {
  const key = `scripture_annotations_${lesson.id}`;
  const savedAnnotations = getUserKey(key);

  container.innerHTML = `
    ${pageHeader(lesson, 'SCRIPTURE PAGE')}
    ${lesson.image ? `<img src="images/${lesson.image}" class="page-image" alt="Lesson" />` : ''}
    <div id="scripture-text" class="scripture-box selectable" data-key="${key}">${lesson.scripture}</div>
    <p style="font-size:0.78rem; color:#6b7280; text-align:center; margin-top:4px;">💡 Select any word to annotate (highlight, underline, circle, rectangle, triangle)</p>
  `;

  const scriptureEl = document.getElementById('scripture-text');
  scriptureEl.addEventListener('mouseup', handleTextSelection);
  scriptureEl.addEventListener('touchend', handleTextSelection);

  // Audio text
  scriptureEl.setAttribute('data-audio', lesson.scripture);
  document.getElementById('nav-audio-btn').setAttribute('data-text', lesson.scripture);
}

function renderKeyTermsPage(container, lesson) {
  const terms = lesson.keyTerms.map((t, i) => `
    <div class="key-term-item">
      <div class="key-term-word">${i+1}. ${t.word}</div>
      <div class="key-term-def">${t.definition}</div>
    </div>
  `).join('');

  const audioText = lesson.keyTerms.map((t,i) => `${i+1}. ${t.word}: ${t.definition}`).join('. ');

  container.innerHTML = `
    ${pageHeader(lesson, 'KEY TERMS PAGE')}
    <div class="key-terms-list">${terms}</div>
  `;

  document.getElementById('nav-audio-btn').setAttribute('data-text', audioText);
}

function renderTreasureChestPage(container, lesson) {
  const key = `treasure_${lesson.id}`;
  const saved = getUserKey(key) || '{}';
  let savedData = {};
  try { savedData = JSON.parse(saved); } catch(e) {}

  const slots = ['note1','note2','note3','note4','note5'];
  const fields = slots.map((slot, i) => `
    <div class="chest-field${i === 4 ? ' chest-bottom' : ''}">
      <div class="chest-field-label">Note ${i+1}</div>
      <textarea
        data-slot="${slot}"
        placeholder="Write your key notes here..."
        oninput="saveTreasure(${lesson.id}, this)"
      >${savedData[slot] || ''}</textarea>
    </div>
  `).join('');

  container.innerHTML = `
    ${pageHeader(lesson, 'TREASURE CHEST')}
    <div class="treasure-note">📖 ${lesson.treasureChestNote}</div>
    <div class="treasure-chest-container">
      <div class="chest-fields">
        ${fields}
        <div class="treasure-img-container">
          <span style="font-size:3rem;">🏆</span>
        </div>
      </div>
    </div>
  `;
}

function saveTreasure(lessonId, el) {
  const key = `treasure_${lessonId}`;
  const saved = getUserKey(key) || '{}';
  let data = {};
  try { data = JSON.parse(saved); } catch(e) {}
  data[el.dataset.slot] = el.value;
  setUserData(key, JSON.stringify(data));
}

function renderQuestionsPage(container, lesson) {
  const key = `questions_${lesson.id}`;
  const saved = getUserKey(key) || '{}';
  let savedData = {};
  try { savedData = JSON.parse(saved); } catch(e) {}

  const questions = lesson.questions.map((q, i) => `
    <div class="question-item">
      <div class="question-text">${i+1}. ${q}</div>
      <textarea
        class="question-answer"
        placeholder="Write your answer here..."
        data-qidx="${i}"
        oninput="saveQuestion(${lesson.id}, this)"
      >${savedData[i] || ''}</textarea>
    </div>
  `).join('');

  const audioText = lesson.questions.map((q, i) => `Question ${i+1}: ${q}`).join('. ');

  container.innerHTML = `
    ${pageHeader(lesson, 'Question Page')}
    ${lesson.image ? `<img src="images/${lesson.image}" class="page-image" alt="Lesson" />` : ''}
    <div class="questions-list">${questions}</div>
  `;

  document.getElementById('nav-audio-btn').setAttribute('data-text', audioText);
}

function saveQuestion(lessonId, el) {
  const key = `questions_${lessonId}`;
  const saved = getUserKey(key) || '{}';
  let data = {};
  try { data = JSON.parse(saved); } catch(e) {}
  data[el.dataset.qidx] = el.value;
  setUserData(key, JSON.stringify(data));
}

function renderSketchPage(container, lesson) {
  container.innerHTML = `
    ${pageHeader(lesson, 'Sketch Page')}
    <p style="font-size:0.88rem; color:#4b5563; text-align:center;">Use your imagination to sketch ${lesson.passage}</p>
    <div class="sketch-container">
      <div class="sketch-tools">
        <button class="tool-btn active" id="tool-pen" onclick="setTool('pen')">✏️ Pen</button>
        <button class="tool-btn" id="tool-eraser" onclick="setTool('eraser')">⬜ Eraser</button>
        <div style="width:1px; background:#e5e7eb; height:24px;"></div>
        <input type="color" value="#000000" id="color-picker" onchange="setColor(this.value)" style="width:32px;height:32px;border:none;border-radius:50%;cursor:pointer;padding:0;" title="Pick color" />
        <div class="brush-size">
          <span>Size:</span>
          <input type="range" min="1" max="20" value="4" id="brush-size" oninput="setBrushSize(this.value)" />
          <span id="brush-size-label">4</span>
        </div>
      </div>
      <canvas id="sketch-canvas" width="440" height="340"></canvas>
      <div class="sketch-actions">
        <button class="sketch-action-btn" onclick="undoSketch()">↩ Undo</button>
        <button class="sketch-action-btn" onclick="saveSketch(${lesson.id})">💾 Save</button>
        <button class="sketch-action-btn danger" onclick="clearSketch()">🗑 Clear</button>
      </div>
    </div>
  `;

  initSketch(lesson.id);
}

function renderReviewPage(container, lesson, chapter) {
  const key = `review_${chapter.id}`;
  const saved = getUserKey(key) || '{}';
  let data = {};
  try { data = JSON.parse(saved); } catch(e) {}

  container.innerHTML = `
    <div class="page-title">Chapter ${chapter.id}: ${chapter.title} Review</div>
    <div class="review-page">
      <p class="review-heading">List the two main headings:</p>
      <div>
        <label style="font-size:0.85rem; color:#6b7280;">1.</label>
        <input type="text" class="review-input" placeholder="First main heading..." value="${data.heading1 || ''}"
          oninput="saveReview(${chapter.id}, 'heading1', this.value)" />
      </div>
      <div>
        <label style="font-size:0.85rem; color:#6b7280;">2.</label>
        <input type="text" class="review-input" placeholder="Second main heading..." value="${data.heading2 || ''}"
          oninput="saveReview(${chapter.id}, 'heading2', this.value)" />
      </div>
      <p class="review-subheading">List the scriptures that support the two main headings:</p>
      <textarea class="review-textarea" placeholder="List the supporting scriptures here..."
        oninput="saveReview(${chapter.id}, 'scriptures', this.value)">${data.scriptures || ''}</textarea>
    </div>
  `;
}

function saveReview(chapterId, field, value) {
  const key = `review_${chapterId}`;
  const saved = getUserKey(key) || '{}';
  let data = {};
  try { data = JSON.parse(saved); } catch(e) {}
  data[field] = value;
  setUserData(key, JSON.stringify(data));
}

function renderPersonalAppPage(container, lesson, chapter) {
  const key = `personal_${chapter.id}`;
  const saved = getUserKey(key) || '';

  container.innerHTML = `
    <div class="page-title">Personal Application</div>
    <div class="page-subtitle">Sketch Page</div>
    <div class="personal-app-page">
      <p style="font-size:0.92rem; color:#374151; line-height:1.7;">${chapter.personalApplicationPrompt}</p>
      <textarea class="review-textarea" style="min-height:200px;" placeholder="Write your personal application here as the Holy Spirit reveals..."
        oninput="setUserData('${key}', this.value)">${saved}</textarea>
    </div>
  `;
}

function renderGreaterWorksPage(container, lesson) {
  container.innerHTML = `
    <div class="greater-works-page">
      <p class="greater-works-text">${APP_DATA.greaterWorks}</p>
      <div class="greater-works-affirmation">${APP_DATA.greaterWorksAffirmation}</div>
    </div>
  `;
}

// ===== TEST PAGE =====
function openTest(type) {
  const testData = type === 'pre' ? APP_DATA.preTest : APP_DATA.postTest;
  const screen = document.getElementById('screen-lesson-pages');

  document.getElementById('nav-cp').textContent = type === 'pre' ? 'Pre-Test' : 'Post-Test';
  document.getElementById('nav-ls').textContent = '';

  lessonPages = testData.days.map(day => ({ type: 'test', day, testType: type, title: testData.title, instruction: testData.instruction }));
  currentPageIndex = 0;
  renderTestPage();
  showScreen('screen-lesson-pages');
}

function renderTestPage() {
  const page = lessonPages[currentPageIndex];
  const container = document.getElementById('page-content');
  if (page.type !== 'test') { renderPage(); return; }

  const { day, testType } = page;
  const key = `test_${testType}_${day.day}`;
  const saved = getUserKey(key);

  container.innerHTML = `
    <div class="page-title">${page.title}</div>
    <p style="font-size:0.85rem; color:#6b7280; text-align:center; padding: 0 8px;">${page.instruction}</p>
    <div class="test-item">
      <div class="test-day-label">Day ${day.day}</div>
      <div class="test-passage">Use your imagination to sketch ${day.passage}</div>
      <div class="test-sketch-area" id="test-sketch-area-${day.day}">
        <canvas id="test-canvas-${day.day}" width="400" height="200" style="display:block;"></canvas>
      </div>
    </div>
    <div style="display:flex; gap:8px; justify-content:center; margin-top:8px;">
      <button class="sketch-action-btn" onclick="clearTestCanvas(${day.day})">🗑 Clear</button>
      <button class="sketch-action-btn" onclick="saveTestCanvas(${day.day}, '${testType}')">💾 Save</button>
    </div>
  `;

  setTimeout(() => initTestCanvas(day.day, testType), 100);
}

// ===== PAGINATION =====
function prevPage() {
  if (currentPageIndex > 0) {
    currentPageIndex--;
    renderCurrentPage();
  } else {
    goToSelectLessonCurrent();
  }
}

function nextPage() {
  if (currentPageIndex < lessonPages.length - 1) {
    currentPageIndex++;
    renderCurrentPage();
  } else {
    goToSelectBook();
  }
}

function renderCurrentPage() {
  const page = lessonPages[currentPageIndex];
  if (page && page.type === 'test') {
    renderTestPage();
  } else {
    renderPage();
  }
  window.scrollTo(0, 0);
}

// ===== AUDIO / TTS =====
function toggleAudio() {
  if (isSpeaking) {
    stopAudio();
  } else {
    playAudio();
  }
}

function playAudio() {
  const textEl = document.getElementById('nav-audio-btn');
  const text = textEl.getAttribute('data-text');
  if (!text || !speechSynth) return;

  stopAudio();
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = 0.9;
  currentUtterance.pitch = 1;
  currentUtterance.lang = 'en-US';
  currentUtterance.onstart = () => {
    isSpeaking = true;
    document.getElementById('nav-audio-btn').textContent = '⏹ Stop';
    document.getElementById('audio-player').classList.remove('hidden');
    document.getElementById('audio-label').textContent = 'Reading...';
  };
  currentUtterance.onend = () => {
    isSpeaking = false;
    document.getElementById('nav-audio-btn').textContent = 'Audio';
    document.getElementById('audio-player').classList.add('hidden');
  };
  speechSynth.speak(currentUtterance);
}

function stopAudio() {
  if (speechSynth) speechSynth.cancel();
  isSpeaking = false;
  const btn = document.getElementById('nav-audio-btn');
  if (btn) btn.textContent = 'Audio';
  const player = document.getElementById('audio-player');
  if (player) player.classList.add('hidden');
  currentUtterance = null;
}

function togglePlayPause() {
  if (speechSynth.paused) {
    speechSynth.resume();
    document.getElementById('play-btn').textContent = '⏸';
  } else if (isSpeaking) {
    speechSynth.pause();
    document.getElementById('play-btn').textContent = '▶';
  } else {
    playAudio();
  }
}

function seekAudio(val) { /* TTS doesn't support seeking */ }
function adjustVolume() { /* placeholder */ }

// ===== ANNOTATION TOOLBAR =====
function createAnnotationToolbar() {
  const toolbar = document.createElement('div');
  toolbar.id = 'annotation-toolbar';
  toolbar.className = 'annotation-toolbar';
  toolbar.innerHTML = `
    <button class="ann-btn ann-highlight" onclick="applyAnnotation('highlight')">🖊 Highlight</button>
    <button class="ann-btn ann-underline" onclick="applyAnnotation('underline')">U̲ Underline</button>
    <button class="ann-btn ann-circle" onclick="applyAnnotation('circle')">○ Circle</button>
    <button class="ann-btn ann-rect" onclick="applyAnnotation('rect')">□ Rectangle</button>
    <button class="ann-btn ann-triangle" onclick="applyAnnotation('triangle')">△ Triangle</button>
    <button class="ann-btn" style="background:#e5e7eb;" onclick="closeAnnotationToolbar()">✕</button>
  `;
  document.body.appendChild(toolbar);
}

let selectedRange = null;

function handleTextSelection(e) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
    closeAnnotationToolbar();
    return;
  }

  selectedRange = selection.getRangeAt(0);
  const rect = selectedRange.getBoundingClientRect();
  const toolbar = document.getElementById('annotation-toolbar');

  toolbar.style.top = (rect.top + window.scrollY - 50) + 'px';
  toolbar.style.left = Math.max(4, Math.min(rect.left, window.innerWidth - 290)) + 'px';
  toolbar.classList.add('visible');
}

function applyAnnotation(type) {
  if (!selectedRange) return;

  const classMap = {
    highlight: 'annotated-highlight',
    underline: 'annotated-underline',
    circle: 'annotated-circle',
    rect: 'annotated-rect',
    triangle: 'annotated-triangle'
  };

  const span = document.createElement('span');
  span.className = classMap[type];

  try {
    selectedRange.surroundContents(span);
  } catch(e) {
    // partial selection fallback
    const fragment = selectedRange.extractContents();
    span.appendChild(fragment);
    selectedRange.insertNode(span);
  }

  closeAnnotationToolbar();
  window.getSelection().removeAllRanges();
}

function closeAnnotationToolbar() {
  const toolbar = document.getElementById('annotation-toolbar');
  if (toolbar) toolbar.classList.remove('visible');
  selectedRange = null;
}

document.addEventListener('click', (e) => {
  const toolbar = document.getElementById('annotation-toolbar');
  if (toolbar && !toolbar.contains(e.target) && !e.target.closest('.selectable')) {
    closeAnnotationToolbar();
  }
});

// ===== SKETCH CANVAS =====
let sketchHistory = [];

function initSketch(lessonId) {
  setTimeout(() => {
    sketchCanvas = document.getElementById('sketch-canvas');
    if (!sketchCanvas) return;

    // Responsive canvas
    const maxW = Math.min(window.innerWidth - 40, 440);
    sketchCanvas.width = maxW;
    sketchCanvas.height = Math.round(maxW * 0.77);

    sketchCtx = sketchCanvas.getContext('2d');
    sketchCtx.fillStyle = '#ffffff';
    sketchCtx.fillRect(0, 0, sketchCanvas.width, sketchCanvas.height);

    // Load saved sketch
    const saved = getUserKey(`sketch_${lessonId}`);
    if (saved) {
      const img = new Image();
      img.onload = () => sketchCtx.drawImage(img, 0, 0);
      img.src = saved;
    }

    // Events
    sketchCanvas.addEventListener('mousedown', startDraw);
    sketchCanvas.addEventListener('mousemove', draw);
    sketchCanvas.addEventListener('mouseup', endDraw);
    sketchCanvas.addEventListener('mouseleave', endDraw);
    sketchCanvas.addEventListener('touchstart', startDraw, { passive: false });
    sketchCanvas.addEventListener('touchmove', draw, { passive: false });
    sketchCanvas.addEventListener('touchend', endDraw);

    sketchHistory = [];
    saveHistory();
  }, 200);
}

function saveHistory() {
  if (!sketchCanvas) return;
  sketchHistory.push(sketchCanvas.toDataURL());
  if (sketchHistory.length > 20) sketchHistory.shift();
}

function undoSketch() {
  if (sketchHistory.length < 2) return;
  sketchHistory.pop();
  const img = new Image();
  img.onload = () => {
    sketchCtx.clearRect(0, 0, sketchCanvas.width, sketchCanvas.height);
    sketchCtx.drawImage(img, 0, 0);
  };
  img.src = sketchHistory[sketchHistory.length - 1];
}

function getPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  if (e.touches) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY
    };
  }
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function startDraw(e) {
  e.preventDefault();
  isDrawing = true;
  const pos = getPos(e, sketchCanvas);
  lastX = pos.x;
  lastY = pos.y;
}

function draw(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const pos = getPos(e, sketchCanvas);

  sketchCtx.beginPath();
  sketchCtx.moveTo(lastX, lastY);
  sketchCtx.lineTo(pos.x, pos.y);
  sketchCtx.strokeStyle = drawTool === 'eraser' ? '#ffffff' : drawColor;
  sketchCtx.lineWidth = drawTool === 'eraser' ? drawSize * 4 : drawSize;
  sketchCtx.lineCap = 'round';
  sketchCtx.lineJoin = 'round';
  sketchCtx.stroke();

  lastX = pos.x;
  lastY = pos.y;
}

function endDraw(e) {
  if (!isDrawing) return;
  isDrawing = false;
  saveHistory();
}

function setTool(tool) {
  drawTool = tool;
  document.getElementById('tool-pen').classList.toggle('active', tool === 'pen');
  document.getElementById('tool-eraser').classList.toggle('active', tool === 'eraser');
}

function setColor(val) {
  drawColor = val;
  drawTool = 'pen';
  document.getElementById('tool-pen').classList.add('active');
  document.getElementById('tool-eraser').classList.remove('active');
}

function setBrushSize(val) {
  drawSize = parseInt(val);
  document.getElementById('brush-size-label').textContent = val;
}

function clearSketch() {
  if (!sketchCtx) return;
  if (!confirm('Clear the sketch? This cannot be undone.')) return;
  sketchCtx.fillStyle = '#ffffff';
  sketchCtx.fillRect(0, 0, sketchCanvas.width, sketchCanvas.height);
  saveHistory();
}

function saveSketch(lessonId) {
  if (!sketchCanvas) return;
  const data = sketchCanvas.toDataURL('image/png');
  setUserData(`sketch_${lessonId}`, data);
}

// ===== TEST CANVAS =====
let testCanvases = {};

function initTestCanvas(day, type) {
  const canvas = document.getElementById(`test-canvas-${day}`);
  if (!canvas) return;

  const maxW = Math.min(window.innerWidth - 48, 400);
  canvas.width = maxW;
  canvas.height = 200;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const saved = getUserKey(`test_${type}_${day}`);
  if (saved) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = saved;
  }

  testCanvases[day] = { canvas, ctx, isDrawing: false, lastX: 0, lastY: 0 };

  canvas.addEventListener('mousedown', e => startTestDraw(e, day));
  canvas.addEventListener('mousemove', e => drawTest(e, day));
  canvas.addEventListener('mouseup', () => { if (testCanvases[day]) testCanvases[day].isDrawing = false; });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); startTestDraw(e, day); }, { passive: false });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); drawTest(e, day); }, { passive: false });
  canvas.addEventListener('touchend', () => { if (testCanvases[day]) testCanvases[day].isDrawing = false; });
}

function startTestDraw(e, day) {
  const tc = testCanvases[day];
  if (!tc) return;
  tc.isDrawing = true;
  const pos = getPos(e, tc.canvas);
  tc.lastX = pos.x;
  tc.lastY = pos.y;
}

function drawTest(e, day) {
  const tc = testCanvases[day];
  if (!tc || !tc.isDrawing) return;
  const pos = getPos(e, tc.canvas);
  tc.ctx.beginPath();
  tc.ctx.moveTo(tc.lastX, tc.lastY);
  tc.ctx.lineTo(pos.x, pos.y);
  tc.ctx.strokeStyle = '#000000';
  tc.ctx.lineWidth = 3;
  tc.ctx.lineCap = 'round';
  tc.ctx.stroke();
  tc.lastX = pos.x;
  tc.lastY = pos.y;
}

function clearTestCanvas(day) {
  const tc = testCanvases[day];
  if (!tc) return;
  tc.ctx.fillStyle = '#ffffff';
  tc.ctx.fillRect(0, 0, tc.canvas.width, tc.canvas.height);
}

function saveTestCanvas(day, type) {
  const tc = testCanvases[day];
  if (!tc) return;
  const data = tc.canvas.toDataURL('image/png');
  setUserData(`test_${type}_${day}`, data);
}

// ===== INTRO MODAL =====
function showIntro() {
  document.getElementById('modal-intro').classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}
