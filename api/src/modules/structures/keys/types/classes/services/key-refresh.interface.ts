import { User } from "src/modules/auth";

export interface IKeysRefreshService {
    refreshKeysInArticle: (article: string, user: User) => void;
}
