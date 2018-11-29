// Angular modules
import { Injectable } from '@angular/core';
import {
    HttpClient,
    HttpErrorResponse,
    HttpHeaders
} from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

// App models
import { ApplicationRole } from './model/application-role.enum';
import { CredentialModel } from './model/credential-model';
import { LoginSuccessModel } from './model/login-success-model';
import { TokenPayloadModel } from './model/token-model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private static readonly LOGIN_URL =
        'https://groupgradingapi.azurewebsites.net/login';
    private static readonly TOKEN_NAME = 'token';
    private static readonly INVALID_TOKEN_MSG = 'invalid token';
    private static readonly LOGIN_SUCCESS_MSG = 'login success';
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
     * @param remember wether or not to remember the user during their next visit
     *
     * @returns an `Observable` with a message upon success.
     *
     * @publicApi
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
     *
     * @publicApi
     */
    logout(): void {
        sessionStorage.removeItem(AuthService.TOKEN_NAME);
        localStorage.removeItem(AuthService.TOKEN_NAME);
        this.authenticated = false;
        this.authenticationStatus.next(false); // broadcast updated auth status to subscribers
    }

    /**
     * Check if the current user is authenticated.
     *
     * @returns the current user's authentication status
     *
     * @publicApi
     */
    isAuthenticated(): boolean {
        if (this.authenticated) {
            // user is authenticated
            return true;
        }

        // not authenticated (user potentially refreshed the browser)
        // attempt to retrieve stored token
        const token = this.getToken();

        if (token) {
            // valid token
            return true;
        }

        // no valid token found
        return false;
    }

    /**
     * Check if the current user is in the specified role.
     *
     * @param roleName the name of the role to check
     *
     * @returns whether ir not the user is in the specified role
     *
     * @publicApi
     */
    isInRole(roleName: ApplicationRole): boolean {
        if (this.isAuthenticated()) {
            // user is authenticated

            // get the token from storage
            const token = this.getToken();

            if (token) {
                // token is valid
                if (token.roles.includes(roleName)) {
                    // user is in the specified role
                    return true;
                } else {
                    // user is not in the specified role
                    return false;
                }
            } else {
                // token is invalid
                return false;
            }
        }

        // user is not authenticated
        return false;
    }

    /**
     * Retrive a token from the browser.
     *
     * @returns a `TokenPayloadModel` object or null if no valid token is found
     *
     * @privateApi
     */
    private getToken(): TokenPayloadModel {
        const sessionStorageToken = sessionStorage.getItem(
            AuthService.TOKEN_NAME
        );
        const localStorageToken = localStorage.getItem(AuthService.TOKEN_NAME);

        // attempt to get token from session storage first
        if (sessionStorageToken) {
            // validate token
            if (this.tokenIsValid(sessionStorageToken)) {
                // return parsed token
                return this.parseToken(sessionStorageToken);
            }
        }

        // attempt to get token from local storage
        if (localStorageToken) {
            // validate token
            if (this.tokenIsValid(localStorageToken)) {
                // return parsed token
                return this.parseToken(localStorageToken);
            }
        }

        // no valid token found
        return null;
    }

    /**
     * Check if the raw token is valid.
     *
     * @param rawToken the token to validate
     *
     * @returns whether or not the token is valid
     *
     * @privateApi
     */
    private tokenIsValid(rawToken: string): boolean {
        if (!rawToken) {
            // no token
            return false;
        } else if (!rawToken.length) {
            // token is empty
            return false;
        } else if (rawToken.split('.').length !== 3) {
            // invalid jwt token format
            return false;
        } else if (this.tokenIsExpired(this.parseToken(rawToken))) {
            // token has expired
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
     *
     * @privateApi
     */
    private tokenIsExpired(parsedToken: TokenPayloadModel): boolean {
        const now = new Date();
        const nowMilli = now.getTime();
        const expMilli = parsedToken.exp.getTime();
        return expMilli - nowMilli < 0;
    }

    /**
     * Parse the valid raw token.
     * This method assumes a validated token and
     * should only be called after calling the `tokenIsValid()` method
     *
     * @param rawToken the raw token to parse
     *
     * @returns if the token is expired
     *
     * @privateApi
     */
    private parseToken(rawToken: string): TokenPayloadModel {
        // decode token payload
        const payloadBase64Url = rawToken.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64Url));

        // username
        const sub = payload.sub; // username

        // token expiration
        const expDate = new Date(0); // begining of UTC converted to local timezone
        expDate.setUTCSeconds(payload.exp); // add number of seconds to expiration
        const exp = expDate; // token expiration in local timezone

        // user roles
        let roles: ApplicationRole[];
        const userRoles = payload.roles;
        if (Array.isArray(userRoles)) {
            roles = [...roles];
        } else {
            roles = [userRoles];
        }

        // issuer
        const iss = payload.iss;

        // audience
        const aud = payload.aud;

        // set authentication status
        this.authenticated = true;

        // broadcast authentication status to all subscribers
        this.authenticationStatus.next(true);

        // create the token model
        const tokenModel = {
            sub: sub,
            roles: roles,
            exp: exp,
            iss: iss,
            aud: aud
        } as TokenPayloadModel;

        return tokenModel;
    }

    /**
     * Store the raw token upon successful authentication
     *
     * @param responseBody the body of the http response from the `login()` method
     * @param remember wether or not to remember the user during their next visit
     *
     * @privateApi
     */
    private storeToken(
        responseBody: LoginSuccessModel,
        remember: boolean
    ): void {
        if (remember) {
            // remove when user closes the browser tab
            sessionStorage.setItem(AuthService.TOKEN_NAME, responseBody.token);
            // remove any previously stored local storage token
            localStorage.removeItem(AuthService.TOKEN_NAME);
        } else {
            // keep token after user closes the browser tab
            localStorage.setItem(AuthService.TOKEN_NAME, responseBody.token);
            // remove any previously stored session token
            sessionStorage.removeItem(AuthService.TOKEN_NAME);
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
     *
     * @privateApi
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            console.error('An error occurred:', error.error.message);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            console.error('Incorrect Email or Password');
        }
        // return an observable with a user-facing error message
        return throwError('Incorrect Email or Password');
    }
}
