# app/services/invoice.py
import re
from io import BytesIO
from datetime import date, datetime
from typing import Optional

from app.models.reservation import Reservation
from app.models.room import Room
from app.models.tenant import Tenant
from app.models.customer import Customer
from app.models.payment import Payment

def _format_ar(amount) -> str:
    """Format amount as Ariary (Ar) with standard thousands separator."""
    try:
        val = round(float(amount or 0))
        formatted = f"{val:,}".replace(",", " ")
        return f"{formatted} Ar"
    except Exception:
        return "0 Ar"

def _format_date(d) -> str:
    """Format date to DD/MM/YYYY."""
    if not d:
        return "—"
    if isinstance(d, datetime):
        return d.strftime("%d/%m/%Y")
    if isinstance(d, date):
        return d.strftime("%d/%m/%Y")
    try:
        dt = datetime.fromisoformat(str(d).replace("Z", "+00:00"))
        return dt.strftime("%d/%m/%Y")
    except Exception:
        return str(d)

def _get_method_label(method: Optional[str]) -> str:
    mapping = {
        "CARD": "Carte Bancaire (Visa / Mastercard)",
        "CREDIT_CARD": "Carte de Crédit",
        "MOBILE_MONEY": "Mobile Money (Mvola / Orange / Airtel)",
        "CASH": "Espèces / Au comptoir",
        "BANK_TRANSFER": "Virement Bancaire",
    }
    return mapping.get(str(method).upper(), str(method or "Paiement Direct"))


def _clean_filename_part(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"[^\w\-_]", "_", text.strip())
    return re.sub(r"_+", "_", cleaned).strip("_")


def get_invoice_filename(hotel: Optional[Tenant], reservation: Reservation) -> str:
    """Generate a clean, standardized filename for invoice download."""
    code = reservation.reservation_code or "RESERVATION"
    if hotel and hotel.name:
        hotel_slug = _clean_filename_part(hotel.name)
        if len(hotel_slug) > 20:
            hotel_slug = hotel_slug[:20]
        return f"Facture_{hotel_slug}_{code}.pdf"
    return f"Facture_{code}.pdf"


def _escape_pdf_str(text: str) -> str:
    if not text:
        return ""
    return str(text).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _generate_pure_python_pdf(
    reservation: Reservation,
    room: Room,
    hotel: Tenant,
    customer: Customer,
    payment: Optional[Payment] = None,
) -> BytesIO:
    """Fallback PDF generator using PDF 1.4 format without external dependencies."""
    hotel_name = _escape_pdf_str(hotel.name or "Établissement Hôtelier")
    hotel_address = _escape_pdf_str(hotel.address or "")
    hotel_city = _escape_pdf_str(hotel.city or "")
    
    cust_name = _escape_pdf_str(f"{customer.first_name} {customer.last_name}".strip())
    cust_email = _escape_pdf_str(customer.email or "-")
    cust_phone = _escape_pdf_str(customer.phone or "-")
    
    res_code = _escape_pdf_str(reservation.reservation_code or "")
    room_number = _escape_pdf_str(room.number or "")
    room_type = _escape_pdf_str(room.type or "")
    
    check_in_str = _escape_pdf_str(_format_date(reservation.check_in))
    check_out_str = _escape_pdf_str(_format_date(reservation.check_out))
    guests_str = _escape_pdf_str(str(reservation.number_of_guests))
    
    try:
        d1 = reservation.check_in if isinstance(reservation.check_in, (date, datetime)) else datetime.fromisoformat(str(reservation.check_in)).date()
        d2 = reservation.check_out if isinstance(reservation.check_out, (date, datetime)) else datetime.fromisoformat(str(reservation.check_out)).date()
        nights = max(1, (d2 - d1).days)
    except Exception:
        nights = 1
        
    price_night = float(room.price_per_night or 0)
    total_amount = float(reservation.total_price or (nights * price_night))
    
    price_night_str = _escape_pdf_str(_format_ar(price_night))
    total_str = _escape_pdf_str(_format_ar(total_amount))
    
    pay_method = _escape_pdf_str(_get_method_label(payment.method if payment else "CARD"))
    pay_txn = _escape_pdf_str(payment.transaction_id if payment and payment.transaction_id else f"TXN-{res_code}")
    pay_date = _escape_pdf_str(_format_date(payment.created_at if payment else datetime.now()))
    
    stream_lines = [
        "q",
        # Top header dark navy banner
        "0.04 0.07 0.16 rg",
        "0 735 595.28 106.89 re f",
        # Gold accent stripe under header
        "0.96 0.62 0.07 rg",
        "0 732 595.28 3 re f",
        # Hotel Name
        "1 1 1 rg",
        "BT /F2 20 Tf 40 798 Td (" + hotel_name + ") Tj ET",
        "0.85 0.88 0.92 rg",
        "BT /F1 9.5 Tf 40 780 Td (" + (hotel_address + (", " + hotel_city if hotel_city else "")) + ") Tj ET",
        # Invoice Title
        "1 1 1 rg",
        "BT /F2 15 Tf 400 802 Td (FACTURE ACQUITTEE) Tj ET",
        "0.96 0.62 0.07 rg",
        "BT /F2 10 Tf 400 786 Td (N " + f"FAC-{res_code}" + ") Tj ET",
        "0.85 0.88 0.92 rg",
        "BT /F1 9 Tf 400 770 Td (Date: " + pay_date + ") Tj ET",
        
        # Green Paid Stamp Banner
        "0.02 0.58 0.41 rg",
        "40 682 515 32 re f",
        "1 1 1 rg",
        "BT /F2 10.5 Tf 52 694 Td (STATUT : FACTURE REGLEE EN INTEGRALITE) Tj ET",
        "BT /F1 9 Tf 360 694 Td (Ref: " + pay_txn + ") Tj ET",
        
        # Customer Card (Left)
        "0.97 0.98 1.0 rg",
        "40 568 245 96 re f",
        "0.85 0.88 0.92 RG 1 w",
        "40 568 245 96 re S",
        "0.12 0.16 0.24 rg",
        "BT /F2 10 Tf 52 644 Td (CLIENT / FACTURE A) Tj ET",
        "BT /F2 11 Tf 52 626 Td (" + cust_name + ") Tj ET",
        "0.35 0.40 0.48 rg",
        "BT /F1 9 Tf 52 608 Td (Email : " + cust_email + ") Tj ET",
        "BT /F1 9 Tf 52 592 Td (Tel : " + cust_phone + ") Tj ET",
        "BT /F1 8.5 Tf 52 576 Td (Dossier : " + res_code + ") Tj ET",
        
        # Stay Details Card (Right)
        "0.97 0.98 1.0 rg",
        "310 568 245 96 re f",
        "0.85 0.88 0.92 RG 1 w",
        "310 568 245 96 re S",
        "0.12 0.16 0.24 rg",
        "BT /F2 10 Tf 322 644 Td (DETAILS DU SEJOUR) Tj ET",
        "BT /F2 10.5 Tf 322 626 Td (Chambre " + room_number + " (" + room_type + ")) Tj ET",
        "0.35 0.40 0.48 rg",
        "BT /F1 9 Tf 322 608 Td (Arrivee : " + check_in_str + " | Depart : " + check_out_str + ") Tj ET",
        "BT /F1 9 Tf 322 592 Td (Duree : " + str(nights) + " nuitee(s) - " + guests_str + " voyageur(s)) Tj ET",
        "BT /F1 8.5 Tf 322 576 Td (Reglement : Integralement percu) Tj ET",
        
        # Table Header
        "0.10 0.15 0.25 rg",
        "40 520 515 24 re f",
        "1 1 1 rg",
        "BT /F2 9.5 Tf 52 528 Td (Designation des prestations) Tj ET",
        "BT /F2 9.5 Tf 270 528 Td (Tarif / nuit) Tj ET",
        "BT /F2 9.5 Tf 380 528 Td (Duree) Tj ET",
        "BT /F2 9.5 Tf 470 528 Td (Montant Total) Tj ET",
        
        # Table Body Row
        "1.0 1.0 1.0 rg",
        "40 465 515 55 re f",
        "0.88 0.90 0.94 RG 0.75 w",
        "40 465 515 55 re S",
        "0.12 0.16 0.24 rg",
        "BT /F2 9.5 Tf 52 498 Td (Hebergement - Chambre " + room_number + ") Tj ET",
        "0.40 0.45 0.52 rg",
        "BT /F1 8.5 Tf 52 482 Td (Categorie " + room_type + " • Du " + check_in_str + " au " + check_out_str + ") Tj ET",
        "0.12 0.16 0.24 rg",
        "BT /F1 9.5 Tf 270 490 Td (" + price_night_str + ") Tj ET",
        "BT /F1 9.5 Tf 380 490 Td (" + str(nights) + " nuit(s)) Tj ET",
        "BT /F2 10 Tf 470 490 Td (" + total_str + ") Tj ET",
        
        # Payment Recap Box (Left)
        "0.97 0.98 1.0 rg",
        "40 365 245 80 re f",
        "0.85 0.88 0.92 RG 1 w",
        "40 365 245 80 re S",
        "0.10 0.15 0.25 rg",
        "BT /F2 9.5 Tf 52 428 Td (MODALITES DU REGLEMENT) Tj ET",
        "0.35 0.40 0.48 rg",
        "BT /F1 8.5 Tf 52 410 Td (Moyen : " + pay_method + ") Tj ET",
        "BT /F1 8.5 Tf 52 394 Td (Ref. Transaction : " + pay_txn + ") Tj ET",
        "0.02 0.58 0.41 rg",
        "BT /F2 9 Tf 52 376 Td (Solde du : 0 Ar (Acquitte)) Tj ET",
        
        # Total / Recap Card (Right)
        "0.95 0.96 0.99 rg",
        "310 365 245 80 re f",
        "0.80 0.85 0.92 RG 1 w",
        "310 365 245 80 re S",
        "0.25 0.30 0.40 rg",
        "BT /F1 9 Tf 325 425 Td (Sous-total HT :) Tj ET",
        "BT /F1 9 Tf 460 425 Td (" + total_str + ") Tj ET",
        "BT /F1 9 Tf 325 407 Td (TVA (0% / Exoneree) :) Tj ET",
        "BT /F1 9 Tf 460 407 Td (0 Ar) Tj ET",
        
        # Final Total Highlight in Dark Navy
        "0.06 0.09 0.16 rg",
        "310 365 245 28 re f",
        "1 1 1 rg",
        "BT /F2 10 Tf 325 375 Td (TOTAL TTC ACQUITTE :) Tj ET",
        "0.98 0.75 0.15 rg",
        "BT /F2 11 Tf 445 375 Td (" + total_str + ") Tj ET",
        
        # Information Note Box
        "0.97 0.98 1.0 rg",
        "40 245 515 95 re f",
        "0.88 0.90 0.94 RG 1 w",
        "40 245 515 95 re S",
        "0.10 0.15 0.25 rg",
        "BT /F2 9.5 Tf 52 322 Td (INFORMATIONS & CONDITIONS DU SEJOUR) Tj ET",
        "0.35 0.40 0.48 rg",
        "BT /F1 8.5 Tf 52 304 Td (• Heure d'arrivee (Check-in) a partir de 14h00 - Depart (Check-out) avant 11h00.) Tj ET",
        "BT /F1 8.5 Tf 52 288 Td (• Facture acquittee valant recu definitif conformement aux reglementations hotelieres.) Tj ET",
        "BT /F1 8.5 Tf 52 272 Td (• Notre service de conciergerie et reception reste a votre entiere disposition 24h/24.) Tj ET",
        "BT /F1 8.5 Tf 52 256 Td (• Un depot de garantie peut etre requis lors de l'enregistrement a l'hotel.) Tj ET",
        
        # Footer
        "0.85 0.88 0.92 RG 1 w",
        "40 85 515 0.1 re S",
        "0.45 0.50 0.58 rg",
        "BT /F1 8.5 Tf 40 68 Td (Document officiel genere electroniquement • Facture acquittee faisant foi de paiement integral.) Tj ET",
        "BT /F1 8.5 Tf 40 54 Td (Nous vous remercions pour votre sejour et serions ravis de vous accueillir a nouveau tres prochainement !) Tj ET",
        "BT /F2 8 Tf 40 38 Td (" + hotel_name + " - " + (hotel_address + (", " + hotel_city if hotel_city else "")) + ") Tj ET",
        "Q",
    ]
    
    content_stream = "\n".join(stream_lines).encode("latin-1", "replace")
    
    objects = []
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objects.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objects.append(
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] "
        b"/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> "
        b"/Contents 6 0 R >>"
    )
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
    objects.append(
        b"<< /Length " + str(len(content_stream)).encode("ascii") + b" >>\nstream\n"
        + content_stream
        + b"\nendstream"
    )
    
    buffer = BytesIO()
    buffer.write(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    
    offsets = []
    for i, obj in enumerate(objects, 1):
        offsets.append(buffer.tell())
        buffer.write(f"{i} 0 obj\n".encode("ascii"))
        buffer.write(obj)
        buffer.write(b"\nendobj\n")
        
    xref_offset = buffer.tell()
    buffer.write(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("ascii"))
    for offset in offsets:
        buffer.write(f"{offset:010d} 00000 n \n".encode("ascii"))
        
    buffer.write(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode("ascii")
    )
    
    buffer.seek(0)
    return buffer


def generate_invoice_pdf(
    reservation: Reservation,
    room: Room,
    hotel: Tenant,
    customer: Customer,
    payment: Optional[Payment] = None,
) -> BytesIO:
    """
    Generate luxury 5-star style invoice PDF using ReportLab with clean typography and balanced layout.
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.pdfgen import canvas

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4  # 595.28 x 841.89 pt

        # Luxury Palette
        C_NAVY_DARK = colors.HexColor("#070F2B")
        C_NAVY_MEDIUM = colors.HexColor("#1B1A55")
        C_GOLD = colors.HexColor("#F59E0B")
        C_EMERALD = colors.HexColor("#059669")
        C_EMERALD_BG = colors.HexColor("#ECFDF5")
        C_EMERALD_BORDER = colors.HexColor("#6EE7B7")
        C_BG_CARD = colors.HexColor("#F8FAFC")
        C_BORDER = colors.HexColor("#E2E8F0")
        C_TEXT_MAIN = colors.HexColor("#0F172A")
        C_TEXT_MUTED = colors.HexColor("#64748B")

        # Computed stay values
        try:
            d1 = reservation.check_in if isinstance(reservation.check_in, (date, datetime)) else datetime.fromisoformat(str(reservation.check_in)).date()
            d2 = reservation.check_out if isinstance(reservation.check_out, (date, datetime)) else datetime.fromisoformat(str(reservation.check_out)).date()
            nights = max(1, (d2 - d1).days)
        except Exception:
            nights = 1

        price_night = float(room.price_per_night or 0)
        total_amount = float(reservation.total_price or (nights * price_night))
        price_night_str = _format_ar(price_night)
        total_str = _format_ar(total_amount)
        res_code = reservation.reservation_code or "HTL"
        pay_method = _get_method_label(payment.method if payment else "CARD")
        pay_txn = payment.transaction_id if payment and payment.transaction_id else f"TXN-{res_code}"
        pay_date = _format_date(payment.created_at if payment else datetime.now())

        # =============================================================
        # 1. HEADER BANNER WITH GOLD ACCENT
        # =============================================================
        pdf.setFillColor(C_NAVY_DARK)
        pdf.rect(0, height - 110, width, 110, fill=True, stroke=False)

        # Gold accent line
        pdf.setFillColor(C_GOLD)
        pdf.rect(0, height - 113, width, 3, fill=True, stroke=False)

        # Hotel name & Address
        pdf.setFillColor(colors.white)
        pdf.setFont("Helvetica-Bold", 21)
        pdf.drawString(36, height - 44, hotel.name or "Établissement Hôtelier")

        pdf.setFillColor(colors.HexColor("#94A3B8"))
        pdf.setFont("Helvetica", 9.5)
        hotel_loc = f"{hotel.address}, {hotel.city}" if hotel.address and hotel.city else (hotel.address or hotel.city or "Madagascar")
        pdf.drawString(36, height - 64, hotel_loc)
        pdf.drawString(36, height - 78, "Service Hôtelier & Gestion de Séjours")

        # Invoice Title & Reference on the Right
        pdf.setFillColor(colors.white)
        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawRightString(width - 36, height - 44, "FACTURE ACQUITTÉE")

        pdf.setFillColor(C_GOLD)
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawRightString(width - 36, height - 62, f"N° FAC-{res_code}")

        pdf.setFillColor(colors.HexColor("#CBD5E1"))
        pdf.setFont("Helvetica", 9)
        pdf.drawRightString(width - 36, height - 78, f"Date d'émission : {pay_date}")

        # =============================================================
        # 2. STATUS BADGE (PAID IN FULL)
        # =============================================================
        badge_y = height - 158
        pdf.setFillColor(C_EMERALD_BG)
        pdf.setStrokeColor(C_EMERALD_BORDER)
        pdf.setLineWidth(1.2)
        pdf.roundRect(36, badge_y, width - 72, 34, 6, fill=True, stroke=True)

        pdf.setFillColor(C_EMERALD)
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(52, badge_y + 11, "✓ FACTURE ACQUITTÉE (RÈGLEMENT INTÉGRAL)")

        pdf.setFillColor(colors.HexColor("#047857"))
        pdf.setFont("Helvetica", 9)
        pdf.drawRightString(width - 52, badge_y + 11, f"Réf. Transaction : {pay_txn}")

        # =============================================================
        # 3. TWO INFORMATION CARDS (Customer & Stay)
        # =============================================================
        card_y = height - 280
        card_w = (width - 72 - 16) / 2
        card_h = 106

        # Left Card: Client
        pdf.setFillColor(C_BG_CARD)
        pdf.setStrokeColor(C_BORDER)
        pdf.roundRect(36, card_y, card_w, card_h, 8, fill=True, stroke=True)

        pdf.setFillColor(C_NAVY_MEDIUM)
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(50, card_y + card_h - 22, "CLIENT / FACTURÉ À")

        pdf.setFont("Helvetica-Bold", 11.5)
        pdf.drawString(50, card_y + card_h - 40, f"{customer.first_name} {customer.last_name}")

        pdf.setFillColor(C_TEXT_MUTED)
        pdf.setFont("Helvetica", 9)
        pdf.drawString(50, card_y + card_h - 58, f"Email : {customer.email or '—'}")
        pdf.drawString(50, card_y + card_h - 73, f"Téléphone : {customer.phone or '—'}")
        pdf.drawString(50, card_y + card_h - 88, f"Code Réservation : {res_code}")

        # Right Card: Stay Details
        right_card_x = 36 + card_w + 16
        pdf.setFillColor(C_BG_CARD)
        pdf.setStrokeColor(C_BORDER)
        pdf.roundRect(right_card_x, card_y, card_w, card_h, 8, fill=True, stroke=True)

        pdf.setFillColor(C_NAVY_MEDIUM)
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(right_card_x + 14, card_y + card_h - 22, "DÉTAILS DU SÉJOUR")

        pdf.setFont("Helvetica-Bold", 11.5)
        pdf.drawString(right_card_x + 14, card_y + card_h - 40, f"Chambre N° {room.number}  ({room.type})")

        pdf.setFillColor(C_TEXT_MUTED)
        pdf.setFont("Helvetica", 9)
        pdf.drawString(right_card_x + 14, card_y + card_h - 58, f"Arrivée : {_format_date(reservation.check_in)}   →   Départ : {_format_date(reservation.check_out)}")
        pdf.drawString(right_card_x + 14, card_y + card_h - 73, f"Durée du séjour : {nights} nuit(s)")
        pdf.drawString(right_card_x + 14, card_y + card_h - 88, f"Occupants : {reservation.number_of_guests} voyageur(s)")

        # =============================================================
        # 4. ITEMIZATION TABLE
        # =============================================================
        table_top = card_y - 25
        
        # Table Header
        pdf.setFillColor(C_NAVY_MEDIUM)
        pdf.rect(36, table_top - 26, width - 72, 26, fill=True, stroke=False)

        pdf.setFillColor(colors.white)
        pdf.setFont("Helvetica-Bold", 9.5)
        pdf.drawString(50, table_top - 17, "DÉSIGNATION DE LA PRESTATION")
        pdf.drawString(290, table_top - 17, "TARIF / NUIT")
        pdf.drawString(390, table_top - 17, "DURÉE")
        pdf.drawRightString(width - 50, table_top - 17, "TOTAL")

        # Table Row 1
        row_y = table_top - 78
        pdf.setFillColor(colors.white)
        pdf.setStrokeColor(C_BORDER)
        pdf.rect(36, row_y, width - 72, 52, fill=True, stroke=True)

        pdf.setFillColor(C_TEXT_MAIN)
        pdf.setFont("Helvetica-Bold", 10.5)
        pdf.drawString(50, row_y + 32, f"Hébergement — Chambre {room.number}")

        pdf.setFillColor(C_TEXT_MUTED)
        pdf.setFont("Helvetica", 9)
        pdf.drawString(50, row_y + 16, f"Catégorie {room.type} • Du {_format_date(reservation.check_in)} au {_format_date(reservation.check_out)}")

        pdf.setFillColor(C_TEXT_MAIN)
        pdf.setFont("Helvetica", 10)
        pdf.drawString(290, row_y + 24, price_night_str)
        pdf.drawString(390, row_y + 24, f"{nights} nuit(s)")

        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawRightString(width - 50, row_y + 24, total_str)

        # =============================================================
        # 5. RECAP & PAYMENT BLOCKS (Side-by-side)
        # =============================================================
        recap_y = row_y - 118
        recap_w = (width - 72 - 16) / 2
        recap_h = 100

        # Left Box: Règlement & Justificatif
        pdf.setFillColor(C_BG_CARD)
        pdf.setStrokeColor(C_BORDER)
        pdf.roundRect(36, recap_y, recap_w, recap_h, 8, fill=True, stroke=True)

        pdf.setFillColor(C_NAVY_MEDIUM)
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(50, recap_y + recap_h - 22, "MODALITÉS DE RÈGLEMENT")

        pdf.setFillColor(C_TEXT_MUTED)
        pdf.setFont("Helvetica", 8.5)
        pdf.drawString(50, recap_y + recap_h - 40, f"Moyen : {pay_method}")
        pdf.drawString(50, recap_y + recap_h - 55, f"Réf. Transaction : {pay_txn}")
        pdf.drawString(50, recap_y + recap_h - 70, f"Date de paiement : {pay_date}")

        pdf.setFillColor(C_EMERALD)
        pdf.setFont("Helvetica-Bold", 9.5)
        pdf.drawString(50, recap_y + 14, "SOLDE RESTANT DÛ : 0 Ar (SOLDÉ)")

        # Right Box: Totaux Financiers
        right_recap_x = 36 + recap_w + 16
        pdf.setFillColor(C_BG_CARD)
        pdf.setStrokeColor(C_BORDER)
        pdf.roundRect(right_recap_x, recap_y, recap_w, recap_h, 8, fill=True, stroke=True)

        pdf.setFillColor(C_TEXT_MUTED)
        pdf.setFont("Helvetica", 9)
        pdf.drawString(right_recap_x + 14, recap_y + recap_h - 24, "Sous-total Brut HT :")
        pdf.drawRightString(width - 50, recap_y + recap_h - 24, total_str)

        pdf.drawString(right_recap_x + 14, recap_y + recap_h - 42, "TVA & Taxes de séjour (0%) :")
        pdf.drawRightString(width - 50, recap_y + recap_h - 42, "0 Ar")

        # Total TTC Highlight in Dark Navy with Gold text
        pdf.setFillColor(C_NAVY_DARK)
        pdf.roundRect(right_recap_x, recap_y, recap_w, 36, 6, fill=True, stroke=False)

        pdf.setFillColor(colors.white)
        pdf.setFont("Helvetica-Bold", 10.5)
        pdf.drawString(right_recap_x + 14, recap_y + 13, "TOTAL TTC PAYÉ :")

        pdf.setFillColor(colors.HexColor("#FBBF24"))
        pdf.setFont("Helvetica-Bold", 13)
        pdf.drawRightString(width - 50, recap_y + 13, total_str)

        # =============================================================
        # 6. CONDITIONS & POLICIES CARD
        # =============================================================
        notes_y = recap_y - 110
        notes_h = 94
        pdf.setFillColor(C_BG_CARD)
        pdf.setStrokeColor(C_BORDER)
        pdf.roundRect(36, notes_y, width - 72, notes_h, 8, fill=True, stroke=True)

        pdf.setFillColor(C_NAVY_MEDIUM)
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(50, notes_y + notes_h - 20, "INFORMATIONS & CONDITIONS DE SÉJOUR")

        pdf.setFillColor(C_TEXT_MUTED)
        pdf.setFont("Helvetica", 8.5)
        pdf.drawString(50, notes_y + notes_h - 38, "• Arrivée (Check-in) à partir de 14h00 — Départ (Check-out) avant 11h00.")
        pdf.drawString(50, notes_y + notes_h - 53, "• Le présent document certifie la réception intégrale du montant du séjour et tient lieu de quittance définitive.")
        pdf.drawString(50, notes_y + notes_h - 68, "• Pour toute demande d'assistance ou prestation annexe, la réception reste à votre écoute 24h/24.")
        pdf.drawString(50, notes_y + notes_h - 83, "• Un dépôt de garantie ou une pièce d'identité peut être exigé lors de l'enregistrement.")

        # =============================================================
        # 7. OFFICIAL LUXURY FOOTER
        # =============================================================
        footer_y = 60
        pdf.setStrokeColor(C_BORDER)
        pdf.setLineWidth(1)
        pdf.line(36, footer_y + 24, width - 36, footer_y + 24)

        pdf.setFillColor(C_TEXT_MUTED)
        pdf.setFont("Helvetica-Bold", 8.5)
        pdf.drawCentredString(width / 2, footer_y + 10, "Document officiel généré électroniquement • Facture acquittée faisant foi de paiement intégral.")

        pdf.setFont("Helvetica", 8)
        pdf.drawCentredString(width / 2, footer_y - 4, "Nous vous remercions pour votre confiance et nous réjouissons de vous accueillir prochainement !")

        pdf.setFont("Helvetica", 7.5)
        pdf.drawCentredString(width / 2, footer_y - 18, f"{hotel.name} — {hotel_loc} • Système de Gestion Hôtelière")

        pdf.save()
        buffer.seek(0)
        return buffer

    except Exception:
        # Fallback to pure python PDF generation
        return _generate_pure_python_pdf(reservation, room, hotel, customer, payment)