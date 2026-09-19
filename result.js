const DIMENSIONS=["Estratégia e Cultura","Planejamento e Controle da Manutenção","Dados e Confiabilidade","Tecnologia e Preditiva"];
const PROFILES=[
 {min:0,max:8,name:"Manutenção Reativa",pct:"0–35%",text:"Sua operação vive no modo reativo. Corretivas emergenciais consomem a equipe, o backlog cresce e as falhas recorrentes seguem sem causa raiz tratada. A boa notícia: é o estágio com maior potencial de ganho rápido. Um <b>Diagnóstico de Falhas e Confiabilidade</b> estruturado identifica os ativos que mais drenam recursos e prioriza as ações de maior impacto."},
 {min:9,max:14,name:"Em Transição",pct:"36–60%",text:"Há esforço preventivo, mas ele ainda disputa espaço com a rotina reativa. Indicadores existem, mas não sustentam decisões. O próximo salto vem da estruturação do <b>Planejamento e Controle da Manutenção</b> e da padronização da base de dados de falhas, transformando esforço em previsibilidade."},
 {min:15,max:20,name:"Manutenção Estruturada",pct:"61–85%",text:"Sua operação tem planejamento, indicadores e método. O ganho agora está no refinamento: aplicar <b>RCM/FMEA</b> na estratégia por ativo, elevar a taxa de execução das ações de RCA acima de 85% e integrar <b>tecnologias preditivas com IA/ML</b> para antecipar falhas antes do sintoma."},
 {min:21,max:24,name:"Classe Mundial",pct:"86–100%",text:"Sua gestão de ativos opera em patamar de excelência e estratégia otimizada por ativo, dados confiáveis e preditiva integrada. O desafio é sustentar: benchmarking setorial, estudos RAM em sistemas críticos e governança de confiabilidade alinhada à <b>ISO 14224 e métricas SMRP</b> mantêm a operação à frente."}
];
const root=document.getElementById("result-app");
function decodeToken(){
  const token=location.hash.slice(1);
  if(!token) return null;
  try{
    let b64=token.replace(/-/g,"+").replace(/_/g,"/");
    while(b64.length%4)b64+="=";
    const bin=atob(b64), bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }catch(e){return null}
}
function profile(t){return PROFILES.find(p=>t>=p.min&&t<=p.max)}
function dims(scores){
  return DIMENSIONS.map((name,di)=>{
    const indices=di===0?[0,1]:di===1?[2,3]:di===2?[4,5]:[6,7];
    const score=indices.reduce((s,i)=>s+(scores[i]||0),0);
    return {name,pct:Math.round(score/6*100)};
  });
}
function render(data){
  const p=profile(data.t), ds=dims(data.a), first=(data.n||"").split(" ")[0]||"Visitante";
  root.innerHTML=`
    <div class="print-only"><div class="eyebrow">Infotec Brasil · Diagnóstico de Manutenção</div></div>
    <div class="eyebrow result-kicker">Seu diagnóstico · ${first}</div>
    <div class="score-hero">
      <div class="score-ring" style="--pct:${data.p}"><div><b>${data.p}%</b><small>maturidade</small></div></div>
      <div><span class="profile-tag">${p.name}</span><div class="score-copy">Pontuação: ${data.t} de 24 · Faixa ${p.pct}</div></div>
    </div>
    ${ds.map(d=>`<div class="dim ${d.pct<50?"low":""}"><div class="dhead"><span>${d.name}</span><span>${d.pct}%</span></div><div class="dbar"><div style="width:${d.pct}%"></div></div></div>`).join("")}
    <div class="reco">${p.text}</div>
    <div class="result-actions">
      <button class="btn" id="pdf">Salvar resultado em PDF</button>
      <div class="btn-row">
        <button class="btn outline" id="share">Compartilhar</button>
        <a class="btn secondary" href="/">Fazer meu diagnóstico</a>
      </div>
      <p class="microcopy">No iPhone/Android, “Salvar em PDF” abre a impressão do sistema. Escolha “Salvar como PDF” ou “Compartilhar” para guardar o arquivo no celular.</p>
    </div>`;
  document.getElementById("pdf").onclick=()=>window.print();
  document.getElementById("share").onclick=async()=>{
    if(navigator.share){try{await navigator.share({title:"Meu Diagnóstico de Manutenção",text:`Meu resultado no Diagnóstico de Manutenção da Infotec Brasil: ${data.p}% — ${p.name}.`,url:location.href})}catch(e){}}
    else{await navigator.clipboard?.writeText(location.href);alert("Link copiado.")};
  };
}
const data=decodeToken();
if(!data || !Array.isArray(data.a) || data.a.length!==8 || typeof data.t!=="number"){
  root.innerHTML='<div class="eyebrow">Resultado indisponível</div><h2>Não foi possível abrir este diagnóstico.</h2><p class="lead">O link pode estar incompleto. Faça um novo diagnóstico ou solicite um novo acesso ao resultado.</p><a class="btn" href="/">Fazer diagnóstico</a>';
}else render(data);