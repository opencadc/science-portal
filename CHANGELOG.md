# Science Portal User Interface (0.6.1)

## [0.7.1](https://github.com/opencadc/science-portal/compare/0.7.0...0.7.1) (2025-07-22)


### Bug Fixes

* default notebook image is now astroml and version bump ([5608878](https://github.com/opencadc/science-portal/commit/56088783e15fa4c6fb0048ccd2da0834973a5a37))

## [0.7.0](https://github.com/opencadc/science-portal/compare/0.6.2...0.7.0) (2025-06-20)


### Features

* disable storage info if not set in url ([1dbbc72](https://github.com/opencadc/science-portal/commit/1dbbc72864622bbc158a84ff3d181b221107c7f4))

## [0.6.2](https://github.com/opencadc/science-portal/compare/0.6.1...0.6.2) (2025-06-16)


### Bug Fixes

* version update for image ([1c23956](https://github.com/opencadc/science-portal/commit/1c23956b37aee9ba521f28fb7b1298a2673d35f6))

## [0.6.1](https://github.com/opencadc/science-portal/compare/0.6.0...0.6.1) (2025-06-16)


### Bug Fixes

* updates for version and spotless check ([26afb48](https://github.com/opencadc/science-portal/commit/26afb488d346dbd86c3f7cb555b4f55f20e8d1ea))

## [0.6.1](https://github.com/opencadc/science-portal/compare/0.6.0...0.6.1) (2025-06-16)

### Features

* add support for user storage information ([841fdb0](https://github.com/opencadc/science-portal/commit/841fdb07a7bd994f49b9e77cacabeea57b7f807b))

## [0.6.0](https://github.com/opencadc/science-portal/compare/0.5.3...0.6.0) (2025-05-09)

### Features

* add firefly and provide compilation fixes ([749c954](https://github.com/opencadc/science-portal/commit/749c95439f2e590fd1f45ff14304b8efddc469f4))

## [0.5.3](https://github.com/opencadc/science-portal/compare/0.5.2...0.5.3) (2024-11-25)


### Bug Fixes

* increment old version file to force release build ([c742d91](https://github.com/opencadc/science-portal/commit/c742d91f3cf8c385ce4cff8a2d916101ce8f86c8))


### Miscellaneous Chores

* release 0.5.2 ([bd4f393](https://github.com/opencadc/science-portal/commit/bd4f393800747035093777cf210b1440e1a75027))
* release 0.5.3 ([8273ab7](https://github.com/opencadc/science-portal/commit/8273ab75aa4f78dfb807402b7e7dd2f70634aa35))

## [0.5.2](https://github.com/opencadc/science-portal/compare/0.5.1...0.5.2) (2024-11-25)


### Bug Fixes

* fix for image sha name for cosign ([e96adc4](https://github.com/opencadc/science-portal/commit/e96adc4946fa435250bddd78262ac34bd16b39d0))

## [0.5.1](https://github.com/opencadc/science-portal/compare/0.5.0...0.5.1) (2024-11-25)


### Miscellaneous Chores

* release 0.5.1 ([635b65c](https://github.com/opencadc/science-portal/commit/635b65cffd83cdbe8330c9cd2a419b97c1ab2b74))

## [0.5.0](https://github.com/opencadc/science-portal/compare/v0.4.0...0.5.0) (2024-11-22)


### Features

* add tabs for private and public images ([0ead427](https://github.com/opencadc/science-portal/commit/0ead427f0c7261a8ba2972d5b3898183c62d78ca))
* allow external images with credentials ([92159e5](https://github.com/opencadc/science-portal/commit/92159e5bbf1cd22e4b848760ed15dcf3babbcede))
* rename registryxxx to repositoryxxx to separate from ivoa registry and add configured repository hosts to ui ([ed1d6a8](https://github.com/opencadc/science-portal/commit/ed1d6a8096c38cd75f069e15a22e2cf9f76317c5))


### Bug Fixes

* add dependency submission to a separate file to only run on push to main ([85596ae](https://github.com/opencadc/science-portal/commit/85596aeb194fbb2bc0f16b42fd8123b4b4a865c6))
* create configurable tab labels ([2ae44a7](https://github.com/opencadc/science-portal/commit/2ae44a71dda7ab37d3574930478cd64f2a26fde9))
* fix cred certificate link ([3bbb1b5](https://github.com/opencadc/science-portal/commit/3bbb1b52a1e150895ea4adc0d99c552e84ecd757))
* fix release file ([eccc7c9](https://github.com/opencadc/science-portal/commit/eccc7c93bb905353db8772b3e29445add1adb8ce))
* include public no arg constructor ([6ed9cd0](https://github.com/opencadc/science-portal/commit/6ed9cd09c8d04c9338cd5958ed1fabb24beb8d10))
* make jdk 8 compatible ([cf98687](https://github.com/opencadc/science-portal/commit/cf986873d2f1e1304be407460b698ec43ba74df8))
* make label names configurable ([1c7eff1](https://github.com/opencadc/science-portal/commit/1c7eff1bc8e8fb902250886b31cf9d4b0f3bfa34))
* remove critical vulnerability ([6d52ec8](https://github.com/opencadc/science-portal/commit/6d52ec8ca528be6009c14fd42a57f0fb5cb8e605))
* remove inappropriate close button and add optional chaining to map calls ([3b6e5fa](https://github.com/opencadc/science-portal/commit/3b6e5fa32e7de2db806b68135a5cbd7e5b9923da))
* restyle form ([2b7e56d](https://github.com/opencadc/science-portal/commit/2b7e56decd2d385563546ed34def0d28c09e304a))
* review rework to ratchet from main and sanitize a tag for release ([baab3e2](https://github.com/opencadc/science-portal/commit/baab3e2c31530710717d0d0a53646961e5c7e4c1))

### 3.5
- Add OpenID Connect capabilities
- Add themes to support SRC (`src`) and CANFAR (`canfar`)
- Add local endpoints to remove risk of CORS

### 3.3
Supporting Changes
(none)
User-facing changes
- buttons available for viewing session events and logs 

## Feb 6, 2023
### 3.2
Supporting Changes
- Added calls and plumbing to Skaha for displaying platform usage

User-facing changes
- pending delete is now possible (fixing bug injected in v 3.0)
- Platform usage information displayed in panel next to launch form
- reset button available for platform usage panel

## Jan 17, 2023
### 3.1
Supporting Changes
- Added underlying call to Skaha to renew session expiry date.

User-facing changes
- more information added to session metadata.
- function button added to issue request to extend time for 
session by the current window allowed by skaha API. (Currently it's
2 weeks.)


## Jan 12, 2023
### 3.0
Supporting Changes
Science Portal UI is now built using React. Interactions with the site should be more smooth
now, and more responsive.

User-facing changes
Launch form is visible at all times now. Placeholders used when supporting data is loading.
Cards used for each session, including more information about the session.


## Dec 23, 2022
### 2.3
User-facing changes
Number of network calls to load data for launch form reduced from to 1.
This, combined with database configuration fixed the number 
and frequency of 'FORBIDDEN' errors that occurred on page load.

## Nov 4, 2022
### 2.2
Supporting Changes
- rework of code, launch form is in own class now to promote component
architecture of the javascript cdoe. 
- form data caching performed (so no ajax calls during form interaction,)
and data load occurs in a staged manner at page load in an attempt to
upgrade user experience of the page.

User-facing changes
- new modal added to show when user credentials are being authenticated (at page load it 
could look suspiciously like nothing was happening.)
- launch form button is disabled until form data is available
- launch form data is cached so the form should be far more responsive

## May 10, 2022
### 2.1
Minor changes
- Added 'contributed' session type

## April 9, 2021
### 2.0
Major changes
- Adding list of available sessions
- Support multiple session types (notebook, desktop, carta)
- Ability to delete sessions through UI
