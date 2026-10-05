import {initialData,totals,money,amount,safeLink,validateBackup,STATUSES} from './checklist-core.js';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data,db,editing=null,pictures=[],pendingImport=null;
const main=$('main');
const inspiration=document.createElement('div'); inspiration.id='inspirationPage';
while(main.firstChild)inspiration.append(main.firstChild);
main.append(inspiration);
main.insertAdjacentHTML('beforebegin','<nav class="app-tabs" aria-label="主要功能"><button id="inspirationTab" aria-pressed="true">灵感簿</button><button id="checklistTab" aria-pressed="false">装修清单</button></nav>');
main.insertAdjacentHTML('beforeend',`<section id="checklistPage" hidden>
 <header class="list-heading"><div><p class="list-kicker">从喜欢，到住进家里</p><h1>装修清单</h1><p>硬装落地，软装慢选。每一笔，心里有数。</p></div><button id="addItem" class="primary-button" disabled>＋ 添加项目</button></header>
 <details class="budget-source"><summary>预算依据：原概算35万—45万元，本次按40万元分配</summary><p>原清单只估算全屋总价，没有逐项报价。本次建议分配：硬装24.6万元、软装10.9万元、预备金4.5万元，均可自行修改。金额单位为人民币，每项填写整项总价，含该项数量、运费及安装，不自动乘数量。</p><p>中等国产配置、较多定制收纳、分体空调、外窗局部修补。电视、冰箱及游戏设备按已有沿用；全屋换窗、中央空调等作为选配，不纳入默认合计。施工总包已含的费用勿再次计入。</p></details>
 <div id="budgetSummary" class="budget-summary" aria-live="polite"></div>
 <div class="budget-options"><label>预备金（元） <input id="reserve" type="number" min="0" max="100000000" step="0.01" value="45000"></label><button id="saveReserve" class="secondary-button" disabled>保存预备金</button><span>预备金用于预留，不计入实际支出</span></div>
 <div class="list-filters"><label>分类<select id="listType"><option>全部</option><option>硬装</option><option>软装</option></select></label><label>状态<select id="listStatus"><option>全部</option>${STATUSES.map(s=>`<option>${s}</option>`).join('')}</select></label><label class="list-search">搜索<input id="listSearch" type="search" placeholder="项目、房间、商家或规格"></label><label class="list-check"><input id="listOver" type="checkbox">只看超预算</label><label class="list-check"><input id="listArchived" type="checkbox">已归档</label></div>
 <div id="listScope" class="list-scope"></div><p id="listError" class="list-error" role="alert"></p><div id="itemList" class="item-list">正在读取清单…</div>
 <section class="backup-bar"><div><strong>清单与参考图，一起备份</strong><p>保存在此浏览器，不会自动跨设备同步。换手机前导出备份，再在新设备导入。</p></div><button id="backupList" class="secondary-button" disabled>导出完整清单</button><label class="import-button">导入清单<input id="importList" type="file" accept=".json,application/json" disabled></label></section>
 <p class="list-footnote">备份包含清单、图片、链接和预备金，不包含灵感簿笔记。归档项目保留在“已归档”中，可随时恢复，不参与合计。</p>
</section>`);
document.body.insertAdjacentHTML('beforeend',`<dialog id="itemDialog" class="item-dialog"><form id="itemForm">
 <div class="dialog-heading"><h2 id="itemDialogTitle">编辑项目</h2><button type="button" id="closeItem" aria-label="关闭项目编辑">×</button></div>
 <p class="form-hint">费用均为整项总价；实际费用未确定时请留空。已付款可记录定金与阶段付款之和。</p>
 <div class="item-fields">
 <label class="wide">项目名称<input name="name" required maxlength="80"></label>
 <label>分类<select name="type"><option>硬装</option><option>软装</option></select></label><label>空间<input name="room" maxlength="40" placeholder="客厅 / 全屋"></label>
 <label>预计费用（元）<input name="estimate" type="number" min="0" max="100000000" step="0.01" placeholder="待询价"></label><label>实际费用（元）<input name="actual" type="number" min="0" max="100000000" step="0.01" placeholder="未确定请留空"></label>
 <label>已付款（元）<input name="paid" type="number" min="0" max="100000000" step="0.01" placeholder="含定金"></label><label>采购状态<select name="status">${STATUSES.map(s=>`<option>${s}</option>`).join('')}</select></label>
 <label>优先级<select name="priority"><option>普通</option><option>优先确定</option><option>可后置</option></select></label><label>商家 / 品牌<input name="vendor" maxlength="100"></label>
 <label class="wide">规格、尺寸与数量<input name="spec" maxlength="200" placeholder="例如：沙发280cm，1件；先核对电梯和入户门尺寸"></label>
 <label class="wide">商品 / 参考链接<textarea name="links" rows="3" placeholder="粘贴完整 http:// 或 https:// 链接，一行一个，最多10个"></textarea></label>
 <label class="wide">备注与费用包含范围<textarea name="notes" rows="3" maxlength="2000" placeholder="材质、交期、安装费、质保、待确认事项…"></textarea></label>
 <label class="wide list-check"><input name="included" type="checkbox">纳入预算（取消后作为选配，不参与汇总）</label>
 </div>
 <div class="image-field"><label>款式参考图（最多4张）<input id="itemImages" type="file" multiple accept="image/jpeg,image/png,image/webp"></label><p>支持JPG、PNG、WebP，每张原图不超过15MB；保存时压缩至最长边1200px。</p><div id="itemImagePreview" class="item-image-preview"></div></div>
 <p id="itemError" class="list-error" role="alert"></p><p id="itemSource" class="form-hint"></p>
 <div class="dialog-actions"><button type="button" id="archiveItem" class="secondary-button">归档项目</button><button type="submit" id="saveItem" class="primary-button">保存项目</button></div>
 </form></dialog>
 <dialog id="importDialog" class="item-dialog"><h2>恢复清单备份</h2><p id="importSummary"></p><p>这会替换此浏览器的整份装修清单，灵感簿笔记不受影响。建议先导出当前清单。</p><div class="dialog-actions"><button id="cancelImport" class="secondary-button">取消</button><button id="confirmImport" class="primary-button">替换并恢复</button></div><p id="importError" class="list-error" role="alert"></p></dialog>
 <dialog id="pictureDialog" class="picture-dialog"><button id="closePicture" aria-label="关闭图片">关闭</button><img id="largePicture" alt="款式参考图大图"></dialog>`);
const dialog=$('#itemDialog'),form=$('#itemForm');
function field(name){return form.elements.namedItem(name);}
function toast(message){window.showToast?.(message);}
function tab(checklist){inspiration.hidden=checklist;$('#checklistPage').hidden=!checklist;$('#inspirationTab').setAttribute('aria-pressed',String(!checklist));$('#checklistTab').setAttribute('aria-pressed',String(checklist));}
$('#inspirationTab').onclick=()=>tab(false);$('#checklistTab').onclick=()=>tab(true);
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('renovation-checklist',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('请关闭其他页面再重试'));});}
function read(){return new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('main');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function write(next){return new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(next,'main');tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||new Error('保存中断'));tx.onerror=()=>reject(tx.error);});}
async function commit(next){await write(next);data=next;render();}
function showSaveError(error,target='#itemError'){$(target).textContent=error.name==='QuotaExceededError'?'本机存储空间不足，未保存。请先导出备份并减少参考图。':error.message||'保存失败，请重试；未显示成功前请勿关闭页面。';}
function render(){
 const t=totals(data.items,data.reserve);
 $('#budgetSummary').innerHTML=[['预计费用',money(t.estimate),'不含预备金'],['已录实际',money(t.actual),`${t.missing}项实际未填，不代表0元`],['预计最终总额',money(t.forecast),'已填用实际，其余用预计，加预备金'],['已付款',money(t.paid),`已知待付 ${money(t.pending)}`]].map(([a,b,c])=>`<div><span>${a}</span><strong>${b}</strong><small>${c}</small></div>`).join('');
 $('#reserve').value=data.reserve;
 const type=$('#listType').value,status=$('#listStatus').value,q=$('#listSearch').value.trim().toLowerCase(),archived=$('#listArchived').checked,over=$('#listOver').checked;
 const rows=data.items.filter(i=>i.archived===archived&&(type==='全部'||type===i.type)&&(status==='全部'||status===i.status)&&(!over||(i.actual!==null&&i.estimate!==null&&i.actual>i.estimate))&&(!q||[i.name,i.room,i.vendor,i.spec,i.notes].join(' ').toLowerCase().includes(q)));
 const st=totals(rows.map(i=>({...i,archived:false})));
 $('#listScope').textContent=`当前${archived?'归档':''}筛选 ${rows.length}项 · ${archived?'恢复后将计入':'纳入预算的'}预计 ${money(st.estimate)} · 全清单 ${t.over}项超预算${t.unpriced?` · ${t.unpriced}项预计待询价`:''}（顶部为全清单合计）`;
 $('#itemList').innerHTML=rows.length?rows.map(i=>{
 const delta=i.actual!==null&&i.estimate!==null?Math.round((i.actual-i.estimate)*100)/100:null;
 return `<article class="cost-item ${!i.included?'optional':''}"><div class="cost-title"><span class="type-label">${i.type}</span><div><h3>${esc(i.name)}</h3><small>${esc(i.room||'未分空间')} · ${esc(i.status)}${i.priority==='普通'?'':' · '+esc(i.priority)}${i.included?'':' · 选配未计入'}</small></div><button class="edit-cost" data-edit="${esc(i.id)}" aria-label="编辑${esc(i.name)}">编辑</button></div>
 <div class="cost-values"><div><small>预计</small><strong>${money(i.estimate)}</strong></div><div><small>实际</small><strong>${money(i.actual)}</strong></div><div><small>${delta===null?'预算差额':delta>0?'超出预算':'较预算节省'}</small><strong class="${delta>0?'over-budget':''}">${delta===null?'待录实际':money(Math.abs(delta))}</strong></div></div>
 ${i.paid!==null?`<p class="payment-note">已付 ${money(i.paid)} · ${i.actual===null?'总价未定，待付未知':i.paid>i.actual?'已付高于实际，请核对':`待付 ${money(i.actual-i.paid)}`}</p>`:''}
 ${i.spec||i.vendor?`<p class="cost-detail">${esc([i.spec,i.vendor].filter(Boolean).join(' / '))}</p>`:''}
 ${i.notes?`<details class="item-notes"><summary>费用范围与备注</summary><p>${esc(i.notes)}</p></details>`:''}
 ${i.images.length?`<div class="reference-strip">${i.images.map((img,n)=>`<button data-picture="${esc(i.id)}" data-index="${n}" aria-label="查看${esc(i.name)}参考图${n+1}"><img src="${img}" alt="${esc(i.name)}参考图${n+1}" loading="lazy"></button>`).join('')}</div>`:''}
 ${i.links.length?`<div class="cost-links">${i.links.map((url,n)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">参考链接${n+1} ↗</a>`).join('')}</div>`:''}
 </article>`;
 }).join(''):'<div class="list-empty">没有符合条件的项目。可以调整筛选，或添加一个新项目。</div>';
}
for(const id of ['listType','listStatus','listSearch','listArchived','listOver'])$('#'+id).addEventListener('input',()=>data&&render());
function renderPictures(){$('#itemImagePreview').innerHTML=pictures.map((src,n)=>`<div><img src="${src}" alt="待保存参考图${n+1}"><button type="button" data-remove="${n}" aria-label="移除参考图${n+1}">移除</button></div>`).join('');}
function edit(id){
 editing=id?data.items.find(i=>i.id===id):null;
 const item=editing||{name:'',type:$('#listType').value==='软装'?'软装':'硬装',room:'',estimate:null,actual:null,paid:null,status:'待选购',priority:'普通',vendor:'',spec:'',notes:'',links:[],images:[],included:true};
 form.reset();for(const k of ['name','type','room','estimate','actual','paid','status','priority','vendor','spec','notes'])field(k).value=item[k]??'';
 field('links').value=item.links.join('\n');field('included').checked=item.included;pictures=[...item.images];renderPictures();
 $('#itemError').textContent='';$('#itemSource').textContent=editing?`预算来源：${item.source}。预计费用可随报价调整。`:'新增项目会加入你的清单。';
 $('#itemDialogTitle').textContent=editing?'编辑项目':'添加项目';$('#archiveItem').hidden=!editing;$('#archiveItem').textContent=editing?.archived?'恢复项目':'归档项目';dialog.showModal();field('name').focus();
}
$('#addItem').onclick=()=>edit();$('#closeItem').onclick=()=>dialog.close();
$('#itemList').onclick=e=>{const b=e.target.closest('[data-edit]');if(b)edit(b.dataset.edit);const p=e.target.closest('[data-picture]');if(p){$('#largePicture').src=data.items.find(i=>i.id===p.dataset.picture).images[Number(p.dataset.index)];$('#pictureDialog').showModal();}};
$('#closePicture').onclick=()=>$('#pictureDialog').close();
$('#itemImagePreview').onclick=e=>{const b=e.target.closest('[data-remove]');if(b){pictures.splice(Number(b.dataset.remove),1);renderPictures();}};
async function compress(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024)throw new Error('请选择15MB以内的JPG、PNG或WebP图片');
 const url=URL.createObjectURL(file);
 try{const img=new Image();img.src=url;await img.decode();const scale=Math.min(1,1200/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.82);}finally{URL.revokeObjectURL(url);}
}
$('#itemImages').onchange=async e=>{
 const files=[...e.target.files];$('#itemError').textContent='';
 $('#saveItem').disabled=true;$('#itemImages').disabled=true;$('#archiveItem').disabled=true;$('#closeItem').disabled=true;
 try{if(files.length+pictures.length>4)throw new Error('每个项目最多4张图，请先移除不需要的图片');const added=[];for(const file of files)added.push(await compress(file));pictures.push(...added);renderPictures();}catch(error){showSaveError(error);}finally{$('#saveItem').disabled=false;$('#itemImages').disabled=false;$('#archiveItem').disabled=false;$('#closeItem').disabled=false;e.target.value='';}
};
dialog.addEventListener('cancel',e=>{if($('#saveItem').disabled)e.preventDefault();});
form.onsubmit=async e=>{
 e.preventDefault();if($('#saveItem').disabled)return;$('#saveItem').disabled=true;$('#itemError').textContent='';
 try{
 const name=field('name').value.trim();if(!name)throw new Error('请填写项目名称');
 const links=field('links').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(safeLink);if(links.length>10)throw new Error('最多保存10条链接');
 const item={...(editing||{}),id:editing?.id||crypto.randomUUID(),name,links,images:[...pictures],included:field('included').checked,archived:editing?.archived||false,source:editing?.source||'自行新增',updatedAt:new Date().toISOString()};
 for(const k of ['type','room','status','priority','vendor','spec','notes'])item[k]=field(k).value.trim();
 for(const k of ['estimate','actual','paid'])item[k]=amount(field(k).value);
 if(editing&&item.estimate!==editing.estimate)item.source='自行调整';
 const items=editing?data.items.map(i=>i.id===editing.id?item:i):[item,...data.items];
 await commit({...data,items});dialog.close();toast('项目已保存在此浏览器');
 }catch(error){showSaveError(error);}finally{$('#saveItem').disabled=false;}
};
$('#archiveItem').onclick=async()=>{if(!editing)return;$('#archiveItem').disabled=true;try{await commit({...data,items:data.items.map(i=>i.id===editing.id?{...i,archived:!i.archived}:i)});dialog.close();toast(editing.archived?'已恢复项目':'已归档，可从已归档筛选恢复');}catch(e){showSaveError(e);}finally{$('#archiveItem').disabled=false;}};
$('#saveReserve').onclick=async()=>{try{const reserve=amount($('#reserve').value);if(reserve===null)throw new Error('请填写预备金，允许为0');await commit({...data,reserve});$('#listError').textContent='';toast('预备金已更新');}catch(e){showSaveError(e,'#listError');}};
$('#backupList').onclick=()=>{const blob=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`装修清单含图片-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
$('#importList').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>80*1024*1024)throw new Error('备份大于80MB，请使用较小的备份');pendingImport=validateBackup(JSON.parse(await file.text()));$('#importSummary').textContent=`备份含${pendingImport.items.length}个项目、${pendingImport.items.reduce((s,i)=>s+i.images.length,0)}张参考图，预备金${money(pendingImport.reserve)}。当前有${data.items.length}个项目。`;$('#importError').textContent='';$('#importDialog').showModal();}catch(error){showSaveError(error,'#listError');}finally{e.target.value='';}};
$('#cancelImport').onclick=()=>{$('#importDialog').close();pendingImport=null;};
$('#confirmImport').onclick=async()=>{if(!pendingImport)return;$('#confirmImport').disabled=true;try{await commit(pendingImport);pendingImport=null;$('#importDialog').close();toast('清单与图片已恢复');}catch(error){showSaveError(error,'#importError');}finally{$('#confirmImport').disabled=false;}};
try{db=await openDB();const stored=await read();if(stored){data=validateBackup(stored);}else{data=initialData();await write(data);}render();for(const id of ['addItem','saveReserve','backupList','importList'])$('#'+id).disabled=false;}catch(error){$('#itemList').textContent='暂时无法读取清单，请关闭隐私模式或检查浏览器存储权限后刷新。已有数据不会被重置。';showSaveError(error,'#listError');}
