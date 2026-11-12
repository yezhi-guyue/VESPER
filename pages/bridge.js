/* 里外桥 · 数据落到文件里 */
(function(){
  var FILE='file:///data/user/0/com.ai.assistance.operit/files/workspace/VESPER/data/ls.json';
  var CH=180000;

  function readAll(){
    var tries=[FILE, FILE.replace('file://','')];
    for(var i=0;i<tries.length;i++){
      try{
        var x=new XMLHttpRequest();
        x.open('GET', tries[i], false);
        x.send(null);
        var t=x.responseText||'';
        if(!t.replace(/\s/g,'')) continue;
        var o=JSON.parse(t);
        if(o && typeof o==='object') return o;
      }catch(e){}
    }
    return null;
  }

  var orig=null;
  try{ orig=window.localStorage; }catch(e){}

  var mem={}, touch={}, got=false;
  var fromFile=null;
  /* 先看盘上的真文件；ls.js里那份只是启动时的快照，可能已经旧了 */
  fromFile=readAll();
  if(!fromFile){
    try{ if(window.__LS_SEED && typeof window.__LS_SEED==='object') fromFile=window.__LS_SEED; }catch(e){}
  }
  if(fromFile){
    got=true;
    for(var k in fromFile){ if(fromFile.hasOwnProperty(k)) mem[k]=fromFile[k]; }
  }else if(orig){
    try{
      for(var i=0;i<orig.length;i++){
        var kk=orig.key(i);
        mem[kk]=orig.getItem(kk);
      }
    }catch(e){}
  }

  var dirty=false, timer=null, chain=null, busyUntil=0;

  function send(json){
    var n=Math.max(1, Math.ceil(json.length/CH));
    busyUntil = Date.now() + n*12 + 240;
    var sid=String(Date.now());
    var i=0;
    function step(){
      if(i>=n) return;
      var part=json.substr(i*CH, CH);
      var fr=document.getElementById('__lsb');
      if(!fr){
        fr=document.createElement('iframe');
        fr.id='__lsb';
        fr.style.cssText='display:none;width:0;height:0;border:0';
        (document.body||document.documentElement).appendChild(fr);
      }
      fr.src='hearthls:?i='+i+'&n='+n+'&s='+sid+'&d='+encodeURIComponent(part);
      i++;
      setTimeout(step, 12);
    }
    step();
  }

  function flush(){
    dirty=false;
    var disk=readAll();
    if(disk){
      got=true;
      for(var a in disk){
        if(disk.hasOwnProperty(a) && !touch[a]) mem[a]=disk[a];
      }
      for(var b in mem){
        if(mem.hasOwnProperty(b) && !touch[b] && !disk.hasOwnProperty(b)) delete mem[b];
      }
    }
    var json;
    try{ json=JSON.stringify(mem); }catch(e){ return; }
    touch={};
    if(!got) return;
    send(json);
  }

  function schedule(){
    dirty=true;
    clearTimeout(timer);
    timer=setTimeout(flush, 700);
    clearTimeout(chain);
    chain=setTimeout(flush, 2500);
  }

  var LS={
    getItem:function(k){ return Object.prototype.hasOwnProperty.call(mem, String(k))? mem[String(k)] : null; },
    setItem:function(k,v){ k=String(k); mem[k]=String(v); touch[k]=1; schedule(); },
    removeItem:function(k){ k=String(k); delete mem[k]; touch[k]=1; schedule(); },
    clear:function(){ for(var t in mem){ touch[t]=1; } mem={}; schedule(); },
    key:function(i){ var ks=Object.keys(mem); return i<ks.length? ks[i] : null; },
    get length(){ return Object.keys(mem).length; }
  };
  try{ Object.defineProperty(window, 'localStorage', { configurable:true, get:function(){ return LS; } }); }
  catch(e5){ try{ window.localStorage=LS; }catch(e6){} }

  /* 页面可以主动催一次落盘，比如删完东西立刻写 */
  window.__LS_FLUSH=function(){ try{ flush(); }catch(e){} };
  window.__LS_PENDING=function(){ return dirty; };
  /* 正在往文件里写的时候别急着跳页，否则后面几片会被页面卸载掐掉 */
  window.__LS_BUSY=function(){ return Date.now() < busyUntil; };
  window.__LS_WHEN_IDLE=function(cb){
    var t=setInterval(function(){
      if(Date.now() >= busyUntil){ clearInterval(t); try{ cb(); }catch(e){} }
    }, 40);
  };
  /* 重新从文件读一份最新的进来：页面被复用、没重新加载时用 */
  window.__LS_RELOAD=function(){
    try{
      if(dirty){ try{ flush(); }catch(e){} }
      var d=readAll();
      if(!d) return false;
      got=true;
      for(var k in mem){ if(mem.hasOwnProperty(k) && !d.hasOwnProperty(k)) delete mem[k]; }
      for(var k2 in d){ if(d.hasOwnProperty(k2)) mem[k2]=d[k2]; }
      return true;
    }catch(e){ return false; }
  };

  window.addEventListener('pagehide', function(){ if(dirty) flush(); });
  window.addEventListener('beforeunload', function(){ if(dirty) flush(); });
  setTimeout(function(){ if(!fromFile && orig && orig.length) flush(); }, 1500);
})();