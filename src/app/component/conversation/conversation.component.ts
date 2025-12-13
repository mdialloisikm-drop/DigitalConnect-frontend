import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Conversation, Message, User} from "../../models/message";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {MessageHttpService} from "../../services/message-http.service";
import {RealtimeMessagingService} from "../../services/realtime-messaging.service";
import {EchoService} from "../../services/echo.service";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrl: './conversation.component.css'
})
export class ConversationComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  conversationId!: number;
  conversation: Conversation | null = null;
  messages: Message[] = [];
  messageContent: string = '';
  typingUsers: string[] = [];
  isLoading: boolean = true;
  isSending: boolean = false;
  currentUserId: number = 0;
  currentUserName: string = '';

  private subscriptions: Subscription[] = [];
  private realtimeSubscriptions: Subscription[] = [];
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private route: ActivatedRoute,
    private messageHttpService: MessageHttpService,
    private realtimeService: RealtimeMessagingService,
    private echoService: EchoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();

    const paramsSub = this.route.params.subscribe(params => {
      const newConversationId = +params['id'];

      if (newConversationId) {
        if (this.conversationId && this.conversationId !== newConversationId) {
          this.cleanupCurrentConversation();
        }

        this.conversationId = newConversationId;
        this.loadConversation();
        this.loadMessages();

        if (this.echoService.isConnected()) {
          this.setupRealtimeForConversation();
        } else {
          const connectionSub = this.echoService.connectionStatus$.subscribe(status => {
            if (status === 'connected') {
              this.setupRealtimeForConversation();
              connectionSub.unsubscribe();
            }
          });
        }
      }
    });

    this.subscriptions.push(paramsSub);
  }

  ngOnDestroy(): void {
    this.cleanupCurrentConversation();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private cleanupCurrentConversation(): void {
    this.realtimeService.leaveConversation();
    this.stopTyping();
    this.realtimeSubscriptions.forEach(sub => sub.unsubscribe());
    this.realtimeSubscriptions = [];
  }

  private setupRealtimeForConversation(): void {
    this.realtimeSubscriptions.forEach(sub => sub.unsubscribe());
    this.realtimeSubscriptions = [];

    this.realtimeService.joinConversation(this.conversationId);

    // ✅ S'abonner aux nouveaux messages avec gestion optimisée
    const newMessageSub = this.realtimeService.newMessage$.subscribe((incomingEvent) => {
      if (!incomingEvent) return;

      const message = (incomingEvent as any).message || incomingEvent;

      if (message && message.conversation_id === this.conversationId) {
        console.log('📨 Message reçu temps réel:', message);

        // ✅ Vérifier si le message existe déjà (éviter doublons)
        const existingMessageIndex = this.messages.findIndex(m =>
          m.id === message.id ||
          (m.content === message.content &&
            m.sender_id === message.sender_id &&
            Math.abs(new Date(m.created_at).getTime() - new Date(message.created_at).getTime()) < 2000)
        );

        if (existingMessageIndex === -1) {
          // ✅ Nouveau message - l'ajouter
          this.messages.push(message);
          this.scrollToBottom();

          // ✅ Marquer comme lu si ce n'est pas notre message
          if (message.sender_id !== this.currentUserId && !message.is_read) {
            this.markMessageAsRead(message.id);
          }
        } else {
          // ✅ Message existant - le mettre à jour (cas où on a créé un message optimiste)
          this.messages[existingMessageIndex] = {
            ...this.messages[existingMessageIndex],
            ...message
          };
        }
      }
    });

    const messageReadSub = this.realtimeService.messageRead$.subscribe((event) => {
      if (event && event.conversation_id === this.conversationId && event.read_by !== this.currentUserId) {
        this.updateMessageReadStatus(event.message_id);
      }
    });

    const allReadSub = this.realtimeService.messagesMarkedAsRead$.subscribe((event) => {
      if (event && event.conversation_id === this.conversationId && event.read_by !== this.currentUserId) {
        this.updateAllMessagesReadStatus(event.read_by);
      }
    });

    const typingSub = this.realtimeService.typingUsers$.subscribe((users) => {
      this.typingUsers = users
        .filter(u => u.user_id !== this.currentUserId)
        .map(u => u.user_name);
    });

    this.realtimeSubscriptions.push(newMessageSub, messageReadSub, allReadSub, typingSub);
  }

  private loadCurrentUser(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.currentUserId = user.id;
      this.currentUserName = user.full_name;
    }
  }

  private loadConversation(): void {
    const sub = this.messageHttpService.getConversation(this.conversationId).subscribe({
      next: (conversation) => {
        this.conversation = conversation;
        console.log('✅ Conversation chargée:', conversation);
      },
      error: (error) => {
        console.error('❌ Erreur chargement conversation:', error);
      }
    });

    this.subscriptions.push(sub);
  }

  private loadMessages(): void {
    this.isLoading = true;

    const sub = this.messageHttpService.getMessages(this.conversationId).subscribe({
      next: (response) => {
        this.messages = response.data.reverse();
        this.isLoading = false;
        this.scrollToBottom();

        // ✅ Marquer tous comme lus dès l'entrée
        this.markAllAsRead();

        console.log('✅ Messages chargés:', this.messages.length);
      },
      error: (error) => {
        console.error('❌ Erreur chargement messages:', error);
        this.isLoading = false;
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * ✅ AMÉLIORATION: Envoi optimiste du message (affichage immédiat)
   */
  public sendMessage(): void {
    if (!this.messageContent.trim() || this.isSending) return;

    const content = this.messageContent.trim();
    this.messageContent = ''; // ✅ Vider immédiatement pour UX fluide
    this.isSending = true;

    // ✅ OPTIMISTIC UI: Créer un message temporaire immédiatement
    const optimisticMessage: Message = {
      id: Date.now(), // ID temporaire unique
      conversation_id: this.conversationId,
      sender_id: this.currentUserId,
      sender: {
        id: this.currentUserId,
        full_name: this.currentUserName,
        email: this.authService.currentUserValue?.email || '',
        avatar: this.authService.currentUserValue?.avatar || null,
        user_type: this.authService.currentUserValue?.user_type || 'client'
      },
      content: content,
      message_type: 'text',
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _sending: true // ✅ Flag pour indiquer que le message est en cours d'envoi
    } as any;

    // ✅ Ajouter immédiatement le message à l'interface
    this.messages.push(optimisticMessage);
    this.scrollToBottom();

    // ✅ Envoyer le message au serveur
    const sub = this.messageHttpService.sendTextMessage(this.conversationId, content).subscribe({
      next: (response) => {
        console.log('✅ Message envoyé avec succès');

        // ✅ Remplacer le message optimiste par le message réel du serveur
        const optimisticIndex = this.messages.findIndex(m => m.id === optimisticMessage.id);
        if (optimisticIndex !== -1) {
          this.messages[optimisticIndex] = response.data;
        }

        this.isSending = false;
        this.stopTyping();
      },
      error: (error) => {
        console.error('❌ Erreur envoi message:', error);

        // ✅ Retirer le message optimiste en cas d'erreur
        const optimisticIndex = this.messages.findIndex(m => m.id === optimisticMessage.id);
        if (optimisticIndex !== -1) {
          this.messages.splice(optimisticIndex, 1);
        }

        // ✅ Restaurer le contenu dans le champ
        this.messageContent = content;
        this.isSending = false;

        // ✅ Afficher une notification d'erreur (optionnel)
        alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
      }
    });

    this.subscriptions.push(sub);
  }

  public onTyping(): void {
    this.realtimeService.notifyTyping(
      this.conversationId,
      true,
      this.currentUserId,
      this.currentUserName
    );

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 2000);
  }

  private stopTyping(): void {
    this.realtimeService.notifyTyping(
      this.conversationId,
      false,
      this.currentUserId,
      this.currentUserName
    );

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  private markMessageAsRead(messageId: number): void {
    this.messageHttpService.markAsRead(messageId).subscribe({
      next: () => console.log('✅ Message marqué lu'),
      error: (err) => console.error('❌ Erreur marquer lu:', err)
    });
  }

  /**
   * ✅ Marquer tous comme lus dès l'entrée
   */
  private markAllAsRead(): void {
    this.messageHttpService.markAllAsRead(this.conversationId).subscribe({
      next: (response) => {
        if (response.count > 0) {
          console.log(`✅ ${response.count} message(s) marqué(s) comme lu(s)`);

          // ✅ Mettre à jour localement tous les messages reçus comme lus
          this.messages.forEach(msg => {
            if (msg.sender_id !== this.currentUserId) {
              msg.is_read = true;
              msg.read_at = new Date().toISOString();
            }
          });
        }
      },
      error: (error) => {
        console.error('❌ Erreur marquer tous lus:', error);
      }
    });
  }

  private updateMessageReadStatus(messageId: number): void {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.is_read = true;
      message.read_at = new Date().toISOString();
    }
  }

  private updateAllMessagesReadStatus(readBy: number): void {
    if (readBy === this.currentUserId) return;

    const messagesUpdated = this.messages.filter(m =>
      m.sender_id === this.currentUserId && !m.is_read
    );

    messagesUpdated.forEach(m => {
      m.is_read = true;
      m.read_at = new Date().toISOString();
    });

    if (messagesUpdated.length > 0) {
      console.log(`✅ ${messagesUpdated.length} de vos messages marqués lus`);
    }
  }

  /**
   * ✅ AMÉLIORATION: Scroll plus fluide avec requestAnimationFrame
   */
  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      }
    });
  }

  public getOtherUser(): User | null {
    if (!this.conversation) return null;
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return null;
    if (currentUser.user_type === 'client') return this.conversation.freelance?.user || null;
    if (currentUser.user_type === 'freelance') return this.conversation.client?.user || null;
    return null;
  }

  public getInitials(user: User | null): string {
    if (!user || !user.full_name) return '??';
    const names = user.full_name.trim().split(' ').filter(name => name.length > 0);
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

  public isOwnMessage(message: Message): boolean {
    return message.sender_id === this.currentUserId;
  }

  public formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  public openFileSelector(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * ✅ AMÉLIORATION: Envoi de fichier avec UI optimiste
   */
  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file: File | null = input.files ? input.files[0] : null;
    if (file) {
      this.sendFileMessage(file);
    }
    // ✅ Réinitialiser l'input pour permettre le même fichier
    input.value = '';
  }

  private sendFileMessage(file: File): void {
    this.isSending = true;

    // ✅ OPTIMISTIC UI pour fichier
    const optimisticMessage: Message = {
      id: Date.now(),
      conversation_id: this.conversationId,
      sender_id: this.currentUserId,
      sender: {
        id: this.currentUserId,
        full_name: this.currentUserName,
        email: this.authService.currentUserValue?.email || '',
        avatar: this.authService.currentUserValue?.avatar || null,
        user_type: this.authService.currentUserValue?.user_type || 'client'
      },
      content: JSON.stringify({ name: file.name, size: file.size }),
      message_type: 'file',
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _sending: true
    } as any;

    this.messages.push(optimisticMessage);
    this.scrollToBottom();

    const sub = this.messageHttpService.sendFileMessage(this.conversationId, file).subscribe({
      next: (response) => {
        console.log('✅ Fichier envoyé avec succès');

        // ✅ Remplacer le message optimiste
        const optimisticIndex = this.messages.findIndex(m => m.id === optimisticMessage.id);
        if (optimisticIndex !== -1) {
          this.messages[optimisticIndex] = response.data;
        }

        this.isSending = false;
        this.stopTyping();
      },
      error: (error) => {
        console.error('❌ Erreur envoi fichier:', error);

        // ✅ Retirer le message optimiste
        const optimisticIndex = this.messages.findIndex(m => m.id === optimisticMessage.id);
        if (optimisticIndex !== -1) {
          this.messages.splice(optimisticIndex, 1);
        }

        this.isSending = false;
        alert('Erreur lors de l\'envoi du fichier. Veuillez réessayer.');
      }
    });

    this.subscriptions.push(sub);
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  public isDifferentDay(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getDate() !== d2.getDate() ||
      d1.getMonth() !== d2.getMonth() ||
      d1.getFullYear() !== d2.getFullYear();
  }

  public formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Aujourd\'hui';
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';

    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'long' });
    }

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }

  public getFileName(content: string): string {
    try {
      const data = JSON.parse(content);
      return data.name || 'Fichier';
    } catch {
      return 'Fichier';
    }
  }

  /**
   * ✅ NOUVEAU: Vérifier si un message est en cours d'envoi
   */
  /**
   * ✅ NOUVEAU: Vérifier si un message est en cours d'envoi
   */
  public isMessageSending(message: Message): boolean {
    return !!(message as any)._sending;
  }
}
