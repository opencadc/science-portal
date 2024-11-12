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

    <!-- Include React dependencies first -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

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
                <div id="science-portal-root"></div>
              <!-- Content ends -->
            </section>
          </div>
        </div>
      </div>
    </div>


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

        // Set up controller for Science Portal Session Launch page
        const launchData = {
          baseURL: window.location.origin,
          sessionsResourceID: '<%= sessionsResourceID %>',
          sessionsStandardID: '<%= sessionsStandardID %>',
          themeName: '<%= themeName %>',
          tabLabels: tabLabelArray,
          bannerText: '<%= bannerText %>',
          contentBase: "${contextPath}/dist",
          headerURLs: JSON.parse('<%= headerURLJSON %>')
        }

      // Create a function to mount the app
      function mountSciencePortal() {
        if (window.SciencePortal && window.SciencePortal.mount) {
          window.SciencePortal.mount(
                  document.getElementById('science-portal-root'),
                  {
                    initialData: launchData,
                    config: {
                      environment: 'production',
                    }
                  }
          );
        } else {
          console.error('SciencePortal not loaded correctly');
        }
      }
    </script>

    <!-- Load React app last -->
    <script src="${contextPath}/dist/react-app.js?v=${buildVersion}"></script>

    <!-- Mount after React app is loaded -->
    <script>
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountSciencePortal);
      } else {
        mountSciencePortal();
      }
    </script>
    <%-- render the react app last - App.js's render cycle will call
      window.runStartupTasks() on completion. --%>

  </body>
</html>
