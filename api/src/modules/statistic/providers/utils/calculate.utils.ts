import { Position } from 'src/modules/interfaces';

export class CalculateUtils {
  async difference(value, position) {
    const typeValue = value as Position;
    const beforeValue = Number(typeValue.position);
    const afterValue = Number(position);
    console.log(beforeValue, afterValue);

    if (Number.isNaN(beforeValue) && Number.isNaN(afterValue)) {
      return '0';
    }
    if (!Number.isNaN(beforeValue) && Number.isNaN(afterValue)) {
      const result = String(afterValue);
      return `+${result}`;
    }
    if (!Number.isNaN(beforeValue) && !Number.isNaN(afterValue)) {
      if (beforeValue === afterValue) return '0';
      if (beforeValue > afterValue) {
        const result = String(beforeValue - afterValue);
        return `+${result}`;
      } else {
        const result = String(beforeValue - afterValue);
        return result;
      }
    }
  }
}
