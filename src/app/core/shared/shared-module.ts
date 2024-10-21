import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, MatButtonModule, FormsModule],
  exports: [CommonModule, MatButtonModule, FormsModule],
})
export class SharedModule {}
