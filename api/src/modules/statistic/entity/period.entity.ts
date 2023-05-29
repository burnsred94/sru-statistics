import { randomUUID } from 'node:crypto';

export class PeriodsEntity {
  position: number | string;
  timestamp: string;
  difference: string;
  options: {
    timeZone: 'Europe/Moscow';
    day: '2-digit';
    month: '2-digit';
    year: 'numeric';
  };

  constructor(position: number | string, difference = '0') {
    this.position = String(position);
    this.difference = difference;
    this.timestamp = this.formatter().format(new Date());
  }

  formatter() {
    const format = new Intl.DateTimeFormat('ru-RU', this.options);
    return format;
  }

  mockPeriod(timestamp: string) {
    return {
      _id: randomUUID(),
      position: this.position,
      difference: this.difference,
      timestamp: timestamp,
    };
  }
}
