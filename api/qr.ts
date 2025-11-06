import type { VercelRequest, VercelResponse } from '@vercel/node';
import qrcode from 'qrcode-generator';

// Alphanumeric 字符集（QR 标准）
const ALNUM_RE = /^[0-9A-Z $%*+\-./:]*$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 文本来源：优先 query，再 body
    const text =
      (req.query.text as string) ??
      (typeof req.body === 'object' && req.body?.text);

    if (!text || typeof text !== 'string') {
      res.status(400).send('Missing "text"');
      return;
    }

    // 参数：容错等级/边距/反色
    const ecc = (req.query.ecc as string)?.toUpperCase?.() ||
                (typeof req.body === 'object' && (req.body as any)?.ecc) ||
                'L'; // L/M/Q/H
    const marginRaw =
      (req.query.margin as string) ??
      (typeof req.body === 'object' && (req.body as any)?.margin);
    const margin = Math.max(0, Math.min(8, Number(marginRaw ?? 2))); // 模块为单位

    const invert = ['1', 'true', 'yes'].includes(
      String(
        (req.query.invert as string) ??
        (typeof req.body === 'object' && (req.body as any)?.invert) ??
        '0'
      ).toLowerCase()
    );

    // 让库自动挑最小版本：typeNumber=0
    // ecc: 'L' | 'M' | 'Q' | 'H'
    const typeNumber = 0;
    const qr = qrcode(typeNumber, (ecc as 'L' | 'M' | 'Q' | 'H') || 'L');

    // 若可用 Alphanumeric 模式，能减少版本
    if (ALNUM_RE.test(text)) {
      qr.addData(text.toUpperCase(), 'Alphanumeric');
    } else {
      // 其他情况用 Byte 模式
      qr.addData(text, 'Byte');
    }
    qr.make(); // 生成最小可行版本

    const count = qr.getModuleCount();
    const quiet = Math.floor(margin);

    const darkPixel = '██';
    const lightPixel = '  ';

    const lines: string[] = [];

    // 扩展安静区后渲染
    for (let y = -quiet; y < count + quiet; y++) {
      let row = '';
      for (let x = -quiet; x < count + quiet; x++) {
        const isDark =
          x >= 0 && y >= 0 && x < count && y < count ? qr.isDark(y, x) : false;
        const pixel = invert ? (isDark ? lightPixel : darkPixel)
                             : (isDark ? darkPixel : lightPixel);
        row += pixel;
      }
      lines.push(row);
    }

    // 文本输出
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    // 长期可缓存（同样的输入输出一样）
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(lines.join('\n'));
  } catch (err: any) {
    res.status(500).send(err?.message || 'Internal Server Error');
  }
}
