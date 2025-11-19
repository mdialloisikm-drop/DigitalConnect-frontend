import { Injectable } from '@angular/core';
import {Message, MessageReadEvent, MessagesMarkedAsReadEvent, UserTypingEvent} from "../models/message";
import {BehaviorSubject, Observable, Subject, Subscription} from "rxjs";
import {EchoService} from "./echo.service";
import {debounceTime, distinctUntilChanged} from "rxjs/operators";
import { AuthService } from './auth.service';

interface TypingData {
  conversationId: number;
  isTyping: boolean;
  userId: number;
  userName: string;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeMessagingService {

  // Observables pour les events temps réel
  private newMessageSubject = new BehaviorSubject<Message | null>(null);
  private messageReadSubject = new BehaviorSubject<MessageReadEvent | null>(null);
  private messagesMarkedAsReadSubject = new BehaviorSubject<MessagesMarkedAsReadEvent | null>(null);
  private typingUsersSubject = new BehaviorSubject<UserTypingEvent[]>([]);

  public newMessage$: Observable<Message | null> = this.newMessageSubject.asObservable();
  public messageRead$: Observable<MessageReadEvent | null> = this.messageReadSubject.asObservable();
  public messagesMarkedAsRead$: Observable<MessagesMarkedAsReadEvent | null> = this.messagesMarkedAsReadSubject.asObservable();
  public typingUsers$: Observable<UserTypingEvent[]> = this.typingUsersSubject.asObservable();

  private currentChannel: any = null;
  private currentConversationId: number | null = null;

  private typingStatusSubject = new Subject<TypingData>();
  private typingDebounceSub: Subscription | null = null;

  constructor(
    private echoService: EchoService,
    private authService: AuthService
  ) {
    this.setupTypingDebounce();
  }

  private setupTypingDebounce(): void {
    this.typingDebounceSub = this.typingStatusSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) =>
        prev.conversationId === curr.conversationId &&
        prev.isTyping === curr.isTyping
      )
    ).subscribe((data) => {
      this.emitTypingStatus(data);
    });
  }

  /**
   * ✅ CORRECTION: S'abonner aux events d'une conversation (écoute robuste des noms d'événements)
   */
  public joinConversation(conversationId: number): void {
    if (this.currentConversationId === conversationId && this.currentChannel) {
      console.log(`✅ Déjà abonné à conversation.${conversationId}`);
      return;
    }

    if (this.currentChannel) {
      this.leaveConversation();
    }

    try {
      const echo = this.echoService.getEcho();

      // S'abonner au channel privé
      this.currentChannel = echo.private(`conversation.${conversationId}`);

      // Écouter plusieurs formes possibles d'événements pour être tolérant
      const handleMessageEvent = (event: any) => {
        try {
          const message: Message = (event && (event.message || event.data || event)) as any;
          console.log('📨 Nouveau message reçu (realtime):', message);
          this.newMessageSubject.next(message);
        } catch (err) {
          console.error('Erreur processing event message', err);
        }
      };

      // Noms d'événements courants
      this.currentChannel.listen('MessageSent', handleMessageEvent);
      this.currentChannel.listen('message.sent', handleMessageEvent);
      this.currentChannel.listen('.MessageSent', handleMessageEvent);
      this.currentChannel.listen('.message.sent', handleMessageEvent);

      // Events read
      this.currentChannel.listen('MessageRead', (event: MessageReadEvent) => {
        this.messageReadSubject.next(event);
      });
      this.currentChannel.listen('MessagesMarkedAsRead', (event: MessagesMarkedAsReadEvent) => {
        this.messagesMarkedAsReadSubject.next(event);
      });

      // Whisper pour typing
      this.currentChannel.listenForWhisper('user.typing', (event: UserTypingEvent) => {
        this.handleTypingEvent(event);
      });
      // Broadcast typing backup
      this.currentChannel.listen('UserTyping', (event: UserTypingEvent) => {
        this.handleTypingEvent(event);
      });
      this.currentChannel.listen('.user.typing', (event: UserTypingEvent) => {
        this.handleTypingEvent(event);
      });

      this.currentConversationId = conversationId;
      console.log(`✅ Abonné à conversation.${conversationId}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'abonnement à la conversation:', error);
    }
  }

  /**
   * Quitter la conversation actuelle
   */
  public leaveConversation(): void {
    if (this.currentChannel && this.currentConversationId) {
      try {
        // Stop listening using event names used above
        this.currentChannel.stopListening('MessageSent');
        this.currentChannel.stopListening('message.sent');
        this.currentChannel.stopListening('.MessageSent');
        this.currentChannel.stopListening('.message.sent');

        this.currentChannel.stopListening('MessageRead');
        this.currentChannel.stopListening('MessagesMarkedAsRead');
        this.currentChannel.stopListeningForWhisper('user.typing');
        this.currentChannel.stopListening('UserTyping');
        this.currentChannel.stopListening('.user.typing');

        const echo = this.echoService.getEcho();
        echo.leave(`conversation.${this.currentConversationId}`);

        console.log(`🔌 Quitté conversation.${this.currentConversationId}`);
      } catch (error) {
        console.error('❌ Erreur lors de la déconnexion de la conversation:', error);
      }

      this.currentChannel = null;
      this.currentConversationId = null;
      this.reset();
    }
  }

  /**
   * Gérer l'event typing
   */
  private handleTypingEvent(event: UserTypingEvent): void {
    if (event.user_id === this.authService.currentUserValue?.id) {
      return;
    }

    const currentUsers = this.typingUsersSubject.value;

    if (event.is_typing) {
      if (!currentUsers.find(u => u.user_id === event.user_id)) {
        this.typingUsersSubject.next([...currentUsers, event]);
      }

      setTimeout(() => {
        const users = this.typingUsersSubject.value;
        this.typingUsersSubject.next(
          users.filter(u => u.user_id !== event.user_id)
        );
      }, 3000);
    } else {
      this.typingUsersSubject.next(
        currentUsers.filter(u => u.user_id !== event.user_id)
      );
    }
  }

  /**
   * Notifier le statut typing
   */
  public notifyTyping(conversationId: number, isTyping: boolean, userId: number, userName: string): void {
    if (this.currentConversationId === conversationId) {
      this.typingStatusSubject.next({ conversationId, isTyping, userId, userName });
    }
  }

  /**
   * Émettre le statut typing via WebSocket (whisper)
   */
  private emitTypingStatus(data: TypingData): void {
    if (!this.currentChannel) {
      return;
    }

    try {
      this.currentChannel.whisper('user.typing', {
        user_id: data.userId,
        user_name: data.userName,
        conversation_id: data.conversationId,
        is_typing: data.isTyping,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'émission du statut typing (whisper):', error);
    }
  }

  /**
   * Obtenir la liste des utilisateurs en train de taper
   */
  public getTypingUsers(): UserTypingEvent[] {
    return this.typingUsersSubject.value;
  }

  /**
   * Obtenir l'ID de la conversation actuelle
   */
  public getCurrentConversationId(): number | null {
    return this.currentConversationId;
  }

  /**
   * Vérifier si on est abonné à une conversation
   */
  public isSubscribed(): boolean {
    return this.currentChannel !== null && this.currentConversationId !== null;
  }

  /**
   * Reset tous les observables
   */
  public reset(): void {
    this.newMessageSubject.next(null);
    this.messageReadSubject.next(null);
    this.messagesMarkedAsReadSubject.next(null);
    this.typingUsersSubject.next([]);
  }

  /**
   * Nettoyer complètement le service
   */
  public cleanup(): void {
    this.leaveConversation();
    this.reset();
    if (this.typingDebounceSub) {
      this.typingDebounceSub.unsubscribe();
      this.typingDebounceSub = null;
    }
  }
}
