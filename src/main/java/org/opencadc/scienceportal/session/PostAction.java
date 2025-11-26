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

package org.opencadc.scienceportal.session;

import ca.nrc.cadc.auth.AuthMethod;
import ca.nrc.cadc.net.HttpPost;
import ca.nrc.cadc.reg.Standards;
import ca.nrc.cadc.reg.client.RegistryClient;
import ca.nrc.cadc.rest.SyncInput;
import ca.nrc.cadc.util.Base64;
import ca.nrc.cadc.util.StringUtil;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.PrivilegedActionException;
import java.security.PrivilegedExceptionAction;
import java.util.Map;
import java.util.stream.Collectors;
import javax.security.auth.Subject;
import org.opencadc.scienceportal.ApplicationConfiguration;
import org.opencadc.scienceportal.SciencePortalAuthAction;

public class PostAction extends SciencePortalAuthAction {
    static final String SECRET_REQUEST_HEADER_NAME_TO_SKAHA = "x-skaha-registry-auth";
    static final String REPOSITORY_AUTH_SECRET_FROM_BROWSER = "x-repository-secret";
    static final String REPOSITORY_AUTH_USERNAME_FROM_BROWSER = "x-repository-username";

    PostAction(final SyncInput syncInput) {
        this.syncInput = syncInput;
    }

    /** Not used explicitly, but needs to be present for the reflection-based client. */
    public PostAction() {
        super();
    }

    @Override
    public void doAction() throws Exception {
        final URL apiURL = buildAPIURL();
        final Subject authenticatedUser = getCurrentSubject(apiURL);
        final HttpPost httpPost = createPostRequest(apiURL);

        try {
            Subject.doAs(authenticatedUser, (PrivilegedExceptionAction<?>) () -> {
                httpPost.prepare();
                write(httpPost.getInputStream());

                return null;
            });
        } catch (PrivilegedActionException privilegedActionException) {
            throw privilegedActionException.getException();
        }
    }

    HttpPost createPostRequest(final URL apiURL) {
        final Map<String, Object> payload = PostAction.collectPayload(this.syncInput);

        final HttpPost httpPost = new HttpPost(apiURL, payload, false);

        final String repositorySecret = syncInput.getHeader(PostAction.REPOSITORY_AUTH_SECRET_FROM_BROWSER);
        final String repositoryUsername = syncInput.getHeader(PostAction.REPOSITORY_AUTH_USERNAME_FROM_BROWSER);

        if (StringUtil.hasText(repositorySecret)) {
            if (StringUtil.hasText(repositoryUsername)) {
                httpPost.setRequestProperty(
                        PostAction.SECRET_REQUEST_HEADER_NAME_TO_SKAHA,
                        Base64.encodeString(repositoryUsername + ":" + repositorySecret));
            } else {
                throw new IllegalArgumentException("Secret specified but no username provided.");
            }
        } else if (StringUtil.hasText(repositoryUsername)) {
            throw new IllegalArgumentException("Username specified but no secret provided.");
        }

        return httpPost;
    }

    /**
     * Collects all parameters from the SyncInput into a Map, trimming whitespace. If the "gpus" parameter is present
     * and set to "0", it is excluded.
     *
     * @param syncInput A SyncInput object containing parameters.
     * @return Map of parameter names to their trimmed values. Never null.
     */
    static Map<String, Object> collectPayload(final SyncInput syncInput) {
        return syncInput.getParameterNames().stream()
                .filter(key ->
                        !key.equals("gpus") || !syncInput.getParameter(key).equals("0"))
                .collect(Collectors.toMap(
                        key -> key,
                        key -> syncInput.getParameter(key) == null
                                ? ""
                                : syncInput.getParameter(key).trim()));
    }

    URL buildAPIURL() throws MalformedURLException {
        final StringBuilder apiURLBuilder =
                new StringBuilder(lookupAPIEndpoint().toExternalForm());

        // Preserve path items.
        final String path = this.syncInput.getPath();
        if (StringUtil.hasText(path)) {
            if (!path.trim().startsWith("/")) {
                apiURLBuilder.append("/");
            }

            apiURLBuilder.append(path);
        }

        return new URL(apiURLBuilder.toString());
    }

    URL lookupAPIEndpoint() {
        final ApplicationConfiguration applicationConfiguration = new ApplicationConfiguration();
        final URI apiServiceURI = URI.create(applicationConfiguration.getResourceID());
        final RegistryClient registryClient = new RegistryClient();
        return registryClient.getServiceURL(apiServiceURI, Standards.PLATFORM_SESSION_1, AuthMethod.TOKEN);
    }

    void write(final InputStream inputStream) throws IOException {
        final BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        String line;
        while ((line = reader.readLine()) != null) {
            this.syncOutput.getOutputStream().write(line.getBytes(StandardCharsets.UTF_8));
        }
        this.syncOutput.getOutputStream().flush();
    }
}
