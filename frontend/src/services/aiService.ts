import { AIMessage, Language, Clause } from '../types';

export interface AISendMessageOptions {
  documentId?: string;
  clauseId?: string;
  activeClause?: Clause | null;
  language: Language;
  history: AIMessage[];
}

export async function sendAIMessage(
  query: string,
  options: AISendMessageOptions
): Promise<AIMessage> {
  // Simulate network delay for AI processing
  await new Promise(r => setTimeout(r, 600));

  const lang = options.language;
  const activeClause = options.activeClause;

  let responseContent = '';
  const followUps: string[] = [];

  if (activeClause) {
    if (lang === 'hi') {
      responseContent = `इस शर्त "${activeClause.clauseNumber} - ${activeClause.title}" के संबंध में: यह शर्त यह सुनिश्चित करती है कि ${activeClause.simpleMeaning.hi}। आपको सलाह दी जाती है कि: ${activeClause.whatToVerify.hi}।`;
      followUps.push('क्या यह शर्त दोनों पक्षों पर समान रूप से लागू होती है?', 'यदि विक्रेता इस शर्त का उल्लंघन करता है तो क्या करें?');
    } else if (lang === 'mr') {
      responseContent = `या कलम "${activeClause.clauseNumber} - ${activeClause.title}" बाबत: हे कलम असे स्पष्ट करते की ${activeClause.simpleMeaning.mr}। आपल्याला सल्ला देण्यात येतो की: ${activeClause.whatToVerify.mr}।`;
      followUps.push('या कलमाचा भंग झाल्यास कायदेशीर उपाय काय आहेत?', 'दुय्यम निबंधक कार्यालयात काय पडताळावे?');
    } else {
      responseContent = `Regarding Clause ${activeClause.clauseNumber} ("${activeClause.title}"): ${activeClause.simpleMeaning.en} Why it matters: ${activeClause.whyItMatters.en} Recommended action: ${activeClause.whatToVerify.en}`;
      followUps.push('Does this clause impose any financial liability?', 'How do I request an amendment to this clause?');
    }
  } else {
    // General document query
    const lower = query.toLowerCase();
    if (lower.includes('penalty') || lower.includes('interest') || lower.includes('fine') || lower.includes('जुर्माना') || lower.includes('दंड')) {
      if (lang === 'hi') {
        responseContent = `अनुबंध के विश्लेषण के अनुसार, कब्जा सौंपने में 90 दिनों की छूट अवधि दी गई है जिसमें विक्रेता पर कोई जुर्माना नहीं लगेगा। खरीदार के लिए विलंब भुगतान पर मानक बैंक दर से ब्याज की शर्त हो सकती है।`;
        followUps.push('क्या मैं विक्रेता से विलंब मुआवजा मांग सकता हूँ?', 'बकाया राशि पर ब्याज दर क्या है?');
      } else if (lang === 'mr') {
        responseContent = `कराराच्या विश्लेषणानुसार, ताबा देण्यामध्ये ९० दिवसांची सवलत दिली आहे ज्यासाठी कोणताही दंड आकारला जाणार नाही. खरेदीदाराने देयक वेळेत न दिल्यास व्याज आकारणीची तरतूद असू शकते.`;
        followUps.push('मी विलंबाची नुकसानभरपाई कशी मागू शकतो?', 'थकीत रकमेवर किती व्याज आहे?');
      } else {
        responseContent = `Based on the contract terms, the seller holds a 90-day grace period for possession without penalties. Ensure you negotiate reciprocal penalty clauses for delayed possession before signing.`;
        followUps.push('What is the recommended delay penalty rate?', 'Where is the grace period mentioned in the deed?');
      }
    } else if (lower.includes('verify') || lower.includes('check') || lower.includes('document') || lower.includes('सत्यापन') || lower.includes('पडताळणी')) {
      if (lang === 'hi') {
        responseContent = `हस्ताक्षर करने से पहले 3 मुख्य चीजें अवश्य जांचें: 1) 30 साल की सर्च रिपोर्ट और भार प्रमाण पत्र (EC), 2) नगर निगम की अद्यतन संपत्ति कर शून्य बकाया रसीद, 3) हाउसिंग सोसायटी का अनापत्ति प्रमाण पत्र (NOC)।`;
        followUps.push('भार प्रमाण पत्र (EC) कहाँ से मिलता है?', 'सोसायटी एनओसी में क्या लिखा होना चाहिए?');
      } else if (lang === 'mr') {
        responseContent = `स्वाक्षरीपूर्वी ३ महत्त्वाच्या बाबी तपासा: १) ३० वर्षांचा शोध अहवाल आणि बोजा दाखला (Index II), २) महापालिकेची शून्य थकबाकी कर पावती, ३) गृहनिर्माण संस्थेचे ना-हरकत प्रमाणपत्र (NOC).`;
        followUps.push('बोजा दाखला कसा मिळवायचा?', 'सोसायटी एनओसीसाठी काय आवश्यक आहे?');
      } else {
        responseContent = `Critical pre-signing checklist: 1) 30-year Search Report & Encumbrance Certificate (Index II), 2) Latest Municipal Property Tax "Zero Dues" receipt, 3) Original Housing Society Transfer NOC.`;
        followUps.push('Where can I download the Index II extract?', 'What happens if society NOC is delayed?');
      }
    } else {
      if (lang === 'hi') {
        responseContent = `लीगल लिंगो ने आपके अनुबंध का विश्लेषण किया है। आप किसी भी विशिष्ट शर्त, पक्षकारों के दायित्वों, भुगतान अनुसूची, या सरकारी लाभों के बारे में पूछ सकते हैं।`;
        followUps.push('मुख्य कानूनी जोखिम क्या हैं?', 'कब्जे की निर्धारित तिथि क्या है?');
      } else if (lang === 'mr') {
        responseContent = `लीगल लिंगोने आपल्या कराराचे संपूर्ण विश्लेषण केले आहे. आपण कोणत्याही विशिष्ट अटी, देयके किंवा शासकीय योजनांबद्दल थेट विचारू शकता.`;
        followUps.push('मुख्य कायदेशीर जोखीम काय आहेत?', 'ताबा मिळण्याची शेवटची तारीख कोणती आहे?');
      } else {
        responseContent = `LegalLingo has analyzed this legal document. You can ask about specific clauses, party obligations, payment milestones, possession timelines, or eligible government welfare subsidies.`;
        followUps.push('What are the top attention items?', 'Explain the payment milestones');
      }
    }
  }

  const aiMessage: AIMessage = {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    content: responseContent,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    language: lang,
    clauseReference: activeClause ? {
      clauseId: activeClause.id,
      clauseNumber: activeClause.clauseNumber,
      title: activeClause.title,
    } : undefined,
    suggestedFollowUps: followUps,
  };

  return aiMessage;
}
