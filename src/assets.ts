export const ImageAssets: { [key: string]: HTMLImageElement } = {};

const assetNames = [
  'sun', 'moon', 'eye', 'demon_eye', 'slime', 'bunny', 'guide',
  'zombie', 'copper_sword', 'terrablad', 'nightsedge', 'chest', 'anvil',
  'furnace', 'workbench', 'copper_coin', 'silver_coin', 'gold_coin', 'platinum_coin',
  'heart', 'life_crystal', 'mana_crystal', 'torch', 'hermes'
];

export function initAssets() {
  assetNames.forEach(name => {
    const img = new Image();
    img.src = `images/${name}.png`;
    ImageAssets[name] = img;
  });
}
