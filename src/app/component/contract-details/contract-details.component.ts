import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject, takeUntil} from "rxjs";
import {Contract} from "../../models/contract";
import {ActivatedRoute, Router} from "@angular/router";
import {Attachement} from "../../models/attachement";
import {ContractService} from "../../services/contract.service";
import {AttachementService} from "../../services/attachement.service";
import {ProjectService} from "../../services/project.service";
import {Project} from "../../models/project";

@Component({
  selector: 'app-contract-details',
  templateUrl: './contract-details.component.html',
  styleUrl: './contract-details.component.css'
})
export class ContractDetailsComponent implements OnInit, OnDestroy {
  contract: Contract | null = null;
  activeTab: 'project' | 'deliverables' | 'terms' = 'project';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Livrables
  deliverables: Attachement[] = [];
  selectedFiles: File[] = [];
  isUploadingFiles = false;
  linkName = '';
  linkUrl = '';
  isAddingLink = false;

  private destroy$ = new Subject<void>();

  constructor(
    private contractService: ContractService,
    private attachementService: AttachementService,
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadContractDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les détails du contrat
   */
  private loadContractDetails(): void {
    const contractId = this.route.snapshot.params['id'];
    if (!contractId) {
      this.router.navigate(['/freelance/contracts']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.contractService.getContractById(Number(contractId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contract: Contract) => {
          this.contract = contract;
          this.loadDeliverables();
          this.isLoading = false;
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.isLoading = false;
        }
      });
  }

  /**
   * Charger les livrables depuis le projet
   */
  private loadDeliverables(): void {
    if (!this.contract?.project_id) return;

    // Charger le projet complet avec ses attachments
    this.projectService.getProjectById(this.contract.project_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project: Project) => {
          // Filtrer uniquement les livrables
          this.deliverables = project.attachments?.filter(
            attachment => attachment.file_type === 'deliverable'
          ) || [];
        },
        error: (error: Error) => {
          console.error('Erreur lors du chargement des livrables:', error);
          this.deliverables = [];
        }
      });
  }

  /**
   * Changer d'onglet
   */
  changeTab(tab: 'project' | 'deliverables' | 'terms'): void {
    this.activeTab = tab;
    this.clearMessages();
  }

  /**
   * Gérer la sélection de fichiers
   */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  /**
   * Uploader des fichiers livrables
   */
  uploadDeliverables(): void {
    if (!this.contract?.project_id || this.selectedFiles.length === 0) return;

    this.isUploadingFiles = true;
    this.clearMessages();

    this.attachementService.addProjectDeliverables(this.contract.project_id, this.selectedFiles)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.selectedFiles = [];
          // Recharger les détails pour mettre à jour les livrables
          this.loadContractDetails();
          this.isUploadingFiles = false;

          // Réinitialiser l'input file
          const fileInput = document.getElementById('fileInput') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.isUploadingFiles = false;
        }
      });
  }

  /**
   * Ajouter un lien comme livrable
   */
  addDeliverableLink(): void {
    if (!this.contract?.project_id || !this.linkName || !this.linkUrl) return;

    this.isAddingLink = true;
    this.clearMessages();

    this.attachementService.addProjectDeliverableLink(this.contract.project_id, this.linkName, this.linkUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.linkName = '';
          this.linkUrl = '';
          this.loadContractDetails();
          this.isAddingLink = false;
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.isAddingLink = false;
        }
      });
  }

  /**
   * Supprimer un fichier sélectionné
   */
  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  /**
   * Formater la taille d'un fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtenir l'icône pour un type de fichier
   */
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'pdf': 'fa-file-pdf text-red-600',
      'doc': 'fa-file-word text-blue-600',
      'docx': 'fa-file-word text-blue-600',
      'xls': 'fa-file-excel text-green-600',
      'xlsx': 'fa-file-excel text-green-600',
      'zip': 'fa-file-archive text-yellow-600',
      'rar': 'fa-file-archive text-yellow-600',
      'jpg': 'fa-file-image text-purple-600',
      'jpeg': 'fa-file-image text-purple-600',
      'png': 'fa-file-image text-purple-600'
    };
    return iconMap[extension || ''] || 'fa-file text-gray-600';
  }

  /**
   * Formater une date
   */
  formatDate(date: string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formater un montant
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  /**
   * Retourner à la liste des contrats
   */
  goBack(): void {
    this.router.navigate(['/freelance/contracts']);
  }

  /**
   * Effacer les messages
   */
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
