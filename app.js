const KEY="progress_tracker_v1";
let goals=load();

const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);

function load(){
  try{return JSON.parse(localStorage.getItem(KEY))||[]}
  catch{return[]}
}
function save(){localStorage.setItem(KEY,JSON.stringify(goals));render()}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function pct(g){return Math.min(100,Math.max(0,(Number(g.current)/Number(g.target))*100||0))}
function fmt(n){return Number(n).toLocaleString("ru-RU",{maximumFractionDigits:2})}
function showToast(t){const x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}

function render(){
  const visible=goals.filter(g=>g.featured);
  const overall=goals.length?goals.reduce((a,g)=>a+pct(g),0)/goals.length:0;
  $("#overallPercent").textContent=Math.round(overall)+"%";
  $("#ringText").textContent=Math.round(overall)+"%";
  $("#overallBar").style.width=overall+"%";
  $("#overallRing").style.background=`conic-gradient(var(--accent) ${overall*3.6}deg,#292e39 0deg)`;
  $("#overallMeta").textContent=`${goals.length} ${plural(goals.length,"цель","цели","целей")}`;

  const list=$("#featuredGoals");
  list.innerHTML=visible.map(goalHTML).join("");
  $("#emptyFeatured").classList.toggle("hidden",visible.length>0);
  renderManage();
}
function plural(n,a,b,c){n%=100;if(n>=11&&n<=19)return c;switch(n%10){case 1:return a;case 2:case 3:case 4:return b;default:return c}}
function goalHTML(g){
  const p=pct(g);
  return `<article class="goal-card">
    <div class="goal-head"><div><div class="goal-name">${esc(g.name)}</div>${g.description?`<div class="goal-desc">${esc(g.description)}</div>`:""}</div><div class="percent">${Math.round(p)}%</div></div>
    <div class="progress-track"><div class="progress-fill" style="width:${p}%"></div></div>
    <div class="goal-values"><span>${fmt(g.current)} ${esc(g.unit||"")}</span><span>из ${fmt(g.target)} ${esc(g.unit||"")}</span></div>
    <div class="goal-actions">
      <button class="small-btn" onclick="changeGoal('${g.id}',-1)">−</button>
      <button class="small-btn" onclick="editGoal('${g.id}')">Изменить</button>
      <button class="small-btn" onclick="changeGoal('${g.id}',1)">+1</button>
    </div>
  </article>`;
}
function renderManage(){
  $("#manageList").innerHTML=goals.length?goals.map(g=>`
    <div class="manage-row">
      <input type="checkbox" ${g.featured?"checked":""} onchange="toggleFeatured('${g.id}',this.checked)">
      <div class="grow"><strong>${esc(g.name)}</strong><div class="muted">${Math.round(pct(g))}% · ${fmt(g.current)}/${fmt(g.target)}</div></div>
      <button onclick="editGoal('${g.id}')">✎</button>
    </div>`).join(""):`<div class="empty"><p class="muted">Целей пока нет.</p></div>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

function openModal(id){$("#"+id).classList.remove("hidden")}
function closeModal(id){$("#"+id).classList.add("hidden")}
function resetForm(){
  $("#goalForm").reset();$("#goalId").value="";$("#goalCurrent").value=0;$("#goalTarget").value=100;$("#goalFeatured").checked=true;
  $("#modalTitle").textContent="Новая цель";$("#deleteGoalBtn").classList.add("hidden");
}
function addGoal(){resetForm();openModal("goalModal")}
function editGoal(id){
  const g=goals.find(x=>x.id===id);if(!g)return;
  $("#goalId").value=g.id;$("#goalName").value=g.name;$("#goalDescription").value=g.description||"";
  $("#goalCurrent").value=g.current;$("#goalTarget").value=g.target;$("#goalUnit").value=g.unit||"";$("#goalFeatured").checked=!!g.featured;
  $("#modalTitle").textContent="Изменить цель";$("#deleteGoalBtn").classList.remove("hidden");
  closeModal("manageModal");openModal("goalModal");
}
function changeGoal(id,delta){
  const g=goals.find(x=>x.id===id);if(!g)return;
  const step=g.target>=100?1:0.1;
  g.current=Math.max(0,Number(g.current)+delta*step);save();
}
function toggleFeatured(id,val){const g=goals.find(x=>x.id===id);if(g){g.featured=val;save()}}
$("#goalForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("#goalId").value;
  const data={name:$("#goalName").value.trim(),description:$("#goalDescription").value.trim(),current:Number($("#goalCurrent").value),target:Number($("#goalTarget").value),unit:$("#goalUnit").value.trim(),featured:$("#goalFeatured").checked};
  if(!data.name||data.target<=0)return;
  if(id){Object.assign(goals.find(g=>g.id===id),data);showToast("Цель обновлена")}
  else{goals.push({id:uid(),...data});showToast("Цель добавлена")}
  save();closeModal("goalModal");
});
$("#deleteGoalBtn").onclick=()=>{
  const id=$("#goalId").value;
  if(confirm("Удалить эту цель?")){goals=goals.filter(g=>g.id!==id);save();closeModal("goalModal");showToast("Цель удалена")}
};
$("#addGoalBtn").onclick=addGoal;
$("#manageBtn").onclick=()=>{renderManage();openModal("manageModal")};
$("#manageAddBtn").onclick=()=>{closeModal("manageModal");addGoal()};
$("#settingsBtn").onclick=()=>openModal("settingsModal");
$$("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
$$(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModal(m.id)}));
$$(".nav-item").forEach(b=>b.onclick=()=>{
  $$(".nav-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");
  if(b.dataset.page==="goals")openModal("manageModal");
});
$("#exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(goals,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="progress-backup.json";a.click();URL.revokeObjectURL(a.href);
};
$("#importInput").onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>{
    try{const data=JSON.parse(r.result);if(!Array.isArray(data))throw 0;goals=data.map(g=>({...g,id:g.id||uid()}));save();showToast("Данные импортированы")}
    catch{alert("Не удалось импортировать файл")}
  };r.readAsText(f);
};
$("#resetBtn").onclick=()=>{if(confirm("Удалить ВСЕ цели?")){goals=[];save();showToast("Данные удалены")}};
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
render();
