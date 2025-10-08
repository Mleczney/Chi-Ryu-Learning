    // Datová sada kanji — můžeš doplnit vlastní
    const KANJI_SET = [
      {char: '日', meaning: 'den / slunce', reading: 'にち / ひ'},
      {char: '月', meaning: 'měsíc / měsíc (moon/month)', reading: 'げつ / つき'},
      {char: '火', meaning: 'oheň', reading: 'か / ひ'},
      {char: '水', meaning: 'voda', reading: 'すい / みず'},
      {char: '木', meaning: 'strom', reading: 'もく / き'},
      {char: '金', meaning: 'zlato / peníze', reading: 'きん / かね'},
      {char: '土', meaning: 'země / půda', reading: 'ど / つち'},
      {char: '人', meaning: 'člověk', reading: 'じん / ひと'},
      {char: '大', meaning: 'velký', reading: 'だい / おお(きい)'},
      {char: '小', meaning: 'malý', reading: 'しょう / ちい(さい)'}
    ];

    // state
    let pool = [...KANJI_SET];
    let current = null;
    let score = Number(localStorage.getItem('ks_score')||0);
    let best = Number(localStorage.getItem('ks_best')||0);
    let streak = 0;
    let level = 1;
    let progress = 0;

    // dom
    const dom = {
      kanji: document.getElementById('kanji'),
      answers: document.getElementById('answers'),
      feedback: document.getElementById('feedback'),
      score: document.getElementById('score'),
      streak: document.getElementById('streak'),
      level: document.getElementById('level'),
      prog: document.getElementById('prog'),
      best: document.getElementById('best'),
      skip: document.getElementById('skip'),
      next: document.getElementById('next'),
      reset: document.getElementById('reset'),
      shuffle: document.getElementById('shuffle'),
      kanjiList: document.getElementById('kanji-list')
    };

    function init(){
      dom.score.textContent = score;
      dom.best.textContent = best;
      dom.streak.textContent = streak;
      renderList();
      pickNext();
      bindKeys();
    }

    function renderList(){
      dom.kanjiList.innerHTML = '';
      pool.forEach(k=>{
        const el = document.createElement('div'); el.className='tag'; el.textContent = k.char + ' — ' + k.meaning; dom.kanjiList.appendChild(el);
      })
    }

    function pickNext(){
      dom.feedback.textContent = '';
      dom.next.style.display='none';
      dom.answers.innerHTML='';

      if(pool.length===0){ pool = [...KANJI_SET]; }

      // pick random
      current = pool.splice(Math.floor(Math.random()*pool.length),1)[0];
      dom.kanji.textContent = current.char;

      // prepare options
      const choices = [current.meaning];
      while(choices.length<4){
        const c = KANJI_SET[Math.floor(Math.random()*KANJI_SET.length)].meaning;
        if(!choices.includes(c)) choices.push(c);
      }
      shuffleArray(choices);

      choices.forEach((text, idx)=>{
        const b = document.createElement('button'); b.className='ans'; b.innerHTML = `<span style="font-size:14px">${idx+1}.</span>&nbsp;&nbsp;${text}`;
        b.onclick = ()=>choose(b, text);
        dom.answers.appendChild(b);
      });

      // update progress UI
      updateProgress();
    }

    function choose(btn, text){
      // disable further clicks
      Array.from(dom.answers.children).forEach(x=>x.disabled=true);
      if(text===current.meaning){
        btn.classList.add('correct');
        score += 10 * level;
        streak += 1;
        progress += 20;
        dom.feedback.textContent = 'Správně! +'+(10*level)+' xp';
      } else {
        btn.classList.add('wrong');
        // highlight correct
        Array.from(dom.answers.children).forEach(x=>{ if(x.textContent.includes(current.meaning)) x.classList.add('correct'); });
        score = Math.max(0, score - 5);
        streak = 0;
        dom.feedback.textContent = 'Špatně — správná odpověď: ' + current.meaning;
        progress = Math.max(0, progress-10);
      }

      // save
      localStorage.setItem('ks_score', score);
      best = Math.max(best, score);
      localStorage.setItem('ks_best', best);
      dom.score.textContent = score;
      dom.streak.textContent = streak;
      dom.best.textContent = best;

      // show next
      dom.next.style.display='inline-block';
    }

    dom.next.addEventListener('click', ()=> pickNext());
    dom.skip.addEventListener('click', ()=>{ progress = Math.max(0, progress-5); pickNext(); });
    dom.reset.addEventListener('click', ()=>{
      if(confirm('Chceš opravdu resetovat skóre a progres?')){
        score=0;streak=0;progress=0;level=1;localStorage.removeItem('ks_score');localStorage.removeItem('ks_best');dom.score.textContent=0;dom.streak.textContent=0;dom.best.textContent=0;dom.level.textContent=1;updateProgress();
      }
    });
    dom.shuffle.addEventListener('click', ()=>{ pool = shuffleArray([...KANJI_SET]); renderList(); pickNext(); });

    function updateProgress(){
      const needed = 100;
      if(progress>=needed){ level++; progress = progress - needed; dom.level.textContent = level; }
      const pct = Math.min(100, Math.floor((progress/needed)*100));
      dom.prog.style.width = pct + '%';
      dom.level.textContent = level;
    }

    function shuffleArray(a){
      for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] }
      return a;
    }

    // keyboard shortcuts 1..4
    function bindKeys(){
      window.addEventListener('keydown', (e)=>{
        if(e.key>='1' && e.key<='4'){
          const idx = Number(e.key)-1; const btn = dom.answers.children[idx]; if(btn) btn.click();
        }
        if(e.key===' '){ e.preventDefault(); dom.next.click(); }
      });
    }

    // init
    init();