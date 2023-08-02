import { MessagesEvent } from "src/interfaces";

export const SUCCESS_DELETE_KEY = 'Ключ был успешно удален';
export const TICK_UPDATED_PERIOD = 'Tick created from update period';

export const initArticleMessage = (article: string, options) => {
  switch (options.event) {
    case MessagesEvent.ADD_KEYS: {
      return `В ваш существующий артикул: ${article} было добавленно ключей ${options.count_all} и востановленно ${options.count_activate}`
    }
    case MessagesEvent.CREATE_ARTICLES: {
      return `Ваш артикул ${article} инициализируется...`;
    }
  }
};
