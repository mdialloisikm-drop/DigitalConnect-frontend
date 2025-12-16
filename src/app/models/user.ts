import {Client} from "./client";
import {Freelance} from "./freelance";

export interface User {
  id: number;
  full_name: string;
  email: string;
  email_verified_at: string | null;
  phone?: string;
  avatar?: string;
  avatar_url?:  string;
  city?: string;
  country?: string;
  user_type: 'admin' | 'client' | 'freelance';
  status: 'active' | 'suspended' | 'inactive';
  freelance?: Freelance;
  client?: Client;
}
