#!/usr/bin/env ruby
# Compile the production handler against the app's installed Tor framework.
require 'xcodeproj'
require 'fileutils'

checkout, output, framework = ARGV.map { |arg| File.expand_path(arg) }
abort 'Usage: create-project.rb CHECKOUT NEW_OUTPUT TOR_FRAMEWORK' unless framework
abort 'Use a new output directory' if File.exist?(output)
FileUtils.mkdir_p(output)
FileUtils.cp_r(framework, output)
framework = File.join(output, 'Tor.framework')
# The pinned framework also contains obsolete device/simulator slices.
system('xcrun', 'lipo', File.join(framework, 'Tor'), '-thin', 'arm64', '-output', File.join(framework, 'Tor.arm64'), exception: true)
FileUtils.mv(File.join(framework, 'Tor.arm64'), File.join(framework, 'Tor'))
project = Xcodeproj::Project.new(File.join(output, 'TorDeviceRegression.xcodeproj'))
app = project.new_target(:application, 'TorDeviceRegression', :ios, '15.1')
app.build_configurations.each do |config|
  config.build_settings.merge!({
    'SWIFT_VERSION' => '5.0', 'GENERATE_INFOPLIST_FILE' => 'YES',
    'PRODUCT_BUNDLE_IDENTIFIER' => ENV.fetch('QUIET_TOR_TEST_BUNDLE', 'org.tryquiet.tor-device-regression'),
    'DEVELOPMENT_TEAM' => ENV.fetch('QUIET_TOR_TEST_TEAM'), 'CODE_SIGN_STYLE' => 'Automatic',
    'TARGETED_DEVICE_FAMILY' => '1', 'SWIFT_OPTIMIZATION_LEVEL' => '-Onone',
    'INFOPLIST_KEY_UILaunchScreen_Generation' => 'YES',
    'FRAMEWORK_SEARCH_PATHS' => ['$(inherited)', '$(PROJECT_DIR)'],
    'LD_RUNPATH_SEARCH_PATHS' => ['$(inherited)', '@executable_path/Frameworks'],
  })
end
%w[TorHandler.swift TorBackgroundTransitions.swift Extensions.swift].each do |name|
  app.add_file_references([project.main_group.new_file(File.join(checkout, 'packages/mobile/ios', name))])
end
app.add_file_references([project.main_group.new_file(File.join(checkout,
  'packages/mobile/scripts/tor-device-regression/App.swift'))])
ref = project.frameworks_group.new_file(framework)
app.frameworks_build_phase.add_file_reference(ref)
embed = app.new_copy_files_build_phase('Embed Tor')
embed.dst_subfolder_spec = '10'
embed.add_file_reference(ref).settings = { 'ATTRIBUTES' => ['CodeSignOnCopy', 'RemoveHeadersOnCopy'] }
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.set_launch_target(app)
scheme.save_as(project.path, 'TorDeviceRegression', true)
