import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type MetricsDocument = HydratedDocument<Metrics>;

@Schema({
    versionKey: false,
})
export class Metrics {
    @Prop({ type: String, default: null })
    top_100: string;

    @Prop({ type: String, default: null })
    top_1000: string;

    @Prop({ type: String, default: null })
    indexes: string

    @Prop({ type: String, default: null })
    middle_pos_organic: string;

    @Prop({ type: String, default: null })
    middle_pos_adverts: string;

    @Prop({ type: Object, default: null })
    middle_pos_cities: object;
}

export const MetricsSchema = SchemaFactory.createForClass(Metrics);
