import fs from 'fs';
import path from 'path';

// 1. GatherDock.tsx
const dockPath = path.resolve('src/components/gather/GatherDock.tsx');
let lines = fs.readFileSync(dockPath, 'utf8').split(/\r?\n/);

// Add onOpenMeeting to Props interface if not already
let propIdx = lines.findIndex(l => l.includes('onOpenCustomizer: () => void;'));
if (propIdx !== -1 && !lines.some(l => l.includes('onOpenMeeting?: () => void;'))) {
  lines.splice(propIdx + 1, 0, '  onOpenMeeting?: () => void;');
}

// Add onOpenMeeting to parameters
let paramIdx = lines.findIndex(l => l.includes('onOpenCustomizer,'));
if (paramIdx !== -1 && !lines.some(l => l.includes('onOpenMeeting,'))) {
  lines.splice(paramIdx + 1, 0, '  onOpenMeeting,');
}

// Add Conference button right before {/* Media Toggles */}
let mediaIdx = lines.findIndex(l => l.includes('{/* Media Toggles */}'));
if (mediaIdx !== -1 && !lines.some(l => l.includes('Buka Video Conference & Breakout Room'))) {
  const confButton = [
    '        {/* Video Conference Launcher */}',
    '        {onOpenMeeting && (',
    '          <button',
    '            type="button"',
    '            onClick={onOpenMeeting}',
    '            aria-label="Buka Video Conference & Breakout Room"',
    '            title="Video Conference & Breakout Room"',
    '            className="px-2 sm:px-2.5 py-1.5 rounded border border-teal bg-teal/15 hover:bg-teal text-teal hover:text-soft transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"',
    '          >',
    '            <Video className="w-3.5 h-3.5 flex-shrink-0" />',
    '            <span className="hidden sm:inline">Konferensi</span>',
    '          </button>',
    '        )}',
    ''
  ];
  lines.splice(mediaIdx, 0, ...confButton);
}

fs.writeFileSync(dockPath, lines.join('\r\n'), 'utf8');
console.log('GatherDock.tsx successfully updated with Conference button');

// 2. App.tsx
const appPath = path.resolve('src/App.tsx');
let appLines = fs.readFileSync(appPath, 'utf8').split(/\r?\n/);

let dockCallIdx = appLines.findIndex(l => l.includes('onOpenCustomizer={() => setIsCustomizerOpen(true)}'));
if (dockCallIdx !== -1 && !appLines.some(l => l.includes('onOpenMeeting={handleOpenVideoConference}'))) {
  appLines.splice(dockCallIdx + 1, 0, '                onOpenMeeting={handleOpenVideoConference}');
}

fs.writeFileSync(appPath, appLines.join('\r\n'), 'utf8');
console.log('App.tsx successfully updated with onOpenMeeting prop');
