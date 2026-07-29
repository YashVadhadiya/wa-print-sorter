import path from 'node:path';
import { createWriteStream } from 'node:fs';
import { rename, unlink, rm, readdir } from 'node:fs/promises';
import makeWASocket, {
  Browsers,
  DisconnectReason,
  downloadMediaMessage,
  getContentType,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';

import qrcode from 'qrcode-terminal';
import { ensureDir, ensureUniqueFilePath, buildOutputFileName, extractDigits, writeStreamToFile } from './utils/files.js';

async function clearAuthFolder(authDir) {
  try {
    const files = await readdir(authDir);
    for (const file of files) {
      await rm(path.join(authDir, file), { recursive: true, force: true });
    }
  } catch (err) {
    // ignore
  }
}

export const printableExtensions = new Set([
  'jpg', 'jpeg', 'png', 'webp',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt',
  'zip', 'rar', '7z',
  // CorelDraw
  'cdr', 'cdt', 'cmx', 'cpt',
  // AutoCAD
  'dwg', 'dxf', 'dwt',
  // HEIC/HEIF images
  'heic', 'heif',
  // CSV
  'csv',
  // PowerPoint
  'ppt', 'pptx',
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unwrapContent(content) {
  let current = content;

  while (
    current?.ephemeralMessage?.message ||
    current?.viewOnceMessage?.message ||
    current?.viewOnceMessageV2?.message
  ) {
    current =
      current.ephemeralMessage?.message ||
      current.viewOnceMessage?.message ||
      current.viewOnceMessageV2?.message;
  }

  return current;
}

function extractSenderNumber(msg) {
  const jid = msg.key?.participant || msg.key?.remoteJidAlt || '';
  const digits = extractDigits(jid);
  return digits || 'unknown';
}

function isPrintableAttachment(contentType, media) {
  const extFromName = path.extname(media?.fileName || '').replace('.', '').toLowerCase();
  const mimeType = String(media?.mimetype || '').toLowerCase();

  if (contentType === 'imageMessage' || contentType === 'stickerMessage') {
    return true;
  }

  if (contentType !== 'documentMessage') {
    return false;
  }

  if (extFromName && printableExtensions.has(extFromName)) return true;

  if (mimeType.startsWith('image/')) return true;
  if (mimeType === 'application/pdf') return true;
  if (mimeType === 'application/msword') return true;
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return true;
  if (mimeType === 'application/vnd.ms-excel') return true;
  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return true;
  if (mimeType === 'text/plain') return true;
  if (mimeType === 'application/zip') return true;
  if (mimeType === 'application/x-zip-compressed') return true;
  if (mimeType === 'application/x-rar-compressed') return true;
  if (mimeType === 'application/vnd.rar') return true;
  if (mimeType === 'application/x-7z-compressed') return true;

  // CorelDraw MIME types
  if (mimeType === 'application/coreldraw') return true;
  if (mimeType === 'image/x-coreldraw') return true;
  if (mimeType === 'application/x-coreldraw') return true;
  // AutoCAD MIME types
  if (mimeType === 'image/vnd.dwg') return true;
  if (mimeType === 'application/acad') return true;
  if (mimeType === 'image/vnd.dxf') return true;
  if (mimeType === 'application/x-autocad') return true;
  // HEIC/HEIF MIME types
  if (mimeType === 'image/heic') return true;
  if (mimeType === 'image/heif') return true;
  // CSV MIME types
  if (mimeType === 'text/csv') return true;
  if (mimeType === 'application/csv') return true;
  // PowerPoint MIME types
  if (mimeType === 'application/vnd.ms-powerpoint') return true;
  if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return true;

  return false;
}

async function withRetry(fn, maxRetries, retryDelayMs, logger, context = {}) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      await logger.warn('Attempt failed', {
        attempt,
        maxRetries,
        error: error?.message || String(error),
        ...context
      });

      if (attempt < maxRetries) {
        await sleep(retryDelayMs * attempt);
      }
    }
  }

  throw lastError;
}

async function downloadAndSaveMedia({ sock, logger, store, config, message }) {
  const sender = extractSenderNumber(message);
  const messageId = message.key?.id || '';
  const timestamp = Number(message.messageTimestamp || Math.floor(Date.now() / 1000));
  const signature = `${sender}|${messageId}|${timestamp}`;

  if (!messageId) return;
  if (!message.message) return;
  if (message.key?.fromMe) return;
  
  const jid = message.key?.remoteJid || '';
  const jidAlt = message.key?.remoteJidAlt || '';
  const pushName = message.pushName || '';
  const isBroadcast = message.broadcast === true;

  if (jid.includes('@g.us')) return;
  if (jid.includes('@broadcast')) return;
  if (isBroadcast && pushName) return;
  if (jid.includes('status')) return;
  if (jidAlt.includes('status')) return;
  if (pushName === 'WhatsApp') return;
  if (!jid.includes('@s.whatsapp.net') && !jidAlt.includes('@s.whatsapp.net')) return;
  
  if (store.hasMessage(signature)) {
    await logger.debug('Skipping already processed message', { sender, messageId });
    return;
  }

  const content = unwrapContent(message.message);
  const contentType = getContentType(content);
  if (!contentType) return;
  if (contentType === 'statusUpdateMessage') return;

  const media = content[contentType];
  if (!media) return;
  if (!isPrintableAttachment(contentType, media)) return;

  const senderFolder = path.join(config.downloadsDir, sender);
  await ensureDir(senderFolder);

  const originalName = media.fileName || '';
  const proposedFileName = buildOutputFileName({
    timestamp: new Date(timestamp * 1000),
    originalName,
    mimetype: media.mimetype || '',
    messageType: contentType,
    timeZone: config.timezone
  });

  let finalPath = await ensureUniqueFilePath(senderFolder, proposedFileName, messageId);
  const tempPath = `${finalPath}.part`;

  try {
    await withRetry(
      async () => {
        const stream = await downloadMediaMessage(
          message,
          'stream',
          {},
          {
            reuploadRequest: sock.updateMediaMessage
          }
        );

        await writeStreamToFile(stream, tempPath);
      },
      config.maxRetries,
      config.retryDelayMs,
      logger,
      { sender, messageId, contentType }
    );

    await rename(tempPath, finalPath).catch(async () => {
      await unlink(finalPath).catch(() => { });
      await rename(tempPath, finalPath);
    });

    await store.markProcessed({
      signature,
      sender,
      messageId,
      messageTimestamp: timestamp,
      sourceJid: message.key?.remoteJidAlt || '',
      contentType,
      originalName: originalName || null,
      mimeType: media.mimetype || null,
      fileName: path.basename(finalPath),
      savedPath: finalPath,
      createdAt: new Date().toISOString()
    });

    await logger.info('File saved', {
      sender,
      messageId,
      filePath: finalPath,
      originalName: originalName || null,
      contentType
    });
  } catch (error) {
    await unlink(tempPath).catch(() => { });
    await logger.error('Failed to download/save media', {
      sender,
      messageId,
      error: error?.message || String(error),
      contentType
    });
  }
}

export async function startWhatsAppService({ config, logger, store, onQR, onConnectionChange }) {
  let reconnecting = false;
  let userInitiatedDisconnect = false;
  let currentSock = null;
  let messageQueue = [];
  let isProcessingQueue = false;
  const processedMessageIds = new Set();

  const processQueue = async () => {
    if (isProcessingQueue || messageQueue.length === 0) return;
    isProcessingQueue = true;

    while (messageQueue.length > 0) {
      const message = messageQueue.shift();
      const msgId = message.key?.id;
      if (msgId && processedMessageIds.has(msgId)) {
        continue;
      }
      if (msgId) {
        processedMessageIds.add(msgId);
      }
      try {
        await downloadAndSaveMedia({ sock: currentSock, logger, store, config, message });
      } catch (error) {
        await logger.error('Message processing failed', {
          messageId: msgId || null,
          error: error?.message || String(error)
        });
      }
    }

    if (processedMessageIds.size > 10000) {
      const toDelete = [...processedMessageIds].slice(0, 5000);
      for (const id of toDelete) {
        processedMessageIds.delete(id);
      }
    }

    isProcessingQueue = false;
  };

  const connect = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(config.authDir);

    const waVersion = config.waVersion || [2, 3000, 1043955960];

    const sock = makeWASocket({
      auth: state,
      version: waVersion,
      browser: Browsers.ubuntu(config.appName),
      markOnlineOnConnect: false,
      syncFullHistory: false,
      connectTimeoutMs: 120000,
      keepAliveIntervalMs: 60000
    });

    currentSock = sock;
    sock.ev.on('creds.update', saveCreds);

    if (config.enablePairingCode && !state.creds.registered) {
      const code = await sock.requestPairingCode(config.pairingNumber);
      await logger.info('Pairing code generated', { code, pairingNumber: config.pairingNumber });
    }

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !config.enablePairingCode) {
        const qrText = qrcode.generate(qr, { small: true });
        await logger.info('QR Code generated - scan with WhatsApp');
        if (onQR) onQR(qr);
      }

      if (connection === 'open') {
        reconnecting = false;
        await logger.info('WhatsApp connected', {
          user: sock.user?.id || null
        });
        if (onConnectionChange) onConnectionChange('connected', sock.user?.id || null);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        const badSession = statusCode === 405 || statusCode === DisconnectReason.badSession || statusCode === DisconnectReason.forbidden;

        if (userInitiatedDisconnect) {
          await logger.info('User initiated disconnect, not reconnecting');
          if (onConnectionChange) onConnectionChange('disconnected', null);
          return;
        }

        if (loggedOut || badSession) {
          await logger.error('WhatsApp session invalid. Clearing auth for fresh login.', {
            statusCode
          });
          if (onConnectionChange) onConnectionChange('logged_out', null);

          reconnecting = false;
          await clearAuthFolder(config.authDir);
          await logger.info('Auth cleared, generating new QR...');

          setTimeout(() => {
            void connect().catch((error) => {
              void logger.error('Reconnect after session invalid failed', {
                error: error?.message || String(error)
              });
            });
          }, 2000);
          return;
        }

        if (!reconnecting) {
          reconnecting = true;
          await logger.warn('WhatsApp disconnected. Reconnecting...', {
            statusCode
          });
          if (onConnectionChange) onConnectionChange('reconnecting', null);

          const delay = statusCode === 408 ? 5000 : 10000;

          setTimeout(() => {
            reconnecting = false;
            void connect().catch((error) => {
              void logger.error('Reconnect failed', {
                error: error?.message || String(error)
              });
            });
          }, delay);
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        const msgId = msg.key?.id;
        if (msgId && processedMessageIds.has(msgId)) continue;
        messageQueue.push(msg);
      }
      await processQueue();
    });

    return sock;
  };

  const service = await connect();

  return {
    sock: service,
    disconnect: async () => {
      userInitiatedDisconnect = true;
    }
  };
}
