import io
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER

class PdfService:
    def generate_trip_pdf(self, trip_data: dict) -> bytes:
        """Generates a professional, elegant PDF itinerary in memory."""
        buffer = io.BytesIO()
        
        # 1. Setup Document with small, elegant margins (0.75 inch)
        doc = SimpleDocTemplate(
            buffer, pagesize=letter,
            rightMargin=0.75*inch, leftMargin=0.75*inch,
            topMargin=0.75*inch, bottomMargin=0.75*inch
        )
        
        styles = getSampleStyleSheet()
        
        # 2. Define Custom Typography
        title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=26, textColor=colors.HexColor("#1a1a1a"), alignment=TA_CENTER, spaceAfter=6)
        subtitle_style = ParagraphStyle('CustomSubtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=12, textColor=colors.HexColor("#666666"), alignment=TA_CENTER, spaceAfter=20)
        heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=14, textColor=colors.HexColor("#2c3e50"), spaceBefore=20, spaceAfter=10)
        normal_style = ParagraphStyle('CustomNormal', parent=styles['Normal'], fontName='Helvetica', fontSize=11, textColor=colors.HexColor("#333333"), leading=16, spaceAfter=8)
        cell_style = ParagraphStyle('CellStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=10, textColor=colors.black, leading=14)
        header_cell_style = ParagraphStyle('HeaderCellStyle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=colors.white, leading=12)

        elements = []

        # 3. Build Header
        elements.append(Paragraph("✈️ TripMate Itinerary", title_style))
        elements.append(Paragraph("Your AI-Powered Travel Companion", subtitle_style))
        elements.append(Spacer(1, 0.2 * inch))

        # 4. Trip Details Section
        elements.append(Paragraph("Trip Overview", heading_style))
        details_html = f"""
            <b>Trip Title:</b> {trip_data.get('title', 'N/A')}<br/>
            <b>Dates:</b> {trip_data.get('start_date', 'N/A')} to {trip_data.get('end_date', 'N/A')}<br/>
            <b>Budget:</b> ${trip_data.get('budget', 'N/A')}<br/>
            <b>Status:</b> {trip_data.get('status', 'N/A').capitalize()}
        """
        elements.append(Paragraph(details_html, normal_style))
        elements.append(Spacer(1, 0.3 * inch))

        # 5. Itinerary Table
        elements.append(Paragraph("Day-by-Day Itinerary", heading_style))
        
        if "items" in trip_data and trip_data["items"]:
            # Sort items by day_no
            items = sorted(trip_data["items"], key=lambda x: x['day_no'])
            
            # Table Data (Header Row)
            table_data = [[
                Paragraph("Day", header_cell_style),
                Paragraph("Time", header_cell_style),
                Paragraph("Activity", header_cell_style),
                Paragraph("Notes", header_cell_style)
            ]]
            
            # Add rows
            for item in items:
                table_data.append([
                    Paragraph(str(item.get('day_no', '')), cell_style),
                    Paragraph(item.get('time', 'N/A') or 'N/A', cell_style),
                    Paragraph(item.get('activity', ''), cell_style),
                    Paragraph(item.get('notes', '') or '-', cell_style)
                ])
            
            # Create Table Object with specific column widths
            col_widths = [0.5*inch, 0.8*inch, 2.5*inch, 2.7*inch]
            table = Table(table_data, colWidths=col_widths, repeatRows=1)
            
            # Apply Professional Table Styling
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2c3e50")), # Dark blue header
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0,0), (-1,0), 10),
                ('TOPPADDING', (0,0), (-1,0), 10),
                ('BOTTOMPADDING', (0,1), (-1,-1), 12),
                ('TOPPADDING', (0,1), (-1,-1), 12),
                # Zebra striping for rows
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
                # Light grid lines
                ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#dee2e6")),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#dee2e6"))
            ]))
            elements.append(table)
        else:
            elements.append(Paragraph("No activities planned yet.", normal_style))

        # 6. Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
