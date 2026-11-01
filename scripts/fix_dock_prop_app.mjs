import fs from 'fs';
import path from 'path';

const appPath = path.resolve('src/App.tsx');
let app = fs.readFileSync(appPath, 'utf8');

// Remove from LandingView
app = app.replace(
  '          onOpenCustomizer={() => setIsCustomizerOpen(true)}\r\n                onOpenMeeting={handleOpenVideoConference}\r\n          onOpenAuth={() => setIsAuthOpen(true)}',
  '          onOpenCustomizer={() => setIsCustomizerOpen(true)}\r\n          onOpenAuth={() => setIsAuthOpen(true)}'
);
app = app.replace(
  '          onOpenCustomizer={() => setIsCustomizerOpen(true)}\n                onOpenMeeting={handleOpenVideoConference}\n          onOpenAuth={() => setIsAuthOpen(true)}',
  '          onOpenCustomizer={() => setIsCustomizerOpen(true)}\n          onOpenAuth={() => setIsAuthOpen(true)}'
);

// Add to GatherDock
app = app.replace(
  'onOpenCustomizer={() => setIsCustomizerOpen(true)}\r\n              />',
  'onOpenCustomizer={() => setIsCustomizerOpen(true)}\r\n                onOpenMeeting={handleOpenVideoConference}\r\n              />'
);
app = app.replace(
  'onOpenCustomizer={() => setIsCustomizerOpen(true)}\n              />',
  'onOpenCustomizer={() => setIsCustomizerOpen(true)}\n                onOpenMeeting={handleOpenVideoConference}\n              />'
);

fs.writeFileSync(appPath, app, 'utf8');
console.log('App.tsx fixed');
