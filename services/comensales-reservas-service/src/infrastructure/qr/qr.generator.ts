import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { QrGeneratorPort } from '../../use-cases/ports';

@Injectable()
export class QrGenerator extends QrGeneratorPort {
  async generar(payload: object): Promise<string> {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64');
    // devolvemos data URL (PNG) + el token base64 incrustado como path simple
    const dataUrl = await QRCode.toDataURL(data);
    return `${data}::${dataUrl}`;
  }
}
