import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    loginForm: any;
    registerForm: any;
    accountNotFound: boolean = false;
    accountTaken: boolean = false

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private route: Router
    ) { }

    ngOnInit(): void {
        this.loginForm = this.formBuilder.group({
            username: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]

        })

        this.registerForm = this.formBuilder.group({
            username: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(5)]],
            first_name: ['', Validators.required],
            surname: ['', Validators.required],
        }, );
    }

    onLoginSubmit(): void {
        this.accountNotFound = false;
        this.authService.loginUser(this.loginForm.value).subscribe((data: any) => {
            this.loginForm.reset()
            this.route.navigateByUrl('/').then()
        },
        () => {
            this.accountNotFound = true
        });
    }

    onRegisterSubmit(): void {
        this.authService.registerUser(this.registerForm.value).subscribe((data: any) => {
            this.registerForm.reset()
            this.route.navigateByUrl('/').then()
        },
        () => {
            this.accountTaken = true
        });
    }
}