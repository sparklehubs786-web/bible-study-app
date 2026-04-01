// ===== THE GATEWAY TO HEAVEN — GAME ENGINE v2 =====
// Board: 5 Rows per team side, Slots 5,9,11,13,17 are card slots
// Cards from PDF: Isaiah scripture cards + special cards

// ===== REAL CARD DECK from PDFs =====
const SCRIPTURE_CARDS = [
  // From Card PDF 1 - Main cards
  { ref: 'Isaiah 1:16-17', title: 'The Wickedness of Judah', level: 1 },
  { ref: 'Isaiah 1:18', title: 'The Wickedness of Judah', level: 1 },
  { ref: 'Isaiah 1:19-20', title: 'The Wickedness of Judah', level: 1 },
  { ref: 'Isaiah 4:4-5', title: 'Future Glory of the Survivors in Zion', level: 1 },
  { ref: 'Isaiah 6:8-9', title: 'Vision of God in the Temple', level: 1 },
  { ref: 'Isaiah 9:6', title: 'The Righteous Reign of the Coming King', level: 1 },
  { ref: 'Isaiah 11:1-4', title: 'The Peaceful Kingdom', level: 1 },
  { ref: 'Isaiah 12:2-6', title: 'Thanksgiving and Praise', level: 1 },
  { ref: 'Isaiah 14:12-14', title: 'Downfall of the King of Babylon', level: 1 },
  { ref: 'Isaiah 30:20-21', title: "God's Promise to Zion", level: 1 },
  { ref: 'Isaiah 38:5-9', title: "Hezekiah's Illness", level: 1 },
  { ref: 'Isaiah 40:1-2', title: "God's People are Comforted", level: 2 },
  { ref: 'Isaiah 40:3-5', title: "God's People are Comforted", level: 2 },
  { ref: 'Isaiah 40:6-8', title: "God's People are Comforted", level: 2 },
  { ref: 'Isaiah 41:15', title: 'Israel Assured of God\'s Help', level: 2 },
  { ref: 'Isaiah 41:26', title: 'Israel Assured of God\'s Help', level: 2 },
  { ref: 'Isaiah 42:1-4', title: 'The Servant, a Light to the Nations', level: 2 },
  { ref: 'Isaiah 42:5-8', title: 'The Servant, a Light to the Nations', level: 2 },
  { ref: 'Isaiah 42:8', title: 'The Servant, a Light to the Nations', level: 2 },
  { ref: 'Isaiah 42:9', title: 'The Servant, a Light to the Nations', level: 2 },
  { ref: 'Isaiah 43:2', title: 'Restoration and Protection Promised', level: 2 },
  { ref: 'Isaiah 43:18-19', title: 'Restoration and Protection Promised', level: 2 },
  { ref: 'Isaiah 45:1-3', title: "Cyrus, God's Instrument", level: 2 },
  { ref: 'Isaiah 46:9-11', title: 'Idols Cannot Save Babylon', level: 2 },
  { ref: 'Isaiah 48:3-5', title: 'God the Creator and Redeemer', level: 2 },
  { ref: 'Isaiah 48:6-8', title: 'God the Creator and Redeemer', level: 2 },
  { ref: 'Isaiah 48:10', title: 'God the Creator and Redeemer', level: 2 },
  { ref: 'Isaiah 50:1-2', title: "Zion's Children to be Brought Home", level: 3 },
  { ref: 'Isaiah 50:4-5', title: "The Servant's Humiliation and Vindication", level: 3 },
  { ref: 'Isaiah 50:6-7', title: "The Servant's Humiliation and Vindication", level: 3 },
  { ref: 'Isaiah 50:10-11', title: "The Servant's Humiliation and Vindication", level: 3 },
  { ref: 'Isaiah 52:1', title: 'Let Zion Rejoice', level: 3 },
  { ref: 'Isaiah 52:7', title: 'Let Zion Rejoice', level: 3 },
  { ref: 'Isaiah 53:1', title: 'The Suffering Servant', level: 3 },
  { ref: 'Isaiah 53:3-5', title: 'The Suffering Servant', level: 3 },
  { ref: 'Isaiah 53:6-7', title: 'The Suffering Servant', level: 3 },
  { ref: 'Isaiah 54:1-2', title: 'The Eternal Covenant of Peace', level: 3 },
  { ref: 'Isaiah 54:4', title: 'The Eternal Covenant of Peace', level: 3 },
  { ref: 'Isaiah 54:5', title: 'The Eternal Covenant of Peace', level: 3 },
  { ref: 'Isaiah 54:6-7', title: 'The Eternal Covenant of Peace', level: 3 },
  { ref: 'Isaiah 54:17', title: 'The Eternal Covenant of Peace', level: 3 },
  { ref: 'Isaiah 55:1-3', title: 'An Invitation of Abundant Life', level: 4 },
  { ref: 'Isaiah 55:6-7', title: 'An Invitation of Abundant Life', level: 4 },
  { ref: 'Isaiah 55:8-9', title: 'For My Thoughts Are Not Your Thoughts', level: 4 },
  { ref: 'Isaiah 55:10-11', title: 'My Word Will Not Return to Me Empty', level: 4 },
  { ref: 'Isaiah 58:1', title: 'False and True Worship (Fasting)', level: 4 },
  { ref: 'Isaiah 58:3-4', title: 'False and True Worship (Fasting)', level: 4 },
  { ref: 'Isaiah 58:5-7', title: 'False and True Worship (Fasting)', level: 4 },
  { ref: 'Isaiah 58:8', title: 'False and True Worship (Fasting)', level: 4 },
  { ref: 'Isaiah 58:9', title: 'False and True Worship (Fasting)', level: 4 },
  { ref: 'Isaiah 59:1-4', title: 'Injustice and Oppression to be Punished', level: 4 },
  { ref: 'Isaiah 60:1-4', title: 'The Ingathering of the Dispersed', level: 5 },
  { ref: 'Isaiah 61:1-3', title: 'The Good News of Deliverance', level: 5 },
  { ref: 'Isaiah 62:1-2', title: 'The Vindication and Salvation of Zion', level: 5 },
  { ref: 'Isaiah 66:5', title: 'The Vindication and Salvation of Zion', level: 5 },
  // Back of card references
  { ref: 'Isaiah 1:18', title: 'Experience Heaven from Earth', level: 1 },
  { ref: 'Isaiah 9:16', title: 'Experience Heaven from Earth', level: 1 },
  { ref: 'Isaiah 30:20-21', title: 'Experience Heaven from Earth', level: 2 },
  { ref: 'Isaiah 40:3-5', title: 'Experience Heaven from Earth', level: 2 },
  { ref: 'Isaiah 42:9', title: 'Experience Heaven from Earth', level: 2 },
  { ref: 'Isaiah 43:2', title: 'Experience Heaven from Earth', level: 3 },
  { ref: 'Isaiah 46:9-11', title: 'Experience Heaven from Earth', level: 3 },
  { ref: 'Isaiah 48:3-5', title: 'Experience Heaven from Earth', level: 3 },
  { ref: 'Isaiah 50:4-5', title: 'Experience Heaven from Earth', level: 4 },
  { ref: 'Isaiah 53:3-5', title: 'Experience Heaven from Earth', level: 4 },
  { ref: 'Isaiah 58:5-7', title: 'Experience Heaven from Earth', level: 4 },
  { ref: 'Isaiah 61:1-3', title: 'Experience Heaven from Earth', level: 5 },
];

// Special cards from Additional PDF
const SPECIAL_CARDS = [
  { type: 'special', effect: 'wipeout1', label: 'Wipeout 1st Level', emoji: '😤', description: 'Remove all your pegs from Level 1!' },
  { type: 'special', effect: 'wipeout2', label: 'Wipeout 2nd Level', emoji: '😤', description: 'Remove all your pegs from Level 2!' },
  { type: 'special', effect: 'lose_turn', label: 'Lose a Turn', emoji: '😢', description: 'You lose your next turn.' },
  { type: 'special', effect: 'lose_turn', label: 'Lose a Turn', emoji: '😢', description: 'You lose your next turn.' },
  { type: 'special', effect: 'lose_turn', label: 'Lose a Turn', emoji: '😢', description: 'You lose your next turn.' },
  { type: 'special', effect: 'lose_turn', label: 'Lose a Turn', emoji: '😢', description: 'You lose your next turn.' },
  { type: 'special', effect: 'free_choice', label: 'Free Choice', emoji: '😄', description: 'Place a peg anywhere on the board!' },
  { type: 'special', effect: 'free_choice', label: 'Free Choice', emoji: '😄', description: 'Place a peg anywhere on the board!' },
  { type: 'special', effect: 'free_choice', label: 'Free Choice', emoji: '😄', description: 'Place a peg anywhere on the board!' },
  { type: 'special', effect: 'free_choice', label: 'Free Choice', emoji: '😄', description: 'Place a peg anywhere on the board!' },
];

// ===== BOARD — 5 Rows, Slots 5,9,11,13,17 are card slots =====
// Based on the actual board image: rows go around the board
// Each row has numbered slots, card slots are at positions 5,9,11,13,17
const BOARD_ROWS = [
  {
    row: 1, level: 1, color: 'red',
    slots: [
      { pos: 1, ref: 'Isaiah 1:16-17' }, { pos: 2, ref: 'Isaiah 1:18' },
      { pos: 3, ref: 'Isaiah 1:19-20' }, { pos: 4, ref: 'Isaiah 4:4-5' },
      { pos: 5, ref: 'Isaiah 6:8-9', cardSlot: true },
      { pos: 6, ref: 'Isaiah 9:6' }, { pos: 7, ref: 'Isaiah 11:1-4' },
      { pos: 8, ref: 'Isaiah 12:2-6' },
      { pos: 9, ref: 'Isaiah 14:12-14', cardSlot: true },
      { pos: 10, ref: 'Isaiah 30:20-21' },
      { pos: 11, ref: 'Isaiah 38:5-9', cardSlot: true },
      { pos: 12, ref: 'Isaiah 40:1-2' },
      { pos: 13, ref: 'Isaiah 40:3-5', cardSlot: true },
      { pos: 14, ref: 'Isaiah 40:6-8' }, { pos: 15, ref: 'Isaiah 41:15' },
      { pos: 16, ref: 'Isaiah 41:26' },
      { pos: 17, ref: 'Isaiah 42:1-4', cardSlot: true },
      { pos: 18, ref: 'Isaiah 42:5-8' }, { pos: 19, ref: 'Isaiah 42:8' }, { pos: 20, ref: 'Isaiah 42:9' }
    ]
  },
  {
    row: 2, level: 2, color: 'orange',
    slots: [
      { pos: 1, ref: 'Isaiah 42:5-8' }, { pos: 2, ref: 'Isaiah 42:8' },
      { pos: 3, ref: 'Isaiah 42:9' }, { pos: 4, ref: 'Isaiah 43:2' },
      { pos: 5, ref: 'Isaiah 43:18-19', cardSlot: true },
      { pos: 6, ref: 'Isaiah 45:1-3' }, { pos: 7, ref: 'Isaiah 46:9-11' },
      { pos: 8, ref: 'Isaiah 48:3-5' },
      { pos: 9, ref: 'Isaiah 48:6-8', cardSlot: true },
      { pos: 10, ref: 'Isaiah 48:10' },
      { pos: 11, ref: 'Isaiah 50:1-2', cardSlot: true },
      { pos: 12, ref: 'Isaiah 50:4-5' },
      { pos: 13, ref: 'Isaiah 50:6-7', cardSlot: true },
      { pos: 14, ref: 'Isaiah 50:10-11' },
      { pos: 15, ref: 'Isaiah 52:1' }, { pos: 16, ref: 'Isaiah 52:7' },
      { pos: 17, ref: 'Isaiah 53:1', cardSlot: true },
      { pos: 18, ref: 'Isaiah 53:3-5' }, { pos: 19, ref: 'Isaiah 53:6-7' },
    ]
  },
  {
    row: 3, level: 3, color: 'green',
    slots: [
      { pos: 1, ref: 'Isaiah 50:10-11' }, { pos: 2, ref: 'Isaiah 52:1' },
      { pos: 3, ref: 'Isaiah 52:7' }, { pos: 4, ref: 'Isaiah 53:1' },
      { pos: 5, ref: 'Isaiah 53:3-5', cardSlot: true },
      { pos: 6, ref: 'Isaiah 53:6-7' }, { pos: 7, ref: 'Isaiah 54:1-2' },
      { pos: 8, ref: 'Isaiah 54:4' },
      { pos: 9, ref: 'Isaiah 54:5', cardSlot: true },
      { pos: 10, ref: 'Isaiah 54:6-7' },
      { pos: 11, ref: 'Isaiah 54:17', cardSlot: true },
      { pos: 12, ref: 'Isaiah 55:1-3' },
      { pos: 13, ref: 'Isaiah 55:6-7', cardSlot: true },
      { pos: 14, ref: 'Isaiah 55:8-9' },
      { pos: 15, ref: 'Isaiah 55:10-11' }, { pos: 16, ref: 'Isaiah 58:1' },
      { pos: 17, ref: 'Isaiah 58:3-4', cardSlot: true },
    ]
  },
  {
    row: 4, level: 4, color: 'blue',
    slots: [
      { pos: 1, ref: 'Isaiah 55:1-3' }, { pos: 2, ref: 'Isaiah 55:6-7' },
      { pos: 3, ref: 'Isaiah 55:8-9' }, { pos: 4, ref: 'Isaiah 55:10-11' },
      { pos: 5, ref: 'Isaiah 58:1', cardSlot: true },
      { pos: 6, ref: 'Isaiah 58:3-4' }, { pos: 7, ref: 'Isaiah 58:5-7' },
      { pos: 8, ref: 'Isaiah 58:8' },
      { pos: 9, ref: 'Isaiah 58:9', cardSlot: true },
      { pos: 10, ref: 'Isaiah 59:1-4' },
      { pos: 11, ref: 'Isaiah 60:1-4', cardSlot: true },
      { pos: 12, ref: 'Isaiah 61:1-3' },
      { pos: 13, ref: 'Isaiah 62:1-2', cardSlot: true },
      { pos: 14, ref: 'Isaiah 66:5' },
      { pos: 17, ref: 'Isaiah 58:5-7', cardSlot: true },
    ]
  },
  {
    row: 5, level: 5, color: 'gold',
    slots: [
      { pos: 5, ref: 'Isaiah 59:1-4', cardSlot: true },
      { pos: 9, ref: 'Isaiah 60:1-4', cardSlot: true },
      { pos: 11, ref: 'Isaiah 61:1-3', cardSlot: true },
      { pos: 13, ref: 'Isaiah 62:1-2', cardSlot: true },
      { pos: 17, ref: 'Isaiah 66:5', cardSlot: true },
    ]
  }
];

// ===== GAME STATE =====
let gameState = {
  players: [],
  currentPlayerIndex: 0,
  board: {},
  deck: [],
  currentCard: null,
  activeSlot: null,
  gameCode: null,
  started: false,
  skippedTurns: {},
  winner: null
};

let selectedColor = 'orange';
let myPlayer = null;

// ===== LOBBY =====
function showCreateGame() {
  document.getElementById('create-form').classList.remove('hidden');
  document.getElementById('join-form').classList.add('hidden');
}

function showJoinGame() {
  document.getElementById('join-form').classList.remove('hidden');
  document.getElementById('create-form').classList.add('hidden');
}

function pickColor(btn) {
  document.querySelectorAll('.color-opt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedColor = btn.dataset.color;
}

function createGame() {
  const name = document.getElementById('create-name').value.trim();
  if (!name) { alert('Please enter your name.'); return; }
  const code = 'GTH-' + Math.random().toString(36).substring(2,6).toUpperCase();
  gameState.gameCode = code;
  myPlayer = { id: 'p1', name, color: selectedColor, pegs: {}, isHost: true };
  BOARD_ROWS.forEach(r => { myPlayer.pegs[r.row] = 0; });
  gameState.players.push(myPlayer);
  document.getElementById('game-code-display').textContent = code;
  document.getElementById('create-form').classList.add('hidden');
  document.getElementById('waiting-room').classList.remove('hidden');
  document.querySelector('.lobby-actions').style.display = 'none';
  renderWaitingPlayers();
  setTimeout(() => addDemoPlayers(), 1500);
}

function addDemoPlayers() {
  const colors = ['red', 'green', 'blue'];
  const names = ['Red Team', 'Green Team', 'Blue Team'];
  colors.forEach((color, i) => {
    const p = { id: 'p' + (i+2), name: names[i], color, pegs: {}, isHost: false };
    BOARD_ROWS.forEach(r => { p.pegs[r.row] = 0; });
    gameState.players.push(p);
  });
  renderWaitingPlayers();
  document.getElementById('btn-start-game').style.display = 'block';
  document.getElementById('waiting-msg').textContent = 'All players joined! Host can start the game.';
}

function joinGame() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) { alert('Please enter your name.'); return; }
  if (code.length < 4) { alert('Please enter a valid game code.'); return; }
  const colors = ['orange','red','green','blue'];
  const names = ['Orange Team', name, 'Green Team', 'Blue Team'];
  gameState.players = colors.map((color, i) => {
    const p = { id: 'p' + (i+1), name: names[i], color, pegs: {}, isHost: i === 0 };
    BOARD_ROWS.forEach(r => { p.pegs[r.row] = 0; });
    return p;
  });
  myPlayer = gameState.players[1];
  startGame();
}

function renderWaitingPlayers() {
  const container = document.getElementById('waiting-players');
  container.innerHTML = gameState.players.map(p =>
    '<div class="waiting-player">' +
    '<div class="waiting-player-dot" style="background:' + colorToHex(p.color) + ';"></div>' +
    '<span>' + p.name + (p.isHost ? ' (Host)' : '') + '</span>' +
    '</div>'
  ).join('');
}

function colorToHex(color) {
  const map = { orange: '#ea580c', red: '#dc2626', green: '#16a34a', blue: '#2563eb', gold: '#d97706' };
  return map[color] || '#9ca3af';
}

// ===== START GAME =====
function startGame() {
  gameState.started = true;

  // Build full deck: scripture cards + special cards, shuffled
  const fullDeck = [
    ...SCRIPTURE_CARDS.map(c => ({ ...c, cardType: 'scripture' })),
    ...SPECIAL_CARDS
  ];
  gameState.deck = shuffleDeck(fullDeck);

  initBoard();
  document.getElementById('screen-lobby').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  document.getElementById('screen-game').style.display = 'flex';

  renderBoard();
  renderScoreBar();
  updateTurnIndicator();
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function initBoard() {
  BOARD_ROWS.forEach(row => {
    gameState.board[row.row] = {};
    row.slots.forEach(slot => {
      gameState.board[row.row][slot.pos] = [];
    });
  });
}

// ===== RENDER BOARD =====
function renderBoard() {
  const board = document.getElementById('game-board');
  board.innerHTML = '';

  board.innerHTML += '<div class="gateway-banner">🏛️ THE GATEWAY TO HEAVEN 🏛️</div>';
  board.innerHTML += '<div class="enter-gateway">✨ ENTER THE GATEWAY — First to complete all rows wins! ✨</div>';

  const rowColors = { 5: '#d97706', 4: '#2563eb', 3: '#16a34a', 2: '#ea580c', 1: '#dc2626' };
  const rowNames  = { 5: 'Row 5 — Final Level', 4: 'Row 4', 3: 'Row 3', 2: 'Row 2', 1: 'Row 1 — Start' };

  // Render rows 5 down to 1 (top to bottom)
  [5, 4, 3, 2, 1].forEach(rowNum => {
    const rowData = BOARD_ROWS.find(r => r.row === rowNum);
    if (!rowData) return;

    const levelDiv = document.createElement('div');
    levelDiv.className = 'board-level';

    levelDiv.innerHTML =
      '<div class="level-label">' +
      '<span class="level-num" style="color:' + rowColors[rowNum] + ';">Row ' + rowNum + '</span>' +
      '<span class="level-name">' + rowNames[rowNum] + '</span>' +
      '</div>';

    const slotsDiv = document.createElement('div');
    slotsDiv.className = 'level-slots';

    rowData.slots.forEach(slot => {
      const pegs = (gameState.board[rowNum] && gameState.board[rowNum][slot.pos]) || [];
      const isActive = gameState.activeSlot &&
        gameState.activeSlot.row === rowNum &&
        gameState.activeSlot.pos === slot.pos;

      const slotEl = document.createElement('div');
      slotEl.className = 'slot' + (isActive ? ' active-slot' : '');
      if (slot.cardSlot) slotEl.style.borderColor = 'rgba(251,191,36,0.7)';

      const pegsHtml = pegs.map(color => '<div class="peg ' + color + '"></div>').join('');

      slotEl.innerHTML =
        '<div class="slot-ref">' + (slot.cardSlot ? '⭐ ' : '') + slot.ref + '</div>' +
        '<div class="slot-pegs">' + pegsHtml + '</div>' +
        (slot.cardSlot ? '<div style="font-size:0.5rem;color:#fbbf24;font-weight:700;">Card Slot ' + slot.pos + '</div>' : '');

      slotsDiv.appendChild(slotEl);
    });

    levelDiv.appendChild(slotsDiv);
    board.appendChild(levelDiv);
  });
}

// ===== SCORE BAR =====
function renderScoreBar() {
  const bar = document.getElementById('score-bar');
  bar.innerHTML = gameState.players.map(p => {
    const total = Object.values(p.pegs).reduce((a, b) => a + b, 0);
    return '<div class="score-item">' +
      '<div class="score-team" style="color:' + colorToHex(p.color) + ';">' + p.name.split(' ')[0] + '</div>' +
      '<div class="score-pegs" style="color:' + colorToHex(p.color) + ';">' + total + ' 📍</div>' +
      '</div>';
  }).join('');
}

// ===== TURN =====
function updateTurnIndicator() {
  const player = gameState.players[gameState.currentPlayerIndex];
  const el = document.getElementById('turn-indicator');
  el.textContent = player.name + "'s Turn";
  el.style.background = colorToHex(player.color) + '33';
  el.style.borderColor = colorToHex(player.color) + '88';
  el.style.color = colorToHex(player.color);
  document.getElementById('prompt-text').textContent = "It's " + player.name + "'s turn — draw a card!";
  document.getElementById('btn-draw').disabled = false;
}

// ===== DRAW CARD =====
function drawCard() {
  if (gameState.deck.length === 0) {
    gameState.deck = shuffleDeck([
      ...SCRIPTURE_CARDS.map(c => ({ ...c, cardType: 'scripture' })),
      ...SPECIAL_CARDS
    ]);
  }

  gameState.currentCard = gameState.deck.pop();
  const card = gameState.currentCard;

  document.getElementById('btn-draw').disabled = true;

  // Handle special cards immediately
  if (card.type === 'special') {
    showSpecialCard(card);
    return;
  }

  // Scripture card — find a card slot for this card's level (row)
  const targetRow = Math.min(card.level, 5);
  const rowData = BOARD_ROWS.find(r => r.row === targetRow);
  const cardSlots = rowData ? rowData.slots.filter(s => s.cardSlot) : [];
  if (cardSlots.length > 0) {
    const slot = cardSlots[Math.floor(Math.random() * cardSlots.length)];
    gameState.activeSlot = { row: targetRow, pos: slot.pos };
  }

  // Show card modal
  document.getElementById('card-level-badge').textContent = 'Row ' + targetRow + ' — Card Slot ' + (gameState.activeSlot ? gameState.activeSlot.pos : '?');
  document.getElementById('card-reference').textContent = card.ref;
  document.getElementById('card-scripture').textContent = card.title;
  document.getElementById('card-question').textContent =
    'Recite ' + card.ref + ' — "' + card.title + '". Can you say the theme of this scripture?';
  document.getElementById('card-modal').classList.remove('hidden');

  renderBoard();
}

// ===== SPECIAL CARD =====
function showSpecialCard(card) {
  document.getElementById('card-level-badge').textContent = '⚡ Special Card';
  document.getElementById('card-reference').textContent = card.label;
  document.getElementById('card-scripture').textContent = card.description;
  document.getElementById('card-question').textContent =
    card.effect === 'free_choice'
      ? '🎉 Lucky! Choose any slot on the board to place your peg!'
      : card.effect === 'lose_turn'
        ? '😢 Sorry! You lose your next turn. Click "Apply" to continue.'
        : '😤 Wipeout! Your pegs on that level are removed.';

  // Change buttons for special cards
  document.getElementById('btn-correct').textContent = '⚡ Apply Special Card';
  document.getElementById('btn-wrong').style.display = 'none';
  document.getElementById('card-modal').classList.remove('hidden');
}

// ===== ANSWER RESULT =====
function answerResult(correct) {
  document.getElementById('card-modal').classList.remove('hidden');
  document.getElementById('card-modal').classList.add('hidden');
  document.getElementById('btn-correct').textContent = '✅ Correct! Place Peg';
  document.getElementById('btn-wrong').style.display = '';

  const player = gameState.players[gameState.currentPlayerIndex];
  const card = gameState.currentCard;

  if (card && card.type === 'special') {
    applySpecialCard(card, player);
  } else if (correct && gameState.activeSlot) {
    const { row, pos } = gameState.activeSlot;
    if (!gameState.board[row][pos]) gameState.board[row][pos] = [];
    if (!gameState.board[row][pos].includes(player.color)) {
      gameState.board[row][pos].push(player.color);
      player.pegs[row] = (player.pegs[row] || 0) + 1;
    }
    if (checkWin(player)) { renderBoard(); renderScoreBar(); showWinner(player); return; }
  }

  gameState.activeSlot = null;
  // Next player
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  // Skip if that player loses their turn
  if (gameState.skippedTurns[gameState.players[gameState.currentPlayerIndex].id]) {
    delete gameState.skippedTurns[gameState.players[gameState.currentPlayerIndex].id];
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  }

  renderBoard();
  renderScoreBar();
  updateTurnIndicator();
}

function applySpecialCard(card, player) {
  switch(card.effect) {
    case 'lose_turn':
      gameState.skippedTurns[player.id] = true;
      alert(player.name + ' loses their next turn! 😢');
      break;
    case 'wipeout1':
      // Remove all pegs from row 1
      Object.keys(gameState.board[1] || {}).forEach(pos => {
        const idx = gameState.board[1][pos].indexOf(player.color);
        if (idx !== -1) { gameState.board[1][pos].splice(idx, 1); player.pegs[1] = Math.max(0, (player.pegs[1] || 0) - 1); }
      });
      alert('Wipeout! ' + player.name + "'s pegs on Row 1 have been removed! 😤");
      break;
    case 'wipeout2':
      Object.keys(gameState.board[2] || {}).forEach(pos => {
        const idx = gameState.board[2][pos].indexOf(player.color);
        if (idx !== -1) { gameState.board[2][pos].splice(idx, 1); player.pegs[2] = Math.max(0, (player.pegs[2] || 0) - 1); }
      });
      alert('Wipeout! ' + player.name + "'s pegs on Row 2 have been removed! 😤");
      break;
    case 'free_choice':
      alert('🎉 Free Choice! ' + player.name + ' can place a peg on any available slot!');
      // Find first available card slot and place peg there
      for (const row of BOARD_ROWS) {
        let placed = false;
        for (const slot of row.slots) {
          if (slot.cardSlot && !(gameState.board[row.row][slot.pos] || []).includes(player.color)) {
            if (!gameState.board[row.row][slot.pos]) gameState.board[row.row][slot.pos] = [];
            gameState.board[row.row][slot.pos].push(player.color);
            player.pegs[row.row] = (player.pegs[row.row] || 0) + 1;
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
      if (checkWin(player)) { renderBoard(); renderScoreBar(); showWinner(player); return; }
      break;
  }
}

// Win = player has at least one peg on every row (1-5)
function checkWin(player) {
  return [1, 2, 3, 4, 5].every(row => (player.pegs[row] || 0) > 0);
}

function showWinner(player) {
  document.getElementById('win-title').textContent = '🏆 ' + player.name + ' Wins!';
  document.getElementById('win-message').innerHTML =
    player.name + ' has placed pegs on all 5 rows and entered the Gateway to Heaven!<br><br>' +
    '🙏 Congratulations on memorizing God\'s Word from Isaiah! Hallelujah!';
  document.getElementById('win-modal').classList.remove('hidden');
}
