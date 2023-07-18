import { randomUUID } from 'node:crypto';
import { IAverage } from 'src/interfaces';

export class AverageEntity {
  timestamp: string;
  average: string;
  options: {
    day: '2-digit';
    month: '2-digit';
    year: 'numeric';
  };

  constructor(data: IAverage) {
    this.average = data.average;
    this.timestamp = this.date();
  }

  date() {
    let date = new Date();
    date = new Date(
      date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }),
    );
    // const formattedDate = new Date(
    //   date.setDate(date.getDate() + 1),
    // )
    const formattedDate = date.toLocaleDateString('ru-RU', this.options);
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
