import mongoose from 'mongoose';
import { StatusPvz } from 'src/interfaces';

export class PeriodsEntity {
  position: string;
  timestamp: string;
  difference: string;
  status: string;
  options: {
    day: '2-digit';
    month: '2-digit';
    year: 'numeric';
  };

  constructor(position: string, difference = '0') {
    this.position = position;
    this.difference = difference;
    this.status = StatusPvz.PENDING;
    this.timestamp = this.date();
  }

  date() {
    let date = new Date();
    date = new Date(
      date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }),
    );
    // const formattedDate = new Date(
    //   date.setDate(date.getDate() + 1),
    // ).toLocaleDateString('ru-RU', this.options);
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
