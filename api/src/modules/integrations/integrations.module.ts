import { Module } from "@nestjs/common";
import { ProfilesIntegrationModule } from "./profiles/profiles-integration.module";
import { ProductsIntegrationModule } from "./products/products-integration.module";
import { CoreKeysIntegrationModule } from "./core-keys/core-keys-integration.module";

const INTEGRATIONS_MODULES = [
    ProfilesIntegrationModule,
    ProductsIntegrationModule,
    CoreKeysIntegrationModule
]

@Module({
    imports: [
        ...INTEGRATIONS_MODULES
    ],
    exports: [
        ...INTEGRATIONS_MODULES
    ]
})
export class IntegrationModule { }