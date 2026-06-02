#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const defaultReportPath = path.join(repoRoot, 'artifacts', 'api-contracts', 'report.txt');

const args = process.argv.slice(2);
const reportPath = getArgValue('--report') ?? defaultReportPath;

const frontendRoots = [
  path.join(repoRoot, 'frontend', 'web'),
  path.join(repoRoot, 'frontend', 'mobile'),
];
const backendRoot = path.join(repoRoot, 'backend', 'src', 'main', 'java');

const frontendUsages = [];
const backendRoutes = [];
const suspiciousMappings = [];
const unreadableFiles = [];

await main();

async function main() {
  const frontendFiles = [
    ...(await walkFiles(frontendRoots[0], isFrontendSourceFile)),
    ...(await walkFiles(frontendRoots[1], isFrontendSourceFile)),
  ];
  const backendFiles = await walkFiles(backendRoot, (filePath) => filePath.endsWith('Controller.java'));

  for (const filePath of frontendFiles) {
    const text = await readText(filePath);
    if (text == null) {
      continue;
    }
    frontendUsages.push(...extractFrontendUsages(filePath, text));
  }

  for (const filePath of backendFiles) {
    const text = await readText(filePath);
    if (text == null) {
      continue;
    }
    const parsed = extractBackendRoutes(filePath, text);
    backendRoutes.push(...parsed.routes);
    suspiciousMappings.push(...parsed.suspicious);
  }

  const frontendIndex = buildRouteIndex(frontendUsages);
  const backendIndex = buildRouteIndex(backendRoutes);
  const unmatchedFrontendUsages = [];

  for (const usage of frontendUsages) {
    const exactKey = routeMatchKey(usage.method, usage.route);
    const wildcardKey = routeMatchKey('ANY', usage.route);
    const matched = backendIndex.has(exactKey) || backendIndex.has(wildcardKey);
    if (!matched) {
      unmatchedFrontendUsages.push(usage);
    }
  }

  const criticalUnmatchedFrontendUsages = unmatchedFrontendUsages.filter((usage) => isContractBoundaryFile(usage.filePath));

  const unusedBackendRoutes = backendRoutes.filter((route) => {
    const exactKey = routeMatchKey(route.method, route.route);
    const wildcardKey = routeMatchKey('ANY', route.route);
    return !frontendIndex.has(exactKey) && !frontendIndex.has(wildcardKey);
  });

  const duplicateReports = findDuplicateEndpointPayloads(frontendUsages.filter((usage) => isContractBoundaryFile(usage.filePath)));

  const report = buildReport({
    frontendCount: frontendUsages.length,
    backendCount: backendRoutes.length,
    unmatchedFrontendUsages,
    criticalUnmatchedFrontendUsages,
    unusedBackendRoutes,
    suspiciousMappings,
    duplicateReports,
    unreadableFiles,
  });

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, report, 'utf8');

  if (criticalUnmatchedFrontendUsages.length || suspiciousMappings.length || duplicateReports.length) {
    process.exitCode = 1;
  }
}

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return null;
  }
  return args[index + 1] ?? null;
}

async function walkFiles(rootDir, predicate) {
  const results = [];
  await walkDirectory(rootDir, predicate, results);
  return results;
}

async function walkDirectory(dirPath, predicate, results) {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkipDirectory(entry.name)) {
        continue;
      }
      await walkDirectory(fullPath, predicate, results);
      continue;
    }

    if (entry.isFile() && predicate(fullPath)) {
      results.push(fullPath);
    }
  }
}

function shouldSkipDirectory(directoryName) {
  return directoryName === 'node_modules' || directoryName === '.next' || directoryName === 'dist' || directoryName === 'build' || directoryName === 'coverage' || directoryName === 'target';
}

function isFrontendSourceFile(filePath) {
  if (!/\.(ts|tsx)$/.test(filePath)) {
    return false;
  }
  if (filePath.endsWith('.d.ts')) {
    return false;
  }
  if (/[/\\]__tests__[/\\]/.test(filePath)) {
    return false;
  }
  return !/\.(test|spec)\.(ts|tsx)$/.test(filePath);
}

async function readText(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    unreadableFiles.push({ filePath, error: String(error) });
    return null;
  }
}

function extractFrontendUsages(filePath, text) {
  const usages = [];
  const lines = text.split(/\r?\n/);
  const callRegex = /\b(?:[A-Za-z_$][\w$]*\.(?:get|post|put|patch|delete)|fetch)\s*(?:<[^>]*>\s*)?\(/g;

  while (true) {
    const match = callRegex.exec(text);
    if (!match) {
      break;
    }

    const openParenIndex = callRegex.lastIndex - 1;
    const call = extractBalanced(text, openParenIndex, '(', ')');
    if (!call) {
      continue;
    }

    const callText = text.slice(match.index, call.endIndex + 1);
    const method = extractMethodFromCall(match[0], callText);
    const args = splitTopLevelArguments(call.content);
    const rawEndpoint = args[0]?.trim();
    const route = normalizeRoute(rawEndpoint);
    if (!route || !route.startsWith('/api/')) {
      continue;
    }

    const line = lineFromIndex(text, match.index);
    const functionName = inferFunctionName(lines, line - 1);
    const payloadSignature = extractPayloadSignature(method, args);

    usages.push({
      filePath,
      line,
      method,
      route,
      rawEndpoint,
      functionName,
      payloadSignature,
    });
  }

  return usages;
}

function extractMethodFromCall(callStart, callText) {
  if (callStart.startsWith('fetch')) {
    const methodMatch = callText.match(/method\s*:\s*['"]([A-Z]+)['"]/);
    return methodMatch?.[1]?.toUpperCase() ?? 'GET';
  }

  const methodMatch = callStart.match(/\.(get|post|put|patch|delete)\b/i);
  return methodMatch?.[1]?.toUpperCase() ?? 'GET';
}

function extractPayloadSignature(method, args) {
  if (!['POST', 'PUT', 'PATCH'].includes(method)) {
    return null;
  }

  const payload = args[1]?.trim();
  if (!payload) {
    return null;
  }

  if (payload.startsWith('{') && payload.endsWith('}')) {
    const keys = extractObjectLiteralKeys(payload);
    return `object:${keys.join(',')}`;
  }

  return `expr:${normalizeInlineExpression(payload)}`;
}

function findDuplicateEndpointPayloads(usages) {
  const groups = new Map();

  for (const usage of usages) {
    if (!usage.payloadSignature) {
      continue;
    }

    const key = routeKey(usage.method, usage.route);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(usage);
  }

  const reports = [];
  for (const [key, entries] of groups.entries()) {
    const signatures = new Map();
    for (const entry of entries) {
      if (!signatures.has(entry.payloadSignature)) {
        signatures.set(entry.payloadSignature, []);
      }
      signatures.get(entry.payloadSignature).push(entry);
    }

    if (signatures.size <= 1) {
      continue;
    }

    reports.push({
      key,
      route: entries[0].route,
      method: entries[0].method,
      variants: [...signatures.entries()].map(([signature, sites]) => ({ signature, sites })),
    });
  }

  return reports;
}

function buildRouteIndex(routes) {
  const keys = new Set();

  for (const route of routes) {
    keys.add(routeMatchKey(route.method, route.route));
    keys.add(routeMatchKey('ANY', route.route));
  }

  return keys;
}

function extractBackendRoutes(filePath, text) {
  const lines = text.split(/\r?\n/);
  const routes = [];
  const suspicious = [];
  let pendingAnnotations = [];
  let classBasePaths = [''];
  let classSeen = false;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const trimmed = line.trim();

    if (isMappingAnnotationLine(trimmed)) {
      const block = collectAnnotationBlock(lines, index);
      pendingAnnotations.push(block);
      index = block.endLine;
      continue;
    }

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) {
      continue;
    }

    if (!classSeen && /\bclass\b/.test(trimmed)) {
      classBasePaths = extractAnnotationPaths(pendingAnnotations);
      const classPathLine = pendingAnnotations.length ? pendingAnnotations[0].line : index + 1;
      for (const rawPath of classBasePaths) {
        if (isSuspiciousPathFragment(rawPath)) {
          suspicious.push({
            filePath,
            line: classPathLine,
            rawPath,
            context: 'class-level mapping',
          });
        }
      }
      classSeen = true;
      pendingAnnotations = [];
      continue;
    }

    if (trimmed.startsWith('@')) {
      continue;
    }

    if (classSeen && isMethodDeclaration(trimmed) && pendingAnnotations.length) {
      const methodPaths = extractAnnotationPaths(pendingAnnotations);
      const methods = extractAnnotationMethods(pendingAnnotations);
      const methodLine = pendingAnnotations[0].line;

      for (const rawClassPath of classBasePaths) {
        for (const rawMethodPath of methodPaths) {
          const combinedRoute = normalizeRoute(joinRoute(rawClassPath, rawMethodPath));
          if (!combinedRoute || !combinedRoute.startsWith('/api/')) {
            continue;
          }

          for (const method of methods) {
            routes.push({
              filePath,
              line: methodLine,
              method,
              route: combinedRoute,
            });
          }
        }
      }

      for (const rawPath of [...classBasePaths, ...methodPaths]) {
        if (isSuspiciousPathFragment(rawPath)) {
          suspicious.push({
            filePath,
            line: methodLine,
            rawPath,
            context: 'method-level mapping',
          });
        }
      }

      pendingAnnotations = [];
      continue;
    }

    if (pendingAnnotations.length) {
      pendingAnnotations = [];
    }
  }

  return { routes, suspicious };
}

function collectAnnotationBlock(lines, startLine) {
  let endLine = startLine;
  let text = lines[startLine];
  let balance = countParens(text);

  while (balance > 0 && endLine + 1 < lines.length) {
    endLine += 1;
    text += `\n${lines[endLine]}`;
    balance += countParens(lines[endLine]);
  }

  return {
    text,
    line: startLine + 1,
    endLine,
  };
}

function countParens(text) {
  let count = 0;
  let inSingle = false;
  let inDouble = false;
  let escape = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (!inDouble && char === '\'') {
      inSingle = !inSingle;
      continue;
    }
    if (!inSingle && char === '"') {
      inDouble = !inDouble;
      continue;
    }
    if (inSingle || inDouble) {
      continue;
    }
    if (char === '(') {
      count += 1;
    } else if (char === ')') {
      count -= 1;
    }
  }

  return count;
}

function isMappingAnnotationLine(trimmedLine) {
  return /^@(?:RequestMapping|GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping)\s*\(/.test(trimmedLine);
}

function isMethodDeclaration(trimmedLine) {
  return /^(?:public|protected|private)\s+.*\([^;]*\)\s*(?:\{|throws\b|$)/.test(trimmedLine) && !/\bclass\b/.test(trimmedLine);
}

function extractAnnotationPaths(annotations) {
  const paths = [];
  for (const annotation of annotations) {
    const strings = extractQuotedStrings(annotation.text);
    if (strings.length) {
      paths.push(...strings);
    }
  }
  return paths.length ? paths : [''];
}

function extractAnnotationMethods(annotations) {
  const methods = [];
  for (const annotation of annotations) {
    const name = annotation.text.match(/^@(\w+Mapping)\b/)?.[1];
    if (!name) {
      continue;
    }
    if (name !== 'RequestMapping') {
      methods.push(name.replace('Mapping', '').toUpperCase());
      continue;
    }

    const requestMethods = [...annotation.text.matchAll(/RequestMethod\.(GET|POST|PUT|PATCH|DELETE)/g)].map((match) => match[1]);
    if (requestMethods.length) {
      methods.push(...requestMethods);
    } else {
      methods.push('ANY');
    }
  }

  return methods.length ? methods : ['ANY'];
}

function extractQuotedStrings(text) {
  const results = [];
  const stringRegex = /['"]([^'"]+)['"]/g;
  let match;
  while ((match = stringRegex.exec(text))) {
    results.push(match[1]);
  }
  return results;
}

function isSuspiciousPathFragment(rawPath) {
  if (!rawPath) {
    return false;
  }

  const trimmed = rawPath.trim();
  if (trimmed.startsWith('/')) {
    return false;
  }
  if (trimmed.startsWith('{')) {
    return false;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return false;
  }

  return /[A-Za-z0-9]/.test(trimmed);
}

function joinRoute(basePath, methodPath) {
  const base = normalizeRouteFragment(basePath);
  const child = normalizeRouteFragment(methodPath);
  if (!base) {
    return child;
  }
  if (!child) {
    return base;
  }
  return `${base.replace(/\/$/, '')}/${child.replace(/^\//, '')}`;
}

function normalizeRouteFragment(fragment) {
  if (!fragment) {
    return '';
  }
  let value = fragment.trim();
  value = value.replace(/^['"]|['"]$/g, '');
  value = value.replace(/\$\{([^}]+)\}/g, (_, expr) => `:${paramName(expr)}`);
  value = value.replace(/\{([^}]+)\}/g, (_, expr) => `:${paramName(expr)}`);
  return value;
}

function normalizeRoute(rawEndpoint) {
  if (!rawEndpoint) {
    return '';
  }

  let value = rawEndpoint.trim();
  value = value.replace(/^['"`]|['"`]$/g, '');
  value = value.replace(/\$\{([^}]+)\}/g, (_, expr) => `:${paramName(expr)}`);
  value = value.replace(/\{([^}]+)\}/g, (_, expr) => `:${paramName(expr)}`);
  value = value.replace(/^https?:\/\/[^/]+/i, '');

  const apiIndex = value.indexOf('/api/');
  if (apiIndex >= 0) {
    value = value.slice(apiIndex);
  } else {
    const bareApiIndex = value.indexOf('api/');
    if (bareApiIndex >= 0) {
      value = value.slice(bareApiIndex);
    }
  }

  value = value.split(/[?#]/, 1)[0];
  value = value.replace(/\/{2,}/g, '/');

  if (value && !value.startsWith('/')) {
    value = `/${value}`;
  }

  return value;
}

function paramName(expr) {
  const tokens = String(expr).match(/[A-Za-z_$][\w$]*/g);
  return tokens?.at(-1) ?? 'param';
}

function splitTopLevelArguments(text) {
  const args = [];
  let current = '';
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escape = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (escape) {
      current += char;
      escape = false;
      continue;
    }

    if (char === '\\') {
      current += char;
      escape = true;
      continue;
    }

    if (inSingle) {
      current += char;
      if (char === '\'') {
        inSingle = false;
      }
      continue;
    }

    if (inDouble) {
      current += char;
      if (char === '"') {
        inDouble = false;
      }
      continue;
    }

    if (inTemplate) {
      current += char;
      if (char === '`') {
        inTemplate = false;
      }
      continue;
    }

    if (char === '/' && text[index + 1] === '/') {
      while (index < text.length && text[index] !== '\n') {
        current += text[index];
        index += 1;
      }
      if (index < text.length) {
        current += text[index];
      }
      continue;
    }

    if (char === '/' && text[index + 1] === '*') {
      current += '/*';
      index += 2;
      while (index < text.length - 1 && !(text[index] === '*' && text[index + 1] === '/')) {
        current += text[index];
        index += 1;
      }
      current += '*/';
      index += 1;
      continue;
    }

    if (char === '\'') {
      current += char;
      inSingle = true;
      continue;
    }

    if (char === '"') {
      current += char;
      inDouble = true;
      continue;
    }

    if (char === '`') {
      current += char;
      inTemplate = true;
      continue;
    }

    if (char === '(') {
      depthParen += 1;
      current += char;
      continue;
    }

    if (char === ')') {
      if (depthParen > 0) {
        depthParen -= 1;
      }
      current += char;
      continue;
    }

    if (char === '[') {
      depthBracket += 1;
      current += char;
      continue;
    }

    if (char === ']') {
      if (depthBracket > 0) {
        depthBracket -= 1;
      }
      current += char;
      continue;
    }

    if (char === '{') {
      depthBrace += 1;
      current += char;
      continue;
    }

    if (char === '}') {
      if (depthBrace > 0) {
        depthBrace -= 1;
      }
      current += char;
      continue;
    }

    if (char === ',' && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
      if (current.trim()) {
        args.push(current.trim());
      }
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function extractBalanced(text, openIndex, openChar, closeChar) {
  let depth = 1;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escape = false;

  for (let index = openIndex + 1; index < text.length; index++) {
    const char = text[index];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (inSingle) {
      if (char === '\'') {
        inSingle = false;
      }
      continue;
    }

    if (inDouble) {
      if (char === '"') {
        inDouble = false;
      }
      continue;
    }

    if (inTemplate) {
      if (char === '`') {
        inTemplate = false;
      }
      continue;
    }

    if (char === '\'') {
      inSingle = true;
      continue;
    }

    if (char === '"') {
      inDouble = true;
      continue;
    }

    if (char === '`') {
      inTemplate = true;
      continue;
    }

    if (char === openChar) {
      depth += 1;
      continue;
    }

    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return {
          content: text.slice(openIndex + 1, index),
          endIndex: index,
        };
      }
    }
  }

  return null;
}

function extractObjectLiteralKeys(text) {
  const inner = text.trim().replace(/^\{/, '').replace(/\}$/, '');
  const keys = new Set();
  const keyRegex = /(?:^|,\s*)([A-Za-z_$][\w$]*)\s*:/g;
  let match;
  while ((match = keyRegex.exec(inner))) {
    keys.add(match[1]);
  }

  const shorthandRegex = /(?:^|,\s*)([A-Za-z_$][\w$]*)\s*(?:,|$)/g;
  while ((match = shorthandRegex.exec(inner))) {
    const key = match[1];
    if (!inner.includes(`${key}:`)) {
      keys.add(key);
    }
  }

  return [...keys].sort();
}

function normalizeInlineExpression(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\b(?:async|await)\b/g, '')
    .trim();
}

function inferFunctionName(lines, lineIndex) {
  const start = Math.max(0, lineIndex - 10);
  for (let index = lineIndex; index >= start; index--) {
    const line = lines[index].trim();
    const match = line.match(/^(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)\s*=>|function\b)/) || line.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/) || line.match(/^([A-Za-z_$][\w$]*)\s*:\s*async\s*\(/);
    if (match) {
      return match[1];
    }
  }
  return 'unknown';
}

function lineFromIndex(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function routeKey(method, route) {
  return `${method.toUpperCase()} ${route}`;
}

function routeMatchKey(method, route) {
  return routeKey(method, collapseRouteVariables(route));
}

function collapseRouteVariables(route) {
  return route.replace(/:[A-Za-z_$][\w$]*/g, ':*');
}

function buildReport({
  frontendCount,
  backendCount,
  unmatchedFrontendUsages,
  criticalUnmatchedFrontendUsages,
  unusedBackendRoutes,
  suspiciousMappings,
  duplicateReports,
  unreadableFiles,
}) {
  const lines = [];
  lines.push('Planora API Contract Check');
  lines.push(`Frontend call sites scanned: ${frontendCount}`);
  lines.push(`Backend routes scanned: ${backendCount}`);
  lines.push('');

  if (suspiciousMappings.length) {
    lines.push(`Suspicious mappings missing leading slash: ${suspiciousMappings.length}`);
    for (const issue of suspiciousMappings.slice(0, 50)) {
      lines.push(`- ${relativePath(issue.filePath)}:${issue.line} [${issue.context}] ${issue.rawPath}`);
    }
    if (suspiciousMappings.length > 50) {
      lines.push(`- ... ${suspiciousMappings.length - 50} more`);
    }
    lines.push('');
  }

  if (unmatchedFrontendUsages.length) {
    lines.push(`Frontend calls with no backend match: ${unmatchedFrontendUsages.length}`);
    for (const usage of unmatchedFrontendUsages.slice(0, 100)) {
      lines.push(`- ${relativePath(usage.filePath)}:${usage.line} ${usage.method} ${usage.route}${usage.functionName !== 'unknown' ? ` (${usage.functionName})` : ''}`);
    }
    if (unmatchedFrontendUsages.length > 100) {
      lines.push(`- ... ${unmatchedFrontendUsages.length - 100} more`);
    }
    lines.push('');
  }

  if (criticalUnmatchedFrontendUsages.length) {
    lines.push(`Critical frontend contract misses: ${criticalUnmatchedFrontendUsages.length}`);
    for (const usage of criticalUnmatchedFrontendUsages.slice(0, 50)) {
      lines.push(`- ${relativePath(usage.filePath)}:${usage.line} ${usage.method} ${usage.route}`);
    }
    if (criticalUnmatchedFrontendUsages.length > 50) {
      lines.push(`- ... ${criticalUnmatchedFrontendUsages.length - 50} more`);
    }
    lines.push('');
  }

  if (duplicateReports.length) {
    lines.push(`Duplicate frontend endpoint payloads: ${duplicateReports.length}`);
    for (const report of duplicateReports.slice(0, 20)) {
      lines.push(`- ${report.method} ${report.route}`);
      for (const variant of report.variants) {
        const sites = variant.sites.map((site) => `${relativePath(site.filePath)}:${site.line}`).join(', ');
        lines.push(`  - ${variant.signature}: ${sites}`);
      }
    }
    if (duplicateReports.length > 20) {
      lines.push(`- ... ${duplicateReports.length - 20} more`);
    }
    lines.push('');
  }

  lines.push(`Backend endpoints with no frontend/mobile usage: ${unusedBackendRoutes.length}`);
  for (const route of unusedBackendRoutes.slice(0, 100)) {
    lines.push(`- ${relativePath(route.filePath)}:${route.line} ${route.method} ${route.route}`);
  }
  if (unusedBackendRoutes.length > 100) {
    lines.push(`- ... ${unusedBackendRoutes.length - 100} more`);
  }
  lines.push('');

  if (unreadableFiles.length) {
    lines.push(`Unreadable files: ${unreadableFiles.length}`);
    for (const issue of unreadableFiles) {
      lines.push(`- ${relativePath(issue.filePath)}: ${issue.error}`);
    }
    lines.push('');
  }

  lines.push('Summary');
  lines.push(`- Critical issues: ${unmatchedFrontendUsages.length + suspiciousMappings.length + duplicateReports.length}`);
  lines.push(`- Informational backend-only routes: ${unusedBackendRoutes.length}`);

  return `${lines.join('\n')}\n`;
}

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function isContractBoundaryFile(filePath) {
  const relative = relativePath(filePath);
  return (
    /\/services\//.test(relative)
    || /\/hooks\//.test(relative)
    || /\/lib\//.test(relative)
    || /\/app\/.+\/api\.ts$/.test(relative)
    || /\/src\/services\//.test(relative)
    || /\/src\/hooks\//.test(relative)
    || /\/src\/lib\//.test(relative)
  );
}