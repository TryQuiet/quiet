# Run from packages/mobile: bundle exec ruby scripts/react-native-app-plists.test.rb
require 'fileutils'
require 'minitest/autorun'
require 'tmpdir'
require 'xcodeproj'
require_relative '../node_modules/react-native/scripts/cocoapods/new_architecture'
require_relative './react-native-app-plists'

QuietReactNativeAppPlists.install!(NewArchitectureHelper)

class ReactNativeAppPlistsTest < Minitest::Test
  AggregateTarget = Struct.new(:user_targets)
  Installer = Struct.new(:aggregate_targets)

  def setup
    @directory = Dir.mktmpdir('quiet ios plists ')
    @project = Xcodeproj::Project.new(File.join(@directory, 'Quiet.xcodeproj'))
    @app = target(:application, 'Quiet', 'Quiet/Info.plist')
    extension = target(:app_extension, 'Notifications', 'Notifications/Info.plist')
    tests = target(:unit_test_bundle, 'QuietTests', 'QuietTests/Info.plist')
    @installer = Installer.new([
      AggregateTarget.new([@app]),
      AggregateTarget.new([@app, extension, tests])
    ])
    @app_plist = write_plist('Quiet/Info.plist', 'CFBundleName' => 'Quiet')
    @unrelated = [
      write_plist('Notifications/Info.plist', 'CFBundleName' => 'Notifications'),
      write_plist('QuietTests/Info.plist', 'CFBundleName' => 'QuietTests'),
      write_plist('Unreferenced/Info.plist', 'CFBundleName' => 'Unreferenced')
    ]

    # Use real vendored binary plists, including the bytes that caused pod update
    # to fail, rather than a mocked parser or an invalid XML placeholder.
    %w[classic-level.framework/Info.plist NodeJsMobile/NodeMobile.xcframework/ios-arm64/NodeMobile.framework/Info.plist].each do |relative_path|
      source = File.expand_path("../ios/#{relative_path}", __dir__)
      destination = File.join(@directory, relative_path)
      FileUtils.mkdir_p(File.dirname(destination))
      FileUtils.cp(source, destination)
      assert File.binread(destination).start_with?('bplist00')
      @unrelated << destination
    end
    @original_bytes = @unrelated.to_h { |path| [path, File.binread(path)] }
  end

  def teardown
    FileUtils.remove_entry(@directory)
  end

  def test_updates_only_application_plists_and_preserves_other_metadata_byte_for_byte
    [false, true, false].each do |enabled|
      NewArchitectureHelper.set_RCTNewArchEnabled_in_info_plist(@installer, enabled)

      assert_equal({ 'CFBundleName' => 'Quiet', 'RCTNewArchEnabled' => enabled }, Xcodeproj::Plist.read_from_path(@app_plist))
      @original_bytes.each { |path, bytes| assert_equal bytes, File.binread(path), path }
    end
  end

  def test_resolves_per_configuration_plists_and_srcroot_with_spaces
    debug_plist = write_plist('Quiet/Debug.plist', 'CFBundleName' => 'Quiet Debug')
    @app.build_configurations.find { |config| config.name == 'Debug' }
        .build_settings['INFOPLIST_FILE'] = '$(SRCROOT)/Quiet/Debug.plist'

    NewArchitectureHelper.set_RCTNewArchEnabled_in_info_plist(@installer, false)

    [debug_plist, @app_plist].each do |path|
      assert_equal false, Xcodeproj::Plist.read_from_path(path)['RCTNewArchEnabled']
    end
  end

  def test_does_not_rewrite_an_unchanged_app_plist
    NewArchitectureHelper.set_RCTNewArchEnabled_in_info_plist(@installer, false)
    old_time = Time.at(1_000_000)
    File.utime(old_time, old_time, @app_plist)

    NewArchitectureHelper.set_RCTNewArchEnabled_in_info_plist(@installer, false)

    assert_equal old_time, File.mtime(@app_plist)
  end

  def test_missing_application_plist_fails_clearly
    FileUtils.rm(@app_plist)

    error = assert_raises(RuntimeError) do
      NewArchitectureHelper.set_RCTNewArchEnabled_in_info_plist(@installer, false)
    end
    assert_includes error.message, 'Application Info.plist does not exist'
  end

  private

  def target(type, name, plist)
    @project.new_target(type, name, :ios, '17.1').tap do |target|
      target.build_configurations.each { |config| config.build_settings['INFOPLIST_FILE'] = plist }
    end
  end

  def write_plist(relative_path, values)
    File.join(@directory, relative_path).tap do |path|
      FileUtils.mkdir_p(File.dirname(path))
      Xcodeproj::Plist.write_to_path(values, path)
    end
  end
end
