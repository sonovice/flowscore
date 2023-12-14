import { file, Glob, write } from 'bun';
import { rmdirSync } from 'node:fs';

const sourceDir = 'dist';
const targetDir = 'dist-static'
 
// Delete target dir
try {
    rmdirSync(targetDir, {recursive: true, force: true});
} catch (err) {}

const files = {};

// Copy files from dist dir
for await (const relativePath of (new Glob(`${sourceDir}/**/*`)).scan()) {
    // Calculates the path without the sourceDir prefix
    const strippedPath = relativePath.slice(sourceDir.length + 1);
    const newFilePath = `${targetDir}/${strippedPath}.static`;

    const bunFile = file(relativePath);
    const mimeType = bunFile.type;

    files[strippedPath] = {
        data: `./${strippedPath}.static`,
        type: mimeType
    };

    await write(newFilePath, bunFile);
}

let importStatements = Object.entries(files).map(([key, value], index) => {
    return `import file_${index} from '${value.data}';\n`;
}).join('');

let exportFunction = `
export default function getFile(key) {
    const files = {
        ${Object.entries(files).map(([key, value], index) => 
          `'${key}': { data: file_${index}, type: '${value.type}' }`).join(',\n        ')}
    };

    const entry = files[key];

    if (entry) {
        return Bun.file(entry.data, { type: entry.type });
    } else {
        return Bun.file(''); // Return dummy file
    }
}
`;

let finalContent = importStatements + exportFunction;

await write(`${targetDir}/index.js`, finalContent);

console.log(`Generated static files in "${targetDir}" dir`)// console.log("Generated entries:", files);
