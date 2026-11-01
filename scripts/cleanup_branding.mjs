import fs from 'fs';
import path from 'path';

// 1. characterOptions.ts
const charOptPath = path.resolve('src/config/characterOptions.ts');
let charOpt = fs.readFileSync(charOptPath, 'utf8');
charOpt = charOpt.replace("name: 'Rifat Abhista'", "name: 'Karyawan NeuroSim'");
fs.writeFileSync(charOptPath, charOpt, 'utf8');
console.log('Updated characterOptions.ts');

// 2. defaultRooms.ts
const defRoomsPath = path.resolve('src/config/defaultRooms.ts');
let defRooms = fs.readFileSync(defRoomsPath, 'utf8');
defRooms = defRooms.replace("name: 'Kantor Pusat NeuroSim (Ruang Kerja Utama)',", "name: 'Kantor Pusat NeuroSim Pro (Ruang Kerja Utama)',");
defRooms = defRooms.replace("hostName: 'Rifat Abhista',", "hostName: 'Administrator Kantor',");
defRooms = defRooms.replace("hostName: 'Priyoga',", "hostName: 'Tim Lead Desain',");
defRooms = defRooms.replace("hostName: 'Rifat',", "hostName: 'Manajer Operasional',");
defRooms = defRooms.replace("hostName: 'Dimas',", "hostName: 'Tim Community',");
fs.writeFileSync(defRoomsPath, defRooms, 'utf8');
console.log('Updated defaultRooms.ts');

// 3. index.html
const indexHtmlPath = path.resolve('index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
indexHtml = indexHtml.replace(
  '<title>NeuroSim — Simulasi Komunikasi Kantor</title>',
  '<title>NeuroSim PRO — Virtual Office Simulation & Remote Collaboration Platform</title>'
);
fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log('Updated index.html');

// 4. ProposalModal.tsx
const propModalPath = path.resolve('src/components/modals/ProposalModal.tsx');
let propModal = fs.readFileSync(propModalPath, 'utf8');
propModal = propModal.replace(/Hackathon INCEPTION 2026/g, 'NeuroSim Pro Architecture & Features');
propModal = propModal.replace(/Inception 2026/g, 'NeuroSim Pro Platform');
propModal = propModal.replace(/INCEPTION 2026/g, 'NEUROSIM PRO');
fs.writeFileSync(propModalPath, propModal, 'utf8');
console.log('Updated ProposalModal.tsx');

// 5. README.md
const readmePath = path.resolve('README.md');
let readme = fs.readFileSync(readmePath, 'utf8');
readme = readme.replace(/# 🏢 NEUROSIM — Virtual Office AI Communication Simulator/g, '# 🏢 NEUROSIM PRO — Virtual Office Simulation & Remote Collaboration Platform');
readme = readme.replace(/\[!\[Hackathon INCEPTION 2026\].*?\)\n/g, '');
readme = readme.replace(/- \*\*Rifat Abhista\*\*.*\n/g, '');
readme = readme.replace(/- \*\*Priyoga Listyo Ananda\*\*.*\n/g, '');
readme = readme.replace(/- \*\*Baginda Putra Krista\*\*.*\n/g, '');
readme = readme.replace(/Sesuai dengan ketentuan \*Hackathon INCEPTION 2026\*, kami mendeklarasikan/g, 'Berikut ini merupakan deklarasi transparansi pustaka dan aset pihak ketiga yang digunakan dalam');
readme = readme.replace(/Proyek ini dikembangkan untuk \*\*Hackathon INCEPTION 2026 \(HIMATIFA UPN "Veteran" Jawa Timur\)\*\./g, 'NEUROSIM PRO — Platform Simulasi Lingkungan Kantor Virtual dan Kolaborasi Tim Remote Terpadu.');
fs.writeFileSync(readmePath, readme, 'utf8');
console.log('Updated README.md');

