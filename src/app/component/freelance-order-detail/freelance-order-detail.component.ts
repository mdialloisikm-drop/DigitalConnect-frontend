import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {Order} from "../../models/order";
import {OrderService} from "../../services/order.service";
import {Attachement} from "../../models/attachement";

// Interface pour les livrables
export interface Deliverable {
  id: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  created_at: string;
}

@Component({
  selector: 'app-freelance-order-detail',
  templateUrl: './freelance-order-detail.component.html',
  styleUrl: './freelance-order-detail.component.css'
})
export class FreelanceOrderDetailComponent implements OnInit{
  order: Order | null = null;
  isLoading = false;
  errorMessage = '';
  activeTab: 'details' | 'deliverables' = 'details';

  // Pour les livrables
  selectedFiles: File[] = [];
  isUploading = false;
  uploadProgress = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.params['id'];
    if (orderId) {
      this.loadOrder(orderId);
    }
  }

  /**
   * Charger les détails de la commande
   */
  loadOrder(orderId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.orderService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.errorMessage = error.error?.error || 'Impossible de charger la commande';
        this.isLoading = false;
      }
    });
  }

  /**
   * Changer d'onglet
   */
  switchTab(tab: 'details' | 'deliverables'): void {
    this.activeTab = tab;
  }

  /**
   * Accepter la commande
   */
  acceptOrder(): void {
    if (!this.order || !confirm('Voulez-vous accepter cette commande ?')) {
      return;
    }

    this.orderService.acceptOrder(this.order.id).subscribe({
      next: (response) => {
        this.order = response.order;
      },
      error: (error) => {
        console.error('Erreur:', error);
        alert(error.error?.error || 'Erreur lors de l\'acceptation');
      }
    });
  }

  /**
   * Refuser la commande
   */
  refuseOrder(): void {
    if (!this.order || !confirm('Voulez-vous refuser cette commande ? Cette action est irréversible.')) {
      return;
    }

    this.orderService.cancelOrder(this.order.id).subscribe({
      next: (response) => {
        this.order = response.order;
      },
      error: (error) => {
        console.error('Erreur:', error);
        alert(error.error?.error || 'Erreur lors du refus');
      }
    });
  }

  /**
   * Sélectionner des fichiers à uploader
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  /**
   * Uploader les livrables
   */
  uploadDeliverables(): void {
    if (!this.order || this.selectedFiles.length === 0) {
      return;
    }

    this.isUploading = true;
    let uploadedCount = 0;

    this.selectedFiles.forEach((file, index) => {
      this.orderService.uploadDeliverable(this.order!.id, file).subscribe({
        next: () => {
          uploadedCount++;
          this.uploadProgress = Math.round((uploadedCount / this.selectedFiles.length) * 100);

          if (uploadedCount === this.selectedFiles.length) {
            this.isUploading = false;
            this.selectedFiles = [];
            this.uploadProgress = 0;
            this.loadOrder(this.order!.id);

            // Reset file input
            const fileInput = document.getElementById('fileInput') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          }
        },
        error: (error) => {
          console.error('Erreur upload:', error);
          this.isUploading = false;
          alert(`Erreur lors de l'upload de ${file.name}`);
        }
      });
    });
  }

  /**
   * Supprimer un livrable
   */
  deleteDeliverable(deliverableId: number): void {
    if (!confirm('Voulez-vous supprimer ce livrable ?')) {
      return;
    }

    this.orderService.deleteDeliverable(deliverableId).subscribe({
      next: () => {
        if (this.order) {
          this.loadOrder(this.order.id);
        }
      },
      error: (error) => {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    });
  }

  /**
   * Livrer la commande
   */
  deliverOrder(): void {
    if (!this.order) {
      return;
    }

    if (!this.hasDeliverables()) {
      alert('Vous devez ajouter au moins un livrable avant de livrer la commande.');
      return;
    }

    if (!confirm('Voulez-vous livrer cette commande ?')) {
      return;
    }

    this.orderService.deliverOrder(this.order.id).subscribe({
      next: (response) => {
        this.order = response.order;
        alert('Commande livrée avec succès !');
      },
      error: (error) => {
        console.error('Erreur:', error);
        alert(error.error?.error || 'Erreur lors de la livraison');
      }
    });
  }

  /**
   * Retour à la liste
   */
  goBack(): void {
    this.router.navigate(['/freelance/orders']);
  }

  /**
   * Obtenir le label du statut
   */
  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status);
  }

  /**
   * Obtenir la classe CSS du statut
   */
  getStatusClass(status: string): string {
    return this.orderService.getStatusBadgeClass(status);
  }

  /**
   * Formater la date
   */
  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Vérifier si la commande est en attente
   */
  isPending(): boolean {
    return this.order?.status === 'pending';
  }

  /**
   * Vérifier si la commande est en cours ou en révision
   */
  canUploadDeliverables(): boolean {
    return this.order?.status === 'in_progress' || this.order?.status === 'revision';
  }

  /**
   * Vérifier si la commande a des livrables
   * CORRECTION: Ajout de vérification pour éviter undefined
   */
  hasDeliverables(): boolean {
    const orderWithDeliverables = this.order as (Order & { deliverables?: Deliverable[] }) | null;
    return (orderWithDeliverables?.deliverables?.length ?? 0) > 0;
  }

  /**
   * Obtenir les livrables
   * CORRECTION: Gestion propre des undefined
   */
  getDeliverables(): Deliverable[] {
    const orderWithDeliverables = this.order as (Order & { deliverables?: Deliverable[] }) | null;
    return orderWithDeliverables?.deliverables ?? [];
  }

  /**
   * Télécharger un fichier
   */
  downloadFile(filePath: string): void {
    window.open(filePath, '_blank');
  }

  /**
   * Formater la taille du fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtenir l'icône du fichier
   */
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      pdf: 'fa-file-pdf text-red-600',
      doc: 'fa-file-word text-blue-600',
      docx: 'fa-file-word text-blue-600',
      xls: 'fa-file-excel text-green-600',
      xlsx: 'fa-file-excel text-green-600',
      ppt: 'fa-file-powerpoint text-orange-600',
      pptx: 'fa-file-powerpoint text-orange-600',
      jpg: 'fa-file-image text-purple-600',
      jpeg: 'fa-file-image text-purple-600',
      png: 'fa-file-image text-purple-600',
      zip: 'fa-file-archive text-yellow-600',
      rar: 'fa-file-archive text-yellow-600'
    };
    return iconMap[extension || ''] || 'fa-file text-gray-600';
  }

  getImageUrl(path: string): string {
    return `http://localhost:8000/storage/${path}`;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  }
}
