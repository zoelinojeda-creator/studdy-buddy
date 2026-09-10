import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el header Authorization: Bearer <token>');
    }

    const token = authHeader.slice('Bearer '.length);
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('Falta la variable de entorno SUPABASE_JWT_SECRET');
    }

    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;
      if (!payload.sub) {
        throw new UnauthorizedException('El token no tiene un "sub" valido');
      }
      request.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Token invalido o vencido');
    }
  }
}
