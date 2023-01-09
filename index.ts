import * as fs from 'fs';

type File = {
  name: string;
  type: 'file';
};

type Directory = {
  name: string;
  type: 'directory';
  children: Array<File | Directory>;
};

type FileTree = Directory;

function getFileTree(dir: string, fileTree: FileTree = { name: dir, type: 'directory', children: [] }): FileTree {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const path = `${dir}/${file}`;
    const stat = fs.statSync(path);
    if (stat.isFile()) {
      fileTree.children.push({ name: file, type: 'file' });
    } else if (stat.isDirectory()) {
      fileTree.children.push(getFileTree(path, { name: file, type: 'directory', children: [] }));
    }
  }

  return fileTree;
}

const rootDir = './output-minikube-manusa';
const fileTree = getFileTree(rootDir);

fs.writeFileSync("./output-minikube-manusa/filetree.json", JSON.stringify(fileTree));

console.log("Done!");
