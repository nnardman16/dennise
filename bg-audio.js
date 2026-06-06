(function(){
  function $(id){return document.getElementById(id);} 
  function getOrCreate(){
    let a = $('bgAudio');
    if(!a){
      a = document.createElement('audio');
      a.id = 'bgAudio';
      a.src = 'audio/song.mp3';
      a.loop = true;
      a.preload = 'auto';
      a.playsInline = true;
      document.body.insertBefore(a, document.body.firstChild);
    }
    // expose globally for legacy code
    window.bgAudio = a;
    return a;
  }
  const bgAudio = getOrCreate();

  const restoreTime = () => {
    try{
      const saved = sessionStorage.getItem('bgAudioTime');
      if(saved !== null){
        const t = Number(saved);
        if(!Number.isNaN(t)) bgAudio.currentTime = Math.max(0, t);
        sessionStorage.removeItem('bgAudioTime');
      }
    }catch(e){}
  };

  const attemptPlay = () => {
    try{
      bgAudio.muted = false;
      const p = bgAudio.play();
      if(p && p.catch) p.catch(()=>{});
      return p;
    }catch(e){}
    return null;
  };

  const unlockAudio = () => {
    try{
      if(bgAudio.paused){
        bgAudio.muted = false;
        const p = bgAudio.play();
        if(p && p.catch) p.catch(()=>{});
      }
    }catch(e){}
  };

  const tryUnlockOnInteraction = () => {
    unlockAudio();
    document.removeEventListener('pointerdown', tryUnlockOnInteraction, true);
    document.removeEventListener('keydown', tryUnlockOnInteraction, true);
    document.removeEventListener('touchstart', tryUnlockOnInteraction, true);
  };

  const restoreOnVisible = () => {
    if(document.visibilityState === 'visible' && !bgAudio.paused) return;
    if(sessionStorage.getItem('bgAudioShouldPlay') === '1' || bgAudio.paused){
      attemptPlay();
    }
  };

  // Restore saved time on load but don't autoplay. Use startBgAudio() from a user gesture.
  window.addEventListener('load', ()=>{
    if(bgAudio.readyState >= 1) restoreTime();
    else bgAudio.addEventListener('loadedmetadata', restoreTime, { once: true });
    // If a previous page requested playback, try to start now
    try{
      const should = sessionStorage.getItem('bgAudioShouldPlay');
      if(should === '1'){
        sessionStorage.removeItem('bgAudioShouldPlay');
        attemptPlay();
      }
    }catch(e){}

    window.addEventListener('beforeunload', ()=>{
      try{ sessionStorage.setItem('bgAudioTime', String(bgAudio.currentTime || 0)); }catch(e){}
    });
  });

  document.addEventListener('pointerdown', tryUnlockOnInteraction, { capture: true });
  document.addEventListener('keydown', tryUnlockOnInteraction, { capture: true });
  document.addEventListener('touchstart', tryUnlockOnInteraction, { capture: true });
  document.addEventListener('visibilitychange', restoreOnVisible);

  // Public controls
  window.startBgAudio = function(){
    try{
      bgAudio.muted = false;
      const p = bgAudio.play();
      if(p && p.catch) p.catch(()=>{});
    }catch(e){}
  };
  window.stopBgAudio = function(){
    try{ bgAudio.pause(); }catch(e){}
  };
})();
