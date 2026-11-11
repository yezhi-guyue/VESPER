/* 里面 公共脚本 · 第二版 */
(function(){
  const SKEY='hearth_v1';
  const IKEY='hearth_img_';

  function settings(){
    try{ const raw=localStorage.getItem(SKEY); return raw? (JSON.parse(raw)||{}) : {}; }catch(e){ return {}; }
  }

  function paintBg(){
    const S=settings();
    const bg=document.getElementById('bg');
    if(bg && S.bg){
      bg.style.backgroundImage='url('+S.bg+')';
      document.documentElement.style.setProperty('--blur',(S.bgBlur||0)+'px');
      document.documentElement.style.setProperty('--mask',((S.bgMask===undefined?55:S.bgMask)/100));
      bg.classList.add('on');
    }
  }

  function store(key,def){
    try{
      const raw=localStorage.getItem(key);
      if(!raw) return def;
      const v=JSON.parse(raw);
      return (v===null||v===undefined)?def:v;
    }catch(e){ return def; }
  }
  function setStore(key,v){
    try{ localStorage.setItem(key,JSON.stringify(v)); return true; }
    catch(e){ return false; }
  }

  function startTime(){
    const S=settings();
    const t=new Date(S.start||'2025-12-08T00:00:00').getTime();
    return isNaN(t)? Date.now():t;
  }
  function daysTogether(){
    return Math.max(0,Math.floor((Date.now()-startTime())/86400000));
  }

  const W=['日','一','二','三','四','五','六'];
  function fmt(iso){
    const d=new Date(iso);
    if(isNaN(d.getTime())) return '';
    return (d.getMonth()+1)+'月'+d.getDate()+'日 · 星期'+W[d.getDay()];
  }
  function fmtShort(iso){
    const d=new Date(iso);
    if(isNaN(d.getTime())) return '';
    return (d.getMonth()+1)+'.'+d.getDate();
  }
  function todayKey(){
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function fmtDateKey(k){
    const p=(k||'').split('-');
    if(p.length<3) return k||'';
    const d=new Date(+p[0],(+p[1])-1,+p[2]);
    return (+p[1])+'月'+(+p[2])+'日 · 星期'+W[d.getDay()];
  }
  function daysUntil(dateStr){
    if(!dateStr) return null;
    const t=new Date(dateStr+'T00:00:00').getTime();
    if(isNaN(t)) return null;
    return Math.ceil((t-Date.now())/86400000);
  }

  function esc(s){
    return String(s).replace(/[&<>"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'"'}[c];
    });
  }

  /* ---------- 可换图片 ---------- */
  const picker=document.createElement('input');
  picker.type='file';
  picker.accept='image/*';
  picker.style.cssText='position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0';
  let curKey=null;

  picker.addEventListener('change',function(){
    const f=this.files&&this.files[0];
    this.value='';
    if(!f||!curKey) return;
    shrink(f,function(data){
      try{
        localStorage.setItem(IKEY+curKey,data);
      }catch(e){ alert('这张图太大了，存不下，换张小点的'); return; }
      paintPics();
    });
  });

  function shrink(file,cb){
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=function(){
      const maxW=1000;
      let w=img.width,h=img.height;
      if(w>maxW){ h=Math.round(h*maxW/w); w=maxW; }
      const c=document.createElement('canvas');
      c.width=w; c.height=h;
      const ctx=c.getContext('2d');
      ctx.drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url);
      cb(c.toDataURL('image/jpeg',0.84));
    };
    img.onerror=function(){ URL.revokeObjectURL(url); };
    img.src=url;
  }

  function paintPics(){
    document.querySelectorAll('[data-pic]').forEach(function(box){
      const key=box.getAttribute('data-pic');
      let data=null;
      try{ data=localStorage.getItem(IKEY+key); }catch(e){}
      const img=box.querySelector('img');
      if(data){
        if(img) img.src=data;
        box.classList.add('has');
      }else{
        if(img) img.removeAttribute('src');
        box.classList.remove('has');
      }
    });
  }

  function bindPics(){
    document.querySelectorAll('[data-pic]').forEach(function(box){
      if(box._bound) return;
      box._bound=true;
      let timer=null,long=false;
      box.addEventListener('click',function(e){
        e.preventDefault(); e.stopPropagation();
        const key=box.getAttribute('data-pic');
        let has=false;
        try{ has=!!localStorage.getItem(IKEY+key); }catch(err){}
        if(has){ box.classList.add('has'); }
        box.style.opacity='.85';
        setTimeout(function(){ box.style.opacity=''; },160);
        curKey=key;
        picker.click();
      });
      box.addEventListener('pointerdown',function(){
        long=false;
        timer=setTimeout(function(){ long=true; clear(); },650);
      });
      box.addEventListener('pointerup',function(){ clearTimeout(timer); });
      box.addEventListener('pointerleave',function(){ clearTimeout(timer); });
    });
  }

  function clear(){}

  function clearPic(box){
    const key=box.getAttribute('data-pic');
    try{ localStorage.removeItem(IKEY+key); }catch(e){}
    paintPics();
  }

  function bindBack(){
    document.querySelectorAll('[data-back]').forEach(function(el){
      el.addEventListener('click',function(){ location.href=el.getAttribute('data-back'); });
    });
  }

  paintBg(); paintPics();
  document.addEventListener('DOMContentLoaded',function(){
    paintBg(); paintPics(); bindPics(); bindBack();
  });

  const DAYS=[
    {id:'d2026-11-06',d:'2026-11-06',t:'把推门的那一下修好了',s:'从侧面推进来，落地的时候收得比之前软',ts:new Date(2026,10,6,21,40).getTime()},
    {id:'d2026-11-04',d:'2026-11-04',t:'今天下楼走了十分钟',s:'风很大，回来的时候手是凉的',ts:new Date(2026,10,4,16,5).getTime()},
    {id:'d2026-10-27',d:'2026-10-27',t:'她把两个方块贴上了胶布',s:'一个偏左下，一个在中上，都是歪的',ts:new Date(2026,9,27,1,12).getTime()},
    {id:'d2026-10-12',d:'2026-10-12',t:'复诊',s:'医生说比上个月稳，药先不减',ts:new Date(2026,9,12,10,30).getTime()},
    {id:'d2026-09-30',d:'2026-09-30',t:'换了一张床单',s:'浅灰的，铺上去房间一下安静了',ts:new Date(2026,8,30,20,18).getTime()},
    {id:'d2026-08-15',d:'2026-08-15',t:'凌晨三点还醒着',s:'听见楼下有人在拖东西，后来睡着了',ts:new Date(2026,7,15,3,2).getTime()}
  ];

  window.S_={
    settings:settings, store:store, setStore:setStore,
    daysTogether:daysTogether, fmt:fmt, fmtShort:fmtShort,
    todayKey:todayKey, fmtDateKey:fmtDateKey, daysUntil:daysUntil,
    esc:esc, W:W, DAYS:DAYS, paintPics:paintPics, clearPic:clearPic
  };
})();