package com.droitfacile.contrat;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;

/** Extrait le texte d'un PDF ou d'un DOCX et detecte sa langue (FR / AR). */
@Component
public class TexteExtracteur {

    public String extraire(byte[] octets, String extension) throws IOException {
        String texte = switch (extension) {
            case "pdf" -> lirePdf(octets);
            case "docx" -> lireDocx(octets);
            default -> throw new IllegalArgumentException("Format non supporte : " + extension);
        };
        // PostgreSQL refuse le caractere NUL dans un champ texte
        return texte.replace("\u0000", "").strip();
    }

    private String lirePdf(byte[] octets) throws IOException {
        try (PDDocument document = Loader.loadPDF(octets)) {
            return new PDFTextStripper().getText(document);
        }
    }

    private String lireDocx(byte[] octets) throws IOException {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(octets));
             XWPFWordExtractor extracteur = new XWPFWordExtractor(document)) {
            return extracteur.getText();
        }
    }

    /** Compare le nombre de lettres arabes et latines. Alphabet latin = FR. */
    public LangueContrat detecterLangue(String texte) {
        int arabe = 0;
        int latin = 0;
        for (int i = 0; i < texte.length(); i++) {
            char c = texte.charAt(i);
            if (estArabe(c)) {
                arabe++;
            } else if (estLatin(c)) {
                latin++;
            }
        }
        int total = arabe + latin;
        if (total < 20) {
            return LangueContrat.INCONNUE;
        }
        double partArabe = (double) arabe / total;
        if (partArabe >= 0.7) {
            return LangueContrat.AR;
        }
        if (partArabe <= 0.3) {
            return LangueContrat.FR;
        }
        return LangueContrat.MIXTE;
    }

    private boolean estArabe(char c) {
        return (c >= 0x0600 && c <= 0x06FF)
                || (c >= 0x0750 && c <= 0x077F)
                || (c >= 0xFB50 && c <= 0xFDFF)
                || (c >= 0xFE70 && c <= 0xFEFF);
    }

    private boolean estLatin(char c) {
        return (c >= 'A' && c <= 'Z')
                || (c >= 'a' && c <= 'z')
                || (c >= 0x00C0 && c <= 0x00FF && c != 0x00D7 && c != 0x00F7);
    }
}
