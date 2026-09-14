(()=>{
  const skills=[
    {id:'answer',icon:'↗',name:'Answer',ar:'إجابة',hint:'Direct factual answers',prefix:''},
    {id:'research',icon:'⌕',name:'Research',ar:'بحث',hint:'Find and cite evidence',prefix:'Research this: '},
    {id:'explain',icon:'?',name:'Explain',ar:'شرح',hint:'Explain a topic simply',prefix:'Explain this: '},
    {id:'compare',icon:'⇄',name:'Compare',ar:'مقارنة',hint:'Compare two options',prefix:'Compare: '},
    {id:'summarize',icon:'≡',name:'Summarize',ar:'تلخيص',hint:'Condense a long topic',prefix:'Summarize: '},
    {id:'translate',icon:'文',name:'Translate',ar:'ترجمة',hint:'Translate between languages',prefix:'Translate: '},
    {id:'plan',icon:'✦',name:'Plan',ar:'خطة',hint:'Build a practical plan',prefix:'Build a plan for: '},
    {id:'code',icon:'</>',name:'Code',ar:'برمجة',hint:'Explain or generate code',prefix:'Help me code: '}
  ];
  const root=document.querySelector('.composer-wrap');
  const form=document.getElementById('chatForm');
  const q=document.getElementById('question');
  if(!root||!form||!q)return;

  const setSkill=id=>{
    const skill=skills.find(s=>s.id===id)||skills[0];
    q.dataset.skill=skill.id;
    document.querySelectorAll('.skill-pill').forEach(x=>x.classList.toggle('active',x.dataset.skill===skill.id));
    document.querySelectorAll('.mode').forEach(x=>x.classList.toggle('active',x.dataset.skill===skill.id));
    const p=skill.prefix||'';
    if(p&&!q.value.trim())q.value=p;
    else if(p&&!q.value.trim().startsWith(p))q.value=p+q.value.trim();
    q.focus();
    q.setSelectionRange(q.value.length,q.value.length);
    q.dispatchEvent(new Event('input',{bubbles:true}));
  };

  const old=document.getElementById('skillRail'); if(old) old.remove();
  const rail=document.createElement('div');
  rail.id='skillRail'; rail.className='skill-rail';
  rail.setAttribute('aria-label','NOVEN skills');
  rail.innerHTML=skills.map((s,i)=>`<button type="button" class="skill-pill ${i===0?'active':''}" data-skill="${s.id}" data-prefix="${s.prefix}"><span>${s.icon}</span><b data-en="${s.name}" data-ar="${s.ar}">${s.name}</b><small>${s.hint}</small></button>`).join('');
  root.insertBefore(rail,form);

  rail.querySelectorAll('.skill-pill').forEach(btn=>btn.addEventListener('click',()=>setSkill(btn.dataset.skill||'answer')));
  document.querySelectorAll('.mode[data-skill]').forEach(btn=>btn.addEventListener('click',()=>{
    setSkill(btn.dataset.skill||'answer');
    document.getElementById('question')?.scrollIntoView({behavior:'smooth',block:'center'});
  }));

  document.querySelectorAll('.suggestion[data-question]').forEach(btn=>btn.addEventListener('click',()=>{
    q.value=btn.dataset.question||'';
    setSkill('answer');
    form.requestSubmit();
  }));

  window.NOVEN_SKILLS=skills;
  window.NOVEN_SET_SKILL=setSkill;
  setSkill('answer');
})();
