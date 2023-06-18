// Test config objects
// Use to point your local version of Science Portal to appropriate service locations
// Handy if for some reason you have to switch to point to production to test something,
// or in case lack of VPN access blocks getting to the rc registry.

const devtestSessionURLs = {
          'base': "https://rc-uv.canfar.net",
          'session': 'https://rc-uv.canfar.net/skaha/session',
          'context': 'https://rc-uv.canfar.net/skaha/context',
          'images': 'https://rc-uv.canfar.net/skaha/image',
          'authBaseURL': "https://rc-wwww.canfar.net/",
          'registryClient': "https://rc-ws.cadc-ccda.hia-iha.nrc-cnrc.gc.ca"
        }



const prodtestSessionURLs = {
  'base': "https://ws-uv.canfar.net",
  'session': 'https://ws-uv.canfar.net/skaha/session',
  'context': 'https://ws-uv.canfar.net/skaha/context',
  'images': 'https://ws-uv.canfar.net/skaha/image',
  'authBaseURL': "https://ws-wwww.canfar.net/",
  'registryClient': "https://ws.cadc-ccda.hia-iha.nrc-cnrc.gc.ca"
}


// Folder location (relative to root) of the js and json config files
// Needed so the sessiontype_map_en.json file can be found in science_portal_form.js, in order
// to load the session type map
// Value is set to 'dist' for production, in the file dist_config/sp_dist_config.js

contentBase = "dev"


// Advanced Test usage objects below this line -----------------------------

// Functions similar to these can be used to test individual REACT components and
// javascript behaviour after app startup
function testModal(message) {
  // window.SciencePortalApp is the reference to the React App
  launch_js.portalCore.setReactAppRef(window.SciencePortalApp)
  launch_js.portalCore.hideModal()
  launch_js.portalCore.setModal('Modal Test 1', 'Test data for modal showing spinner', true, true, true)
}



// Use structures similar to this to feed into the react app functions
// to test different types of data as needed.
// Useful if there's no VPN access to servers, so that development can
// still move forward.

// SESSION_DISPLAY_DATA is the type of structure passed in to
// App.js using updateSessionList().  It's a mix of information from skaha/session endpoint
// and references needed by the SessionItem objects to manage connect requests, deletes, etc.

const SESSION_DISPLAY_DATA = [
  {
    "name": "TEST notebook2",
    "id": "abcd1234",
    "image": "images-rc.canfar.net/alinga/jupyter:canucs.v1.2.2",
    "status": "Running",
    "type": "notebook",
    "RAM": "2G",
    "cores": "2 cores",
    "logo": "https://www.canfar.net/science-portal/images/jupyterLogo.jpg",
    "altText": "jupyter lab",
    "deleteHandler": handleDeleteSession,
    "connectHandler": handleConnectRequest,
    "startTime" : '2022-11-22T20:11:30Z'
  },
  {
    "name": "TEST carta",
    "id": "abcd1234",
    "image": "images-rc.canfar.net/skaha/carta:3.0",
    "status": "Pending",
    "type": "carta",
    "RAM": "2G",
    "cores": "2 cores",
    "logo": "https://www.canfar.net/science-portal/images/cartaLogo.png",
    "altText": "carta",
    "deleteHandler": handleDeleteSession,
    "connectHandler": handleConnectRequest,
    "startTime" : '2022-11-22T20:49:56Z'
  },
  {
    "name": "TEST notebook1",
    "id": "abcd1234",
    "image": "images-rc.canfar.net/alinga/jupyter:canucs.v1.2.2",
    "status": "Running",
    "type": "notebook",
    "RAM": "2G",
    "cores": "2 cores",
    "logo": "https://www.canfar.net/science-portal/images/jupyterLogo.jpg",
    "altText": "jupyter lab",
    "deleteHandler": handleDeleteSession,
    "connectHandler": handleConnectRequest,
    "startTime" : '2022-11-22T20:11:30Z'
  },
  {
    "name": "TEST headless",
    "id": "abcd1234",
    "image": "images-rc.canfar.net/skaha/carta:3.0",
    "status": "Running",
    "type": "headless",
    "RAM": "2G",
    "cores": "2 cores",
    "logo": "https://www.canfar.net/science-portal/images/fas_cube.png",
    "altText": "carta",
    "deleteHandler": handleDeleteSession,
    "connectHandler": handleConnectRequest,
    "startTime" : '2022-11-22T20:49:56Z'
  },
  {
    "name": "TEST vscode",
    "id": "abcd1234",
    "image": "images-rc.canfar.net/skaha/vscode-server:3.0",
    "status": "Running",
    "type": "headless",
    "RAM": "2G",
    "cores": "2 cores",
    "logo": "https://www.canfar.net/science-portal/images/vscode-server.png",
    "altText": "carta",
    "deleteHandler": handleDeleteSession,
    "connectHandler": handleConnectRequest,
    "startTime" : '2022-11-22T20:49:56Z'
  }
]

// Test functions that simulate data calls without making the ajax calls
// Use existing functions to get data from forms, etc., and construct the new
// lists - note these are included in the structure above

function handleDeleteSession(e) {
  // return session list object with that one removed
}

function handleConnectRequest(e) {
  // return new session list with the form data just selected? (that'd be complicated?)
  testModal("requested a session connect...")
}



// NOTE: this should match output from skaha/session, so may need to be updated.
// The idea is it would be set as a session list in science_portal_session.js,
// Consider this advanced test usage.
const testSessionList = [
  {
    "id": "pf6w8kup",
    "userid": "jeevesh",
    "image": "images.canfar.net/canucs/canucs:1.2.5",
    "type": "notebook",
    "status": "Pending",
    "name": "notebook22",
    "startTime": "2022-11-29T16:06:43Z",
    "connectURL": "https://ws-uv.canfar.net/session/notebook/pf6w8kup/lab/tree/arc/home/jeevesh?token=pf6w8kup",
    "requestedRAM": "1G",
    "requestedCPUCores": "1",
    "requestedGPUCores": "<none>",
    "coresInUse": "2m",
    "ramInUse": "90Mi"
  },
  {
    "id": "x0ef9clu",
    "userid": "jeevesh",
    "image": "images.canfar.net/skaha/desktop:1.0.2",
    "type": "desktop",
    "status": "Running",
    "name": "desktop1",
    "startTime": "2022-11-29T16:08:37Z",
    "connectURL": "https://ws-uv.canfar.net/session/desktop/x0ef9clu/?password=x0ef9clu&path=session/desktop/x0ef9clu/",
    "requestedRAM": "16G",
    "requestedCPUCores": "2",
    "requestedGPUCores": "<none>",
    "coresInUse": "561m",
    "ramInUse": "8Mi"
  },
  {
    "id": "pf6w8kup",
    "userid": "jeevesh",
    "image": "images.canfar.net/canucs/canucs:1.2.5",
    "type": "notebook",
    "status": "Running",
    "name": "notebook2",
    "startTime": "2022-11-29T16:06:43Z",
    "connectURL": "https://ws-uv.canfar.net/session/notebook/pf6w8kup/lab/tree/arc/home/jeevesh?token=pf6w8kup",
    "requestedRAM": "1G",
    "requestedCPUCores": "1",
    "requestedGPUCores": "<none>",
    "coresInUse": "2m",
    "ramInUse": "90Mi"
  },
  {
    "id": "pf6w8kup",
    "userid": "jeevesh",
    "image": "images.canfar.net/canucs/canucs:1.2.5",
    "type": "notebook",
    "status": "Pending",
    "name": "notebook2",
    "startTime": "2022-11-29T16:06:43Z",
    "connectURL": "https://ws-uv.canfar.net/session/notebook/pf6w8kup/lab/tree/arc/home/jeevesh?token=pf6w8kup",
    "requestedRAM": "1G",
    "requestedCPUCores": "1",
    "requestedGPUCores": "<none>",
    "coresInUse": "2m",
    "ramInUse": "90Mi"
  }
]

