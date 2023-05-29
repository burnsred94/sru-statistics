import { Position } from 'src/modules/interfaces';

export class CalculateUtils {
  async difference(value, position) {
    const typeValue = value as Position;
    const beforeValue = Number(typeValue.position);
    const afterValue = Number(position);

    console.log(`beforeValue: ${beforeValue}, afterValue: ${afterValue}`);
    if (Number.isNaN(beforeValue) && Number.isNaN(afterValue)) {
      console.log(`check: beforeValue: string, afterValue: string`)
      return typeValue.position;
    }
    if (Number.isNaN(beforeValue) && Number.isNaN(afterValue)) {
      console.log(`check: beforeValue: string, afterValue: number`)
      const result = String(afterValue);
      return `+${result}`;
    }
    if (!Number.isNaN(beforeValue) && !Number.isNaN(afterValue)) {
      console.log(`check: beforeValue: number, afterValue: number`)
      if (beforeValue > afterValue) {
        console.log(`check: beforeValue > afterValue`)
        const result = String(beforeValue - afterValue);
        return `-${result}`;
      } else {
        console.log(`check: beforeValue < afterValue`)
        const result = String(beforeValue - afterValue);
        return Number(result);
      }
    }
  }
}
