export enum RedisProcessorsArticleEnum {
  ARTICLE_CREATE = 'create-article',
  FIND_BY_ARTICLE = 'find-by-article',
  ARTICLE_UPDATE_KEY = 'update-article-key',
  ARTICLE_UPDATE_STATS_EVERY_DAY = 'update-article-stats',
  UPDATE_ARTICLE_FROM_PROFILE = 'update-article-profile',
  FIND_ALL_BY_USER = 'find-all-by-user',
  REMOVE_KEYS = 'remove-keys',
}

export enum RedisProcessorsKeysEnum {
  CREATE_KEY = 'create-key',
  FIND_BY_ID = 'find-by-id',
  UPDATE_KEYS = 'update-keys',
}