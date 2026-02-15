// modules/protocol-manager.js
import { protocol, app } from 'electron';
import { join, normalize } from 'path';
import { ensureDir, existsSync } from 'fs-extra';
import store from '../store';

export class ProtocolManager {
  registerSchemes() {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: 'file-assets',
        privileges: { standard: true, secure: true, stream: true },
      },
    ]);
  }

  async initialize() {
    await Promise.all([
      ensureDir(join(app.getPath('userData'), 'notes-assets')),
      ensureDir(join(app.getPath('userData'), 'file-assets')),
      ensureDir(join(app.getPath('userData'), 'background-images')),
    ]);
    this.registerProtocols();
  }

  registerProtocols() {
    protocol.registerFileProtocol('assets', (request, callback) => {
      try {
        // 解析完整的URL，去除协议前缀
        const url = request.url.replace('assets://', '');
        const dir = store.settings.get('dataDir');
        
        // 处理不同的assets子路径
        let fullPath;
        if (url.startsWith('background/')) {
          // 背景图片路径: assets://background/filename.ext
          const fileName = url.substring('background/'.length);
          fullPath = join(dir, 'background-images', fileName);
        } else {
          // 默认notes-assets路径
          fullPath = join(dir, 'notes-assets', url);
        }
        
        const normalizedPath = normalize(fullPath);
        
        // 检查文件是否存在
        if (existsSync(normalizedPath)) {
          callback({ path: normalizedPath });
        } else {
          console.error(`Assets file not found: ${normalizedPath}`);
          callback({ error: -6 }); // FILE_NOT_FOUND
        }
      } catch (error) {
        console.error('Error handling assets protocol:', error);
        callback({ error: -2 }); // FAILED
      }
    });

    protocol.registerFileProtocol('file-assets', (request, callback) => {
      try {
        const url = request.url.substr('file-assets://'.length);
        const decodedUrl = decodeURIComponent(url);
        const dir = store.settings.get('dataDir');
        const filePath = join(dir, 'file-assets', decodedUrl);
        if (!existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          return callback({ error: -6 });
        }
        const mimeType = 'application/octet-stream';
        callback({
          path: filePath,
          headers: {
            'Content-Type': mimeType,
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (err) {
        console.error('Error handling file-assets protocol:', err);
        callback({ error: -2 });
      }
    });
  }
}
