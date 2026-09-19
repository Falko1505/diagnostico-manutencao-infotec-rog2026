const statusBox=document.getElementById("backup-status");
const rows=document.getElementById("backup-rows");
let records=[];

function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}

function formatDate(value){
  try{return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(value))}catch(e){return value||"—"}
}

async function refresh(){
  if(!window.InfotecStore){
    statusBox.className="error-box";
    statusBox.textContent="O armazenamento local não está disponível neste navegador.";
    return;
  }
  records=await window.InfotecStore.listAll();
  const summary=await window.InfotecStore.stats();
  document.getElementById("stat-total").textContent=summary.total;
  document.getElementById("stat-synced").textContent=summary.synced;
  document.getElementById("stat-pending").textContent=summary.pending;
  statusBox.className=summary.pending?"offline-box":"status-box";
  statusBox.textContent=summary.pending
    ?`${summary.pending} diagnóstico${summary.pending===1?" está":"s estão"} aguardando sincronização.`
    :summary.total?"Todos os diagnósticos locais estão sincronizados.":"Nenhum diagnóstico foi registrado neste aparelho.";
  rows.innerHTML=records.length?records.map(record=>{
    const payload=record.payload||{};
    const lead=payload.lead||{};
    return `<tr>
      <td>${esc(formatDate(record.created_at))}</td>
      <td>${esc(lead.name)}</td>
      <td>${esc(lead.email)}</td>
      <td>${esc(payload.maturity_pct)}% · ${esc(payload.profile?.name)}</td>
      <td><span class="backup-pill ${record.status}">${record.status==="synced"?"Sincronizado":"Pendente"}</span></td>
    </tr>`;
  }).join(""):'<tr><td colspan="5">Nenhum registro local.</td></tr>';
}

async function sendPayload(payload){
  const endpoint=window.INFOTEC_CONFIG?.submitEndpoint||"";
  if(!endpoint)throw new Error("Endpoint não configurado");
  const response=await fetch(endpoint,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
  });
  if(!response.ok)throw new Error(`Falha no envio (${response.status})`);
}

document.getElementById("sync-now").onclick=async()=>{
  if(!navigator.onLine){
    statusBox.className="offline-box";
    statusBox.textContent="O totem está offline. Os registros continuam protegidos no backup local.";
    return;
  }
  const button=document.getElementById("sync-now");
  button.disabled=true;button.textContent="Sincronizando…";
  const pending=await window.InfotecStore.listPending();
  for(const record of pending){
    try{
      await sendPayload(record.payload);
      await window.InfotecStore.markSynced(record.diagnostic_id);
    }catch(error){
      await window.InfotecStore.markPending(record.diagnostic_id,error);
      break;
    }
  }
  button.disabled=false;button.textContent="Sincronizar agora";
  await refresh();
};

function download(name,type,content){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download=name;anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function csvCell(value){return `"${String(value??"").replace(/"/g,'""')}"`}

document.getElementById("export-json").onclick=()=>{
  download(`infotec-totem-backup-${new Date().toISOString().slice(0,10)}.json`,"application/json",JSON.stringify(records,null,2));
};

document.getElementById("export-csv").onclick=()=>{
  const header=["diagnostic_id","created_at","status","nome","email","empresa","cargo","telefone","segmento","score","maturidade_pct","perfil","dim_1_pct","dim_2_pct","dim_3_pct","dim_4_pct",...Array.from({length:8},(_,i)=>`q${i+1}`),"url_resultado"];
  const data=records.map(record=>{
    const payload=record.payload||{},lead=payload.lead||{},dimensions=payload.dimensions||[],answers=payload.answers||[];
    return [record.diagnostic_id,record.created_at,record.status,lead.name,lead.email,lead.company,lead.role,lead.phone,lead.segment,payload.total_score,payload.maturity_pct,payload.profile?.name,...Array.from({length:4},(_,i)=>dimensions[i]?.pct),...Array.from({length:8},(_,i)=>answers[i]?.answer),payload.result_url].map(csvCell).join(",");
  });
  download(`infotec-totem-backup-${new Date().toISOString().slice(0,10)}.csv`,"text/csv;charset=utf-8",`\uFEFF${header.map(csvCell).join(",")}\n${data.join("\n")}`);
};

refresh().catch(error=>{
  statusBox.className="error-box";
  statusBox.textContent=`Não foi possível abrir o backup local: ${error.message}`;
});
