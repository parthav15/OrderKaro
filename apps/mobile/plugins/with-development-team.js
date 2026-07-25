const { withXcodeProject } = require("expo/config-plugins")

module.exports = function withDevelopmentTeam(config) {
  const teamId = process.env.APPLE_TEAM_ID
  if (!teamId) return config
  return withXcodeProject(config, (projectConfig) => {
    const project = projectConfig.modResults
    const buildConfigs = project.pbxXCBuildConfigurationSection()
    for (const key of Object.keys(buildConfigs)) {
      const entry = buildConfigs[key]
      if (entry && typeof entry === "object" && entry.buildSettings) {
        entry.buildSettings.DEVELOPMENT_TEAM = teamId
      }
    }
    return projectConfig
  })
}
