import { NextFunction, Request, Response } from 'express';

/**
 * Rejects request bodies sent with `Content-Encoding: br` before any body parser sees them.
 *
 * body-parser 2.x (Express 5) inflates Brotli bodies by default, and the Brotli decoder bundled with unpatched Node.js has an
 * out-of-bounds write (CVE-2026-111497, "Node2Shell"). Browsers never send Brotli-encoded request bodies, so rejecting them
 * costs legitimate clients nothing. gzip and deflate bodies are unaffected.
 */
export const rejectBrotliBody = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers['content-encoding'];
  const encodings = (Array.isArray(header) ? header.join(',') : (header ?? '')).split(',').map((encoding) => encoding.trim().toLowerCase());

  if (encodings.includes('br')) {
    // The body is never read, so close the connection instead of draining it.
    res.setHeader('Connection', 'close');
    res.status(415).json({ statusCode: 415, message: 'Content-Encoding "br" is not supported', error: 'Unsupported Media Type' });
    return;
  }

  next();
};
