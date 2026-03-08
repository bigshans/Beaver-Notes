import { useStorage } from '@/composable/storage';

const storage = useStorage('settings');
const { path, ipcRenderer } = window.electron;

/**
 * @param {File} file
 * @returns {Promise<any>}
 **/
async function readFile(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader(file);
    fileReader.onload = (event) => {
      /* @type {ArrayBuffer} */
      const result = event.target.result;

      // Pad the byte length to be a multiple of 4
      const paddedLength = Math.ceil(result.byteLength / 4) * 4;
      const paddedBuffer = new ArrayBuffer(paddedLength);
      const paddedView = new Uint8Array(paddedBuffer);
      paddedView.set(new Uint8Array(result));

      const uint32View = new Uint32Array(paddedBuffer);
      resolve(uint32View);
    };
    fileReader.onerror = (event) => {
      reject(event);
    };
    fileReader.readAsArrayBuffer(file);
  });
}

/**
 * 创建背景图片文件名
 * @param {string} filePath - 原始文件路径或文件名
 * @returns {Promise<{destPath: string, fileName: string}>}
 */
async function createBackgroundFileName(filePath) {
  const dataDir = await storage.get('dataDir');
  // 使用 extname 方法代替 parse 方法获取扩展名
  const ext = path.extname(filePath);
  // 统一命名为 bg，保留原始扩展名
  const fileName = `bg${ext}`;
  // 修改：将存储路径改为 settings 目录
  const assetsPath = path.join(dataDir, 'settings', 'background-images');
  await ipcRenderer.callMain('fs:ensureDir', assetsPath);
  const destPath = path.join(assetsPath, fileName);
  return { destPath, fileName };
}

/**
 * 上传背景图片文件
 * @param {File} file - 要上传的文件
 * @returns {Promise<{fileName: string, destPath: string, assetUrl: string}>}
 */
export async function uploadBackgroundImage(file) {
  try {
    const content = await readFile(file);
    const { fileName, destPath } = await createBackgroundFileName(file.name);

    await ipcRenderer.callMain('fs:writeFile', {
      data: content,
      path: destPath,
    });

    // 修改：返回 settings 协议的 URL 格式
    const assetUrl = `settings://background-images/${fileName}`;
    return { fileName, destPath, assetUrl };
  } catch (e) {
    console.error('上传背景图片失败:', e);
    throw e;
  }
}

/**
 * 从本地路径复制背景图片
 * @param {string} filePath - 本地文件路径
 * @returns {Promise<{fileName: string, destPath: string, assetUrl: string}>}
 */
export async function copyBackgroundImage(filePath) {
  try {
    const { fileName, destPath } = await createBackgroundFileName(filePath);

    await ipcRenderer.callMain('fs:copy', {
      path: filePath,
      dest: destPath,
    });

    // 修改：返回 settings 协议的 URL 格式
    const assetUrl = `settings://background-images/${fileName}`;
    return { destPath, fileName, assetUrl };
  } catch (error) {
    console.error('复制背景图片失败:', error);
    throw error;
  }
}

/**
 * 获取背景图片列表
 * @returns {Promise<string[]>} 返回背景图片 asset URL 列表
 */
export async function getBackgroundImages() {
  try {
    const dataDir = await storage.get('dataDir');
    const assetsPath = path.join(dataDir, 'settings', 'background-images');

    // 确保目录存在
    await ipcRenderer.callMain('fs:ensureDir', assetsPath);

    // 读取目录内容
    const files = await ipcRenderer.callMain('fs:readDir', assetsPath);

    // 过滤图片文件并转换为 asset URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // 修改：返回 settings 协议的 URL
    return imageFiles.map(
      (fileName) => `settings://background-images/${fileName}`
    );
  } catch (error) {
    console.error('获取背景图片列表失败:', error);
    return [];
  }
}

/**
 * 删除背景图片文件
 * @param {string} assetUrl - asset URL (如：settings://background-images/bg.jpg)
 * @returns {Promise<void>}
 */
export async function deleteBackgroundImage(assetUrl) {
  try {
    // 从 asset URL 中提取文件名
    const fileName = assetUrl.split('/').pop();
    if (!fileName) {
      throw new Error('Invalid asset URL format');
    }

    const dataDir = await storage.get('dataDir');
    // 修改：使用 settings 目录路径
    const filePath = path.join(
      dataDir,
      'settings',
      'background-images',
      fileName
    );

    // 检查文件是否存在
    const exists = await ipcRenderer.callMain('fs:pathExists', filePath);
    if (exists) {
      await ipcRenderer.callMain('fs:remove', filePath);
      console.log('背景图片文件删除成功:', filePath);
    } else {
      console.warn('背景图片文件不存在:', filePath);
    }
  } catch (error) {
    console.error('删除背景图片文件失败:', error);
    throw error;
  }
}
