package org.opencadc.scienceportal;

import org.apache.commons.configuration2.Configuration;
import org.junit.Assert;
import org.junit.Test;

public class ApplicationConfigurationTest {
    @Test
    public void testExperimentalFeatures() {
        final Configuration props = new org.apache.commons.configuration2.PropertiesConfiguration();
        props.setProperty(ApplicationConfiguration.ExperimentalFeatures.NAMESPACE + ".goodfeature.enabled", "true");
        props.setProperty(ApplicationConfiguration.ExperimentalFeatures.NAMESPACE + ".foo", "true");
        props.setProperty("some.bogus.namespace.experimental.feat", "true");

        final ApplicationConfiguration config = new ApplicationConfiguration(props);
        final ApplicationConfiguration.ExperimentalFeatures experimentalFeatures = config.getExperimentalFeatures();
        Assert.assertThrows(
                "Feature is missing.",
                IllegalArgumentException.class,
                () -> experimentalFeatures.isFeatureEnabled("bar"));
        Assert.assertThrows(
                "Feature is missing.",
                IllegalArgumentException.class,
                () -> experimentalFeatures.isFeatureEnabled("feat"));
        Assert.assertFalse("Feature is missing enabled keyword.", experimentalFeatures.isFeatureEnabled("foo"));
        Assert.assertTrue("Feature is enabled.", experimentalFeatures.isFeatureEnabled("goodfeature"));
    }
}
