import Phaser from 'phaser';

/**
 * BootScene — preloads visual assets, displays NeuroSim Pro logo on loading,
 * then registers accurate animation frames and transitions to OfficeScene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    const { width, height } = this.scale;

    // 0. Preload logo first for display during asset loading
    this.load.image('company-logo', '/logo.webp');

    // --- Loading UI ---
    const logoPlaceholder = this.add.rectangle(width / 2, height / 2 - 70, 72, 72, 0x242a38, 0);
    const title = this.add.text(width / 2, height / 2 - 20, 'NEUROSIM PRO', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      color: '#e0b65d',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const bar = this.add.rectangle(width / 2, height / 2 + 30, 320, 20, 0x242a38);
    const fill = this.add.rectangle(width / 2 - 156, height / 2 + 30, 0, 14, 0x355c5a).setOrigin(0, 0.5);
    const label = this.add.text(width / 2, height / 2 + 60, 'Memuat lingkungan kantor virtual & karakter...', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#a7b7bb',
    }).setOrigin(0.5);

    this.load.on('filecomplete-image-company-logo', () => {
      this.add.image(width / 2, height / 2 - 70, 'company-logo').setScale(0.12).setOrigin(0.5);
      logoPlaceholder.destroy();
    });

    this.load.on('progress', (v: number) => {
      fill.width = 312 * v;
    });

    this.load.on('complete', () => {
      title.destroy();
      bar.destroy();
      fill.destroy();
      label.destroy();
    });

    // 1. Office ground map (WebP, 2752×1536)
    this.load.image('office-ground', '/assets/maps/rooms-ground.webp');

    // 2. Office Props (Modular & Directional Assets)
    const propNames = [
      'desk', 'office-chair', 'office-chair-north', 'office-chair-east', 'office-chair-west',
      'computer', 'computer-north',
      'water-cooler', 'filing-cabinet', 'plant-large', 'plant-small',
      'sofa', 'sofa-north', 'sofa-east', 'sofa-west', 'coffee-table',
      'armchair', 'armchair-north', 'armchair-east', 'armchair-west',
      'counter', 'espresso-machine', 'pastry-case', 'bar-stool', 'fridge',
      'kitchen-cabinet', 'cafe-table', 'cafe-chair', 'bookcase', 'floor-lamp',
      'printer', 'rug', 'stove', 'sink', 'wall-art', 'wall-clock', 'wall-window',
      'parcel-stack', 'toolbox'
    ];
    for (const name of propNames) {
      this.load.image(`prop-${name}`, `/assets/props/${name}.png`);
    }

    // 3. Modular Character spritesheets (64×64 cell)
    const characters = [
      { key: 'char-resident', path: '/assets/characters/resident/aligned.png' },
      { key: 'char-office-worker', path: '/assets/characters/npc-rina.png' },
      { key: 'char-courier', path: '/assets/characters/npc-klien.png' },
      { key: 'char-barista', path: '/assets/characters/barista/aligned.png' },
      { key: 'char-cook', path: '/assets/characters/cook/aligned.png' },
      { key: 'char-maintenance-worker', path: '/assets/characters/maintenance-worker/aligned.png' },
      // Aliases
      { key: 'char-player', path: '/assets/characters/resident/aligned.png' },
      { key: 'char-rina', path: '/assets/characters/npc-rina.png' },
      { key: 'char-dimas', path: '/assets/characters/npc-dimas.png' },
      { key: 'char-klien', path: '/assets/characters/npc-klien.png' },
    ];

    for (const c of characters) {
      this.load.spritesheet(c.key, c.path, {
        frameWidth: 64,
        frameHeight: 64,
      });
    }
  }

  create(): void {
    const charKeys = [
      'char-resident',
      'char-office-worker',
      'char-courier',
      'char-barista',
      'char-cook',
      'char-maintenance-worker',
      'char-player',
      'char-rina',
      'char-dimas',
      'char-klien'
    ];
    for (const key of charKeys) {
      this.createAnimationsForCharacter(key);
    }
    this.scene.start('OfficeScene');
  }

  private createAnimationsForCharacter(key: string): void {
    // Idle animations: 9 frames per row (Row 0..3)
    const idleConfigs: { dir: string; start: number }[] = [
      { dir: 'south', start: 0 },  // Row 0: 0..8
      { dir: 'east', start: 9 },   // Row 1: 9..17
      { dir: 'north', start: 18 }, // Row 2: 18..26
      { dir: 'west', start: 27 },  // Row 3: 27..35
    ];
    for (const { dir, start } of idleConfigs) {
      if (!this.anims.exists(`${key}-idle-${dir}`)) {
        this.anims.create({
          key: `${key}-idle-${dir}`,
          frames: this.anims.generateFrameNumbers(key, { start, end: start + 8 }),
          frameRate: 3,
          repeat: -1,
        });
      }
    }

    // Walk animations: Exactly 8 active frames per row (Row 4..7)
    const walkConfigs: { dir: string; start: number }[] = [
      { dir: 'south', start: 36 }, // 36..43
      { dir: 'east', start: 45 },  // 45..52
      { dir: 'north', start: 54 }, // 54..61
      { dir: 'west', start: 63 },  // 63..70
    ];
    for (const { dir, start } of walkConfigs) {
      if (!this.anims.exists(`${key}-walk-${dir}`)) {
        this.anims.create({
          key: `${key}-walk-${dir}`,
          frames: this.anims.generateFrameNumbers(key, { start, end: start + 7 }),
          frameRate: 10,
          repeat: -1,
        });
      }
    }

    // Diagonal Walk Animations
    const diagonalWalkConfigs: { dir: string; start: number }[] = [
      { dir: 'south-east', start: 45 },
      { dir: 'south-west', start: 63 },
      { dir: 'north-east', start: 45 },
      { dir: 'north-west', start: 63 },
    ];
    for (const { dir, start } of diagonalWalkConfigs) {
      if (!this.anims.exists(`${key}-walk-${dir}`)) {
        this.anims.create({
          key: `${key}-walk-${dir}`,
          frames: this.anims.generateFrameNumbers(key, { start, end: start + 7 }),
          frameRate: 11,
          repeat: -1,
        });
      }
    }

    // Sitting animations for all 4 directions (Rows 8..11 if >= 108 frames, otherwise safe fallback)
    const texture = this.textures.get(key);
    const totalFrames = texture ? texture.frameTotal : 0;

    const sitConfigs: { dir: string; start: number; end: number }[] = totalFrames >= 108
      ? [
          { dir: 'south', start: 72, end: 80 }, // Row 8: 72..80 (duduk madep bawah)
          { dir: 'east', start: 81, end: 89 },  // Row 9: 81..89 (duduk madep kanan)
          { dir: 'north', start: 90, end: 98 }, // Row 10: 90..98 (duduk madep atas)
          { dir: 'west', start: 99, end: 107 }, // Row 11: 99..107 (duduk madep kiri)
        ]
      : [
          { dir: 'south', start: 0, end: 0 },
          { dir: 'east', start: 9, end: 9 },
          { dir: 'north', start: 18, end: 18 },
          { dir: 'west', start: 27, end: 27 },
        ];

    for (const { dir, start, end } of sitConfigs) {
      if (!this.anims.exists(`${key}-sit-${dir}`)) {
        this.anims.create({
          key: `${key}-sit-${dir}`,
          frames: this.anims.generateFrameNumbers(key, { start, end }),
          frameRate: 2,
          repeat: -1,
        });
      }
    }
  }
}
