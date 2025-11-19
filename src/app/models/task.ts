export interface Task {
  id?: number;
  project_id?: number;
  title: string;
  description: string;
  priority: 'basse' | 'moyenne' | 'haute' | 'urgente';
  status?: 'pending' | 'in_progress' | 'completed';
  order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: 'basse' | 'moyenne' | 'haute' | 'urgente';
}

export interface TaskStatistics {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  progress: number;
  completion_percentage: number;
  by_priority: {
    urgente: number;
    haute: number;
    moyenne: number;
    basse: number;
  };
}
