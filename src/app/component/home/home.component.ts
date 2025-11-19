import {Component, OnInit} from '@angular/core';
import {Project} from "../../models/project";
import {Service} from "../../models/service";
import {ApiService} from "../../services/api.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{
  recentProjects: Project[] = [];
  recentServices: Service[] = [];
  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;

    this.apiService.getProjects().subscribe({
      next: (projects) => {
        this.recentProjects = projects.slice(0, 3);
      },
      error: (error) => console.error('Error loading projects:', error)
    });

    this.apiService.getServices().subscribe({
      next: (services) => {
        this.recentServices = services.slice(0, 3);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this.loading = false;
      }
    });
  }

  getImageUrl(path: string): string {
    return `http://localhost:8000/storage/${path}`;
  }
}
