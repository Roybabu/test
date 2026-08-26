/* ============================================================================
   CLAIM.WIRE — INSURER DATA
   ============================================================================

   The insurer list comes from data/data-insurers.js (the same master list
   Garage Finder uses) — only entries with a claimwireId are ones this desk
   has a claims playbook for, so COMPANIES is derived from insurerData
   rather than kept as a second, separately-typed list. This file must load
   after data-insurers.js and before claimwire.js.

   The per-insurer claims playbooks below (contacts, portal links, SLAs,
   surveyor/directory rows) are unaffected by that — SEED_PLAYBOOKS is still
   keyed by the same ids as before (now sourced from claimwireId instead of
   being slugified from a name that lived only in this file).

   TO ADD OR EDIT AN INSURER: add (or edit) its claimwireId in
   data/data-insurers.js, then add a matching entry to SEED_PLAYBOOKS below
   keyed by that same id.
   ============================================================================ */

const COMPANIES = (typeof insurerData !== "undefined" ? insurerData : [])
  .filter(r => r && r.claimwireId)
  .map(r => ({ id: r.claimwireId, name: r.name }));

// The Sukoon assessment/approval timeline doubles as the default shown
// for any insurer that hasn't had its own timeline entered yet.
const DEFAULT_REPAIR_TIMELINE = "Inspection & quote submission : 1-3 working days (can take longer if damage is major)\nSurvey : within 1-3 working days from quote submission\nRepair approval : within 3-5 working days (minor) to 10-15 working days (major) from survey\nRepair duration : to be announced post approval\nCar release approval : 1-2 working days upon submission of proforma invoice by agency to insurance";

// Seeded from what you gave us directly — everything else starts blank
// until you fill it in on the Process step (then it's remembered here).
const SEED_PLAYBOOKS = {
  "sukoon-insurance": {
    to: "motorclaims@sukoon.com",
    cc: "ashmy.arackal@insurancemarket.ae",
    regSla: "24 working hours",
    ccb: "The client can opt for a rental car or the Courtesy Cash Benefit (CCB) once the claim is approved — which one depends on what's included in their policy.",
    notes: "",
    ivrNote: "800405 — after connecting, press 2-1-1 on the IVR menu to reach the claims follow-up queue.",
    roadsideNumber: "800 6565",
    repairTimelineRaw: DEFAULT_REPAIR_TIMELINE,
    surveyorsRaw: "0525541683-Sanal\n0509672221-Faraz\n0505391222/0557879646-Anoop\n0544321121-Vinish\n0561755519-Mustafa\n0505228106-Edgardo\n054 594 5519-Krishnaraj (escalation POC)",
    directoryRaw: "All enquiries\tMotor Claims motorclaims@sukoon.com\t800405 (2-1-1)\nCall Center Manager\tLarry Ramirez larry.ramirez@omaninsurance.ae\t800405 (2-1-1)\nRent-a-car approval\tMotor Claims motorclaims@sukoon.com\t800405 (2-1-1)\nCash loss settlement\tAfsal.Basheer@sukoon.com\t800405 (2-1-1)\nTotal loss approval\tMotor Claims motorclaims@sukoon.com\t800405 (2-1-1)\nLOU approval processing\tMotor Claims motorclaims@sukoon.com\t800405 (2-1-1)\nRent-a-car refund\tMotor Claims motorclaims@sukoon.com\t800405 (2-1-1)\nRepair approval\tMotor Claims motorclaims@sukoon.com\t800405 (2-1-1)\nDelay escalation\tKrishnaraj.Balasubramaniam@sukoon.com\t054 594 5519\nSettlement team\tMadiha.Jadoue@sukoon.com\t\nRelationship manager\traunak.dineshbhaivyas@sukoon.com\t55 729 7296"
  },
  "liva-insurance": {
    to: "PartnerClaims.ae@livainsurance.com",
    cc: "ashmy.arackal@insurancemarket.ae",
    regSla: "",
    ccb: "Rental Car — included for 10 days. Call 044020707 to book and mention the claim number. 24 working hours advance booking is required.",
    notes: "",
    ivrNote: "800774 — press 1 then 3 on the IVR menu to reach claims.",
    roadsideNumber: "600544060",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    portalUrl: "https://www.livainsurance.ae/car/eclaim/index",
    portalOwnOnly: true,
    portalNote: "Portal registration is fast, but only works when the client holds comprehensive (own) insurance. For third-party claims, you must register by email instead.",
    directoryRaw: "All enquiries\tPartnerClaims.ae@livainsurance.com\t800774 - 1 - 3\nCall Center Manager\tMohsin.Maqbool@livainsurance.com\t\nRent-a-car approval\tPartnerClaims.ae@livainsurance.com\t800774 - 1 - 3\nTotal loss approval\tPartnerClaims.ae@livainsurance.com\t800774 - 1 - 3\nLOU approval processing\tPartnerClaims.ae@livainsurance.com\tAhmed KP - 0505860541\nRepair approval\tPartnerClaims.ae@livainsurance.com (cc George.Varghese@livainsurance.com)\tGeorge - 050-3507201\nDelay escalation\tPartnerClaims.ae@livainsurance.com (cc George.Varghese@livainsurance.com)\tGeorge - 050-3507201\nClaims head\tPartnerClaims.ae@livainsurance.com (cc Sunita.Pais@livainsurance.com)\tSunita - 50 454 8451\nRelationship manager\tNabeela\t971503413409"
  },
  "gig-gulf-axa": {
    to: "motorclaims.registration@gig-gulf.com",
    cc: "ashmy.arackal@insurancemarket.ae",
    regSla: "",
    ccb: "The client can opt for a rental car if it's included in their policy.",
    notes: "",
    ivrNote: "800 292 — key sequence varies by department (see directory below for the exact digits to press).",
    roadsideNumber: "800292",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    portalUrl: "https://giggulfuae-gi-ext.insuremo.com/login/#/?_k=jgs34o",
    portalOwnOnly: false,
    portalNote: "Online claim registration portal.",
    directoryRaw: "All enquiries\tmotorclaims.registration@gig-gulf.com\thttps://goo.gl/maps/4pRYfSPTBsajNQtD8\nCall Center Manager\tAbdul.Wakil@gig-gulf.com\t\nRent-a-car approval\tmotorclaims.registration@gig-gulf.com\t800 292 - 1 - 3 - 4 - 2\nTotal loss approval\tmotorclaims.ml@gig-gulf.com\t800 292 - 1 - 3 - 4 - 3 (Mon-Fri till 5pm only)\nRefund\tmotorclaims.registration@gig-gulf.com (office: https://goo.gl/maps/4pRYfSPTBsajNQtD8)\t800292 - 1 - 3 - 4 - 3\nRepair approval\tmotorclaims.ml@gig-gulf.com\t800292 - 1 - 3 - 4 - 3\nLPO / final LPO escalation\t1st level: bimal.nair@gig-gulf.com; 2nd level: anil.vincent@gig-gulf.com\tBimal (+971 56 508 1082); Anil (+971 50 249 1227)\nRegistration / AAA delay escalation\t1st level: Abdul.Wakil@gig-gulf.com\t\nRelationship manager\tFinal level escalation: Suhail.Ismail@gig-gulf.com\t056 177 1200"
  },
  "qatar-insurance-company": {
    to: "support@qatarinsurancegroup.zohodesk.ae, motorclaims@qicuae.com",
    cc: "ashmy.arackal@insurancemarket.ae",
    regSla: "",
    ccb: "Client can avail a rental car once the repair estimation has been shared with the insurance company.",
    notes: "",
    ivrNote: "8004742 — press 1-1-1 on the IVR menu for all enquiries.",
    roadsideNumber: "600508181",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    portalUrl: "https://www.i-insured.com/UAE/insurance-claims",
    portalOwnOnly: false,
    portalNote: "Website is fast — email registration takes 24 working hours instead. Both comprehensive and third-party claims can be registered through the website.",
    directoryRaw: "All enquiries\tmotorclaims@qicuae.com : https://www.i-insured.com/UAE/insurance-claims\t8004742 1-1-1\nFor hire approval\tmotorclaims@qicuae.com\t8004742 1-1-1\nTotal loss\tmahmoud.kalil@qicuae.com\t04 7024 938/0565030760\nRefund / LOU refund\tmotorclaims@qicuae.com\t8004742\nTotal loss cheque\tmotorclaims@qicuae.com; Escalation point: ayuob@qicuae.com (retail); Mahmoud@qicuae.com (commercial)\t8004742\nDelay repair / LPO super escalation\tmotorclaims@qicuae.com; Escalation point: Basheer.ahamed@qicuae.com\t8004742; BASHEER Direct: +971 4 7024 902 | M: +971 566868020\nCall center manager\twalaa.alsahin@qicgroup.com.qa\t\nComplaints with repair work\tkalidas.ponnusamy@qicuae.com\t47024991/ 564016572\nRelationship manager\tRajesh Nair rajesh.nair@qicuae.com\t056 5035 883"
  },
  "tokio-marine": {
    to: "claim@tmnf.ae, shahbaz@tmnf.ae",
    cc: "ashmy.arackal@insurancemarket.ae",
    regSla: "24 working hours",
    ccb: "Two rental car options:\n\nOption A: a free rental car for up to 10/20 repair days. A refundable deposit of approx. AED 1500 is held on the hire company's credit card; 2 working days advance booking is mandatory.\n\nOption B: a refund of up to AED 100/day excl. VAT for up to 10/20 repair days. You may choose any rental company, but VAT, insurance, fuel, parking, fines, CDW, tracker and delivery fees are not refundable. Refund requires: the repair completion job card, the rental agreement & invoice, Emirates ID, and a tax invoice showing both the vendor's and Tokio Marine's TRN (Tokio Marine TRN: 100289623900003).",
    notes: "",
    regNote: "",
    registerNote: "You don't have to wait for claim registration to share the workshop list with the client — they can pick a workshop from the list and go straight for inspection.",
    ivrNote: "",
    roadsideNumber: "600503030",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    directoryRaw: "All enquiries\tclaim@tmnf.ae; ghulam@tmnf.ae\t600503030 -1-1-0\nRent-a-car approval\tshahbaz@tmnf.ae\t565041551\nTotal loss approval\tshahbaz@tmnf.ae\t565041551\nAdditional contact\tsujatha@tmnf.ae\t600503030\nAdditional contact\tKAMRAN@tmnf.ae\t600503030\nEscalation\ttiju@tmnf.ae\t600503030\nRelationship manager\tTIJU JOSEPH - tiju@tmnf.ae\t551239290"
  },
  "noor-takaful-watania": {
    to: "motorclaims@watania.ae",
    cc: "zahoor.ahmed@watania.ae, rimaaz.ahmed@watania.ae, ashmy.arackal@insurancemarket.ae",
    regSla: "",
    ccb: "Customer can avail a rental car as per their policy.",
    notes: "",
    ivrNote: "",
    roadsideNumber: "600 575 751",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    directoryRaw: "All enquiries\tmotorclaims@watania.ae\t8009282642\nCall center manager\tmotorclaims@watania.ae\t8009282642\nRent-a-car approval\tmotorclaims@watania.ae\t8009282642\nTotal loss approval\tmotorclaims@watania.ae\t8009282642\nLOU approval processing\tmotorclaims@watania.ae\t8009282642\nRent-a-car refund\tmotorclaims@watania.ae\t8009282642\nRepair approval\tmotorclaims@watania.ae\t8009282642\nDelay escalation — Head of Claims\tRaghu Varma\t\nRelationship manager\tCharles Pink\t"
  },
  "oriental-insurance": {
    to: "motorclaims@oicgulf.ae",
    cc: "gagan@oicgulf.ae, ashmy.arackal@insurancemarket.ae",
    regSla: "",
    ccb: "Customer can call 600575751 to avail a rental car.",
    notes: "",
    ivrNote: "",
    roadsideNumber: "600575751",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    portalUrl: "https://oicgulf.net/claims/",
    portalOwnOnly: false,
    portalNote: "Portal registration is recommended — the email option is slow.",
    directoryRaw: "All enquiries\tgagan@oicgulf.ae\t04 353 8688 | Extn: 163 OR 159\nCall center manager\tTO: motorclaims@oicgulf.ae; CC: gagan@oicgulf.ae\t04 353 8688 | Extn: 163\nRent-a-car approval\tTO: motorclaims@oicgulf.ae; CC: gagan@oicgulf.ae\t04 353 8688 | Extn: 163\nTotal loss approval\tTO: motorclaims@oicgulf.ae; CC: gagan@oicgulf.ae\t04 353 8688 | Extn: 163\nLOU approval processing\tTO: motorclaims@oicgulf.ae; CC: gagan@oicgulf.ae\t04 353 8688 | Extn: 163\nRent-a-car refund\tTO: motorclaims@oicgulf.ae; CC: gagan@oicgulf.ae\t04 353 8688 | Extn: 163\nRepair approval\tTO: motorclaims@oicgulf.ae; CC: gagan@oicgulf.ae\t04 353 8688 | Extn: 163\nDelay escalation — Head of Claims\tkishore@oicgulf.ae\t567248875 Kishore\nRelationship manager\tkishore@oicgulf.ae\t56 724 8875 Kishore"
  },
  "dni": {
    to: "angelie.s@dni.ae, nassima.e@dni.ae",
    cc: "mustafa.m@dni.ae, serafino.r@dni.ae, ashmy.arackal@insurancemarket.ae",
    regSla: "24-48 working hours",
    ccb: "Client can avail a rental car for 7 days as per the policy — send an email to RAC@dni.ae, copying Ashmy Arackal and mustafa.m@dni.ae.",
    notes: "",
    ivrNote: "",
    roadsideNumber: "600575751",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    portalUrl: "https://www.dni.ae/personal-insurance/motor/submit-motor-claim/",
    portalOwnOnly: false,
    portalNote: "Portal registration is recommended — either way it takes 24-48 working hours.",
    directoryRaw: "Call center\tTO: motorclaims@dnirc.com; cc: Serafino Silveira serafino.s@dni.ae; Ammar Chawki ammar@dnirc.com; Madiha Jadoue madiha@dnirc.com; Mujipur Natharbava mujipur@dnirc.com; Muhammad Atif m.atif@dni.ae; Poorna Shetty poorna.s@dni.ae\tWhatsApp: 600-580-000; T: +971-4-5969524\nCall center manager\tSerafino Ricardo serafino.r@dni.ae\t0566806425\nRent-a-car approval\trac@dni.ae; Muammer.y@dni.ae; mustafa.m@dni.ae\t04-5969513 (Mustafa - 0565334662)\nTotal loss approval\tMujipur.r@dni.ae; Mujeeb.r@dni.ae\t\nLOU approval processing\tirshad.a@dni.ae; ilyaz.h@dni.ae; mustafa.m@dni.ae\t04-5969513\nRent-a-car refund\tcl@dni.ae; Muammer.y@dni.ae; mustafa.m@dni.ae\t04-5969513\nRepair approval\tkishor@dnirc.com; m.atif@dni.ae; Motor-Surveyor-Group@dni.ae\tKishore - 04-5969536 (asst. manager); Mujeeb - 04-5969532 (senior supervisor)\nDelay escalation\tserafino.r@dni.ae / haitham.i@dni.ae\tM: +971-56-6806425; T: +971-4-5969530\nRelationship manager\tUJJWAL\t"
  },
  "salama-insurance": {
    to: "customer.support@salama.ae, motorclaims@salama.ae",
    cc: "amita.jacob@salama.ae, hibba.abbas@salama.ae, saeed.shannir@salama.ae, ashmy.arackal@insurancemarket.ae",
    regSla: "24-48 working hours",
    ccb: "Client can avail a rental car as per their policy.",
    notes: "",
    ivrNote: "",
    roadsideNumber: "800725262",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    directoryRaw: "All enquiries\tclaimsbranch@salama.ae / motorclaims@salama.ae\t043577000\nLPO\tmary.cabalo@salama.ae; mudassar.latif@salama.ae\t\nRent-a-car approval\tYomna Shouman Yomna.Shouman@salama.ae\t971 4 5203342\nTotal loss approval\tYomna Shouman Yomna.Shouman@salama.ae\t971 4 5203342\nLOU approval processing\tYomna Shouman Yomna.Shouman@salama.ae\t971 4 5203342\nRent-a-car refund\tYomna Shouman Yomna.Shouman@salama.ae\t971 4 5203342\nRepair approval\tYomna Shouman Yomna.Shouman@salama.ae / Ronnie Verceles Ugay ronnie.ugay@salama.ae\t971 4 5203342; T: +971 4 5203328; M: +971 56 8693255\nDelay escalation\tYomna Shouman Yomna.Shouman@salama.ae / Ronnie Verceles Ugay ronnie.ugay@salama.ae\t\nRelationship manager\tAMITA JACOB amita.jacob@salama.ae\t056 501 0343\nHead of operation\tFadi ElHoayek — Head of Operations Fadi.elhoayek@salama.ae\t0509092966"
  },
  "al-sagar-insurance": {
    to: "docs@alsagrins.ae, motorclaimsdxb@alsagrins.ae, haitham.alshaikh@alsagrins.ae",
    cc: "mohamed.maher@alsagrins.ae, rana.alsaadi@alsagrins.ae, akram.alkhatib@alsagrins.ae, ashmy.arackal@insurancemarket.ae",
    regSla: "24-48 working hours",
    ccb: "As per the policy, the client is eligible for a rental car.",
    notes: "",
    regNote: "This insurer is slow to process — you'll need to actively follow up on registrations.",
    ivrNote: "",
    roadsideNumber: "8007541",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    directoryRaw: "All enquiries\tMotorclaimsdxb@alsagrins.ae / docs@alsagrins.ae\t9714-7028500\nCall center manager\tRana Al Saadi — Manager, Customer Relations Rana.Alsaadi@alsagrins.ae\t+971 (04) 7028 500\nRent-a-car approval\tHaitham AlShaikh — Assistant Manager, Motor Claims Haitham.AlShaikh@alsagrins.ae\t9714-7028558; +971 50 651 8060\nLOU approval processing\tNahel Ahmed — Supervisor, Motor Claims Nahel.Ahmed@alsagrins.ae\t+9714-7028500\nRent-a-car refund\tNahel Ahmed — Supervisor, Motor Claims Nahel.Ahmed@alsagrins.ae\t+9714-7028500\nRepair approval\tHaitham AlShaikh — Assistant Manager, Motor Claims Haitham.AlShaikh@alsagrins.ae\t9714-7028558; +971 50 651 8060\nDelay escalation\tRana Al Saadi — Manager, Customer Relations Rana.Alsaadi@alsagrins.ae\t+971 (04) 7028 500\nRelationship manager\tBRM-Safaa.Ashiq@alsagrins.ae; Rana Al Saadi — Manager, Customer Relations Rana.Alsaadi@alsagrins.ae\t+971 (04) 7028 500"
  },
  "fidelity-insurance": {
    to: "claims@fidelityunited.ae, recoveryclaims@fidelityunited.ae, evelyn.hualda@fidelityunited.ae",
    cc: "ashmy.arackal@insurancemarket.ae",
    regSla: "24 working hours",
    ccb: "As per the policy, the client is eligible for a rental car.",
    notes: "",
    ivrNote: "",
    roadsideNumber: "800-4101",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    directoryRaw: "Registration & follow up\tClaims@fidelityunited.ae; RecoveryClaims@fidelityunited.ae; evelyn.hualda@fidelityunited.ae\t06 5013916 / NASREEN 800842, 06 568 2277 Ext:916 (Nasreen 553027069); SYED 0543059254 (Manager); elsayed.agag@fidelityunited.ae\nAll enquiries\tclaims@fidelityunited.ae\t\nFollow up & approval pending cases\tjamin.ghani@fidelityunited.ae; ibrahim.mahmood@fidelityunited.ae\t0524053054 — Jamin, Sr. Claims Handler\nRAC\tyomna.shouman@fidelityunited.ae\tYomna\nEscalation\telsayed.agag@fidelityunited.ae\tSayed, Claims Manager — 0543059254\nAppointed surveyor\t\t0506848103 — Royson, Surveyor appointed CLA by Fidelity United\nSuper escalation\t\t"
  },
  "adnic": {
    to: "motorclaims@adnic.ae, dxbmotorrepair@adnic.ae",
    cc: "j.alblooshi@adnic.ae, j.hasan@adnic.ae, b.alzaabi@adnic.ae, s.almrzouky@adnic.ae, ashmy.arackal@insurancemarket.ae",
    regSla: "",
    ccb: "Rental car is always handled by reimbursement or LOU.",
    notes: "",
    ivrNote: "",
    roadsideNumber: "800 8040",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    portalUrl: "https://adnic.ae/personal-claim-motor",
    portalOwnOnly: false,
    portalNote: "Portal registration is recommended.",
    directoryRaw: ""
  },
  "methaq": {
    to: "info@methaq.ae, mtrclmsdxb@methaq.ae",
    cc: "ashmy.arackal@insurancemarket.ae",
    regSla: "",
    ccb: "",
    notes: "Rental car process — to be added once confirmed.",
    ivrNote: "",
    roadsideNumber: "600 565 695",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    portalUrl: "https://claim.methaq.ae/claim",
    portalOwnOnly: false,
    portalNote: "Portal registration is recommended.",
    directoryRaw: "LPO\tMohd TAYYAB m.tayyab@methaq.ae; Ahmed Saber ahmed.s@methaq.ae\t0552965551\nFollow up\tinfo@methaq.ae / mtrclmsdxb@methaq.ae\t+971 4 2601 665"
  },
  "afnic": {
    to: "callcenter@fujinsco.ae, dubclaims@fujinsco.ae",
    cc: "ashmy.arackal@insurancemarket.ae",
    regSla: "",
    ccb: "Rental car is only via LOU.",
    notes: "",
    regNote: "Client must drop the vehicle at the claims yard for survey — bring copies of the police report, registration card (mulkiya), Emirates ID, and driving license. Once registered, the car is surveyed and then sent for repair.\n\nOpen Mon–Thu 8:00am–4:00pm (survey hours 9:00am–2:00pm) and Fri 8:00am–2:00pm (survey hours 9:00am–12:00pm).\n\nClaims yard: Damascus Street, 12 4th St, Industrial Area 2, Al Qusais (behind Dubai Residential Oasis) — Tel: 04 286 9210. Map: https://maps.google.com/?q=25.281466,55.389591",
    ivrNote: "",
    roadsideNumber: "80023642",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    directoryRaw: "Registration & follow up\t\tTel: 042869210 — WhatsApp 0502111479"
  },
  "iran-insurance-company": {
    to: "info@bimehir.ae, heysam@bimehir.ae",
    cc: "safieh@bimehir.ae, ashmy.arackal@insurancemarket.ae",
    regSla: "",
    ccb: "Rental car is only via LOU.",
    notes: "",
    regNote: "Client must visit the dedicated location in person for claim registration. Location: https://g.page/IranInsuranceDubai?share",
    ivrNote: "",
    roadsideNumber: "+971 50 2119895",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    directoryRaw: "Claim followup\theysam@bimehir.ae\tTel: 04-2225181, Ext. 410"
  },
  "dubai-insurance-company": {
    to: "customerservice@dubins.ae",
    cc: "abbas.w@dubins.ae, ghani.j@dubins.ae, diconlineclaims@dubins.ae, ashmy.arackal@insurancemarket.ae",
    regSla: "",
    ccb: "Rental car is LOU only (refer).",
    notes: "",
    regNote: "This insurer is slow — active followup is required. Approval contact: kumar.d@dubins.ae.",
    ivrNote: "",
    roadsideNumber: "600 575 751",
    repairTimelineRaw: "",
    surveyorsRaw: "",
    directoryRaw: "Followup\tDICOnlineClaims@dubins.ae\tcall 042693030 Ext. 150"
  }
};
