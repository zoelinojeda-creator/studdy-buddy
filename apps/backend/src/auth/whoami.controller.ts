import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard, AuthenticatedRequest } from './supabase-auth.guard';

@Controller('whoami')
export class WhoamiController {
  @UseGuards(SupabaseAuthGuard)
  @Get()
  getWhoami(@Req() request: AuthenticatedRequest) {
    return { userId: request.userId };
  }
}
