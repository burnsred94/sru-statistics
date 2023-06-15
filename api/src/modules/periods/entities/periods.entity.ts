import mongoose from 'mongoose';

export class PeriodsEntity {
  position: number | string;
  timestamp: string;
  difference: string;
  options: {
    day: '2-digit';
    month: '2-digit';
    year: 'numeric';
  };

  constructor(position: number | string, difference = '0') {
    this.position = String(position);
    this.difference = difference;
    this.timestamp = this.date();
  }

  date() {
    let date = new Date();
    date = new Date(
      date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }),
    );
    const formattedDate = date.toLocaleDateString('ru-RU', this.options);
    return formattedDate;
  }

  mockPeriod(timestamp: string) {
    return {
      _id: new mongoose.Types.ObjectId(),
      position: this.position,
      difference: this.difference,
      timestamp: timestamp,
    };
  }
}
