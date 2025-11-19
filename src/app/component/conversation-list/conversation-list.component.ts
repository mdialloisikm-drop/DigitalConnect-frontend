import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { Conversation, User, Message } from '../../models/message';
import { MessageHttpService } from '../../services/message-http.service';
import { AuthService } from '../../services/auth.service';
import { RealtimeMessagingService } from '../../services/realtime-messaging.service';

/**
 * Composant de liste des conversations
 */
@Component({
  selector: 'app-conversation-list',
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.css']
})
export class ConversationListComponent implements OnInit, OnDestroy {
  // Données
  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];

  // Recherche
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  // États
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';

  // Compteurs
  totalUnreadCount: number = 0;

  // Utilisateur
  currentUserId: number = 0;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Événements
  @Output() conversationSelected = new EventEmitter<number>();

  constructor(
    private messageHttpService: MessageHttpService,
    private router: Router,
    private authService: AuthService,
    private realtimeService: RealtimeMessagingService
  ) {
    this.setupSearchDebounce();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadConversations();
    this.loadUnreadCount();
    this.subscribeToNewMessages();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.searchSubject.complete();
  }

  private setupSearchDebounce(): void {
    const searchSub = this.searchSubject
      .pipe(distinctUntilChanged())
      .subscribe(query => {
        this.performSearch(query);
      });

    this.subscriptions.push(searchSub);
  }

  private loadCurrentUser(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.currentUserId = user.id;
    }
  }

  private loadConversations(): void {
    this.isLoading = true;
    this.hasError = false;

    const sub = this.messageHttpService.getConversations().subscribe({
      next: (conversations: Conversation[]) => {
        this.conversations = conversations;
        this.filteredConversations = conversations;
        this.isLoading = false;
        console.log('✅ Conversations chargées:', conversations.length);
      },
      error: (error) => {
        console.error('❌ Erreur chargement conversations:', error);
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Impossible de charger les conversations';
        this.conversations = [];
        this.filteredConversations = [];
      }
    });

    this.subscriptions.push(sub);
  }

  private loadUnreadCount(): void {
    const sub = this.messageHttpService.getUnreadCount().subscribe({
      next: (response: { count: number }) => {
        this.totalUnreadCount = response.count;
      },
      error: (error) => {
        console.error('❌ Erreur chargement unread count:', error);
        this.totalUnreadCount = 0;
      }
    });

    this.subscriptions.push(sub);
  }

  private performSearch(query: string): void {
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      this.filteredConversations = this.conversations;
      return;
    }

    this.filteredConversations = this.conversations.filter(conv => {
      const otherUser = this.getOtherUser(conv);
      const projectTitle = conv.project?.title || '';
      const userName = otherUser?.full_name || '';
      const lastMessage = this.getLastMessage(conv);
      const lastMessageContent = lastMessage ? lastMessage.content : '';

      return userName.toLowerCase().includes(lowerQuery) ||
        projectTitle.toLowerCase().includes(lowerQuery) ||
        (lastMessageContent && lastMessageContent.toLowerCase().includes(lowerQuery));
    });
  }

  public onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  public openConversation(conversation: Conversation): void {
    this.conversationSelected.emit(conversation.id);
    // navigation via router pour éviter rechargements full page
    this.router.navigate(['/messages', conversation.id]);
  }

  public getInitials(user: User | null): string {
    if (!user || !user.full_name) {
      return '??';
    }
    const names = user.full_name.trim().split(' ').filter(n => n.length > 0);
    if (names.length === 0) return '??';
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  public getAvatarColor(user: User | null): string {
    if (!user || !user.full_name) return 'bg-gray-500';
    const colors = [
      'bg-blue-500','bg-green-500','bg-yellow-500','bg-red-500',
      'bg-purple-500','bg-pink-500','bg-indigo-500','bg-teal-500'
    ];
    const hash = user.full_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  public hasAvatar(user: User | null): boolean {
    return !!(user && user.avatar && user.avatar.trim() !== '');
  }

  public getOtherUser(conversation: Conversation): User | null {
    if (!conversation) return null;
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return null;
    if (currentUser.user_type === 'client') return conversation.freelance?.user || null;
    if (currentUser.user_type === 'freelance') return conversation.client?.user || null;
    return null;
  }

  public getUserAvatar(user: User | null): string {
    if (user?.avatar) {
      if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
        return user.avatar;
      }
      return `http://localhost:8000/storage/avatars/${user.avatar}`;
    }
    const name = user?.full_name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
  }

  public formatLastMessageTime(dateString: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  public refresh(): void {
    this.loadConversations();
    this.loadUnreadCount();
  }

  public archiveConversation(event: Event, conversationId: number): void {
    event.stopPropagation();
    const sub = this.messageHttpService.archiveConversation(conversationId).subscribe({
      next: () => {
        console.log('✅ Conversation archivée');
        this.loadConversations();
      },
      error: (error) => {
        console.error('❌ Erreur archivage:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  public get isEmpty(): boolean {
    return !this.isLoading && this.filteredConversations.length === 0;
  }

  public get emptyMessage(): string {
    if (this.searchQuery) return 'Aucune conversation trouvée';
    return 'Aucune conversation';
  }

  /**
   * Récupère le dernier message d'une conversation de façon sûre.
   * Utilise la relation lastMessage si fournie par l'API, sinon fallback sur messages[0].
   */
  public getLastMessage(conversation: Conversation): Message | null {
    const anyConv = conversation as any;

    // Essayer d'abord last_message (snake_case du backend)
    if (anyConv.last_message) {
      return anyConv.last_message as Message;
    }

    // Fallback sur lastMessage (camelCase)
    if (anyConv.lastMessage) {
      return anyConv.lastMessage as Message;
    }

    // Fallback sur messages[0] (ancien format)
    if (conversation.messages && conversation.messages.length > 0) {
      return conversation.messages[0];
    }

    return null;
  }

  /**
   * S'abonner aux nouveaux messages pour rafraîchir la liste automatiquement
   */
  private subscribeToNewMessages(): void {
    const newMessageSub = this.realtimeService.newMessage$.subscribe((incomingEvent) => {
      if (!incomingEvent) return;

      const message = (incomingEvent as any).message || incomingEvent;
      const convId = message.conversation_id;

      if (!convId) return;

      const conv = this.conversations.find(c => c.id === convId);

      if (conv) {
        // ✅ Mettre à jour last_message (snake_case pour correspondre au backend)
        (conv as any).last_message = message;
        conv.last_message_at = message.created_at;

        // Incrémenter le compteur si message d'un autre utilisateur
        if (message.sender_id !== this.currentUserId) {
          conv.unread_count = (conv.unread_count || 0) + 1;
          this.totalUnreadCount++;
        }

        // Repositionner en tête
        this.conversations = this.conversations.filter(c => c.id !== convId);
        this.conversations.unshift(conv);

        // Réappliquer le filtre
        this.performSearch(this.searchQuery);
      } else {
        // Conversation pas en local -> recharger
        this.loadConversations();
      }
    });

    this.subscriptions.push(newMessageSub);
  }
}
