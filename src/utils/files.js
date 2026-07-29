import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, access, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { extension as mimeExtension } from 'mime-types';

export async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

export async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFileName(input = 'file') {
  return String(input)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 140) || 'file';
}

export function extractDigits(input = '') {
  const match = String(input).match(/\d+/g);
  return match ? match.join('') : '';
}

export function formatTimestampForFile(date = new Date(), timeZone = 'Asia/Kolkata') {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}_${parts.hour}-${parts.minute}-${parts.second}`;
}

export function buildOutputFileName({
  timestamp = new Date(),
  originalName = '',
  mimetype = '',
  messageType = 'file',
  timeZone = 'Asia/Kolkata'
}) {
  const ts = formatTimestampForFile(timestamp, timeZone);

  const parsed = originalName ? path.parse(originalName) : null;
  const baseFromName = parsed?.name ? sanitizeFileName(parsed.name) : '';
  const extFromName = parsed?.ext ? parsed.ext.replace('.', '').toLowerCase() : '';
  const extFromMime = (mimeExtension(String(mimetype || '').toLowerCase()) || '').toLowerCase();

  const finalExt = extFromName || extFromMime || '';
  const base = baseFromName || sanitizeFileName(String(messageType).replace(/Message$/i, '') || 'file');

  return `${ts}_${base}${finalExt ? `.${finalExt}` : ''}`;
}

export async function ensureUniqueFilePath(folderPath, fileName, messageId = '') {
  let candidate = path.join(folderPath, fileName);
  if (!(await pathExists(candidate))) return candidate;

  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  const seed = sanitizeFileName(String(messageId).slice(-8) || 'copy');

  let counter = 1;
  while (await pathExists(candidate)) {
    candidate = path.join(folderPath, `${base}_${seed}${counter > 1 ? `_${counter}` : ''}${ext}`);
    counter += 1;
  }

  return candidate;
}

export async function writeStreamToFile(readableStream, filePath) {
  await pipeline(readableStream, createWriteStream(filePath));
}

export async function sha256File(filePath) {
  const hash = createHash('sha256');
  const stream = createReadStream(filePath);

  await new Promise((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  return hash.digest('hex');
}

export async function safeRename(sourcePath, destinationPath) {
  try {
    await rename(sourcePath, destinationPath);
  } catch (error) {
    await rename(sourcePath, destinationPath).catch(async () => {
      await unlink(destinationPath).catch(() => {});
      await rename(sourcePath, destinationPath);
    });
    if (error) {
      // no-op
    }
  }
}
