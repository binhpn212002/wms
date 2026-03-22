import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import firebaseConfig from './config/firebase.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import { AttributeValuesModule } from './modules/attribute-values/attribute-values.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { UnitsModule } from './modules/units/units.module';
import { ProductsModule } from './modules/products/products.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { InboundModule } from './modules/inbound/inbound.module';
import { OutboundModule } from './modules/outbound/outbound.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, firebaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const env = configService.get<string>('app.env');
        return {
          type: 'postgres',
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
          autoLoadEntities: true,
          synchronize: env === 'development',
          logging: env === 'development',
        };
      },
    }),
    CategoriesModule,
    AttributesModule,
    AttributeValuesModule,
    UnitsModule,
    ProductsModule,
    SuppliersModule,
    InventoryModule,
    InboundModule,
    OutboundModule,
    WarehousesModule,
    UserModule,
    AuthModule,
    // RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
