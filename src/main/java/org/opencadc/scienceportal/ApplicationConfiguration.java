package org.opencadc.scienceportal;


import ca.nrc.cadc.reg.client.RegistryClient;
import ca.nrc.cadc.util.StringUtil;

import java.io.IOException;
import java.net.URI;
import java.net.URL;
import java.util.Arrays;
import java.util.Date;

import org.apache.commons.configuration2.CombinedConfiguration;
import org.apache.commons.configuration2.Configuration;
import org.apache.commons.configuration2.PropertiesConfiguration;
import org.apache.commons.configuration2.SystemConfiguration;
import org.apache.commons.configuration2.builder.FileBasedConfigurationBuilder;
import org.apache.commons.configuration2.builder.fluent.Parameters;
import org.apache.commons.configuration2.ex.ConfigurationException;
import org.apache.commons.configuration2.tree.MergeCombiner;
import org.apache.log4j.Logger;
import org.json.JSONObject;
import org.opencadc.token.Client;


public class ApplicationConfiguration {

    // Included in the JSP
    public static final long BUILD_TIME_MS = new Date().getTime();

    public static final String FIRST_PARTY_COOKIE_NAME = "__Host-science-portal-auth";

    private static final Logger LOGGER = Logger.getLogger(ApplicationConfiguration.class);

    public static final String DEFAULT_CONFIG_FILE_PATH = System.getProperty("user.home")
                                                          + "/config/org.opencadc.science-portal.properties";

    private final Configuration configuration;
    private final String filePath;


    public ApplicationConfiguration() {
        this.filePath = ApplicationConfiguration.DEFAULT_CONFIG_FILE_PATH;

        final CombinedConfiguration combinedConfiguration = new CombinedConfiguration(new MergeCombiner());

        // Prefer System properties.
        combinedConfiguration.addConfiguration(new SystemConfiguration());

        final Parameters parameters = new Parameters();
        final FileBasedConfigurationBuilder<PropertiesConfiguration> builder =
                new FileBasedConfigurationBuilder<>(PropertiesConfiguration.class)
                        .configure(parameters.properties().setFileName(filePath));

        try {
            combinedConfiguration.addConfiguration(builder.getConfiguration());
        } catch (ConfigurationException exception) {
            LOGGER.warn(String.format("No configuration found at %s.\nUsing defaults.", filePath));
        }

        this.configuration = combinedConfiguration;
    }

    public String getResourceID() {
        return getStringValue(ConfigurationKey.SESSIONS_RESOURCE_ID);
    }

    public String getStandardID() {
        return getStringValue(ConfigurationKey.SESSIONS_STANDARD_ID);
    }

    public String getBannerMessage() {
        return getStringValue(ConfigurationKey.BANNER_TEXT);
    }

    public String getThemeName() {
        return getStringValue(ConfigurationKey.THEME_NAME);
    }

    public String getTokenCacheURLString() {
        return getStringValue(ConfigurationKey.TOKEN_CACHE_URL);
    }

    /**
     * Pull the /applications header URLs.
     * @return  JSONObject of header URIs to URLs.
     */
    public JSONObject getHeaderURLs() {
        final RegistryClient registryClient = new RegistryClient();
        final JSONObject jsonObject = new JSONObject();

        Arrays.stream(ApplicationStandards.values()).forEach(applicationStandard -> {
            try {
                jsonObject.put(applicationStandard.standardID.toString(),
                               registryClient.getAccessURL(RegistryClient.Query.APPLICATIONS,
                                                           applicationStandard.standardID));
            } catch (Exception e) {
                LOGGER.warn("Unable to get Applications URL for " + applicationStandard.standardID, e);
            }
        });

        return jsonObject;
    }

    String getStringValue(final String key, final boolean required) {
        final String val = this.configuration.getString(key);

        if (required && !StringUtil.hasText(val)) {
            throw new IllegalStateException("Configuration property " + key + " is missing or invalid at "
                                            + this.filePath);
        } else {
            return val;
        }
    }

    String getStringValue(final ConfigurationKey key) {
        return getStringValue(key.propertyName, key.required);
    }

    public String getOIDCClientID() {
        return getStringValue(ConfigurationKey.OIDC_CLIENT_ID);
    }

    public String getOIDCClientSecret() {
        return getStringValue(ConfigurationKey.OIDC_CLIENT_SECRET);
    }

    public String getOIDCCallbackURI() {
        return getStringValue(ConfigurationKey.OIDC_CALLBACK_URI);
    }

    public String getOIDCRedirectURI() {
        return getStringValue(ConfigurationKey.OIDC_REDIRECT_URI);
    }

    public String getOIDCScope() {
        return getStringValue(ConfigurationKey.OIDC_SCOPE);
    }

    public boolean isOIDCConfigured() {
        return StringUtil.hasText(getOIDCClientID()) && StringUtil.hasText(getOIDCClientSecret())
               && StringUtil.hasText(getOIDCCallbackURI()) && StringUtil.hasText(getOIDCScope())
               && StringUtil.hasText(getTokenCacheURLString());
    }

    public Client getOIDCClient() throws IOException {
        return new Client(getOIDCClientID(), getOIDCClientSecret(),
                          new URL(getOIDCCallbackURI()), new URL(getOIDCRedirectURI()),
                          getOIDCScope().split(" "), getTokenCacheURLString());
    }


    private enum ApplicationStandards {
        PASSWORD_CHANGE(URI.create("ivo://cadc.nrc.ca/passchg")),
        PASSWORD_RESET(URI.create("ivo://cadc.nrc.ca/passreset")),
        ACCOUNT_REQUEST(URI.create("ivo://cadc.nrc.ca/acctrequest")),
        ACCOUNT_UPDATE(URI.create("ivo://cadc.nrc.ca/acctupdate")),
        GMUI(URI.create("ivo://cadc.nrc.ca/groups")),
        SEARCH(URI.create("ivo://cadc.nrc.ca/search"));

        final URI standardID;

        ApplicationStandards(URI standardID) {
            this.standardID = standardID;
        }
    }

    private enum ConfigurationKey {
        THEME_NAME("org.opencadc.science-portal.themeName", true),
        SESSIONS_STANDARD_ID("org.opencadc.science-portal.sessions.standard", true),
        SESSIONS_RESOURCE_ID("org.opencadc.science-portal.sessions.resourceID", true),
        BANNER_TEXT("org.opencadc.science-portal.sessions.bannerText", false),
        TOKEN_CACHE_URL("org.opencadc.science-portal.tokenCache.url", false),
        OIDC_CLIENT_ID("org.opencadc.science-portal.oidc.clientID", false),
        OIDC_CLIENT_SECRET("org.opencadc.science-portal.oidc.clientSecret", false),
        OIDC_REDIRECT_URI("org.opencadc.science-portal.oidc.redirectURI", false),
        OIDC_CALLBACK_URI("org.opencadc.science-portal.oidc.callbackURI", false),
        OIDC_SCOPE("org.opencadc.science-portal.oidc.scope", false);

        private final String propertyName;
        private final boolean required;

        ConfigurationKey(String propertyName, boolean required) {
            this.propertyName = propertyName;
            this.required = required;
        }
    }
}
