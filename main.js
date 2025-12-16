// ====================================
// DATA & STATE MANAGEMENT
// ====================================

const KANJI_SET = [
  {char: '日', meaning: 'den / slunce', reading: 'にち / ひ'},
  {char: '月', meaning: 'měsíc / měsíc (moon/month)', reading: 'げつ / つき'},
  {char: '火', meaning: 'oheň', reading: 'か / ひ'},
  {char: '水', meaning: 'voda', reading: 'すい / みず'},
  {char: '木', meaning: 'strom / dřevo', reading: 'もく / き'},
  {char: '金', meaning: 'zlato / peníze', reading: 'きん / かね'},
  {char: '土', meaning: 'země / půda', reading: 'ど / つち'},
  {char: '人', meaning: 'člověk', reading: 'じん / ひと'},
  {char: '大', meaning: 'velký', reading: 'だい / おお(きい)'},
  {char: '小', meaning: 'malý', reading: 'しょう / ちい(さい)'},
  {char: '天', meaning: 'nebe', reading: 'てん / あま'},
  {char: '山', meaning: 'hora', reading: 'さん / やま'},
  {char: '川', meaning: 'řeka', reading: 'せん / かわ'},
  {char: '花', meaning: 'květina', reading: 'か / はな'},
  {char: '空', meaning: 'obloha / vzduch', reading: 'くう / そら'},
  {char: '雨', meaning: 'déšť', reading: 'う / あめ'},
  {char: '子', meaning: 'dítě', reading: 'し / こ'},
  {char: '女', meaning: 'žena', reading: 'じょ / おんな'},
  {char: '男', meaning: 'muž', reading: 'だん / おとこ'},
  {char: '学', meaning: 'studium', reading: 'がく / まな(ぶ)'},
];

const ACHIEVEMENTS = [
  {id: 'first_correct', title: 'První správná!', desc: 'Odpověz správně poprvé', icon: '🎯', condition: (s) => s.totalCorrect >= 1},
  {id: 'streak_5', title: 'Na vlně', desc: 'Dosáhni 5 správných po sobě', icon: '🔥', condition: (s) => s.maxStreak >= 5},
  {id: 'streak_10', title: 'Neuvěřitelný!', desc: 'Dosáhni 10 správných po sobě', icon: '⚡', condition: (s) => s.maxStreak >= 10},
  {id: 'level_5', title: 'Pokročilý', desc: 'Dosáhni level 5', icon: '⭐', condition: (s) => s.level >= 5},
  {id: 'level_10', title: 'Expert', desc: 'Dosáhni level 10', icon: '🏆', condition: (s) => s.level >= 10},
  {id: 'total_50', title: 'Student', desc: 'Odpověz na 50 otázek', icon: '📚', condition: (s) => s.totalAnswered >= 50},
  {id: 'total_100', title: 'Učenec', desc: 'Odpověz na 100 otázek', icon: '🎓', condition: (s) => s.totalAnswered >= 100},
  {id: 'accuracy_90', title: 'Precizní', desc: 'Dosáhni 90% přesnosti (min 20 otázek)', icon: '🎯', condition: (s) => s.totalAnswered >= 20 && (s.totalCorrect / s.totalAnswered) >= 0.9},
];

// User profile state
let userProfile = {
  username: 'Uživatel',
  avatar: '👤',
  level: 1,
  totalXP: 0,
  achievements: [],
  stats: {
    totalAnswered: 0,
    totalCorrect: 0,
    totalWrong: 0,
    maxStreak: 0,
    bestScore: 0
  }
};

// Game state
let gameState = {
  pool: [...KANJI_SET],
  current: null,
  score: 0,
  streak: 0,
  progress: 0
};

// Flashcard state
let flashcardState = {
  currentIndex: 0,
  flipped: false
};

// Writing state
let writingState = {
  pool: [...KANJI_SET],
  current: null
};

// ====================================
// STORAGE MANAGEMENT
// ====================================

function loadUserProfile() {
  const saved = localStorage.getItem('chi_ryu_profile');
  if (saved) {
    userProfile = JSON.parse(saved);
  }
}

function saveUserProfile() {
  localStorage.setItem('chi_ryu_profile', JSON.stringify(userProfile));
}

function loadGameState() {
  const score = localStorage.getItem('ks_score');
  if (score) gameState.score = Number(score);
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

function shuffleArray(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function showNotification(message) {
  const notif = document.createElement('div');
  notif.className = 'notification';
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

function checkAchievements() {
  const stats = {
    ...userProfile.stats,
    level: userProfile.level,
    maxStreak: Math.max(userProfile.stats.maxStreak, gameState.streak)
  };
  
  ACHIEVEMENTS.forEach(ach => {
    if (!userProfile.achievements.includes(ach.id) && ach.condition(stats)) {
      userProfile.achievements.push(ach.id);
      showNotification(`🏆 Achievement: ${ach.title}!`);
      saveUserProfile();
    }
  });
}

// ====================================
// NAVIGATION
// ====================================

function switchPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  
  const page = document.getElementById(`page-${pageName}`);
  const tab = document.querySelector(`[data-page="${pageName}"]`);
  
  if (page) page.classList.add('active');
  if (tab) tab.classList.add('active');
  
  if (pageName === 'profile') updateProfilePage();
  if (pageName === 'flashcards') initFlashcards();
  if (pageName === 'writing') initWriting();
}

// ====================================
// GAME MODE
// ====================================

function renderKanjiList() {
  const list = document.getElementById('kanji-list');
  list.innerHTML = '';
  gameState.pool.forEach(k => {
    const el = document.createElement('div');
    el.className = 'tag';
    el.textContent = k.char + ' — ' + k.meaning;
    list.appendChild(el);
  });
}

function pickNext() {
  const feedback = document.getElementById('feedback');
  const next = document.getElementById('next');
  const answers = document.getElementById('answers');
  
  feedback.textContent = '';
  next.style.display = 'none';
  answers.innerHTML = '';

  if (gameState.pool.length === 0) {
    gameState.pool = [...KANJI_SET];
  }

  gameState.current = gameState.pool.splice(Math.floor(Math.random() * gameState.pool.length), 1)[0];
  document.getElementById('kanji').textContent = gameState.current.char;

  const choices = [gameState.current.meaning];
  while (choices.length < 4) {
    const c = KANJI_SET[Math.floor(Math.random() * KANJI_SET.length)].meaning;
    if (!choices.includes(c)) choices.push(c);
  }
  shuffleArray(choices).forEach((text, idx) => {
    const b = document.createElement('button');
    b.className = 'ans';
    b.innerHTML = `<span style="font-size:14px">${idx + 1}.</span>&nbsp;&nbsp;${text}`;
    b.onclick = () => choose(b, text);
    answers.appendChild(b);
  });

  updateProgress();
}

function choose(btn, text) {
  const answers = document.getElementById('answers');
  const feedback = document.getElementById('feedback');
  const next = document.getElementById('next');
  
  Array.from(answers.children).forEach(x => x.disabled = true);
  
  userProfile.stats.totalAnswered++;
  
  if (text === gameState.current.meaning) {
    btn.classList.add('correct');
    const xpGain = 10 * userProfile.level;
    gameState.score += xpGain;
    gameState.streak += 1;
    gameState.progress += 20;
    userProfile.totalXP += xpGain;
    userProfile.stats.totalCorrect++;
    userProfile.stats.maxStreak = Math.max(userProfile.stats.maxStreak, gameState.streak);
    feedback.textContent = `Správně! +${xpGain} xp`;
  } else {
    btn.classList.add('wrong');
    Array.from(answers.children).forEach(x => {
      if (x.textContent.includes(gameState.current.meaning)) x.classList.add('correct');
    });
    gameState.score = Math.max(0, gameState.score - 5);
    gameState.streak = 0;
    userProfile.stats.totalWrong++;
    feedback.textContent = 'Špatně — správná odpověď: ' + gameState.current.meaning;
    gameState.progress = Math.max(0, gameState.progress - 10);
  }

  localStorage.setItem('ks_score', gameState.score);
  userProfile.stats.bestScore = Math.max(userProfile.stats.bestScore, gameState.score);
  
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('streak').textContent = gameState.streak;
  document.getElementById('best').textContent = userProfile.stats.bestScore;
  
  saveUserProfile();
  checkAchievements();
  next.style.display = 'inline-block';
}

function updateProgress() {
  const needed = 100;
  if (gameState.progress >= needed) {
    userProfile.level++;
    gameState.progress = gameState.progress - needed;
    showNotification(`🎉 Level Up! Level ${userProfile.level}`);
    saveUserProfile();
  }
  const pct = Math.min(100, Math.floor((gameState.progress / needed) * 100));
  document.getElementById('prog').style.width = pct + '%';
  document.getElementById('level').textContent = userProfile.level;
}

// ====================================
// FLASHCARD MODE
// ====================================

function initFlashcards() {
  flashcardState.currentIndex = 0;
  flashcardState.flipped = false;
  updateFlashcard();
}

function updateFlashcard() {
  const k = KANJI_SET[flashcardState.currentIndex];
  document.getElementById('fc-kanji').textContent = k.char;
  document.getElementById('fc-meaning').textContent = k.meaning;
  document.getElementById('fc-reading').textContent = k.reading;
  document.getElementById('fc-counter').textContent = flashcardState.currentIndex + 1;
  document.getElementById('fc-total').textContent = KANJI_SET.length;
  
  const front = document.querySelector('.flashcard-front');
  const back = document.querySelector('.flashcard-back');
  
  if (flashcardState.flipped) {
    front.style.display = 'none';
    back.style.display = 'flex';
  } else {
    front.style.display = 'flex';
    back.style.display = 'none';
  }
}

// ====================================
// WRITING MODE
// ====================================

function initWriting() {
  if (writingState.pool.length === 0) {
    writingState.pool = [...KANJI_SET];
  }
  pickWritingNext();
}

function pickWritingNext() {
  const input = document.getElementById('wr-input');
  const feedback = document.getElementById('wr-feedback');
  
  input.value = '';
  input.disabled = false;
  feedback.textContent = '';
  
  if (writingState.pool.length === 0) {
    writingState.pool = [...KANJI_SET];
  }
  
  writingState.current = writingState.pool.splice(Math.floor(Math.random() * writingState.pool.length), 1)[0];
  document.getElementById('wr-kanji').textContent = writingState.current.char;
  document.getElementById('wr-meaning').textContent = writingState.current.meaning;
  input.focus();
}

function checkWriting() {
  const input = document.getElementById('wr-input');
  const feedback = document.getElementById('wr-feedback');
  const userAnswer = input.value.trim();
  
  if (!userAnswer) return;
  
  input.disabled = true;
  
  // Check if answer contains any of the readings (simplified check)
  const readings = writingState.current.reading.split('/').map(r => r.trim());
  const isCorrect = readings.some(r => userAnswer.includes(r) || r.includes(userAnswer));
  
  userProfile.stats.totalAnswered++;
  
  if (isCorrect) {
    feedback.textContent = `✅ Správně! Čtení: ${writingState.current.reading}`;
    feedback.style.color = 'rgb(194, 255, 170)';
    userProfile.stats.totalCorrect++;
    userProfile.totalXP += 15;
    setTimeout(pickWritingNext, 2000);
  } else {
    feedback.textContent = `❌ Špatně. Správné čtení: ${writingState.current.reading}`;
    feedback.style.color = 'rgb(255, 180, 180)';
    userProfile.stats.totalWrong++;
    setTimeout(pickWritingNext, 3000);
  }
  
  saveUserProfile();
  checkAchievements();
}

// ====================================
// PROFILE PAGE
// ====================================

function updateProfilePage() {
  document.getElementById('profile-avatar-display').textContent = userProfile.avatar;
  document.getElementById('username-input').value = userProfile.username;
  document.getElementById('profile-level').textContent = userProfile.level;
  document.getElementById('profile-xp').textContent = userProfile.totalXP;
  document.getElementById('profile-best').textContent = userProfile.stats.bestScore;
  
  const accuracy = userProfile.stats.totalAnswered > 0 
    ? Math.round((userProfile.stats.totalCorrect / userProfile.stats.totalAnswered) * 100) 
    : 0;
  document.getElementById('profile-accuracy').textContent = accuracy + '%';
  document.getElementById('profile-total').textContent = userProfile.stats.totalAnswered;
  document.getElementById('profile-maxstreak').textContent = userProfile.stats.maxStreak;
  
  // Update avatar selector
  document.querySelectorAll('.avatar-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.avatar === userProfile.avatar);
  });
  
  // Render achievements
  const achList = document.getElementById('achievements-list');
  achList.innerHTML = '';
  ACHIEVEMENTS.forEach(ach => {
    const div = document.createElement('div');
    const unlocked = userProfile.achievements.includes(ach.id);
    div.className = `achievement ${unlocked ? 'unlocked' : 'locked'}`;
    div.innerHTML = `
      <div class="achievement-icon">${ach.icon}</div>
      <div class="achievement-info">
        <div class="achievement-title">${ach.title}</div>
        <div class="achievement-desc">${ach.desc}</div>
      </div>
    `;
    achList.appendChild(div);
  });
}

// ====================================
// EVENT LISTENERS
// ====================================

function initEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchPage(tab.dataset.page));
  });
  
  // User chip
  document.getElementById('user-chip').addEventListener('click', () => switchPage('profile'));
  
  // Game mode
  document.getElementById('next').addEventListener('click', pickNext);
  document.getElementById('skip').addEventListener('click', () => {
    gameState.progress = Math.max(0, gameState.progress - 5);
    pickNext();
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Chceš opravdu resetovat všechna data?')) {
      gameState.score = 0;
      gameState.streak = 0;
      gameState.progress = 0;
      userProfile.level = 1;
      userProfile.totalXP = 0;
      userProfile.stats = {totalAnswered: 0, totalCorrect: 0, totalWrong: 0, maxStreak: 0, bestScore: 0};
      userProfile.achievements = [];
      localStorage.removeItem('ks_score');
      saveUserProfile();
      document.getElementById('score').textContent = 0;
      document.getElementById('streak').textContent = 0;
      document.getElementById('best').textContent = 0;
      document.getElementById('level').textContent = 1;
      updateProgress();
    }
  });
  document.getElementById('shuffle').addEventListener('click', () => {
    gameState.pool = shuffleArray([...KANJI_SET]);
    renderKanjiList();
    pickNext();
  });
  
  // Flashcards
  document.getElementById('fc-flip').addEventListener('click', () => {
    flashcardState.flipped = !flashcardState.flipped;
    updateFlashcard();
  });
  document.getElementById('fc-next').addEventListener('click', () => {
    flashcardState.currentIndex = (flashcardState.currentIndex + 1) % KANJI_SET.length;
    flashcardState.flipped = false;
    updateFlashcard();
  });
  document.getElementById('fc-prev').addEventListener('click', () => {
    flashcardState.currentIndex = (flashcardState.currentIndex - 1 + KANJI_SET.length) % KANJI_SET.length;
    flashcardState.flipped = false;
    updateFlashcard();
  });
  
  // Writing mode
  document.getElementById('wr-check').addEventListener('click', checkWriting);
  document.getElementById('wr-skip').addEventListener('click', pickWritingNext);
  document.getElementById('wr-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkWriting();
  });
  
  // Profile
  document.getElementById('save-username').addEventListener('click', () => {
    userProfile.username = document.getElementById('username-input').value || 'Uživatel';
    document.getElementById('username').textContent = userProfile.username;
    saveUserProfile();
    showNotification('Jméno uloženo!');
  });
  
  document.querySelectorAll('.avatar-option').forEach(opt => {
    opt.addEventListener('click', () => {
      userProfile.avatar = opt.dataset.avatar;
      document.getElementById('user-avatar').textContent = userProfile.avatar;
      document.getElementById('profile-avatar-display').textContent = userProfile.avatar;
      document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      saveUserProfile();
    });
  });
  
  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    const currentPage = document.querySelector('.page.active').id;
    
    if (currentPage === 'page-game') {
      if (e.key >= '1' && e.key <= '4') {
        const idx = Number(e.key) - 1;
        const btn = document.getElementById('answers').children[idx];
        if (btn && !btn.disabled) btn.click();
      }
      if (e.key === ' ') {
        e.preventDefault();
        const next = document.getElementById('next');
        if (next.style.display !== 'none') next.click();
      }
    }
  });
}

// ====================================
// INITIALIZATION
// ====================================

function init() {
  loadUserProfile();
  loadGameState();
  
  // Update UI
  document.getElementById('username').textContent = userProfile.username;
  document.getElementById('user-avatar').textContent = userProfile.avatar;
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('streak').textContent = gameState.streak;
  document.getElementById('best').textContent = userProfile.stats.bestScore;
  document.getElementById('level').textContent = userProfile.level;
  
  renderKanjiList();
  pickNext();
  initEventListeners();
}

// Start the app
init();