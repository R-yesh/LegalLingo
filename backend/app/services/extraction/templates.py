"""Static, per-category guidance text used to fill Clause.simpleMeaning /
whyItMatters / whatToVerify.

This is generic legal-literacy guidance about what a clause of this
*category* typically means -- not an interpretation of this specific
document's content (that content is preserved verbatim in Clause.originalText).
Writing it as fixed templates (rather than generating prose per document)
keeps the deterministic engine honest: it never paraphrases or infers intent
from the actual clause text, which it has no reliable way to do without an
LLM.
"""
from app.schemas.common import Language

Template = dict[Language, str]
CategoryTemplate = dict[str, Template]

CLAUSE_TEMPLATES: dict[str, CategoryTemplate] = {
    "parties": {
        "title": {"en": "Parties to the Document", "hi": "दस्तावेज़ के पक्षकार", "mr": "दस्तऐवजातील पक्षकार"},
        "simple_meaning": {
            "en": "This section identifies who is entering into this agreement and in what capacity.",
            "hi": "यह भाग बताता है कि इस अनुबंध में कौन शामिल है और किस भूमिका में।",
            "mr": "या भागात या करारात कोण सामील आहे आणि कोणत्या भूमिकेत आहे हे नमूद केले आहे.",
        },
        "why_it_matters": {
            "en": "Confirms the legal identity of everyone bound by this document.",
            "hi": "यह पुष्टि करता है कि इस दस्तावेज़ से कौन-कौन कानूनी रूप से बाध्य है।",
            "mr": "या दस्तऐवजाने कोण कायदेशीररित्या बांधील आहे याची खात्री करते.",
        },
        "what_to_verify": {
            "en": "Match each name and address against a valid government ID.",
            "hi": "प्रत्येक नाम और पता किसी वैध सरकारी पहचान पत्र से मिलाएं।",
            "mr": "प्रत्येक नाव आणि पत्ता वैध सरकारी ओळखपत्राशी जुळवा.",
        },
    },
    "property": {
        "title": {"en": "Property Description", "hi": "संपत्ति का विवरण", "mr": "मालमत्तेचे वर्णन"},
        "simple_meaning": {
            "en": "This section describes the specific property covered by this document.",
            "hi": "यह भाग इस दस्तावेज़ के अंतर्गत आने वाली संपत्ति का विवरण देता है।",
            "mr": "या भागात या दस्तऐवजाद्वारे समाविष्ट असलेल्या मालमत्तेचे वर्णन आहे.",
        },
        "why_it_matters": {
            "en": "Ensures the transaction refers to the exact property you intend, not a similarly described one.",
            "hi": "यह सुनिश्चित करता है कि लेन-देन उसी संपत्ति से संबंधित है जिसका आप इरादा रखते हैं।",
            "mr": "व्यवहार तुम्हाला अपेक्षित असलेल्या मालमत्तेशीच संबंधित आहे याची खात्री करते.",
        },
        "what_to_verify": {
            "en": "Cross-check survey/plot numbers and boundaries against the property card or 7/12 extract.",
            "hi": "सर्वे/प्लॉट नंबर और सीमाओं को प्रॉपर्टी कार्ड या 7/12 उतारे से जांचें।",
            "mr": "सर्व्हे/प्लॉट क्रमांक व सीमा मालमत्ता पत्रक किंवा ७/१२ उताऱ्याशी तपासा.",
        },
    },
    "payment": {
        "title": {"en": "Payment Terms", "hi": "भुगतान की शर्तें", "mr": "देय अटी"},
        "simple_meaning": {
            "en": "This section explains how and when payment must be made.",
            "hi": "यह भाग बताता है कि भुगतान कैसे और कब किया जाना चाहिए।",
            "mr": "देय कसे व केव्हा करावे हे या भागात स्पष्ट केले आहे.",
        },
        "why_it_matters": {
            "en": "Missing a payment term or deadline here can affect your rights under the agreement.",
            "hi": "यहां किसी भुगतान शर्त या समय सीमा को न मानने से आपके अधिकार प्रभावित हो सकते हैं।",
            "mr": "येथील देय अट किंवा मुदत न पाळल्यास तुमच्या अधिकारांवर परिणाम होऊ शकतो.",
        },
        "what_to_verify": {
            "en": "Keep receipts for every payment and confirm amounts match this clause.",
            "hi": "हर भुगतान की रसीद रखें और राशि इस खंड से मिलाएं।",
            "mr": "प्रत्येक देयकाची पावती ठेवा आणि रक्कम या कलमाशी जुळते का ते तपासा.",
        },
    },
    "consideration": {
        "title": {"en": "Sale Consideration", "hi": "प्रतिफल राशि", "mr": "मोबदला रक्कम"},
        "simple_meaning": {
            "en": "This section states the total value agreed for the property/transaction.",
            "hi": "यह भाग संपत्ति/लेन-देन के लिए सहमत कुल मूल्य बताता है।",
            "mr": "मालमत्ता/व्यवहारासाठी मान्य केलेली एकूण किंमत या भागात नमूद आहे.",
        },
        "why_it_matters": {
            "en": "This figure is used for stamp duty calculation and is central to the transaction.",
            "hi": "यह राशि स्टाम्प शुल्क गणना के लिए उपयोग होती है और लेन-देन का केंद्र है।",
            "mr": "ही रक्कम मुद्रांक शुल्क गणनेसाठी वापरली जाते व व्यवहाराचा गाभा आहे.",
        },
        "what_to_verify": {
            "en": "Confirm this figure matches the sale deed and payment receipts.",
            "hi": "पुष्टि करें कि यह राशि विक्रय पत्र और भुगतान रसीदों से मेल खाती है।",
            "mr": "ही रक्कम विक्रीपत्र व देय पावत्यांशी जुळते का ते तपासा.",
        },
    },
    "possession": {
        "title": {"en": "Possession", "hi": "कब्ज़ा", "mr": "ताबा"},
        "simple_meaning": {
            "en": "This section states when and how possession of the property will be handed over.",
            "hi": "यह भाग बताता है कि संपत्ति का कब्ज़ा कब और कैसे सौंपा जाएगा।",
            "mr": "मालमत्तेचा ताबा केव्हा व कसा दिला जाईल हे या भागात नमूद आहे.",
        },
        "why_it_matters": {
            "en": "The possession date affects your right to occupy or use the property.",
            "hi": "कब्ज़े की तारीख संपत्ति में रहने या उपयोग करने के आपके अधिकार को प्रभावित करती है।",
            "mr": "ताब्याची तारीख मालमत्तेत राहण्याच्या किंवा वापरण्याच्या तुमच्या अधिकारावर परिणाम करते.",
        },
        "what_to_verify": {
            "en": "Confirm the property is actually vacant and available on the stated possession date.",
            "hi": "पुष्टि करें कि बताई गई कब्ज़ा तारीख पर संपत्ति वास्तव में खाली और उपलब्ध है।",
            "mr": "नमूद ताबा तारखेला मालमत्ता प्रत्यक्षात रिकामी व उपलब्ध आहे याची खात्री करा.",
        },
    },
    "mortgage_encumbrance": {
        "title": {"en": "Mortgage / Encumbrance Reference", "hi": "बंधक / भार संबंधी उल्लेख", "mr": "गहाण / बोजा संदर्भ"},
        "simple_meaning": {
            "en": "This section references a mortgage, charge, or encumbrance related to the property.",
            "hi": "यह भाग संपत्ति से संबंधित बंधक, प्रभार या भार का उल्लेख करता है।",
            "mr": "या भागात मालमत्तेशी संबंधित गहाण, प्रभार किंवा बोजाचा उल्लेख आहे.",
        },
        "why_it_matters": {
            "en": "An existing mortgage or charge can affect the seller's ability to transfer clear title.",
            "hi": "मौजूदा बंधक या प्रभार विक्रेता की स्पष्ट स्वामित्व हस्तांतरित करने की क्षमता को प्रभावित कर सकता है।",
            "mr": "विद्यमान गहाण किंवा प्रभार विक्रेत्याच्या स्पष्ट मालकी हस्तांतरणाच्या क्षमतेवर परिणाम करू शकतो.",
        },
        "what_to_verify": {
            "en": "Obtain a current Encumbrance Certificate (Index-II) from the Sub-Registrar before proceeding.",
            "hi": "आगे बढ़ने से पहले उप-पंजीयक से वर्तमान भार प्रमाण पत्र (इंडेक्स-II) प्राप्त करें।",
            "mr": "पुढे जाण्यापूर्वी दुय्यम निबंधकांकडून सद्यस्थितीचा बोजा दाखला (इंडेक्स-२) मिळवा.",
        },
    },
    "termination": {
        "title": {"en": "Termination", "hi": "समाप्ति", "mr": "समाप्ती"},
        "simple_meaning": {
            "en": "This section describes the conditions under which this agreement can be ended.",
            "hi": "यह भाग बताता है कि किन परिस्थितियों में यह अनुबंध समाप्त किया जा सकता है।",
            "mr": "कोणत्या परिस्थितीत हा करार संपुष्टात आणला जाऊ शकतो हे या भागात आहे.",
        },
        "why_it_matters": {
            "en": "Understanding termination conditions protects you from unexpected loss of rights.",
            "hi": "समाप्ति की शर्तों को समझना आपको अधिकारों की अप्रत्याशित हानि से बचाता है।",
            "mr": "समाप्तीच्या अटी समजून घेतल्यास अनपेक्षित अधिकार गमावण्यापासून संरक्षण मिळते.",
        },
        "what_to_verify": {
            "en": "Note any notice period or conditions required before either party can terminate.",
            "hi": "समाप्ति से पहले आवश्यक किसी सूचना अवधि या शर्तों को नोट करें।",
            "mr": "समाप्तीपूर्वी आवश्यक सूचना कालावधी किंवा अटी लक्षात घ्या.",
        },
    },
    "forfeiture": {
        "title": {"en": "Forfeiture / Penalty", "hi": "जब्ती / दंड", "mr": "जप्ती / दंड"},
        "simple_meaning": {
            "en": "This section describes amounts that may be forfeited or penalties that may apply on default.",
            "hi": "यह भाग बताता है कि चूक होने पर कौन-सी राशि जब्त हो सकती है या दंड लागू हो सकता है।",
            "mr": "चूक झाल्यास कोणती रक्कम जप्त होऊ शकते किंवा दंड लागू होऊ शकतो हे येथे आहे.",
        },
        "why_it_matters": {
            "en": "Forfeiture clauses can result in financial loss if obligations are not met on time.",
            "hi": "समय पर दायित्व पूरे न करने पर जब्ती खंड से वित्तीय हानि हो सकती है।",
            "mr": "वेळेत जबाबदाऱ्या पूर्ण न केल्यास जप्तीच्या कलमामुळे आर्थिक नुकसान होऊ शकते.",
        },
        "what_to_verify": {
            "en": "Understand exactly which payments or deadlines trigger forfeiture before signing.",
            "hi": "हस्ताक्षर करने से पहले समझें कि कौन-सा भुगतान या समय सीमा जब्ती का कारण बनती है।",
            "mr": "स्वाक्षरीपूर्वी कोणते देयक किंवा मुदत जप्तीस कारणीभूत ठरते हे नीट समजून घ्या.",
        },
    },
    "registration": {
        "title": {"en": "Registration Details", "hi": "पंजीकरण विवरण", "mr": "नोंदणी तपशील"},
        "simple_meaning": {
            "en": "This section relates to the official registration of this document.",
            "hi": "यह भाग इस दस्तावेज़ के आधिकारिक पंजीकरण से संबंधित है।",
            "mr": "हा भाग या दस्तऐवजाच्या अधिकृत नोंदणीशी संबंधित आहे.",
        },
        "why_it_matters": {
            "en": "A registered document carries stronger legal standing than an unregistered one.",
            "hi": "पंजीकृत दस्तावेज़ की कानूनी स्थिति अपंजीकृत दस्तावेज़ से अधिक मजबूत होती है।",
            "mr": "नोंदणीकृत दस्तऐवजाला अनोंदणीकृत दस्तऐवजापेक्षा अधिक कायदेशीर बळ असते.",
        },
        "what_to_verify": {
            "en": "Confirm the registration number and Sub-Registrar office on the IGR portal.",
            "hi": "IGR पोर्टल पर पंजीकरण संख्या और उप-पंजीयक कार्यालय की पुष्टि करें।",
            "mr": "IGR पोर्टलवर नोंदणी क्रमांक व दुय्यम निबंधक कार्यालयाची खात्री करा.",
        },
    },
    "dispute_jurisdiction": {
        "title": {"en": "Dispute Resolution & Jurisdiction", "hi": "विवाद समाधान और क्षेत्राधिकार", "mr": "वाद निवारण व अधिकारक्षेत्र"},
        "simple_meaning": {
            "en": "This section states how disputes will be resolved and which courts or forum apply.",
            "hi": "यह भाग बताता है कि विवादों का समाधान कैसे होगा और कौन-सी अदालतें लागू होंगी।",
            "mr": "वादांचे निवारण कसे होईल व कोणते न्यायालय लागू असेल हे येथे नमूद आहे.",
        },
        "why_it_matters": {
            "en": "This determines where and how you would need to pursue a legal remedy if a dispute arises.",
            "hi": "यह तय करता है कि विवाद होने पर आपको कहां और कैसे कानूनी उपाय अपनाना होगा।",
            "mr": "वाद झाल्यास तुम्हाला कुठे व कसा कायदेशीर मार्ग अवलंबावा लागेल हे हे ठरवते.",
        },
        "what_to_verify": {
            "en": "Note the named jurisdiction/forum, especially if it is far from your residence.",
            "hi": "उल्लिखित क्षेत्राधिकार/मंच को नोट करें, विशेष रूप से यदि यह आपके निवास से दूर है।",
            "mr": "नमूद अधिकारक्षेत्र/मंच लक्षात घ्या, विशेषतः तो तुमच्या निवासस्थानापासून दूर असल्यास.",
        },
    },
    "witnesses": {
        "title": {"en": "Witnesses", "hi": "गवाह", "mr": "साक्षीदार"},
        "simple_meaning": {
            "en": "This section identifies the witnesses attesting to the signing of this document.",
            "hi": "यह भाग इस दस्तावेज़ पर हस्ताक्षर के साक्षियों की पहचान करता है।",
            "mr": "या दस्तऐवजावरील स्वाक्षरीचे साक्ष देणाऱ्या साक्षीदारांची ओळख येथे आहे.",
        },
        "why_it_matters": {
            "en": "Witnesses can be material if the authenticity of signatures is ever questioned.",
            "hi": "यदि हस्ताक्षरों की प्रामाणिकता पर कभी सवाल उठे तो साक्षी महत्वपूर्ण हो सकते हैं।",
            "mr": "स्वाक्षरींच्या सत्यतेवर प्रश्न उठल्यास साक्षीदार महत्त्वाचे ठरू शकतात.",
        },
        "what_to_verify": {
            "en": "Confirm witnesses are independent and their contact details are recorded.",
            "hi": "पुष्टि करें कि साक्षी स्वतंत्र हैं और उनके संपर्क विवरण दर्ज हैं।",
            "mr": "साक्षीदार स्वतंत्र आहेत व त्यांचे संपर्क तपशील नोंदवले आहेत याची खात्री करा.",
        },
    },
    "general": {
        "title": {"en": "General Clause", "hi": "सामान्य खंड", "mr": "सर्वसाधारण कलम"},
        "simple_meaning": {
            "en": "This is a general clause from the document. Read the original text for full context.",
            "hi": "यह दस्तावेज़ का एक सामान्य खंड है। पूर्ण संदर्भ के लिए मूल पाठ पढ़ें।",
            "mr": "हे दस्तऐवजातील सर्वसाधारण कलम आहे. संपूर्ण संदर्भासाठी मूळ मजकूर वाचा.",
        },
        "why_it_matters": {
            "en": "Every clause forms part of the binding agreement and should be reviewed.",
            "hi": "हर खंड बाध्यकारी अनुबंध का हिस्सा है और इसकी समीक्षा की जानी चाहिए।",
            "mr": "प्रत्येक कलम बंधनकारक कराराचा भाग आहे आणि त्याचे पुनरावलोकन करावे.",
        },
        "what_to_verify": {
            "en": "Read this clause carefully in the original document.",
            "hi": "मूल दस्तावेज़ में इस खंड को ध्यान से पढ़ें।",
            "mr": "मूळ दस्तऐवजातील हे कलम काळजीपूर्वक वाचा.",
        },
    },
}


def get_template(internal_category: str) -> CategoryTemplate:
    return CLAUSE_TEMPLATES.get(internal_category, CLAUSE_TEMPLATES["general"])
