// Angular modules
import { Component } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

// App
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../auth.service';
import { CredentialModel } from '../model/credential-model';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    // animated sync icon for signin button
    readonly faSync: any;
    readonly loginForm: FormGroup;
    submitted: boolean;
    errorMsg: string;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.submitted = false;
        this.faSync = faSync;
        this.loginForm = this.setLoginForm();
    }

    /**
     * Respond to a form submission and delegate to the `login()` method
     *
     * @publicApi
     */
    onSubmit(): void {
        this.submitted = true;
        this.login();
    }

    /**
     * Create the `FormGroup` object with the needed input fields and their default values
     *
     * @returns a `FormGroup` object containing the relevant form controls
     *
     * @privateApi
     */
    private setLoginForm(): FormGroup {
        return this.fb.group({
            username: [null, [Validators.required]],
            password: [null, [Validators.required]],
            remember: [false]
        });
    }

    /**
     * Extract the input values from the form and create a 'CredentialModel'
     * to be passed to the auth service `login() method`.
     *
     * Also passes a `boolean` to the auth service `login()` method to determine
     * whether or not to rememeber the user during their next visit and to remain
     * logged in (pending the token has not expirated)
     *
     * Subscribes to the auth service `login()` method to submit a login
     * request to the server.
     *
     * If the response is successful, navigate to the `home` path,
     * or else display an error message.
     *
     * @privateApi
     */
    private login(): void {
        // clear any previous errors
        this.errorMsg = undefined;

        // extract form values
        const userName = this.loginForm.get('username').value;
        const password = this.loginForm.get('password').value;
        const remember = this.loginForm.get('remember').value;

        // create login model
        const userCredentials = {
            userName: userName,
            password: password
        } as CredentialModel;

        // log the values
        console.log(`userName: ${userName}`);
        console.log(`password: ${password}`);
        console.log(`remember: ${remember}`);

        // submit login request
        this.authService.login(userCredentials, remember).subscribe(
            (res: String) => {
                // successful login
                console.log(res);

                // redirect to home
                this.router.navigate(['/home']);
            },
            error => {
                // invalid login attempt
                this.submitted = false;

                // set the error message
                this.errorMsg = error;

                // log the error
                console.log(error);
            }
        );
    }
}
