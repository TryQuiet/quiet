# iPhone cleanup incident and recovery

During post-test cleanup I made an unsafe assumption about the scope of a directory-removal operation. After an AFC removal attempt and a CoreDevice copy with `--remove-existing-content true` targeting the profiling subdirectory, verification found the app's Documents directory empty. I stopped cleanup and reported the failure immediately. This was a test-cleanup error, not a Quiet runtime regression. No app uninstall or server changes occurred.

The untouched full pre-profiling backup remained available. I restored it using a copy with removal disabled, then read every restored file back from the phone: **all 554 original files matched SHA256 byte-for-byte**, with zero missing or changed files. This includes the historic backend directories, persisted frontend state, and logs.

The temporary diagnostic app then verified that the community ID, team ID, local user ID, and local device ID exactly matched the backup. It confirmed the original five message IDs and recovered all eleven authorized smoke-test messages from staging QSS. **All 16 messages were present and cryptographically verified.** The desktop sender remained stopped. A complete recovered Documents snapshot was retained before restoring the original app again.

The original signed app was reinstalled without uninstalling or deleting data. The final backend SHA256 is `f7c59197a41334684c0ee56439400653ce30823c11390c51fbbb87e96f5cde81`. Final installation, stopped-process, data-readback, and owned-agent checks are recorded in the [receipt](ios-cleanup-recovery-2026-09-14.json).

No further removal commands were used after recovery. Small recovery-control files remain inert in Documents; the original app has no profiling hooks that execute them. The original backup and full recovered backup remain private on the Mac. Pre-existing Appium and the user's other apps were left intact.
