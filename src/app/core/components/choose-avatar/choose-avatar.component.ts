import { Component } from '@angular/core';
import { AuthUIService } from '../../shared/services/authUI-services/authUI.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent {
  constructor(public authUIService: AuthUIService) {}

  photos: string[] = [
    'assets/img/profile-img/Elise-Roth.svg',
    'assets/img/profile-img/Elias-Neumann.svg',
    'assets/img/profile-img/Frederik-Beck.svg',
    'assets/img/profile-img/Steffen-Hoffmann.svg',
    'assets/img/profile-img/Sofia-Müller.svg',
    'assets/img/profile-img/Noah-Braun.svg',
  ];

  selectedPhoto: string | null = null; // Placeholder shown initially
  isUploadedPhoto: boolean = false;
  uploadedPhotoName: string | null = null;

  selectPhoto(photo: string) {
    this.selectedPhoto = photo; // Set selected photo when clicked
    this.isUploadedPhoto = false;
    this.uploadedPhotoName = null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.uploadedPhotoName = file.name;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedPhoto = e.target?.result as string;
        this.isUploadedPhoto = true;
      };

      reader.readAsDataURL(file);
    }
  }

  eraseUploadedPhoto() {
    this.selectedPhoto = null;
    this.isUploadedPhoto = false;
    this.uploadedPhotoName = null;
  }
}
