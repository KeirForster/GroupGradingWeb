// Angular modules
import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';

// App
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from './auth.service';
import { CredentialModel } from './model/credential-model';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
    readonly faSync: any; // sync icon for signin button
    readonly loginForm: FormGroup;
    submitted: boolean;

    constructor(private fb: FormBuilder, private authService: AuthService) {
        this.submitted = false;
        this.faSync = faSync;
        this.loginForm = this.setLoginForm();
    }

    ngOnInit() {}

    onSubmit(): void {
        this.submitted = true;
        this.login();
    }

    private setLoginForm(): FormGroup {
        return this.fb.group({
            username: [null, [Validators.required, Validators.minLength(1)]],
            password: [null, [Validators.required, Validators.minLength(6)]],
            remember: [null, []]
        });
    }

    private login(): void {
        const userName = this.loginForm.get('username').value;
        const password = this.loginForm.get('password').value;
        const remember = this.loginForm.get('remember').value;

        const userCredentials = {
            userName: userName,
            password: password
        } as CredentialModel;

        console.log(`userName: ${userName}`);
        console.log(`password: ${password}`);
        console.log(`remember: ${remember}`);

        this.authService.login(userCredentials, remember).subscribe(
            (res: String) => {
                console.log(res);
            },
            error => {
                console.log(error);
            }
        );
    }
}
