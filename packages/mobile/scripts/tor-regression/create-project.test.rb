require 'minitest/autorun'
require 'tmpdir'
require 'open3'
require 'xcodeproj'

class TorRegressionProjectTest < Minitest::Test
  def test_generated_host_compiles_the_production_handler_and_its_lifecycle_core
    checkout = File.expand_path('../../../..', __dir__)
    Dir.mktmpdir('quiet-tor-project-') do |directory|
      output = File.join(directory, 'host')
      text, status = Open3.capture2e('ruby', File.join(__dir__, 'create-project.rb'), checkout, output)
      assert status.success?, text
      project = Xcodeproj::Project.open(File.join(output, 'Quiet.xcodeproj'))
      app = project.targets.find { |target| target.name == 'Quiet' }
      sources = app.source_build_phase.files_references.map { |file| file.real_path.to_s }
      %w[TorHandler.swift TorBackgroundTransitions.swift Extensions.swift].each do |name|
        source = File.join(checkout, 'packages/mobile/ios', name)
        assert_includes sources, source
        assert File.file?(source), source
      end
      tests = project.targets.find { |target| target.name == 'TorRegressionTests' }
      assert_includes tests.source_build_phase.files_references.map { |file| file.real_path.to_s },
                      File.join(__dir__, 'TorControlRegressionTests.swift')
      assert_equal ['Quiet'], tests.dependencies.map { |dependency| dependency.target.name }
      assert_includes File.read(File.join(output, 'Podfile')), '409.11.2'
    end
  end
end
