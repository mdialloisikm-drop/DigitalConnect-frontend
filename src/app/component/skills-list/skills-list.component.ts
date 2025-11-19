import {Component, OnInit} from '@angular/core';
import {Skill} from "../../models/skill";
import {AdminService} from "../../services/admin.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-skills-list',
  templateUrl: './skills-list.component.html',
  styleUrl: './skills-list.component.css'
})
export class SkillsListComponent implements OnInit{
  skills: Skill[] = [];
  loading: boolean = true;
  deleteLoading: boolean = false;
  skillToDelete: Skill | null = null;
  showDeleteModal: boolean = false;
  searchTerm: string = '';

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSkills();
  }

  loadSkills(): void {
    this.loading = true;
    this.adminService.getSkills().subscribe({
      next: (data: Skill[]) => {
        this.skills = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des compétences:', error);
        this.loading = false;
      }
    });
  }

  get filteredSkills(): Skill[] {
    if (!this.searchTerm.trim()) {
      return this.skills;
    }

    const term = this.searchTerm.toLowerCase();
    return this.skills.filter(skill =>
      skill.name.toLowerCase().includes(term)
    );
  }

  addSkill(): void {
    this.router.navigate(['/admin/skills/add']);
  }

  editSkill(id: number): void {
    this.router.navigate(['/admin/skills/edit', id]);
  }

  openDeleteModal(skill: Skill): void {
    this.skillToDelete = skill;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.skillToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.skillToDelete) return;

    this.deleteLoading = true;
    this.adminService.deleteSkill(this.skillToDelete.id).subscribe({
      next: () => {
        this.skills = this.skills.filter(s => s.id !== this.skillToDelete?.id);
        this.deleteLoading = false;
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression de la compétence:', error);
        this.deleteLoading = false;
        alert('Erreur lors de la suppression de la compétence. Elle est peut-être utilisée par des freelances ou des projets.');
      }
    });
  }
}
