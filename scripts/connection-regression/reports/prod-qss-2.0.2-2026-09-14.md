# Production QSS 2.0.2 verification

**PASS: the website's Quiet 9.0.2 desktop client works with production QSS
after the 2.0.2 deployment.** Two fresh Linux desktop profiles created and
joined a community, exchanged messages in both directions, and retrieved an
offline message with Tor networking disabled throughout.

The test ran September 14, 2026, approximately 22:07–22:11 UTC against
`wss://qss-prod.quiet-services.app`. It used the unchanged, previously verified
website AppImage. Application and Tor payload hashes were rechecked against
the [earlier failing run](prod-qss-2026-09-14.md). The original Tor binary ran
with `--DisableNetwork 1` through a wrapper mounted only inside each test
process's mount namespace. Both live Tor processes had that flag; neither
client logged a completed bootstrap. Production CAPTCHA verification remained
enabled.

## Results

| Check | Observed result |
| --- | --- |
| Production HTTP health | HTTP 200; PostgreSQL up |
| Real CAPTCHA | Accepted once; no repeated CAPTCHA loop |
| Server key generation | Success, including `serverId` and `identityKeys` |
| Owner registration | `create-community` and `sign-in-community` acknowledged successfully |
| Fresh joiner | Successful sign-in; general channel ready 2.503 seconds after the join request |
| Owner → joiner live message | Exact message and sender found in recipient UI; assertion took 550 ms |
| Joiner → owner live message | Exact message and sender found in recipient UI; assertion took 551 ms |
| Offline delivery | Passed after recipient restart while sender remained stopped |

For the offline check, the joiner was stopped and its process exit verified.
The owner sent a new message; QSS acknowledged its upload at 22:10:00.217 UTC.
The owner was then stopped and its process exit verified before restarting the
joiner. The joiner's UI displayed the exact stored message and sender. This
demonstrates delivery from QSS without a concurrently running sender.

Before deployment, production's key-generation response omitted `serverId`
and `identityKeys`. The 9.0.2 client rejected that response before sending
`create-community`, then retried and reopened CAPTCHA. The new production
response contains both required fields, and creation, authentication and
message delivery all succeed. No client patch was required for this result.

## Deployment timing

The [production workflow](https://github.com/TryQuiet/quiet-storage-service/actions/runs/34897416519)
succeeded on attempt 2, finishing at 22:03:31 UTC / 3:03:31 p.m. Pacific.
It deployed tag `v2.0.2`, commit
`519cbe9790ddba126ce53a921c7a90b12977c13b`, through CodeDeploy
`d-KE12U3IPL`.

| Stage | Duration |
| --- | --- |
| Waiting for GitHub runner | 4 seconds |
| Build | 42 seconds |
| Bundle and upload | 34 seconds |
| Waiting for AWS CodeDeploy | 17 minutes 54 seconds |

The delay was in AWS deployment, rather than a GitHub runner backlog. The
workflow log does not break that wait down into individual AWS lifecycle
phases. Deployment version provenance is the successful workflow and artifact
revision; the live EC2 filesystem was not independently inspected.

## Scope and evidence

This is one successful fresh two-client desktop 9.0.2 run. It does not establish
compatibility for existing communities or other platforms and client versions.
Live message figures are UI assertion durations from concurrently issued send
and wait commands, not precise network latency measurements. An initial
onboarding attempt ended when the helper could not find the server-offer
button; the successful run used fresh profiles and a shorter community name.
That initial UI failure was not diagnosed.

All test clients, their Tor processes, and dedicated displays were stopped.
The test did not deploy software or reset data. Private logs, invitations and
screenshots remain under `.connection-runs/prod-qss-2.0.2-validation/`.
[Sanitized machine-readable evidence](prod-qss-2.0.2-2026-09-14.json) records
protocol acknowledgements, command results, isolation checks and cleanup.
