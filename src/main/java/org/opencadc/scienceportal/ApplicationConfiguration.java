package org.opencadc.scienceportal;

import ca.nrc.cadc.auth.AuthMethod;
import ca.nrc.cadc.reg.Standards;
import ca.nrc.cadc.reg.client.LocalAuthority;
import ca.nrc.cadc.reg.client.RegistryClient;
import ca.nrc.cadc.util.StringUtil;
import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import java.net.URI;
import java.net.URL;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;
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
    private static final String CONFIG_FILE_PATH =
            System.getProperty("user.home") + "/config/org.opencadc.science-portal.properties";
    private static final Logger LOGGER = Logger.getLogger(ApplicationConfiguration.class);
    private final Configuration configuration;

    public ApplicationConfiguration() {
        final CombinedConfiguration combinedConfiguration = new CombinedConfiguration(new MergeCombiner());

        // Prefer System properties.
        combinedConfiguration.addConfiguration(new SystemConfiguration());

        final Parameters parameters = new Parameters();
        final FileBasedConfigurationBuilder<PropertiesConfiguration> builder = new FileBasedConfigurationBuilder<>(
                        PropertiesConfiguration.class)
                .configure(parameters.properties().setFileName(ApplicationConfiguration.CONFIG_FILE_PATH));

        try {
            combinedConfiguration.addConfiguration(builder.getConfiguration());
        } catch (ConfigurationException exception) {
            LOGGER.warn(String.format(
                    "No configuration found at %s.\nUsing defaults.", ApplicationConfiguration.CONFIG_FILE_PATH));
        }

        this.configuration = combinedConfiguration;
    }

    /**
     * Create an ApplicationConfiguration from a given PropertiesConfiguration. Mainly for testing.
     *
     * @param configuration Configuration to use.
     */
    ApplicationConfiguration(final Configuration configuration) {
        this.configuration = configuration;
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
     * Expected that the configuration is a forward slash list of tab labels. <a
     * href="https://commons.apache.org/proper/commons-configuration/userguide/howto_basicfeatures.html">Apache
     * Configuration reference</a>
     *
     * @return String array, never null.
     */
    public String[] getTabLabels() {
        final String[] tabLabelArray = Arrays.stream(configuration
                        .getString(ConfigurationKey.TAB_LABELS.propertyName)
                        .split(","))
                .map(String::trim)
                .toArray(String[]::new);
        if (tabLabelArray.length == 0) {
            throw new IllegalStateException("Configuration property " + ConfigurationKey.TAB_LABELS.propertyName
                    + " is missing" + ApplicationConfiguration.CONFIG_FILE_PATH);
        }

        return tabLabelArray;
    }

    /**
     * Pull the /applications header URLs.
     *
     * @return JSONObject of header URIs to URLs.
     */
    public JSONObject getHeaderURLs() {
        final RegistryClient registryClient = new RegistryClient();
        final JSONObject jsonObject = new JSONObject();

        Arrays.stream(ApplicationStandards.values()).forEach(applicationStandard -> {
            try {
                jsonObject.put(
                        applicationStandard.standardID.toString(),
                        registryClient.getAccessURL(RegistryClient.Query.APPLICATIONS, applicationStandard.standardID));
            } catch (Exception e) {
                LOGGER.warn("Unable to get Applications URL for " + applicationStandard.standardID, e);
            }
        });

        final LocalAuthority localAuthority = new LocalAuthority();
        try {
            final Set<URI> credEndpoints = localAuthority.getResourceIDs(Standards.CRED_PROXY_10);
            if (!credEndpoints.isEmpty()) {
                final URI credServiceID = credEndpoints.stream().findFirst().orElseThrow(IllegalStateException::new);
                final URL credServiceURL =
                        registryClient.getServiceURL(credServiceID, Standards.CRED_PROXY_10, AuthMethod.CERT);

                if (credServiceURL != null) {
                    jsonObject.put("ivo://cadc.nrc.ca/cred", credServiceURL.toExternalForm());
                }
            }
        } catch (NoSuchElementException noSuchElementException) {
            LOGGER.debug("Not using proxy certificates.  Skipping menu addition.");
        }

        return jsonObject;
    }

    String getStringValue(final String key, final boolean required) {
        final String val = this.configuration.getString(key);

        if (required && !StringUtil.hasText(val)) {
            throw new IllegalStateException("Configuration property " + key + " is missing or invalid at "
                    + ApplicationConfiguration.CONFIG_FILE_PATH);
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

    /**
     * Get the default project name for the pull-down menu from configuration.
     *
     * @return Default project name, never null.
     */
    @NotNull public String getDefaultProjectName() {
        return getStringValue(ConfigurationKey.DEFAULT_PROJECT_NAME);
    }

    public ExperimentalFeatures getExperimentalFeatures() {
        return ExperimentalFeatures.fromConfiguration(this.configuration);
    }

    /**
     * Returns the URL to the storage XML info service. Return an empty string if not configured to conform to the
     * JavaScript this value will be injected into.
     *
     * @return String URL to the storage XML info service, or an empty string if not configured. Never null.
     */
    public String getStorageXmlInfoUrl() {
        final String configuredStorageHomeURL = getStringValue(ConfigurationKey.STORAGE_XML_INFO_URL);
        return StringUtil.hasText(configuredStorageHomeURL) ? configuredStorageHomeURL : "";
    }

    public boolean isOIDCConfigured() {
        return StringUtil.hasText(getOIDCClientID())
                && StringUtil.hasText(getOIDCClientSecret())
                && StringUtil.hasText(getOIDCCallbackURI())
                && StringUtil.hasText(getOIDCScope())
                && StringUtil.hasText(getTokenCacheURLString());
    }

    public Client getOIDCClient() throws IOException {
        return new Client(
                getOIDCClientID(),
                getOIDCClientSecret(),
                new URL(getOIDCCallbackURI()),
                new URL(getOIDCRedirectURI()),
                getOIDCScope().split(" "),
                getTokenCacheURLString());
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
        TAB_LABELS("org.opencadc.science-portal.tabLabels", true),
        SESSIONS_STANDARD_ID("org.opencadc.science-portal.sessions.standard", true),
        SESSIONS_RESOURCE_ID("org.opencadc.science-portal.sessions.resourceID", true),
        BANNER_TEXT("org.opencadc.science-portal.sessions.bannerText", false),
        TOKEN_CACHE_URL("org.opencadc.science-portal.tokenCache.url", false),
        OIDC_CLIENT_ID("org.opencadc.science-portal.oidc.clientID", false),
        OIDC_CLIENT_SECRET("org.opencadc.science-portal.oidc.clientSecret", false),
        OIDC_REDIRECT_URI("org.opencadc.science-portal.oidc.redirectURI", false),
        OIDC_CALLBACK_URI("org.opencadc.science-portal.oidc.callbackURI", false),
        OIDC_SCOPE("org.opencadc.science-portal.oidc.scope", false),
        STORAGE_XML_INFO_URL("org.opencadc.science-portal.storageXmlInfoUrl", false),
        DEFAULT_PROJECT_NAME("org.opencadc.science-portal.defaultProjectName", false);

        private final String propertyName;
        private final boolean required;

        ConfigurationKey(String propertyName, boolean required) {
            this.propertyName = propertyName;
            this.required = required;
        }
    }

    /**
     * Experimental features that can be toggled on/off via configuration. These are unreleased features behind a
     * feature flag in the "org.opencadc.science-portal.experimental" namespace.
     */
    public static class ExperimentalFeatures {
        static final String NAMESPACE = "org.opencadc.science-portal.experimental";

        private final Map<String, Boolean> featureGates = new HashMap<>();

        public String toJSONString() {
            final JSONObject jsonObject = new JSONObject();
            this.featureGates.forEach(jsonObject::put);
            return jsonObject.toString();
        }

        public boolean isFeatureEnabled(String featureName) {
            if (this.featureGates.containsKey(featureName)) {
                return this.featureGates.get(featureName);
            } else {
                throw new IllegalArgumentException("Unknown experimental feature: " + featureName);
            }
        }

        private static ExperimentalFeatures fromConfiguration(final Configuration configuration) {
            final Map<String, Boolean> configuredFeatureGates = new HashMap<>();
            Objects.requireNonNullElse(
                            configuration.getKeys(ExperimentalFeatures.NAMESPACE, "."),
                            Collections.<String>emptyIterator())
                    .forEachRemaining(gate -> {
                        if (StringUtil.hasText(gate)) {
                            final String gateConfig =
                                    gate.substring((ExperimentalFeatures.NAMESPACE + "\\.").length() - 1);
                            if (!gateConfig.isEmpty()) {
                                final String[] gateConfigItems = gateConfig.split("\\.");
                                if (gateConfigItems.length > 0) {
                                    final String gateName = gateConfigItems[0];
                                    if (gateConfigItems.length > 1) {
                                        final boolean enabled = configuration.getBoolean(gate, false);
                                        configuredFeatureGates.put(gateName, enabled);
                                    } else {
                                        LOGGER.warn(
                                                "Experimental feature gate missing enabled/disabled entry -> " + gate);
                                        configuredFeatureGates.put(gateName, false);
                                    }
                                } else {
                                    LOGGER.warn("Experimental feature gate entry found -> " + gate);
                                }
                            } else {
                                LOGGER.warn("Empty experimental feature gate found in configuration -> " + gate);
                            }
                        }
                    });
            return new ExperimentalFeatures(configuredFeatureGates);
        }

        private ExperimentalFeatures(final Map<String, Boolean> configuredFeatureGates) {
            Objects.requireNonNull(configuredFeatureGates, "configuredFeatureGates cannot be null");
            this.featureGates.putAll(configuredFeatureGates);
        }
    }
}
