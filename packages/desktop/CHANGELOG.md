# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 9.0.0-alpha.8 (2026-09-04)


### Bug Fixes

* "Invite A Friend" tab now reads "Add Members" ([#2234](https://github.com/TryQuiet/quiet-private/issues/2234)) ([049cd56](https://github.com/TryQuiet/quiet-private/commit/049cd560b7fbdd31353f3565ab0498b60fddefa2))
* **#2593:** link color ([#2640](https://github.com/TryQuiet/quiet-private/issues/2640)) ([7110cb5](https://github.com/TryQuiet/quiet-private/commit/7110cb5d6c84c9c3862ad15c532b593ec1341455)), closes [#2593](https://github.com/TryQuiet/quiet-private/issues/2593)
* **2576:** Update hover and selected contrast and modify sidebar color in dark mode ([#2579](https://github.com/TryQuiet/quiet-private/issues/2579)) ([d7bf1b9](https://github.com/TryQuiet/quiet-private/commit/d7bf1b938bce3096fbb9a67296fdca3fc4a157dc))
* **3140:** Validate qss endpoint when qss is allowed to avoid registration loops ([#3141](https://github.com/TryQuiet/quiet-private/issues/3141)) ([38d4292](https://github.com/TryQuiet/quiet-private/commit/38d42923dee8c31c454ca8a107479f9db1bf3bdb))
* **3146:** Fix slow electron startup ([#3147](https://github.com/TryQuiet/quiet-private/issues/3147)) ([748374e](https://github.com/TryQuiet/quiet-private/commit/748374e0d43124f2c95de15f38732145310adb56))
* Add `patch` to requirements documentation ([#1766](https://github.com/TryQuiet/quiet-private/issues/1766)) ([8eb6fcc](https://github.com/TryQuiet/quiet-private/commit/8eb6fccae2a894af395826f8043b35cfdd9bf3b5))
* add conditional checksum path ([8164b50](https://github.com/TryQuiet/quiet-private/commit/8164b50774f32856d9886f75d1bb25788f1e03c4))
* adds meaningful date markers [#2745](https://github.com/TryQuiet/quiet-private/issues/2745) ([#2775](https://github.com/TryQuiet/quiet-private/issues/2775)) ([fdd78e6](https://github.com/TryQuiet/quiet-private/commit/fdd78e6f40bc463131fb86c27d830e4d8c5fede1))
* Allow JPEG and GIF images as profile photos [#2332](https://github.com/TryQuiet/quiet-private/issues/2332) ([#2353](https://github.com/TryQuiet/quiet-private/issues/2353)) ([233725f](https://github.com/TryQuiet/quiet-private/commit/233725f6872c0a2dceb5eab02622c529ee64b152))
* Better QSS handling in invite links, proper redialing on disconnects, resetting LFA join status when in intermediate state on disconnect ([#3012](https://github.com/TryQuiet/quiet-private/issues/3012)) ([2b68c3c](https://github.com/TryQuiet/quiet-private/commit/2b68c3c94693f2aafa7fc5c7a65073e92c93e6dd))
* broken privacy policy link on join-server screen ([#3186](https://github.com/TryQuiet/quiet-private/issues/3186)) ([4cdb3a1](https://github.com/TryQuiet/quiet-private/commit/4cdb3a1c8c8cb30ba481dc6c16f5c05fc5b6bac7))
* Clean up desktop UI console errors/warnings ([#2226](https://github.com/TryQuiet/quiet-private/issues/2226)) ([570a7a9](https://github.com/TryQuiet/quiet-private/commit/570a7a9ce61ce52fb05b86e84c91c4a5110e2f7b))
* cleanup username creation component ([#2216](https://github.com/TryQuiet/quiet-private/issues/2216)) ([1d03995](https://github.com/TryQuiet/quiet-private/commit/1d039952cf84e94fdcf8b66c395f634094ea3a6b))
* create jdenticon from pubKey, not username - to distinguish user… ([#2207](https://github.com/TryQuiet/quiet-private/issues/2207)) ([fd8bd06](https://github.com/TryQuiet/quiet-private/commit/fd8bd06a5f226e0da8189581c076ba9976633e7d))
* e2e test for invitation link; ([#2126](https://github.com/TryQuiet/quiet-private/issues/2126)) ([5ddbc6a](https://github.com/TryQuiet/quiet-private/commit/5ddbc6adbbd694b030e61dbde50d73c658b097c9))
* Enable channel context menu for all users ([#2206](https://github.com/TryQuiet/quiet-private/issues/2206)) ([02f6809](https://github.com/TryQuiet/quiet-private/commit/02f680903bb66faf52c007f66523096e449d6d31))
* Fixes for crashes and connection hanging on 5.0.0 ([#2863](https://github.com/TryQuiet/quiet-private/issues/2863)) ([be1dd72](https://github.com/TryQuiet/quiet-private/commit/be1dd72ca3d65e170238a2b3ea8ecf88f8151141))
* Fixes issues related to joining, leaving communities and syncing ([#2857](https://github.com/TryQuiet/quiet-private/issues/2857)) ([37ecee0](https://github.com/TryQuiet/quiet-private/commit/37ecee07441a8c5c53689e308bfd7afdd35726e4))
* initialize electron store after setting new appData, otherwise i… ([#2150](https://github.com/TryQuiet/quiet-private/issues/2150)) ([ed9eb26](https://github.com/TryQuiet/quiet-private/commit/ed9eb266dae0a41531bb048d4a997e870c6c92c2))
* Make community name field text visible on create community page ([#2233](https://github.com/TryQuiet/quiet-private/issues/2233)) ([0f4a33f](https://github.com/TryQuiet/quiet-private/commit/0f4a33f231797d2ee94fdafbbb7917c640556a6d))
* make sure local peer's address in in invitation link ([#2268](https://github.com/TryQuiet/quiet-private/issues/2268)) ([53f1ec9](https://github.com/TryQuiet/quiet-private/commit/53f1ec91da07efeb7861e504c4936728ff01062c))
* pasting multiple files [#1987](https://github.com/TryQuiet/quiet-private/issues/1987) ([#2306](https://github.com/TryQuiet/quiet-private/issues/2306)) ([7c6b669](https://github.com/TryQuiet/quiet-private/commit/7c6b6693bb05e83632dbf452761345524cc4e310))
* Quick fix for intro message race condition ([#2376](https://github.com/TryQuiet/quiet-private/issues/2376)) ([d4f7449](https://github.com/TryQuiet/quiet-private/commit/d4f744941db33cfc1aa0f519a0d90378ba90f574))
* Remove duplicate introduction messages once again ([#2296](https://github.com/TryQuiet/quiet-private/issues/2296)) ([655a812](https://github.com/TryQuiet/quiet-private/commit/655a8124e177dae57a67e60367d6afdb73e0cb1a))
* Remove unused dmPublicKey to prevent UI delay during joining ([#2392](https://github.com/TryQuiet/quiet-private/issues/2392)) ([3ba5b9a](https://github.com/TryQuiet/quiet-private/commit/3ba5b9a94501620777b4cf766506763abdc140f1))
* send csr if local and stored ones differs ([#2147](https://github.com/TryQuiet/quiet-private/issues/2147)) ([b640d16](https://github.com/TryQuiet/quiet-private/commit/b640d1617ec58bb93129adaf8dfebe09c8de625c))
* sidebar layout tweaks ([#3184](https://github.com/TryQuiet/quiet-private/issues/3184)) ([accc53f](https://github.com/TryQuiet/quiet-private/commit/accc53ff515e302fe07d404827a4dc3a70178b08))
* trigger desktop ([2898bee](https://github.com/TryQuiet/quiet-private/commit/2898bee80bbf2f16cbda67281a29e47716faa77c))
* Updating channel naming logic ([#2307](https://github.com/TryQuiet/quiet-private/issues/2307)) ([38b007e](https://github.com/TryQuiet/quiet-private/commit/38b007e9319855afdb9b2150a3fbb782b9a688c3))
* user profile area should be clickable [#2566](https://github.com/TryQuiet/quiet-private/issues/2566) ([#2595](https://github.com/TryQuiet/quiet-private/issues/2595)) ([9dfd6da](https://github.com/TryQuiet/quiet-private/commit/9dfd6da55a744546afd185c17bc8e6bbe29ec3ad))
* Various fixes related to peers, CSRs and backend startup ([#2455](https://github.com/TryQuiet/quiet-private/issues/2455)) ([abd9101](https://github.com/TryQuiet/quiet-private/commit/abd9101f84149ae4ec1db3038fca31880334cdf3))


### Features

* [#1502](https://github.com/TryQuiet/quiet-private/issues/1502) get light/dark from native theme and access it through DRY function ([4d80746](https://github.com/TryQuiet/quiet-private/commit/4d8074674e324389a747d5a864b0efe96c282ee6))
* [#1502](https://github.com/TryQuiet/quiet-private/issues/1502) Implement dark mode, tidy up loose styles and unused classes. ([84bf50a](https://github.com/TryQuiet/quiet-private/commit/84bf50a3e4018530e077b04f1d63c4202792dd50))
* [#1502](https://github.com/TryQuiet/quiet-private/issues/1502) Let's do the Emoji picker too! ([17c1c67](https://github.com/TryQuiet/quiet-private/commit/17c1c67d829e5b78b169e3515095e95dabf595c0))
* [#1502](https://github.com/TryQuiet/quiet-private/issues/1502) make backgrounds on channel input and settings tabs the default ([1fb3969](https://github.com/TryQuiet/quiet-private/commit/1fb396900adcc1a1c27d671ace7e0be8cf50c55b))
* [#1502](https://github.com/TryQuiet/quiet-private/issues/1502) Remove hardcoded color and ensure contrast in tabs, more icon replacement ([cf106e0](https://github.com/TryQuiet/quiet-private/commit/cf106e08ae5b32d75b794b656fddc7e1fe1652ff))
* [#1502](https://github.com/TryQuiet/quiet-private/issues/1502) Replace hard-coded icons that weren't visible in dark mode ([1a1ce11](https://github.com/TryQuiet/quiet-private/commit/1a1ce116348acc341c327a5819fb6517c68c72a5))
* [#1502](https://github.com/TryQuiet/quiet-private/issues/1502) respect browser night-mode, fix sidebar and message highlight colors ([ecd239a](https://github.com/TryQuiet/quiet-private/commit/ecd239add006bca03519bb8d79ef1bc05db42928))
* [#1502](https://github.com/TryQuiet/quiet-private/issues/1502) tweak light-mode sidebar background ([663afcd](https://github.com/TryQuiet/quiet-private/commit/663afcd42976f161392e768032a605a7fb342a6d))
* [#1502](https://github.com/TryQuiet/quiet-private/issues/1502) Tweak more backgrounds in sidebar, Jdenticons, etc. ([d3fabeb](https://github.com/TryQuiet/quiet-private/commit/d3fabeb3ed8d08e6d3d1eafc308be806a2181159))
* [#1502](https://github.com/TryQuiet/quiet-private/issues/1502) update sidebar's selected item background to match Figmas ([3d50808](https://github.com/TryQuiet/quiet-private/commit/3d508086e778a61bdeefbd3417acad5220572562))
* 2312 pass invitation data to createNetwork saga and LAUNCH_COMMUNITY… ([#2438](https://github.com/TryQuiet/quiet-private/issues/2438)) ([de6f0cd](https://github.com/TryQuiet/quiet-private/commit/de6f0cda1b07ba7715cfb4876e51e423c5e9b9d0))
* **2759:** Add QSS sigchain syncing to Quiet ([#2877](https://github.com/TryQuiet/quiet-private/issues/2877)) ([fe1b1a0](https://github.com/TryQuiet/quiet-private/commit/fe1b1a0927e8f3c3e0ef3bc8c9adda19a64df0cc))
* **2803:** Write orbitdb sync data to QSS ([#2914](https://github.com/TryQuiet/quiet-private/issues/2914)) ([bfbfd92](https://github.com/TryQuiet/quiet-private/commit/bfbfd925feb35abf4bb6f04d2ed27b08a58b14cb))
* **3155:** Add private channels with modifiable membership (no removals) to desktop ([#3177](https://github.com/TryQuiet/quiet-private/issues/3177)) ([9eef40c](https://github.com/TryQuiet/quiet-private/commit/9eef40c7974f22e9a5bfa51449cfc35b9c2f66f4))
* **3155:** Private channels for mobile ([#3194](https://github.com/TryQuiet/quiet-private/issues/3194)) ([c3c89bf](https://github.com/TryQuiet/quiet-private/commit/c3c89bfdc9758e57b47f6e9630e3a8e3f6f6d7ef))
* **3277:** Open private channel creation to all users and prep for role-based permissons ([#3276](https://github.com/TryQuiet/quiet-private/issues/3276)) ([2592f56](https://github.com/TryQuiet/quiet-private/commit/2592f5689ab1482c61044c8e3c40d759282270e5))
* **3296:** Update invite links, use team ID everywhere and write randomly generated team name to chain ([#3324](https://github.com/TryQuiet/quiet-private/issues/3324)) ([c2a850c](https://github.com/TryQuiet/quiet-private/commit/c2a850c7f0da377b0cdf46e892b36fd74de31c86))
* **3300:** Allow all members of a private channel to add members to that channel ([#3303](https://github.com/TryQuiet/quiet-private/issues/3303)) ([5e41f92](https://github.com/TryQuiet/quiet-private/commit/5e41f921c11836ef8e8031aabdd9e42eada8b43a))
* **3300:** Allow channel owners to add members to channel ([#3299](https://github.com/TryQuiet/quiet-private/issues/3299)) ([8599479](https://github.com/TryQuiet/quiet-private/commit/85994797d82e10c81d2bb26d899233ad5a068c94))
* **3321:** Use random base58 usernames on sigchain ([#3325](https://github.com/TryQuiet/quiet-private/issues/3325)) ([698b1fd](https://github.com/TryQuiet/quiet-private/commit/698b1fd6217151a838bee0919c1623ec292fc76e))
* **503:** Adds desktop context menu ([#2719](https://github.com/TryQuiet/quiet-private/issues/2719)) ([4a71f68](https://github.com/TryQuiet/quiet-private/commit/4a71f68400f4d01219bbf26a6239454216c2dbcd)), closes [#503](https://github.com/TryQuiet/quiet-private/issues/503) [#568](https://github.com/TryQuiet/quiet-private/issues/568)
* add appPath to notarize ([bd9a0dc](https://github.com/TryQuiet/quiet-private/commit/bd9a0dc69f9da99405317d8210a14b82e6ac4910))
* add Certificates store and validation ([#2072](https://github.com/TryQuiet/quiet-private/issues/2072)) ([47669f4](https://github.com/TryQuiet/quiet-private/commit/47669f42edb1366b24de96139891909d696ded6d)), closes [#1899](https://github.com/TryQuiet/quiet-private/issues/1899)
* Add community metadata validation ([#2073](https://github.com/TryQuiet/quiet-private/issues/2073)) ([5780574](https://github.com/TryQuiet/quiet-private/commit/57805747f08261d0709554266e36fd0005eca839))
* add debug logs ([#2057](https://github.com/TryQuiet/quiet-private/issues/2057)) ([aa3e777](https://github.com/TryQuiet/quiet-private/commit/aa3e777778b0861d5f96e6116bfc70031ed67929))
* Add in V2 invite links for LFA ([#2661](https://github.com/TryQuiet/quiet-private/issues/2661)) ([46c0716](https://github.com/TryQuiet/quiet-private/commit/46c07166b3a8afd03d8d47d275b1787da8cfdaf1))
* add sticky date markers [#505](https://github.com/TryQuiet/quiet-private/issues/505) ([#2731](https://github.com/TryQuiet/quiet-private/issues/2731)) ([15d57b3](https://github.com/TryQuiet/quiet-private/commit/15d57b3227b1fee936feac21d5fe5c4921e9240a))
* Add user profile feature for desktop ([#1923](https://github.com/TryQuiet/quiet-private/issues/1923)) ([d016be5](https://github.com/TryQuiet/quiet-private/commit/d016be5a162560962c6059d73db6ab005fb023e8))
* export chats per channel ([c3faf4f](https://github.com/TryQuiet/quiet-private/commit/c3faf4f46693c3c08da23d57b4e8a3b2f4aec0ec)), closes [#2102](https://github.com/TryQuiet/quiet-private/issues/2102)
* Feat/519 big emoji messages ([#2389](https://github.com/TryQuiet/quiet-private/issues/2389)) ([71c8b22](https://github.com/TryQuiet/quiet-private/commit/71c8b226c81430c4eb741ca0903b8a27f67e259b))
* fixed UI for modal ([#2151](https://github.com/TryQuiet/quiet-private/issues/2151)) ([cf899d5](https://github.com/TryQuiet/quiet-private/commit/cf899d5983dd1f69605bbf622770a23884ad6f9f))
* Reintroduce private channels with improved privacy/security ([#3359](https://github.com/TryQuiet/quiet-private/issues/3359)) ([d98c353](https://github.com/TryQuiet/quiet-private/commit/d98c3533eb2cd3f16f46ec006236554581dd8834)), closes [#3323](https://github.com/TryQuiet/quiet-private/issues/3323) [#3318](https://github.com/TryQuiet/quiet-private/issues/3318)
* trigger desktop ([713e1b8](https://github.com/TryQuiet/quiet-private/commit/713e1b822b266c218f71742ed68616b8b1056c75))
* trigger lerna ([4ca8195](https://github.com/TryQuiet/quiet-private/commit/4ca81958c57e88f172e0d78f055e9008a5a4a90a))
* version code 366 ([cebf886](https://github.com/TryQuiet/quiet-private/commit/cebf886aee2c4ec6e0ef4e66219d9dc0afecb98c))


### Reverts

* Revert "Use mise-en-place (https://mise.jdx.dev/) for repo dependencies" ([18c8d31](https://github.com/TryQuiet/quiet-private/commit/18c8d31ea982fb8a793ab59a196cf00f2fc39f90))
* Revert "Adjust project bootstrap scripts to be windows-friendly (#1870)" (#1937) ([0811ea3](https://github.com/TryQuiet/quiet-private/commit/0811ea3ea3f682dd763be72b12f626fe416bc036)), closes [#1870](https://github.com/TryQuiet/quiet-private/issues/1870) [#1937](https://github.com/TryQuiet/quiet-private/issues/1937) [#1870](https://github.com/TryQuiet/quiet-private/issues/1870)
* Revert "Remove afterAllArtifactBuild for linux" ([975d0df](https://github.com/TryQuiet/quiet-private/commit/975d0df58494bdfba1270f6845152af4969e77ea))





# Changelog

## [9.0.0]

### Features

* Add beta warning message to desktop when creating/joining a community [#3351](https://github.com/TryQuiet/quiet/issues/3351)

### Breaking

* Update data directories for 9.x [#3379](https://github.com/TryQuiet/quiet/issues/3379)
* Tighten controls on channel metadata DB operations, move private channels to separate metadata DB [#3329](https://github.com/TryQuiet/quiet/issues/3329)
* Use chain permission checks to gate channel creation, deletion and membership [#3344](https://github.com/TryQuiet/quiet/issues/3344)
* Use randomly generated role names for private channels [#3354](https://github.com/TryQuiet/quiet/issues/3354)
* Tighten user profile store access control and validations [#3340](https://github.com/TryQuiet/quiet/issues/3340)

### Fixes

* iOS tor process lifecycle improvements solving crashes and improving performance [#3349](https://github.com/TryQuiet/quiet/issues/3349)
* Update LFA to remove flaky timestamp validator [#3365](https://github.com/TryQuiet/quiet/issues/3365)
* Fix OrbitDB indexing to avoid overwriting previously indexed deletions with puts [#3393](https://github.com/TryQuiet/quiet/issues/3393)
* Fix validations of private channel deletions [#3392](https://github.com/TryQuiet/quiet/issues/3392)
* Pass channel ID to name mappings to mobile native storage and use in notifications [#3387](https://github.com/TryQuiet/quiet/issues/3387)
* Make usernames and profile photos tapable when adding members to private channel [#3371](https://github.com/TryQuiet/quiet/issues/3371)

## [8.0.0]

### Features

* Allow all users to create private channels [#3277](https://github.com/TryQuiet/quiet/issues/3277)
* Allow channel members to add members to private channels [#3300](https://github.com/TryQuiet/quiet/issues/3300)

### Fixes

* Don't send deletion message for private channels [#3273](https://github.com/TryQuiet/quiet/issues/3273)
* Ensure notification registration waits for auth handshake [#3289](https://github.com/TryQuiet/quiet/issues/3289)
* Fixed a race condition that can cause stale data to remain after leaving community [#3253](https://github.com/TryQuiet/quiet/issues/3253)
* Validate user ID on decrypted message matches the signature [#3334](https://github.com/TryQuiet/quiet/issues/3334)

### Chores

* Enable QSS on prod
* Add script for cleaning compiled/generated code directories

### Breaking

* Include team ID and createdAt in message encryption and validate on consume [#3304](https://github.com/TryQuiet/quiet/issues/3304)
* Require team ID on invite links, use team ID for all chain operations, and hash team name on sigchains [#3296](https://github.com/TryQuiet/quiet/issues/3296)
* Use randomly generated Base58 usernames on sigchain [#3321](https://github.com/TryQuiet/quiet/issues/3321)
* Update install directories for 8.x [#3338](https://github.com/TryQuiet/quiet/issues/3338)
* Update S3 bucket for 8.x release binaries [#3346](https://github.com/TryQuiet/quiet/issues/3346as)

## [7.3.0]

### Features

* Adds private channels with modifiable membership (no removals) to desktop [#3155](https://github.com/TryQuiet/quiet/issues/3155)
* Adds private channels with modifiable membership (no removals) to mobile [#3155](https://github.com/TryQuiet/quiet/issues/3155)
* Private channel creation and modification is limited to admins [#3256](https://github.com/TryQuiet/quiet/issues/3256)

### Fixes

* Fix: leaving a community now purges uploaded and downloaded files; if the leave is interrupted (process killed, OS-terminated, power loss), the purge is finished on the next app launch [#3225](https://github.com/TryQuiet/quiet/issues/3225)
* Fixed android not requesting permission for foreground push notifications [#3254](https://github.com/TryQuiet/quiet/issues/3254)
* Fixes race condition with android push notifications [#3255](https://github.com/TryQuiet/quiet/issues/3255)
* Mark IOS UI as needing compatibility updates to fix contrast problems on IOS 26 [#3266](https://github.com/TryQuiet/quiet/issues/3266)

## [7.2.0]

### Features

* Added background push notifications and background hibernation for android [#3156](https://github.com/TryQuiet/quiet/issues/3156)
* Extends the dev/alpha-only "Share logs" and "Share all data" actions to the "Starting backend" screen (mobile) [#3241](https://github.com/TryQuiet/quiet/pull/3241)

### Fixes

* The user profile tab at the bottom of the sidebar now has the correct opacity and layout, and the faint horizontal stripe that appeared on some platforms and window sizes is gone now. [#3184](https://github.com/TryQuiet/quiet/pull/3184)
* Improved tor lifecycle handling [#3233](https://github.com/TryQuiet/quiet/issues/3233)
* Fixed Android crash on leaving a community when `google-services.json` was missing from the build [#3238](https://github.com/TryQuiet/quiet/pull/3238)
* Fixed broken privacy policy link on the Terms of Service / Privacy Policy acceptance screen (desktop + mobile) [#3186](https://github.com/TryQuiet/quiet/pull/3186)
* Fixed Android build failure under product flavors where react-native-config didn't load the matching `.env` file [#3197](https://github.com/TryQuiet/quiet/pull/3197)

### Chores

* Refactored syncing data with QSS for modularity [#3235](https://github.com/TryQuiet/quiet/issues/3235)
* Upgraded Electron to v32 (desktop) [#3119](https://github.com/TryQuiet/quiet/pull/3119)

## [7.1.0]

### Features

* Adds ios push notification support [#3087](https://github.com/TryQuiet/quiet/issues/3087)
* Adds dev/alpha-only "Share logs" and "Share all data" actions on joining screen and menu (mobile) [#3213](https://github.com/TryQuiet/quiet/issues/3213)

### Chores

## [7.0.1]

### Features

* Registers APNS token with push notifications service [#3080](https://github.com/TryQuiet/quiet/issues/3080)
* Adds push notification service [#3086](https://github.com/TryQuiet/quiet/issues/3086)

### Fixes

* Fixed bug around killing old tor process that results in an unhandled exception [#3135](https://github.com/TryQuiet/quiet/issues/3135)
* Adds new mac entitlement to fix arm64 crashes on arm64 binaries [#3180](https://github.com/TryQuiet/quiet/issues/3180)
* Fixed bug that caused a registration loop when QSS_ALLOWED is true but the endpoint is unset [#3140](https://github.com/TryQuiet/quiet/issues/3140)
* Fix delay between sign-in and historical log entry pull from QSS [#3127](https://github.com/TryQuiet/quiet/issues/3127)

### Chores

* Upgrades NodeJS to 20.20.1

## [7.0.0]

### Features

* Create an invite lockbox when using QSS [#3057](https://github.com/TryQuiet/quiet/issues/3057)
* Self-assign the member role when joining with QSS [#3058](https://github.com/TryQuiet/quiet/issues/3058)
* Use LFA-based identity in OrbitDB
* Requests iOS notification permissions when app launches [#3079](https://github.com/TryQuiet/quiet/issues/3079)
* Store LFA keys in IOS keychain for notifications [#3091](https://github.com/TryQuiet/quiet/issues/3091)
* Store user metadata in IOS native storage for notifications [#3091](https://github.com/TryQuiet/quiet/issues/3091)

## [6.6.2]

### Fixes

* Fixed crashes on GrapheneOS devices

## [6.6.0]

### Features

* Adds hcaptcha verification for protected QSS actions [#2908](https://github.com/TryQuiet/quiet/issues/2908)
* Messages can now be relayed using QSS [#2805](https://github.com/TryQuiet/quiet/issues/2805)
* Messages can be retrieved from QSS stores [#2806](https://github.com/TryQuiet/quiet/issues/2806)
* Profile photos are now uploaded via IPFS [#3048](https://github.com/TryQuiet/quiet/issues/3048)

### Fixes

* Fixed being unable to quit application during initial load [#3046](https://github.com/TryQuiet/quiet/issues/3046)
* Fixed trace logger toggles [#3045](https://github.com/TryQuiet/quiet/issues/3045)
* Handle AWS QSS endpoints in invite links [#3024](https://github.com/TryQuiet/quiet/issues/3024)

## [6.5.1]

### Chores

* Updgrade NodeJS on mobile to 18.20.4
* 16kb compliance changes on android

## [6.4.0]

### Features

* Add ability to adjust image/file auto-download size threshold [#3019](https://github.com/TryQuiet/quiet/pull/3019)

### Fixes

* DisableWebDrag added to links listed in an issue [#481] (https://github.com/TryQuiet/quiet/issues/481)
* Fixes dialing on join when using AWS QSS [#3025](https://github.com/TryQuiet/quiet/issues/3025)

### Chores

* Change autoupdater text [#2971](https://github.com/TryQuiet/quiet/issues/2971)
* Fixed issues with testing workflows [#3030](https://github.com/TryQuiet/quiet/issues/3030)
* Add MacOS arm64-specific build jobs to resolve slow UI startup on Apple Silicon [#3146](https://github.com/TryQuiet/quiet/issues/3146)

## [6.3.0]

### Features

* Adds support for syncing OrbitDB entries to QSS [#2803](https://github.com/TryQuiet/quiet/issues/2803)
* Persist SkinTone choices and use in emoji shortcodes [#2794](https://github.com/TryQuiet/quiet/issues/2794)
* Adds UI for assist server opt in [#2910](https://github.com/TryQuiet/quiet/issues/2910)
* Adds UI for terms of service [#2911](https://github.com/TryQuiet/quiet/issues/2911)

### Fixes

* Minor design fixes on the left side panel [#2948](https://github.com/TryQuiet/quiet/issues/2948)
* Warning modal background color is now reactive to theme selection [#2958](https://github.com/TryQuiet/quiet/issues/2958)
* Fixes crashes on QSS disconnects [#2803](https://github.com/TryQuiet/quiet/issues/2803)
* Users can now abort joining and creating communities halfway without issue [#3001](https://github.com/TryQuiet/quiet/issues/3001)

### Chores

* Update QSS flag to QSS_ALLOWED and reconfigure enabled setting/checking [#2912](https://github.com/TryQuiet/quiet/issues/2912)
* Update libraries to comply with 16kB page size for Android native code [#2905](https://github.com/TryQuiet/quiet/issues/2905)

## [6.2.0]

### Fixes

* Fix newline formatting in messages on mobile
* Fix issue with keyboard hiding message input on Android
* Fix issue with message send button not displaying correctly on mobile

### Chores

* Bump Android SDK to 35, NDK to 28.2.13676358, and Gradle plugin to 8.5.1 [see Google Play deadline](https://developer.android.com/google/play/requirements/target-sdk)

## [6.1.0]

### Fixes

* Leaving a community on android and then immediately creating/joining a new one no longer fails to reinitialize [#2940](https://github.com/TryQuiet/quiet/issues/2940)
* Abrupt closes properly clean up resources and save data [#2921](https://github.com/TryQuiet/quiet/issues/2921)
* User Profile photo size limits now more strictly enforced [#2892](https://github.com/TryQuiet/quiet/issues/2892)
* Fixed some race conditions with user profiles and message verification that could cause some messages to never display [#2847](https://github.com/TryQuiet/quiet/issues/2847)
* Fixed automatic updates on mac [#2965](https://github.com/TryQuiet/quiet/issues/2965)
* Fixed tor binary path detection on locally distributables [#2964](https://github.com/TryQuiet/quiet/issues/2964)
* Fixed channel metadata syncing [#2968](https://github.com/TryQuiet/quiet/issues/2968)

### Features

* Adds new debugging tools in development mode [#2956](https://github.com/TryQuiet/quiet/issues/2956)
* User profiles and their connection status now appear in the sidebar [#2920](https://github.com/TryQuiet/quiet/issues/2920)
* In development mode, a debug panel now exposes some state parameters to assist debugging [#2924](https://github.com/TryQuiet/quiet/issues/2924)

### Security

* More secure socketIOSecret sharing [#2931](https://github.com/TryQuiet/quiet/issues/2931)

## [6.0.1]

### Security

* Use libsodium for socketIOSecret comparison and migrate logic from common to backend [#2820](https://github.com/TryQuiet/quiet/issues/2820)
* Use libsodium for socketIOSecret generation in desktop and android [#2820](https://github.com/TryQuiet/quiet/issues/2820)
* Simplify/standardize socketIOSecret generation on IOS (no libsodium) [#2820](https://github.com/TryQuiet/quiet/issues/2820)

## [6.0.0]

### Features

* Adds a hook for Quiet Storage Service (QSS) to inject entries into OrbitDB [#2807](https://github.com/TryQuiet/quiet/issues/2807)
* Adds an event for when a local put occurs [#2802](https://github.com/TryQuiet/quiet/issues/2802)
* Adds support for QSS auth syncing [#2760](https://github.com/TryQuiet/quiet/issues/2760)

### Fixes

* Fixes race condition with initial user profile entry on joining [#2887](https://github.com/TryQuiet/quiet/issues/2887)
* Changing the text on the loading screen when the user creates a community [#2248] (https://github.com/TryQuiet/quiet/issues/2248)

### Breaking

* Adds key commitment scheme to address the "invisible salamanders" attack [#2711](https://github.com/TryQuiet/quiet/issues/2711)
* Adds team ID to encrypted OrbitDB entries

## [5.1.2]

### Chores

* Quiet Desktop now uses Tor 0.4.8.16
* The process for updating Tor on desktop is now mostly automated and part of our release checklist (thanks @bitmold!)
* Quiet Android now uses Tor 0.4.8.16 [#2861](https://github.com/TryQuiet/quiet/issues/2861)
* The process for updating Tor on Android is now also mostly automated and part of our release checklist
* Stops duplicating Tor binaries on MacOS (we were just duplicating the same Universal Binary for both x64 and arm64, which did not make sense.)

## [5.1.0]

### Chores

* Rename upload/uploaded terminology to attachment for clarity across codebase
* Updates Android instructions in `packages/mobile/README.md`

### Features

* Compresses images and user profile photos over 200KB, for faster downloads and less hogging of storage space. [#1018](https://github.com/TryQuiet/quiet/issues/1018)
* Attachments button on mobile shows photo library ([#1698](https://github.com/TryQuiet/quiet/issues/1698))
* Adds date dividers and a sticky date marker on mobile too, for better readability ([#505](https://github.com/TryQuiet/quiet/issues/505))

### Fixes

* Removes Sentry logger and the associated warning modal, since we aren't using it anymore. ([#2777](https://github.com/TryQuiet/quiet/issues/2777))


## [5.0.0]

### Features

* Users can now enter the channel view before Tor has fully initialized which means much less waiting time when opening the app. Actions will be queued to be sent when the connection is established. [#2837](https://github.com/TryQuiet/quiet/issues/2837)

### Fixes

* Resolved an issue where messages autocorrected by iOS were remaining unsent in the message input, after the uncorrected message was sent [#2858](https://github.com/TryQuiet/quiet/issues/2858)
* Resolved an issue with event handlers not attaching to the Team object when joining a community for the first time [#2845](https://github.com/TryQuiet/quiet/issues/2845)
* Resolved an issue with malformed libp2p addresses during redialing peers you had recently been connected to [#2842](https://github.com/TryQuiet/quiet/issues/2842)
* Fixed an issue with failing to reconnect to users who had dialed you and then disconnected [#2854](https://github.com/TryQuiet/quiet/issues/2854)
* Resolved an issue with logger duplication [#2853](https://github.com/TryQuiet/quiet/issues/2853)

### Fixes

* Adds a bunch of missing emoji codes [2824](https://github.com/TryQuiet/quiet/issues/2824)

## [5.0.0]

### Chores

* Disables bitcode creation and strips bitcode from Tor.framework for xcode 16 compatibility
* Targets iOS 18 SDK as required by Apple
* Disabled automatic desktop updates from v4.x to v5.x by changing the update bucket [#2832](https://github.com/TryQuiet/quiet/issues/2832)
* Specifies timezone in mobile snapshot tests
* Removed deprecated identity systems not based on LFA [#2762](https://github.com/TryQuiet/quiet/issues/2762)
* Updates storage location on desktop from "Quiet4" to "Quiet5" so users can run both at once
* Updates file storage locations on iOS and Android

## [4.1.0]

### New Features

* Adds sticky date markers to the chat view [#505](https://github.com/TryQuiet/quiet/issues/505)
* Adds meaningful text to date markers, like "Today", "Yesterday", "Friday", or "Nov 30, 1999" [#2745](https://github.com/TryQuiet/quiet/issues/2745)
* You can now type emoticons (<3) and emojicodes (:heart:) with tab completion and a handy dropdown. [#540](https://github.com/TryQuiet/quiet/issues/540) (thanks @agiledev24 for your initial work on this!)

### Fixes

* Fixes an issue where heart emojis were displaying all tiny, ASCII, and goth. Now our hearts are big and bright red, for vibes! [#510](https://github.com/TryQuiet/quiet/issues/510)
* Fixes back button navigation issues in user profile/edit screens [#2570](https://github.com/TryQuiet/quiet/issues/2570)
* Changes close button in settings to the back button ([#2792]https://github.com/TryQuiet/quiet/issues/2792)
* Changes the Leave Community modal to match the rest of the Settings ([2569]https://github.com/TryQuiet/quiet/issues/2569)
* Fixes an issue on Android where the app was not correctly displaying times in the local timezone [#2766](https://github.com/TryQuiet/quiet/issues/2766) (thanks for the bug report, anon!)

### Chores

* Improves speed, reliability, and documentation for Cypress tests

## [4.0.3]

### New features

* Adds a context menu in Quiet desktop for copying text ([#503](https://github.com/TryQuiet/quiet/issues/503)) and saving images ([#503](https://github.com/TryQuiet/quiet/issues/568)) Thanks @agiledev24!

### Fixes

* Fixes issue where the app may crash when trying to redial a peer that doesn't recognize your user as being in the sigchain ([#2770](https://github.com/TryQuiet/quiet/issues/2770))
* Fixes issue where the app may crash when hanging up on a peer we don't have in our sigchain ([#2770](https://github.com/TryQuiet/quiet/issues/2770))

### Chores

* Write app logs to rotating files ([#2771](https://github.com/TryQuiet/quiet/issues/2771))

## [4.0.0]

### New features

* Generating LFA-ready invite links when a sigchain is configured ([#2627](https://github.com/TryQuiet/quiet/issues/2627))
* Add local-first/auth powered libp2p authentication service ([#2629](https://github.com/TryQuiet/quiet/issues/2629))
* Adds admin-only screens when non-admins try to access add members screens ([#2729](https://github.com/TryQuiet/quiet/issues/2729))

### Chores

* Add `trace` level logs to `@quiet/logger` ([#2716](https://github.com/TryQuiet/quiet/issues/2716))
* Add slack notifications to release workflows ([#2722](https://github.com/TryQuiet/quiet/issues/2722))
* Refactor the `StorageService` and create `ChannelService`, `MessageService` and `ChannelStore` for handling channel-related persistence ([#2631](https://github.com/TryQuiet/quiet/issues/2631))

## [3.0.0]

### Chores

* Upgrade OrbitDB to 2.2.0, LibP2P to 1.9.4, replace ipfs-js with Helia ([#2624](https://github.com/TryQuiet/quiet/issues/2624))
* File upload improvements ([#2624](https://github.com/TryQuiet/quiet/issues/2624))
* Add Helia fork to quiet repo ([#2624](https://github.com/TryQuiet/quiet/issues/2624))
* Upgrade OrbitDB to 2.4.3, LibP2P to 2.X, Helia to 5.X ([#2624](https://github.com/TryQuiet/quiet/issues/2624))
* Add @chainsafe/libp2p-noise as a submodule to get rid of WASM ([#2624](https://github.com/TryQuiet/quiet/issues/2624))
* Update data directory to `Quiet3` ([#2672](https://github.com/TryQuiet/quiet/issues/2672))
* Update production release S3 bucket to `quiet.3.x` ([#2672](https://github.com/TryQuiet/quiet/issues/2672))

## [2.3.3]

### New features

* Adds basic sigchain functions ([#2625](https://github.com/TryQuiet/quiet/issues/2625))
* Instantiates signature chain when creating communities and reloading application ([#2626](https://github.com/TryQuiet/quiet/issues/2626))
* Added in LFA-ready invite links ([#2627](https://github.com/TryQuiet/quiet/issues/2627))

### Fixes

* Changed company name in app to "A Quiet LLC" ([#2642](https://github.com/TryQuiet/quiet/issues/2642))
* Fixed copyright statement in Electron app ([#2589](https://github.com/TryQuiet/quiet/issues/2589))
* Improved clickable link contrast ([#2593](https://github.com/TryQuiet/quiet/issues/2593))

## [2.3.2]

### Chores

* Moved some responsibilities of identity management to the backend ([#2602](https://github.com/TryQuiet/quiet/issues/2602))
* Added auth submodule in preparation for future encyrption work ([#2623](https://github.com/TryQuiet/quiet/issues/2623))

### Fixes

* Fixed memory leak associated with autoUpdater ([#2606](https://github.com/TryQuiet/quiet/issues/2606))
* Fixed visual regression tests ([#2644](https://github.com/TryQuiet/quiet/issues/2645))

## [2.3.1]

### Fixes

* The user profile area is now much easier to click on desktop, and has a nice hover effect matching the rest of the sidebar ([#2566](https://github.com/TryQuiet/quiet/issues/2566)) Thanks @okrayrum!
* Android app will now work correctly after suspending it (e.g. by swiping up in the app manager) ([#2587](https://github.com/TryQuiet/quiet/issues/2587))

## [2.3.0]

### New features

* Add dark mode to the desktop UI ([#1502](https://github.com/TryQuiet/quiet/issues/1502))
* Add support for new format of invitation link: `c=<cid>&t=<token>&s=<serverAddress>&i=<inviterAddress>` ([#2310](https://github.com/TryQuiet/quiet/issues/2310))
* Use server for downloading initial community metadata if v2 invitation link is detected ([#2295](https://github.com/TryQuiet/quiet/issues/2295))

### Refactorings

* Consolidate colors and align theme with MUI standards ([#2445](https://github.com/TryQuiet/quiet/issues/2445))
* Refactor some UI components to align with architecture goals ([2447](https://github.com/TryQuiet/quiet/issues/2447))

### Fixes

* Disable spellCheck/autoCorrect on non-spelling sensitive fields like usernames and channels ([#373](https://github.com/TryQuiet/quiet/issues/373))
* Fixes issue with reconnecting to peers on resume on iOS ([#2424](https://github.com/TryQuiet/quiet/issues/2424))
* Fixes references to 'invite code' to be 'invite link' in UI ([#2441](https://github.com/TryQuiet/quiet/issues/2441))
* Fixes issue with image messages not displaying/throwing errors on iOS ([#2526](https://github.com/TryQuiet/quiet/issues/2526))

### Chores

* Cleanup data directory at end of e2e tests
* Update mobile development README ([#2483](https://github.com/TryQuiet/quiet/issues/2483))
* Update github workflows for PR gating ([#2487](https://github.com/TryQuiet/quiet/issues/2487))
* Don't create duplicate CSRs when joining a community under certain circumstances ([#2321](https://github.com/TryQuiet/quiet/issues/2321))
* Add abstract base classes for stores ([#2407](https://github.com/TryQuiet/quiet/issues/2407))

## [2.2.0]

### New features

* Add utilities for emoji detection in messages and make all-emoji message larger font size ([#519](https://github.com/TryQuiet/quiet/issues/519))

### Refactorings

* Use ack for CREATE_NETWORK and simplify
* Move Community model to the backend

### Fixes

* Allow JPEG and GIF files as profile photos ([#2332](https://github.com/TryQuiet/quiet/issues/2332))
* Fix issues with recreating general channel when deleted while offline ([#2334](https://github.com/TryQuiet/quiet/issues/2334))
* Fix package.json license inconsistency
* Fixes issue with reconnecting to peers on resume on iOS ([#2424](https://github.com/TryQuiet/quiet/issues/2424))
* Reorder the closing of services, prevent sagas running multiple times and close backend server properly

## [2.1.2]

### Refactorings

* Rename and reorganize frontend/backend events API
* Rename message retrieval events/sagas and use ack feature
* Rename LOAD_MESSAGES event and incomingMessages reducer
* Use socket.io ack for CREATE_CHANNEL event
* Introduce socket.io acknowledgements

### Fixes

* Fixes channel name creation logic
* Remove duplicate introduction messages once again
* Prevent channel creation with names that start with special character, then a hyphen
* Choose random ports for Tor services (iOS)
* Use consistent identicons for messages and profile
* Add retry ability to tor-control and misc tor-control fixes

## Other

* Upgraded React-Native to 0.73.2

## [2.1.1]

### Fixes

* Make sure address of the inviting peer is in the invitation link
* Opening the mobile app with joining links has been corrected.

### Refactorings

* Remove unused backend events and state-manager event types

## [2.1.0]

### New features

* Added user profile feature.
* Updated old logo of Linux and Windows with rounded ones.

### Fixes

* Handle spaces in tor process path.
* Run tor process in shell.

### Refactorings

* Refactor registration service, replace promise waiting mechanism around certificate requests and help prevent duplicate username registration
* Removed SAVE_OWNER_CERTIFICATE event.
* Removed registrar reminders and rename LAUNCH_REGISTRAR.
* Removed unused SEND_USER_CERTIFICATE event.
* Removed unused SUBSCRIBE_FOR events.

## [2.0.1]

### Fixes

* Desktop UI console errors/warnings have been cleaned up.
* The channel context menu is now enabled for all users.
* A bug that impersonated the channel creation message due to the removal of the username has been fixed.
* Large file downloads are now slower but steadier.
* The username changing form has been fixed.
* Push notifications runtime permission is now requested on Android.
* Users joining a community will no longer receive multiple "welcome" messages.
* Users sharing the same nickname now have different profile images.

## [2.0.0]

### Breaking changes

* To let users join when the owner is offline we made changes that broke backwards compatibility, so you will need to create a new community and re-invite members. Need help migrating? [help@quiet.chat](mailto:help@quiet.chat)

### New features

* Users can join a community when its owner is offline. This was a big one!
* Desktop and mobile users can send markdown messages. (Thanks again @josephlacey!)
* Desktop users can now export chats to a text file. (Thanks @rajdip-b!)

### Improvements

* Prettier message loading indicator on mobile
* Better descriptions of the joining process
* Validation of community metadata and certificates
* A real iOS launch screen (so long, "Powered by React Native"!)
* A nice splash screen on mobile until the joining/creating screens are ready
* Clearer autoupdate language in the update modal, so users know that the app will update on restart

### Fixes

* Mobile apps should no longer crash on restart.
* Joining community no longer gets stuck on "initiating backend modules."
* Invalid peer addresses in peer list are now filtered out, and peer list is updated in localdb.
* Peers now dial new users without having to restart.
* Up/down arrows are now working properly inside channel input. (Thanks @josephlacey!)
* Long messages are no longer truncated in channelInput component.
* Users can change between "join community" and "create community" screens without errors about a missing required field.
* On iOS, there's more weird empty space between the input field and the soft keyboard.
* The UI for users already in a community joining a new community is no longer misleading, so users will not accidentally leave a community by opening a new invite link.
* Desktop settings now open the "invite" tab by default, as they were meant to.
* We now initialize electron-store after setting appData to prevent creating an empty "Quiet" data directory.

### Notes

* Quiet now labels duplicate unregistered usernames
* Quiet shows an full-screen warning for duplicate registered usernames, since these should never happen and indicate a potential compromise.
* For authenticating connections, Quiet now uses libp2p's [Pre-shared Key Based Private Networks](https://github.com/libp2p/specs/blob/master/pnet/Private-Networks-PSK-V1.md) instead of X.509 certificates so peers can connect before registering.

## [2.0.3-alpha.16]

* Fix: mobile app crashing on restart

* Refactor: backend, storage module - extracting OrbitDB as another provider, refactor of  CertificatesRequestsStore, CommunityMetadataStore, CertificatesStore as Nest providers, store tests adjustments,  file structure

## [2.0.3-alpha.15]

* Fix: construct all stores before initializing them - initializing community metadata store sets metadata in certificates store

* Fix: joining community stuck on "initiation backend modules"

* Add debug logs.

## [2.0.3-alpha.14]

* Add community metadata validation.

* Move community metadata to separate store.

## [2.0.3-alpha.13]

* Initialize electron-store after setting appData to prevent creating empty "Quiet" data directory

* Fixed UI for Update Modal

* Fixed username taken logic

* Add test-case in e2e multiple test for using username taken modal

## [2.0.3-alpha.12]

* Better descriptions of the joining process

* Update custom deps repositiries (upload-s3-action, ipfs-pubsub-peer-monitor)

* Add certificates validation.

* Move certificates to separate store.

* Move csrs to separate store.

* Fix saveUserCsr saga to trigger only if user csr is absent in user slice.

* Send an info message immediately after a user joins the community

* Feature: add functionality to export chat to text document in desktop version

## [2.0.3-alpha.6]

* Fix: filter out invalid peer addresses in peer list. Update peer list in localdb.

* Fix: dial new peers on CSRs replication

## [2.0.3-alpha.5]

* Fix network data proceeding when using custom protocol multiple times #1847

* Backward incompatible change: use pre shared key as connection protector in libp2p. Add libp2p psk to invitation link

* Removed code responsible for data translation from channel address to channel id from state manager transforms and storage service

## [2.0.3-alpha.1]

* Temporarily hiding leave community button from Possible impersonation attack

## [2.0.3-alpha.0]

* Filter CSRs - remove old csrs and replace with new for each pubkey

* Fixed mobile bugs - joining by QR code and not showing username taken screen for user who has unique name

* Use context menu for information about unregistered username instead screen

* Shorter dots-placeholder for invite link

* Display a shorter invite link on a mobile

* Removed registration attempts selector and corresponding usage.

* Revert adjusting bootstrap scripts for developing on Windows

* Channel input - replaced ContentEditable with textarea

* Fix - up/down arrows now work properly inside channel input (textarea)

## [2.0.1-alpha.2]

* UI layer for taken usernames for desktop and mobile

* Change nickname for taken username

* Map messages sent before changing username

* Update registrar service to match new registration flow.

* Add possible impersonation attack UI for desktop and mobile

* Fix truncated long messages in channelInput component

* Unblock mobile e2e tests

* Prettify loading component on Chat screen (mobile)

* Running Chromatic tests for forked PRs

* Added e2e test for user joining community when owner is offline. Improved e2e tests

* Bump github actions/* to versions using node16

* Project can now be bootstraped on Windows (powershell)

* Placeholder(...) for community name

* No unregistered/duplicated label for system messages

## [2.0.0-alpha.11]

* Customize Launch Screen on iOS

* Suspends certain websocket events until backend becomes fully operative (faster and dumber frontend).

* Replaced greying out inputs with splash screen on joining/creating screens.

* Fixes empty space between chat's input and a soft keyboard on iOS devices.

* Changed registration process - user connects to the libp2p network directly instead of using registrar. Invitation link format changed. User csr is now saved to database.

* Fixed android stucking on username registration screen introduced in previous alpha.

* Added creator username to initial channel message.

* Fixed bug with changing joining community/create community screens with required field.

* Fixed bug with displaying incorrect default settings tab.

* Replaced source of publicKey in sendMessage saga to CSR

* Labels for unregistered and duplicate usernames with modals

* Fixed LoadingPanel useEffect bug.

* Use csrs instead of certificates as a source of user data

* Integration state manager layer with UI layer(desktop and mobile)

* Clarify autoupdate language in update modal to let users know that the app will update on restart.

* C4 for Quiet architecture. Context and Container diagrams.

* Invite tab as default in settings
