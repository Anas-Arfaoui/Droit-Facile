package com.droitfacile.dossier;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class DossierPdfService {

    private final DossierService dossierService;

    public DossierPdfService(DossierService dossierService) {
        this.dossierService = dossierService;
    }

    public byte[] generate(Long dossierId, String email) {
        Dossier dossier = dossierService.getReadable(dossierId, email);

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                PDType1Font titleFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font bodyFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

                content.beginText();
                content.setFont(titleFont, 20);
                content.newLineAtOffset(60, 760);
                content.showText(safe(dossier.getTitre()));
                content.endText();

                float y = 720;
                y = writeLine(content, bodyFont, 12, 60, y, "Dossier #" + dossier.getId());
                y = writeLine(content, bodyFont, 12, 60, y, "Statut : " + dossier.getStatut());
                y = writeLine(content, bodyFont, 12, 60, y, "Avocat : " + dossier.getAvocat().getNom());
                y = writeLine(content, bodyFont, 12, 60, y, "Client : " + dossier.getClient().getNom());
                y = writeLine(content, bodyFont, 12, 60, y, "Créé le : " + dossier.getCreeLe());

                y -= 20;
                writeLine(content, titleFont, 14, 60, y, "Description");
                y -= 24;
                writeWrapped(content, bodyFont, 12, 60, y, safe(dossier.getDescription()));
            }

            document.save(output);
            return output.toByteArray();
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Impossible de générer le PDF"
            );
        }
    }

    private float writeLine(
            PDPageContentStream content,
            PDType1Font font,
            float size,
            float x,
            float y,
            String value
    ) throws IOException {
        content.beginText();
        content.setFont(font, size);
        content.newLineAtOffset(x, y);
        content.showText(safe(value));
        content.endText();
        return y - 20;
    }

    private void writeWrapped(
            PDPageContentStream content,
            PDType1Font font,
            float size,
            float x,
            float y,
            String value
    ) throws IOException {
        String text = safe(value);
        String[] words = text.split("\\s+");
        StringBuilder line = new StringBuilder();
        float currentY = y;

        for (String word : words) {
            if (line.length() + word.length() > 95) {
                writeLine(content, font, size, x, currentY, line.toString());
                currentY -= 20;
                line.setLength(0);
            }
            if (line.length() > 0) line.append(' ');
            line.append(word);
        }

        if (line.length() > 0) {
            writeLine(content, font, size, x, currentY, line.toString());
        }
    }

    private String safe(String value) {
        if (value == null || value.isBlank()) return "-";
        return value.replaceAll("[^\\x20-\\x7E]", "?");
    }
}
