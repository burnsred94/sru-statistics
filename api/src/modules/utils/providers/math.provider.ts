import { Injectable } from '@nestjs/common';

@Injectable()
export class MathUtils {

  options: {
    day: '2-digit';
    month: '2-digit';
    year: 'numeric';
  };

  async calculateAverage(data: any[]): Promise<number> {
    let average = data.reduce((accumulator, item) => {
      let number_ = item.position.at(-1).position;
      if (number_.at(-1) === '+') {
        number_ = 0;
      }
      return accumulator + Number(number_);
    }, 0);

    average = average / data.length;

    return Math.round(average);
  }

  async calculateDiff(firstItem: any, secondItem: any) {
    if (firstItem !== undefined && secondItem !== undefined) {
      const first = Number(firstItem.position);
      const second = Number(secondItem.position);

      if (Number.isNaN(first) === true || Number.isNaN(second)) {
        return '0';
      } else if (first === Number.NaN && second === Number.NaN) {
        return '0';
      } else {
        const result = second - first;
        return result > 0 ? `+${String(result)}` : `${String(result)}`;
      }
    } else {
      return '0';
    }
  }

  async currentDate() {
    let date = new Date();
    date = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
    const formattedDate = new Date(date.setDate(date.getDate() + 0)).toLocaleDateString(
      'ru-RU',
      this.options,
    );
    return formattedDate;
  }
}
