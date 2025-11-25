import {User} from "./user";

/**
 * Interface pour les données de connexion
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Interface pour les données d'inscription
 */
export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  city?: string;
  country?: string;
  user_type: 'client' | 'freelance';
  avatar?: File;

  // Pour les freelances
  title?: string;
  description?: string;
  hourly_rate?: number;
  experience_years?: number;

  // Pour les clients
  company_name?: string;
  company_description?: string;
}

/**
 * Interface pour la réponse d'inscription
 */
export interface RegisterResponse {
  user: User;
  message: string;
}

/**
 * Interface pour la réponse d'authentification du backend
 */
export interface AuthResponse {
  user: User;
  token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Interface pour la vérification d'email
 */
export interface VerifyEmailData {
  email: string;
  token: string;
}

/**
 * Interface pour renvoyer l'email de vérification
 */
export interface ResendVerificationData {
  email: string;
}

/**
 * Interface pour les erreurs d'authentification
 */
export interface AuthError {
  error: string;
  message?: string;
  status?: number;
}

/**
 * Interface pour le stockage du token
 */
export interface StoredAuth {
  token: string;
  expiresAt: number;
}
