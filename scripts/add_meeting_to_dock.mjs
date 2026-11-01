import fs from 'fs';
import path from 'path';

// 1. GatherDock.tsx
const dockPath = path.resolve('src/components/gather/GatherDock.tsx');
let dock = fs.readFileSync(dockPath, 'utf8');

dock = dock.replace(
  '  onOpenCustomizer: () => void;\n}',
  '  onOpenCustomizer: () => void;\n  onOpenMeeting?: () => void;\n}'
);

dock = dock.replace(
  '  onOpenProfile,\n  onOpenCustomizer,\n}) => {',
  '  onOpenProfile,\n  onOpenCustomizer,\n  onOpenMeeting,\n}) => {'
);

const mediaDivider = '        <div className="w-[1px] h-6 bg-muted/20 mx-0.5" />\n\n        {/* Media Toggles */}';
const newMediaSection = `        <div className="w-[1px] h-6 bg-muted/20 mx-0.5" />

        {/* Video Conference Launcher */}
        {onOpenMeeting && (
          <button
            type="button"
            onClick={onOpenMeeting}
            aria-label="Buka Video Conference & Breakout Room"
            title="Video Conference & Breakout Room"
            className="px-2 sm:px-2.5 py-1.5 rounded border border-teal bg-teal/15 hover:bg-teal text-teal hover:text-soft transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">Konferensi</span>
          </button>
        )}

        {/* Media Toggles */}`;

dock = dock.replace(mediaDivider, newMediaSection);
fs.writeFileSync(dockPath, dock, 'utf8');
console.log('GatherDock.tsx updated');

// 2. App.tsx
const appPath = path.resolve('src/App.tsx');
let app = fs.readFileSync(appPath, 'utf8');

app = app.replace(
  'onOpenCustomizer={() => setIsCustomizerOpen(true)}\n              />',
  'onOpenCustomizer={() => setIsCustomizerOpen(true)}\n                onOpenMeeting={handleOpenVideoConference}\n              />'
);

fs.writeFileSync(appPath, app, 'utf8');
console.log('App.tsx updated');
