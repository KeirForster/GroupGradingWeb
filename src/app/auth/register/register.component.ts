// Angular modules
import { Component } from '@angular/core';
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
export class RegisterComponent {
    // animated sync icon for signup button
    readonly faSync: any;
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

    /**
     * Create the `FormGroup` object with the needed input fields and their default values
     *
     * @returns a `FormGroup` object containing the relevant form controls
     */
    private setRegistrationForm(): FormGroup {
        return this.fb.group({
            email: [null, [Validators.required]],
            firstName: [null, [Validators.required]],
            lastName: [null, [Validators.required]],
            userName: [null, [Validators.required]],
            password: [null, [Validators.required, Validators.minLength(6)]],
            role: ['Student']
        });
    }

    /**
     * Respond to a form submission and delegate to the `register()` method
     */
    onSubmit(): void {
        this.submitted = true;
        this.register();
    }

    /**
     * Extract the input values from the form and submit a
     * register request to the auth service.
     *
     * Create a 'RegistrationModel' from the extracted form values
     * to be passed to the auth service `register() method`.
     *
     * Pass an `ApplicationRole` to the auth service `register()`
     * method to determine the specified role to register for.
     *
     * Subscribes to the auth service `register()` method to submit
     * a registration request to the server.
     *
     * If the response is successful, navigate to the `login` path,
     * or else display an error message.
     */
    private register(): void {
        // remove any previous errors
        this.errorMsg = undefined;

        // extract form values
        const email = this.registerForm.get('email').value;
        const firstName = this.registerForm.get('firstName').value;
        const lastName = this.registerForm.get('lastName').value;
        const userName = this.registerForm.get('userName').value;
        const password = this.registerForm.get('password').value;
        const role = this.registerForm.get('role').value;

        // log the values
        console.log(`email: ${email}`);
        console.log(`firstName: ${firstName}`);
        console.log(`lastName: ${lastName}`);
        console.log(`userName: ${userName}`);
        console.log(`password: ${password}`);
        console.log(`role: ${role}`);

        // create register model
        const registrationModel = {
            email: email,
            firstName: firstName,
            lastName: lastName,
            userName: userName,
            password: password
        } as RegistrationModel;

        // submit register request
        this.authService.register(registrationModel, role).subscribe(
            res => {
                // successful registration
                console.log(res);

                // redirect to login
                this.router.navigate(['/login']);
            },
            error => {
                // invalid registration
                console.log(error);
                this.submitted = false;

                // set the error message
                this.errorMsg = error;
            }
        );
    }
}
