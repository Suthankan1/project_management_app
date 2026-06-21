const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const contractsRoot = path.resolve(projectRoot, '../api-contracts');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders || []), contractsRoot];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  '@planora/contracts': contractsRoot,
};

module.exports = config;
