(()=>{
  if(window.__NOVEN_UI_FIX__)return;
  window.__NOVEN_UI_FIX__=true;
  const ready=()=>{
    const result=document.getElementById('result');
    const answer=document.getElementById('answer');
    const sources=document.getElementById('sources');
    if(result){result.classList.remove('hidden');result.setAttribute('data-ready','true');}
    if(answer&&!answer.textContent.trim()){
      answer.textContent='Your answer will appear here.';
      answer.setAttribute('data-placeholder','true');
    }
    if(sources&&!sources.children.length){
      sources.innerHTML='<div class="empty-evidence">Sources will appear here when a question is answered.</div>';
    }
    const style=document.createElement('style');
    style.textContent=`#result.response-panel{display:grid!important;visibility:visible!important;opacity:1!important}#result .response-main{display:block!important;visibility:visible!important;min-height:220px}#result .answer{display:block!important;min-height:120px}#result .evidence{display:block!important;visibility:visible!important}#result .answer[data-placeholder="true"]{color:#9aa1aa;font-size:14px}`;
    document.head.appendChild(style);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
  window.addEventListener('noven:run',()=>{
    const a=document.getElementById('answer');if(a)a.removeAttribute('data-placeholder');
    const r=document.getElementById('result');if(r)r.classList.remove('hidden');
  });
})();
