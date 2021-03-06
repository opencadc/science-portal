;(function($) {
  // register namespace
  $.extend(true, window, {
    cadc: {
      web: {
        science: {
          portal: {
            session: {
              PortalSession: PortalSession,
              // Events
              events: {
                onLoadSessionListDone: new jQuery.Event('sciPort:onLoadSessionListDone'),
                onLoadSessionListError: new jQuery.Event('sciPort:onLoadSessionListError'),
                onSessionDeleteOK: new jQuery.Event('sciPort:onSessionDeleteOK'),
                onSessionDeleteError: new jQuery.Event('sciPort:onSessionDeleteError'),
                onPollingContinue: new jQuery.Event('sciPort:onPollingContinue'),
              }
            }
          }
        }
      }
    }
  })


  /**
   * Class for handling Skaha session interaction and data
   * @constructor
   */
  function PortalSession() {
    var _selfPortalSess = this
    var _isEmpty = true
    this._sessionList = {}
    this.sessionURLs = {}

    function setServiceURLs(URLObject) {
      _selfPortalSess.sessionURLs = URLObject
    }

    function initSessionList() {
      _isEmpty = true
      _selfPortalSess._sessionList = {}
    }

    function getSessionList() {
      if (_selfPortalSess._sessionList === {}) {
        initSessionList()
      }
      return _selfPortalSess._sessionList
    }

    function getSessionByID(sessionID) {
      var session = null
      for (var i = 0; i < _selfPortalSess._sessionList.length; i++) {
        if (_selfPortalSess._sessionList[i].id == sessionID) {
          session = _selfPortalSess._sessionList[i]
        }
      }
      return session
    }

    function getSessionByNameType(sessionData) {
      var session = null
      for (var i = 0; i < _selfPortalSess._sessionList.length; i++) {
        if ((_selfPortalSess._sessionList[i].name == sessionData.name) &&
        (_selfPortalSess._sessionList[i].type == sessionData.type) ) {
          session = _selfPortalSess._sessionList[i]
        }
      }
      return session
    }

    /**
     * Check if session for sessionID is of the given status
     * @param sessionID
     * @param sessionStatus
     * @returns {boolean}
     */
    function isSessionStatusByID(sessionID, sessionStatus) {
      var isStatus = false
      if (sessionID != {}) {
        var session = _selfPortalSess.getSessionByID(sessionID)
        if (session != null) {
          if (session.status == sessionStatus){
            isStatus = true
          }
        }
      }
      return isStatus
    }

    function isRunningSession(session) {
      return isSessionStatus(session, 'Running')
    }

    /**
     * 'Stable' status means the session isn't going to change state unless the user
     * does something explicit, like deleting or shutting down.
     * @returns {boolean}
     */
    function isAllSessionsStable() {
      var allStable = true

      for (var i = 0; i < _selfPortalSess._sessionList.length; i++) {
        if ( (_selfPortalSess._sessionList[i].status !== 'Running') &&
          (_selfPortalSess._sessionList[i].status !== 'Succeeded') ) {
          allStable = false
          break
        }
      }
      return allStable
    }

    function isSessionStatus(session, sessionStatus) {
      return session.status === sessionStatus
    }

    /**
     * Build a default session name based on the session type and current count
     * of sessions
     * @param sessionType
     * @returns {*}
     */
    function getDefaultSessionName(sessionType) {
      // First entry will have a '1'
      var count = 1
      for (var i = 0; i < _selfPortalSess._sessionList.length; i++) {
        if (_selfPortalSess._sessionList[i].type === sessionType) {
          count++
        }
      }
      return sessionType + count
    }

    function setSessionList(sessionList) {
      if (sessionList.length > 0) {
        _selfPortalSess._sessionList = sessionList
        _selfPortalSess._isEmpty = false
      } else {
        _selfPortalSess._sessionList = {}
        _selfPortalSess._isEmpty = true
      }
    }

    function isSessionListEmpty() {
      return _selfPortalSess._isEmpty
    }

    /**
     * Run this on page load to see if there's something to start up.
    */
    function loadSessionList() {
      Promise.resolve(getSessionListAjax(_selfPortalSess.sessionURLs.session, {}))
        .then(function(sessionList) {

          setSessionList(sessionList)
          trigger(_selfPortalSess, cadc.web.science.portal.session.events.onLoadSessionListDone)

        })
        .catch(function(message) {
          // get session list failed in a way that can't allow page to continue
          trigger(_selfPortalSess, cadc.web.science.portal.session.events.onLoadSessionListError, message)
        })
    }

    function getSessionListAjax(serviceURL, sessionData) {

      return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest()

        // 'load' is the XMLHttpRequest 'finished' event
        request.addEventListener(
          'load',
          function () {
            if (request.status === 200) {
              var jsonData = JSON.parse(request.responseText)
              resolve(jsonData)
            } else {
              reject(request)
            }
          },
          false
        )
        // withCredentials enables cookies to be sent
        // Note: SameSite cookie header isn't set with this method,
        // may cause problems with Chrome and other browsers? Feb 2021
        request.withCredentials = true
        request.open('GET', serviceURL)
        request.send(null)
      })
    }

    function deleteSession(sessionID) {
      Promise.resolve(deleteSessionAjax(_selfPortalSess.sessionURLs.session + "/" + sessionID, sessionID))
        .then(function(sessionID) {
          trigger(_selfPortalSess, cadc.web.science.portal.session.events.onSessionDeleteOK, sessionID)
        })
        .catch(function(message) {
          // get session list failed in a way that can't allow page to continue
          trigger(_selfPortalSess, cadc.web.science.portal.session.events.onSessionDeleteError, message)
        })
    }

    function deleteSessionAjax(serviceURL, sessionID) {
      return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest()

        // 'load' is the XMLHttpRequest 'finished' event
        request.addEventListener(
          'load',
          function () {
            if (request.status === 200) {
              resolve(sessionID)
            } else {
              reject(request)
            }
          },
          false
        )
        // withCredentials enables cookies to be sent
        // Note: SameSite cookie header isn't set with this method,
        // may cause problems with Chrome and other browsers? Feb 2021
        request.withCredentials = true
        request.open('DELETE', serviceURL)
        request.send(null)
      })
    }

    function pollSessionList(interval) {
        // TODO: consider long-running timeout so panel left in background doesn't use
        // resources forever
        interval = interval || 200

        var checkCondition = function (resolve, reject) {
          getSessionListAjax(_selfPortalSess.sessionURLs.session)
            .then(function (sessionList) {
              _selfPortalSess.setSessionList(sessionList)
              if (_selfPortalSess.isAllSessionsStable()) {
                resolve("done")
              } else {
                // If neither of the conditions are met and the timeout
                // hasn't elapsed, go again
                // update info modal with current status?
                trigger(_selfPortalSess, cadc.web.science.portal.session.events.onPollingContinue)
                setTimeout(checkCondition, interval, resolve, reject)
              }
            })
            .catch(function (message) {
              reject(new Error('Error polling session list. Reload page to try again or contact CANFAR admin for assistance.'))
            })
        } // end checkCondition
        return new Promise(checkCondition)
    }

    // ---------- Event Handling Functions ----------

    function subscribe(target, event, eHandler) {
      $(target).on(event.type, eHandler)
    }

    function unsubscribe(target, event) {
      $(target).unbind(event.type)
    }

    function trigger(target, event, eventData) {
      $(target).trigger(event, eventData)
    }


    initSessionList()

      $.extend(this, {
        setServiceURLs: setServiceURLs,
        initSessionList: initSessionList,
        getDefaultSessionName: getDefaultSessionName,
        getSessionByID: getSessionByID,
        getSessionByNameType: getSessionByNameType,
        getSessionList: getSessionList,
        loadSessionList: loadSessionList,
        setSessionList: setSessionList,
        isAllSessionsStable: isAllSessionsStable,
        isSessionStatus: isSessionStatus,
        isRunningSession: isRunningSession,
        isSessionStatusByID: isSessionStatusByID,
        isSessionListEmpty : isSessionListEmpty,
        pollSessionList: pollSessionList,
        deleteSession: deleteSession,
      })
    }

})(jQuery)
