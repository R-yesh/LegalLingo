"""Deterministic validation rules: turns extracted facts into AttentionItems.

Every rule here flags something for the citizen to verify -- it never
declares a document fraudulent, illegal, or invalid. Wording is kept to
"verify", "confirm", "check with the relevant authority".
"""
import uuid
from collections import defaultdict

from app.schemas.analysis import AttentionItem, ImportantDate
from app.schemas.clause import Clause, ExtractedField
from app.schemas.document import DocumentParty

NO_LINKED_CLAUSE = "n/a"


def _item_id() -> str:
    return f"att-{uuid.uuid4().hex[:10]}"


def _bilingual(en: str, hi: str, mr: str) -> dict[str, str]:
    return {"en": en, "hi": hi, "mr": mr}


def _find_clause_for_category(clauses: list[Clause], category: str) -> Clause | None:
    for clause in clauses:
        if clause.category == category:
            return clause
    return None


def rule_mortgage_encumbrance(
    mortgage_mentions: list[dict], clauses: list[Clause]
) -> list[AttentionItem]:
    items: list[AttentionItem] = []
    active_mentions = [m for m in mortgage_mentions if m["is_active_mention"]]
    if not active_mentions:
        return items

    related_clause = _find_clause_for_category(clauses, "encumbrance")
    primary = active_mentions[0]

    items.append(
        AttentionItem(
            id=_item_id(),
            clause_id=related_clause.id if related_clause else NO_LINKED_CLAUSE,
            title=_bilingual(
                "Mortgage / Encumbrance Reference Found",
                "बंधक / भार का उल्लेख मिला",
                "गहाण / बोजा संदर्भ आढळला",
            ),
            severity="HIGH ATTENTION",
            short_explanation=_bilingual(
                f'The document references a mortgage, charge, or encumbrance: "{primary["snippet"]}"',
                "दस्तावेज़ में बंधक, प्रभार या भार का उल्लेख है। विवरण के लिए अंग्रेज़ी पाठ देखें।",
                "दस्तऐवजात गहाण, प्रभार किंवा बोजाचा उल्लेख आहे. तपशीलासाठी इंग्रजी मजकूर पहा.",
            ),
            why_it_matters=_bilingual(
                "An existing mortgage or charge can affect the seller's ability to transfer clear, unencumbered title.",
                "मौजूदा बंधक या प्रभार विक्रेता की स्पष्ट स्वामित्व हस्तांतरित करने की क्षमता को प्रभावित कर सकता है।",
                "विद्यमान गहाण किंवा प्रभार विक्रेत्याच्या स्पष्ट मालकी हस्तांतरणाच्या क्षमतेवर परिणाम करू शकतो.",
            ),
            recommended_action=_bilingual(
                "Obtain a current Encumbrance Certificate (Index-II) from the Sub-Registrar before proceeding.",
                "आगे बढ़ने से पहले उप-पंजीयक से वर्तमान भार प्रमाण पत्र (इंडेक्स-II) प्राप्त करें।",
                "पुढे जाण्यापूर्वी दुय्यम निबंधकांकडून सद्यस्थितीचा बोजा दाखला (इंडेक्स-२) मिळवा.",
            ),
            evidence_page=primary["page"],
            evidence_clause=related_clause.clause_number if related_clause else NO_LINKED_CLAUSE,
            confidence=0.7,
        )
    )
    return items


ROLES_ALLOWING_MULTIPLE_NAMES = {"Witness", "Bank / Lender", "Other"}


def rule_name_mismatch(party_fields: list[ExtractedField], parties: list[DocumentParty]) -> list[AttentionItem]:
    items: list[AttentionItem] = []
    by_role: dict[str, list[DocumentParty]] = defaultdict(list)
    for party in parties:
        if party.role not in ROLES_ALLOWING_MULTIPLE_NAMES:
            by_role[party.role].append(party)

    for role, entries in by_role.items():
        distinct_names = {p.name.lower() for p in entries}
        if len(distinct_names) <= 1:
            continue
        names_list = ", ".join(sorted({p.name for p in entries}))
        matching_field = next((f for f in party_fields if f.label == f"Party ({role})"), None)
        items.append(
            AttentionItem(
                id=_item_id(),
                clause_id=NO_LINKED_CLAUSE,
                title=_bilingual(
                    "Possible Name Mismatch",
                    "संभावित नाम बेमेल",
                    "संभाव्य नाव विसंगती",
                ),
                severity="REVIEW",
                short_explanation=_bilingual(
                    f'Multiple different names were found for the role "{role}": {names_list}.',
                    "एक ही भूमिका के लिए दस्तावेज़ में अलग-अलग नाम पाए गए। विवरण के लिए अंग्रेज़ी पाठ देखें।",
                    "एकाच भूमिकेसाठी दस्तऐवजात वेगवेगळी नावे आढळली. तपशीलासाठी इंग्रजी मजकूर पहा.",
                ),
                why_it_matters=_bilingual(
                    "A name inconsistency can indicate an OCR/extraction reading error, or an actual discrepancy that needs clarification.",
                    "नाम में असंगति निष्कर्षण त्रुटि या वास्तविक विसंगति का संकेत हो सकती है, जिसे स्पष्ट करना आवश्यक है।",
                    "नावातील विसंगती वाचन त्रुटी किंवा प्रत्यक्ष तफावत दर्शवू शकते, जी स्पष्ट करणे आवश्यक आहे.",
                ),
                recommended_action=_bilingual(
                    "Cross-check each name against the parties' government-issued ID documents.",
                    "प्रत्येक नाम को पक्षकारों के सरकारी पहचान दस्तावेज़ों से जांचें।",
                    "प्रत्येक नाव पक्षकारांच्या सरकारी ओळखपत्रांशी तपासा.",
                ),
                evidence_page=matching_field.page_number if matching_field and matching_field.page_number else 1,
                evidence_clause=NO_LINKED_CLAUSE,
                confidence=0.5,
            )
        )
    return items


def rule_property_identifier_mismatch(property_fields: list[ExtractedField]) -> list[AttentionItem]:
    items: list[AttentionItem] = []
    by_label: dict[str, list[ExtractedField]] = defaultdict(list)
    for field in property_fields:
        if field.label != "Property Location":
            by_label[field.label].append(field)

    for label, entries in by_label.items():
        distinct_values = {e.value.lower() for e in entries}
        if len(distinct_values) <= 1:
            continue
        values_list = ", ".join(sorted({e.value for e in entries}))
        items.append(
            AttentionItem(
                id=_item_id(),
                clause_id=NO_LINKED_CLAUSE,
                title=_bilingual(
                    "Multiple Property Identifier Values Found",
                    "संपत्ति पहचानकर्ता के कई मान मिले",
                    "मालमत्ता ओळख क्रमांकाची अनेक मूल्ये आढळली",
                ),
                severity="REVIEW",
                short_explanation=_bilingual(
                    f'Different values were found for "{label}": {values_list}.',
                    "एक ही पहचानकर्ता के लिए दस्तावेज़ में अलग-अलग मान पाए गए। विवरण के लिए अंग्रेज़ी पाठ देखें।",
                    "एकाच ओळख क्रमांकासाठी दस्तऐवजात वेगवेगळी मूल्ये आढळली. तपशीलासाठी इंग्रजी मजकूर पहा.",
                ),
                why_it_matters=_bilingual(
                    "This may refer to multiple parcels, or may indicate a typographical inconsistency that should be clarified.",
                    "यह कई भूखंडों को संदर्भित कर सकता है, या एक टाइपोग्राफिकल असंगति हो सकती है जिसे स्पष्ट करना चाहिए।",
                    "हे अनेक भूखंडांना संदर्भित करू शकते, किंवा टंकलेखन विसंगती असू शकते जी स्पष्ट करावी.",
                ),
                recommended_action=_bilingual(
                    "Verify the correct identifier against the property card / 7-12 extract before proceeding.",
                    "आगे बढ़ने से पहले सही पहचानकर्ता को प्रॉपर्टी कार्ड / 7-12 उतारे से सत्यापित करें।",
                    "पुढे जाण्यापूर्वी योग्य ओळख क्रमांक मालमत्ता पत्रक / ७-१२ उताऱ्याशी तपासा.",
                ),
                evidence_page=entries[0].page_number or 1,
                evidence_clause=NO_LINKED_CLAUSE,
                confidence=0.5,
            )
        )
    return items


def rule_amount_mismatch(numeric_values: dict[str, list[float]], financial_fields: list[ExtractedField]) -> list[AttentionItem]:
    from app.services.extraction.text_utils import amounts_roughly_equal

    items: list[AttentionItem] = []

    total_values = numeric_values.get("totalAmount", [])
    if len(set(total_values)) > 1:
        field = next((f for f in financial_fields if f.label == "Total Consideration"), None)
        items.append(
            AttentionItem(
                id=_item_id(),
                clause_id=NO_LINKED_CLAUSE,
                title=_bilingual(
                    "Multiple Total Amounts Found",
                    "कई कुल राशियां मिलीं",
                    "अनेक एकूण रक्कमा आढळल्या",
                ),
                severity="REVIEW",
                short_explanation=_bilingual(
                    f"Different total consideration figures were found: {sorted(set(total_values))}.",
                    "दस्तावेज़ में अलग-अलग कुल प्रतिफल राशियां पाई गईं। विवरण के लिए अंग्रेज़ी पाठ देखें।",
                    "दस्तऐवजात वेगवेगळ्या एकूण मोबदला रक्कमा आढळल्या. तपशीलासाठी इंग्रजी मजकूर पहा.",
                ),
                why_it_matters=_bilingual(
                    "Conflicting figures for the total amount can affect stamp duty calculation and the payment schedule.",
                    "कुल राशि के विरोधाभासी आंकड़े स्टाम्प शुल्क गणना और भुगतान अनुसूची को प्रभावित कर सकते हैं।",
                    "एकूण रकमेतील परस्परविरोधी आकडे मुद्रांक शुल्क गणना व देय वेळापत्रकावर परिणाम करू शकतात.",
                ),
                recommended_action=_bilingual(
                    "Confirm the correct total amount directly with both parties before proceeding.",
                    "आगे बढ़ने से पहले दोनों पक्षों से सीधे सही कुल राशि की पुष्टि करें।",
                    "पुढे जाण्यापूर्वी दोन्ही पक्षांकडून थेट योग्य एकूण रक्कम निश्चित करा.",
                ),
                evidence_page=field.page_number if field and field.page_number else 1,
                evidence_clause=NO_LINKED_CLAUSE,
                confidence=0.5,
            )
        )

    total = numeric_values.get("totalAmount", [])
    advance = numeric_values.get("advancePaid", [])
    balance = numeric_values.get("balanceDue", [])
    if total and advance and balance:
        expected_total = advance[0] + balance[0]
        if not amounts_roughly_equal(total[0], expected_total, tolerance=0.05):
            items.append(
                AttentionItem(
                    id=_item_id(),
                    clause_id=NO_LINKED_CLAUSE,
                    title=_bilingual(
                        "Payment Breakdown Does Not Add Up",
                        "भुगतान विवरण का योग मेल नहीं खाता",
                        "देय तपशीलाची बेरीज जुळत नाही",
                    ),
                    severity="REVIEW",
                    short_explanation=_bilingual(
                        f"Advance (Rs. {advance[0]:,.0f}) plus balance (Rs. {balance[0]:,.0f}) does not match the stated total (Rs. {total[0]:,.0f}).",
                        "अग्रिम राशि और शेष राशि का योग बताई गई कुल राशि से मेल नहीं खाता।",
                        "आगाऊ रक्कम व शिल्लक रकमेची बेरीज नमूद एकूण रकमेशी जुळत नाही.",
                    ),
                    why_it_matters=_bilingual(
                        "A mismatched payment breakdown should be clarified before making further payments.",
                        "आगे भुगतान करने से पहले असंगत भुगतान विवरण को स्पष्ट किया जाना चाहिए।",
                        "पुढील देयक करण्यापूर्वी विसंगत देय तपशील स्पष्ट करावा.",
                    ),
                    recommended_action=_bilingual(
                        "Ask for a clear, itemized payment schedule from the other party.",
                        "दूसरे पक्ष से स्पष्ट, मदवार भुगतान अनुसूची मांगें।",
                        "दुसऱ्या पक्षाकडून स्पष्ट, तपशीलवार देय वेळापत्रक मागा.",
                    ),
                    evidence_page=1,
                    evidence_clause=NO_LINKED_CLAUSE,
                    confidence=0.5,
                )
            )
    return items


def rule_date_inconsistency(labeled_dates: dict) -> list[AttentionItem]:
    items: list[AttentionItem] = []
    execution = labeled_dates.get("Execution Date")
    registration = labeled_dates.get("Registration Date")
    possession = labeled_dates.get("Possession Date")

    if execution and registration and registration < execution:
        items.append(
            AttentionItem(
                id=_item_id(),
                clause_id=NO_LINKED_CLAUSE,
                title=_bilingual(
                    "Date Sequence Needs Verification",
                    "तारीख क्रम की पुष्टि आवश्यक",
                    "तारीख क्रम पडताळणी आवश्यक",
                ),
                severity="REVIEW",
                short_explanation=_bilingual(
                    "The registration date appears to be earlier than the execution date.",
                    "पंजीकरण तारीख निष्पादन तारीख से पहले प्रतीत होती है।",
                    "नोंदणी तारीख अंमलबजावणी तारखेपूर्वीची दिसते.",
                ),
                why_it_matters=_bilingual(
                    "Documents are ordinarily registered on or after execution; an unusual order should be clarified.",
                    "दस्तावेज़ आमतौर पर निष्पादन के बाद पंजीकृत होते हैं; असामान्य क्रम को स्पष्ट किया जाना चाहिए।",
                    "दस्तऐवज साधारणपणे अंमलबजावणीनंतर नोंदणीकृत होतात; असामान्य क्रम स्पष्ट करावा.",
                ),
                recommended_action=_bilingual(
                    "Confirm both dates against the original signed and registered copies.",
                    "दोनों तारीखों की मूल हस्ताक्षरित और पंजीकृत प्रतियों से पुष्टि करें।",
                    "दोन्ही तारखा मूळ स्वाक्षरीकृत व नोंदणीकृत प्रतींशी तपासा.",
                ),
                evidence_page=1,
                evidence_clause=NO_LINKED_CLAUSE,
                confidence=0.5,
            )
        )

    if execution and possession and possession < execution:
        items.append(
            AttentionItem(
                id=_item_id(),
                clause_id=NO_LINKED_CLAUSE,
                title=_bilingual(
                    "Possession Date Precedes Execution Date",
                    "कब्ज़ा तारीख निष्पादन तारीख से पहले है",
                    "ताबा तारीख अंमलबजावणी तारखेपूर्वी आहे",
                ),
                severity="REVIEW",
                short_explanation=_bilingual(
                    "The stated possession date is earlier than the stated execution date.",
                    "बताई गई कब्ज़ा तारीख निष्पादन तारीख से पहले की है।",
                    "नमूद ताबा तारीख अंमलबजावणी तारखेपेक्षा आधीची आहे.",
                ),
                why_it_matters=_bilingual(
                    "This sequence is unusual and worth confirming to avoid misunderstanding possession rights.",
                    "यह क्रम असामान्य है और कब्ज़े के अधिकारों में गलतफहमी से बचने के लिए इसकी पुष्टि आवश्यक है।",
                    "हा क्रम असामान्य आहे व ताबा हक्कांबाबत गैरसमज टाळण्यासाठी याची खात्री करावी.",
                ),
                recommended_action=_bilingual(
                    "Clarify the intended possession date directly with the other party.",
                    "दूसरे पक्ष से सीधे इच्छित कब्ज़ा तारीख स्पष्ट करें।",
                    "दुसऱ्या पक्षाकडून थेट अपेक्षित ताबा तारीख स्पष्ट करून घ्या.",
                ),
                evidence_page=1,
                evidence_clause=NO_LINKED_CLAUSE,
                confidence=0.5,
            )
        )
    return items


def rule_missing_information(
    parties: list[DocumentParty],
    numeric_values: dict[str, list[float]],
    important_dates: list[ImportantDate],
    property_fields: list[ExtractedField],
) -> list[AttentionItem]:
    items: list[AttentionItem] = []

    def add(key: str, severity: str, title_en: str, title_hi: str, title_mr: str,
             detail_en: str, detail_hi: str, detail_mr: str):
        items.append(
            AttentionItem(
                id=_item_id(),
                clause_id=NO_LINKED_CLAUSE,
                title=_bilingual(title_en, title_hi, title_mr),
                severity=severity,
                short_explanation=_bilingual(detail_en, detail_hi, detail_mr),
                why_it_matters=_bilingual(
                    "Missing information limits how much this document can be automatically verified.",
                    "जानकारी की कमी इस दस्तावेज़ के स्वचालित सत्यापन को सीमित करती है।",
                    "माहितीच्या अभावामुळे या दस्तऐवजाची स्वयंचलित पडताळणी मर्यादित होते.",
                ),
                recommended_action=_bilingual(
                    "Review the original document manually for this information, or consult the concerned party.",
                    "इस जानकारी के लिए मूल दस्तावेज़ को स्वयं जांचें, या संबंधित पक्ष से परामर्श करें।",
                    "या माहितीसाठी मूळ दस्तऐवज स्वतः तपासा, किंवा संबंधित पक्षाशी संपर्क साधा.",
                ),
                evidence_page=1,
                evidence_clause=NO_LINKED_CLAUSE,
                confidence=0.4,
            )
        )

    if not parties:
        add(
            "parties", "HIGH ATTENTION",
            "No Parties Identified", "कोई पक्षकार नहीं मिला", "कोणतेही पक्षकार आढळले नाहीत",
            "The automated review could not identify any named parties in this document.",
            "स्वचालित समीक्षा में इस दस्तावेज़ में कोई नामित पक्षकार नहीं मिला।",
            "स्वयंचलित पुनरावलोकनात या दस्तऐवजात कोणतेही नामांकित पक्षकार आढळले नाहीत.",
        )

    if not any(numeric_values.get(k) for k in ("totalAmount", "advancePaid", "balanceDue")):
        add(
            "amount", "REVIEW",
            "No Amount Identified", "कोई राशि नहीं मिली", "कोणतीही रक्कम आढळली नाही",
            "The automated review could not identify a total, advance, or balance amount in this document.",
            "स्वचालित समीक्षा में कुल, अग्रिम या शेष राशि नहीं मिली।",
            "स्वयंचलित पुनरावलोकनात एकूण, आगाऊ किंवा शिल्लक रक्कम आढळली नाही.",
        )

    if not important_dates:
        add(
            "dates", "REVIEW",
            "No Dates Identified", "कोई तारीख नहीं मिली", "कोणतीही तारीख आढळली नाही",
            "The automated review could not identify any dates in this document.",
            "स्वचालित समीक्षा में इस दस्तावेज़ में कोई तारीख नहीं मिली।",
            "स्वयंचलित पुनरावलोकनात या दस्तऐवजात कोणतीही तारीख आढळली नाही.",
        )

    if not property_fields:
        add(
            "property", "REVIEW",
            "No Property Identifier Found", "कोई संपत्ति पहचानकर्ता नहीं मिला", "मालमत्ता ओळख क्रमांक आढळला नाही",
            "The automated review could not identify a survey/plot number or property location in this document.",
            "स्वचालित समीक्षा में सर्वे/प्लॉट नंबर या संपत्ति स्थान नहीं मिला।",
            "स्वयंचलित पुनरावलोकनात सर्व्हे/प्लॉट क्रमांक किंवा मालमत्ता स्थान आढळले नाही.",
        )

    return items


def evaluate_all(
    *,
    parties: list[DocumentParty],
    party_fields: list[ExtractedField],
    financial_fields: list[ExtractedField],
    numeric_values: dict[str, list[float]],
    important_dates: list[ImportantDate],
    labeled_dates: dict,
    property_fields: list[ExtractedField],
    mortgage_mentions: list[dict],
    clauses: list[Clause],
) -> list[AttentionItem]:
    items: list[AttentionItem] = []
    items += rule_mortgage_encumbrance(mortgage_mentions, clauses)
    items += rule_name_mismatch(party_fields, parties)
    items += rule_property_identifier_mismatch(property_fields)
    items += rule_amount_mismatch(numeric_values, financial_fields)
    items += rule_date_inconsistency(labeled_dates)
    items += rule_missing_information(parties, numeric_values, important_dates, property_fields)
    return items
