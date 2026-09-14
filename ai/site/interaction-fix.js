(()=>{
  if(window.__NOVEN_INTERACTION_FIX__)return;
  window.__NOVEN_INTERACTION_FIX__=true;
  const ready=()=>{
    const q=document.getElementById('question');
    const form=document.getElementById('chatForm');
    if(!q||!form)return;
    const setSkill=(skill)=>{q.dataset.skill=skill||'answer';document.querySelectorAll('[data-skill]').forEach(b=>b.classList.toggle('active',b.dataset.skill===q.dataset.skill));q.focus();q.scrollIntoView({behavior:'smooth',block:'center'});};
    document.querySelectorAll('.mode[data-skill]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();setSkill(btn.dataset.skill);},{capture:true}));
    document.querySelectorAll('.suggestion[data-question]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();q.value=btn.dataset.question||'';q.dataset.skill=q.dataset.skill||'answer';q.dispatchEvent(new Event('input',{bubbles:true}));form.requestSubmit();},{capture:true}));
    document.querySelectorAll('.nav-item[href="#ask"]').forEach(btn=>btn.addEventListener('click',()=>setSkill('answer'),{capture:true}));
    const askLink=document.querySelector('.nav-item[href="#ask"]');
    if(askLink)askLink.addEventListener('click',()=>setTimeout(()=>q.focus(),50),{capture:true});
    window.NOVEN_INTERACTION={setSkill,ask:(text='')=>{if(text)q.value=text;setSkill('answer');if(q.value.trim())form.requestSubmit();}};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
