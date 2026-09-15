import { Module } from '@nestjs/common';
import { WhoamiController } from './whoami.controller';
import { SetRolController } from './set-rol.controller';

@Module({
  controllers: [WhoamiController, SetRolController],
})
export class AuthModule {}
