import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'

const [outputArgument, ...tarballArguments] = process.argv.slice(2)

if (outputArgument === undefined || tarballArguments.length === 0) {
  throw new Error('usage: package-runtime.mjs <output-directory> <tarball-directory>...')
}

const outputDirectory = resolve(outputArgument)
const tarballDirectories = tarballArguments.map(directory => resolve(directory))

function readManifest(tarball) {
  const archive = gunzipSync(readFileSync(tarball))

  for (let offset = 0; offset + 512 <= archive.length;) {
    const header = archive.subarray(offset, offset + 512)
    if (header.every(byte => byte === 0)) break

    const field = (start, length) => header
      .subarray(start, start + length)
      .toString('utf8')
      .replace(/\0.*$/s, '')
    const name = field(0, 100)
    const prefix = field(345, 155)
    const path = prefix === '' ? name : `${prefix}/${name}`
    const size = Number.parseInt(field(124, 12).trim() || '0', 8)
    if (!Number.isSafeInteger(size) || size < 0) {
      throw new Error(`${tarball} contains an invalid tar entry size`)
    }

    offset += 512
    if (path === 'package/package.json') {
      return JSON.parse(archive.subarray(offset, offset + size).toString('utf8'))
    }
    offset += Math.ceil(size / 512) * 512
  }

  throw new Error(`${tarball} contains no package/package.json`)
}

const packages = new Map()
for (const directory of tarballDirectories) {
  const tarballs = readdirSync(directory)
    .filter(file => file.endsWith('.tgz'))
    .sort()

  if (tarballs.length === 0) throw new Error(`no npm tarballs found in ${directory}`)

  for (const file of tarballs) {
    const tarball = resolve(directory, file)
    const manifest = readManifest(tarball)
    if (typeof manifest.name !== 'string' || manifest.name === '') {
      throw new Error(`${tarball} has no package name`)
    }
    if (packages.has(manifest.name)) {
      throw new Error(`duplicate packed package ${manifest.name}`)
    }
    packages.set(manifest.name, { manifest, tarball })
  }
}

const closure = new Set()
function visit(name) {
  if (closure.has(name)) return
  const entry = packages.get(name)
  if (entry === undefined) return

  closure.add(name)
  for (const section of ['dependencies', 'peerDependencies']) {
    for (const dependency of Object.keys(entry.manifest[section] ?? {}).sort()) {
      visit(dependency)
    }
  }
}

const rootPackage = '@deepseek-ai/dsh'
if (!packages.has(rootPackage)) throw new Error(`packed packages are missing ${rootPackage}`)
visit(rootPackage)

rmSync(outputDirectory, { recursive: true, force: true })
mkdirSync(outputDirectory, { recursive: true })

const dependencies = {}
for (const name of [...closure].sort()) {
  const tarball = packages.get(name).tarball
  dependencies[name] = `file:${relative(outputDirectory, tarball).replaceAll('\\', '/')}`
}

const subprocessPackage = '@deepseek-ai/dsh-subprocess-local'
const subprocessLocal = dependencies[subprocessPackage]
const subprocessTarball = packages.get(subprocessPackage)?.tarball
if (subprocessLocal === undefined || subprocessTarball === undefined) {
  throw new Error('runtime closure is missing @deepseek-ai/dsh-subprocess-local')
}

const manifest = {
  name: 'deepseek-harness-runtime',
  version: '0.0.0',
  private: true,
  dependencies,
  allowScripts: {
    [subprocessLocal]: true,
    [`file:${subprocessTarball}`]: true,
    koffi: true,
    'node-pty': true,
    '@google/genai': false,
    protobufjs: false,
    'node-addon-require-builtin': false,
  },
}

writeFileSync(
  resolve(outputDirectory, 'package.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
)

console.log(`runtime closure: ${String(closure.size)} packed packages`)
