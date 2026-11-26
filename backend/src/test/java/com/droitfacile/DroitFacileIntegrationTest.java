package com.droitfacile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.droitfacile.dossier.Dossier;
import com.droitfacile.dossier.DossierRepository;
import com.droitfacile.echeance.Echeance;
import com.droitfacile.echeance.EcheanceRepository;
import com.droitfacile.echeance.StatutEcheance;
import com.droitfacile.notification.NotificationRepository;
import com.droitfacile.notification.NotificationService;
import com.droitfacile.user.Role;
import com.droitfacile.user.User;
import com.droitfacile.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ActiveProfilesResolver;
import org.springframework.test.web.servlet.MockMvc;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles(resolver = DroitFacileIntegrationTest.ProfileResolver.class)
class DroitFacileIntegrationTest {

    static class ProfileResolver implements ActiveProfilesResolver {
        @Override
        public String[] resolve(Class<?> testClass) {
            return "postgres".equalsIgnoreCase(System.getProperty("integration.db"))
                    ? new String[]{"postgres-test"}
                    : new String[]{"test"};
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private EcheanceRepository echeanceRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

    @Test
    void dossierAccessAndPdfExportRespectRoles() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        String avocatEmail = "avocat-" + suffix + "@test.local";
        String clientEmail = "client-" + suffix + "@test.local";
        String otherClientEmail = "other-" + suffix + "@test.local";

        register(avocatEmail, "AVOCAT");
        JsonNode client = register(clientEmail, "CLIENT");
        register(otherClientEmail, "CLIENT");

        String avocatToken = login(avocatEmail);
        String adminToken = login("admin-test@droitfacile.test");
        String clientToken = login(clientEmail);
        String otherClientToken = login(otherClientEmail);

        String dossierResponse = mockMvc.perform(post("/api/dossiers")
                        .header("Authorization", bearer(avocatToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "titre": "Dossier integration",
                                  "description": "Test acces dossier",
                                  "clientId": %d
                                }
                                """.formatted(client.get("id").asLong())))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        long dossierId = objectMapper.readTree(dossierResponse).get("id").asLong();

        mockMvc.perform(get("/api/dossiers/{id}", dossierId)
                        .header("Authorization", bearer(clientToken)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/dossiers/{id}", dossierId)
                        .header("Authorization", bearer(otherClientToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/dossiers")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "titre": "Admin ne cree pas",
                                  "clientId": %d
                                }
                                """.formatted(client.get("id").asLong())))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/dossiers/{id}/export.pdf", dossierId)
                        .header("Authorization", bearer(avocatToken)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF));
    }

    @Test
    void adminCanCreateInternalNotification() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        JsonNode client = register("notification-" + suffix + "@test.local", "CLIENT");
        String adminToken = login("admin-test@droitfacile.test");

        mockMvc.perform(post("/api/notifications")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "destinataireId": %d,
                                  "titre": "Information test",
                                  "message": "Notification creee par integration test"
                                }
                                """.formatted(client.get("id").asLong())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("MESSAGE_ADMIN"))
                .andExpect(jsonPath("$.lu").value(false));
    }

    @Test
    void echeanceCrudIsAvailableOnlyToResponsibleLawyer() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        String avocatEmail = "echeance-" + suffix + "@test.local";
        JsonNode client = register("echeance-client-" + suffix + "@test.local", "CLIENT");
        register(avocatEmail, "AVOCAT");
        String avocatToken = login(avocatEmail);

        String dossierResponse = mockMvc.perform(post("/api/dossiers")
                        .header("Authorization", bearer(avocatToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "titre": "Dossier echeance CRUD",
                                  "clientId": %d
                                }
                                """.formatted(client.get("id").asLong())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long dossierId = objectMapper.readTree(dossierResponse).get("id").asLong();

        String echeanceResponse = mockMvc.perform(post("/api/dossiers/{id}/echeances", dossierId)
                        .header("Authorization", bearer(avocatToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "titre": "Audience initiale",
                                  "description": "Premiere audience",
                                  "dateEcheance": "%s",
                                  "rappelJoursAvant": 2
                                }
                                """.formatted(LocalDate.now().plusDays(10))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statut").value("A_VENIR"))
                .andReturn().getResponse().getContentAsString();

        long echeanceId = objectMapper.readTree(echeanceResponse).get("id").asLong();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                                "/api/echeances/{id}", echeanceId)
                        .header("Authorization", bearer(avocatToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "titre": "Audience modifiee",
                                  "description": "Description modifiee",
                                  "dateEcheance": "%s",
                                  "rappelJoursAvant": 1,
                                  "statut": "EN_COURS"
                                }
                                """.formatted(LocalDate.now().plusDays(12))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titre").value("Audience modifiee"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                                "/api/echeances/{id}/statut", echeanceId)
                        .header("Authorization", bearer(avocatToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"statut\":\"TERMINEE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("TERMINEE"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(
                                "/api/echeances/{id}", echeanceId)
                        .header("Authorization", bearer(avocatToken)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/echeances/{id}", echeanceId)
                        .header("Authorization", bearer(avocatToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void schedulerCreatesOneReminderAndDoesNotDuplicateIt() {
        User avocat = new User();
        avocat.setNom("Scheduler Avocat");
        avocat.setEmail("scheduler-" + System.nanoTime() + "@test.local");
        avocat.setMotDePasse("encoded");
        avocat.setRole(Role.AVOCAT);
        avocat = userRepository.save(avocat);

        User client = new User();
        client.setNom("Scheduler Client");
        client.setEmail("scheduler-client-" + System.nanoTime() + "@test.local");
        client.setMotDePasse("encoded");
        client.setRole(Role.CLIENT);
        client = userRepository.save(client);

        Dossier dossier = new Dossier();
        dossier.setTitre("Dossier scheduler");
        dossier.setAvocat(avocat);
        dossier.setClient(client);
        dossier = dossierRepository.save(dossier);

        Echeance echeance = new Echeance();
        echeance.setDossier(dossier);
        echeance.setTitre("Rappel scheduler");
        echeance.setDateEcheance(LocalDate.now());
        echeance.setRappelJoursAvant(0);
        echeance.setStatut(StatutEcheance.A_VENIR);
        echeance = echeanceRepository.save(echeance);
        long echeanceId = echeance.getId();

        int firstRun = notificationService.creerRappels();
        int secondRun = notificationService.creerRappels();

        org.junit.jupiter.api.Assertions.assertEquals(1, firstRun);
        org.junit.jupiter.api.Assertions.assertEquals(0, secondRun);
        org.junit.jupiter.api.Assertions.assertEquals(
                1,
                notificationRepository.findByDestinataireIdOrderByCreeLeDesc(avocat.getId()).stream()
                        .filter(notification -> notification.getEcheance().getId().equals(echeanceId))
                        .count()
        );
    }

    private JsonNode register(String email, String role) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nom": "%s",
                                  "email": "%s",
                                  "motDePasse": "Password123",
                                  "role": "%s"
                                }
                                """.formatted(role + " Test", email, role)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response);
    }

    private String login(String email) throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "motDePasse": "%s"
                                }
                                """.formatted(email, email.startsWith("admin-") ? "Admin12345" : "Password123")))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
