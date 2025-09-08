# CANFAR Science Portal (1.0.0)`

UI for accessing and managing JupyterLab notebooks, Carta, Desktop and other interactive sessions that back onto CANFAR resources.

Platform Load information is available, including current CPU usage and counts of running instances.

## Description
This CANFAR service provides the ability to access and manage Jupyter notebook, desktop (vnc), and carta sessions that back
on to CANFAR resources. Using container images and current system resource values (context) provided by Skaha, you can
launch and manage sessions using the container image you select. Contextualization is provided for some session types 
allowing the amount of memory and number of cores you designate to be used to power your session. 

## Building
Dependencies for building are:
- Gradle 7.0 or later (8.0 or later recommended)
- JDK 11 or later (JDK 21 or later recommended)
- NodeJS 22.11 or later

## Endpoint locations
All endpoints require authentication with CANFAR, and authorization to access Skaha resource allocations.

### OIDC configuration
The Science Portal UI is now configurable to work with an OpenID Connect provider.  See the
`oidc` settings in the [org.opencadc.science-portal.properties](./org.opencadc.science-portal.properties) file.

### Science Portal URL
https://www.canfar.net/science-portal

### Skaha Web Service
Skaha provides Science Portal with access to supported session types (Jupyter notebooks, desktop (vnc) and carta)
More information can be found in the swagger docs: https://ws-uv.canfar.net/skaha

## CANFAR Science Portal Workflows
All workflows assume you are logged in with a CADC account


### Connecting to existing sessions

1) From the main page: https://www.canfar.net/science-portal
2) Science Portal will display any sessions you currently have, including
session metadata
3) Clicking on a session card will connect to and forward you to the session


### Launch a new session

1) From the main page: https://www.canfar.net/science-portal
2) Science Portal will poll for and display any sessions you currently have
3) After the form has loaded, scroll down to access 
4) Select the type of session you want to launch (default is 'notebook')
5) The container image list will be updated for the session type
6) Optionally change the name of the session, and any available context values
(ie memory or # of cores) 
7) Select 'Launch'
8) Science Portal will request the session be started 
9) The new session wil be added to the list at the top of the page


### Delete an existing session

1) From the main page: https://www.canfar.net/science-portal
2) Science Portal will display any sessions you currently have
3) Clicking on the trash can icon on a session card will bring
up a confirmation box
4) Continue to delete or cancel
5) Science Portal will request the session be deleted, and will remove it
from your session list


### Renew time frame of an existing session

1) From the main page: https://www.canfar.net/science-portal
2) Science Portal will display any sessions you currently have
3) Click on the clock icon on a session card
4) Science Portal will request the session time frame be renewed
(as of v 3.1 (Feb 2023) this is a 4 day extension from the time the request
is submitted.)
5) Session metadata will be refreshed on the portal


### View and Refresh Platform Load

1) From the main page: https://www.canfar.net/science-portal
2) The lower right panel (or last panel in mobile mode) displays Platform Load information
3) In the header, click the refresh button to refresh values
4) A date stamp in lower right of the panel indicates the time of the last refresh


### View Session Logs and Events

1) From the main page: https://www.canfar.net/science-portal
2) In the 'Active Sessions' panel, each Session Card has buttons for events (flag) and logs (file)
3) Click on either button
4) A new tab is opened displaying the output from the Skaha service with available event list 
or logs displayed
