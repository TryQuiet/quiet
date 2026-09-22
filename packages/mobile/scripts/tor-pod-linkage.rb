# Tor/CTor 409.11.2 wraps the static lowercase tor.xcframework in an Objective-C
# Tor.framework. Case-insensitive filesystems otherwise resolve -framework tor
# back to the wrapper itself once a previous build exists.
module QuietTorLinkage
  def self.pre_install(installer)
    installer.pod_targets.select { |target| target.name == 'Tor' }.each do |target|
      def target.build_type
        Pod::BuildType.dynamic_framework
      end
    end
  end

  def self.post_install(installer)
    installer.pods_project.targets.select { |target| target.name == 'Tor' }.each do |target|
      target.build_configurations.each do |config|
        # These are Tor/CTor's two link inputs. An explicit archive path avoids
        # the implicit -F CONFIGURATION_BUILD_DIR preceding all framework paths.
        config.build_settings['OTHER_LDFLAGS'] = [
          '-lz', '"$(PODS_XCFRAMEWORKS_BUILD_DIR)/Tor/CTor/tor.framework/tor"'
        ]
      end
    end
  end
end
