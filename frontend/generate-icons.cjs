const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const iconSrc = 'C:\\Users\\anhph\\.gemini\\antigravity-ide\\brain\\f6946b5e-bc5c-4b1d-9156-893b2cb62e04\\gialai_app_icon_1790931775505.jpg';
const splashSrc = 'C:\\Users\\anhph\\.gemini\\antigravity-ide\\brain\\f6946b5e-bc5c-4b1d-9156-893b2cb62e04\\gialai_splash_screen_1790931790365.jpg';

const resDir = path.resolve(__dirname, 'android', 'app', 'src', 'main', 'res');

const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const splashConfigs = [
  { folder: 'drawable', w: 480, h: 800 },
  { folder: 'drawable-port-hdpi', w: 480, h: 800 },
  { folder: 'drawable-port-mdpi', w: 320, h: 480 },
  { folder: 'drawable-port-xhdpi', w: 720, h: 1280 },
  { folder: 'drawable-port-xxhdpi', w: 960, h: 1600 },
  { folder: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
  { folder: 'drawable-land-hdpi', w: 800, h: 480 },
  { folder: 'drawable-land-mdpi', w: 480, h: 320 },
  { folder: 'drawable-land-xhdpi', w: 1280, h: 720 },
  { folder: 'drawable-land-xxhdpi', w: 1600, h: 960 },
  { folder: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
];

async function run() {
  console.log('Generating app icons...');
  for (const [folder, size] of Object.entries(iconSizes)) {
    const dir = path.join(resDir, folder);
    fs.mkdirSync(dir, { recursive: true });
    
    await sharp(iconSrc)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    await sharp(iconSrc)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // Foreground (slightly larger for adaptive icon)
    const fgSize = Math.round(size * 1.5);
    await sharp(iconSrc)
      .resize(fgSize, fgSize, { fit: 'cover' })
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`  ✓ ${folder}: ${size}x${size}`);
  }

  console.log('\nGenerating splash screens...');
  for (const cfg of splashConfigs) {
    const dir = path.join(resDir, cfg.folder);
    fs.mkdirSync(dir, { recursive: true });

    await sharp(splashSrc)
      .resize(cfg.w, cfg.h, { fit: 'cover' })
      .png()
      .toFile(path.join(dir, 'splash.png'));

    console.log(`  ✓ ${cfg.folder}: ${cfg.w}x${cfg.h}`);
  }

  console.log('\n✅ All icons & splash screens generated!');
}

run().catch(console.error);
