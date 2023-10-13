export class MetricEntity {
  async initMetric(data, oldMetric) {
    if (data.ads.num > 0) {
      const middle_ads = Math.round(data.ads.num / data.ads.del);
      return {
        $set: {
          top_100: [
            ...oldMetric.top_100.filter(element => element.ts !== data.ts),
            { ts: data.ts, met: data.top_100 },
          ],
          top_1000: [
            ...oldMetric.top_1000.filter(element => element.ts !== data.ts),
            { ts: data.ts, met: data.top_1000 },
          ],
          indexes: [
            ...oldMetric.indexes.filter(element => element.ts !== data.ts),
            { ts: data.ts, met: data.index },
          ],
          middle_pos_adverts: [
            ...oldMetric.middle_pos_adverts.filter(element => element.ts !== data.ts),
            { ts: data.ts, met: middle_ads },
          ],
          middle_pos_organic: [
            ...oldMetric.middle_pos_organic.filter(element => element.ts !== data.ts),
            { ts: data.ts, met: 0 },
          ],
        },
        middle_pos_cities: data.city_metric,
      };
    } else {
      const middle_pos = Math.round(data.org.num / data.org.del);
      return {
        $set: {
          top_100: [
            ...oldMetric.top_100.filter(element => element.ts !== data.ts),
            { ts: data.ts, met: data.top_100 },
          ],
          top_1000: [
            ...oldMetric.top_1000.filter(element => element.ts !== data.ts),
            { ts: data.ts, met: data.top_1000 },
          ],
          indexes: [
            ...oldMetric.indexes.filter(element => element.ts !== data.ts),
            { ts: data.ts, met: data.index },
          ],
          middle_pos_adverts: [
            ...oldMetric.middle_pos_adverts.filter(element => element.ts !== data.ts),
            { ts: data.ts, met: 0 },
          ],
          middle_pos_organic: [
            ...oldMetric.middle_pos_organic.filter(element => element.ts !== data.ts),
            { ts: data.ts, met: middle_pos },
          ],
        },
        middle_pos_cities: data.city_metric,
      };
    }
  }
}
