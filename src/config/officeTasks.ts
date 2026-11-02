import { OfficeTask } from '../types/task';

export const INITIAL_OFFICE_TASKS: OfficeTask[] = [
  {
    id: 'task-1',
    title: 'Daily Standup & Sync Tim Remote',
    category: 'Meeting',
    zone: 'Ruang Rapat Utama',
    assignedTo: 'Seluruh Tim',
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Review Desain UI & Layout Kantor 2D',
    category: 'Development',
    zone: 'Workstation Utama',
    assignedTo: 'Product Team',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Sesi Kolaborasi & Presentasi Klien Luar',
    category: 'Collaboration',
    zone: 'Ruang Konferensi Virtual',
    assignedTo: 'Lead Project',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Verifikasi Billing Session & Server Bracket',
    category: 'Operations',
    zone: 'Ruang Pimpinan Eksekutif',
    assignedTo: 'Super Admin',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

