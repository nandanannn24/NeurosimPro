export type TaskCategory = 'Meeting' | 'Project' | 'Development' | 'Operations' | 'Collaboration';

export interface OfficeTask {
  id: string;
  title: string;
  category: TaskCategory;
  zone: string;
  assignedTo?: string;
  completed: boolean;
  createdAt: string;
}
