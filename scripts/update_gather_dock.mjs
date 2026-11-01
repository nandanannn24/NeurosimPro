import fs from 'fs';
import path from 'path';

const dockPath = path.resolve('src/components/gather/GatherDock.tsx');
let dock = fs.readFileSync(dockPath, 'utf8');

// 1. Add onOpenMeeting to Props
dock = dock.replace(
  "  onOpenCustomizer: () => void;\n}",
  "  onOpenCustomizer: () => void;\n  onOpenMeeting?: () => void;\n}"
);

// 2. Add onOpenMeeting to parameters
dock = dock.replace(
  "  onOpenProfile,\n  onOpenCustomizer,\n}) => {",
  "  onOpenProfile,\n  onOpenCustomizer,\n  onOpenMeeting,\n}) => {"
);

// 3. Fix userName fallback
dock = dock.replace(
  "{userName || 'Rifat'}",
  "{userName || 'Pengguna'}"
);

// 4. Add Conference button before Media Toggles
const mediaDivider = '<div className="w-[1px] h-6 bg-muted/20 mx-0.5" />\n\n        {/* Media Toggles */}';
const newMediaSection = `<div className="w-[1px] h-6 bg-muted/20 mx-0.5" />

        {/* Video Conference Launcher */}
        {onOpenMeeting && (
          <button
            type="button"
            onClick={onOpenMeeting}
            aria-label="Buka Video Conference & Breakout Room"
            title="Video Conference & Breakout Room"
            className="p-1.5 sm:px-2.5 sm:py-1 rounded border border-teal/40 bg-teal/10 hover:bg-teal text-teal hover:text-soft transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">Konferensi</span>
          </button>
        )}

        {/* Media Toggles */}`;

dock = dock.replace(mediaDivider, newMediaSection);

fs.writeFileSync(dockPath, dock, 'utf8');
console.log('Updated GatherDock.tsx successfully');

