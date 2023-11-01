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

package org.opencadc.scienceportal;

import ca.nrc.cadc.auth.AuthMethod;
import ca.nrc.cadc.auth.AuthenticationUtil;
import ca.nrc.cadc.auth.AuthorizationToken;
import ca.nrc.cadc.auth.AuthorizationTokenPrincipal;
import ca.nrc.cadc.auth.SSOCookieManager;
import ca.nrc.cadc.rest.InlineContentHandler;
import ca.nrc.cadc.rest.RestAction;
import ca.nrc.cadc.util.StringUtil;

import javax.security.auth.Subject;
import java.net.URI;
import java.util.Arrays;
import java.util.Collections;

/**
 * Base class to support storing the OIDC Access Token in a cookie.
 * This should be replaced with a (<a href="https://bff-patterns.com/patterns/api-token-handler">BFF</a>), but this
 * will suffice for the time being.
 * <p></p>
 * The Subject generated by this class ONLY deals in Tokens.  All other Principals will be ignored.
 * TODO: Revisit this!
 * TODO: jenkinsd 2023.10.20
 */
public abstract class SciencePortalAuthAction extends RestAction {
    public static final String FIRST_PARTY_COOKIE_NAME = "oidc_access_token";

    protected Subject getCurrentSubject() {
        final String rawCookieHeader = this.syncInput.getHeader("cookie");
        final Subject subject = AuthenticationUtil.getCurrentSubject();

        if (StringUtil.hasText(rawCookieHeader)) {
            final String[] firstPartyCookies =
                    Arrays.stream(rawCookieHeader.split(";"))
                          .filter(cookieString -> cookieString.startsWith(
                                  SciencePortalAuthAction.FIRST_PARTY_COOKIE_NAME) ||
                                                  cookieString.startsWith(SSOCookieManager.DEFAULT_SSO_COOKIE_NAME))
                          .toArray(String[]::new);

            if (firstPartyCookies.length > 0) {
                Arrays.stream(firstPartyCookies).forEach(cookie -> {
                    // Only split on the first "=" symbol, and trim any wrapping double quotes
                    final String cookieValue = cookie.split("=", 2)[1].replaceAll("\"", "");

                    subject.getPrincipals().add(new AuthorizationTokenPrincipal(AuthenticationUtil.AUTHORIZATION_HEADER,
                                                                                AuthenticationUtil.CHALLENGE_TYPE_BEARER
                                                                                + " " + cookieValue));
                    subject.getPublicCredentials().add(
                            new AuthorizationToken(AuthenticationUtil.CHALLENGE_TYPE_BEARER, cookieValue,
                                                   Collections.singletonList(
                                                           URI.create(syncInput.getRequestURI()).getHost())));
                });

                if (!subject.getPrincipals(AuthorizationTokenPrincipal.class).isEmpty()) {
                    // Ensure it's clean first.
                    subject.getPublicCredentials(AuthMethod.class)
                           .forEach(authMethod -> subject.getPublicCredentials().remove(authMethod));
                    subject.getPublicCredentials().add(AuthMethod.TOKEN);
                }
            }
        }

        return subject;
    }

    @Override
    protected InlineContentHandler getInlineContentHandler() {
        return null;
    }
}
