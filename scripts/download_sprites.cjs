const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'assets', 'sprites');
fs.mkdirSync(targetDir, { recursive: true });

const list = [
  { url: 'https://terraria.wiki.gg/images/e/e7/Eye_of_Cthulhu.png', name: 'eye.png' },
  { url: 'https://terraria.wiki.gg/images/1/18/Blue_Slime.png', name: 'slime.png' },
  { url: 'https://terraria.wiki.gg/images/c/c5/Bunny.png', name: 'bunny.png' },
  { url: 'https://terraria.wiki.gg/images/c/c7/Guide.png', name: 'guide.png' },
  { url: 'https://terraria.wiki.gg/images/e/e0/Gold_Chest.png', name: 'chest.png' },
  { url: 'https://terraria.wiki.gg/images/a/ab/Heart.png', name: 'heart.png' },
  { url: 'https://terraria.wiki.gg/images/1/11/Mana_Star.png', name: 'mana.png' },
  { url: 'https://terraria.wiki.gg/images/5/5a/Terra_Blade.png', name: 'terrablad.png' },
  { url: 'https://terraria.wiki.gg/images/6/69/Night%27s_Edge.png', name: 'nightsedge.png' },
  { url: 'https://terraria.wiki.gg/images/4/4e/Copper_Shortsword.png', name: 'copper_sword.png' },
  { url: 'https://terraria.wiki.gg/images/f/f3/Fallen_Star.png', name: 'fallen_star.png' },
  { url: 'https://terraria.wiki.gg/images/1/14/Sun.png', name: 'sun.png' },
  { url: 'https://terraria.wiki.gg/images/b/b3/Tree.png', name: 'tree.png' },
  { url: 'https://terraria.wiki.gg/images/3/30/Dirt_Block.png', name: 'dirt.png' },
  { url: 'https://terraria.wiki.gg/images/a/a9/Stone_Block.png', name: 'stone.png' },
  { url: 'https://terraria.wiki.gg/images/4/4a/Wood.png', name: 'wood.png' },
  { url: 'https://terraria.wiki.gg/images/d/df/Demon_Eye.png', name: 'demon_eye.png' },
  { url: 'https://terraria.wiki.gg/images/6/64/Zombie.png', name: 'zombie.png' },
  { url: 'https://terraria.wiki.gg/images/d/dc/Player.png', name: 'player.png' },
  { url: 'https://terraria.wiki.gg/images/1/13/Hermes_Boots.png', name: 'hermes.png' },
  { url: 'https://terraria.wiki.gg/images/b/b4/Life_Crystal.png', name: 'life_crystal.png' },
  { url: 'https://terraria.wiki.gg/images/8/87/Mana_Crystal.png', name: 'mana_crystal.png' },
  { url: 'https://terraria.wiki.gg/images/2/22/Anvil.png', name: 'anvil.png' },
  { url: 'https://terraria.wiki.gg/images/d/d4/Work_Bench.png', name: 'workbench.png' }
];

console.log('Starting sprite download...');
for (const item of list) {
  try {
    const dest = path.join(targetDir, item.name);
    const cmd = `curl.exe -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -H "Referer: https://terraria.wiki.gg/" -o "${dest}" "${item.url}"`;
    execSync(cmd);
    const stat = fs.statSync(dest);
    console.log(`[OK] ${item.name} (${stat.size} bytes)`);
  } catch (err) {
    console.error(`[FAIL] ${item.name}: ${err.message}`);
  }
}
console.log('Sprite download completed.');
