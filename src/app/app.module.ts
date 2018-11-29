// Angular modules
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

// app modules
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { AppRoutingModule } from './app-routing.module';

// components
import { AppComponent } from './app.component';
import { AuthComponent } from './auth/auth.component';

@NgModule({
    declarations: [
        AppComponent,
        AuthComponent
    ],
    imports: [
        BrowserModule,
        MDBBootstrapModule.forRoot(),
        ReactiveFormsModule,
        AppRoutingModule
    ],
    providers: [],
    schemas: [
        NO_ERRORS_SCHEMA
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {}
