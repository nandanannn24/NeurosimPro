import fs from 'fs';
import path from 'path';

const appPath = path.resolve('src/App.tsx');
let lines = fs.readFileSync(appPath, 'utf8').split(/\r?\n/);

// Find the first handleOpenVideoConference and slice it out
let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const handleOpenVideoConference = useCallback(')) {
    startIdx = i;
    break;
  }
}

if (startIdx !== -1) {
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].includes('}, [activeMeetingSession, currentUser]);')) {
      endIdx = i;
      break;
    }
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  console.log(`Removing duplicate block lines ${startIdx} to ${endIdx}`);
  lines.splice(startIdx, endIdx - startIdx + 1);
}

let code = lines.join('\r\n');

// In remaining handleLeaveVideoConference, fix leaveMeeting argument
code = code.replace(
  'meetingService.leaveMeeting(activeMeetingSession.id, String(currentUser.id));',
  'meetingService.leaveMeeting(String(currentUser.id));'
);

fs.writeFileSync(appPath, code, 'utf8');
console.log('App.tsx cleaned and fixed');

