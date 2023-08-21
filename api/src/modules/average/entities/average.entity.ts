import { randomUUID } from 'node:crypto';
import { AverageStatus, IAverage } from 'src/interfaces';

export class AverageEntity {
  timestamp: string;
  average: string;
  userId: number;
  status_update: string;
  difference: string;
  delimiter: number;
  options: {
    day: '2-digit';
    month: '2-digit';
    year: 'numeric';
  };

  constructor(data: IAverage) {
    this.average = data.average;
    this.userId = data.userId;
    this.status_update = AverageStatus.WAIT_SENDING;
    this.delimiter = 0;
    this.difference = data.difference;
    this.timestamp = this.date();
  }

  date() {
    let date = new Date();
    date = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
    const formattedDate = new Date(date.setDate(date.getDate() + 1)).toLocaleDateString(
      'ru-RU',
      this.options,
    );
    // const formattedDate = date.toLocaleDateString('ru-RU', this.options);
    return formattedDate;
  }

  mock(time: string) {
    return {
      _id: randomUUID(),
      average: '-',
      timestamp: time,
    };
  }
}
