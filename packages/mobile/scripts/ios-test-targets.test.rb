require 'minitest/autorun'
require 'xcodeproj'

class IosTestTargetsTest < Minitest::Test
  def test_lifecycle_core_stays_hostless_while_firebase_uses_the_real_app_host
    ios = File.expand_path('../ios', __dir__)
    project_file = File.join(ios, 'Quiet.xcodeproj/project.pbxproj')
    ids = File.read(project_file).scan(/^\s*([A-F0-9]{24}) .* = \{/).flatten
    assert_equal ids.uniq, ids, 'conflict resolution must not duplicate Xcode object identifiers'
    project = Xcodeproj::Project.open(File.dirname(project_file))
    hostless = project.targets.find { |target| target.name == 'QuietTests' }
    hosted = project.targets.find { |target| target.name == 'QuietAppTests' }
    sources = hostless.source_build_phase.files_references.map { |file| file.real_path.to_s }
    %w[QuietTests/TorHandlerLifecycleTests.swift TorBackgroundTransitions.swift QuietBackgroundTask.m].each do |name|
      assert_includes sources, File.join(ios, name)
    end
    [hostless, hosted].each do |target|
      paths = target.source_build_phase.files_references.map { |file| file.real_path.to_s }
      assert_equal paths.uniq, paths
      paths.each { |file| assert File.file?(file), file }
    end
    hostless.build_configurations.each { |config| assert_empty config.build_settings.fetch('TEST_HOST', '') }
    hosted.build_configurations.each { |config| assert_includes config.build_settings.fetch('TEST_HOST'), 'Quiet.app/Quiet' }
    assert_includes hosted.source_build_phase.files_references.map { |file| file.real_path.to_s },
                    File.join(ios, 'QuietAppTests/QuietFirebaseUnavailableTests.m')
  end
end
