const Storage = {
  get(k, def=null){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):def; }catch{return def;} },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} },
  clear(){ localStorage.clear(); }
};
window.AppStorage = Storage;
