const { withEntitlementsPlist } = require("expo/config-plugins")

module.exports = function withoutPushEntitlement(config) {
  if (!process.env.STRIP_PUSH_ENTITLEMENT) return config
  return withEntitlementsPlist(config, (entitlementsConfig) => {
    delete entitlementsConfig.modResults["aps-environment"]
    return entitlementsConfig
  })
}
