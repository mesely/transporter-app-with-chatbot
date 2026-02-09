import { Module } from '@nestjs/common';
import { DataService } from './data.service';

import { UsersModule } from '../users/users.module';
import { MigrationController } from './data.controller';

@Module({
  imports: [UsersModule],
  controllers: [MigrationController],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}