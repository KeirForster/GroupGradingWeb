// Angular modules
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

// App models
import { ApplicationRole } from './model/application-role.enum';
import { CredentialModel } from './model/credential-model';
import { LoginSuccessModel } from './model/login-success-model';
import { TokenPayloadModel } from './model/token-model';
import { RegistrationModel } from './model/registration-model';
import { RegistrationSuccessModel } from './model/registration-success-model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private static readonly LOGIN_URL = 'https://groupgradingapi.azurewebsites.net/api/login';
    private static readonly STUDENT_REGISTER_URL = 'https://groupgradingapi.azurewebsites.net/api/student/register';
    private static readonly TEACHER_REGISTER_URL = 'https://groupgradingapi.azurewebsites.net/api/teacher/register';
    private static readonly TOKEN_NAME = 'token';
    private static readonly LOGIN_SUCCESS_MSG = 'login success';
    private static readonly REGISTER_SUCCESS_MSG = 'registration success';
    readonly authenticationStatus: Subject<boolean>; // for broadcasting changes in auth status
    private authenticated: boolean; // current user's authentication status

    constructor(private http: HttpClient) {
        this.authenticated = false;
        this.authenticationStatus = new Subject<boolean>();
    }

    /**
     * Authenticate a user against the server.
     *
     * @param user a user to be authenticated
     * @param remember whether or not to remember the user during their next visit
     *
     * @returns an `Observable` with a message upon success.
     */
    login(user: CredentialModel, remember: boolean): Observable<string> {
        return this.http
            .post(AuthService.LOGIN_URL, user, {
                observe: 'response'
            })
            .pipe(
                tap(res => {
                    // store the token
                    this.storeToken(res.body as LoginSuccessModel, remember);
                }),
                // pass back a success message
                map(res => AuthService.LOGIN_SUCCESS_MSG),
                // handle error
                catchError(this.handleError)
            );
    }

    /**
     * Log the current user out.
     */
    logout(): void {
        sessionStorage.removeItem(AuthService.TOKEN_NAME);
        localStorage.removeItem(AuthService.TOKEN_NAME);
        this.authenticated = false;
        this.authenticationStatus.next(false); // broadcast updated auth status to subscribers
    }

    /**
     * Register a user in the application
     *
     * @param user a user to be registered
     * @param role the application role to be registered as
     *
     * @returns an `Observable` with a message upon success.
     */
    register(
        user: RegistrationModel,
        role: ApplicationRole
    ): Observable<string> {
        const url = this.getRegistrationUrlGivenRole(role);
        return this.http
            .post(url, user, {
                observe: 'response'
            })
            .pipe(
                // pass back a success message
                map(res => AuthService.REGISTER_SUCCESS_MSG),
                // handle error
                catchError(this.handleError)
            );
    }

    /**
     * Check if the current user is authenticated.
     *
     * @returns the current user's authentication status
     */
    isAuthenticated(): boolean {
        if (this.authenticated) {
            // user is authenticated
            return true;
        }

        // not authenticated (user potentially refreshed the browser)
        // attempt to retrieve stored token
        const rawToken = this.getRawToken();

        if (rawToken) {
            // jwt token
            const parsedToken = this.parseToken(rawToken);

            if (this.tokenIsExpired(parsedToken)) {
                // token is expired
                return false;
            } else {
                // token is not expired
                return true;
            }
        } else {
            // no jwt token found
            return false;
        }
    }

    /**
     * Check if the current user is in the specified role.
     *
     * @param roleName the name of the role to check
     *
     * @returns whether ir not the user is in the specified role
     */
    isInRole(roleName: ApplicationRole): boolean {
        if (this.isAuthenticated()) {
            // user is authenticated (valid token found)

            // get the parsed token
            const token = this.parseToken(this.getRawToken());

            if (token.roles.includes(roleName)) {
                // user is in the specified role
                return true;
            } else {
                // user is not in the specified role
                return false;
            }
        } else {
            // user is not authenticated
            return false;
        }
    }

    /**
     * Get the current user's username
     *
     * @returns the the current user's username or null if not authenticated
     */
    getUsername(): string | null {
        if (this.isAuthenticated()) {
            // user is authenticated (valid token found)

            // get the parsed token
            const token = this.parseToken(this.getRawToken());

            // return the token subject
            return token.sub;
        } else {
            // user is not authenticated
            return null;
        }
    }

    /**
     * Get the registration endpoint for the specified role
     *
     * @param role the application role name to get the endpoint for
     *
     * @returns the the registration url for the specified application role
     */
    private getRegistrationUrlGivenRole(role: ApplicationRole): string {
        switch (role) {
            case ApplicationRole.Student:
                return AuthService.STUDENT_REGISTER_URL;
            case ApplicationRole.Teacher:
                return AuthService.STUDENT_REGISTER_URL;
            default:
                return AuthService.STUDENT_REGISTER_URL;
        }
    }

    /**
     * Retrieve a raw jwt token from the browser.
     *
     * @returns a raw jwt token or null if no jwt token is found
     */
    private getRawToken(): string | null {
        const sessionStorageToken = sessionStorage.getItem(
            AuthService.TOKEN_NAME
        );
        const localStorageToken = localStorage.getItem(AuthService.TOKEN_NAME);

        // attempt to get token from session storage first
        if (sessionStorageToken) {
            // validate token format
            if (this.tokenIsJwtFormat(sessionStorageToken)) {
                // return raw token
                return sessionStorageToken;
            }
        }

        // attempt to get token from local storage
        if (localStorageToken) {
            // validate token format
            if (this.tokenIsJwtFormat(localStorageToken)) {
                // return raw token
                return localStorageToken;
            }
        }

        // no jwt token found
        return null;
    }

    /**
     * Check if the raw token is a jwt token.
     *
     * @param rawToken the raw token to validate
     *
     * @returns whether or not the token is a jwt token
     */
    private tokenIsJwtFormat(rawToken: string): boolean {
        if (!rawToken) {
            // no token
            return false;
        } else if (!rawToken.length) {
            // token is empty
            return false;
        } else if (rawToken.split('.').length !== 3) {
            // invalid jwt token format
            return false;
        } else {
            // valid token
            return true;
        }
    }

    /**
     * Check if the parsed token has expired.
     *
     * @param parsedToken the parsed token to check
     *
     * @returns whether or not the token is expired
     */
    private tokenIsExpired(parsedToken: TokenPayloadModel): boolean {
        // local date
        const now = new Date();

        // local date in milliseconds
        const nowInMilli = now.getTime();

        // token expiration in milliseconds
        const expInMilli = parsedToken.exp.getTime();

        // token expiration - now
        const timeDifference = expInMilli - nowInMilli;

        if (timeDifference < 0) {
            // token has expired
            return true;
        } else {
            // token is valid
            return false;
        }
    }

    /**
     * Parse the raw jwt token.
     * This method assumes a valid jwt token and should only
     * be called after calling the `tokenIsJwtFormat()` method
     *
     * @param rawToken the raw jwt token to parse
     *
     * @returns a `TokenPayloadModel` object
     */
    private parseToken(rawToken: string): TokenPayloadModel {
        // decode token payload
        const payloadBase64Url = rawToken.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64Url));

        // token expiration
        const exp = new Date(0); // begining of UTC converted to local timezone
        const payloadExpInMillis = payload.exp; // parsed token expiration in milliseconds
        exp.setUTCSeconds(payloadExpInMillis); // add number of milliseconds to expiration
        console.log(exp);

        // user roles
        let roles: ApplicationRole[];
        const userRoles = payload.roles;

        if (Array.isArray(userRoles)) {
            roles = userRoles;
        } else {
            roles = [userRoles];
        }

        const sub = payload.sub; // subject
        const uid = payload.uid; // uid
        const iss = payload.iss; // issuer
        const aud = payload.aud; // audience

        // create the token model
        const tokenModel = {
            sub: sub,
            roles: roles,
            uid: uid,
            exp: exp,
            iss: iss,
            aud: aud
        } as TokenPayloadModel;

        // set authentication status
        this.authenticated = true;

        // broadcast authentication status to all subscribers
        this.authenticationStatus.next(true);
        return tokenModel;
    }

    /**
     * Store the raw token upon successful authentication
     *
     * @param responseBody the body of the http response from the `login()` method
     * @param remember wether or not to remember the user during their next visit
     */
    private storeToken(
        responseBody: LoginSuccessModel,
        remember: boolean
    ): void {
        if (remember) {
            // keep token after user closes the browser tab
            localStorage.setItem(AuthService.TOKEN_NAME, responseBody.token);
            // remove any previously stored session token
            sessionStorage.removeItem(AuthService.TOKEN_NAME);
        } else {
            // remove when user closes the browser tab
            sessionStorage.setItem(AuthService.TOKEN_NAME, responseBody.token);
            // remove any previously stored local storage token
            localStorage.removeItem(AuthService.TOKEN_NAME);
        }

        // set authentication status
        this.authenticated = true;

        // broadcast authentication status to all subscribers
        this.authenticationStatus.next(true);
    }

    /**
     * Handle an error from the `login()` method and format a custom error message
     *
     * @param error the error from the `login()` method
     *
     * @returns an error of of type `Observabe<never>` with a message
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            console.error('An error occurred:', error.error.message);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            console.error('Invalid Username or Password');
        }
        // return an observable with a user-facing error message
        return throwError('Invalid Username or Password');
    }
}
