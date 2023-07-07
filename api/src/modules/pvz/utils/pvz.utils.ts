import { Injectable } from '@nestjs/common';

@Injectable()
export class PvzUtils {
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
      const first = firstItem.position === '1000+' ? 0 : Number(firstItem.position)
      const second = secondItem.position === '1000+' ? 0 : Number(secondItem.position)
      return String(second - first)
    } else {
      return '-'
    }
  }
}
