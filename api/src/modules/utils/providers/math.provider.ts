import { Injectable } from '@nestjs/common';

@Injectable()
export class MathUtils {
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
      const first = Number.isNaN(+firstItem.position) ? 0 : Number(firstItem.position);
      const second = Number.isNaN(+firstItem.position) ? 0 : Number(secondItem.position);

      if (first === 0 || second === 0) {
        return "0"
      };

      if (first === 0 && second === 0) {
        return "0"
      };

      const result = second - first;
      return result > 0 ? `+${String(result)}` : `${String(result)}`;
    } else {
      return '0';
    }
  }
}
