import {Client} from "./client";
import {Category} from "./category";
import {Skill} from "./skill";
import {Attachement} from "./attachement";
import {Task} from "./task";

export interface Project {
  id: number;
  client_id: number;
  title: string;
  description: string;
  category_id?: number;
  budget: number | string;
  duration: number;
  start_date: string | null;
  deadline: string | null;
  status: 'en_attente' | 'open' | 'in_progress' | 'completed' | 'cancelled' | 'archived';
  progress?: number;
  created_at: string;
  client?: Client;
  category?: Category;
  skills?: Skill[];
  attachments?: Attachement[];
  tasks?: Task[];
}
