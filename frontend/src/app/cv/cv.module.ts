import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { UploadComponent } from './upload/upload.component';
import { JobUrlComponent } from './job-url/job-url.component';
import { PreviewComponent } from './preview/preview.component';

const routes = [
  { path: 'upload', component: UploadComponent },
  { path: 'job-url', component: JobUrlComponent },
  { path: 'preview/:id', component: PreviewComponent },
];

@NgModule({
  declarations: [UploadComponent, JobUrlComponent, PreviewComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class CvModule {}