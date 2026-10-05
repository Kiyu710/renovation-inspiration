export const TYPES = ['硬装','软装'];
export const STATUSES = ['待选购','比价中','已下单','已到货','已安装','已验收','已有沿用'];
export const money = value => value === null ? '未填' : new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY',maximumFractionDigits:2}).format(value);
export function amount(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100000000) throw new Error('金额须为0至1亿元之间的数字');
  return Math.round(n * 100) / 100;
}
const hard = [
 ['设计与施工深化',8000,'全屋','已付设计费也计入此项，避免重复计费。'],
 ['拆旧、保护与清运',12000,'全屋','含公共区域保护、装袋、搬运和外运。'],
 ['隔墙与门洞调整',8000,'全屋','只按最终核准方案施工；含书房分隔。'],
 ['老房基层修补',10000,'全屋','空鼓、找平、防裂、防潮；拆旧后核实。'],
 ['水电与弱电改造',24000,'全屋','强弱电、回路、给排水、网口；双人电脑位。'],
 ['防水与排水',10000,'厨卫','两卫及相关区域，含闭水试验。'],
 ['全屋地面与铺贴',22000,'全屋','含找平、损耗、美缝、踢脚线；勿与施工包重复。'],
 ['厨房特色墙砖',9000,'厨房','含腰线、铺贴、美缝与收口。'],
 ['两卫墙地砖',12000,'卫生间','含铺贴、美缝及壁龛构造。'],
 ['墙顶涂饰',7000,'全屋','含腻子、底面漆、调色与分色。'],
 ['吊顶与木工基层',14000,'全屋','局部吊顶、窗帘盒、灯槽与检修口。'],
 ['室内门与五金',8000,'全屋','门套、锁具、合页、门吸；玻璃隔断另计。'],
 ['玻璃与隔断',5000,'厨卫','纹理玻璃、淋浴隔断；确认安全玻璃及厚度。'],
 ['全屋定制收纳柜',38000,'全屋','玄关、客餐厅、衣柜、书房、走廊；含五金与安装，不含下列厨卫阳台柜。'],
 ['厨房定制柜与台面',17000,'厨房','含地吊柜、台面、抽屉及开孔安装。'],
 ['两卫浴室柜与镜柜',6000,'卫生间','含台盆时，不再计入卫浴洁具。'],
 ['阳台洗烘柜与台面',7000,'阳台','耐水材料、家务收纳与安装。'],
 ['卫浴洁具及固定配件',10000,'卫生间','马桶、花洒、龙头、地漏、角阀；不含已列柜体及玻璃。'],
 ['外窗修补与局部换窗',7000,'全屋','仅检查密封、纱窗及局部更换，不含全屋换窗。'],
 ['交付、安装杂费与搬家',12000,'全屋','保洁、检测、搬运、补货、监理及合同外安装；已含费用不重复计。']
];
const soft = [
 ['沙发',10000,'客厅'],['单椅与移动坐墩',3000,'客厅'],['茶几与边几',2500,'客厅'],['餐桌与餐椅',6000,'餐厅'],['成品柜与置物架',3000,'全屋'],['主卧床架与床垫',7000,'主卧'],['次卧床架与床垫',7000,'次卧'],['床头柜与卧室椅',2000,'卧室'],['双人升降桌',5000,'书房'],['显示器支架与理线',2000,'书房'],['人体工学椅两把',4000,'书房'],['灯具与灯带',4000,'全屋'],['窗帘与轨道安装',6500,'全屋'],['床品与地毯',4000,'卧室'],['装饰画、镜子与绿植',4000,'全屋'],['日用收纳与小用品',3000,'全屋'],['烟机与灶具',5000,'厨房'],['洗碗机',5500,'厨房'],['热水器与通风设备',3500,'厨卫'],['分体空调与安装',10000,'全屋'],['洗衣机',3000,'阳台'],['烘干机',2000,'阳台'],['路由器、交换机与影音配件',3000,'全屋'],['生活小电器',2000,'全屋'],['晾衣架与清洁设备',2000,'阳台']
];
export function initialData() {
 let i=0;
 const row=(type,name,estimate,room,notes='')=>({id:'base-'+(++i),type,name,estimate,actual:null,paid:null,room,notes,status:'待选购',priority:'普通',spec:'',vendor:'',links:[],images:[],included:true,archived:false,source:'本次建议分配',updatedAt:new Date().toISOString()});
 const items=[...hard.map(x=>row('硬装',...x)),...soft.map(x=>row('软装',...x))];
 for(const name of ['现有电视','现有冰箱','现有电脑与游戏设备']) items.push({...row('软装',name,0,'全屋','按原预算口径继续沿用，升级购置需另加预算。'),status:'已有沿用',source:'原预算沿用假设'});
 for(const [name,type] of [['全屋外窗更换','硬装'],['中央空调或新风','软装'],['净水器或蒸烤箱','软装'],['智能马桶升级','硬装'],['电脑与电竞设备升级','软装']]) items.push({...row(type,name,null,'全屋','选配项，尚未纳入预算；与原项重叠时先调整原项再纳入。'),included:false,source:'待询价选配'});
 return {version:1,reserve:45000,items};
}
export function totals(items,reserve=0) {
 const rows=items.filter(i=>!i.archived&&i.included);
 const sum=fn=>Math.round(rows.reduce((s,i)=>s+Math.round(fn(i)*100),0))/100;
 return {count:rows.length,estimate:sum(i=>i.estimate??0),actual:sum(i=>i.actual??0),paid:sum(i=>i.paid??0),pending:sum(i=>Math.max(0,(i.actual??0)-(i.paid??0))),forecast:sum(i=>i.actual??i.estimate??0)+reserve,missing:rows.filter(i=>i.actual===null).length,unpriced:rows.filter(i=>i.estimate===null).length,over:rows.filter(i=>i.actual!==null&&i.estimate!==null&&i.actual>i.estimate).length};
}
export function safeLink(value) {
 const url=new URL(value);
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password) throw new Error('链接请使用完整的 http:// 或 https:// 地址');
 return url.href;
}
export function validateBackup(data) {
 if(data?.version!==1 || !Array.isArray(data.items)||data.items.length>2000) throw new Error('不是有效的装修清单备份');
 const ids=new Set();
 const items=data.items.map(i=>{
  if(!i||typeof i.id!=='string'||!i.id||ids.has(i.id)||!TYPES.includes(i.type)||!STATUSES.includes(i.status)) throw new Error('备份项目格式不正确或编号重复');
  ids.add(i.id);
  for(const k of ['name','room','spec','vendor','notes','priority','source','updatedAt']) if(typeof i[k]!=='string'||i[k].length>5000) throw new Error('备份文字字段格式不正确');
  if(!i.name.trim()||typeof i.included!=='boolean'||typeof i.archived!=='boolean') throw new Error('备份项目不完整');
  if(!Array.isArray(i.links)||i.links.length>10||!Array.isArray(i.images)||i.images.length>4) throw new Error('备份图片或链接数量超限');
  const images=i.images.map(img=>{if(typeof img!=='string'||img.length>2500000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(img))throw new Error('备份包含无效图片');return img;});
  return {...i,estimate:amount(i.estimate),actual:amount(i.actual),paid:amount(i.paid),links:i.links.map(safeLink),images};
 });
 const reserve=amount(data.reserve); if(reserve===null)throw new Error('缺少预备金');
 return {version:1,reserve,items};
}
