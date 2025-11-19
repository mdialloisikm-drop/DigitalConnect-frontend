export interface User {
  id: number;
  full_name: string;
  avatar: string | null;
}

export interface Attachment {
  id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  message_type: 'text' | 'voice' | 'file';
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  sender: User;
  attachments: Attachment[];
}

export interface Conversation {
  id: number;
  client_id: number;
  freelance_id: number;
  project_id: number | null;
  status: 'active' | 'archived';
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  project?: {
    id: number;
    title: string;
    status: string;
  };
  client?: {
    user: User;
  };
  freelance?: {
    user: User;
  };
  messages?: Message[];
  unread_count?: number;
}

export interface SendMessageRequest {
  message_type: 'text' | 'voice' | 'file';
  content?: string;
  voice?: File;
  file?: File;
}

export interface MessageReadEvent {
  message_id: number;
  conversation_id: number;
  read_by: number;
  read_at: string;
}

export interface MessagesMarkedAsReadEvent {
  conversation_id: number;
  read_by: number;
  messages_count: number;
  read_at: string;
}

export interface UserTypingEvent {
  user_id: number;
  user_name: string;
  conversation_id: number;
  is_typing: boolean;
  timestamp?: string;
}

export interface UserOnlineStatusEvent {
  user_id: number;
  is_online: boolean;
  last_seen_at: string | null;
  timestamp: string;
}

export interface PaginatedMessages {
  data: Message[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
