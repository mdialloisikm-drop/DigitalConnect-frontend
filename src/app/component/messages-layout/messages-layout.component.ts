import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {Subscription} from "rxjs";
import {filter} from "rxjs/operators";

@Component({
  selector: 'app-messages-layout',
  templateUrl: './messages-layout.component.html',
  styleUrl: './messages-layout.component.css'
})
export class MessagesLayoutComponent implements OnInit, OnDestroy {
  selectedConversationId: number | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Écouter les changements de route pour mettre à jour l'ID de conversation sélectionnée
    const routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateSelectedConversation();
      });

    this.subscriptions.push(routerSub);

    // Initialiser avec la route actuelle
    this.updateSelectedConversation();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Mettre à jour la conversation sélectionnée depuis la route
   */
  private updateSelectedConversation(): void {
    const id = this.route.firstChild?.snapshot.params['id'];
    if (id) {
      this.selectedConversationId = +id;
    } else {
      this.selectedConversationId = null;
    }
  }

  /**
   * Gérer la sélection d'une conversation depuis la liste
   */
  onConversationSelected(conversationId: number): void {
    this.selectedConversationId = conversationId;
    this.router.navigate(['/messages', conversationId]);
  }

  /**
   * Fermer la conversation (retour à la liste en mobile)
   */
  onCloseConversation(): void {
    this.selectedConversationId = null;
    this.router.navigate(['/messages']);
  }
}
