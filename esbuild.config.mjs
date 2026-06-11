import esbuild from 'esbuild';
import process from 'process';
import fs from 'fs';
import path from 'path';

const prod = process.argv[2] === 'production';

// 确保输出目录存在
const outDir = 'dist';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const context = await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian', 'electron'],
  format: 'cjs',
  platform: 'node',
  target: 'es2018',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: `${outDir}/main.js`,
});

// 复制 manifest.json 到输出目录
const manifestSrc = path.resolve('manifest.json');
const manifestDest = path.resolve(outDir, 'manifest.json');
fs.copyFileSync(manifestSrc, manifestDest);
console.log(`📄 manifest.json → ${outDir}/`);

if (!prod) {
  console.log('👀 正在监听文件变更...');
}
