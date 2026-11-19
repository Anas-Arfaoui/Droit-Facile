package com.droitfacile.clause;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

/** Appelle l'API Gemini (generateContent) et renvoie le texte JSON genere. */
@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

    private final ObjectMapper mapper;
    private final RestClient restClient;
    private final String apiKey;
    private final String modele;

    public GeminiClient(ObjectMapper mapper,
                        @Value("${GEMINI_API_KEY:}") String apiKey,
                        @Value("${GEMINI_MODEL:gemini-3.8-flash}") String modele) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(180_000);
        this.mapper = mapper;
        this.restClient = RestClient.builder().requestFactory(factory).build();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.modele = modele;
    }

    /** Envoie une instruction + un prompt et force la reponse a respecter le schema JSON donne. */
    public String genererJson(String instruction, String prompt, String schemaJson) {
        if (apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Cle API Gemini non configuree (variable d'environnement GEMINI_API_KEY)");
        }

        String corps = construireCorps(instruction, prompt, schemaJson);
        String reponse;
        try {
            reponse = restClient.post()
                    .uri(BASE_URL + "/models/" + modele + ":generateContent")
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(corps)
                    .retrieve()
                    .body(String.class);
        } catch (RestClientResponseException e) {
            throw traduire(e);
        } catch (RestClientException e) {
            log.warn("Appel Gemini impossible : {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT,
                    "Gemini ne repond pas (reseau ou delai depasse)");
        }
        return extraireTexte(reponse);
    }

    private String construireCorps(String instruction, String prompt, String schemaJson) {
        try {
            ObjectNode corps = mapper.createObjectNode();
            corps.putObject("systemInstruction").putArray("parts").addObject().put("text", instruction);
            corps.putArray("contents").addObject().putArray("parts").addObject().put("text", prompt);
            ObjectNode texte = corps.putObject("generationConfig").putObject("responseFormat").putObject("text");
            texte.put("mimeType", "APPLICATION_JSON");
            texte.set("schema", mapper.readTree(schemaJson));
            return mapper.writeValueAsString(corps);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Schema JSON invalide", e);
        }
    }

    private String extraireTexte(String reponse) {
        if (reponse == null || reponse.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Reponse vide de Gemini");
        }
        try {
            JsonNode racine = mapper.readTree(reponse);
            StringBuilder texte = new StringBuilder();
            for (JsonNode part : racine.path("candidates").path(0).path("content").path("parts")) {
                if (part.path("thought").asBoolean(false)) {
                    continue;
                }
                texte.append(part.path("text").asText(""));
            }
            if (texte.toString().isBlank()) {
                log.warn("Reponse Gemini sans texte : {}", abreger(reponse, 500));
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Gemini n'a renvoye aucun texte (contenu bloque ou reponse tronquee)");
            }
            return texte.toString();
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Reponse de Gemini illisible");
        }
    }

    private ResponseStatusException traduire(RestClientResponseException e) {
        int code = e.getStatusCode().value();
        String detail = abreger(e.getResponseBodyAsString(), 300);
        log.warn("Erreur Gemini {} : {}", code, detail);
        return switch (code) {
            case 429 -> new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Quota Gemini atteint : reessaie dans une minute");
            case 400, 401, 403 -> new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Gemini a refuse la requete (" + code + ") : " + detail);
            case 404 -> new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Modele Gemini introuvable : verifie la variable GEMINI_MODEL (" + modele + ")");
            default -> new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Erreur du service Gemini (" + code + ")");
        };
    }

    private String abreger(String texte, int max) {
        if (texte == null) {
            return "";
        }
        String propre = texte.replaceAll("\\s+", " ").trim();
        return propre.length() <= max ? propre : propre.substring(0, max) + "...";
    }
}
