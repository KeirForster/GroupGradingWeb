import { ApplicationRole } from './application-role.enum';

export class TokenPayloadModel {
    constructor(
        public sub: string,
        public roles: ApplicationRole[],
        public uid: string,
        public exp: Date,
        public iss: string,
        public aud: string
    ) {}
}
