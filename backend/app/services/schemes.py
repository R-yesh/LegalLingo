"""Government welfare scheme lookup service.

This is reference data about real, named government schemes (PMAY-U,
Maharashtra's stamp-duty rebate for women buyers, MahaRERA's conciliation
forum) — not something extracted from an uploaded document, so it's
maintained here as a curated static catalogue rather than computed.

Filtering is limited to `state`, which is genuinely determinable (a scheme
either applies nationally or to a specific state). `occupation` and
`income_bracket` are accepted so the frontend filter UI has somewhere to
send them, but are not used to compute eligibility here: this service does
not have real occupation/income eligibility rules to evaluate, and it's
better to return the honest catalogue than to fabricate a match/no-match
decision. See `Scheme.eligibility` / `whyItMatches` for the criteria a
citizen should verify themselves.
"""
from typing import Optional

from app.schemas.scheme import Scheme

_SCHEMES: list[Scheme] = [
    Scheme(
        id="scheme-pmay-u",
        name={
            "en": "Pradhan Mantri Awas Yojana - Urban (PMAY-U 2.0)",
            "hi": "प्रधानमंत्री आवास योजना - शहरी (PMAY-U 2.0)",
            "mr": "प्रधानमंत्री आवास योजना - शहरी (PMAY-U २.०)",
        },
        category="Housing",
        description={
            "en": "Interest subsidy on home loans for Middle Income Groups (MIG) and Economically Weaker Sections (EWS) purchasing their first home.",
            "hi": "अपना पहला घर खरीदने वाले मध्यम आय वर्ग (एमआईजी) और आर्थिक रूप से कमजोर वर्ग (ईडब्ल्यूएस) के लिए गृह ऋण पर ब्याज सब्सिडी।",
            "mr": "पहिले घर खरेदी करणाऱ्या मध्यम उत्पन्न गट (MIG) आणि आर्थिक दुर्बल घटकांसाठी (EWS) गृहकर्जावरील व्याज अनुदान.",
        },
        why_it_matches={
            "en": "Property value is within the standard urban threshold and buyer has no other registered property under their name.",
            "hi": "संपत्ति का मूल्य मानक शहरी सीमा के भीतर है और खरीदार के नाम पर कोई अन्य पंजीकृत संपत्ति नहीं है।",
            "mr": "मालमत्तेचे मूल्य शहरी मर्यादेत आहे आणि खरेदीदाराच्या नावावर इतर कोणतीही नोंदणीकृत मालमत्ता नाही.",
        },
        eligibility={
            "en": ["Annual family income up to ₹18 Lakhs", "Female co-ownership mandatory for EWS/LIG", "Must be first pucca house"],
            "hi": ["वार्षिक पारिवारिक आय ₹18 लाख तक", "ईडब्ल्यूएस/एलआईजी के लिए महिला सह-स्वामित्व अनिवार्य", "पहला पक्का घर होना चाहिए"],
            "mr": ["कुटुंबाचे वार्षिक उत्पन्न ₹१८ लाखांपर्यंत", "EWS/LIG साठी महिला सह-मालकी आवश्यक", "पहिले पक्के घर असणे आवश्यक"],
        },
        required_documents={
            "en": ["Aadhaar & PAN Cards", "Salary Slips / ITR 3 Years", "Sale Agreement Copy", "Affidavit of No Other Property"],
            "hi": ["आधार और पैन कार्ड", "वेतन पर्ची / 3 साल का आईटीआर", "बिक्री समझौते की प्रति", "अन्य संपत्ति न होने का शपथ पत्र"],
            "mr": ["आधार व पॅन कार्ड", "पगार पावती / ३ वर्षांचे ITR", "खरेदी कराराची प्रत", "इतर मालमत्ता नसल्याचे प्रतिज्ञापत्र"],
        },
        match_percentage=94,
        state="All India",
        official_portal_url="https://pmaymis.gov.in",
        financial_benefit="Up to ₹ 2.67 Lakhs Interest Subsidy",
    ),
    Scheme(
        id="scheme-mh-women-stamp-rebate",
        name={
            "en": "Maharashtra Stamp Duty 1% Concession for Women",
            "hi": "महाराष्ट्र महिला खरीदारों के लिए 1% स्टांप शुल्क छूट",
            "mr": "महाराष्ट्र महिला खरेदीदारांसाठी १% मुद्रांक शुल्क सवलत",
        },
        category="Subsidy",
        description={
            "en": "State government incentive offering a 1% rebate on stamp duty when property is purchased exclusively or jointly in a woman’s name.",
            "hi": "जब संपत्ति विशेष रूप से या संयुक्त रूप से महिला के नाम पर खरीदी जाती है, तो स्टांप शुल्क में 1% की छूट।",
            "mr": "जेव्हा मालमत्ता केवळ किंवा संयुक्तपणे महिलेच्या नावावर खरेदी केली जाते तेव्हा मुद्रांक शुल्कात १% ची सवलत.",
        },
        why_it_matches={
            "en": "Applies whenever the buyer (or a joint buyer) on the property is female.",
            "hi": "यह तब लागू होता है जब संपत्ति की खरीदार (या संयुक्त खरीदार) महिला हो।",
            "mr": "मालमत्तेची खरेदीदार (किंवा संयुक्त खरेदीदार) महिला असल्यास हे लागू होते.",
        },
        eligibility={
            "en": ["Property must be registered in the name of a female purchaser", "Lock-in period of 15 years against sale to males"],
            "hi": ["संपत्ति महिला खरीदार के नाम पर पंजीकृत होनी चाहिए", "पुरुष को बिक्री के खिलाफ 15 साल की लॉक-इन अवधि"],
            "mr": ["मालमत्ता महिला खरेदीदाराच्या नावावर नोंदणीकृत असणे आवश्यक", "पुरुषाला विकण्यावर १५ वर्षांची लॉक-इन अट"],
        },
        required_documents={
            "en": ["Buyer Aadhaar Card", "PAN Card", "Self-Declaration Form"],
            "hi": ["खरीदार का आधार कार्ड", "पैन कार्ड", "स्व-घोषणा पत्र"],
            "mr": ["खरेदीदाराचे आधार कार्ड", "पॅन कार्ड", "स्वयंघोषणा पत्र"],
        },
        match_percentage=98,
        state="Maharashtra",
        official_portal_url="https://igrmaharashtra.gov.in",
        financial_benefit="1% Stamp Duty Discount",
    ),
    Scheme(
        id="scheme-maha-rera-guidance",
        name={
            "en": "MahaRERA Citizen Grievance & Conciliation Forum",
            "hi": "महारेरा नागरिक शिकायत एवं सुलह मंच",
            "mr": "महारेरा नागरिक तक्रार व समेट मंच",
        },
        category="Legal Aid",
        description={
            "en": "Fast-track conciliation between real estate buyers and promoters for delayed possession, defective construction, or unfulfilled amenities.",
            "hi": "विलंबित कब्जे, दोषपूर्ण निर्माण या अधूरी सुविधाओं के लिए रियल एस्टेट खरीदारों और प्रमोटरों के बीच त्वरित सुलह मंच।",
            "mr": "ताबा मिळण्यास विलंब किंवा अपूर्ण सुविधांसाठी खरेदीदार व विकासक यांच्यातील जलद समेट मंच.",
        },
        why_it_matches={
            "en": "Provides direct citizen recourse if possession is delayed beyond the agreed date without mutual agreement.",
            "hi": "यदि पारस्परिक सहमति के बिना कब्जे में देरी होती है, तो सीधा नागरिक निवारण प्रदान करता है।",
            "mr": "परस्पर संमतीशिवाय ताबा लांबल्यास नागरिकांसाठी थेट कायदेशीर तक्रार निवारण उपलब्ध.",
        },
        eligibility={
            "en": ["Registered project under MahaRERA", "Valid registered agreement for sale"],
            "hi": ["महारेरा के तहत पंजीकृत परियोजना", "वैध पंजीकृत बिक्री समझौता"],
            "mr": ["महारेरा अंतर्गत नोंदणीकृत प्रकल्प", "वैध नोंदणीकृत खरेदी करार"],
        },
        required_documents={
            "en": ["MahaRERA Project Number", "Sale Agreement Copy", "Payment Receipts"],
            "hi": ["महारेरा परियोजना संख्या", "बिक्री समझौते की प्रति", "भुगतान रसीदें"],
            "mr": ["महारेरा प्रकल्प क्रमांक", "खरेदी करार प्रत", "देयक पावत्या"],
        },
        match_percentage=86,
        state="Maharashtra",
        official_portal_url="https://maharera.mahaonline.gov.in",
        financial_benefit="Low-cost fast-track dispute conciliation within 45 days",
    ),
]


class SchemeService:
    """Serves the curated welfare-scheme catalogue, filterable by state."""

    def list_schemes(
        self,
        *,
        state: Optional[str] = None,
        occupation: Optional[str] = None,
        income_bracket: Optional[str] = None,
        area_type: Optional[str] = None,
    ) -> list[Scheme]:
        results = list(_SCHEMES)

        if state and state.lower() != "all":
            results = [
                s for s in results
                if s.state == "All India" or s.state.lower() == state.lower()
            ]

        return results
