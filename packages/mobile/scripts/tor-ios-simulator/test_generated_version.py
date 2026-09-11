"""Exercise the patched Tor version producer with a real, clean Xcode graph.

The tiny framework uses the prepared source's exact script phase, version.sh and
Info.plist. It tests generated metadata ordering, not Tor runtime behavior.
"""
import copy
import json
import os
from pathlib import Path
import plistlib
import shutil
import subprocess
import sys
import tempfile
import unittest


@unittest.skipUnless(sys.platform == 'darwin' and os.environ.get('QUIET_TOR_PREPARED_SOURCE'),
                     'Requires macOS/Xcode and an explicitly prepared pinned source tree')
class GeneratedVersionTests(unittest.TestCase):
    def test_clean_build_tracks_the_actual_version_header_producer(self):
        source = Path(os.environ['QUIET_TOR_PREPARED_SOURCE'])
        framework = source / 'Tor.framework'
        recipe = json.loads((source / 'source-manifest.json').read_text())
        project = json.loads(subprocess.check_output([
            '/usr/bin/plutil', '-convert', 'json', '-o', '-',
            str(framework / 'Tor.xcodeproj/project.pbxproj')]))
        phase = next(value for value in project['objects'].values()
                     if value.get('isa') == 'PBXShellScriptBuildPhase' and 'Tor/version.sh' in value.get('shellScript', ''))
        self.assertIn('$(SRCROOT)/Tor/version.sh', phase['inputPaths'])
        self.assertIn('$(SRCROOT)/Tor/version.h', phase['outputPaths'])
        with tempfile.TemporaryDirectory(prefix='quiet-tor-version-') as directory:
            root = Path(directory)
            failures = []
            for declared in (False, True):
                checkout = root / ('declared' if declared else 'undeclared')
                checkout.mkdir()
                (checkout / 'Tor').mkdir()
                for name in ('version.sh', 'Info.plist'):
                    shutil.copy2(framework / 'Tor' / name, checkout / 'Tor' / name)
                (checkout / 'fixture.c').write_text('int fixture(void) { return 0; }\n')
                selected = copy.deepcopy(phase)
                if not declared:
                    selected['outputPaths'] = []
                self.make_project(checkout, selected)
                env = dict(os.environ, QUIET_TOR_SOURCE_COMMIT=recipe['frameworkCommit'],
                           SOURCE_DATE_EPOCH=str(recipe['sourceDateEpoch']))
                result = subprocess.run([
                    'xcodebuild', 'build', '-project', str(checkout / 'Fixture.xcodeproj'),
                    '-target', 'Fixture', '-configuration', 'Debug', '-sdk', 'iphonesimulator',
                    'ARCHS=arm64', 'ONLY_ACTIVE_ARCH=YES', 'CODE_SIGNING_ALLOWED=NO',
                    'COMPILER_INDEX_STORE_ENABLE=NO', f'SYMROOT={checkout}/products',
                    f'OBJROOT={checkout}/objects'], env=env, capture_output=True, text=True, timeout=120)
                if declared:
                    self.assertEqual(result.returncode, 0, result.stdout[-6000:] + result.stderr[-2000:])
                    built = plistlib.loads((checkout / 'products/Debug-iphonesimulator/Fixture.framework/Info.plist').read_bytes())
                    self.assertEqual(built['CFBundleShortVersionString'], recipe['frameworkVersion'])
                    self.assertRegex(built['CFBundleVersion'], r'^\d+\.\d+$')
                else:
                    failures.append(result.stdout + result.stderr)
                    self.assertNotEqual(result.returncode, 0, 'The undeclared-header control unexpectedly passed')
            self.assertIn('version.h', failures[0])
            self.assertIn('Build input file cannot be found', failures[0])

    @staticmethod
    def make_project(root, phase):
        names = ['project', 'group', 'products', 'target', 'product', 'source', 'sourcebuild',
                 'sources', 'frameworks', 'resources', 'configs', 'debug', 'generator',
                 'script', 'dependency', 'proxy']
        ids = {name: f'{index:024X}' for index, name in enumerate(names, 1)}
        def key(name):
            return ids[name]
        objects = {
            key('project'): {'isa': 'PBXProject', 'attributes': {}, 'buildConfigurationList': key('configs'),
                             'compatibilityVersion': 'Xcode 14.0', 'developmentRegion': 'en',
                             'hasScannedForEncodings': '0', 'knownRegions': ['en'], 'mainGroup': key('group'),
                             'productRefGroup': key('products'), 'projectDirPath': '', 'projectRoot': '',
                             'targets': [key('target'), key('generator')]},
            key('group'): {'isa': 'PBXGroup', 'children': [key('source'), key('products')], 'sourceTree': '<group>'},
            key('products'): {'isa': 'PBXGroup', 'children': [key('product')], 'name': 'Products', 'sourceTree': '<group>'},
            key('source'): {'isa': 'PBXFileReference', 'lastKnownFileType': 'sourcecode.c.c', 'path': 'fixture.c', 'sourceTree': '<group>'},
            key('product'): {'isa': 'PBXFileReference', 'explicitFileType': 'wrapper.framework', 'path': 'Fixture.framework', 'sourceTree': 'BUILT_PRODUCTS_DIR'},
            key('sourcebuild'): {'isa': 'PBXBuildFile', 'fileRef': key('source')},
            key('target'): {'isa': 'PBXNativeTarget', 'buildConfigurationList': key('configs'),
                            'buildPhases': [key('sources'), key('frameworks'), key('resources')],
                            'buildRules': [], 'dependencies': [key('dependency')], 'name': 'Fixture',
                            'productName': 'Fixture', 'productReference': key('product'), 'productType': 'com.apple.product-type.framework'},
            key('generator'): {'isa': 'PBXAggregateTarget', 'buildConfigurationList': key('configs'),
                               'buildPhases': [key('script')], 'dependencies': [], 'name': 'Generator', 'productName': 'Generator'},
            key('script'): phase,
            key('dependency'): {'isa': 'PBXTargetDependency', 'target': key('generator'), 'targetProxy': key('proxy')},
            key('proxy'): {'isa': 'PBXContainerItemProxy', 'containerPortal': key('project'),
                           'proxyType': '1', 'remoteGlobalIDString': key('generator'), 'remoteInfo': 'Generator'},
            key('configs'): {'isa': 'XCConfigurationList', 'buildConfigurations': [key('debug')],
                             'defaultConfigurationIsVisible': '0', 'defaultConfigurationName': 'Debug'},
            key('debug'): {'isa': 'XCBuildConfiguration', 'name': 'Debug', 'buildSettings': {
                'PRODUCT_NAME': 'Fixture', 'PRODUCT_BUNDLE_IDENTIFIER': 'org.quiet.version-fixture',
                'SDKROOT': 'iphonesimulator', 'SUPPORTED_PLATFORMS': 'iphonesimulator',
                'IPHONEOS_DEPLOYMENT_TARGET': '17.1', 'INFOPLIST_FILE': 'Tor/Info.plist',
                'INFOPLIST_PREPROCESS': 'YES', 'INFOPLIST_PREFIX_HEADER': 'Tor/version.h',
                'CLANG_ENABLE_MODULES': 'NO', 'ENABLE_USER_SCRIPT_SANDBOXING': 'NO'}},
        }
        for name, kind in [('sources', 'PBXSourcesBuildPhase'), ('frameworks', 'PBXFrameworksBuildPhase'), ('resources', 'PBXResourcesBuildPhase')]:
            objects[key(name)] = {'isa': kind, 'buildActionMask': '2147483647',
                                  'files': [key('sourcebuild')] if name == 'sources' else [], 'runOnlyForDeploymentPostprocessing': '0'}
        project = root / 'Fixture.xcodeproj'
        project.mkdir()
        (project / 'project.pbxproj').write_bytes(plistlib.dumps({
            'archiveVersion': '1', 'classes': {}, 'objectVersion': '56',
            'objects': objects, 'rootObject': key('project')}))
