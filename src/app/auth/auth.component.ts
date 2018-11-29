import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
    signinForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.signinForm = fb.group({
            minlength: [null, [Validators.required, Validators.minLength(3)]]
        });
    }

    ngOnInit() {}
}
