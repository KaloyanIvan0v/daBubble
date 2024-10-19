// import { bootstrapApplication } from '@angular/platform-browser';
// import { appConfig } from './app/app.config';
// import { AppComponent } from './app/app.component';

// bootstrapApplication(AppComponent, appConfig).catch((err) =>
//   console.error(err)
// );

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router'; // Import provideRouter
import { routes } from './app/app.routes'; // Import your routes
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth'; // Import Firebase Auth
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { FIREBASE_OPTIONS } from '@angular/fire/compat'; // Import FIREBASE_OPTIONS
import { environment } from './app/environments/environment';
import { RouterModule } from '@angular/router';
import { MainWorkspaceRoutes } from './app/core/components/main/main-workspace/main-workspace-routing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes), // Provide the router configuration
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    { provide: FIREBASE_OPTIONS, useValue: environment.firebaseConfig }, // Provide FIREBASE_OPTIONS
    provideAuth(() => getAuth()), // Provide Firebase Authentication
    provideFirestore(() => getFirestore()),
    provideRouter(MainWorkspaceRoutes),
    provideAnimationsAsync(),
  ],
}).catch((err) => console.error(err));
