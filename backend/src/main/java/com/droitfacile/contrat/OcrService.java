package com.droitfacile.contrat;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/** Optional local OCR adapter. It uses the installed Tesseract CLI, never a remote AI service. */
@Service
public class OcrService {
    private final boolean enabled;
    private final String command;
    private final String languages;

    public OcrService(@Value("${app.ocr.enabled:false}") boolean enabled,
                      @Value("${app.ocr.command:tesseract}") String command,
                      @Value("${app.ocr.languages:fra+ara}") String languages) {
        this.enabled = enabled;
        this.command = command;
        this.languages = languages;
    }

    public String extrairePdf(byte[] bytes) throws IOException {
        if (!enabled) return "";
        StringBuilder texte = new StringBuilder();
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFRenderer renderer = new PDFRenderer(document);
            for (int page = 0; page < document.getNumberOfPages(); page++) {
                BufferedImage image = renderer.renderImageWithDPI(page, 180);
                Path imageFile = Files.createTempFile("droitfacile-ocr-", ".png");
                try {
                    ImageIO.write(image, "png", imageFile.toFile());
                    Process process = new ProcessBuilder(command, imageFile.toString(), "stdout",
                            "-l", languages, "--psm", "3")
                            .redirectErrorStream(true).start();
                    String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                    if (process.waitFor() != 0) {
                        throw new IOException("Tesseract a echoue : " + output.trim());
                    }
                    texte.append(output).append('\n');
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new IOException("OCR interrompu", e);
                } finally {
                    Files.deleteIfExists(imageFile);
                }
            }
        }
        return texte.toString().strip();
    }
}
