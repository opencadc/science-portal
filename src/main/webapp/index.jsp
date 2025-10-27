<%@ page import="org.opencadc.scienceportal.ApplicationConfiguration" %>
<%@ page language="java" contentType="text/html; charset=UTF-8" session="false" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>


<%
  final ApplicationConfiguration configuration = new ApplicationConfiguration(); 
  final String sessionsResourceID = configuration.getResourceID();
  final String sessionsStandardID = configuration.getStandardID();
  final String themeName = configuration.getThemeName();
  final String[] tabLabels = configuration.getTabLabels();
  String bannerText = configuration.getBannerMessage();
  String headerURLJSON = configuration.getHeaderURLs().toString();
  String storageXmlInfoUrl = configuration.getStorageXmlInfoUrl();
  final String experimentalJSON = configuration.getExperimentalFeatures().toJSONString();

  if (bannerText == null) {
      bannerText = "";
  }
%>

<%-- Used to prevent JavaScript caching. --%>
<jsp:useBean id="current" class="java.util.Date" />
<c:set var="contextPath" value="${pageContext.request.contextPath}" />
<c:set var="buildVersion" value="<%= ApplicationConfiguration.BUILD_TIME_MS %>" scope="application" />

<!DOCTYPE html>
<html lang="en">

  <head>
    <meta charset='utf-8'>
    <meta http-equiv="X-UA-Compatible" content="chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta name="Pragma" content="no-cache" />
    <meta name="Expires" content="0" />

    <base href="${fn:substring(url, 0, fn:length(url) - fn:length(uri))}${req.contextPath}/" />

    <!-- Located in ROOT.war -->
    <script type="application/javascript" src="${contextPath}/dist/js/jquery-2.2.4.min.js"></script>

    <!-- Add Promises if missing/broken. -->
    <script type="application/javascript" src="${contextPath}/dist/js/es6-promise.auto.js"></script>

    <% if ("canfar".equals(themeName)) { %>
    <!-- Found in canfar-root: tomcat(-canfar)/webapps/ROOT unless an absolute URL -->
    <script type="text/javascript" src="https://www.canfar.net/cadcJS/javascript/cadc.registry-client.js"></script>
    <script type="text/javascript" src="https://www.canfar.net/cadcJS/javascript/org.opencadc.js"></script>
    <script type="text/javascript" src="https://www.canfar.net/cadcJS/javascript/cadc.uri.js"></script>
    <script type="text/javascript" src="https://www.canfar.net/cadcJS/javascript/cadc.user.js"></script>
    <script type="text/javascript" src="https://www.canfar.net/canfar/javascript/cadc.redirect.util.js"></script>

    <!-- Adding gdpr cookie banner -->
    <script type="text/javascript" src="https://www.canfar.net/cadcJS/javascript/cadc.gdpr.cookie.js"></script>
    <link  type="text/css" href="https://www.canfar.net/canfar/css/cadc.gdpr.cookie.css" rel="stylesheet" media="screen">
    <% } %>

    <!--[if lt IE 9]>
<!--        <script src="/html5shiv.googlecode.com/svn/trunk/html5.js"></script>-->
    <![endif]-->

    <title>Science Portal</title>
  </head>

  <body class="theme-<%= configuration.getThemeName() %>">
    <div class="container-fluid fill">
      <div class="row fill">
        <div role="main" class="col-sm-12 col-md-12 main fill">
          <div class="inner fill">
            <section id="main_content" class="fill">
              <%--  CANFAR React App loads here --%>
              <div class="science-portal-authenticated">
                <div id="sp_listnavbar" class="panel panel-default sp-panel">
                <div id="react-mountpoint"></div>
              <!-- Content ends -->
            </section>
          </div>
        </div>
      </div>
    </div>

    <%--local files ot pick up--%>
    <script type="application/javascript" src="${contextPath}/dist/js/science_portal_login.js?v=${buildVersion}"></script>
    <script type="application/javascript" src="${contextPath}/dist/js/science_portal_core.js?v=${buildVersion}"></script>
    <script type="application/javascript" src="${contextPath}/dist/js/science_portal_session.js?v=${buildVersion}"></script>
    <script type="application/javascript" src="${contextPath}/dist/js/science_portal_form.js?v=${buildVersion}"></script>
    <script type="application/javascript" src="${contextPath}/dist/js/science_portal.js?v=${buildVersion}"></script>
    <script type="application/javascript" src="${contextPath}/dist_config/sp_dist_config.js?v=${buildVersion}"></script>

    <script type="application/javascript">
      function generateState() {
        const length = 16
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
        let result = '';
        for (let i = length; i > 0; --i) {
          result += chars[Math.floor(Math.random() * chars.length)]
        }
        return result;
      }

      const tabLabelArray = [];
      <% for (int i = 0; i < tabLabels.length; i++) { %>
      tabLabelArray[<%= i %>] = "<%= tabLabels[i] %>";
      <% } %>

      window.runStartupTasks = () => {
        // Set up controller for Science Portal Session Launch page
        const launch_js = new cadc.web.science.portal.PortalApp({
          baseURL: window.location.origin,
          sessionsResourceID: '<%= sessionsResourceID %>',
          sessionsStandardID: '<%= sessionsStandardID %>',
          themeName: '<%= themeName %>',
          tabLabels: tabLabelArray,
          bannerText: '<%= bannerText %>',
          contentBase: "${contextPath}/dist",
          headerURLs: JSON.parse('<%= headerURLJSON %>'),
          storageXmlInfoUrl: '<%= storageXmlInfoUrl %>',
          defaultProjectName: '<%= configuration.getDefaultProjectName() %>',
          experimentalFeatures: JSON.parse('<%= experimentalJSON %>')
        })

        launch_js.init()
      }
    </script>

    <%-- render the react app last - App.js's render cycle will call
      window.runStartupTasks() on completion. --%>
    <script src="${contextPath}/dist/react-app.js?v=${buildVersion}"></script>

  </body>
</html>
