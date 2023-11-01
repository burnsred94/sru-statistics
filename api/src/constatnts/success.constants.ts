import { MessagesEvent } from 'src/interfaces';

export const SUCCESS_DELETE_KEY = 'Ключ был успешно удален';
export const TICK_UPDATED_PERIOD = 'Tick created from update period';

export const initArticleMessage = (data, options, option_data?) => {
  switch (options.event) {
    case MessagesEvent.ADD_KEYWORDS: {
      return `В ваш существующий артикул: ${data} было добавлено ключей ${options.newKeywords} и восстановлено ${options.oldKeywords}.`;
    }
    case MessagesEvent.NOT_ADDED_KEYS: {
      return `В ваш существующий артикул: ${data} было добавлено ключей ${options.count_all}.`;
    }
    case MessagesEvent.CREATE_ARTICLE: {
      return `Ваш артикул: ${data} успешно загружен и обрабатывается.`;
    }
    case MessagesEvent.DELETE_ARTICLES: {
      return data.articles.length > 1
        ? `Артикулы в количествe ${data.articles.length} были удалены.`
        : `Артикул: ${data.articles.at(0)} был удален`;
    }
    case MessagesEvent.ADD_KEYS_TO_ARTICLES: {
      return `Ключи ${option_data} в артикул: ${data} были добавлены.`;
    }
    case MessagesEvent.DELETE_KEY: {
      return `Было удалено ${options.length} ключей из артикула`;
    }
    case MessagesEvent.ENABLED_ARTICLE: {
      return `Ваш артикул: ${data} был восстановлен.`;
    }
    case MessagesEvent.REFRESH_KEY: {
      return `Ваш ключ «${data}» обновляется.`;
    }
    case MessagesEvent.REFRESH_ARTICLE: {
      return `Ваш артикул «${data.article}» обновляется.`;
    }
  }
};
