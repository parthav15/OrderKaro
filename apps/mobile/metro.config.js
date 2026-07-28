const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")
const path = require("path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../..")

const config = getDefaultConfig(projectRoot)

config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]

const reactPackageDir = path.resolve(projectRoot, "node_modules/react")
const baseResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react" || moduleName.startsWith("react/")) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(reactPackageDir, "package.json") },
      moduleName,
      platform
    )
  }
  return (baseResolveRequest || context.resolveRequest)(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: "./global.css" })
