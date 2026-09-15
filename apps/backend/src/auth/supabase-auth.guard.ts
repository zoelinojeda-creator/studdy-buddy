import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
// jwks-rsa es un modulo CommonJS puro (export = , sin __esModule) — un
// import default normal compila mal sin esModuleInterop (ver diagnostico).
// Esta sintaxis compila a un require() plano, que es lo que el paquete
// realmente espera.
import jwksClient = require('jwks-rsa');

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Se crea recien al primer uso (no a nivel de modulo) para no leer
// SUPABASE_JWKS_URL antes de que ConfigModule.forRoot() cargue el .env —
// mismo problema de orden que ya tuvimos con DATABASE_URL.
let client: jwksClient.JwksClient | null = null;

function getClient(): jwksClient.JwksClient {
  if (!client) {
    const jwksUri = process.env.SUPABASE_JWKS_URL;
    if (!jwksUri) throw new Error('Falta la variable de entorno SUPABASE_JWKS_URL');
    client = jwksClient({
      jwksUri,
      cache: true,
      // Por debajo de los 10 min que Supabase cachea el JWKS de su lado,
      // para no rechazar un token valido firmado con una clave recien rotada.
      cacheMaxAge: 5 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }
  return client;
}

function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  getClient().getSigningKey(header.kid, (err, key) => {
    if (err || !key) return callback(err ?? new Error('Clave de firma no encontrada'));
    callback(null, key.getPublicKey());
  });
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el header Authorization: Bearer <token>');
    }

    const token = authHeader.slice('Bearer '.length);

    return new Promise((resolve, reject) => {
      jwt.verify(token, getSigningKey, { algorithms: ['ES256'] }, (err, decoded) => {
        if (err || !decoded || typeof decoded === 'string' || !decoded.sub) {
          reject(new UnauthorizedException('Token invalido o vencido'));
          return;
        }
        request.userId = decoded.sub;
        resolve(true);
      });
    });
  }
}
