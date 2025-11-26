package org.opencadc.scienceportal.session;

import ca.nrc.cadc.net.HttpPost;
import ca.nrc.cadc.net.HttpRequestProperty;
import ca.nrc.cadc.rest.SyncInput;
import ca.nrc.cadc.util.Base64;
import java.net.URL;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.Assert;
import org.junit.Test;
import org.mockito.Mockito;

public class PostActionTest {
    @Test
    public void createPostRequestMissingUsername() throws Exception {
        final SyncInput mockSyncInput = Mockito.mock(SyncInput.class);

        Mockito.when(mockSyncInput.getHeader(PostAction.REPOSITORY_AUTH_SECRET_FROM_BROWSER))
                .thenReturn("mysecret");
        Mockito.when(mockSyncInput.getHeader(PostAction.REPOSITORY_AUTH_USERNAME_FROM_BROWSER))
                .thenReturn(null);
        final Set<String> parameterNames = new HashSet<>();

        parameterNames.add("param1");

        Mockito.when(mockSyncInput.getParameterNames()).thenReturn(parameterNames);
        Mockito.when(mockSyncInput.getParameter("param1")).thenReturn("value1");

        final PostAction testSubject = new PostAction(mockSyncInput);
        final URL postURL = new URL("https://example.org/skaha/session-endpoint");

        try {
            testSubject.createPostRequest(postURL);
            Assert.fail("Should throw an IllegalArgumentException");
        } catch (IllegalArgumentException illegalArgumentException) {
            Assert.assertEquals(
                    "Wrong exception message",
                    "Secret specified but no username provided.",
                    illegalArgumentException.getMessage());
        }

        Mockito.verify(mockSyncInput, Mockito.times(1)).getParameterNames();
        Mockito.verify(mockSyncInput, Mockito.times(2)).getParameter("param1");
    }

    @Test
    public void createPostRequestMissingSecret() throws Exception {
        final SyncInput mockSyncInput = Mockito.mock(SyncInput.class);

        Mockito.when(mockSyncInput.getHeader(PostAction.REPOSITORY_AUTH_SECRET_FROM_BROWSER))
                .thenReturn(null);
        Mockito.when(mockSyncInput.getHeader(PostAction.REPOSITORY_AUTH_USERNAME_FROM_BROWSER))
                .thenReturn("username1");
        final Set<String> parameterNames = new HashSet<>();

        parameterNames.add("param1");

        Mockito.when(mockSyncInput.getParameterNames()).thenReturn(parameterNames);
        Mockito.when(mockSyncInput.getParameter("param1")).thenReturn("value1");

        final PostAction testSubject = new PostAction(mockSyncInput);
        final URL postURL = new URL("https://example.org/skaha/session-endpoint");

        try {
            testSubject.createPostRequest(postURL);
            Assert.fail("Should throw an IllegalArgumentException");
        } catch (IllegalArgumentException illegalArgumentException) {
            Assert.assertEquals(
                    "Wrong exception message",
                    "Username specified but no secret provided.",
                    illegalArgumentException.getMessage());
        }

        Mockito.verify(mockSyncInput, Mockito.times(1)).getParameterNames();
        Mockito.verify(mockSyncInput, Mockito.times(2)).getParameter("param1");
    }

    @Test
    public void createPostRequestPrivate() throws Exception {
        final SyncInput mockSyncInput = Mockito.mock(SyncInput.class);

        Mockito.when(mockSyncInput.getHeader(PostAction.REPOSITORY_AUTH_SECRET_FROM_BROWSER))
                .thenReturn("secret1");
        Mockito.when(mockSyncInput.getHeader(PostAction.REPOSITORY_AUTH_USERNAME_FROM_BROWSER))
                .thenReturn("username1");
        final Set<String> parameterNames = new HashSet<>();

        parameterNames.add("param1");
        parameterNames.add("param2");

        Mockito.when(mockSyncInput.getParameterNames()).thenReturn(parameterNames);
        Mockito.when(mockSyncInput.getParameter("param1")).thenReturn("val ue1");
        Mockito.when(mockSyncInput.getParameter("param2")).thenReturn(" value2 ");

        final URL postURL = new URL("https://example.org/skaha/session-endpoint");
        final PostAction testSubject = new PostAction(mockSyncInput) {
            @Override
            URL lookupAPIEndpoint() {
                return postURL;
            }
        };

        final HttpPost httpPost = testSubject.createPostRequest(postURL);

        final Map<String, Object> postParameters = httpPost.getParameterMap();
        Assert.assertEquals("Wrong number of params.", 2, postParameters.size());
        Assert.assertTrue("Wrong param1", postParameters.containsKey("param1"));
        Assert.assertEquals("Wrong value1", "val ue1", postParameters.get("param1"));
        Assert.assertTrue("Wrong param2", postParameters.containsKey("param2"));
        Assert.assertEquals("Wrong value2", "value2", postParameters.get("param2"));

        final List<HttpRequestProperty> postProperties = httpPost.getRequestProperties();
        Assert.assertEquals(
                "Wrong auth header",
                PostAction.SECRET_REQUEST_HEADER_NAME_TO_SKAHA,
                postProperties.get(0).getProperty());
        Assert.assertEquals(
                "Wrong auth header value",
                Base64.encodeString("username1:secret1"),
                postProperties.get(0).getValue());

        Mockito.verify(mockSyncInput, Mockito.times(1)).getParameterNames();
        Mockito.verify(mockSyncInput, Mockito.times(2)).getParameter("param1");
        Mockito.verify(mockSyncInput, Mockito.times(2)).getParameter("param2");
    }

    @Test
    public void buildAPIURL() throws Exception {
        final SyncInput mockSyncInput = Mockito.mock(SyncInput.class);
        final URL apiEndpoint = new URL("https://example.org/skaha/session-endpoint");
        final PostAction testSubject = new PostAction(mockSyncInput) {
            @Override
            URL lookupAPIEndpoint() {
                return apiEndpoint;
            }
        };

        Mockito.when(mockSyncInput.getPath()).thenReturn("/version1/endpoint");

        final URL apiURL = testSubject.buildAPIURL();
        Assert.assertEquals("Wrong API URL", apiEndpoint + "/version1/endpoint", apiURL.toExternalForm());

        Mockito.verify(mockSyncInput, Mockito.times(1)).getPath();
    }

    @Test
    public void collectPayloadFilter() {
        final Set<String> parameterNames = new HashSet<>();
        parameterNames.add("param1");
        parameterNames.add("gpus");

        final SyncInput mockSyncInput = Mockito.mock(SyncInput.class);
        Mockito.when(mockSyncInput.getParameterNames()).thenReturn(parameterNames);
        Mockito.when(mockSyncInput.getParameter("param1")).thenReturn(" value1 ");
        Mockito.when(mockSyncInput.getParameter("gpus")).thenReturn("0");

        final Map<String, Object> payload = PostAction.collectPayload(mockSyncInput);
        Assert.assertEquals("Wrong number of payload items", 1, payload.size());
        Assert.assertTrue("Missing param1", payload.containsKey("param1"));
        Assert.assertEquals("Wrong param1 value", "value1", payload.get("param1"));
    }

    @Test
    public void collectPayloadPass() {
        final Set<String> parameterNames = new HashSet<>();
        parameterNames.add("param1");
        parameterNames.add("gpus");

        final SyncInput mockSyncInput = Mockito.mock(SyncInput.class);
        Mockito.when(mockSyncInput.getParameterNames()).thenReturn(parameterNames);
        Mockito.when(mockSyncInput.getParameter("param1")).thenReturn(" value1 ");
        Mockito.when(mockSyncInput.getParameter("gpus")).thenReturn("2");

        final Map<String, Object> payload = PostAction.collectPayload(mockSyncInput);
        Assert.assertEquals("Wrong number of payload items", 2, payload.size());
        Assert.assertTrue("Missing param1", payload.containsKey("param1"));
        Assert.assertEquals("Wrong param1 value", "value1", payload.get("param1"));
        Assert.assertTrue("Missing gpus", payload.containsKey("gpus"));
        Assert.assertEquals("Wrong gpus value", "2", payload.get("gpus"));
    }
}
