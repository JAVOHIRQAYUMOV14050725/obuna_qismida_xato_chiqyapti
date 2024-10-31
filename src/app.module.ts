import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { CourseModule } from './course/course.module';
import { ModuleModule } from './module/module.module';
import { LessonModule } from './lesson/lesson.module';
import { AssignmentModule } from './assignment/assignment.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { SubmissionModule } from './submission/submission.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import redisStore from 'cache-manager-redis-store'; // Ensure this is the default export
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './exception_filter';
import { AuthGuard } from './guards/auth.guard';
import { JwtService } from '@nestjs/jwt';

const store = redisStore as unknown as (options?: any) => any;

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: +configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USER') || 'postgres',
        password: configService.get<string>('DB_PASSWORD') || '4545',
        database: configService.get<string>('DB_NAME') || 'online_course',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        store,
        url: `redis://${configService.get<string>('REDIS_HOST') || 'localhost'}:${configService.get<number>('REDIS_PORT') || 6379}`,
        ttl: +configService.get<number>('CACHE_TTL') || 3600,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    CourseModule,
    ModuleModule,
    LessonModule,
    AssignmentModule,
    EnrollmentModule,
    SubmissionModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AuthGuard,
    JwtService,
    AppService,
    ConfigService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [AuthGuard],
})
export class AppModule { }
