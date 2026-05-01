'use strict';
const { HS_KEY } = BB;

BB.loadHS = function() {
  try {
    const d = JSON.parse(localStorage.getItem(HS_KEY) || '{}');
    const o = {};
    for (let i = 1; i <= 4; i++) o[i] = (d[i] || []).slice(0, 10);
    return o;
  } catch (e) {
    return { 1: [], 2: [], 3: [], 4: [] };
  }
};

BB.saveHS = function(hs) {
  localStorage.setItem(HS_KEY, JSON.stringify(hs));
};

BB.isTop = function(hs, diff, score) {
  const l = hs[diff] || [];
  return l.length < 10 || score > l[l.length - 1].score;
};

BB.addScore = function(hs, diff, name, score) {
  const l = hs[diff] || [];
  l.push({ name, score, date: new Date().toLocaleDateString('it-IT') });
  l.sort((a, b) => b.score - a.score);
  hs[diff] = l.slice(0, 10);
  BB.saveHS(hs);
};
