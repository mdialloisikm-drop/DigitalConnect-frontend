import {User} from "./user";
import {Skill} from "./skill";

export interface Freelance {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  hourly_rate?: number;
  experience_years?: number;
  availability: 'available' | 'busy' | 'unavailable';
  created_at: string;
  updated_at: string;
  user?: User;
  skills?: Skill[];
}
