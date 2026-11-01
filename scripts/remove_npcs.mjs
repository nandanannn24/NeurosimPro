import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/game/scenes/OfficeScene.ts');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Remove NPCData interface
code = code.replace(/interface NPCData \{[\s\S]*?\}/, '');

// 2. Remove NPC_POSITIONS
code = code.replace(/\/\/ NPC spawn positions per official specification[\s\S]*?const NPC_POSITIONS = \{[\s\S]*?\} as const;/, '');

// 3. Remove npcs property and activeNpcNear
code = code.replace(/private npcs: NPCData\[\] = \[\];/, '');
code = code.replace(/private activeNpcNear: NPCData \| null = null;/, '');

// 4. Remove buildNPCs call and collider loop
code = code.replace(
  /\/\/ 8\. Spawn NPCs \(Bu Rina, Dimas, Pak Hendra\)[\s\S]*?for \(const npc of this\.npcs\) \{[\s\S]*?this\.physics\.add\.collider\(this\.player, npc\.sprite\);[\s\S]*?\}/,
  '// 8. Physics Colliders\n    this.physics.add.collider(this.player, this.obstacles);'
);

// 5. Add executive seat in Executive Suite
code = code.replace(
  "this.addDecorativeProp('office-chair', 2150, 155).setDepth(150);",
  "this.addDecorativeProp('office-chair', 2150, 155).setDepth(150);\n    this.addSeat('Kursi Pimpinan Eksekutif', 2150, 160, 'south', 'chair', 0, 4);"
);

// 6. Remove NPC interaction block in checkInteractions
code = code.replace(
  /\/\/ 2\. Proximity to NPCs[\s\S]*?if \(this\.activeNpcNear\) \{[\s\S]*?return;\r?\n\s*\}/,
  '// 2. Proximity to Sittable Seats'
);

// 7. Support [SPASI] or [E] to sit down
code = code.replace(
  'if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {',
  'if (Phaser.Input.Keyboard.JustDown(this.keySpace) || Phaser.Input.Keyboard.JustDown(this.keyE)) {'
);

// 8. Remove buildNPCs & spawnNpc methods
code = code.replace(
  /\/\/ =========================================================================\r?\n\s*\/\/ NPC CREATION\r?\n\s*\/\/ =========================================================================[\s\S]*?private spawnNpc\([\s\S]*?this\.npcs\.push\(\{ id, name, role, sprite, scenarioId \}\);\r?\n\s*\}/,
  ''
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully cleaned OfficeScene.ts without NPCs');

