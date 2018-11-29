// angular modules
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';

// app modules
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { AppRoutingModule } from './app-routing.module';


// components
import { AppComponent } from './app.component';
import { AuthComponent } from './auth/auth.component';

@NgModule({
    declarations: [AppComponent, AuthComponent],
    imports: [
        BrowserModule,
        MDBBootstrapModule.forRoot(),
        AppRoutingModule
    ],
    providers: [],
    bootstrap: [AppComponent],
    schemas: [ NO_ERRORS_SCHEMA ]
})
export class AppModule {}
