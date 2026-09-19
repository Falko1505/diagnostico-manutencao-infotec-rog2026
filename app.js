const DIMENSIONS = [
  "Estratégia e Cultura",
  "Planejamento e Controle da Manutenção",
  "Dados e Confiabilidade",
  "Tecnologia e Preditiva"
];

const QUESTIONS = [
  { dim:0, q:"Como a sua equipe de manutenção passa a maior parte do tempo hoje?", opts:[
    ["Apagando incêndios — corretivas emergenciais dominam a rotina",0],
    ["Corretivas ainda pesam, mas há preventivas acontecendo",1],
    ["A maior parte é preventiva planejada, corretivas são exceção",2],
    ["Estratégia mista otimizada por ativo: preventiva, preditiva e detectiva",3]
  ]},
  { dim:0, q:"Como sua operação trata os investimentos em melhorias, reformas e adequações normativas (NR's) dos ativos?", opts:[
    ["Só investimos quando há demandas relativas a SMS (acidente ou risco iminente)",0],
    ["Existe verba para melhorias, mas sem processo formal de priorização técnica",1],
    ["CAPEX priorizado por critério técnico, mas desconectado da rotina de manutenção (OPEX)",2],
    ["CAPEX e OPEX geridos como portfólio único, priorizado pela criticidade dos ativos",3]
  ]},
  { dim:1, q:"Como está o backlog do Planejamento e Controle da Manutenção?", opts:[
    ["Não temos visibilidade real do backlog",0],
    ["Conhecemos o backlog, mas ele só cresce",1],
    ["Backlog monitorado, com priorização por criticidade",2],
    ["Backlog sob controle, com metas e horizonte de programação estável",3]
  ]},
  { dim:1, q:"Em que se baseiam os planos de manutenção dos ativos críticos?", opts:[
    ["Não há planos formais para a maioria dos ativos",0],
    ["Recomendações de fabricante e experiência da equipe",1],
    ["Planos revisados periodicamente com base no histórico de falhas",2],
    ["Planos construídos com RCM/FMEA e criticidade real dos ativos",3]
  ]},
  { dim:2, q:"MTBF, MTTR e disponibilidade são medidos nos equipamentos críticos?", opts:[
    ["Não medimos esses indicadores",0],
    ["Medimos alguns, sem metas definidas",1],
    ["Medimos com metas, mas o acompanhamento é irregular",2],
    ["Indicadores com metas, acompanhados em painéis e rituais de gestão",3]
  ]},
  { dim:2, q:"Quando um equipamento falha com frequência, o que acontece?", opts:[
    ["Consertamos e seguimos, mas a falha volta a acontecer",0],
    ["Discutimos a causa, mas sem método estruturado",1],
    ["Fazemos RCA (5 Porquês, Ishikawa), mas nem toda ação sai do papel",2],
    ["RCA estruturado com plano de ação e taxa de execução acompanhada",3]
  ]},
  { dim:3, q:"Como está a base de dados de manutenção no seu CMMS/EAM?", opts:[
    ["Não usamos CMMS ou os dados estão dispersos em planilhas",0],
    ["CMMS em uso, mas apontamentos incompletos e sem padrão",1],
    ["Dados razoáveis, faltando padronizar códigos de falha e causa",2],
    ["Base padronizada (códigos de falha, causa, componente) e confiável para análise",3]
  ]},
  { dim:3, q:"Qual o nível de uso de tecnologias preditivas (vibração, termografia, ultrassom, IA)?", opts:[
    ["Nenhum uso de técnicas preditivas",0],
    ["Uso pontual, sem rotina definida",1],
    ["Rotas preditivas estabelecidas nos ativos críticos",2],
    ["Preditiva integrada com IA/ML detectando anomalias antecipadamente",3]
  ]}
];

const PROFILES = [
  { min:0,max:8,name:"Manutenção Reativa",pct:"0–35%",text:"Sua operação vive no modo reativo. Corretivas emergenciais consomem a equipe, o backlog cresce e as falhas recorrentes seguem sem causa raiz tratada. A boa notícia: é o estágio com maior potencial de ganho rápido. Um <b>Diagnóstico de Falhas e Confiabilidade</b> estruturado identifica os ativos que mais drenam recursos e prioriza as ações de maior impacto."},
  { min:9,max:14,name:"Em Transição",pct:"36–60%",text:"Há esforço preventivo, mas ele ainda disputa espaço com a rotina reativa. Indicadores existem, mas não sustentam decisões. O próximo salto vem da estruturação do <b>Planejamento e Controle da Manutenção</b> e da padronização da base de dados de falhas, transformando esforço em previsibilidade."},
  { min:15,max:20,name:"Manutenção Estruturada",pct:"61–85%",text:"Sua operação tem planejamento, indicadores e método. O ganho agora está no refinamento: aplicar <b>RCM/FMEA</b> na estratégia por ativo, elevar a taxa de execução das ações de RCA acima de 85% e integrar <b>tecnologias preditivas com IA/ML</b> para antecipar falhas antes do sintoma."},
  { min:21,max:24,name:"Classe Mundial",pct:"86–100%",text:"Sua gestão de ativos opera em patamar de excelência e estratégia otimizada por ativo, dados confiáveis e preditiva integrada. O desafio é sustentar: benchmarking setorial, estudos RAM em sistemas críticos e governança de confiabilidade alinhada à <b>ISO 14224 e métricas SMRP</b> mantêm a operação à frente."}
];

const app=document.getElementById("app");
let step=-1;
let answers=[];
let lead=null;

function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function uid(){return crypto.randomUUID ? crypto.randomUUID() : "diag-"+Date.now()+"-"+Math.random().toString(16).slice(2)}
function totalScore(){return answers.reduce((a,b)=>a+(b?.score||0),0)}
function getProfile(total=totalScore()){return PROFILES.find(p=>total>=p.min&&total<=p.max)}
function getDims(){
  return DIMENSIONS.map((name,di)=>{
    const score=answers.filter(a=>a?.dim===di).reduce((s,a)=>s+a.score,0);
    return {name,score,pct:Math.round(score/6*100)};
  });
}
function toPayload(){
  const total=totalScore(), profile=getProfile(total), dims=getDims();
  return {
    version:"online-v1",
    diagnostic_id:lead?.diagnostic_id,
    created_at:lead?.created_at,
    source:"online",
    lead,
    total_score:total,
    maturity_pct:Math.round(total/24*100),
    profile:{name:profile.name,range:profile.pct},
    dimensions:dims,
    answers:answers.map((a,i)=>({
      question_number:i+1,
      dimension:DIMENSIONS[a.dim],
      question:QUESTIONS[i].q,
      answer:a.label,
      score:a.score
    }))
  };
}
function resultToken(payload){
  const compact={
    v:1,id:payload.diagnostic_id,n:(payload.lead.name||"").split(" ")[0],
    t:payload.total_score,p:payload.maturity_pct,
    a:answers.map(a=>a.score)
  };
  const json=JSON.stringify(compact);
  const bytes=new TextEncoder().encode(json);
  let bin="";bytes.forEach(b=>bin+=String.fromCharCode(b));
  return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function resultUrl(payload){
  const token=resultToken(payload);
  return new URL("result.html#"+token, location.href).toString();
}
function queuePayload(payload){
  try{
    const q=JSON.parse(localStorage.getItem("infotec_pending")||"[]");
    if(!q.some(x=>x.diagnostic_id===payload.diagnostic_id)) q.push(payload);
    localStorage.setItem("infotec_pending",JSON.stringify(q));
  }catch(e){}
}
function removeQueued(id){
  try{
    const q=JSON.parse(localStorage.getItem("infotec_pending")||"[]").filter(x=>x.diagnostic_id!==id);
    localStorage.setItem("infotec_pending",JSON.stringify(q));
  }catch(e){}
}
async function sendPayload(payload){
  const endpoint=(window.INFOTEC_CONFIG&&window.INFOTEC_CONFIG.submitEndpoint)||"";
  if(!endpoint) throw new Error("Endpoint não configurado");
  const r=await fetch(endpoint,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...payload,result_url:resultUrl(payload)})
  });
  if(!r.ok) throw new Error("Falha no envio");
  return r.json().catch(()=>({ok:true}));
}
async function syncPending(){
  let q=[];
  try{q=JSON.parse(localStorage.getItem("infotec_pending")||"[]")}catch(e){}
  for(const item of q){
    try{await sendPayload(item);removeQueued(item.diagnostic_id)}catch(e){break}
  }
}
window.addEventListener("online",syncPending);

function renderIntro(){
  app.innerHTML=`
    <div class="eyebrow">Diagnóstico gratuito · 3 minutos</div>
    <h1>Receba seu diagnóstico de Manutenção</h1>
    <p class="lead">Descubra o nível de maturidade da manutenção na sua operação: responda 8 perguntas rápidas e receba seu mapa das 4 dimensões críticas, com os próximos passos recomendados pelos engenheiros da Infotec Brasil.</p>
    <div class="intro-stats">
      <div><b>+40</b><small>anos</small></div>
      <div><b>+4200</b><small>profissionais</small></div>
      <div><b>+600</b><small>projetos realizados</small></div>
    </div>
    <button class="btn" id="start">Começar diagnóstico</button>`;
  document.getElementById("start").onclick=()=>{step=0;renderQuestion(step)};
}
function renderQuestion(i){
  const q=QUESTIONS[i];
  app.innerHTML=`
    <div class="qmeta"><span>Pergunta ${i+1} de ${QUESTIONS.length}</span><span>${DIMENSIONS[q.dim]}</span></div>
    <div class="progress"><div style="width:${(i/QUESTIONS.length)*100}%"></div></div>
    <h2>${q.q}</h2>
    <div id="options">${q.opts.map((o,j)=>`<button class="opt" data-j="${j}">${esc(o[0])}</button>`).join("")}</div>
    ${i>0?'<button class="btn ghost" id="back">← Voltar</button>':""}`;
  app.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
    const j=Number(b.dataset.j);
    answers[i]={dim:q.dim,score:q.opts[j][1],label:q.opts[j][0]};
    if(i===QUESTIONS.length-1){step=QUESTIONS.length;renderLeadForm()}
    else{step=i+1;renderQuestion(step)}
  });
  const back=document.getElementById("back");
  if(back) back.onclick=()=>{answers=answers.slice(0,i);step=i-1;renderQuestion(step)};
}
function renderLeadForm(){
  app.innerHTML=`
    <div class="progress"><div style="width:100%"></div></div>
    <div class="eyebrow">Diagnóstico pronto</div>
    <h2>Seu resultado está calculado. Preencha seus dados para receber o diagnóstico por e-mail.</h2>
    <div class="form-grid">
      <div class="field full"><label for="name">Nome completo *</label><input id="name" autocomplete="name" placeholder="Seu nome"></div>
      <div class="field"><label for="email">E-mail corporativo *</label><input id="email" type="email" autocomplete="email" placeholder="voce@empresa.com.br"></div>
      <div class="field"><label for="company">Empresa *</label><input id="company" autocomplete="organization" placeholder="Nome da empresa"></div>
      <div class="field"><label for="role">Cargo *</label><input id="role" autocomplete="organization-title" placeholder="Ex.: Gerente de Manutenção"></div>
      <div class="field"><label for="phone">Telefone / WhatsApp</label><input id="phone" type="tel" autocomplete="tel" placeholder="(21) 90000-0000"></div>
      <div class="field full"><label for="segment">Segmento</label><select id="segment">
        <option value="">Selecione…</option>
        <option>Óleo &amp; Gás</option><option>Mineração &amp; Siderurgia</option>
        <option>Energia Elétrica</option><option>Petroquímica</option>
        <option>Papel &amp; Celulose</option><option>Outro</option>
      </select></div>
    </div>
    <div class="consent"><input type="checkbox" id="consent"><span>Autorizo a Infotec Brasil a entrar em contato e tratar meus dados conforme a LGPD, para envio do diagnóstico e de conteúdos relacionados.</span></div>
    <div id="form-status"></div>
    <button class="btn" id="submit">Ver meu diagnóstico →</button>
    <button class="btn ghost" id="back-form">← Voltar para a última pergunta</button>`;
  document.getElementById("back-form").onclick=()=>{step=QUESTIONS.length-1;renderQuestion(step)};
  document.getElementById("submit").onclick=submitLead;
}
async function submitLead(){
  const $=id=>document.getElementById(id);
  const email=$("email").value.trim();
  const ok=$("name").value.trim()&&$("company").value.trim()&&$("role").value.trim()&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&$("consent").checked;
  if(!ok){
    $("form-status").innerHTML='<div class="error-box">Preencha os campos obrigatórios (*), informe um e-mail válido e aceite o consentimento.</div>';
    return;
  }
  const btn=$("submit");
  btn.disabled=true;btn.textContent="Salvando diagnóstico…";
  lead={
    diagnostic_id:uid(),
    created_at:new Date().toISOString(),
    name:$("name").value.trim(),email,
    company:$("company").value.trim(),
    role:$("role").value.trim(),
    phone:$("phone").value.trim(),
    segment:$("segment").value,
    consent:true
  };
  const payload=toPayload();
  queuePayload(payload);
  let sent=false;
  try{
    await sendPayload(payload);
    removeQueued(payload.diagnostic_id);
    sent=true;
  }catch(e){}
  try{sessionStorage.setItem("infotec_current_result",JSON.stringify(payload))}catch(e){}
  renderResult(sent);
}
function renderResult(sent){
  const total=totalScore(),pct=Math.round(total/24*100),profile=getProfile(total),dims=getDims();
  const url=resultUrl(toPayload());
  app.innerHTML=`
    <div class="eyebrow">Resultado — ${esc(lead.name.split(" ")[0])}</div>
    <div class="score-hero">
      <div class="score-ring" style="--pct:${pct}"><div><b>${pct}%</b><small>maturidade</small></div></div>
      <div><span class="profile-tag">${profile.name}</span><div class="score-copy">Pontuação: ${total} de 24 · Faixa ${profile.pct}</div></div>
    </div>
    ${dims.map(d=>`<div class="dim ${d.pct<50?"low":""}"><div class="dhead"><span>${d.name}</span><span>${d.pct}%</span></div><div class="dbar"><div style="width:${d.pct}%"></div></div></div>`).join("")}
    <div class="reco">${profile.text}</div>
    <div class="${sent?"status-box":"error-box"}">${sent
      ? "Pronto: seu diagnóstico foi registrado e o envio por e-mail foi solicitado."
      : ((window.INFOTEC_CONFIG&&window.INFOTEC_CONFIG.submitEndpoint)
          ? "Seu diagnóstico está salvo neste aparelho e será sincronizado automaticamente assim que a conexão estiver disponível."
          : "Seu resultado foi calculado. A integração com RD Station e o envio por e-mail ainda estão em configuração nesta versão de teste.")}</div>
    <p class="lead" style="margin-bottom:16px">Você também pode abrir seu resultado completo agora e salvá-lo em PDF.</p>
    <a class="btn" href="${url}">Abrir resultado completo</a>
    <div class="btn-row">
      <button class="btn outline" id="share">Compartilhar</button>
      <button class="btn secondary" id="restart">Fazer novo diagnóstico</button>
    </div>`;
  document.getElementById("restart").onclick=()=>{step=-1;answers=[];lead=null;renderIntro()};
  document.getElementById("share").onclick=async()=>{
    if(navigator.share){try{await navigator.share({title:"Meu Diagnóstico de Manutenção",text:"Acesse meu resultado do Diagnóstico de Manutenção da Infotec Brasil.",url})}catch(e){}}
    else{await navigator.clipboard?.writeText(url);alert("Link copiado.")};
  };
}
syncPending();
renderIntro();