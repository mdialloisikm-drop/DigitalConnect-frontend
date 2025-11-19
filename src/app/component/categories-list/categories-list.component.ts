import {Component, OnInit} from '@angular/core';
import {Category} from "../../models/category";
import {AdminService} from "../../services/admin.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-categories-list',
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.css'
})
export class CategoriesListComponent implements OnInit{
  categories: Category[] = [];
  loading = true;
  deleteLoading = false;
  categoryToDelete: Category | null = null;
  showDeleteModal = false;
  searchTerm = '';

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.adminService.getCategories().subscribe({
      next: (data: Category[]) => {
        this.categories = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading = false;
      }
    });
  }

  get filteredCategories(): Category[] {
    if (!this.searchTerm.trim()) {
      return this.categories;
    }

    const term = this.searchTerm.toLowerCase();
    return this.categories.filter(category =>
      category.name.toLowerCase().includes(term)
    );
  }

  addCategory(): void {
    this.router.navigate(['/admin/categories/add']);
  }

  editCategory(id: number): void {
    this.router.navigate(['/admin/categories/edit', id]);
  }

  openDeleteModal(category: Category): void {
    this.categoryToDelete = category;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.categoryToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.categoryToDelete) return;

    this.deleteLoading = true;
    this.adminService.deleteCategory(this.categoryToDelete.id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== this.categoryToDelete?.id);
        this.deleteLoading = false;
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        this.deleteLoading = false;
        alert('Erreur lors de la suppression de la catégorie. Elle est peut-être utilisée par des projets ou services.');
      }
    });
  }
}
