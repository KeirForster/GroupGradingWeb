import { ApplicationRole } from './application-role.enum';

export class TokenPayloadModel {
    constructor(
        public sub: string,
        public roles: ApplicationRole[],
        public exp: Date,
        public iss: string,
        public aud: string
    ) {}
}
