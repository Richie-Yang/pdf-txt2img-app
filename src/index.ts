import * as Koa from 'koa';
import * as cors from '@koa/cors';
import * as Router from '@koa/router';
import * as multer from '@koa/multer';
import * as logger from 'koa-logger';
import * as mount from 'koa-mount';
import { parseBody, logRequest, validateToken } from './middlewares';
import { respondData, respondError, respondMessage } from './responses';
import { CONFIG } from './config';
import { convertPDF } from './convert';
import { ConvertRequest } from './types';
import { DataType } from './variables';

const app = new Koa({ proxy: true });
const router = new Router();
const uploadFile = multer();

app.use(
  cors({
    origin: CONFIG.FRONTEND_DOMAIN,
  })
);
app.use(parseBody());
app.use(logger());
app.use(logRequest());

app.use(async (ctx: Koa.Context, next: Koa.Next) => {
  try {
    await next();
    return ctx;
  } catch (err) {
    return respondError(ctx, err);
  }
});

router.get('/test', validateToken, async (ctx: Koa.Context) =>
  respondMessage(ctx, 'ok')
);

router.post(
  '/convert',
  validateToken,
  uploadFile.single('file'),
  async (ctx: Koa.Context) => {
    const content = ctx.request.file;
    const { responseType, quality } = ctx.request.body as ConvertRequest;
    if (!content?.buffer || !content?.mimetype)
      return respondError(ctx, 'no file uploaded!');
    if (content.mimetype !== 'application/pdf')
      return respondError(ctx, 'file is not a pdf!');

    const res = await convertPDF(content.buffer, quality);

    switch (responseType) {
      case DataType.BUFFER:
        return respondData(ctx, res);
      case DataType.FILE:
        const newFileName = `${content.originalname.replace(
          '.pdf',
          '_converted.pdf'
        )}`;
        ctx.set('Access-Control-Expose-Headers', '*');
        ctx.set('Access-Control-Allow-Credentials', 'true');
        ctx.set('Transfer-Encoding', 'chunked');
        ctx.set('Content-Type', 'application/pdf');
        ctx.attachment(newFileName);
        ctx.body = res.buffer;
        return ctx;
      default:
        return respondError(ctx, 'invalid response type');
    }
  }
);

app.use(mount('/', router.routes()));

app.listen(CONFIG.PORT);
