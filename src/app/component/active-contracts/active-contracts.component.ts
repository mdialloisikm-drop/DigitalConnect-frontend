import {Component, OnDestroy, OnInit} from '@angular/core';
import {Contract} from "../../models/contract";
import {Subject, takeUntil} from "rxjs";
import {ContractService} from "../../services/contract.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-active-contracts',
  templateUrl: './active-contracts.component.html',
  styleUrl: './active-contracts.component.css'
})
export class ActiveContractsComponent implements OnInit, OnDestroy {
  contracts: Contract[] = [];
  activeContracts: Contract[] = [];
  isLoading = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private contractService: ContractService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger la liste des contrats
   */
  private loadContracts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.contractService.getMyContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts: Contract[]) => {
          this.contracts = contracts;
          this.activeContracts = contracts.filter(contract => contract.status === 'active');
          this.isLoading = false;
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.isLoading = false;
        }
      });
  }

  /**
   * Naviguer vers les détails d'un contrat
   */
  viewContractDetails(contractId: number): void {
    this.router.navigate(['/freelance/contract', contractId]);
  }

  /**
   * Obtenir la classe CSS pour le statut du contrat
   */
  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800',
      'disputed': 'bg-yellow-100 text-yellow-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtenir le libellé du statut en français
   */
  getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'active': 'Actif',
      'completed': 'Terminé',
      'cancelled': 'Annulé',
      'disputed': 'Litige'
    };
    return statusLabels[status] || status;
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
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  }

  /**
   * Obtenir les initiales d'un nom complet
   * Exemple: "Modou Ndiaye" -> "MN"
   */
  getInitials(fullName?: string): string {
    if (!fullName) return '??';

    const names = fullName.trim().split(' ');

    if (names.length === 1) {
      // Si un seul nom, prendre les 2 premières lettres
      return names[0].substring(0, 2).toUpperCase();
    }

    // Prendre la première lettre de chaque nom (max 2)
    return names
      .slice(0, 2)
      .map(name => name.charAt(0).toUpperCase())
      .join('');
  }
}
