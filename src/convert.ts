import * as pdfjs from 'pdfjs';
import * as fs from 'fs';
import * as ProgressBar from 'progress';
import { PDFDocument } from 'pdf-lib';
import { fromBuffer } from 'pdf2pic';
import { ConvertResult } from './types';
import { ImageFormat } from './variables';

const FORMAT = ImageFormat.JPG;

// Quality performance for render 99 pages PDF file
// -------------------------------
// 1 vCPU, 2GB memory per container
// 1 = 0m50s; 2 = 1m30s; 3 = 2m29s
// -------------------------------
// 2 vCPU, 2GB memory per container
// 1 = 0m42s; 2 = 1m03s; 3 = 1m30s

const MAX_QUALITY = 3;
const MIN_QUALITY = 1;

export async function convertPDF(
  inputBuffer: Buffer,
  qualityMultiplier: number = 3
): Promise<ConvertResult> {
  const response: ConvertResult = {
    message: 'convert PDF to image failed!',
    buffer: null,
  };
  const pdfDoc = await PDFDocument.load(inputBuffer);
  const pageCount = pdfDoc.getPageCount();
  const { width, height } = pdfDoc.getPage(0).getSize();
  const bar = _initProgress(pageCount);

  qualityMultiplier = Math.min(
    Math.max(qualityMultiplier, MIN_QUALITY),
    MAX_QUALITY
  );
  const options = {
    density: 100 * qualityMultiplier,
    saveFilename: 'file',
    savePath: './temp',
    format: FORMAT,
    width: width * qualityMultiplier,
    height: height * qualityMultiplier,
  };

  let outputFilePath = '';
  try {
    const storeAsImage = fromBuffer(inputBuffer, options);
    const doc = new pdfjs.Document();
    const cell = doc.cell();

    for (let i = 1; i <= pageCount; i++) {
      bar.tick();
      await storeAsImage(i);
      outputFilePath = `./temp/file.${i}.${FORMAT}`;
      const buffer = fs.readFileSync(outputFilePath);
      const pdfImage = new pdfjs.Image(buffer);
      cell.image(pdfImage);
      fs.rmSync(outputFilePath);
    }
    response.message = 'convert PDF to image success!';
    response.buffer = await doc.asBuffer();
  } catch (e) {
    console.log(e);
    fs.rmSync(outputFilePath);
  } finally {
    return response;
  }
}

export function printMemoryUsage() {
  const { rss, heapUsed, heapTotal } = process.memoryUsage();
  console.log(
    `RSS: ${_convertToMB(rss)}MB, Heap Used: ${_convertToMB(
      heapUsed
    )}MB, Heap Total: ${_convertToMB(heapTotal)}MB`
  );
}

function _convertToMB(bytes: number) {
  return Math.floor(bytes / 1024 / 1024);
}

function _initProgress(total: number) {
  return new ProgressBar('converting [:bar] :rate/bps :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total,
  });
}
