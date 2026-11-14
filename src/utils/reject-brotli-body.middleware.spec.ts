import { Body, Controller, INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
import * as request from 'supertest';
import { brotliCompressSync, gzipSync } from 'zlib';
import { rejectBrotliBody } from './reject-brotli-body.middleware';

describe('rejectBrotliBody', () => {
  describe('middleware', () => {
    const run = (contentEncoding?: string | string[]) => {
      const req = { headers: contentEncoding === undefined ? {} : { 'content-encoding': contentEncoding } } as unknown as Request;
      const res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
      const next: NextFunction = jest.fn();

      rejectBrotliBody(req, res, next);

      return { res, next };
    };

    it.each(['br', 'BR', ' br ', 'gzip, br', 'br, gzip', 'identity,Br'])('rejects Content-Encoding "%s" with 415', (value) => {
      const { res, next } = run(value);

      expect(res.status).toHaveBeenCalledWith(415);
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'close');
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects when the header arrives as an array', () => {
      const { res, next } = run(['gzip', 'br']);

      expect(res.status).toHaveBeenCalledWith(415);
      expect(next).not.toHaveBeenCalled();
    });

    it.each(['gzip', 'deflate', 'gzip, deflate', 'identity', 'brotli-like', ''])('lets Content-Encoding "%s" through', (value) => {
      const { res, next } = run(value);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('lets requests without a Content-Encoding header through', () => {
      const { res, next } = run();

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('in a Nest application', () => {
    @Controller('echo')
    class EchoController {
      @Post()
      echo(@Body() body: unknown) {
        return body;
      }
    }

    let app: INestApplication;
    const payload = { name: 'test' };

    // superagent JSON-stringifies any non-string body sent as application/json, so send the compressed bytes untouched.
    const postEncoded = (encoding: string, body: Buffer) =>
      request(app.getHttpServer())
        .post('/echo')
        .set('Content-Type', 'application/json')
        .set('Content-Encoding', encoding)
        .serialize((data) => data)
        .send(body);

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({ controllers: [EchoController] }).compile();
      app = moduleRef.createNestApplication();
      // Same placement as main.ts: before init(), which is when Nest registers its body parsers.
      app.use(rejectBrotliBody);
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('rejects a Brotli-encoded body before the body parser decodes it', async () => {
      // Without the middleware this exact request is decoded by body-parser and echoed back with a 201.
      const response = await postEncoded('br', brotliCompressSync(JSON.stringify(payload)));

      expect(response.status).toBe(415);
      expect(response.body).toEqual({
        statusCode: 415,
        message: 'Content-Encoding "br" is not supported',
        error: 'Unsupported Media Type'
      });
    });

    it('still accepts a gzip-encoded body', async () => {
      const response = await postEncoded('gzip', gzipSync(JSON.stringify(payload)));

      expect(response.status).toBe(201);
      expect(response.body).toEqual(payload);
    });

    it('still accepts an unencoded body', async () => {
      const response = await request(app.getHttpServer()).post('/echo').send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(payload);
    });
  });
});
