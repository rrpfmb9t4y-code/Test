// Crop a PNG vertically into [top,height] sections. Usage: node crop.js in.png outDir top:height:name ...
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inPng = process.argv[2];
const outDir = process.argv[3];
const specs = process.argv.slice(4);
fs.mkdirSync(outDir, { recursive: true });
const src = PNG.sync.read(fs.readFileSync(inPng));

for (const spec of specs) {
  const [topS, hS, name] = spec.split(':');
  let top = parseInt(topS, 10);
  let h = parseInt(hS, 10);
  if (top < 0) top = 0;
  if (top + h > src.height) h = src.height - top;
  const dst = new PNG({ width: src.width, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < src.width; x++) {
      const si = ((top + y) * src.width + x) << 2;
      const di = (y * src.width + x) << 2;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
  const out = path.join(outDir, name + '.png');
  fs.writeFileSync(out, PNG.sync.write(dst));
  console.log('wrote', out, src.width + 'x' + h);
}
