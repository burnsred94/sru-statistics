import { ArgumentMetadata, BadRequestException, Logger, PipeTransform, Type } from "@nestjs/common";
import { Types } from "mongoose";


export class TransformMongoIdPipe implements PipeTransform<string, Types.ObjectId> {
    protected readonly logger = new Logger(TransformMongoIdPipe.name);

    transform(value: string, metadata: ArgumentMetadata): Types.ObjectId {
        try {
            const id = new Types.ObjectId(value);

            if (id instanceof Types.ObjectId) {
                return id;
            } else {
                throw new BadRequestException(`Transform failed metadata, type crashed ${metadata.type}`);
            }
        } catch (error) {
            this.logger.warn(error.message);
        }
    }

}