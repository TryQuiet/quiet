# RN 0.81 recursively scans every Info.plist below the Xcode project. That also
# reads and rewrites Quiet's vendored NodeMobile/classic-level framework metadata;
# Xcodeproj cannot read their binary plists with its UTF-8 conflict-marker check.
# Limit this post-install hook to the application plists declared by CocoaPods'
# user targets. Keep the rest of React Native's post-install setup unchanged.
module QuietReactNativeAppPlists
  def set_RCTNewArchEnabled_in_info_plist(installer, new_arch_enabled)
    targets = installer.aggregate_targets.flat_map(&:user_targets).uniq
    plist_paths = targets.select { |target| target.symbol_type == :application }.flat_map do |target|
      paths = target.resolved_build_setting('INFOPLIST_FILE', true).values
      if paths.empty? || paths.any? { |path| !path.is_a?(String) || path.empty? }
        raise "Missing INFOPLIST_FILE for application target #{target.name}"
      end

      paths.map { |path| File.expand_path(path, target.project.project_dir) }
    end.uniq

    plist_paths.each do |path|
      raise "Application Info.plist does not exist: #{path}" unless File.file?(path)

      plist = Xcodeproj::Plist.read_from_path(path)
      next if plist['RCTNewArchEnabled'] == new_arch_enabled

      plist['RCTNewArchEnabled'] = new_arch_enabled
      Xcodeproj::Plist.write_to_path(plist, path)
    end
  end

  def self.install!(helper)
    method_name = :set_RCTNewArchEnabled_in_info_plist
    unless helper.respond_to?(method_name) && helper.method(method_name).arity == 2
      raise 'React Native changed its Info.plist post-install hook; review QuietReactNativeAppPlists'
    end

    helper.singleton_class.prepend(self) unless helper.singleton_class.ancestors.include?(self)
  end
end
