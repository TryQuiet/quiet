# Screens 4.24 Android listener lifetime backport

This is the four-file fix merged in upstream
[PR #4413](https://github.com/software-mansion/react-native-screens/pull/4413),
commit `b3badd012f83679b12f4e29f2e28eceaa4830efd`. Only the upstream
`cpp/legacy/` paths have been adjusted to `cpp/` for Screens 4.24.0.

Quiet's actual Android API 36 Fabric app intermittently crashed on a fresh
launch in `MountingCoordinator::pullTransaction`, after the earlier vector
race was fixed by updating Screens from 4.18 to 4.24. The upstream patch fixes
concurrent listener initialization and callbacks that outlive their native
owner. It preserves the existing removal notifications and rendering behavior.

Screens 4.24 is the latest stable release supporting RN 0.81. At integration
time no stable release contains this newer fix. Remove this patch when moving
to a compatible release that includes it.

`npm run prepare` applies the backport. The dedicated installer verifies the
package version and all four source hashes, accepts an already-applied patch,
and rejects unexpected edits. Its test uses the real upstream source files,
checks repeat application, and verifies that rejected inputs remain unchanged.
Native builds and fresh-process navigation/runtime tests validate the C++ change.
