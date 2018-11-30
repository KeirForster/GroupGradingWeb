// Angular modules
import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

// App
import { AuthService } from './../auth.service';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { RegistrationModel } from '../model/registration-model';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
    readonly faSync: any; // sync icon for signin button
    readonly registerForm: FormGroup;
    submitted: boolean;
    errorMsg: string;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.registerForm = this.setRegistrationForm();
        this.submitted = false;
        this.faSync = faSync;
    }

    ngOnInit(): void {}

    private setRegistrationForm(): FormGroup {
        return this.fb.group({
            email: [null, [Validators.required]],
            firstName: [null, [Validators.required]],
            lastName: [null, [Validators.required]],
            userName: [null, [Validators.required]],
            password: [null, [Validators.required, Validators.minLength(6)]],
            role: ['student']
        });
    }

    onSubmit(): void {
        this.submitted = true;
        this.register();
    }

    private register(): void {
        // remove any previous errors
        this.errorMsg = undefined;

        const email = this.registerForm.get('email').value;
        const firstName = this.registerForm.get('firstName').value;
        const lastName = this.registerForm.get('lastName').value;
        const userName = this.registerForm.get('userName').value;
        const password = this.registerForm.get('password').value;
        const role = this.registerForm.get('role').value;

        console.log(`email: ${email}`);
        console.log(`firstName: ${firstName}`);
        console.log(`lastName: ${lastName}`);
        console.log(`userName: ${userName}`);
        console.log(`password: ${password}`);
        console.log(`role: ${role}`);

        const registrationModel = {
            email: email,
            firstName: firstName,
            lastName: lastName,
            userName: userName,
            password: password
        } as RegistrationModel;

        this.authService.register(registrationModel, role).subscribe(
            res => {
                // successful registration
                console.log(res);
                this.router.navigate(['/login']);
            },
            error => {
                // error
                console.log(error);
                this.submitted = false;
            }
        );
    }
}
