package io.castled.apps.connectors.restapi;

import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import io.castled.ObjectRegistry;
import io.castled.models.RestMethod;
import io.castled.models.TargetRestApiMapping;
import io.castled.utils.MustacheUtils;
import io.castled.utils.ResponseUtils;
import lombok.extern.slf4j.Slf4j;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.Invocation;
import javax.ws.rs.core.Response;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
public class RestApiTemplateClient {

    public static final String CONTENT_TYPE = "Content-Type";
    private final Client client;
    private final TargetRestApiMapping targetTemplateMapping;
    private final RestApiAppSyncConfig restApiAppSyncConfig;

    public RestApiTemplateClient(TargetRestApiMapping targetTemplateMapping, RestApiAppSyncConfig restApiAppSyncConfig) {
        this.client = ObjectRegistry.getInstance(Client.class);
        this.targetTemplateMapping = targetTemplateMapping;
        this.restApiAppSyncConfig = restApiAppSyncConfig;
    }

    public ErrorAndCode upsertDetails(List<Map<String, Object>> details) {
        ErrorAndCode errorObject = null;
        try {
            Response response = invokeRestAPI(details);
            log.info("Response status {}", response.getStatus());
            if (!ResponseUtils.is2xx(response)) {
                errorObject = response.readEntity(ErrorAndCode.class);
            }
        } catch (Exception e) {
            log.error(String.format("Custom API upsert failed for %s %s", targetTemplateMapping.getUrl(), targetTemplateMapping.getTemplate()), e);
            errorObject = new ErrorAndCode(RestApiErrorCode.UNCLASSIFIED, e.getMessage());
        }
        return errorObject;
    }

    private Response invokeRestAPI(List<Map<String, Object>> inputDetails) throws IOException {

        Map<String, String> headers = targetTemplateMapping.getHeaders();
        Invocation.Builder builder = this.client.target(targetTemplateMapping.getUrl())
                .request(headers.get(CONTENT_TYPE));
        headers.remove(CONTENT_TYPE);
        headers.forEach(builder::header);
        if (RestMethod.PUT == targetTemplateMapping.getMethod()) {
            return builder.put(Entity.json(constructPayload(inputDetails)));
        }
        return builder.post(Entity.json(constructPayload(inputDetails)));
    }

    private Map<String, Object> constructPayload(List<Map<String, Object>> inputDetails) throws IOException {
        if (restApiAppSyncConfig.isBulk()) {
            List<Map<String, Object>> transformedInput = Lists.newArrayList();
            for (Map<String, Object> inputDetail : inputDetails) {
                transformedInput.add(MustacheUtils.constructPayload(targetTemplateMapping.getTemplate(), inputDetail));
            }
            return constructNestedMap(restApiAppSyncConfig.getJsonPath(), transformedInput);
        }
        return MustacheUtils.constructPayload(targetTemplateMapping.getTemplate(), inputDetails.get(0));
    }

    private Map<String, Object> constructNestedMap(String nestedPath, List<Map<String, Object>> transformedInput) {
        String[] pathTokens = nestedPath.split("\\.");
        Map<String, Object> parentMap = Maps.newHashMap();
        Map<String, Object> enclosedMap = parentMap;
        for (int i = 0; i < pathTokens.length; i++) {
            if (i == pathTokens.length - 1) {
                enclosedMap.put(pathTokens[i], transformedInput);
                continue;
            }
            enclosedMap.put(pathTokens[i], Maps.<String, Object>newHashMap());
            enclosedMap = (Map<String, Object>) enclosedMap.get(pathTokens[i]);
        }
        return parentMap;
    }
}
