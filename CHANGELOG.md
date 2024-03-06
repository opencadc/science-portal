## Oct 23, 2023

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




