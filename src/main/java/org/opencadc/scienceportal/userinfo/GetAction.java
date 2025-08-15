/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2023.                            (c) 2023.
 *  Government of Canada                 Gouvernement du Canada
 *  National Research Council            Conseil national de recherches
 *  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
 *  All rights reserved                  Tous droits réservés
 *
 *  NRC disclaims any warranties,        Le CNRC dénie toute garantie
 *  expressed, implied, or               énoncée, implicite ou légale,
 *  statutory, of any kind with          de quelque nature que ce
 *  respect to the software,             soit, concernant le logiciel,
 *  including without limitation         y compris sans restriction
 *  any warranty of merchantability      toute garantie de valeur
 *  or fitness for a particular          marchande ou de pertinence
 *  purpose. NRC shall not be            pour un usage particulier.
 *  liable in any event for any          Le CNRC ne pourra en aucun cas
 *  damages, whether direct or           être tenu responsable de tout
 *  indirect, special or general,        dommage, direct ou indirect,
 *  consequential or incidental,         particulier ou général,
 *  arising from the use of the          accessoire ou fortuit, résultant
 *  software.  Neither the name          de l'utilisation du logiciel. Ni
 *  of the National Research             le nom du Conseil National de
 *  Council of Canada nor the            Recherches du Canada ni les noms
 *  names of its contributors may        de ses  participants ne peuvent
 *  be used to endorse or promote        être utilisés pour approuver ou
 *  products derived from this           promouvoir les produits dérivés
 *  software without specific prior      de ce logiciel sans autorisation
 *  written permission.                  préalable et particulière
 *                                       par écrit.
 *
 *  This file is part of the             Ce fichier fait partie du projet
 *  OpenCADC project.                    OpenCADC.
 *
 *  OpenCADC is free software:           OpenCADC est un logiciel libre ;
 *  you can redistribute it and/or       vous pouvez le redistribuer ou le
 *  modify it under the terms of         modifier suivant les termes de
 *  the GNU Affero General Public        la “GNU Affero General Public
 *  License as published by the          License” telle que publiée
 *  Free Software Foundation,            par la Free Software Foundation
 *  either version 3 of the              : soit la version 3 de cette
 *  License, or (at your option)         licence, soit (à votre gré)
 *  any later version.                   toute version ultérieure.
 *
 *  OpenCADC is distributed in the       OpenCADC est distribué
 *  hope that it will be useful,         dans l’espoir qu’il vous
 *  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
 *  without even the implied             GARANTIE : sans même la garantie
 *  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
 *  or FITNESS FOR A PARTICULAR          ni d’ADÉQUATION À UN OBJECTIF
 *  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
 *  General Public License for           Générale Publique GNU Affero
 *  more details.                        pour plus de détails.
 *
 *  You should have received             Vous devriez avoir reçu une
 *  a copy of the GNU Affero             copie de la Licence Générale
 *  General Public License along         Publique GNU Affero avec
 *  with OpenCADC.  If not, see          OpenCADC ; si ce n’est
 *  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
 *                                       <http://www.gnu.org/licenses/>.
 *
 *
 ************************************************************************
 */

package org.opencadc.scienceportal.userinfo;

import ca.nrc.cadc.auth.AuthMethod;
import ca.nrc.cadc.auth.AuthenticationUtil;
import ca.nrc.cadc.auth.NotAuthenticatedException;
import ca.nrc.cadc.net.HttpGet;
import ca.nrc.cadc.reg.Standards;
import ca.nrc.cadc.reg.client.RegistryClient;
import java.io.IOException;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.PrivilegedExceptionAction;
import javax.security.auth.Subject;
import javax.servlet.http.HttpServletResponse;
import org.json.JSONObject;
import org.opencadc.scienceportal.ApplicationConfiguration;
import org.opencadc.scienceportal.SciencePortalAuthAction;

public class GetAction extends SciencePortalAuthAction {
    @Override
    public void doAction() throws Exception {
        final URL sessionsURL = getSessionsURL();
        final Subject subjectFromCookie = getCurrentSubject(sessionsURL);
        Subject.doAs(subjectFromCookie, (PrivilegedExceptionAction<?>) () -> {
            try {
                final HttpGet sessionAccessCheck = new HttpGet(sessionsURL, true);
                sessionAccessCheck.run();

                final Throwable getError = sessionAccessCheck.getThrowable();
                if (getError instanceof NotAuthenticatedException) {
                    syncOutput.setCode(HttpServletResponse.SC_UNAUTHORIZED);
                } else {
                    syncOutput.setHeader("content-type", "application/json");
                    final JSONObject jsonObject = new JSONObject();
                    final Subject validatedSubject = AuthenticationUtil.validateSubject(subjectFromCookie);
                    jsonObject.put(
                            "name", AuthenticationUtil.getIdentityManager().toDisplayString(validatedSubject));
                    syncOutput.getOutputStream().write(jsonObject.toString().getBytes(StandardCharsets.UTF_8));
                    syncOutput.getOutputStream().flush();
                }
            } catch (RuntimeException runtimeException) {
                // The Skaha API throws a RuntimeException when looking up the capabilities with an old Token.
                if ((runtimeException.getCause() instanceof IOException)
                        && (runtimeException.getCause().getCause() instanceof NotAuthenticatedException)) {
                    syncOutput.setCode(HttpServletResponse.SC_UNAUTHORIZED);
                    return null;
                }
                throw runtimeException;
            } catch (IOException exception) {
                // Bad service configuration
                syncOutput.setCode(HttpServletResponse.SC_NOT_IMPLEMENTED);
                syncOutput.getOutputStream().write(exception.getMessage().getBytes(StandardCharsets.UTF_8));
                syncOutput.getOutputStream().flush();
            }

            return null;
        });
    }

    private URL getSessionsURL() throws IOException {
        final ApplicationConfiguration applicationConfiguration = new ApplicationConfiguration();
        final URI apiServiceURI = URI.create(applicationConfiguration.getResourceID());
        final RegistryClient registryClient = new RegistryClient();
        final URL registryServiceBaseURL =
                registryClient.getServiceURL(apiServiceURI, Standards.PLATFORM_SESSION_1, AuthMethod.TOKEN);
        if (registryServiceBaseURL == null) {
            throw new IOException("The Skaha web service is not configured in the Registry.  Please ensure that "
                    + apiServiceURI + " exists.");
        }

        return new URL(registryServiceBaseURL.toExternalForm() + "/session");
    }
}
