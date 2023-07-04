export enum EventsWS {
  CREATE_ARTICLE = 'article.create',
  ADDED_KEYS = 'article.added-keys',
  REMOVE_KEY = 'article.remove-keys',
  REMOVE_ARTICLE = 'article.remove-article',
}

export enum EventsParser {
  SEND_TO_PARSE = 'parser.send',
}


export enum EventsAverage {
  CALCULATE_AVERAGE = 'calculate.average',
  UPDATE_AVERAGE = 'update.average',
}