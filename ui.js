import Stats from 'stats.js';

let stats = new Stats();
stats.showPanel(1);
document.body.appendChild(stats.dom);

export { stats };