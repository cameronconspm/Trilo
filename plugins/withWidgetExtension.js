const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for Widget Extension
 * 
 * This plugin ensures the widget extension target is properly configured
 * with all required build settings for WidgetKit extensions.
 */
const withWidgetExtension = (config) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    
    // Find the widget extension target
    const widgetTarget = xcodeProject.getTarget('UpcomingExpensesWidgetExtension');
    
    if (!widgetTarget) {
      console.warn('⚠️  UpcomingExpensesWidgetExtension target not found. Widget extension may not be configured.');
      return config;
    }
    
    // Get build configurations for the widget target
    const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();
    const targetUuid = widgetTarget.uuid;
    
    // Find build configurations for this target
    Object.keys(buildConfigurations).forEach((configUuid) => {
      const buildConfig = buildConfigurations[configUuid];
      
      // Check if this build config belongs to our widget target
      if (buildConfig.name && 
          (buildConfig.name === 'Debug' || buildConfig.name === 'Release')) {
        // Check if this is for the widget extension target
        // We need to verify this is the right target's config
        const targetConfigList = xcodeProject.pbxNativeTargetSection()[targetUuid]?.buildConfigurationList;
        
        if (targetConfigList && 
            xcodeProject.pbxXCConfigurationListSection()[targetConfigList]?.buildConfigurations?.includes(configUuid)) {
          
          // Ensure required build settings are present
          if (!buildConfig.buildSettings.SDKROOT) {
            buildConfig.buildSettings.SDKROOT = 'iphoneos';
          }
          
          if (!buildConfig.buildSettings.SUPPORTED_PLATFORMS) {
            buildConfig.buildSettings.SUPPORTED_PLATFORMS = 'iphoneos iphonesimulator';
          }
          
          // Ensure deployment target is set
          if (!buildConfig.buildSettings.IPHONEOS_DEPLOYMENT_TARGET) {
            buildConfig.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '15.1';
          }
          
          console.log(`✅ Updated ${buildConfig.name} build settings for UpcomingExpensesWidgetExtension`);
        }
      }
    });
    
    return config;
  });
};

module.exports = withWidgetExtension;

