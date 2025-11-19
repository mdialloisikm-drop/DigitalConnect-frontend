import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Conversation, Message, PaginatedMessages} from "../models/message";

@Injectable({
  providedIn: 'root'
})
export class MessageHttpService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer les messages d'une conversation
   */
  getMessages(conversationId: number, page: number = 1): Observable<PaginatedMessages> {
    return this.http.get<PaginatedMessages>(
      `${this.apiUrl}/messages/conversation/${conversationId}?page=${page}`
    );
  }

  /**
   * Envoyer un message texte
   */
  sendTextMessage(conversationId: number, content: string): Observable<{ message: string; data: Message }> {
    return this.http.post<{ message: string; data: Message }>(
      `${this.apiUrl}/messages/conversation/${conversationId}`,
      {
        message_type: 'text',
        content: content
      }
    );
  }

  /**
   * Envoyer un message vocal
   */
  sendVoiceMessage(conversationId: number, voiceFile: File): Observable<{ message: string; data: Message }> {
    const formData = new FormData();
    formData.append('message_type', 'voice');
    formData.append('voice', voiceFile);

    return this.http.post<{ message: string; data: Message }>(
      `${this.apiUrl}/messages/conversation/${conversationId}`,
      formData
    );
  }

  /**
   * Envoyer un message avec fichier
   */
  sendFileMessage(conversationId: number, file: File): Observable<{ message: string; data: Message }> {
    const formData = new FormData();
    formData.append('message_type', 'file');
    formData.append('file', file);

    return this.http.post<{ message: string; data: Message }>(
      `${this.apiUrl}/messages/conversation/${conversationId}`,
      formData
    );
  }

  /**
   * Notifier qu'on est en train de taper
   */
  notifyTyping(conversationId: number, isTyping: boolean): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/messages/conversation/${conversationId}/typing`,
      { is_typing: isTyping }
    );
  }

  /**
   * Marquer un message comme lu
   */
  markAsRead(messageId: number): Observable<{ message: string; data: Message }> {
    return this.http.put<{ message: string; data: Message }>(
      `${this.apiUrl}/messages/${messageId}/read`,
      {}
    );
  }

  /**
   * Marquer tous les messages comme lus
   */
  markAllAsRead(conversationId: number): Observable<{ message: string; count: number }> {
    return this.http.put<{ message: string; count: number }>(
      `${this.apiUrl}/messages/conversation/${conversationId}/read-all`,
      {}
    );
  }

  /**
   * Supprimer un message
   */
  deleteMessage(messageId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/messages/${messageId}`
    );
  }

  /**
   * Rechercher des messages
   */
  searchMessages(conversationId: number, query: string): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.apiUrl}/messages/conversation/${conversationId}/search?query=${encodeURIComponent(query)}`
    );
  }

  /**
   * Récupérer toutes les conversations
   */
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`);
  }

  /**
   * Récupérer une conversation spécifique
   */
  getConversation(conversationId: number): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.apiUrl}/conversations/${conversationId}`);
  }

  /**
   * Récupérer le nombre de messages non lus
   */
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/conversations/unread/count`);
  }

  /**
   * Archiver une conversation
   */
  archiveConversation(conversationId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/conversations/${conversationId}/archive`,
      {}
    );
  }

  /**
   * Désarchiver une conversation
   */
  unarchiveConversation(conversationId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/conversations/${conversationId}/unarchive`,
      {}
    );
  }

  /**
   * Démarrer ou récupérer une conversation
   */
  startConversation(payload: { user_type: string; user_id: number }): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/conversations/start`,
      payload
    );
  }

}
