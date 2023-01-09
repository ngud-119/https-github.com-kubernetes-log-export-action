import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';

type File = {
  name: string;
  type: 'file';
};

type Directory = {
  name: string;
  type: 'directory';
  children: (File | Directory)[];
};

type FileTree = Directory;

function getFileTree(dir: string, fileTree: FileTree = { name: dir, type: 'directory', children: [] }): FileTree {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = `${dir}/${file}`;
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      fileTree.children.push({ name: file, type: 'file' });
    } else if (stat.isDirectory()) {
      fileTree.children.push(getFileTree(filePath, { name: file, type: 'directory', children: [] }));
    }
  }

  return fileTree;
}

async function run() {
  try {
    const namespaces = core.getInput('namespaces');
    const showTimestamps = Boolean(core.getInput('show_timestamps'));
    const outputDir = core.getInput('output_dir'); // ./output-minikube-manusa

    core.info('Running kubectl scripts...');
    for (const namespace of namespaces.split(',').map((n) => n.trim())) {
      core.info(`Dumping logs for namespace: ${namespace}`);
      await exec.exec('./kubelogs.sh', ['-n', namespace, '-o', outputDir, '--timestamps', String(showTimestamps)]);
    }

    core.info('Generating file tree...');
    const fileTree = getFileTree(outputDir);
    fileTree.name = '/';
    fs.writeFileSync(path.join(outputDir, 'filetree.json'), JSON.stringify(fileTree));

    core.info('Done!');
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
