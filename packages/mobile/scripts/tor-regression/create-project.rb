#!/usr/bin/env ruby
# A small native host compiles the production handler unchanged. No RN/Node mocks.
require 'xcodeproj'
require 'pathname'
require 'fileutils'

checkout, output = ARGV.map { |arg| File.expand_path(arg) }
abort 'Usage: create-project.rb CHECKOUT NEW_OUTPUT' unless checkout && output
abort 'Output already exists' if File.exist?(output)
FileUtils.mkdir_p(output)
project = Xcodeproj::Project.new(File.join(output, 'Quiet.xcodeproj'))
app = project.new_target(:application, 'Quiet', :ios, '17.1')
tests = project.new_target(:unit_test_bundle, 'TorRegressionTests', :ios, '17.1')
tests.add_dependency(app)
[app, tests].each do |target|
  target.build_configurations.each do |config|
    config.build_settings.merge!({
      'SWIFT_VERSION' => '5.0', 'GENERATE_INFOPLIST_FILE' => 'YES',
      'PRODUCT_BUNDLE_IDENTIFIER' => "org.tryquiet.tor-regression.#{target.name}",
      'CODE_SIGNING_ALLOWED' => 'NO', 'ENABLE_TESTABILITY' => 'YES',
      'TARGETED_DEVICE_FAMILY' => '1', 'IPHONEOS_DEPLOYMENT_TARGET' => '17.1',
      'SWIFT_OPTIMIZATION_LEVEL' => '-Onone',
    })
  end
end
tests.build_configurations.each do |config|
  config.build_settings['TEST_HOST'] = '$(BUILT_PRODUCTS_DIR)/Quiet.app/Quiet'
  config.build_settings['BUNDLE_LOADER'] = '$(TEST_HOST)'
end
app.build_configurations.each do |config|
  config.build_settings['INFOPLIST_KEY_UILaunchScreen_Generation'] = 'YES'
end
File.write(File.join(output, 'App.swift'), <<~SWIFT)
  import UIKit
  @main final class App: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    func application(_ app: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
      window = UIWindow(frame: UIScreen.main.bounds)
      window?.rootViewController = UIViewController()
      window?.makeKeyAndVisible()
      return true
    }
  }
SWIFT
app.add_file_references([project.main_group.new_file('App.swift')])
%w[TorHandler.swift TorBackgroundTransitions.swift Extensions.swift].each do |name|
  app.add_file_references([project.main_group.new_file(File.join(checkout, 'packages/mobile/ios', name))])
end
tests.add_file_references([project.main_group.new_file(File.join(checkout,
  'packages/mobile/scripts/tor-regression/TorControlRegressionTests.swift'))])
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.add_test_target(tests)
scheme.set_launch_target(app)
scheme.test_action.build_configuration = 'Debug'
scheme.save_as(project.path, 'TorRegression', true)
# Use exactly the same upstream dependency declaration as the app.
tor_pod = File.readlines(File.join(checkout, 'packages/mobile/ios/Podfile')).find { |line| line.strip.start_with?("pod 'Tor',") }
abort 'Missing application Tor pin' unless tor_pod
File.write(File.join(output, 'Podfile'), <<~PODFILE)
  require #{File.join(checkout, 'packages/mobile/scripts/tor-pod-linkage.rb').inspect}
  platform :ios, '17.1'
  use_frameworks! :linkage => :static
  target 'Quiet' do
    #{tor_pod.strip}
    target 'TorRegressionTests' do
      inherit! :complete
    end
  end
  pre_install do |installer|
    QuietTorLinkage.pre_install(installer)
  end
  post_install do |installer|
    QuietTorLinkage.post_install(installer)
  end
PODFILE
