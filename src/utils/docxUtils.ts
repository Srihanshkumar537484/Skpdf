import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Creates a real Microsoft Word (.docx) file from extracted text paragraphs.
 */
export async function createWordDocumentFromText(
  title: string,
  paragraphs: string[]
): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            spacing: { after: 300 }
          }),
          ...paragraphs.map(
            (p) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: p,
                    size: 24 // 12pt
                  })
                ],
                spacing: { after: 200 }
              })
          )
        ]
      }
    ]
  });

  return await Packer.toBlob(doc);
}

/**
 * Extracts HTML preview and plain text from an uploaded .docx file using mammoth.
 */
export async function extractFromDocx(arrayBuffer: ArrayBuffer): Promise<{ html: string; text: string }> {
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const rawText = await mammoth.extractRawText({ arrayBuffer });
  return {
    html: result.value,
    text: rawText.value
  };
}

/**
 * Converts a Word document (.docx) to a clean PDF file using parsed text runs.
 */
export async function convertDocxToPdf(arrayBuffer: ArrayBuffer, docTitle = 'Document'): Promise<Uint8Array> {
  const { text } = await extractFromDocx(arrayBuffer);
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 50;
  const lineHeight = 18;
  const usableWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  // Add document header
  currentPage.drawText(docTitle, {
    x: margin,
    y: currentY,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1)
  });
  currentY -= 32;

  for (const line of lines) {
    // Word wrap check
    const words = line.split(' ');
    let currentLineText = '';

    for (const word of words) {
      const testLine = currentLineText ? `${currentLineText} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, 11);

      if (textWidth > usableWidth && currentLineText) {
        if (currentY < margin + lineHeight) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }

        currentPage.drawText(currentLineText, {
          x: margin,
          y: currentY,
          size: 11,
          font,
          color: rgb(0.2, 0.2, 0.2)
        });
        currentY -= lineHeight;
        currentLineText = word;
      } else {
        currentLineText = testLine;
      }
    }

    if (currentLineText) {
      if (currentY < margin + lineHeight) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }

      currentPage.drawText(currentLineText, {
        x: margin,
        y: currentY,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2)
      });
      currentY -= lineHeight * 1.5; // paragraph spacing
    }
  }

  return await pdfDoc.save();
}
